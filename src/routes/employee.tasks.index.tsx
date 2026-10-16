import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCheck, ClipboardList, Clock, Loader } from "lucide-react";
import { useState } from "react";
import { Card, Empty, Kpi, PageHeader, PriorityBadge, Progress, StatusBadge, fmtDate } from "@/components/kit";
import { cn } from "@/lib/utils";
import { isOverdue, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/employee/tasks/")({
  head: () => seo("My Tasks", "Your assigned production tasks for today."),
  component: MyTasks,
});

const FILTERS = ["Active", "Blocked", "Submitted", "Done"] as const;

function MyTasks() {
  const { db, me } = useStore();
  const [f, setF] = useState<(typeof FILTERS)[number]>("Active");
  if (!me) return null;
  const mine = db.tasks.filter((t) => t.assigneeId === me.id && t.status !== "Waiting");
  const active = mine.filter((t) => ["Assigned", "In Progress", "Rejected"].includes(t.status));
  const shown = mine.filter((t) => f === "Active" ? ["Assigned", "In Progress", "Rejected"].includes(t.status) : f === "Done" ? t.status === "Approved" : t.status === f);
  const order = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
  shown.sort((a, b) => order[a.priority] - order[b.priority] || a.dueDate.localeCompare(b.dueDate));

  return (
    <>
      <PageHeader title={`Good morning, ${me.name.split(" ")[0]}`} subtitle="Here's your task overview for today." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icon={<ClipboardList />} label="Active tasks" value={active.length} />
        <Kpi icon={<Loader />} label="In progress" value={mine.filter((t) => t.status === "In Progress").length} t="blue" />
        <Kpi icon={<Clock />} label="Awaiting review" value={mine.filter((t) => t.status === "Submitted").length} t="amber" />
        <Kpi icon={<AlertTriangle />} label="Overdue" value={active.filter((t) => isOverdue(t.dueDate, false)).length} t="red" />
        <Kpi icon={<CheckCheck />} label="Completed" value={mine.filter((t) => t.status === "Approved").length} />
      </div>
      <div className="mb-3 mt-5 flex gap-1 overflow-x-auto">
        {FILTERS.map((x) => <button key={x} onClick={() => setF(x)} className={cn("rounded-full px-3 py-1.5 text-[12px] font-bold", f === x ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground")}>{x}</button>)}
      </div>
      <Card>
        {shown.length === 0 ? <Empty>No tasks here. Nice work!</Empty> : (
          <ul className="divide-y divide-border">
            {shown.map((t) => (
              <li key={t.id}>
                <Link to="/employee/tasks/$taskId" params={{ taskId: t.id }} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.title}</p>
                    <p className="text-[12px] text-muted-foreground"><span className="font-mono">{t.id}</span> · {t.jobId} · <span className={isOverdue(t.dueDate, t.status === "Approved") ? "font-bold text-destructive" : ""}>Due {fmtDate(t.dueDate)}</span></p>
                    {t.status === "Rejected" && t.reviewNote && <p className="text-[12px] text-destructive">Fix: {t.reviewNote}</p>}
                  </div>
                  <div className="w-28"><Progress value={t.progress} /></div>
                  <PriorityBadge p={t.priority} /><StatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
