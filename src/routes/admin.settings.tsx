import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, PageHeader, Table, td } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/settings")({
  head: () => seo("Settings & Permissions", "Organization profile, workflow defaults, notifications and role permissions."),
  component: SettingsPage,
});

const PERMS = [
  ["Create job cards", true, false, false], ["Edit workflows", true, false, false], ["Assign / reassign tasks", true, true, false],
  ["Approve work", true, true, false], ["Update task progress", true, true, true], ["Report blockers", true, true, true], ["View reports", true, true, false],
] as const;

function SettingsPage() {
  const { db, actions, resetDemo } = useStore();
  const [s, setS] = useState(db.settings);
  const toggle = (k: "requireQc" | "emailAlerts" | "overdueAlerts" | "allowSelfAssign", label: string) => (
    <label className="flex items-center justify-between gap-3 py-2 text-[13px]">{label}<input type="checkbox" className="size-4 accent-primary" checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} /></label>
  );
  return (
    <>
      <PageHeader title="Settings & Permissions" subtitle="Saved locally for this demo.">
        <Button variant="danger-outline" onClick={resetDemo}>Reset demo data</Button>
        <Button onClick={() => actions.saveSettings(s)}>Save changes</Button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Organization" className="space-y-0">
          <div className="space-y-3 p-4">
            <Field label="Organization name"><input className="field" value={s.orgName} onChange={(e) => setS({ ...s, orgName: e.target.value })} /></Field>
            <Field label="Industry"><select className="field" value={s.industry} onChange={(e) => setS({ ...s, industry: e.target.value })}>{["Printing press", "Fireworks manufacturing", "Packaging", "General manufacturing"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Default workflow"><select className="field" value={s.defaultWorkflow} onChange={(e) => setS({ ...s, defaultWorkflow: e.target.value })}>{db.workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
          </div>
        </Card>
        <Card title="Notifications & Quality">
          <div className="divide-y divide-border px-4 py-2">
            {toggle("requireQc", "Require QC inspection before packaging")}
            {toggle("emailAlerts", "Email alerts for approvals")}
            {toggle("overdueAlerts", "Alert on overdue tasks")}
            {toggle("allowSelfAssign", "Allow employees to self-assign tasks")}
          </div>
        </Card>
        <Card title="Role Permissions" className="lg:col-span-2">
          <Table head={["Permission", "Admin", "Supervisor", "Employee"]}>
            {PERMS.map(([p, a, sv, e]) => (
              <tr key={p}><td className={td}>{p}</td>{[a, sv, e].map((v, i) => <td key={i} className={td}><input type="checkbox" className="accent-primary" defaultChecked={v} aria-label={`${p} ${["Admin", "Supervisor", "Employee"][i]}`} /></td>)}</tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
