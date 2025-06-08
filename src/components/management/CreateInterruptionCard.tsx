"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Pencil,
  Trash2,
  Search,
  Plus,
  Clock,
  AlertTriangle,
} from "lucide-react";
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
import CreateInterruptionForm from "./CreateInterruptionForm";

interface Interruption {
  id: string;
  startTime: string;
  endTime?: string | null;
  description?: string | null;
  type: string;
  customArea: boolean;
  interruptedFeeders: Array<{
    feeder: {
      id: string;
      name: string;
    };
  }>;
}

export default function CreateInterruptionCard() {
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInterruption, setEditingInterruption] =
    useState<Interruption | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    description: string;
  }>({ open: false, id: "", description: "" });

  const loadInterruptions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/admin/interruption?search=${searchTerm}&limit=50`
      );
      if (!response.ok) throw new Error("Failed to load interruptions");

      const data = await response.json();
      setInterruptions(data.data);
    } catch {
      toast.error("Failed to load interruptions");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadInterruptions();
  }, [searchTerm, loadInterruptions]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/admin/interruption/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete interruption");

      toast.success("Interruption deleted successfully");

      loadInterruptions();
    } catch {
      toast.error("Failed to delete interruption");
    } finally {
      setDeleteDialog({ open: false, id: "", description: "" });
    }
  };

  const handleEndNow = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/admin/interruption/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to end interruption");

      toast.success("Interruption ended successfully");

      loadInterruptions();
    } catch {
      toast.error("Failed to end interruption");
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingInterruption(null);
    loadInterruptions();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SCHEDULED":
        return "bg-blue-500/20 text-blue-400";
      case "UNSCHEDULED":
        return "bg-yellow-500/20 text-yellow-400";
      case "EMERGENCY":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (showCreateForm || editingInterruption) {
    return (
      <CreateInterruptionForm
        initialData={
          editingInterruption
            ? {
                id: editingInterruption.id,
                startTime: editingInterruption.startTime.slice(0, 16), // Format for datetime-local input
                endTime: editingInterruption.endTime?.slice(0, 16) || "",
                description: editingInterruption.description || "",
                type: editingInterruption.type,
                feederIds: editingInterruption.interruptedFeeders.map(
                  (f) => f.feeder.id
                ),
                customArea: editingInterruption.customArea,
              }
            : undefined
        }
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingInterruption(null);
        }}
      />
    );
  }

  return (
    <>
      <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Interruption Management
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage power interruptions in the system
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Interruption
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search interruptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-white/20 focus:border-primary/50"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {interruptions.map((interruption) => (
                <div
                  key={interruption.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-background/30 border border-white/10 hover:bg-background/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(interruption.type)}>
                        {interruption.type}
                      </Badge>
                      {interruption.customArea && (
                        <Badge variant="outline" className="text-xs">
                          Custom Area
                        </Badge>
                      )}
                      {!interruption.endTime && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    {interruption.description && (
                      <p className="text-sm font-medium">
                        {interruption.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Started: {formatDate(interruption.startTime)}</div>
                      {interruption.endTime && (
                        <div>Ended: {formatDate(interruption.endTime)}</div>
                      )}
                      <div>
                        {interruption.interruptedFeeders.length} feeders
                        affected
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {interruption.interruptedFeeders
                        .slice(0, 3)
                        .map((item) => (
                          <Badge
                            key={item.feeder.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {item.feeder.name}
                          </Badge>
                        ))}
                      {interruption.interruptedFeeders.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{interruption.interruptedFeeders.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {!interruption.endTime && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndNow(interruption.id)}
                        className="bg-background/50 border-white/20 hover:bg-background/70"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        End Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingInterruption(interruption)}
                      className="bg-background/50 border-white/20 hover:bg-background/70"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          id: interruption.id,
                          description:
                            interruption.description || "interruption",
                        })
                      }
                      className="bg-destructive/80 hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {interruptions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No interruptions found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interruption</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this interruption? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteDialog.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
