import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";

export const Route = createFileRoute("/supervisor")({
  component: () => <AppShell allow={["Supervisor"]}><Outlet /></AppShell>,
});
