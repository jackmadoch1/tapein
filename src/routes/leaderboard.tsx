import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/leaderboard")({
  component: () => <Navigate to="/" />,
});
