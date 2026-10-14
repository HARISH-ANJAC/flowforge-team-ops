import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, PageHeader, Table, td } from "@/components/kit";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import type { Stage, Workflow } from "@/lib/data";

export const Route = createFileRoute("/admin/workflows")({
  head: () => seo("Workflow Builder", "Define and manage production workflow templates and stages."),
  component: Workflows,
});

function Workflows() {
  const { db, actions, role } = useStore();
  const [selId, setSelId] = useState(db.workflows[0].id);
  const sel = db.workflows.find((w) => w.id === selId);
  const [draft, setDraft] = useState<Workflow | null>(sel ? structuredClone(sel) : null);
  const [isNew, setIsNew] = useState(false);
  const pick = (w: Workflow) => { setSelId(w.id); setDraft(structuredClone(w)); setIsNew(false); };
  const upd = (i: number, p: Partial<Stage>) => setDraft((d) => d && { ...d, stages: d.stages.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const move = (i: number, dir: -1 | 1) => setDraft((d) => {
    if (!d) return d; const s = [...d.stages]; const j = i + dir; if (j < 0 || j >= s.length) return d;
    [s[i], s[j]] = [s[j], s[i]]; return { ...d, stages: s };
  });
  const usage = (id: string) => db.jobs.filter((j) => j.workflowId === id && !["Completed", "Draft"].includes(j.status)).length;
  const canEdit = role === "Admin";

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.code.trim() || draft.stages.length === 0) return toast.error("Name, code and at least one stage are required");
    if (isNew && db.workflows.some((w) => w.id === draft.code)) return toast.error("Workflow code already exists");
    actions.saveWorkflow({ ...draft, id: isNew ? undefined : draft.id });
    setSelId(isNew ? draft.code : draft.id); setIsNew(false);
  };

  return (
    <>
      <PageHeader title="Workflow Builder" subtitle="Define and manage production workflows.">
        {canEdit && <Button onClick={() => { setIsNew(true); setDraft({ id: "", name: "New Workflow", code: `WF-00${db.workflows.length + 1}`, active: true, stages: [{ name: "Stage 1", department: "Production", days: 1, approval: false, instructions: "" }] }); }}><Plus /> Create Workflow</Button>}
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card title="Workflow Templates">
          <Table head={["Name", "Code", "Stages", "Active jobs", "Status"]}>
            {db.workflows.map((w) => (
              <tr key={w.id} onClick={() => pick(w)} className={cn("cursor-pointer hover:bg-muted/50", selId === w.id && !isNew && "bg-accent")}>
                <td className={`${td} font-semibold text-primary`}>{w.name}</td><td className={`${td} font-mono text-[12px]`}>{w.code}</td>
                <td className={td}>{w.stages.length}</td><td className={td}>{usage(w.id)}</td>
                <td className={td}><Badge t={w.active ? "green" : "gray"}>{w.active ? "Active" : "Inactive"}</Badge></td>
              </tr>
            ))}
          </Table>
        </Card>
        {draft && (
          <Card title={isNew ? "New Workflow" : `Workflow Editor (${draft.code})`} action={
            <label className="flex items-center gap-2 text-[12px] font-semibold">Active
              <input type="checkbox" className="size-4 accent-primary" checked={draft.active} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            </label>}>
            <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2">
              <input className="field" value={draft.name} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Workflow name" />
              <input className="field font-mono" value={draft.code} disabled={!canEdit || !isNew} onChange={(e) => setDraft({ ...draft, code: e.target.value })} aria-label="Workflow code" />
            </div>
            <ol className="divide-y divide-border">
              {draft.stages.map((s, i) => (
                <li key={i} className="grid items-center gap-2 px-4 py-2.5 md:grid-cols-[24px_1fr_150px_70px_auto_auto]">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>
                  <input className="field h-8" value={s.name} disabled={!canEdit} onChange={(e) => upd(i, { name: e.target.value })} aria-label="Stage name" />
                  <select className="field h-8" value={s.department} disabled={!canEdit} onChange={(e) => upd(i, { department: e.target.value })} aria-label="Department">
                    {db.departments.map((d) => <option key={d.id}>{d.name}</option>)}
                  </select>
                  <input className="field h-8" type="number" min={1} value={s.days} disabled={!canEdit} onChange={(e) => upd(i, { days: Number(e.target.value) })} aria-label="Days" />
                  <label className="flex items-center gap-1.5 text-[12px]"><input type="checkbox" className="accent-primary" checked={s.approval} disabled={!canEdit} onChange={(e) => upd(i, { approval: e.target.checked })} />Approval</label>
                  {canEdit && (
                    <span className="flex gap-0.5">
                      <button className="rounded p-1 hover:bg-muted" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-4" /></button>
                      <button className="rounded p-1 hover:bg-muted" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-4" /></button>
                      <button className="rounded p-1 text-destructive hover:bg-destructive-soft" onClick={() => setDraft({ ...draft, stages: draft.stages.filter((_, j) => j !== i) })} aria-label="Remove"><Trash2 className="size-4" /></button>
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {canEdit && (
              <div className="flex justify-between border-t border-border p-4">
                <Button variant="soft" onClick={() => setDraft({ ...draft, stages: [...draft.stages, { name: `Stage ${draft.stages.length + 1}`, department: "Production", days: 1, approval: false, instructions: "" }] })}><Plus /> Add stage</Button>
                <Button onClick={save}>Save workflow</Button>
              </div>
            )}
            <div className="border-t border-border p-4">
              <p className="mb-2 text-[12px] font-bold text-muted-foreground">Preview</p>
              <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                {draft.stages.map((s, i) => <span key={i} className="flex items-center gap-1.5"><span className={cn("rounded-md border px-2 py-1 font-semibold", s.approval ? "border-warning/30 bg-warning-soft text-warning" : "border-border bg-muted")}>{s.name}</span>{i < draft.stages.length - 1 && "→"}</span>)}
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
