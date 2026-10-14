import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Card, Field, PageHeader, PriorityBadge } from "@/components/kit";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import type { Priority } from "@/lib/data";

export const Route = createFileRoute("/admin/jobs/new")({
  head: () => seo("Create Job Card", "Set up a new production job: details, workflow, assignments and review."),
  component: NewJob,
});

const STEPS = ["Job information", "Workflow", "Assignments", "Attachments", "Review"];

function NewJob() {
  const { db, actions } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: "Premium Diwali Greeting Cards", customer: "Sri Lakshmi Printers", priority: "High" as Priority, quantity: 4000,
    startDate: "2026-10-17", dueDate: "2026-10-27", notes: "Gold foil on front, 350gsm matte board.", workflowId: db.settings.defaultWorkflow,
  });
  const [assignees, setAssignees] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<string[]>(["artwork-final.pdf"]);
  const wf = db.workflows.find((w) => w.id === f.workflowId)!;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const valid0 = f.name.trim() && f.customer.trim() && f.quantity > 0 && f.dueDate >= f.startDate;
  const next = () => {
    if (step === 0 && !valid0) return toast.error("Fill job name, customer, quantity and a due date after the start date");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const save = (draft: boolean) => {
    if (!valid0) { setStep(0); return toast.error("Complete job information first"); }
    const id = actions.createJob({ ...f, assignees }, draft);
    navigate({ to: "/admin/jobs/$jobId", params: { jobId: id } });
  };

  return (
    <>
      <PageHeader title="Create Job Card" subtitle="Set up a new production job in a few steps.">
        <Button variant="outline" onClick={() => save(true)}>Save Draft</Button>
      </PageHeader>
      <ol className="mb-4 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button onClick={() => (i <= step || valid0) && setStep(i)} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold", i === step ? "border-primary bg-primary text-primary-foreground" : i < step ? "border-primary/30 bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground")}>
              <span className="flex size-5 items-center justify-center rounded-full bg-card/30 text-[11px]">{i < step ? <Check className="size-3" /> : i + 1}</span>{s}
            </button>
          </li>
        ))}
      </ol>
      <Card className="p-5">
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job / product name *"><input className="field" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Customer *"><input className="field" value={f.customer} onChange={(e) => set("customer", e.target.value)} /></Field>
            <Field label="Quantity *"><input className="field" type="number" min={1} value={f.quantity} onChange={(e) => set("quantity", Number(e.target.value))} /></Field>
            <Field label="Priority"><select className="field" value={f.priority} onChange={(e) => set("priority", e.target.value as Priority)}>{["Low", "Normal", "High", "Urgent"].map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Planned start"><input className="field" type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="Due date *"><input className="field" type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></Field>
            <div className="md:col-span-2"><Field label="Production requirements"><textarea className="field h-24 py-2" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field></div>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {db.workflows.filter((w) => w.active).map((w) => (
                <button key={w.id} onClick={() => { set("workflowId", w.id); setAssignees({}); }} className={cn("card-surface flex w-full items-center justify-between p-3 text-left", f.workflowId === w.id && "border-primary bg-accent")}>
                  <span><span className="block font-bold">{w.name}</span><span className="text-[12px] text-muted-foreground">{w.code} · {w.stages.length} stages</span></span>
                  {f.workflowId === w.id && <Check className="size-4 text-primary" />}
                </button>
              ))}
            </div>
            <ol className="space-y-2 rounded-lg bg-muted p-4">
              {wf.stages.map((s, i) => (
                <li key={i} className="flex items-center gap-3 text-[13px]"><span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>{s.name}<span className="ml-auto text-[11px] text-muted-foreground">{s.department} · {s.days}d{s.approval ? " · approval" : ""}</span></li>
              ))}
            </ol>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-2">
            <p className="text-[13px] text-muted-foreground">Choose who works on each stage. Leave blank to auto-assign by department.</p>
            {wf.stages.map((s, i) => (
              <div key={i} className="grid items-center gap-2 md:grid-cols-[1fr_1fr_240px]">
                <span className="font-semibold">{i + 1}. {s.name}</span>
                <span className="text-[12px] text-muted-foreground">{s.department}</span>
                <select className="field" value={assignees[i] ?? ""} onChange={(e) => setAssignees((a) => ({ ...a, [i]: e.target.value }))}>
                  <option value="">Auto-assign</option>
                  {db.employees.filter((e) => e.active && e.role === "Employee").sort((a, b) => Number(b.department === s.department) - Number(a.department === s.department)).map((e) => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted">
              <Paperclip className="size-6 text-muted-foreground" />
              <span className="text-[13px] font-semibold">Click to attach artwork, proofs or specs</span>
              <input type="file" multiple className="hidden" onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files ?? []).map((x) => x.name)])} />
            </label>
            <ul className="space-y-1">{files.map((x, i) => <li key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-[13px]">{x}<button className="text-[12px] text-destructive" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>
          </div>
        )}
        {step === 4 && (
          <dl className="grid gap-x-8 gap-y-3 text-[13px] md:grid-cols-2">
            {[["Job", f.name], ["Customer", f.customer], ["Quantity", f.quantity.toLocaleString()], ["Schedule", `${f.startDate} → ${f.dueDate}`], ["Workflow", `${wf.name} (${wf.stages.length} stages)`], ["Attachments", `${files.length} file(s)`]].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
            <div className="flex justify-between border-b border-border pb-2"><dt className="text-muted-foreground">Priority</dt><dd><PriorityBadge p={f.priority} /></dd></div>
          </dl>
        )}
        <div className="mt-6 flex justify-between border-t border-border pt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {step < STEPS.length - 1 ? <Button onClick={next}>Continue</Button> : <Button onClick={() => save(false)}><Check /> Create Job Card</Button>}
        </div>
      </Card>
    </>
  );
}
