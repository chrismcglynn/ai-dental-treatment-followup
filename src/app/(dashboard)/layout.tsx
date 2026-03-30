import { AppShell } from "@/components/shared/AppShell";
import { SandboxWrapper } from "./sandbox-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SandboxWrapper>
      <AppShell>{children}</AppShell>
    </SandboxWrapper>
  );
}
