import { TARGET_NEIGHBORHOODS } from "@/lib/constants";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-limestone/20 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-iron sm:text-3xl">
              Milwaukee Neighborhood Vitality
            </h1>
            <p className="mt-1 text-sm text-foundry">
              Cross-department data for transparency and community-driven
              revitalization
            </p>
          </div>
          <div className="hidden text-xs text-limestone sm:block">
            {TARGET_NEIGHBORHOODS.length} neighborhoods
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 p-4 sm:p-6">
        <DashboardShell />
      </div>
    </main>
  );
}
