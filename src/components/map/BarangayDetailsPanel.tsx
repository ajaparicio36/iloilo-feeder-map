"use client";

import { MapPin, Zap, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ClickedBarangayData } from "@/types/map";
import { hasActiveInterruption } from "@/utils/map-utils";

interface BarangayDetailsPanelProps {
  data: ClickedBarangayData | null;
  open: boolean;
  onClose: () => void;
}

export function BarangayDetailsPanel({
  data,
  open,
  onClose,
}: BarangayDetailsPanelProps) {
  if (!data) return null;

  const { geoData, feederData } = data;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] overflow-y-auto p-4"
      >
        <SheetHeader>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <SheetTitle>Barangay Details</SheetTitle>
          </div>
          <SheetDescription>
            Information about {geoData.adm4_en} and its power infrastructure
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="font-semibold text-xl text-primary mb-3">
              {geoData.adm4_en}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">PSGC Code:</span>
                <p className="font-medium">{geoData.adm4_psgc}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Area:</span>
                <p className="font-medium">
                  {geoData.area_km2?.toFixed(2)} km²
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Perimeter:</span>
                <p className="font-medium">{geoData.len_km?.toFixed(2)} km</p>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>
                <p className="font-medium capitalize">{geoData.geo_level}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Power Feeders Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <h5 className="font-semibold">Power Feeders</h5>
              </div>
              <Badge
                variant="secondary"
                className="bg-blue-500/20 text-blue-400"
              >
                {feederData?.FeederCoverage?.length || 0}
              </Badge>
            </div>

            {feederData?.FeederCoverage?.length ? (
              <div className="space-y-3">
                {feederData.FeederCoverage.map((coverage) => {
                  const feeder = coverage.feeder;
                  if (!feeder) return null;

                  const interruptedFeeders = feeder.interruptedFeeders || [];
                  const hasInterruption = interruptedFeeders.some(
                    (interrupted) => interrupted.interruption
                  );
                  const activeInterruptions = interruptedFeeders
                    .filter((interrupted) => interrupted.interruption)
                    .map((interrupted) => interrupted.interruption!);

                  return (
                    <Card
                      key={feeder.id}
                      className={`transition-colors ${
                        hasInterruption
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-muted/50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Zap
                              className={`w-4 h-4 ${
                                hasInterruption
                                  ? "text-yellow-500"
                                  : "text-blue-500"
                              }`}
                            />
                            <span className="font-medium text-sm">
                              {feeder.name}
                            </span>
                          </div>
                          {hasInterruption ? (
                            <Badge
                              variant="outline"
                              className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10 text-xs"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Interrupted
                            </Badge>
                          ) : (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Active</span>
                            </div>
                          )}
                        </div>

                        {hasInterruption && (
                          <div className="mt-3 space-y-2">
                            {activeInterruptions.map((interruption) => (
                              <Alert
                                key={interruption.id}
                                className="border-yellow-500/20 bg-yellow-500/5"
                              >
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                <AlertDescription>
                                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                    Power Interruption Active
                                  </p>
                                  <p className="text-xs text-yellow-700 dark:text-yellow-300/80 mb-1">
                                    {interruption.description ||
                                      "No additional details"}
                                  </p>
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400/60">
                                    Started:{" "}
                                    {new Date(
                                      interruption.startTime
                                    ).toLocaleString()}
                                  </p>
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="text-center py-8">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No feeder information available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This barangay may not be covered by the power grid data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Power Status Summary */}
          {feederData?.FeederCoverage?.length && (
            <>
              <Separator />

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="w-4 h-4 text-primary" />
                  <h5 className="font-semibold">Power Status Summary</h5>
                </div>

                {feederData && hasActiveInterruption(feederData) ? (
                  <Alert className="border-yellow-500/30 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription>
                      <span className="font-medium text-sm text-yellow-800 dark:text-yellow-200 block mb-2">
                        Power Interruption Detected
                      </span>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300/80">
                        This barangay is currently experiencing power
                        interruptions. Some areas may be without electricity.
                      </p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-500/30 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <span className="font-medium text-sm text-green-800 dark:text-green-200 block mb-2">
                        Normal Operation
                      </span>
                      <p className="text-xs text-green-700 dark:text-green-300/80">
                        All power feeders serving this barangay are operating
                        normally.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
