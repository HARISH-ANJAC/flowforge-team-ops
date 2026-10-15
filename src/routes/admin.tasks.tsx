import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Empty, PageHeader, PriorityBadge, Progress, StatusBadge, Table, fmtDate, td } from "@/components/kit";
import { isOverdue, supervisorDepts, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/tasks")({
  head: () => seo("Tasks & Assignments", "View, assign and reassign production tasks; see blockers."),
  component: Tasks,
});

function Tasks() {
  const { db, actions, role, me } = useStore();
  const [status, setStatus] = useState("Active");
  const [dept, setDept] = useState("All");
  const [who, setWho] = useState("All");
  const scope = role === "Supervisor" && me ? supervisorDepts(db, me.id) : null;
  const rows = db.tasks.filter((t) =>
    (!scope || scope.includes(t.department)) &&
    (status === "All" || (status === "Active" ? ["Assigned", "In Progress", "Blocked", "Submitted", "Rejected"].includes(t.status) : t.status === status)) &&
    (dept === "All" || t.department === dept) && (who === "All" || t.assigneeId === who));
  const workers = db.employees.filter((e) => e.role === "Employee" && e.active);

  return (
    <>
      <PageHeader title="Tasks & Assignments" subtitle={scope ? `Your scope: ${scope.join(", ")}` : "All production tasks across departments."} />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <select className="field w-40" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">{["Active", "All", "Assigned", "In Progress", "Blocked", "Submitted", "Rejected", "Approved", "Waiting"].map((s) => <option key={s}>{s}</option>)}</select>
          <select className="field w-44" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department"><option>All</option>{db.departments.map((d) => <option key={d.id}>{d.name}</option>)}</select>
          <select className="field w-44" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Assignee"><option value="All">All assignees</option>{workers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        </div>
        {rows.length === 0 ? <Empty>No tasks match.</Empty> : (
          <Table head={["Task", "Job", "Stage", "Assignee", "Due", "Priority", "Progress", "Status", "Blocker"]}>
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-muted/50">
                <td className={`${td} font-mono text-[12px]`}>{t.id}</td>
                <td className={td}><Link to="/admin/jobs/$jobId" params={{ jobId: t.jobId }} className="font-mono text-[12px] text-primary hover:underline">{t.jobId}</Link></td>
                <td className={`${td} font-semibold`}>{t.stage}</td>
                <td className={td}>
                  <select className="field h-8 w-36" value={t.assigneeId} disabled={t.status === "Approved"} onChange={(e) => actions.reassign(t.id, e.target.value)} aria-label="Assignee">
                    {workers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </td>
                <td className={td}><span className={isOverdue(t.dueDate, t.status === "Approved") ? "font-bold text-destructive" : ""}>{fmtDate(t.dueDate)}</span></td>
                <td className={td}><PriorityBadge p={t.priority} /></td>
                <td className={`${td} w-28`}><Progress value={t.progress} /></td>
                <td className={td}><StatusBadge status={t.status} /></td>
                <td className={td}>{t.blocker ? <button className="text-[12px] font-bold text-destructive hover:underline" onClick={() => actions.resolveBlocker(t.id)} title={t.blocker}>Resolve</button> : "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
