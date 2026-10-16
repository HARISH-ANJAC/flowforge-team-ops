import { createFileRoute } from "@tanstack/react-router";
import { Card, Empty, PageHeader, fmtTime } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/employee/history")({
  head: () => seo("My History", "Your recent work activity."),
  component: History,
});

function History() {
  const { db, me } = useStore();
  if (!me) return null;
  const rows = db.activity.filter((a) => a.actor === me.name);
  return (
    <>
      <PageHeader title="My History" subtitle={`${db.tasks.filter((t) => t.assigneeId === me.id && t.status === "Approved").length} tasks completed`} />
      <Card>
        {rows.length === 0 ? <Empty>No activity yet.</Empty> : (
          <ul className="divide-y divide-border">{rows.map((a) => <li key={a.id} className="flex justify-between gap-3 px-4 py-3 text-[13px]"><span>You {a.action} <span className="font-mono text-[12px] text-primary">{a.ref}</span></span><span className="whitespace-nowrap text-[11px] text-muted-foreground">{fmtTime(a.at)}</span></li>)}</ul>
        )}
      </Card>
    </>
  );
}
