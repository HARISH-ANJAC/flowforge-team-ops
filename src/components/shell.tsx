import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity, BarChart3, Bell, Building2, CheckCircle2, ClipboardList, Factory, FileStack, GitBranch,
  History, LayoutDashboard, ListChecks, LogOut, Menu, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Settings, User, Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { noticesFor, useStore } from "@/lib/store";
import type { Role } from "@/lib/data";
import { Avatar } from "./kit";

type Item = { label: string; to: string; icon: typeof LayoutDashboard };
const NAV: Record<Role, { group: string; items: Item[] }[]> = {
  Admin: [
    { group: "Overview", items: [{ label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard }] },
    { group: "Production", items: [
      { label: "Job Cards", to: "/admin/jobs", icon: FileStack },
      { label: "Workflow Builder", to: "/admin/workflows", icon: GitBranch },
      { label: "Production Board", to: "/admin/production", icon: Factory },
      { label: "Quality & Approvals", to: "/admin/approvals", icon: CheckCircle2 },
    ] },
    { group: "Workforce", items: [
      { label: "Employees", to: "/admin/employees", icon: Users },
      { label: "Departments", to: "/admin/departments", icon: Building2 },
      { label: "Tasks & Assignments", to: "/admin/tasks", icon: ListChecks },
    ] },
    { group: "Insights", items: [
      { label: "Reports & Analytics", to: "/admin/reports", icon: BarChart3 },
      { label: "Activity Logs", to: "/admin/activity", icon: Activity },
    ] },
    { group: "Administration", items: [
      { label: "Notifications", to: "/notifications", icon: Bell },
      { label: "Settings & Permissions", to: "/admin/settings", icon: Settings },
    ] },
  ],
  Supervisor: [
    { group: "Overview", items: [{ label: "Dashboard", to: "/supervisor/dashboard", icon: LayoutDashboard }] },
    { group: "Production", items: [
      { label: "Review Queue", to: "/admin/approvals", icon: CheckCircle2 },
      { label: "Production Board", to: "/admin/production", icon: Factory },
      { label: "Tasks & Assignments", to: "/admin/tasks", icon: ListChecks },
      { label: "Job Cards", to: "/admin/jobs", icon: FileStack },
    ] },
    { group: "Account", items: [
      { label: "Notifications", to: "/notifications", icon: Bell },
      { label: "Profile", to: "/profile", icon: User },
    ] },
  ],
  Employee: [
    { group: "Overview", items: [
      { label: "My Tasks", to: "/employee/tasks", icon: ClipboardList },
      { label: "Job Cards", to: "/employee/jobs", icon: FileStack },
      { label: "Notifications", to: "/notifications", icon: Bell },
      { label: "My History", to: "/employee/history", icon: History },
      { label: "Profile", to: "/profile", icon: User },
    ] },
  ],
};

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 font-extrabold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Factory className="size-4" /></span>
      {!compact && <span className="text-[17px]">ProManage</span>}
    </div>
  );
}

export function AppShell({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const { role, ready, me, db, setRole, resetDemo } = useStore();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!role) navigate({ to: "/login" });
    else if (allow && !allow.includes(role)) navigate({ to: role === "Admin" ? "/admin/dashboard" : role === "Supervisor" ? "/supervisor/dashboard" : "/employee/tasks" });
  }, [ready, role, allow, navigate]);
  useEffect(() => setDrawer(false), [path]);

  if (!ready || !role || !me) {
    return <div className="flex min-h-screen items-center justify-center"><Logo /></div>;
  }
  const unread = noticesFor(db, role, me.id).filter((n) => !n.read).length;
  const active = (to: string) => path === to || (to !== "/" && path.startsWith(to + "/"));

  const nav = (compact: boolean) => (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {NAV[role].map((g) => (
        <div key={g.group}>
          {!compact && <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{g.group}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => (
              <li key={it.to}>
                <Link to={it.to} title={it.label}
                  className={cn("flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground",
                    active(it.to) && "bg-accent font-bold text-accent-foreground", compact && "justify-center")}>
                  <it.icon className="size-4 shrink-0" />
                  {!compact && <span className="truncate">{it.label}</span>}
                  {!compact && it.to === "/notifications" && unread > 0 && <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (compact: boolean) => (
    <div className="space-y-1 border-t border-border p-3">
      <button onClick={resetDemo} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted", compact && "justify-center")} title="Reset demo data">
        <RotateCcw className="size-4" />{!compact && "Reset demo data"}
      </button>
      <button onClick={() => { setRole(null); navigate({ to: "/login" }); }} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted", compact && "justify-center")} title="Log out">
        <LogOut className="size-4" />{!compact && "Log out"}
      </button>
    </div>
  );

  const isEmployee = role === "Employee";

  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] md:flex", collapsed ? "w-[72px]" : "w-[248px]")}>
        <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed && "justify-center px-0")}><Logo compact={collapsed} /></div>
        {nav(collapsed)}
        {footer(collapsed)}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-sidebar shadow-xl">
            <div className="flex h-16 items-center border-b border-border px-4"><Logo /></div>
            {nav(false)}
            {footer(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-3 md:px-6">
          <button className="rounded-md p-2 hover:bg-muted md:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <button className="hidden rounded-md p-2 hover:bg-muted md:block" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
          <form className="relative hidden max-w-sm flex-1 sm:block" onSubmit={(e) => { e.preventDefault(); const j = db.jobs.find((x) => x.id.toLowerCase().includes(q.toLowerCase()) || x.name.toLowerCase().includes(q.toLowerCase())); if (j && q) navigate({ to: isEmployee ? "/employee/jobs" : "/admin/jobs/$jobId", params: { jobId: j.id } as never }); }}>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs by ID or name…" className="field pl-9" aria-label="Search jobs" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground lg:inline">Demo · {role}</span>
            <Link to="/notifications" className="relative rounded-md p-2 hover:bg-muted" aria-label={`Notifications, ${unread} unread`}>
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">{unread}</span>}
            </Link>
            <Link to="/profile" className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted">
              <Avatar name={me.name} />
              <span className="hidden leading-tight sm:block">
                <span className="block text-[13px] font-bold">{me.name}</span>
                <span className="block text-[11px] text-muted-foreground">{role}</span>
              </span>
            </Link>
          </div>
        </header>
        <main className={cn("flex-1 p-3 sm:p-4 lg:p-6", isEmployee && "pb-24 md:pb-6")}>{children}</main>
      </div>

      {isEmployee && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card md:hidden">
          {[NAV.Employee[0].items[0], NAV.Employee[0].items[1], NAV.Employee[0].items[2], NAV.Employee[0].items[4]].map((it) => (
            <Link key={it.to} to={it.to} className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-muted-foreground", active(it.to) && "text-primary")}>
              <it.icon className="size-5" />{it.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
