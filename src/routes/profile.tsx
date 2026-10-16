import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Avatar, Button, Card, PageHeader } from "@/components/kit";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/profile")({
  head: () => seo("Profile", "Your profile and account details."),
  component: () => <AppShell><Profile /></AppShell>,
});

function Profile() {
  const { me, setRole, role } = useStore();
  const navigate = useNavigate();
  if (!me) return null;
  return (
    <>
      <PageHeader title="Profile" />
      <Card className="max-w-lg">
        <div className="flex items-center gap-4 border-b border-border p-5"><Avatar size="lg" name={me.name} /><div><p className="text-lg font-extrabold">{me.name}</p><p className="text-[13px] text-muted-foreground">{role} · {me.designation}</p></div></div>
        <dl className="space-y-2.5 p-5 text-[13px]">
          {[["Employee ID", me.id], ["Department", me.department], ["Designation", me.designation], ["Email", me.email], ["Phone", me.phone]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
        </dl>
        <div className="border-t border-border p-5"><Button variant="danger-outline" className="w-full" onClick={() => { setRole(null); navigate({ to: "/login" }); }}><LogOut /> Log out</Button></div>
      </Card>
    </>
  );
}
