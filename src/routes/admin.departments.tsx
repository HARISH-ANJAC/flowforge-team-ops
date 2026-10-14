import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Button, Card, Field, Modal, PageHeader, Progress } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/departments")({
  head: () => seo("Departments", "Departments, supervisors, headcount and open workload."),
  component: Departments,
});

function Departments() {
  const { db, actions, role } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const sups = db.employees.filter((e) => e.role !== "Employee");
  const [sup, setSup] = useState(sups[0]?.id ?? "");

  return (
    <>
      <PageHeader title="Departments" subtitle="Production departments and their current workload.">
        {role === "Admin" && <Button onClick={() => setOpen(true)}><Plus /> Add Department</Button>}
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {db.departments.map((d) => {
          const people = db.employees.filter((e) => e.department === d.name && e.active);
          const open = db.tasks.filter((t) => t.department === d.name && ["Assigned", "In Progress", "Blocked", "Submitted"].includes(t.status));
          const s = db.employees.find((e) => e.id === d.supervisorId);
          return (
            <Card key={d.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold">{d.name}</h3><span className="text-[12px] text-muted-foreground">{people.length} people</span></div>
              <p className="flex items-center gap-2 text-[13px]"><Avatar size="sm" name={s?.name ?? "?"} />Supervisor: <b>{s?.name}</b></p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted p-2"><p className="text-[18px] font-extrabold">{open.length}</p><p className="text-[11px] text-muted-foreground">Open</p></div>
                <div className="rounded-md bg-muted p-2"><p className="text-[18px] font-extrabold">{open.filter((t) => t.status === "Blocked").length}</p><p className="text-[11px] text-muted-foreground">Blocked</p></div>
                <div className="rounded-md bg-muted p-2"><p className="text-[18px] font-extrabold">{open.filter((t) => t.status === "Submitted").length}</p><p className="text-[11px] text-muted-foreground">In review</p></div>
              </div>
              <div><p className="mb-1 text-[11px] font-semibold text-muted-foreground">Workload</p><Progress value={Math.min(100, open.length * 22 + 20)} /></div>
            </Card>
          );
        })}
      </div>
      <Modal open={open} onOpenChange={setOpen} title="Add Department" footer={<>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={() => { if (!name.trim()) return toast.error("Name is required"); actions.addDepartment(name.trim(), sup); setName(""); setOpen(false); }}>Add</Button></>}>
        <Field label="Department name"><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lamination" /></Field>
        <Field label="Supervisor"><select className="field" value={sup} onChange={(e) => setSup(e.target.value)}>{sups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      </Modal>
    </>
  );
}
