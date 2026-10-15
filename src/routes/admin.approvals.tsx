import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, Card, Empty, PageHeader, StatusBadge, buttonVariants } from "@/components/kit";
import { cn } from "@/lib/utils";
import { supervisorDepts, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/approvals")({
  head: () => seo("Quality & Approvals", "Review submitted work, approve, reject or request changes."),
  component: Approvals,
});

function Approvals() {
  const { db, role, me } = useStore();
  const [tab, setTab] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const scope = role === "Supervisor" && me ? supervisorDepts(db, me.id) : null;
  const map = { Pending: "Submitted", Approved: "Approved", Rejected: "Rejected" } as const;
  const rows = db.tasks.filter((t) => t.requiresApproval && t.status === map[tab] && (!scope || scope.includes(t.department)));

  return (
    <>
      <PageHeader title="Quality & Approvals" subtitle="Review submissions and move jobs forward." />
      <div className="mb-3 flex gap-1">
        {(["Pending", "Approved", "Rejected"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-3 py-1.5 text-[12px] font-bold", tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border")}>
            {t} ({db.tasks.filter((x) => x.requiresApproval && x.status === map[t] && (!scope || scope.includes(x.department))).length})
          </button>
        ))}
      </div>
      <Card>
        {rows.length === 0 ? <Empty>Nothing here right now.</Empty> : (
          <ul className="divide-y divide-border">
            {rows.map((t) => {
              const e = db.employees.find((x) => x.id === t.assigneeId);
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={e?.name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.title}</p>
                    <p className="text-[12px] text-muted-foreground"><span className="font-mono">{t.jobId}</span> · {t.department} · {e?.name}{t.reviewNote ? ` · “${t.reviewNote}”` : ""}</p>
                  </div>
                  <StatusBadge status={t.status} />
                  <Link to="/supervisor/reviews/$taskId" params={{ taskId: t.id }} className={buttonVariants({ size: "sm", variant: tab === "Pending" ? "primary" : "outline" })}>{tab === "Pending" ? "Review" : "View"}</Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
