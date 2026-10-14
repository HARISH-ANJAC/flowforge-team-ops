import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";

const allow = ["Admin", "Supervisor"] as const;
export const Route = createFileRoute("/admin")({
  component: () => <AppShell allow={[...allow]}><Outlet /></AppShell>,
});
