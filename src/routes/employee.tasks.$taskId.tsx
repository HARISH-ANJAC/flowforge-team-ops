import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, OctagonAlert, Play, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, Empty, Field, Modal, PageHeader, PriorityBadge, StatusBadge, fmtDate, fmtTime } from "@/components/kit";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/employee/tasks/$taskId")({
  head: ({ params }) => seo(`Task ${params.taskId}`, "Task instructions, checklist and progress updates."),
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { db, actions } = useStore();
  const t = db.tasks.find((x) => x.id === taskId);
  const [progress, setProgress] = useState(t?.progress ?? 0);
  const [checklist, setChecklist] = useState(t?.checklist ?? []);
  const [note, setNote] = useState("");
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState("Material shortage");
  const [detail, setDetail] = useState("");
  useEffect(() => { if (t) { setProgress(t.progress); setChecklist(t.checklist); } }, [t?.id, t?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!t) return <Card><Empty>Task not found.</Empty></Card>;
  const job = db.jobs.find((j) => j.id === t.jobId)!;
  const editable = ["In Progress", "Rejected"].includes(t.status);

  return (
    <>
      <Link to="/employee/tasks" className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground"><ArrowLeft className="size-3.5" /> My Tasks</Link>
      <PageHeader title={t.stage} subtitle={`${job.id} · ${job.name}`}><PriorityBadge p={t.priority} /><StatusBadge status={t.status} /></PageHeader>

      {t.status === "Rejected" && t.reviewNote && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-[13px] text-destructive"><b>Supervisor feedback:</b> {t.reviewNote}</div>}
      {t.status === "Blocked" && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-[13px] text-destructive"><b>Blocked:</b> {t.blocker} — your supervisor has been notified.</div>}
      {t.status === "Submitted" && <div className="mb-4 rounded-lg border border-warning/30 bg-warning-soft p-3 text-[13px] text-warning">Submitted — waiting for supervisor approval.</div>}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card title="Instructions"><p className="p-4 text-[13px]">{t.instructions}</p></Card>
          <Card title="Checklist">
            <ul className="divide-y divide-border">
              {checklist.map((c, i) => (
                <li key={c.label}><label className={cn("flex items-center gap-3 px-4 py-3 text-[13px]", editable && "cursor-pointer")}>
                  <input type="checkbox" className="size-5 accent-primary" disabled={!editable} checked={c.done} onChange={(e) => {
                    const next = checklist.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x));
                    setChecklist(next); setProgress(Math.max(progress, Math.round((next.filter((x) => x.done).length / next.length) * 100)));
                  }} />
                  <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                </label></li>
              ))}
            </ul>
          </Card>
          {t.comments.length > 0 && <Card title="History"><div className="space-y-2 p-4">{t.comments.map((c, i) => <div key={i} className="rounded-md bg-muted p-2.5 text-[13px]"><p className="text-[11px] text-muted-foreground">{c.by} · {fmtTime(c.at)}</p>{c.text}</div>)}</div></Card>}
        </div>
        <div className="space-y-4">
          <Card title="Details">
            <dl className="space-y-2 p-4 text-[13px]">
              {[["Job card", job.id], ["Customer", job.customer], ["Department", t.department], ["Quantity", job.quantity.toLocaleString()], ["Due date", fmtDate(t.dueDate)], ["Needs approval", t.requiresApproval ? "Yes" : "No"]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            </dl>
          </Card>
          <Card title="Update Progress">
            <div className="space-y-3 p-4">
              {t.status === "Assigned" ? (
                <Button size="lg" className="w-full" onClick={() => actions.startTask(t.id)}><Play /> Start task</Button>
              ) : <>
                <div>
                  <div className="mb-1 flex justify-between text-[12px] font-semibold"><span>Progress</span><span>{progress}%</span></div>
                  <input type="range" min={0} max={100} step={5} value={progress} disabled={!editable} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-primary" aria-label="Progress" />
                </div>
                <Field label="Note (optional)"><textarea className="field h-20 py-2" disabled={!editable} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 3,200 sheets done" /></Field>
                <Button variant="outline" size="lg" className="w-full" disabled={!editable} onClick={() => { actions.saveProgress(t.id, progress, checklist, note); setNote(""); }}>Save progress</Button>
                <Button size="lg" className="w-full" disabled={!editable} onClick={() => {
                  if (checklist.some((c) => !c.done)) return toast.error("Complete all checklist items before submitting");
                  actions.saveProgress(t.id, 100, checklist, note); actions.submitTask(t.id);
                }}><Send /> {t.requiresApproval ? "Submit for approval" : "Mark complete"}</Button>
              </>}
              {["Assigned", "In Progress", "Rejected"].includes(t.status) && <Button variant="danger-outline" className="w-full" onClick={() => setBlockOpen(true)}><OctagonAlert /> Report a blocker</Button>}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={blockOpen} onOpenChange={setBlockOpen} title="Report a blocker" footer={<>
        <Button variant="outline" onClick={() => setBlockOpen(false)}>Cancel</Button>
        <Button variant="danger" onClick={() => { actions.reportBlocker(t.id, detail.trim() ? `${reason}: ${detail.trim()}` : reason); setBlockOpen(false); }}>Report blocker</Button></>}>
        <Field label="Reason"><select className="field" value={reason} onChange={(e) => setReason(e.target.value)}>{["Material shortage", "Machine breakdown", "Unclear instructions", "Waiting on previous stage", "Quality issue", "Other"].map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Details"><textarea className="field h-24 py-2" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What do you need to continue?" /></Field>
      </Modal>
    </>
  );
}
