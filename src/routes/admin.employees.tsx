import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Badge, Button, Card, Field, Modal, PageHeader, StatusBadge, Table, td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import type { Role } from "@/lib/data";

export const Route = createFileRoute("/admin/employees")({
  head: () => seo("Employees", "Manage the workforce, roles, departments and task workload."),
  component: Employees,
});

function Employees() {
  const { db, actions, role } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", role: "Employee" as Role, department: "Printing", designation: "", email: "", phone: "" });
  const rows = db.employees.filter((e) => `${e.name} ${e.id} ${e.department}`.toLowerCase().includes(q.toLowerCase()));
  const load = (id: string) => db.tasks.filter((t) => t.assigneeId === id && ["Assigned", "In Progress", "Blocked", "Submitted", "Rejected"].includes(t.status)).length;
  const viewing = db.employees.find((e) => e.id === view);

  return (
    <>
      <PageHeader title="Employees" subtitle={`${db.employees.filter((e) => e.active).length} active people across ${db.departments.length} departments.`}>
        {role === "Admin" && <Button onClick={() => setOpen(true)}><Plus /> Add Employee</Button>}
      </PageHeader>
      <Card>
        <div className="border-b border-border p-3"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="field pl-9" placeholder="Search employees" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
        <Table head={["Employee", "ID", "Role", "Department", "Designation", "Open tasks", "Status", ""]}>
          {rows.map((e) => (
            <tr key={e.id} className="hover:bg-muted/50">
              <td className={td}><button onClick={() => setView(e.id)} className="flex items-center gap-2 font-semibold hover:text-primary"><Avatar size="sm" name={e.name} />{e.name}</button></td>
              <td className={`${td} font-mono text-[12px]`}>{e.id}</td><td className={td}>{e.role}</td><td className={td}>{e.department}</td>
              <td className={`${td} text-muted-foreground`}>{e.designation}</td><td className={td}>{load(e.id)}</td>
              <td className={td}><Badge t={e.active ? "green" : "gray"}>{e.active ? "Active" : "Inactive"}</Badge></td>
              <td className={td}>{role === "Admin" && <Button size="sm" variant="ghost" onClick={() => actions.toggleEmployee(e.id)}>{e.active ? "Deactivate" : "Activate"}</Button>}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title="Add Employee" footer={<>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={() => {
          if (!f.name.trim() || !f.email.includes("@")) return toast.error("Name and a valid email are required");
          actions.addEmployee(f); setOpen(false); setF({ ...f, name: "", email: "", phone: "", designation: "" });
        }}>Add</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name *"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email *"><input className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Role"><select className="field" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{["Employee", "Supervisor", "Admin"].map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Department"><select className="field" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}>{db.departments.map((d) => <option key={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Designation"><input className="field" value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></Field>
          <Field label="Phone"><input className="field" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={!!viewing} onOpenChange={() => setView(null)} title={viewing?.name ?? ""}>
        {viewing && <>
          <div className="flex items-center gap-3"><Avatar size="lg" name={viewing.name} /><div><p className="font-bold">{viewing.designation}</p><p className="text-[12px] text-muted-foreground">{viewing.id} · {viewing.department} · {viewing.email}</p></div></div>
          <p className="text-[12px] font-bold">Assigned tasks</p>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {db.tasks.filter((t) => t.assigneeId === viewing.id && t.status !== "Waiting").map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-[12px]"><span className="truncate">{t.title}</span><StatusBadge status={t.status} /></li>
            ))}
          </ul>
        </>}
      </Modal>
    </>
  );
}
