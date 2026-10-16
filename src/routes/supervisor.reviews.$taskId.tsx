import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Button, Card, Empty, Field, PageHeader, Progress, StatusBadge, fmtTime } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/supervisor/reviews/$taskId")({
  head: ({ params }) => seo(`Review ${params.taskId}`, "Inspect submitted work and approve, reject or request changes."),
  component: Review,
});

function Review() {
  const { taskId } = Route.useParams();
  const { db, actions, role } = useStore();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const t = db.tasks.find((x) => x.id === taskId);
  if (!t) return <Card><Empty>Task not found.</Empty></Card>;
  const job = db.jobs.find((j) => j.id === t.jobId)!;
  const emp = db.employees.find((e) => e.id === t.assigneeId);
  const back = role === "Admin" ? "/admin/approvals" : "/supervisor/dashboard";
  const pending = t.status === "Submitted";
  const reject = (kind: "reject" | "changes") => {
    if (!note.trim()) return toast.error("Add a reason so the employee knows what to fix");
    actions.rejectTask(t.id, note.trim(), kind); navigate({ to: back });
  };

  return (
    <>
      <Link to={back} className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground"><ArrowLeft className="size-3.5" /> Back</Link>
      <PageHeader title={t.stage} subtitle={`${job.id} · ${job.name} · ${job.customer}`}><StatusBadge status={t.status} /></PageHeader>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card title="Submission">
            <div className="space-y-3 p-4 text-[13px]">
              <p className="flex items-center gap-2"><Avatar size="sm" name={emp?.name ?? "?"} /><b>{emp?.name}</b><span className="text-muted-foreground">· {t.department}</span></p>
              <Progress value={t.progress} />
              <p className="text-muted-foreground">{t.instructions}</p>
            </div>
          </Card>
          <Card title="Checklist">
            <ul className="divide-y divide-border">{t.checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 px-4 py-2.5 text-[13px]">{c.done ? <CheckCircle2 className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}{c.label}<span className="ml-auto text-[11px] text-muted-foreground">{c.done ? "Done" : "Pending"}</span></li>
            ))}</ul>
          </Card>
          <Card title="Attachments & Comments">
            <div className="space-y-2 p-4 text-[13px]">
              {["inspection-photo-1.jpg", "sheet-count.pdf"].map((f) => <p key={f} className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" />{f}</p>)}
              {t.comments.map((c, i) => <div key={i} className="rounded-md bg-muted p-2.5"><p className="text-[11px] text-muted-foreground">{c.by} · {fmtTime(c.at)}</p><p>{c.text}</p></div>)}
            </div>
          </Card>
        </div>
        <Card title="Decision" className="h-fit">
          <div className="space-y-3 p-4">
            {pending ? <>
              <Field label="Note / reason"><textarea className="field h-28 py-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required when rejecting or requesting changes" /></Field>
              <Button className="w-full" size="lg" onClick={() => { actions.approveTask(t.id, note.trim()); navigate({ to: back }); }}><CheckCircle2 /> Approve & advance</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => reject("changes")}>Request changes</Button>
                <Button variant="danger-outline" onClick={() => reject("reject")}>Reject</Button>
              </div>
            </> : <p className="text-[13px] text-muted-foreground">This task is {t.status.toLowerCase()}.{t.reviewNote ? ` Note: “${t.reviewNote}”` : ""}</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
