import type { LeaderboardRow } from "@/lib/tapein";
import { cn } from "@/lib/utils";

export function LeaderboardList({
  rows,
  currentUserId,
}: {
  rows: LeaderboardRow[];
  currentUserId: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No one on the board yet.
      </p>
    );
  }

  return (
    <ol>
      {rows.map((row, i) => {
        const isYou = row.userId === currentUserId;
        return (
          <li
            key={row.userId}
            className={cn(
              "flex items-center gap-3 border-b border-border py-3",
              isYou && "bg-secondary px-2",
            )}
          >
            <span className="w-6 font-display text-sm tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <p className="min-w-0 flex-1 truncate font-medium">
              {row.displayName}
              {isYou ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  you
                </span>
              ) : null}
            </p>
            <span className="font-display text-xl tabular-nums leading-none">
              {row.approvedCount}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
