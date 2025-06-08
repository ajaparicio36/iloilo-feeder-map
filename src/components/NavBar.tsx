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
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import FilterAccordion from "./FilterAccordion";

interface NavBarProps {
  onBarangaySelect: (barangay: string | null) => void;
  onFilterChange: (filters: {
    feeders: string[];
    interruptions: string[];
  }) => void;
  barangayNames: string[];
}

export default function NavBar({
  onBarangaySelect,
  onFilterChange,
  barangayNames,
}: NavBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBarangays, setFilteredBarangays] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const filtered = barangayNames.filter((barangay) =>
        barangay.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBarangays(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredBarangays([]);
    }
  }, [searchTerm, barangayNames]);

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
    <>
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

          <div className="flex items-center space-x-4">
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

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-background/50 backdrop-blur-sm border-white/20 hover:bg-accent/50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Filter Accordion */}
      {showFilters && (
        <div className="fixed top-24 right-6 z-50">
          <FilterAccordion onFilterChange={onFilterChange} />
        </div>
      )}
    </>
  );
}
