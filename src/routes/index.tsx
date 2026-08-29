import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CheckInForm } from "@/components/check-in-form";
import { Landing } from "@/components/landing";
import { LeaderboardList } from "@/components/leaderboard-list";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitRow } from "@/components/visit-card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getLeaderboard, listVisits } from "@/lib/tapein";
import { formatWeekRange } from "@/lib/week";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

type Tab = "confirm" | "board";

function Home() {
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { user, isPending } = useCurrentUserState();

  if (user) return <Dashboard />;

  if (isPending && sessionUser) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="h-14 bg-primary" />
        <p className="px-4 pt-6 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <Landing />;
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>("confirm");
  const visits = useQuery({ queryKey: ["visits"], queryFn: () => listVisits() });
  const board = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
  });

  const toConfirm = (visits.data ?? []).filter(
    (v) => !v.isMine && v.status === "pending",
  );
  const myPending = (visits.data ?? []).filter(
    (v) => v.isMine && v.status === "pending",
  ).length;

  return (
    <AppShell>
      <div className="grid grid-cols-2 border-b border-border">
        {(
          [
            ["confirm", "Confirm"],
            ["board", "Leaderboard"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-12 text-sm font-medium",
              tab === id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "confirm" ? (
        <div className="pt-5">
          <CheckInForm />
          {myPending > 0 ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {myPending} of yours waiting on 2 confirms
            </p>
          ) : null}

          <h2 className="mt-8 font-display text-lg tracking-wide">
            Did you see them?
          </h2>
          {visits.isPending ? (
            <Skeleton className="mt-3 h-24" />
          ) : toConfirm.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nobody waiting on a confirm.
            </p>
          ) : (
            <ul>
              {toConfirm.map((visit) => (
                <VisitRow key={visit.id} visit={visit} />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="pt-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {board.data ? formatWeekRange(board.data.weekStart) : "This week"}
          </p>
          <h2 className="mt-1 font-display text-lg tracking-wide">
            Approved visits
          </h2>
          {board.isPending ? (
            <Skeleton className="mt-3 h-24" />
          ) : (
            <LeaderboardList
              rows={board.data?.rows ?? []}
              currentUserId={board.data?.currentUserId ?? ""}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
