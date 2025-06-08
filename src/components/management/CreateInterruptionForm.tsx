"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, Layers, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import AdminMapClient from "./AdminMapClient";

interface Feeder {
  id: string;
  name: string;
}

interface Barangay {
  id: string;
  name: string;
  psgcId: string;
  FeederCoverage?: Array<{
    feeder: {
      id: string;
      name: string;
    };
  }>;
}

interface InterruptionData {
  id?: string;
  startTime: string;
  endTime?: string | null;
  description?: string | null;
  type: string;
  feederIds: string[];
  polygon?: any;
  customArea?: boolean;
}

interface CreateInterruptionFormProps {
  initialData?: InterruptionData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateInterruptionForm({
  initialData,
  onSuccess,
  onCancel,
}: CreateInterruptionFormProps) {
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [endTime, setEndTime] = useState(initialData?.endTime || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [type, setType] = useState(initialData?.type || "");
  const [selectedFeederIds, setSelectedFeederIds] = useState<string[]>(
    initialData?.feederIds || []
  );

  // Handle initial polygon data - convert to array format
  const [polygons, setPolygons] = useState<any[]>(() => {
    if (!initialData?.polygon) return [];

    // Handle different polygon data structures
    if (Array.isArray(initialData.polygon)) {
      return initialData.polygon;
    } else if (initialData.polygon.type === "FeatureCollection") {
      return initialData.polygon.features.map(
        (feature: any) => feature.geometry
      );
    } else if (
      initialData.polygon.type === "Polygon" ||
      initialData.polygon.type === "MultiPolygon"
    ) {
      return [initialData.polygon];
    }

    return [];
  });

  const [customArea, setCustomArea] = useState(
    initialData?.customArea || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [feederSearchTerm, setFeederSearchTerm] = useState("");

  const isEditing = !!initialData?.id;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [feedersRes, barangaysRes] = await Promise.all([
          fetch("/api/v1/feeders"),
          fetch("/api/v1/barangays"),
        ]);

        if (feedersRes.ok) {
          const feedersData = await feedersRes.json();
          // Sort feeders alphabetically
          const sortedFeeders = feedersData.sort((a: Feeder, b: Feeder) =>
            a.name.localeCompare(b.name)
          );
          setFeeders(sortedFeeders);
        }

        if (barangaysRes.ok) {
          const barangaysData = await barangaysRes.json();
          console.log("Loaded barangays in form:", {
            total: barangaysData.length,
            withFeeders: barangaysData.filter(
              (b: Barangay) => b.FeederCoverage && b.FeederCoverage.length > 0
            ).length,
            sampleBarangay: barangaysData.find(
              (b: Barangay) => b.FeederCoverage && b.FeederCoverage.length > 0
            ),
          });
          setBarangays(barangaysData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const handlePolygonDrawn = async (
    drawnPolygon: any,
    affectedBarangays: { psgcIds: string[]; names: string[] }
  ) => {
    // Add to polygons array instead of replacing
    setPolygons((prev) => [...prev, drawnPolygon]);
    setCustomArea(true);

    console.log("=== Polygon Drawn Handler ===");
    console.log("Drawn polygon:", drawnPolygon);
    console.log("Affected barangay PSGCs:", affectedBarangays.psgcIds);
    console.log("Affected barangay names:", affectedBarangays.names);
    console.log("Available barangays in state:", barangays.length);

    // Debug: Show some sample barangay data
    const sampleBarangay = barangays.find(
      (b) => b.FeederCoverage && b.FeederCoverage.length > 0
    );
    console.log("Sample barangay with feeders:", sampleBarangay);

    // Find feeders that serve the affected barangays
    const affectedFeederIds = new Set<string>();
    const matchedBarangays: string[] = [];
    const debugMatches: any[] = [];

    // Use the barangays state that was loaded during initialization
    barangays.forEach((barangay) => {
      // Try to match by PSGC ID first, then by name as fallback
      const isAffectedByPsgc = affectedBarangays.psgcIds.includes(
        barangay.psgcId
      );
      const isAffectedByName = affectedBarangays.names.some(
        (name) =>
          name.toLowerCase().includes(barangay.name.toLowerCase()) ||
          barangay.name.toLowerCase().includes(name.toLowerCase())
      );

      const isAffected = isAffectedByPsgc || isAffectedByName;

      if (isAffected) {
        const matchType = isAffectedByPsgc ? "PSGC" : "Name";
        console.log(
          `✓ Match found for ${barangay.name} (PSGC: ${barangay.psgcId}) via ${matchType}`
        );
        console.log(`  - Feeder coverage:`, barangay.FeederCoverage);

        matchedBarangays.push(barangay.name);

        const debugMatch = {
          barangay: barangay.name,
          psgcId: barangay.psgcId,
          matchType: matchType,
          feeders: barangay.FeederCoverage?.map((c) => c.feeder.name) || [],
        };
        debugMatches.push(debugMatch);

        barangay.FeederCoverage?.forEach((coverage) => {
          console.log(
            `  - Adding feeder: ${coverage.feeder.name} (${coverage.feeder.id})`
          );
          affectedFeederIds.add(coverage.feeder.id);
        });
      }
    });

    console.log("Debug matches:", debugMatches);
    console.log("Matched barangays:", matchedBarangays);
    console.log("Affected feeder IDs:", Array.from(affectedFeederIds));

    // Add affected feeders to selection (but allow user to remove them)
    setSelectedFeederIds((prev) => {
      const newSelection = [
        ...new Set([...prev, ...Array.from(affectedFeederIds)]),
      ];
      console.log("Updated feeder selection:", newSelection);
      return newSelection;
    });

    const affectedFeederNames = Array.from(affectedFeederIds)
      .map((id) => feeders.find((f) => f.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3);

    if (affectedFeederIds.size > 0) {
      toast.success(
        `Polygon drawn! Found ${
          matchedBarangays.length
        } barangays, auto-selected ${
          affectedFeederIds.size
        } feeders: ${affectedFeederNames.join(", ")}${
          affectedFeederIds.size > 3 ? "..." : ""
        }`
      );
    } else if (matchedBarangays.length > 0) {
      toast.warning(
        `Polygon drawn! Found ${
          matchedBarangays.length
        } barangays (${matchedBarangays.join(
          ", "
        )}) but no feeders are configured for these areas. Please check the feeder coverage configuration.`
      );
    } else {
      // Show detailed debugging info
      console.log("No matches found. Debug info:");
      console.log(
        "Sample database barangay names:",
        barangays.slice(0, 10).map((b) => ({ name: b.name, psgc: b.psgcId }))
      );
      console.log(
        "GeoJSON barangay names from polygon:",
        affectedBarangays.names.slice(0, 10)
      );

      toast.info(
        `Polygon drawn! Checked ${affectedBarangays.psgcIds.length} barangay areas but no matches found. The barangay names or PSGC IDs might not match between the GeoJSON file and database. Check console for details.`
      );
    }
  };

  const handleRemovePolygon = (index: number) => {
    setPolygons((prev) => prev.filter((_, i) => i !== index));
    if (polygons.length === 1) {
      setCustomArea(false);
    }
  };

  const handleFeederToggle = (feederId: string) => {
    setSelectedFeederIds((prev) =>
      prev.includes(feederId)
        ? prev.filter((id) => id !== feederId)
        : [...prev, feederId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing
        ? `/api/v1/admin/interruption/${initialData.id}`
        : "/api/v1/admin/interruption";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime,
          endTime: endTime || null,
          description: description || null,
          type,
          feederIds: selectedFeederIds,
          polygon: polygons.length > 0 ? polygons : null,
          customArea,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save interruption");
      }

      toast.success(
        isEditing
          ? "Interruption updated successfully"
          : "Interruption created successfully"
      );

      onSuccess?.();
    } catch {
      toast.error("Failed to save interruption");
    } finally {
      setIsLoading(false);
    }
  };

  if (showMap) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="h-full flex flex-col">
          {/* Map Header */}
          <div className="bg-background/95 backdrop-blur-xl border-b border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMap(false)}
                  className="bg-background/50 border-white/20 hover:bg-background/70"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Form
                </Button>
                <div>
                  <h2 className="text-xl font-bold">Draw Interruption Areas</h2>
                  <p className="text-sm text-muted-foreground">
                    Use the polygon tool to draw multiple affected areas
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Layers className="w-3 h-3" />
                  <span>{polygons.length} polygons drawn</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Map Content */}
          <div className="flex-1">
            <AdminMapClient
              onPolygonDrawn={handlePolygonDrawn}
              existingPolygons={polygons}
            />
          </div>

          {/* Map Footer */}
          <div className="bg-background/95 backdrop-blur-xl border-t border-white/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Click the polygon tool (□) in the top-right corner to draw
                areas. You can draw multiple polygons.
              </p>
              <Button
                onClick={() => setShowMap(false)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Done Drawing
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter feeders based on search term
  const filteredFeeders = feeders.filter((feeder) =>
    feeder.name.toLowerCase().includes(feederSearchTerm.toLowerCase())
  );

  return (
    <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {isEditing ? "Edit Interruption" : "Create New Interruption"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isEditing
            ? "Update interruption information"
            : "Create a new power interruption with affected areas and feeders"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Date and Time Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Schedule Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Start Time *
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="bg-background/50 border-white/20 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">
                  End Time (Optional)
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-background/50 border-white/20 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Type and Description Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Interruption Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Interruption Type *
                </Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger className="bg-background/50 border-white/20 focus:border-primary/50">
                    <SelectValue placeholder="Select interruption type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">
                      Scheduled Maintenance
                    </SelectItem>
                    <SelectItem value="UNSCHEDULED">
                      Unscheduled Outage
                    </SelectItem>
                    <SelectItem value="EMERGENCY">Emergency Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed description of the interruption..."
                  rows={3}
                  className="bg-background/50 border-white/20 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Affected Areas Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Affected Areas
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMap(true)}
                className="bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Draw Areas on Map
              </Button>
            </div>

            {polygons.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {polygons.length} custom area{polygons.length > 1 ? "s" : ""}{" "}
                  defined:
                </p>
                <div className="flex flex-wrap gap-2">
                  {polygons.map((_, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="w-3 h-3" />
                      Area {index + 1}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePolygon(index)}
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Affected Feeders Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Affected Feeders *
              </h3>
              <div className="text-sm text-muted-foreground">
                {selectedFeederIds.length} of {feeders.length} selected
              </div>
            </div>

            {/* Feeder Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search feeders..."
                value={feederSearchTerm}
                onChange={(e) => setFeederSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-white/20 focus:border-primary/50"
              />
            </div>

            {/* Feeder List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
              {filteredFeeders.map((feeder) => (
                <div
                  key={feeder.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-background/30 border border-white/10 hover:bg-background/50 transition-colors"
                >
                  <Checkbox
                    id={feeder.id}
                    checked={selectedFeederIds.includes(feeder.id)}
                    onCheckedChange={() => handleFeederToggle(feeder.id)}
                  />
                  <Label
                    htmlFor={feeder.id}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {feeder.name}
                  </Label>
                </div>
              ))}
            </div>

            {/* No results message */}
            {filteredFeeders.length === 0 && feederSearchTerm && (
              <div className="text-center py-4 text-muted-foreground">
                No feeders found matching &quot;{feederSearchTerm}&quot;
              </div>
            )}

            {/* Selected Feeders Display */}
            {selectedFeederIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Selected Feeders ({selectedFeederIds.length}):
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedFeederIds.map((feederId) => {
                    const feeder = feeders.find((f) => f.id === feederId);
                    return feeder ? (
                      <Badge
                        key={feederId}
                        variant="default"
                        className="flex items-center gap-1"
                      >
                        {feeder.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeederToggle(feederId)}
                          className="h-4 w-4 p-0 hover:bg-background/20"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Section */}
          <div className="flex gap-3 pt-6 border-t border-white/20">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !startTime ||
                !type ||
                selectedFeederIds.length === 0
              }
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12 text-base font-medium"
            >
              {isLoading
                ? "Saving..."
                : isEditing
                ? "Update Interruption"
                : "Create Interruption"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="bg-background/50 border-white/20 hover:bg-background/70 h-12 px-8"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
