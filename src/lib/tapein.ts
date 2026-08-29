import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { weekEndSunday, weekStartMonday } from "@/lib/week";

export type VisitStatus = "pending" | "approved";
export type Vote = "yes" | "no";

export type VisitCard = {
  id: number;
  userId: string;
  displayName: string;
  note: string | null;
  photoData: string | null;
  status: VisitStatus;
  createdAt: string;
  yesCount: number;
  noCount: number;
  myVote: Vote | null;
  isMine: boolean;
};

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  approvedCount: number;
  pendingCount: number;
};

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value ?? "");
}

function asNum(value: unknown): number {
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function weekBounds() {
  const weekStart = weekStartMonday();
  return { weekStart, weekEnd: weekEndSunday(weekStart) };
}

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      displayName: z.string().trim().min(1).max(60),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into profiles (user_id, display_name)
      values (${context.userId}, ${data.displayName})
      on conflict (user_id) do update
        set display_name = case
          when profiles.display_name in ('Athlete', '') then excluded.display_name
          else profiles.display_name
        end,
        updated_at = now()
    `;
    return { ok: true as const };
  });

export const checkIn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      note: z.string().max(280).optional(),
      photoData: z.string().max(500_000).nullable().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const note = data.note?.trim() || null;
    const photoData = data.photoData ?? null;
    if (
      photoData &&
      !/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(photoData)
    ) {
      throw new Error("That photo format is not supported.");
    }
    const sql = await getSql();
    const { weekStart } = weekBounds();
    const [row] = await sql<{ id: number }>`
      insert into visits (user_id, note, photo_data, status, week_start)
      values (
        ${context.userId},
        ${note},
        ${photoData},
        'pending',
        ${weekStart}
      )
      returning id
    `;
    return { id: asNum(row?.id) };
  });

type VisitQueryRow = {
  id: number;
  user_id: string;
  display_name: string;
  note: string | null;
  photo_data: string | null;
  status: VisitStatus;
  created_at: unknown;
  yes_count: number;
  no_count: number;
  my_vote: Vote | null;
};

export const listVisits = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<VisitCard[]> => {
    const sql = await getSql();
    const { weekStart } = weekBounds();
    const rows = await sql<VisitQueryRow>`
      select
        v.id,
        v.user_id,
        coalesce(p.display_name, 'Athlete') as display_name,
        v.note,
        v.photo_data,
        v.status,
        v.created_at,
        (select count(*)::int from attestations a where a.visit_id = v.id and a.vote = 'yes') as yes_count,
        (select count(*)::int from attestations a where a.visit_id = v.id and a.vote = 'no') as no_count,
        (select a.vote from attestations a where a.visit_id = v.id and a.voter_id = ${context.userId} limit 1) as my_vote
      from visits v
      left join profiles p on p.user_id = v.user_id
      where v.week_start = ${weekStart}
      order by v.created_at desc
      limit 40
    `;
    return rows.map((row) => ({
      id: asNum(row.id),
      userId: row.user_id,
      displayName: row.display_name,
      note: row.note,
      photoData: row.photo_data,
      status: row.status,
      createdAt: asIso(row.created_at),
      yesCount: asNum(row.yes_count),
      noCount: asNum(row.no_count),
      myVote: row.my_vote,
      isMine: row.user_id === context.userId,
    }));
  });

export const voteOnVisit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      visitId: z.number().int().positive(),
      vote: z.enum(["yes", "no"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const [visit] = await sql<{ id: number; user_id: string; status: string }>`
      select id, user_id, status from visits where id = ${data.visitId}
    `;
    if (!visit) throw new Error("Visit not found.");
    if (visit.user_id === context.userId) {
      throw new Error("You can't confirm your own visit.");
    }

    const inserted = await sql<{ id: number }>`
      insert into attestations (visit_id, voter_id, vote)
      values (${data.visitId}, ${context.userId}, ${data.vote})
      on conflict (visit_id, voter_id) do nothing
      returning id
    `;
    if (inserted.length === 0) {
      throw new Error("You already confirmed this visit.");
    }

    const [counts] = await sql<{ yes_count: number }>`
      select count(*) filter (where vote = 'yes')::int as yes_count
      from attestations
      where visit_id = ${data.visitId}
    `;
    const yesCount = asNum(counts?.yes_count);
    let status = visit.status;
    if (yesCount >= 2 && status !== "approved") {
      await sql`update visits set status = 'approved' where id = ${data.visitId}`;
      status = "approved";
    }
    return { status, yesCount };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const { weekStart, weekEnd } = weekBounds();
    const rows = await sql<{
      user_id: string;
      display_name: string;
      approved_count: number;
      pending_count: number;
    }>`
      select
        p.user_id,
        p.display_name,
        coalesce(v.approved_count, 0)::int as approved_count,
        coalesce(v.pending_count, 0)::int as pending_count
      from profiles p
      left join (
        select
          user_id,
          count(*) filter (where status = 'approved') as approved_count,
          count(*) filter (where status = 'pending') as pending_count
        from visits
        where week_start = ${weekStart}
        group by user_id
      ) v on v.user_id = p.user_id
      order by approved_count desc, pending_count desc, p.display_name asc
    `;
    const board: LeaderboardRow[] = rows.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      approvedCount: asNum(row.approved_count),
      pendingCount: asNum(row.pending_count),
    }));
    return {
      weekStart,
      weekEnd,
      currentUserId: context.userId,
      rows: board,
    };
  });
