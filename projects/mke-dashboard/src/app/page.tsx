import { Header } from "@/components/layout/Header";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <main className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 p-4 sm:p-6">
        <DashboardShell />
      </div>
    </main>
  );
}
