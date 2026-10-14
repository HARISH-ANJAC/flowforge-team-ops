import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, CircleDot, FileText, OctagonAlert } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Card, Empty, PageHeader, PriorityBadge, Progress, StatusBadge, Table, fmtDate, fmtTime, td } from "@/components/kit";
import { cn } from "@/lib/utils";
import { jobProgress, jobStage, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import type { JobStatus } from "@/lib/data";

export const Route = createFileRoute("/admin/jobs/$jobId")({
  head: ({ params }) => seo(`Job ${params.jobId}`, `Job card details, workflow timeline and tasks for ${params.jobId}.`),
  component: JobDetail,
});

const TABS = ["Overview", "Tasks", "Quality & Approvals", "Activity"] as const;

function JobDetail() {
  const { jobId } = Route.useParams();
  const { db, role, actions } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) return <Card><Empty>Job {jobId} not found. <Link to="/admin/jobs" className="font-bold text-primary">Back to job cards</Link></Empty></Card>;
  const wf = db.workflows.find((w) => w.id === job.workflowId)!;
  const tasks = db.tasks.filter((t) => t.jobId === job.id).sort((a, b) => a.order - b.order);
  const progress = jobProgress(db, job);
  const emp = (id: string) => db.employees.find((e) => e.id === id);
  const done = job.status === "Completed";

  return (
    <>
      <Link to="/admin/jobs" className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Job Cards</Link>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-2"><span className="font-mono text-[18px]">{job.id}</span> {job.name} <StatusBadge status={job.status} /> <PriorityBadge p={job.priority} /></span>}
        subtitle={`Customer: ${job.customer} · Due ${fmtDate(job.dueDate)} · ${progress}% complete`}>
        {role === "Admin" && job.status === "Draft" && <Button onClick={() => actions.releaseDraft(job.id)}>Release to production</Button>}
        {role === "Admin" && !done && job.status !== "Draft" && (
          job.status === "On Hold"
            ? <Button variant="outline" onClick={() => actions.setJobStatus(job.id, "In Progress")}>Resume</Button>
            : <Button variant="outline" onClick={() => actions.setJobStatus(job.id, "On Hold" as JobStatus)}>Put on hold</Button>
        )}
      </PageHeader>
      <Progress value={progress} className="mb-4 max-w-md" />
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-[13px] font-semibold", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Job Information">
            <dl className="space-y-2.5 p-4 text-[13px]">
              {[["Job ID", job.id], ["Customer", job.customer], ["Department", job.department], ["Workflow", `${wf.name} (${wf.code})`], ["Quantity", job.quantity.toLocaleString()], ["Created by", job.createdBy], ["Created on", fmtTime(job.createdAt)]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
              ))}
            </dl>
            {job.notes && <p className="border-t border-border p-4 text-[13px] text-muted-foreground">{job.notes}</p>}
          </Card>
          <Card title="Schedule">
            <dl className="space-y-2.5 p-4 text-[13px]">
              {[["Planned start", fmtDate(job.startDate)], ["Due date", fmtDate(job.dueDate)], ["Current stage", jobStage(db, job)], ["Estimated duration", `${wf.stages.reduce((a, s) => a + s.days, 0)} days`]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
            <div className="border-t border-border p-4">
              <p className="mb-2 text-[12px] font-bold">Files</p>
              {["artwork-final.pdf", "proof-v2.pdf"].map((f) => <p key={f} className="flex items-center gap-2 py-1 text-[13px]"><FileText className="size-4 text-muted-foreground" />{f}</p>)}
            </div>
          </Card>
          <Card title="Workflow Progress">
            <ol className="p-4">
              {wf.stages.map((s, i) => {
                const t = tasks.find((x) => x.order === i);
                const state = done || i < job.stageIndex ? "done" : i === job.stageIndex ? "current" : "todo";
                return (
                  <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                    {i < wf.stages.length - 1 && <span className={cn("absolute left-[9px] top-5 h-full w-px", state === "done" ? "bg-primary" : "bg-border")} />}
                    {state === "done" ? <CheckCircle2 className="relative size-5 shrink-0 text-primary" /> : state === "current" ? (job.status === "Blocked" ? <OctagonAlert className="relative size-5 shrink-0 text-destructive" /> : <CircleDot className="relative size-5 shrink-0 text-primary" />) : <Circle className="relative size-5 shrink-0 text-border" />}
                    <div className="min-w-0 flex-1 text-[13px]">
                      <p className={cn("font-semibold", state === "todo" && "text-muted-foreground")}>{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.department}{t ? ` · ${emp(t.assigneeId)?.name}` : ""}</p>
                    </div>
                    {t && state === "current" && <StatusBadge status={t.status} />}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      )}

      {tab === "Tasks" && (
        <Card>
          {tasks.length === 0 ? <Empty>No tasks yet — release the draft to generate stage tasks.</Empty> : (
            <Table head={["Task", "Stage", "Department", "Assignee", "Progress", "Status", "Reassign"]}>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className={`${td} font-mono text-[12px]`}>{t.id}</td><td className={`${td} font-semibold`}>{t.stage}</td><td className={td}>{t.department}</td>
                  <td className={td}><span className="flex items-center gap-2"><Avatar size="sm" name={emp(t.assigneeId)?.name ?? "?"} />{emp(t.assigneeId)?.name}</span></td>
                  <td className={`${td} w-32`}><Progress value={t.progress} /></td><td className={td}><StatusBadge status={t.status} /></td>
                  <td className={td}>
                    <select className="field h-8 w-40" value={t.assigneeId} disabled={t.status === "Approved"} onChange={(e) => actions.reassign(t.id, e.target.value)} aria-label="Reassign">
                      {db.employees.filter((e) => e.role === "Employee" && e.active).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "Quality & Approvals" && (
        <Card>
          {tasks.filter((t) => t.requiresApproval).length === 0 ? <Empty>No approval stages.</Empty> : (
            <Table head={["Stage", "Assignee", "Status", "Reviewer note", ""]}>
              {tasks.filter((t) => t.requiresApproval).map((t) => (
                <tr key={t.id}>
                  <td className={`${td} font-semibold`}>{t.stage}</td><td className={td}>{emp(t.assigneeId)?.name}</td><td className={td}><StatusBadge status={t.status} /></td>
                  <td className={`${td} text-muted-foreground`}>{t.reviewNote ?? "—"}</td>
                  <td className={td}>{t.status === "Submitted" && <Link to="/supervisor/reviews/$taskId" params={{ taskId: t.id }} className="font-bold text-primary">Review</Link>}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "Activity" && (
        <Card>
          <ul className="divide-y divide-border">
            {db.activity.filter((a) => a.ref === job.id).map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-[13px]"><Avatar size="sm" name={a.actor} /><span className="flex-1"><b>{a.actor}</b> {a.action}</span><span className="text-[11px] text-muted-foreground">{fmtTime(a.at)}</span></li>
            ))}
            {db.activity.filter((a) => a.ref === job.id).length === 0 && <Empty>No activity recorded yet.</Empty>}
          </ul>
        </Card>
      )}
    </>
  );
}
