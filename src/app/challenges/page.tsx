import { AdminShell } from "@/components/AdminShell";
import { ChallengesTable } from "@/components/ChallengesTable";

export default function ChallengesPage() {
  return (
    <AdminShell
      title="Challenges"
      subtitle="Purchased evaluations and status."
    >
      <ChallengesTable />
    </AdminShell>
  );
}
