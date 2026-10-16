import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Button, Card, Empty, PageHeader, fmtTime } from "@/components/kit";
import { cn } from "@/lib/utils";
import { noticesFor, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/notifications")({
  head: () => seo("Notifications", "Assignments, approvals, blockers and deadline alerts."),
  component: () => <AppShell><Notifications /></AppShell>,
});

function Notifications() {
  const { db, role, me, actions } = useStore();
  const list = noticesFor(db, role, me?.id);
  return (
    <>
      <PageHeader title="Notifications" subtitle={`${list.filter((n) => !n.read).length} unread`}>
        <Button variant="outline" onClick={() => actions.markRead()}>Mark all read</Button>
      </PageHeader>
      <Card>
        {list.length === 0 ? <Empty>You're all caught up.</Empty> : (
          <ul className="divide-y divide-border">{list.map((n) => (
            <li key={n.id}><button onClick={() => actions.markRead(n.id)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50", !n.read && "bg-accent/50")}>
              <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground"><Bell className="size-4" /></span>
              <span className="flex-1"><span className="block text-[13px] font-bold">{n.title}</span><span className="block text-[13px] text-muted-foreground">{n.body}</span></span>
              <span className="whitespace-nowrap text-[11px] text-muted-foreground">{fmtTime(n.at)}</span>
              {!n.read && <span className="mt-1.5 size-2 rounded-full bg-primary" aria-label="Unread" />}
            </button></li>
          ))}</ul>
        )}
      </Card>
    </>
  );
}
