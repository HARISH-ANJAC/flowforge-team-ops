import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";

export const Route = createFileRoute("/employee")({
  component: () => <AppShell allow={["Employee"]}><Outlet /></AppShell>,
});
