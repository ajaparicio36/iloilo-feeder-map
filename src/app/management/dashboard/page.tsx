import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import ManageInterruptionsCard from "@/components/management/ManageInterruptionsCard";
import AdminNavbar from "@/components/management/AdminNavbar";

export default async function Dashboard() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Header */}
      <AdminNavbar />

      {/* Main Content */}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
              <p className="text-lg font-medium">Loading dashboard...</p>
            </div>
          </div>
        }
      >
        <ManageInterruptionsCard />
      </Suspense>
    </div>
  );
}
