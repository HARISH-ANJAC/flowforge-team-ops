import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Production Workflow Demo", "ProManage: job cards, workflows, production tracking and employee tasks for printing and manufacturing units."),
  component: Splash,
});

function Splash() {
  const { ready, role } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      navigate({ to: role === "Admin" ? "/admin/dashboard" : role === "Supervisor" ? "/supervisor/dashboard" : role === "Employee" ? "/employee/tasks" : "/login" });
    }, 1200);
    return () => clearTimeout(t);
  }, [ready, role, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-accent">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><Factory className="size-8" /></span>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">ProManage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Job cards · Workflows · Production tracking</p>
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-card">
        <div className="animate-splash h-full w-1/3 rounded-full bg-primary" />
      </div>
    </div>
  );
}
