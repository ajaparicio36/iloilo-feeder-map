"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Search, X } from "lucide-react";

interface NavBarProps {
  onBarangaySelect: (barangay: string | null) => void;
}

export default function NavBar({ onBarangaySelect }: NavBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [barangays, setBarangays] = useState<string[]>([]);
  const [filteredBarangays, setFilteredBarangays] = useState<string[]>([]);

  useEffect(() => {
    // Load barangay names from GeoJSON
    fetch("/barangay-data.json")
      .then((response) => response.json())
      .then((data) => {
        const names =
          data.features
            ?.map((f: any) => f.properties?.adm4_en)
            .filter(Boolean) || [];
        setBarangays(names.sort());
      })
      .catch((error) => console.error("Error loading barangay data:", error));
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = barangays.filter((barangay) =>
        barangay.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBarangays(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredBarangays([]);
    }
  }, [searchTerm, barangays]);

  const handleSearch = (barangay: string) => {
    setSearchTerm(barangay);
    onBarangaySelect(barangay);
    setFilteredBarangays([]);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onBarangaySelect(null);
    setFilteredBarangays([]);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-20 border-b border-white/10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-white font-bold text-sm">IM</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Iloilo Feeder Map
            </h1>
          </div>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink className="text-sm font-medium hover:text-primary cursor-pointer transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-accent/50">
                  About
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="relative w-96">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search barangays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-white/20 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearSearch}
                className="bg-background/50 backdrop-blur-sm border-white/20 hover:bg-accent/50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {filteredBarangays.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
              {filteredBarangays.map((barangay) => (
                <div
                  key={barangay}
                  className="px-4 py-3 hover:bg-accent/50 cursor-pointer text-sm transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl border-b border-white/10 last:border-b-0"
                  onClick={() => handleSearch(barangay)}
                >
                  {barangay}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
