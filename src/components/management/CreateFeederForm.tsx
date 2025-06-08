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

interface FeederData {
  id?: string;
  name: string;
}

interface CreateFeederFormProps {
  initialData?: FeederData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateFeederForm({
  initialData,
  onSuccess,
  onCancel,
}: CreateFeederFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!initialData?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing
        ? `/api/v1/admin/feeder/${initialData.id}`
        : "/api/v1/admin/feeder";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save feeder");
      }

      toast.success(
        isEditing
          ? "Feeder updated successfully"
          : "Feeder created successfully"
      );

      if (!isEditing) {
        setName("");
      }

      onSuccess?.();
    } catch {
      toast.error("Failed to save feeder");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {isEditing ? "Edit Feeder" : "Create New Feeder"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isEditing
            ? "Update feeder information"
            : "Add a new power feeder to the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Feeder Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter feeder name"
              required
              className="bg-background/50 border-white/20 focus:border-primary/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading
                ? "Saving..."
                : isEditing
                ? "Update Feeder"
                : "Create Feeder"}
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
