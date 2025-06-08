"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Feeder {
  id: string;
  name: string;
  _count: {
    feederCoverage: number;
    activeInterruptions: number;
  };
}

interface Coverage {
  id: string;
  barangay: {
    id: string;
    name: string;
    psgcId: string;
  };
}

interface Barangay {
  id: string;
  name: string;
  psgcId: string;
}

interface FeederDetailsCardProps {
  feederId: string;
  onBack: () => void;
}

export default function FeederDetailsCard({
  feederId,
  onBack,
}: FeederDetailsCardProps) {
  const [feeder, setFeeder] = useState<Feeder | null>(null);
  const [coverage, setCoverage] = useState<Coverage[]>([]);
  const [availableBarangays, setAvailableBarangays] = useState<Barangay[]>([]);
  const [selectedBarangayId, setSelectedBarangayId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCoverage, setIsAddingCoverage] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    coverageId: string;
    barangayName: string;
  }>({ open: false, coverageId: "", barangayName: "" });

  const loadFeederDetails = async () => {
    try {
      const [feederRes, coverageRes] = await Promise.all([
        fetch(`/api/v1/admin/feeder/${feederId}`),
        fetch(`/api/v1/admin/feeder/${feederId}/coverage`),
      ]);

      if (feederRes.ok) {
        const feederData = await feederRes.json();
        setFeeder(feederData.data);
      }

      if (coverageRes.ok) {
        const coverageData = await coverageRes.json();
        setCoverage(coverageData.coverage);
        setAvailableBarangays(coverageData.availableBarangays);
      }
    } catch {
      toast.error("Failed to load feeder details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeederDetails();
  }, [feederId]);

  const handleAddCoverage = async () => {
    if (!selectedBarangayId) {
      toast.error("Please select a barangay");
      return;
    }

    setIsAddingCoverage(true);
    try {
      const response = await fetch(
        `/api/v1/admin/feeder/${feederId}/coverage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barangayId: selectedBarangayId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add coverage");
      }

      toast.success("Coverage added successfully");
      setSelectedBarangayId("");
      setOpen(false);
      loadFeederDetails();
    } catch (error: any) {
      toast.error(error.message || "Failed to add coverage");
    } finally {
      setIsAddingCoverage(false);
    }
  };

  const handleRemoveCoverage = async (
    coverageId: string,
    barangayName: string
  ) => {
    try {
      const response = await fetch(
        `/api/v1/admin/feeder/${feederId}/coverage/${coverageId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to remove coverage");

      toast.success("Coverage removed successfully");
      loadFeederDetails();
    } catch {
      toast.error("Failed to remove coverage");
    } finally {
      setDeleteDialog({ open: false, coverageId: "", barangayName: "" });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  if (!feeder) {
    return (
      <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Feeder not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feeders
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="bg-background/50 border-white/20 hover:bg-background/70"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {feeder.name}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage feeder coverage areas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{coverage.length} barangays</Badge>
              <Badge
                variant={
                  feeder._count.activeInterruptions === 0
                    ? "default"
                    : "destructive"
                }
              >
                {feeder._count.activeInterruptions} active interruptions
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Coverage Section */}
          <div className="p-4 rounded-lg bg-background/30 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between bg-background/50 border-white/20 hover:bg-background/70"
                    >
                      {selectedBarangayId
                        ? availableBarangays.find(
                            (barangay) => barangay.id === selectedBarangayId
                          )?.name
                        : "Select barangay to add coverage..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background/95 backdrop-blur-xl border border-white/20">
                    <Command>
                      <CommandInput
                        placeholder="Search barangays..."
                        className="border-none focus:ring-0"
                      />
                      <CommandEmpty>No barangay found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {availableBarangays.map((barangay) => (
                          <CommandItem
                            key={barangay.id}
                            value={`${barangay.name} ${barangay.psgcId}`}
                            onSelect={() => {
                              setSelectedBarangayId(barangay.id);
                              setOpen(false);
                            }}
                            className="cursor-pointer hover:bg-background/50"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedBarangayId === barangay.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{barangay.name}</span>
                              <span className="text-xs text-muted-foreground">
                                PSGC: {barangay.psgcId}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={handleAddCoverage}
                disabled={!selectedBarangayId || isAddingCoverage}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAddingCoverage ? "Adding..." : "Add Coverage"}
              </Button>
            </div>
            {availableBarangays.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                All barangays are already covered by this feeder
              </p>
            )}
          </div>

          {/* Coverage List */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Coverage Areas ({coverage.length})
            </h3>
            {coverage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No coverage areas assigned
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {coverage.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/20 border border-white/10 hover:bg-background/30 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium">{item.barangay.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        PSGC: {item.barangay.psgcId}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          coverageId: item.id,
                          barangayName: item.barangay.name,
                        })
                      }
                      className="bg-destructive/80 hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Coverage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove coverage for{" "}
              <span className="font-semibold">{deleteDialog.barangayName}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleRemoveCoverage(deleteDialog.coverageId, deleteDialog.barangayName)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
