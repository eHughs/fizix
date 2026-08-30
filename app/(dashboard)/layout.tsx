import type { ReactNode } from "react";
import AuthGate from "@/components/auth/AuthGate";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGate>
  );
}
