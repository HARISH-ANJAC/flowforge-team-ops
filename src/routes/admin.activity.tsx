import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, Card, Empty, PageHeader, fmtTime } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admin/activity")({
  head: () => seo("Activity Logs", "Chronological record of every job, task and approval event."),
  component: ActivityPage,
});

function ActivityPage() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const rows = db.activity.filter((a) => `${a.actor} ${a.action} ${a.ref}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Activity Logs" subtitle={`${db.activity.length} events recorded`} />
      <Card>
        <div className="border-b border-border p-3"><input className="field max-w-sm" placeholder="Filter by person, action or job ID" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {rows.length === 0 ? <Empty>No events.</Empty> : (
          <ul className="divide-y divide-border">
            {rows.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                <Avatar size="sm" name={a.actor} />
                <span className="flex-1"><b>{a.actor}</b> {a.action} <span className="font-mono text-[12px] text-primary">{a.ref}</span></span>
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">{fmtTime(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
