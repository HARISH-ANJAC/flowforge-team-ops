export type Role = "Admin" | "Supervisor" | "Employee";
export type Priority = "Low" | "Normal" | "High" | "Urgent";
export type JobStatus =
  | "Draft" | "Ready" | "In Progress" | "On Hold" | "Blocked"
  | "Quality Check" | "Pending Approval" | "Completed" | "Cancelled";
export type TaskStatus =
  | "Waiting" | "Assigned" | "In Progress" | "Submitted" | "Rejected" | "Blocked" | "Approved";

export interface Stage { name: string; department: string; days: number; approval: boolean; instructions: string }
export interface Workflow { id: string; name: string; code: string; active: boolean; stages: Stage[] }
export interface Employee {
  id: string; name: string; role: Role; department: string; designation: string;
  email: string; phone: string; active: boolean;
}
export interface Department { id: string; name: string; supervisorId: string }
export interface Job {
  id: string; name: string; customer: string; department: string; workflowId: string;
  stageIndex: number; status: JobStatus; priority: Priority; quantity: number;
  startDate: string; dueDate: string; createdBy: string; createdAt: string; notes: string;
}
export interface Task {
  id: string; jobId: string; order: number; title: string; stage: string; department: string;
  assigneeId: string; priority: Priority; dueDate: string; status: TaskStatus; progress: number;
  instructions: string; checklist: { label: string; done: boolean }[];
  blocker?: string; reviewNote?: string; requiresApproval: boolean;
  comments: { by: string; text: string; at: string }[];
}
export interface Activity { id: string; at: string; actor: string; action: string; ref: string }
export interface Notice { id: string; at: string; title: string; body: string; read: boolean; to: Role | string }
export interface Settings {
  orgName: string; industry: string; defaultWorkflow: string; requireQc: boolean;
  emailAlerts: boolean; overdueAlerts: boolean; allowSelfAssign: boolean;
}
export interface DB {
  jobs: Job[]; tasks: Task[]; employees: Employee[]; departments: Department[];
  workflows: Workflow[]; activity: Activity[]; notices: Notice[]; settings: Settings;
}

export const TODAY = "2026-10-16";

const st = (name: string, department: string, days: number, approval = false, instructions = ""): Stage => ({
  name, department, days, approval,
  instructions: instructions || `Complete ${name.toLowerCase()} as per the approved job specification and record output.`,
});

const checklistFor = (stage: string) => {
  const map: Record<string, string[]> = {
    Printing: ["Check registration marks", "Verify colour accuracy", "Confirm sheet count", "Add inspection photos"],
    "Quality Inspection": ["Inspect sample batch", "Measure trim tolerance", "Record defects", "Sign off QC sheet"],
    Packaging: ["Count units", "Pack in cartons", "Label cartons", "Update dispatch sheet"],
  };
  return (map[stage] ?? ["Review instructions", "Prepare materials", "Complete stage work", "Record output"]).map((label) => ({ label, done: false }));
};

