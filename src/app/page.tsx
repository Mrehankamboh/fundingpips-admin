import { AdminShell } from "@/components/AdminShell";
import { DashboardView } from "@/components/DashboardView";

export default function HomePage() {
  return (
    <AdminShell
      title="Dashboard"
      subtitle="Users, challenges, and spend at a glance."
    >
      <DashboardView />
    </AdminShell>
  );
}
