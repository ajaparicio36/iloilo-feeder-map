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
import { X, MapPin } from "lucide-react";
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
  const [polygon, setPolygon] = useState(initialData?.polygon || null);
  const [customArea, setCustomArea] = useState(
    initialData?.customArea || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [showMap, setShowMap] = useState(false);

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
          setFeeders(feedersData);
        }

        if (barangaysRes.ok) {
          const barangaysData = await barangaysRes.json();
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
    affectedBarangayPsgcs: string[]
  ) => {
    setPolygon(drawnPolygon);
    setCustomArea(true);

    // Find feeders that serve the affected barangays
    const affectedFeederIds = new Set<string>();

    try {
      // Get barangay data with feeder coverage
      const response = await fetch("/api/v1/barangays");
      if (response.ok) {
        const barangayData = await response.json();

        barangayData.forEach((barangay: any) => {
          if (affectedBarangayPsgcs.includes(barangay.psgcId)) {
            barangay.FeederCoverage?.forEach((coverage: any) => {
              affectedFeederIds.add(coverage.feeder.id);
            });
          }
        });
      }
    } catch (error) {
      console.error("Error loading affected feeders:", error);
    }

    // Add affected feeders to selection (but allow user to remove them)
    setSelectedFeederIds((prev) => [
      ...new Set([...prev, ...Array.from(affectedFeederIds)]),
    ]);
    setShowMap(false);

    toast.info(
      "Polygon drawn! Affected feeders have been added to the selection."
    );
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
          polygon,
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
      <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Draw Interruption Area
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Draw a polygon on the map to define the interruption area
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowMap(false)}
              className="bg-background/50 border-white/20 hover:bg-background/70"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AdminMapClient onPolygonDrawn={handlePolygonDrawn} />
          <p className="text-sm text-muted-foreground mt-4">
            Use the polygon tool in the top-right corner to draw the affected
            area.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {isEditing ? "Edit Interruption" : "Create New Interruption"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isEditing
            ? "Update interruption information"
            : "Create a new power interruption"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-medium">
                Start Time
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

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Interruption Type
            </Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger className="bg-background/50 border-white/20 focus:border-primary/50">
                <SelectValue placeholder="Select interruption type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="UNSCHEDULED">Unscheduled</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
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
              placeholder="Enter interruption description"
              rows={3}
              className="bg-background/50 border-white/20 focus:border-primary/50"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Affected Feeders</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMap(true)}
                className="bg-background/50 border-white/20 hover:bg-background/70"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Draw Area
              </Button>
            </div>

            {polygon && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm">Custom area defined</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPolygon(null);
                    setCustomArea(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {feeders.map((feeder) => (
                <div
                  key={feeder.id}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-background/30 border border-white/10"
                >
                  <Checkbox
                    id={feeder.id}
                    checked={selectedFeederIds.includes(feeder.id)}
                    onCheckedChange={() => handleFeederToggle(feeder.id)}
                  />
                  <Label htmlFor={feeder.id} className="flex-1 cursor-pointer">
                    {feeder.name}
                  </Label>
                </div>
              ))}
            </div>

            {selectedFeederIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFeederIds.map((feederId) => {
                  const feeder = feeders.find((f) => f.id === feederId);
                  return feeder ? (
                    <Badge key={feederId} variant="secondary">
                      {feeder.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeederToggle(feederId)}
                        className="ml-1 h-4 w-4 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !startTime ||
                !type ||
                selectedFeederIds.length === 0
              }
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
                className="bg-background/50 border-white/20 hover:bg-background/70"
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
