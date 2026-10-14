import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DEMO_USERS, makeSeed, TODAY, type DB, type Job, type JobStatus, type Priority, type Role, type Stage, type Task } from "./data";

const KEY = "promanage-demo-v1";
const ROLE_KEY = "promanage-role";

type Mutator = (db: DB) => void;

function stamp() {
  const d = new Date();
  return `${TODAY}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
}

interface StoreCtx {
  db: DB;
  role: Role | null;
  ready: boolean;
  me: DB["employees"][number] | undefined;
  setRole: (r: Role | null) => void;
  resetDemo: () => void;
  actions: ReturnType<typeof buildActions>;
}

const Ctx = createContext<StoreCtx | null>(null);

function buildActions(mutate: (fn: Mutator) => void, actorName: () => string) {
  const log = (db: DB, action: string, ref: string) => {
    db.activity.unshift({ id: `A${db.activity.length + 1}-${Date.now()}`, at: stamp(), actor: actorName(), action, ref });
  };
  const notify = (db: DB, to: string, title: string, body: string) => {
    db.notices.unshift({ id: `N${Date.now()}${Math.floor(performance.now())}`, at: stamp(), title, body, read: false, to });
  };
  const advance = (db: DB, job: Job) => {
    const wf = db.workflows.find((w) => w.id === job.workflowId)!;
    const next = job.stageIndex + 1;
    if (next >= wf.stages.length) {
      job.stageIndex = wf.stages.length;
      job.status = "Completed";
      log(db, "completed job", job.id);
      notify(db, "Admin", "Job completed", `${job.id} ${job.name} has completed all stages.`);
      return;
    }
    job.stageIndex = next;
    job.status = "In Progress";
    job.department = wf.stages[next].department;
    const t = db.tasks.find((x) => x.jobId === job.id && x.order === next);
    if (t) {
      t.status = "Assigned";
      notify(db, t.assigneeId, "New task assigned", `${t.title} is ready for you.`);
    }
    log(db, `advanced to ${wf.stages[next].name}`, job.id);
  };

  return {
    createJob(input: { name: string; customer: string; workflowId: string; priority: Priority; quantity: number; startDate: string; dueDate: string; notes: string; assignees: Record<number, string> }, draft: boolean) {
      let newId = "";
      mutate((db) => {
        const num = Math.max(...db.jobs.map((j) => Number(j.id.split("-")[2]))) + 1;
        newId = `JOB-2026-0${num}`;
        const wf = db.workflows.find((w) => w.id === input.workflowId)!;
        db.jobs.unshift({
          id: newId, name: input.name, customer: input.customer, workflowId: wf.id, stageIndex: 0,
          status: draft ? "Draft" : "Ready", priority: input.priority, quantity: input.quantity,
          startDate: input.startDate, dueDate: input.dueDate, createdBy: actorName(), createdAt: stamp(),
          notes: input.notes, department: wf.stages[0].department,
        });
        if (!draft) {
          let n = Math.max(...db.tasks.map((t) => Number(t.id.split("-")[1]))) + 1;
          wf.stages.forEach((s, i) => {
            const assigneeId = input.assignees[i] || db.employees.find((e) => e.department === s.department && e.role === "Employee")?.id || "EMP-042";
            db.tasks.push({
              id: `TASK-0${n++}`, jobId: newId, order: i, title: `${s.name} — ${input.name}`, stage: s.name,
              department: s.department, assigneeId, priority: input.priority, dueDate: input.dueDate,
              status: i === 0 ? "Assigned" : "Waiting", progress: 0, instructions: s.instructions,
              checklist: ["Review instructions", "Prepare materials", "Complete stage work", "Record output"].map((label) => ({ label, done: false })),
              requiresApproval: s.approval, comments: [],
            });
            if (i === 0) notify(db, assigneeId, "New task assigned", `${s.name} — ${input.name} is assigned to you.`);
          });
        }
        log(db, draft ? "saved job card as draft" : "created job card", newId);
      });
      toast.success(draft ? "Draft saved" : "Job card created", { description: newId });
      return newId;
    },
    releaseDraft(jobId: string) {
      mutate((db) => {
        const job = db.jobs.find((j) => j.id === jobId)!;
        const wf = db.workflows.find((w) => w.id === job.workflowId)!;
        let n = Math.max(...db.tasks.map((t) => Number(t.id.split("-")[1]))) + 1;
        wf.stages.forEach((s, i) => {
          const assigneeId = db.employees.find((e) => e.department === s.department && e.role === "Employee")?.id || "EMP-042";
          db.tasks.push({
            id: `TASK-0${n++}`, jobId, order: i, title: `${s.name} — ${job.name}`, stage: s.name, department: s.department,
            assigneeId, priority: job.priority, dueDate: job.dueDate, status: i === 0 ? "Assigned" : "Waiting", progress: 0,
            instructions: s.instructions, checklist: ["Review instructions", "Prepare materials", "Complete stage work", "Record output"].map((label) => ({ label, done: false })),
            requiresApproval: s.approval, comments: [],
          });
        });
        job.status = "Ready";
        log(db, "released draft to production", jobId);
      });
      toast.success("Job released to production");
    },
    setJobStatus(jobId: string, status: JobStatus) {
      mutate((db) => {
        const job = db.jobs.find((j) => j.id === jobId)!;
        const prev = job.status;
        job.status = status;
        const t = db.tasks.find((x) => x.jobId === jobId && x.order === job.stageIndex);
        if (t) {
          if (status === "In Progress" && (t.status === "Assigned" || t.status === "Blocked")) { t.status = "In Progress"; t.blocker = undefined; }
          if (status === "Blocked") { t.status = "Blocked"; t.blocker = t.blocker ?? "Marked blocked from production board."; }
          if (status === "Pending Approval" || status === "Quality Check") { t.status = "Submitted"; t.progress = 100; }
        }
        if (status === "Completed") { job.stageIndex = db.workflows.find((w) => w.id === job.workflowId)!.stages.length; db.tasks.filter((x) => x.jobId === jobId).forEach((x) => { x.status = "Approved"; x.progress = 100; }); }
        log(db, `moved from ${prev} to ${status}`, jobId);
      });
      toast.success(`Job moved to ${status}`);
    },
    updateTask(taskId: string, patch: Partial<Task>, message?: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        Object.assign(t, patch);
        if (message) log(db, message, t.jobId);
      });
    },
    startTask(taskId: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        t.status = "In Progress";
        const job = db.jobs.find((j) => j.id === t.jobId)!;
        job.status = "In Progress";
        log(db, `started ${t.stage}`, t.jobId);
      });
      toast.success("Task started");
    },
    saveProgress(taskId: string, progress: number, checklist: Task["checklist"], note: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        t.progress = progress; t.checklist = checklist;
        if (t.status === "Assigned" || t.status === "Rejected") t.status = "In Progress";
        if (note.trim()) t.comments.push({ by: actorName(), text: note.trim(), at: stamp() });
        log(db, `updated ${t.stage} progress to ${progress}%`, t.jobId);
      });
      toast.success("Progress updated", { description: `${progress}% complete` });
    },
    submitTask(taskId: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        const job = db.jobs.find((j) => j.id === t.jobId)!;
        t.progress = 100; t.checklist = t.checklist.map((c) => ({ ...c, done: true }));
        if (t.requiresApproval) {
          t.status = "Submitted";
          job.status = t.department === "Quality Control" ? "Quality Check" : "Pending Approval";
          log(db, `submitted ${t.stage} for approval`, t.jobId);
          notify(db, "Supervisor", "Approval requested", `${t.stage} for ${t.jobId} is waiting for review.`);
        } else {
          t.status = "Approved";
          log(db, `completed ${t.stage}`, t.jobId);
          advance(db, job);
        }
      });
      toast.success("Work submitted");
    },
    approveTask(taskId: string, note: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        t.status = "Approved"; t.reviewNote = note || undefined;
        if (note) t.comments.push({ by: actorName(), text: `Approved: ${note}`, at: stamp() });
        log(db, `approved ${t.stage}`, t.jobId);
        notify(db, t.assigneeId, "Work approved", `${t.stage} for ${t.jobId} was approved.`);
        advance(db, db.jobs.find((j) => j.id === t.jobId)!);
      });
      toast.success("Approved — job advanced to next stage");
    },
    rejectTask(taskId: string, reason: string, kind: "reject" | "changes") {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        t.status = "Rejected"; t.reviewNote = reason; t.progress = Math.min(t.progress, 80);
        t.comments.push({ by: actorName(), text: `${kind === "reject" ? "Rejected" : "Changes requested"}: ${reason}`, at: stamp() });
        db.jobs.find((j) => j.id === t.jobId)!.status = "In Progress";
        log(db, `${kind === "reject" ? "rejected" : "requested changes on"} ${t.stage}`, t.jobId);
        notify(db, t.assigneeId, kind === "reject" ? "Work rejected" : "Changes requested", `${t.stage}: ${reason}`);
      });
      toast.error(kind === "reject" ? "Work rejected" : "Changes requested");
    },
    reportBlocker(taskId: string, reason: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        t.status = "Blocked"; t.blocker = reason;
        db.jobs.find((j) => j.id === t.jobId)!.status = "Blocked";
        log(db, `reported blocker on ${t.stage}: ${reason}`, t.jobId);
        notify(db, "Supervisor", "Blocker reported", `${t.jobId}: ${reason}`);
        notify(db, "Admin", "Job blocked", `${t.jobId}: ${reason}`);
      });
      toast.warning("Blocker reported to supervisor");
    },
    resolveBlocker(taskId: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        t.status = "In Progress"; t.blocker = undefined;
        db.jobs.find((j) => j.id === t.jobId)!.status = "In Progress";
        log(db, `resolved blocker on ${t.stage}`, t.jobId);
        notify(db, t.assigneeId, "Blocker resolved", `You can continue ${t.stage}.`);
      });
      toast.success("Blocker resolved");
    },
    reassign(taskId: string, assigneeId: string) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)!;
        t.assigneeId = assigneeId;
        const emp = db.employees.find((e) => e.id === assigneeId);
        log(db, `assigned ${t.stage} to ${emp?.name}`, t.jobId);
        notify(db, assigneeId, "New task assigned", `${t.title} is assigned to you.`);
      });
      toast.success("Task reassigned");
    },
    saveWorkflow(wf: { id?: string; name: string; code: string; active: boolean; stages: Stage[] }) {
      mutate((db) => {
        const existing = wf.id ? db.workflows.find((w) => w.id === wf.id) : undefined;
        if (existing) Object.assign(existing, { name: wf.name, code: wf.code, active: wf.active, stages: wf.stages });
        else db.workflows.push({ id: wf.code, name: wf.name, code: wf.code, active: wf.active, stages: wf.stages });
        log(db, existing ? "updated workflow template" : "created workflow template", wf.code);
      });
      toast.success("Workflow saved");
    },
    addEmployee(e: Omit<DB["employees"][number], "id" | "active">) {
      mutate((db) => {
        const n = Math.max(...db.employees.map((x) => Number(x.id.split("-")[1]))) + 1;
        const id = `EMP-0${n}`;
        db.employees.push({ ...e, id, active: true });
        log(db, `added employee ${e.name}`, id);
      });
      toast.success("Employee added");
    },
    toggleEmployee(id: string) {
      mutate((db) => { const e = db.employees.find((x) => x.id === id)!; e.active = !e.active; log(db, `${e.active ? "activated" : "deactivated"} ${e.name}`, id); });
    },
    addDepartment(name: string, supervisorId: string) {
      mutate((db) => { db.departments.push({ id: `D${db.departments.length + 1}`, name, supervisorId }); log(db, `added department ${name}`, name); });
      toast.success("Department added");
    },
    saveSettings(s: DB["settings"]) {
      mutate((db) => { db.settings = s; log(db, "updated organization settings", "Settings"); });
      toast.success("Settings saved");
    },
    markRead(id?: string) {
      mutate((db) => { db.notices.forEach((n) => { if (!id || n.id === id) n.read = true; }); });
    },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => makeSeed());
  const [role, setRoleState] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);
  const roleRef = useRef<Role | null>(null);
  const dbRef = useRef(db);
  dbRef.current = db;
  roleRef.current = role;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setDb(JSON.parse(saved));
      const r = localStorage.getItem(ROLE_KEY) as Role | null;
      if (r) setRoleState(r);
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(db));
  }, [db, ready]);

  const mutate = useCallback((fn: Mutator) => {
    setDb((prev) => { const next = structuredClone(prev); fn(next); return next; });
  }, []);

  const actions = useMemo(() => buildActions(mutate, () => {
    const r = roleRef.current;
    return dbRef.current.employees.find((e) => e.id === (r ? DEMO_USERS[r] : ""))?.name ?? "System";
  }), [mutate]);

  const setRole = useCallback((r: Role | null) => {
    setRoleState(r);
    if (r) localStorage.setItem(ROLE_KEY, r); else localStorage.removeItem(ROLE_KEY);
  }, []);

  const resetDemo = useCallback(() => { setDb(makeSeed()); toast.success("Demo data reset"); }, []);

  const me = role ? db.employees.find((e) => e.id === DEMO_USERS[role]) : undefined;

  return <Ctx.Provider value={{ db, role, ready, me, setRole, resetDemo, actions }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

/* ---------- selectors ---------- */
export function jobProgress(db: DB, job: Job) {
  const wf = db.workflows.find((w) => w.id === job.workflowId);
  if (!wf) return 0;
  if (job.status === "Completed") return 100;
  const cur = db.tasks.find((t) => t.jobId === job.id && t.order === job.stageIndex);
  return Math.round(((job.stageIndex + (cur ? cur.progress / 100 : 0)) / wf.stages.length) * 100);
}
export function jobStage(db: DB, job: Job) {
  const wf = db.workflows.find((w) => w.id === job.workflowId);
  if (job.status === "Completed") return "Completed";
  return wf?.stages[job.stageIndex]?.name ?? "—";
}
export function isOverdue(due: string, done: boolean) {
  return !done && due < TODAY;
}
export function supervisorDepts(db: DB, empId: string) {
  return db.departments.filter((d) => d.supervisorId === empId).map((d) => d.name);
}
export function noticesFor(db: DB, role: Role | null, empId?: string) {
  return db.notices.filter((n) => n.to === role || n.to === empId);
}
