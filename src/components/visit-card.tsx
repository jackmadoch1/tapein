import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { voteOnVisit, type VisitCard as VisitCardData } from "@/lib/tapein";
import { formatClock } from "@/lib/week";

export function VisitRow({ visit }: { visit: VisitCardData }) {
  const queryClient = useQueryClient();
  const vote = useMutation({
    mutationFn: (choice: "yes" | "no") =>
      voteOnVisit({ data: { visitId: visit.id, vote: choice } }),
    onSuccess: (result, choice) => {
      void queryClient.invalidateQueries();
      if (result.status === "approved") {
        toast.success("Confirmed. On the board.");
      } else if (choice === "yes") {
        toast.message(`${result.yesCount} of 2`);
      } else {
        toast.message("Noted.");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not confirm.");
    },
  });

  return (
    <li className="space-y-2 border-b border-border py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{visit.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {formatClock(visit.createdAt)}
            {visit.yesCount > 0 ? ` · ${visit.yesCount}/2` : ""}
          </p>
        </div>
        {visit.myVote ? (
          <p className="text-sm text-muted-foreground">
            {visit.myVote === "yes" ? "Yes" : "No"}
          </p>
        ) : (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              disabled={vote.isPending}
              onClick={() => vote.mutate("yes")}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={vote.isPending}
              onClick={() => vote.mutate("no")}
            >
              No
            </Button>
          </div>
        )}
      </div>
      {visit.note ? (
        <p className="text-sm leading-relaxed">{visit.note}</p>
      ) : null}
      {visit.photoData ? (
        <img
          src={visit.photoData}
          alt={`Photo from ${visit.displayName}`}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : null}
    </li>
  );
}
