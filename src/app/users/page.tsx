import { AdminShell } from "@/components/AdminShell";
import { UsersTable } from "@/components/UsersTable";

export default function UsersPage() {
  return (
    <AdminShell
      title="Users"
      subtitle="Signups, roles, block status, and spend."
    >
      <UsersTable />
    </AdminShell>
  );
}