export function makeSeed(): DB {
  const workflows: Workflow[] = [
    { id: "PP-001", name: "Print Production", code: "PP-001", active: true, stages: [
      st("Job Registration", "Production", 1), st("Design Preparation", "Design", 1),
      st("Design Approval", "Design", 1, true), st("Material Preparation", "Production", 1),
      st("Printing", "Printing", 2, true, "Verify print alignment against the approved proof. Check registration marks and ensure colour accuracy across all sheets."),
      st("Finishing", "Finishing", 1), st("Quality Inspection", "Quality Control", 1, true),
      st("Packaging", "Packaging", 1), st("Final Approval", "Production", 1, true),
    ] },
    { id: "PKG-001", name: "Packaging Workflow", code: "PKG-001", active: true, stages: [
      st("Material Preparation", "Production", 1), st("Die Cutting", "Finishing", 1),
      st("Assembly", "Packaging", 2), st("Quality Inspection", "Quality Control", 1, true),
      st("Packaging", "Packaging", 1), st("Final Approval", "Production", 1, true),
    ] },
    { id: "FW-001", name: "Fireworks Assembly", code: "FW-001", active: true, stages: [
      st("Raw Material Check", "Quality Control", 1, true), st("Composition Mixing", "Production", 2),
      st("Filling & Sealing", "Production", 2), st("Labelling", "Printing", 1),
      st("Safety Inspection", "Quality Control", 1, true), st("Packaging", "Packaging", 1),
    ] },
    { id: "CUS-001", name: "Custom Workflow", code: "CUS-001", active: false, stages: [
      st("Planning", "Production", 1), st("Execution", "Production", 2), st("Review", "Quality Control", 1, true),
    ] },
  ];

  const e = (id: string, name: string, role: Role, department: string, designation: string, phone: string): Employee => ({
    id, name, role, department, designation, phone, active: true,
    email: `${name.split(" ")[0].toLowerCase()}@promanage.in`,
  });
  const employees: Employee[] = [
    e("EMP-001", "Aditya Sharma", "Admin", "Production", "Plant Manager", "+91 98450 11001"),
    e("EMP-007", "Priya Devi", "Supervisor", "Printing", "Printing Supervisor", "+91 98450 11007"),
    e("EMP-009", "Rajesh Iyer", "Supervisor", "Production", "Production Supervisor", "+91 98450 11009"),
    e("EMP-024", "Arun Kumar", "Employee", "Printing", "Printing Operator", "+91 98765 43210"),
    e("EMP-031", "Meena Raj", "Employee", "Design", "Prepress Designer", "+91 98450 11031"),
    e("EMP-033", "Karthik S", "Employee", "Finishing", "Finishing Operator", "+91 98450 11033"),
    e("EMP-036", "Lakshmi N", "Employee", "Quality Control", "QC Inspector", "+91 98450 11036"),
    e("EMP-040", "Vijay M", "Employee", "Packaging", "Packing Lead", "+91 98450 11040"),
    e("EMP-042", "Suresh B", "Employee", "Production", "Production Operator", "+91 98450 11042"),
    e("EMP-045", "Divya P", "Employee", "Printing", "Press Assistant", "+91 98450 11045"),
  ];
  const departments: Department[] = [
    { id: "D1", name: "Production", supervisorId: "EMP-009" },
    { id: "D2", name: "Design", supervisorId: "EMP-007" },
    { id: "D3", name: "Printing", supervisorId: "EMP-007" },
    { id: "D4", name: "Finishing", supervisorId: "EMP-009" },
    { id: "D5", name: "Quality Control", supervisorId: "EMP-007" },
    { id: "D6", name: "Packaging", supervisorId: "EMP-009" },
  ];

  type J = [string, string, string, string, number, JobStatus, Priority, number, string, string];
  const raw: J[] = [
    ["JOB-2026-0148", "Premium Wedding Invitations", "Sri Lakshmi Printers", "PP-001", 4, "In Progress", "High", 5000, "2026-10-06", "2026-10-18"],
    ["JOB-2026-0149", "Product Labels", "Global Packaging", "PP-001", 4, "Pending Approval", "Normal", 20000, "2026-10-08", "2026-10-15"],
    ["JOB-2026-0150", "Gift Box Assembly", "Happy Gifts Co.", "PKG-001", 2, "In Progress", "Normal", 1200, "2026-10-09", "2026-10-21"],
    ["JOB-2026-0151", "Banner Batch", "Bright Signage", "PP-001", 3, "Blocked", "High", 300, "2026-10-10", "2026-10-16"],
    ["JOB-2026-0152", "Festive Packaging", "Star Products", "PKG-001", 0, "Ready", "Low", 8000, "2026-10-14", "2026-10-24"],
    ["JOB-2026-0153", "Brochure Printing", "Nova Tech", "PP-001", 6, "Quality Check", "Normal", 10000, "2026-10-05", "2026-10-17"],
    ["JOB-2026-0154", "Diwali Sparklers Lot A", "Sivakasi Traders", "FW-001", 2, "In Progress", "Urgent", 50000, "2026-10-07", "2026-10-19"],
    ["JOB-2026-0155", "Sticker Labels", "Fresh Farms", "PP-001", 4, "In Progress", "Normal", 15000, "2026-10-11", "2026-10-20"],
    ["JOB-2026-0156", "Catalog Printing", "Home Decor Ltd", "PP-001", 1, "In Progress", "Normal", 2500, "2026-10-12", "2026-10-22"],
    ["JOB-2026-0157", "Flower Pots Lot B", "Sivakasi Traders", "FW-001", 3, "In Progress", "High", 20000, "2026-10-08", "2026-10-15"],
    ["JOB-2026-0146", "Annual Report", "Coastal Bank", "PP-001", 9, "Completed", "Normal", 800, "2026-09-28", "2026-10-10"],
    ["JOB-2026-0147", "Sweet Box Cartons", "Annapoorna Sweets", "PKG-001", 6, "Completed", "Normal", 6000, "2026-09-30", "2026-10-12"],
    ["JOB-2026-0158", "Calendar 2027", "Ravi Agencies", "PP-001", 0, "Draft", "Low", 3000, "2026-10-20", "2026-11-05"],
  ];
  const jobs: Job[] = raw.map(([id, name, customer, workflowId, stageIndex, status, priority, quantity, startDate, dueDate]) => ({
    id, name, customer, workflowId, stageIndex, status, priority, quantity, startDate, dueDate,
    department: workflows.find((w) => w.id === workflowId)!.stages[Math.min(stageIndex, workflows.find((w) => w.id === workflowId)!.stages.length - 1)].department,
    createdBy: "Aditya Sharma", createdAt: `${startDate}T10:24:00`, notes: "",
  }));

  const byDept = (dept: string) => employees.filter((x) => x.department === dept && x.role === "Employee");
  const tasks: Task[] = [];
  let n = 200;
  jobs.forEach((job, ji) => {
    if (job.status === "Draft") return;
    const wf = workflows.find((w) => w.id === job.workflowId)!;
    wf.stages.forEach((s, i) => {
      const pool = byDept(s.department);
      const assignee = s.department === "Printing" ? (ji % 3 === 2 ? "EMP-045" : "EMP-024") : pool.length ? pool[(ji + i) % pool.length].id : "EMP-042";
      let status: TaskStatus = "Waiting";
      let progress = 0;
      if (job.status === "Completed" || i < job.stageIndex) { status = "Approved"; progress = 100; }
      else if (i === job.stageIndex) {
        status = job.status === "Ready" ? "Assigned" : job.status === "Blocked" ? "Blocked"
          : job.status === "Pending Approval" || job.status === "Quality Check" ? "Submitted" : "In Progress";
        progress = status === "Assigned" ? 0 : status === "Submitted" ? 100 : 40 + ((ji * 13) % 40);
      }
      const checklist = checklistFor(s.name).map((c, ci) => ({ ...c, done: progress === 100 || ci < Math.floor(progress / 30) }));
      tasks.push({
        id: `TASK-0${n++}`, jobId: job.id, order: i, title: `${s.name} — ${job.name}`, stage: s.name,
        department: s.department, assigneeId: assignee, priority: job.priority, dueDate: job.dueDate,
        status, progress, instructions: s.instructions, checklist, requiresApproval: s.approval,
        blocker: status === "Blocked" ? "Material shortage: 120gsm art paper out of stock." : undefined,
        comments: [],
      });
    });
  });

  const activity: Activity[] = [
    { id: "A5", at: "2026-10-16T09:12:00", actor: "Arun Kumar", action: "submitted printing for approval", ref: "JOB-2026-0149" },
    { id: "A4", at: "2026-10-16T08:40:00", actor: "Suresh B", action: "reported a blocker on Material Preparation", ref: "JOB-2026-0151" },
    { id: "A3", at: "2026-10-15T17:05:00", actor: "Priya Devi", action: "approved Design Approval", ref: "JOB-2026-0148" },
    { id: "A2", at: "2026-10-15T11:30:00", actor: "Aditya Sharma", action: "assigned Printing to Arun Kumar", ref: "JOB-2026-0148" },
    { id: "A1", at: "2026-10-14T10:24:00", actor: "Aditya Sharma", action: "created job card", ref: "JOB-2026-0152" },
  ];
  const notices: Notice[] = [
    { id: "N1", at: "2026-10-16T09:12:00", title: "Approval requested", body: "Printing for JOB-2026-0149 is waiting for your review.", read: false, to: "Supervisor" },
    { id: "N2", at: "2026-10-16T08:40:00", title: "Job blocked", body: "JOB-2026-0151 is blocked: material shortage.", read: false, to: "Admin" },
    { id: "N3", at: "2026-10-15T11:30:00", title: "New task assigned", body: "Printing — Premium Wedding Invitations is assigned to you.", read: false, to: "EMP-024" },
    { id: "N4", at: "2026-10-15T09:00:00", title: "Due soon", body: "Sticker Labels printing is due on 20 Oct.", read: true, to: "EMP-024" },
  ];

  return {
    jobs, tasks, employees, departments, workflows, activity, notices,
    settings: { orgName: "ProManage Print & Pack", industry: "Printing press", defaultWorkflow: "PP-001", requireQc: true, emailAlerts: true, overdueAlerts: true, allowSelfAssign: false },
  };
}

export const DEMO_USERS: Record<Role, string> = { Admin: "EMP-001", Supervisor: "EMP-007", Employee: "EMP-024" };
