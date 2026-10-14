import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, Button, Card, Empty, PageHeader, PriorityBadge, Progress, StatusBadge, Table, buttonVariants, fmtDate, td } from "@/components/kit";
import { isOverdue, jobProgress, jobStage, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/jobs/")({
  head: () => seo("Job Cards", "Create, schedule and track production job cards."),
  component: Jobs,
});

const STATUSES = ["All", "Draft", "Ready", "In Progress", "Blocked", "Quality Check", "Pending Approval", "Completed"];

function Jobs() {
  const { db, role } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [sort, setSort] = useState<"due" | "id">("due");

  const rows = useMemo(() => db.jobs
    .filter((j) => (status === "All" || j.status === status) && (priority === "All" || j.priority === priority))
    .filter((j) => `${j.id} ${j.name} ${j.customer}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "due" ? a.dueDate.localeCompare(b.dueDate) : b.id.localeCompare(a.id))), [db.jobs, q, status, priority, sort]);

  const exportCsv = () => {
    const csv = ["Job ID,Name,Customer,Stage,Progress,Due,Priority,Status", ...rows.map((j) => [j.id, j.name, j.customer, jobStage(db, j), jobProgress(db, j), j.dueDate, j.priority, j.status].join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "job-cards.csv"; a.click();
    toast.success("Exported job cards");
  };

  return (
    <>
      <PageHeader title="Job Cards" subtitle="Create, schedule and track production jobs.">
        <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
        {role === "Admin" && <Link to="/admin/jobs/new" className={buttonVariants()}><Plus /> Create Job Card</Link>}
      </PageHeader>
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input className="field pl-9" placeholder="Search by job ID, product or customer" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="field w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <select className="field w-36" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">{["All", "Low", "Normal", "High", "Urgent"].map((s) => <option key={s}>{s}</option>)}</select>
          <select className="field w-40" value={sort} onChange={(e) => setSort(e.target.value as "due")} aria-label="Sort"><option value="due">Sort: Due date</option><option value="id">Sort: Newest</option></select>
          {(q || status !== "All" || priority !== "All") && <Button variant="ghost" onClick={() => { setQ(""); setStatus("All"); setPriority("All"); }}>Clear</Button>}
        </div>
        {rows.length === 0 ? <Empty>No job cards match these filters.</Empty> : (
          <Table head={["Job ID", "Job / Product", "Customer", "Workflow", "Stage", "Progress", "Due date", "Status", "Priority", "Team"]}>
            {rows.map((j) => {
              const team = [...new Set(db.tasks.filter((t) => t.jobId === j.id && t.status !== "Waiting").map((t) => t.assigneeId))].slice(0, 3);
              return (
                <tr key={j.id} className="hover:bg-muted/50">
                  <td className={td}><Link to="/admin/jobs/$jobId" params={{ jobId: j.id }} className="font-mono text-[12px] font-medium text-primary hover:underline">{j.id}</Link></td>
                  <td className={`${td} font-semibold`}>{j.name}</td>
                  <td className={`${td} text-muted-foreground`}>{j.customer}</td>
                  <td className={td}>{db.workflows.find((w) => w.id === j.workflowId)?.name}</td>
                  <td className={td}>{jobStage(db, j)}</td>
                  <td className={`${td} w-32`}><Progress value={jobProgress(db, j)} /></td>
                  <td className={td}><span className={isOverdue(j.dueDate, j.status === "Completed") ? "font-bold text-destructive" : ""}>{fmtDate(j.dueDate)}</span></td>
                  <td className={td}><StatusBadge status={j.status} /></td>
                  <td className={td}><PriorityBadge p={j.priority} /></td>
                  <td className={td}><div className="flex -space-x-2">{team.map((id) => <Avatar key={id} size="sm" name={db.employees.find((e) => e.id === id)?.name ?? "?"} />)}</div></td>
                </tr>
              );
            })}
          </Table>
        )}
        <p className="border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">{rows.length} of {db.jobs.length} job cards</p>
      </Card>
    </>
  );
}
