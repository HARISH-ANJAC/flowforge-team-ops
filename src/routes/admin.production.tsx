import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, PageHeader, PriorityBadge, Progress, fmtDate } from "@/components/kit";
import { cn } from "@/lib/utils";
import { jobProgress, jobStage, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import type { JobStatus } from "@/lib/data";

export const Route = createFileRoute("/admin/production")({
  head: () => seo("Production Board", "Kanban view of the production pipeline from ready to completed."),
  component: Board,
});

const COLS: { s: JobStatus; tone: string }[] = [
  { s: "Ready", tone: "border-t-info" }, { s: "In Progress", tone: "border-t-primary" }, { s: "Blocked", tone: "border-t-destructive" },
  { s: "Quality Check", tone: "border-t-info" }, { s: "Pending Approval", tone: "border-t-warning" }, { s: "Completed", tone: "border-t-success" },
];
const VALID: Record<string, JobStatus[]> = {
  Ready: ["In Progress"], "In Progress": ["Blocked", "Quality Check", "Pending Approval"], Blocked: ["In Progress"],
  "Quality Check": ["In Progress"], "Pending Approval": ["In Progress"], "On Hold": ["In Progress"], Completed: [],
};

function Board() {
  const { db, actions } = useStore();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<JobStatus | null>(null);
  const [dept, setDept] = useState("All");

  const drop = (to: JobStatus) => {
    const job = db.jobs.find((j) => j.id === drag);
    setDrag(null); setOver(null);
    if (!job || job.status === to) return;
    if (!VALID[job.status]?.includes(to)) {
      return toast.error(`Can't move from ${job.status} to ${to}`, { description: to === "Completed" ? "Jobs complete automatically after final approval." : "Approvals are handled in Quality & Approvals." });
    }
    actions.setJobStatus(job.id, to);
  };

  return (
    <>
      <PageHeader title="Production Board" subtitle="Drag cards between columns. Only valid transitions are allowed.">
        <select className="field w-44" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
          <option>All</option>{db.departments.map((d) => <option key={d.id}>{d.name}</option>)}
        </select>
      </PageHeader>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {COLS.map((c) => {
          const jobs = db.jobs.filter((j) => j.status === c.s && (dept === "All" || j.department === dept));
          return (
            <div key={c.s} onDragOver={(e) => { e.preventDefault(); setOver(c.s); }} onDragLeave={() => setOver(null)} onDrop={() => drop(c.s)}
              className={cn("w-72 shrink-0 rounded-xl border border-t-4 border-border bg-muted/60 p-2", c.tone, over === c.s && "bg-accent")}>
              <p className="flex items-center justify-between px-1.5 py-1.5 text-[13px] font-bold">{c.s}<span className="rounded-full bg-card px-2 text-[11px]">{jobs.length}</span></p>
              <div className="min-h-24 space-y-2">
                {jobs.map((j) => {
                  const team = [...new Set(db.tasks.filter((t) => t.jobId === j.id && t.status !== "Waiting").map((t) => t.assigneeId))].slice(0, 3);
                  return (
                    <div key={j.id} draggable onDragStart={() => setDrag(j.id)} className={cn("card-surface cursor-grab space-y-2 p-3 active:cursor-grabbing", drag === j.id && "opacity-50")}>
                      <div className="flex items-center justify-between"><Link to="/admin/jobs/$jobId" params={{ jobId: j.id }} className="font-mono text-[11px] font-medium text-primary hover:underline">{j.id}</Link><PriorityBadge p={j.priority} /></div>
                      <p className="text-[13px] font-bold leading-tight">{j.name}</p>
                      <p className="text-[11px] text-muted-foreground">{jobStage(db, j)} · Due {fmtDate(j.dueDate)}</p>
                      <Progress value={jobProgress(db, j)} />
                      <div className="flex -space-x-2">{team.map((id) => <Avatar key={id} size="sm" name={db.employees.find((e) => e.id === id)?.name ?? "?"} />)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
