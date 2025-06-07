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
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold">Iloilo Feeder Map</h1>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink className="text-sm font-medium hover:text-primary cursor-pointer">
                  About
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="relative w-80">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search barangays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </div>

          {filteredBarangays.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredBarangays.map((barangay) => (
                <div
                  key={barangay}
                  className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
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
