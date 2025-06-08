"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, MapPin, Zap, Building } from "lucide-react";
import CreateFeederCard from "./CreateFeederCard";
import CreateBarangayCard from "./CreateBarangayCard";

interface Stats {
  totalFeeders: number;
  totalBarangays: number;
  activeInterruptions: number;
  totalInterruptions: number;
}

export default function ManageInterruptionsCard() {
  const [stats, setStats] = useState<Stats>({
    totalFeeders: 0,
    totalBarangays: 0,
    activeInterruptions: 0,
    totalInterruptions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [feedersRes, barangaysRes, interruptionsRes] = await Promise.all([
          fetch("/api/v1/admin/feeder?limit=1"),
          fetch("/api/v1/admin/barangay?limit=1"),
          fetch("/api/v1/interruptions"),
        ]);

        if (feedersRes.ok) {
          const feedersData = await feedersRes.json();
          setStats((prev) => ({
            ...prev,
            totalFeeders: feedersData.pagination.total,
          }));
        }

        if (barangaysRes.ok) {
          const barangaysData = await barangaysRes.json();
          setStats((prev) => ({
            ...prev,
            totalBarangays: barangaysData.pagination.total,
          }));
        }

        if (interruptionsRes.ok) {
          const interruptionsData = await interruptionsRes.json();
          // Since /api/v1/interruptions returns active interruptions directly
          const activeCount = Array.isArray(interruptionsData)
            ? interruptionsData.length
            : 0;

          setStats((prev) => ({
            ...prev,
            activeInterruptions: activeCount,
            totalInterruptions: activeCount, // For now, use same value
          }));

          // Try to get total interruptions from admin endpoint if it exists
          try {
            const totalRes = await fetch("/api/v1/admin/interruption?limit=1");
            if (totalRes.ok) {
              const totalData = await totalRes.json();
              setStats((prev) => ({
                ...prev,
                totalInterruptions: totalData.pagination?.total || activeCount,
              }));
            }
          } catch {
            // If admin endpoint doesn't exist, keep using active count
          }
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Management Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage feeders, barangays, and power interruptions
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Feeders
              </CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded w-12 h-6"></div>
                ) : (
                  stats.totalFeeders
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Power distribution feeders
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Barangays
              </CardTitle>
              <Building className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded w-12 h-6"></div>
                ) : (
                  stats.totalBarangays
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Administrative divisions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Interruptions
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded w-12 h-6"></div>
                ) : (
                  stats.activeInterruptions
                )}
              </div>
              <p className="text-xs text-muted-foreground">Currently ongoing</p>
            </CardContent>
          </Card>

          <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Interruptions
              </CardTitle>
              <MapPin className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded w-12 h-6"></div>
                ) : (
                  stats.totalInterruptions
                )}
              </div>
              <p className="text-xs text-muted-foreground">All time records</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <Tabs defaultValue="feeders" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 bg-background/50">
                <TabsTrigger
                  value="feeders"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Feeders
                </TabsTrigger>
                <TabsTrigger
                  value="barangays"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Barangays
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              <TabsContent value="feeders" className="p-6 pt-0">
                <CreateFeederCard />
              </TabsContent>

              <TabsContent value="barangays" className="p-6 pt-0">
                <CreateBarangayCard />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
