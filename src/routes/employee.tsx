import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import type { Role } from "@/lib/data";

const ALLOW: Role[] = ["Employee"];
export const Route = createFileRoute("/employee")({
  component: () => <AppShell allow={ALLOW}><Outlet /></AppShell>,
});
