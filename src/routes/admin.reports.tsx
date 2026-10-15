import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button, Card, Kpi, PageHeader } from "@/components/kit";
import { CheckCheck, Gauge, ShieldCheck, Timer } from "lucide-react";
import { isOverdue, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/reports")({
  head: () => seo("Reports & Analytics", "Production summary, workload, bottlenecks and quality results."),
  component: Reports,
});

const trend = [{ w: "W37", rate: 82 }, { w: "W38", rate: 85 }, { w: "W39", rate: 79 }, { w: "W40", rate: 88 }, { w: "W41", rate: 91 }, { w: "W42", rate: 87 }];

function Reports() {
  const { db } = useStore();
  const done = db.jobs.filter((j) => j.status === "Completed").length;
  const approvals = db.tasks.filter((t) => t.requiresApproval && ["Approved", "Rejected"].includes(t.status));
  const passRate = approvals.length ? Math.round((approvals.filter((t) => t.status === "Approved").length / approvals.length) * 100) : 100;
  const workload = db.employees.filter((e) => e.role === "Employee").map((e) => ({
    name: e.name.split(" ")[0],
    open: db.tasks.filter((t) => t.assigneeId === e.id && ["Assigned", "In Progress", "Blocked", "Submitted"].includes(t.status)).length,
    done: db.tasks.filter((t) => t.assigneeId === e.id && t.status === "Approved").length,
  }));
  const stages = Object.entries(db.tasks.filter((t) => ["In Progress", "Blocked", "Submitted", "Assigned"].includes(t.status)).reduce<Record<string, number>>((a, t) => ({ ...a, [t.stage]: (a[t.stage] ?? 0) + 1 }), {})).map(([stage, n]) => ({ stage, n })).sort((a, b) => b.n - a.n);

  const exportCsv = () => {
    const csv = ["Employee,Open,Completed", ...workload.map((w) => `${w.name},${w.open},${w.done}`)].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "workload-report.csv"; a.click();
    toast.success("Report exported");
  };

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Live from the current demo data."><Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button></PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<CheckCheck />} label="Jobs completed" value={done} />
        <Kpi icon={<Gauge />} label="Completion rate" value={`${Math.round((done / db.jobs.length) * 100)}%`} t="blue" />
        <Kpi icon={<Timer />} label="Overdue tasks" value={db.tasks.filter((t) => isOverdue(t.dueDate, t.status === "Approved") && t.status !== "Waiting").length} t="red" />
        <Kpi icon={<ShieldCheck />} label="Quality pass rate" value={`${passRate}%`} t="amber" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Employee Workload"><div className="h-64 p-3"><ResponsiveContainer><BarChart data={workload}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis width={24} tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip /><Bar dataKey="open" name="Open" stackId="a" fill="var(--chart-1)" /><Bar dataKey="done" name="Completed" stackId="a" fill="var(--chart-2)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Stage Bottlenecks"><div className="h-64 p-3"><ResponsiveContainer><BarChart data={stages} layout="vertical"><XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} /><YAxis type="category" dataKey="stage" width={130} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="n" name="Open tasks" fill="var(--chart-4)" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="On-time Completion Trend" className="lg:col-span-2"><div className="h-56 p-3"><ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="w" tick={{ fontSize: 11 }} /><YAxis width={28} domain={[60, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Line dataKey="rate" name="On-time %" stroke="var(--primary)" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div></Card>
      </div>
    </>
  );
}
