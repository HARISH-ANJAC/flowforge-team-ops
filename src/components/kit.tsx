import { cva, type VariantProps } from "class-variance-authority";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { JobStatus, Priority, TaskStatus } from "@/lib/data";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline: "border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        soft: "bg-accent text-accent-foreground hover:bg-accent/70",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "danger-outline": "border border-destructive/30 bg-card text-destructive hover:bg-destructive-soft",
      },
      size: { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-11 px-5 text-sm", icon: "size-9" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({ className, variant, size, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...p} />;
}

export function Card({ className, children, title, action }: { className?: string; children: ReactNode; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cn("card-surface", className)}>
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h3 className="text-[15px] font-bold">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const tone = {
  green: "bg-success-soft text-success border-success/20",
  amber: "bg-warning-soft text-warning border-warning/20",
  red: "bg-destructive-soft text-destructive border-destructive/20",
  blue: "bg-info-soft text-info border-info/20",
  gray: "bg-muted text-muted-foreground border-border",
} as const;
type Tone = keyof typeof tone;

export function Badge({ t = "gray", children, dot = true }: { t?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold", tone[t])}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  Draft: "gray", Ready: "blue", "In Progress": "green", "On Hold": "amber", Blocked: "red",
  "Quality Check": "blue", "Pending Approval": "amber", Completed: "green", Cancelled: "gray",
  Waiting: "gray", Assigned: "blue", Submitted: "amber", Rejected: "red", Approved: "green",
};
export function StatusBadge({ status }: { status: JobStatus | TaskStatus }) {
  return <Badge t={statusTone[status]}>{status}</Badge>;
}
const prTone: Record<Priority, Tone> = { Low: "gray", Normal: "blue", High: "amber", Urgent: "red" };
export function PriorityBadge({ p }: { p: Priority }) {
  return <Badge t={prTone[p]} dot={false}>{p}</Badge>;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-[11px] font-semibold text-muted-foreground">{value}%</span>
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <span title={name} className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground ring-2 ring-card",
      size === "sm" && "size-6 text-[10px]", size === "md" && "size-8 text-xs", size === "lg" && "size-14 text-lg")}>
      {initials}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight md:text-[24px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Kpi({ icon, label, value, hint, t = "green" }: { icon: ReactNode; label: string; value: ReactNode; hint?: string; t?: Tone }) {
  return (
    <div className="card-surface flex items-start gap-3 p-4">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-4", tone[t])}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-muted-foreground">{label}</p>
        <p className="text-[22px] font-extrabold leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-[12px] font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2.5">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
export const td = "whitespace-nowrap px-4 py-2.5";

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">{children}</div>;
}

export function Modal({ open, onOpenChange, title, children, footer }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/30 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="card-surface fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 p-0 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <DialogPrimitive.Title className="text-[15px] font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="size-4" /></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description asChild><div className="space-y-3 px-5 py-4">{children}</div></DialogPrimitive.Description>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function fmtDate(d: string) {
  const dt = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
export function fmtTime(d: string) {
  const dt = new Date(d);
  return `${dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}, ${dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
