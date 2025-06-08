"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  LogOut,
} from "lucide-react";

export default function VerificationPending() {
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const checkVerificationStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/v1/auth/verification-status", {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.verified) {
          router.push("/management/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
      router.push("/management");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-accent/15 via-transparent to-primary/10"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-background/20 backdrop-blur-2xl border-white/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none"></div>

          <CardContent className="p-8 relative text-center">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Clock className="h-16 w-16 text-orange-500 animate-pulse" />
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl"></div>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Account Pending Verification
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your admin account has been created successfully, but it needs
                  to be verified by an existing administrator before you can
                  access the system.
                </p>
              </div>

              <Alert className="bg-orange-500/10 border-orange-500/30 backdrop-blur-xl">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-700 dark:text-orange-300 text-sm">
                  Please wait for an administrator to verify your account. You
                  will receive confirmation once your access has been approved.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={checkVerificationStatus}
                  disabled={isChecking}
                  className="w-full h-10 bg-primary/80 hover:bg-primary/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-primary/20 text-sm font-medium"
                >
                  {isChecking ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check Verification Status
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full h-10 bg-background/20 backdrop-blur-xl border-white/40 hover:bg-background/30 text-sm"
                >
                  {isLoggingOut ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
