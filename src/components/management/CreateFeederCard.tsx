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
import { Pencil, Trash2, Search, Plus, MapPin } from "lucide-react";
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
import CreateFeederForm from "./CreateFeederForm";
import FeederDetailsCard from "./FeederDetailsCard";

interface Feeder {
  id: string;
  name: string;
  _count: {
    feederCoverage: number;
    activeInterruptions: number;
  };
}

export default function CreateFeederCard() {
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFeeder, setEditingFeeder] = useState<Feeder | null>(null);
  const [viewingFeederId, setViewingFeederId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });

  const loadFeeders = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/admin/feeder?search=${searchTerm}&limit=50`
      );
      if (!response.ok) throw new Error("Failed to load feeders");

      const data = await response.json();
      setFeeders(data.data);
    } catch {
      toast.error("Failed to load feeders");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadFeeders();
  }, [searchTerm, loadFeeders]);

  const handleDelete = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/v1/admin/feeder/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete feeder");

      toast.success(`Feeder "${name}" deleted successfully`);

      loadFeeders();
    } catch {
      toast.error("Failed to delete feeder");
    } finally {
      setDeleteDialog({ open: false, id: "", name: "" });
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingFeeder(null);
    loadFeeders();
  };

  if (viewingFeederId) {
    return (
      <FeederDetailsCard
        feederId={viewingFeederId}
        onBack={() => setViewingFeederId(null)}
      />
    );
  }

  if (showCreateForm || editingFeeder) {
    return (
      <CreateFeederForm
        initialData={editingFeeder || undefined}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingFeeder(null);
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
                Feeder Management
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage power feeders in the system
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Feeder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search feeders..."
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
              {feeders.map((feeder) => (
                <div
                  key={feeder.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-white/10 hover:bg-background/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{feeder.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {feeder._count.feederCoverage} barangays
                      </Badge>
                      <Badge
                        variant={
                          feeder._count.activeInterruptions === 0
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {feeder._count.activeInterruptions} active interruptions
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingFeederId(feeder.id)}
                      className="bg-background/50 border-white/20 hover:bg-background/70"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingFeeder(feeder)}
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
                          id: feeder.id,
                          name: feeder.name,
                        })
                      }
                      className="bg-destructive/80 hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {feeders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No feeders found
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
            <AlertDialogTitle>Delete Feeder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                &quot;{deleteDialog.name}&quot;
              </span>
              ? This action cannot be undone and will remove all associated
              coverage areas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteDialog.id, deleteDialog.name)}
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
