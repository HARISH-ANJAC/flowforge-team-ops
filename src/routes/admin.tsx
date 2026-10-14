import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import type { Role } from "@/lib/data";

const ALLOW: Role[] = ["Admin", "Supervisor"];
export const Route = createFileRoute("/admin")({
  component: () => <AppShell allow={ALLOW}><Outlet /></AppShell>,
});
