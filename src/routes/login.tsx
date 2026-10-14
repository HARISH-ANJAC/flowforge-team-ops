import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Factory, ShieldCheck, UserCog, HardHat } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Field } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import type { Role } from "@/lib/data";

export const Route = createFileRoute("/login")({
  head: () => seo("Sign in", "Sign in to the ProManage demo as Admin, Supervisor or Employee."),
  component: Login,
});

const ROLES: { role: Role; name: string; email: string; desc: string; icon: typeof ShieldCheck }[] = [
  { role: "Admin", name: "Aditya Sharma", email: "aditya@promanage.in", desc: "Create jobs, workflows & assign work", icon: ShieldCheck },
  { role: "Supervisor", name: "Priya Devi", email: "priya@promanage.in", desc: "Review, approve & unblock team", icon: UserCog },
  { role: "Employee", name: "Arun Kumar", email: "arun@promanage.in", desc: "Update tasks & report progress", icon: HardHat },
];

function Login() {
  const { setRole } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("aditya@promanage.in");
  const [pw, setPw] = useState("demo1234");

  const go = (r: Role) => {
    setRole(r);
    toast.success(`Signed in as ${r}`);
    navigate({ to: r === "Admin" ? "/admin/dashboard" : r === "Supervisor" ? "/supervisor/dashboard" : "/employee/tasks" });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = ROLES.find((r) => r.email === email.trim().toLowerCase());
    if (!m || pw !== "demo1234") return toast.error("Use a demo email below with password demo1234");
    go(m.role);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-extrabold"><Factory className="size-6" /> ProManage</div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">From job card<br />to finished batch.</h2>
          <p className="mt-3 max-w-md text-primary-foreground/80">Plan workflows, assign the shop floor, track every stage and approve quality — in one place.</p>
        </div>
        <p className="text-xs text-primary-foreground/60">Demo prototype · data is stored in your browser</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Use a demo account or pick a role below.</p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Email"><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password" hint="Demo password: demo1234"><input className="field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
            <Button type="submit" size="lg" className="w-full">Sign in</Button>
          </form>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">One-click demo roles</p>
            {ROLES.map((r) => (
              <button key={r.role} onClick={() => go(r.role)} className="card-surface flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-primary hover:bg-accent">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"><r.icon className="size-5" /></span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">{r.role} · {r.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
