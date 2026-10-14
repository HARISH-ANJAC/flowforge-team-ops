import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Ban, CheckCheck, ClipboardList, Clock, Factory, Plus, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Kpi, PageHeader, PriorityBadge, Progress, StatusBadge, Table, buttonVariants, fmtDate, td } from "@/components/kit";
import { isOverdue, jobProgress, jobStage, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => seo("Production Dashboard", "Monitor jobs, workforce and production progress across departments."),
  component: Dashboard,
});

export const STATUS_COLORS: Record<string, string> = {
  Draft: "var(--muted-foreground)", Ready: "var(--info)", "In Progress": "var(--primary)", "On Hold": "var(--warning)",
  Blocked: "var(--destructive)", "Quality Check": "var(--chart-3)", "Pending Approval": "var(--chart-4)", Completed: "var(--chart-2)",
};

const weekly = [
  { d: "Oct 10", started: 34, completed: 28 }, { d: "Oct 11", started: 42, completed: 30 }, { d: "Oct 12", started: 22, completed: 25 },
  { d: "Oct 13", started: 38, completed: 33 }, { d: "Oct 14", started: 45, completed: 36 }, { d: "Oct 15", started: 40, completed: 41 }, { d: "Oct 16", started: 31, completed: 26 },
];

function Dashboard() {
  const { db } = useStore();
  const active = db.jobs.filter((j) => !["Completed", "Cancelled", "Draft"].includes(j.status));
  const pending = db.tasks.filter((t) => t.status === "Submitted");
  const blocked = db.tasks.filter((t) => t.status === "Blocked");
  const overdue = active.filter((j) => isOverdue(j.dueDate, false));
  const workers = db.employees.filter((e) => e.role === "Employee" && e.active);
  const busy = new Set(db.tasks.filter((t) => ["In Progress", "Assigned"].includes(t.status)).map((t) => t.assigneeId));
  const byStatus = Object.entries(db.jobs.reduce<Record<string, number>>((a, j) => ({ ...a, [j.status]: (a[j.status] ?? 0) + 1 }), {})).map(([name, value]) => ({ name, value }));

  return (
    <>
      <PageHeader title="Production Dashboard" subtitle="Monitor jobs, workforce and production progress.">
        <Link to="/admin/jobs/new" className={buttonVariants()}><Plus /> Create Job Card</Link>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={<ClipboardList />} label="Active Jobs" value={active.length} hint="Across all workflows" />
        <Kpi icon={<Factory />} label="In Production" value={db.jobs.filter((j) => j.status === "In Progress").length} t="blue" />
        <Kpi icon={<Clock />} label="Pending Approval" value={pending.length} t="amber" />
        <Kpi icon={<AlertTriangle />} label="Overdue Jobs" value={overdue.length} t="red" />
        <Kpi icon={<CheckCheck />} label="Completed Jobs" value={db.jobs.filter((j) => j.status === "Completed").length} />
        <Kpi icon={<Users />} label="Available Employees" value={`${workers.length - busy.size < 0 ? 0 : workers.length - [...busy].filter((b) => workers.some((w) => w.id === b)).length} / ${workers.length}`} t="blue" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Production Overview" className="xl:col-span-1">
          <div className="h-60 p-3">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={28} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="started" name="Tasks started" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="completed" name="Tasks completed" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Jobs by Status">
          <div className="flex items-center gap-2 p-3">
            <div className="relative h-52 w-1/2">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" innerRadius={50} outerRadius={78} paddingAngle={2}>
                    {byStatus.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? "var(--muted)"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-extrabold">{db.jobs.length}</span><span className="text-[11px] text-muted-foreground">Total</span></div>
            </div>
            <ul className="flex-1 space-y-1.5 text-[12px]">
              {byStatus.map((s) => (
                <li key={s.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />{s.name}<span className="ml-auto font-bold">{s.value}</span></li>
              ))}
            </ul>
          </div>
        </Card>
        <Card title="Department Workload">
          <Table head={["Department", "Open", "Overdue", "Utilization"]}>
            {db.departments.map((d) => {
              const open = db.tasks.filter((t) => t.department === d.name && ["Assigned", "In Progress", "Blocked", "Submitted"].includes(t.status));
              const od = open.filter((t) => isOverdue(t.dueDate, false)).length;
              const util = Math.min(100, open.length * 22 + 20);
              return (
                <tr key={d.id}>
                  <td className={td}>{d.name}</td><td className={td}>{open.length}</td>
                  <td className={td}>{od > 0 ? <span className="font-bold text-destructive">{od}</span> : 0}</td>
                  <td className={`${td} w-32`}><Progress value={util} /></td>
                </tr>
              );
            })}
          </Table>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Recent Job Cards" className="xl:col-span-2" action={<Link to="/admin/jobs" className="text-[12px] font-bold text-primary">View all</Link>}>
          <Table head={["Job ID", "Job / Product", "Customer", "Stage", "Progress", "Due", "Priority", "Status"]}>
            {db.jobs.slice(0, 6).map((j) => (
              <tr key={j.id} className="hover:bg-muted/50">
                <td className={td}><Link to="/admin/jobs/$jobId" params={{ jobId: j.id }} className="font-mono text-[12px] font-medium text-primary hover:underline">{j.id}</Link></td>
                <td className={td}>{j.name}</td><td className={`${td} text-muted-foreground`}>{j.customer}</td>
                <td className={td}>{jobStage(db, j)}</td><td className={`${td} w-32`}><Progress value={jobProgress(db, j)} /></td>
                <td className={td}>{fmtDate(j.dueDate)}</td><td className={td}><PriorityBadge p={j.priority} /></td><td className={td}><StatusBadge status={j.status} /></td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Attention Required">
          <ul className="divide-y divide-border text-[13px]">
            {[
              { icon: <AlertTriangle className="size-4 text-destructive" />, label: "Overdue jobs", n: overdue.length, to: "/admin/jobs" },
              { icon: <Ban className="size-4 text-destructive" />, label: "Blocked tasks", n: blocked.length, to: "/admin/tasks" },
              { icon: <Clock className="size-4 text-warning" />, label: "Pending approvals", n: pending.length, to: "/admin/approvals" },
            ].map((r) => (
              <li key={r.label}><Link to={r.to} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">{r.icon}<span className="flex-1">{r.label}</span><span className="rounded-full bg-muted px-2 text-[12px] font-bold">{r.n}</span><span className="text-[12px] font-bold text-primary">View</span></Link></li>
            ))}
            {blocked.slice(0, 3).map((t) => (
              <li key={t.id} className="px-4 py-3">
                <p className="font-mono text-[11px] text-muted-foreground">{t.jobId} · {t.stage}</p>
                <p className="text-[12px] text-destructive">{t.blocker}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
