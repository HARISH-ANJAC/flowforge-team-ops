import { createFileRoute } from "@tanstack/react-router";
import { Card, Empty, PageHeader, Progress, StatusBadge, fmtDate } from "@/components/kit";
import { jobProgress, jobStage, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/employee/jobs")({
  head: () => seo("My Job Cards", "Job cards you're working on."),
  component: MyJobs,
});

function MyJobs() {
  const { db, me } = useStore();
  if (!me) return null;
  const ids = new Set(db.tasks.filter((t) => t.assigneeId === me.id).map((t) => t.jobId));
  const jobs = db.jobs.filter((j) => ids.has(j.id));
  return (
    <>
      <PageHeader title="My Job Cards" subtitle="Jobs that include stages assigned to you." />
      {jobs.length === 0 ? <Card><Empty>No job cards yet.</Empty></Card> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => (
            <Card key={j.id} className="space-y-2 p-4">
              <div className="flex justify-between"><span className="font-mono text-[12px] text-primary">{j.id}</span><StatusBadge status={j.status} /></div>
              <p className="font-bold">{j.name}</p>
              <p className="text-[12px] text-muted-foreground">{j.customer} · {jobStage(db, j)} · Due {fmtDate(j.dueDate)}</p>
              <Progress value={jobProgress(db, j)} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
