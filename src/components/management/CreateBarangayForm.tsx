"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface BarangayData {
  id?: string;
  name: string;
  psgcId: string;
}

interface CreateBarangayFormProps {
  initialData?: BarangayData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateBarangayForm({
  initialData,
  onSuccess,
  onCancel,
}: CreateBarangayFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [psgcId, setPsgcId] = useState(initialData?.psgcId || "");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!initialData?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing
        ? `/api/v1/admin/barangay/${initialData.id}`
        : "/api/v1/admin/barangay";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, psgcId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save barangay");
      }

      toast.success(
        isEditing
          ? "Barangay updated successfully"
          : "Barangay created successfully"
      );

      if (!isEditing) {
        setName("");
        setPsgcId("");
      }

      onSuccess?.();
    } catch {
      toast.error("Failed to save barangay");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {isEditing ? "Edit Barangay" : "Create New Barangay"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isEditing
            ? "Update barangay information"
            : "Add a new barangay to the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Barangay Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter barangay name"
              required
              className="bg-background/50 border-white/20 focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="psgcId" className="text-sm font-medium">
              PSGC ID
            </Label>
            <Input
              id="psgcId"
              type="text"
              value={psgcId}
              onChange={(e) => setPsgcId(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter PSGC ID (numbers only)"
              required
              className="bg-background/50 border-white/20 focus:border-primary/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !psgcId.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading
                ? "Saving..."
                : isEditing
                ? "Update Barangay"
                : "Create Barangay"}
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
