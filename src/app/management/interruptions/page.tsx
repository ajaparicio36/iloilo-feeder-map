import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import CreateInterruptionCard from "@/components/management/CreateInterruptionCard";
import AdminNavbar from "@/components/management/AdminNavbar";

export default async function InterruptionsPage() {
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Zap className="text-white w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Power Interruptions
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage and monitor power interruptions across Iloilo City
          </p>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
                <p className="text-lg font-medium">Loading interruptions...</p>
              </div>
            </div>
          }
        >
          <CreateInterruptionCard />
        </Suspense>
      </div>
    </div>
  );
}
