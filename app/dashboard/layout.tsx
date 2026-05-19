import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/hooks/use-dashboard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Enforce server-side authentication redirect
  if (!userId) {
    redirect("/");
  }

  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
