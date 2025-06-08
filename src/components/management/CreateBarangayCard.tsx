"use client";

import { useState, useEffect } from "react";
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
import { Pencil, Trash2, Search, Plus } from "lucide-react";
import CreateBarangayForm from "./CreateBarangayForm";

interface Barangay {
  id: string;
  name: string;
  psgcId: string;
  _count: {
    FeederCoverage: number;
  };
}

export default function CreateBarangayCard() {
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBarangay, setEditingBarangay] = useState<Barangay | null>(null);

  const loadBarangays = async () => {
    try {
      const response = await fetch(
        `/api/v1/admin/barangay?search=${searchTerm}&limit=50`
      );
      if (!response.ok) throw new Error("Failed to load barangays");

      const data = await response.json();
      setBarangays(data.data);
    } catch {
      toast.error("Failed to load barangays");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBarangays();
  }, [searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/v1/admin/barangay/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete barangay");

      toast.success(`Barangay "${name}" deleted successfully`);

      loadBarangays();
    } catch {
      toast.error("Failed to delete barangay");
    }
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingBarangay(null);
    loadBarangays();
  };

  if (showCreateForm || editingBarangay) {
    return (
      <CreateBarangayForm
        initialData={editingBarangay || undefined}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingBarangay(null);
        }}
      />
    );
  }

  return (
    <Card className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Barangay Management
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage barangays in the system
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Barangay
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search barangays..."
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
            {barangays.map((barangay) => (
              <div
                key={barangay.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-white/10 hover:bg-background/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{barangay.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      PSGC: {barangay.psgcId}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {barangay._count.FeederCoverage} feeders
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingBarangay(barangay)}
                    className="bg-background/50 border-white/20 hover:bg-background/70"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(barangay.id, barangay.name)}
                    className="bg-destructive/80 hover:bg-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {barangays.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No barangays found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
