import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/log")({
  component: () => <Navigate to="/" />,
});
