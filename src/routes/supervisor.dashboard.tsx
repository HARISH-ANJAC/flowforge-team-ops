import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Ban, ClipboardCheck, ListChecks } from "lucide-react";
import { Avatar, Card, Empty, Kpi, PageHeader, Progress, StatusBadge, buttonVariants, fmtDate } from "@/components/kit";
import { isOverdue, jobProgress, supervisorDepts, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/supervisor/dashboard")({
  head: () => seo("Supervisor Dashboard", "Team tasks, blockers, pending reviews and workload for your departments."),
  component: SupDash,
});

function SupDash() {
  const { db, me, actions } = useStore();
  if (!me) return null;
  const scope = supervisorDepts(db, me.id);
  const tasks = db.tasks.filter((t) => scope.includes(t.department));
  const active = tasks.filter((t) => ["Assigned", "In Progress", "Blocked", "Submitted", "Rejected"].includes(t.status));
  const reviews = tasks.filter((t) => t.status === "Submitted");
  const blocked = tasks.filter((t) => t.status === "Blocked");
  const team = db.employees.filter((e) => scope.includes(e.department) && e.role === "Employee");
  const nearing = db.jobs.filter((j) => j.status !== "Completed" && j.status !== "Draft" && j.dueDate <= "2026-10-19" && tasks.some((t) => t.jobId === j.id));

  return (
    <>
      <PageHeader title={`Good morning, ${me.name.split(" ")[0]}`} subtitle={`Supervising ${scope.join(", ")}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<ListChecks />} label="Active team tasks" value={active.length} />
        <Kpi icon={<ClipboardCheck />} label="Pending reviews" value={reviews.length} t="amber" />
        <Kpi icon={<Ban />} label="Blocked" value={blocked.length} t="red" />
        <Kpi icon={<AlertTriangle />} label="Overdue" value={active.filter((t) => isOverdue(t.dueDate, false)).length} t="red" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Review Queue" action={<Link to="/admin/approvals" className="text-[12px] font-bold text-primary">All</Link>}>
          {reviews.length === 0 ? <Empty>No submissions waiting.</Empty> : (
            <ul className="divide-y divide-border">{reviews.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{t.title}</p><p className="text-[12px] text-muted-foreground">{t.jobId} · {db.employees.find((e) => e.id === t.assigneeId)?.name}</p></div>
                <Link to="/supervisor/reviews/$taskId" params={{ taskId: t.id }} className={buttonVariants({ size: "sm" })}>Review</Link>
              </li>))}</ul>
          )}
        </Card>
        <Card title="Blocked Work">
          {blocked.length === 0 ? <Empty>Nothing blocked.</Empty> : (
            <ul className="divide-y divide-border">{blocked.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{t.title}</p><p className="text-[12px] text-destructive">{t.blocker}</p></div>
                <button onClick={() => actions.resolveBlocker(t.id)} className={buttonVariants({ size: "sm", variant: "outline" })}>Resolve</button>
              </li>))}</ul>
          )}
        </Card>
        <Card title="Team Workload">
          <ul className="divide-y divide-border">{team.map((e) => {
            const n = active.filter((t) => t.assigneeId === e.id).length;
            return <li key={e.id} className="flex items-center gap-3 px-4 py-2.5"><Avatar size="sm" name={e.name} /><span className="w-32 text-[13px] font-semibold">{e.name}</span><Progress value={Math.min(100, n * 25)} className="flex-1" /><span className="text-[12px] text-muted-foreground">{n} tasks</span></li>;
          })}</ul>
        </Card>
        <Card title="Jobs Nearing Deadline">
          {nearing.length === 0 ? <Empty>None in the next 3 days.</Empty> : (
            <ul className="divide-y divide-border">{nearing.map((j) => (
              <li key={j.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                <Link to="/admin/jobs/$jobId" params={{ jobId: j.id }} className="font-mono text-[12px] text-primary">{j.id}</Link>
                <span className="flex-1 truncate">{j.name}</span><span className={isOverdue(j.dueDate, false) ? "font-bold text-destructive" : "text-muted-foreground"}>{fmtDate(j.dueDate)}</span>
                <span className="w-24"><Progress value={jobProgress(db, j)} /></span><StatusBadge status={j.status} />
              </li>))}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
