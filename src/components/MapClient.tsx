"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import NavBar from "./NavBar";

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(() => import("./Map"), {
  ssr: false,
});

// Function to fix encoding issues
const fixEncoding = (text: string): string => {
  if (!text) return text;

  // Fix common encoding issues
  return text
    .replace(/Ã±/g, "ñ")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã¿/g, "ÿ")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã"/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã'/g, "Ñ");
};

export default function MapClient() {
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    feeders: string[];
    interruptions: string[];
  }>({
    feeders: [],
    interruptions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    geoData: false,
    barangayData: false,
    feederData: false,
    interruptionData: false,
  });

  // Store loaded data to pass to components
  const [geoData, setGeoData] = useState<any>(null);
  const [barangayNames, setBarangayNames] = useState<string[]>([]);
  const [barangayData, setBarangayData] = useState<any[]>([]);

  // Load all data immediately when component mounts
  useEffect(() => {
    console.log("MapClient: Starting to load all data immediately");

    const loadAllData = async () => {
      try {
        // Load GeoJSON data
        console.log("MapClient: Loading GeoJSON data...");
        const geoResponse = await fetch("/barangay-data.json");
        if (!geoResponse.ok) {
          throw new Error(`Failed to fetch GeoJSON: ${geoResponse.status}`);
        }
        const geoJsonData = await geoResponse.json();

        // Extract barangay names for search and fix encoding
        const names =
          geoJsonData.features
            ?.map((f: any) => {
              const name = f.properties?.adm4_en;
              return name ? fixEncoding(name) : null;
            })
            .filter(Boolean) || [];

        // Also fix encoding in the actual GeoJSON data
        if (geoJsonData.features) {
          geoJsonData.features.forEach((feature: any) => {
            if (feature.properties?.adm4_en) {
              feature.properties.adm4_en = fixEncoding(
                feature.properties.adm4_en
              );
            }
          });
        }

        setGeoData(geoJsonData);
        setBarangayNames(names.sort());
        console.log("MapClient: GeoJSON loaded successfully", {
          features: geoJsonData.features?.length,
          names: names.length,
          sampleNames: names.slice(0, 5),
        });
        updateLoadingState("geoData");

        // Load barangay data from API
        console.log("MapClient: Loading barangay data from API...");
        const barangayResponse = await fetch("/api/v1/barangays");
        if (!barangayResponse.ok) {
          throw new Error(
            `Failed to fetch barangay data: ${barangayResponse.status}`
          );
        }
        const barangayApiData = await barangayResponse.json();
        console.log("MapClient: Barangay data loaded successfully", {
          count: barangayApiData.length,
          sample: barangayApiData[0],
        });
        setBarangayData(barangayApiData);
        updateLoadingState("barangayData");

        // Load filter data
        console.log("MapClient: Loading filter data...");
        const [feedersRes, interruptionsRes] = await Promise.all([
          fetch("/api/v1/feeders"),
          fetch("/api/v1/interruptions"),
        ]);

        if (!feedersRes.ok || !interruptionsRes.ok) {
          throw new Error(
            `Failed to fetch filter data: ${feedersRes.status}, ${interruptionsRes.status}`
          );
        }

        const [feedersData, interruptionsData] = await Promise.all([
          feedersRes.json(),
          interruptionsRes.json(),
        ]);

        console.log("MapClient: Filter data loaded successfully", {
          feeders: feedersData.length,
          interruptions: interruptionsData.length,
        });

        updateLoadingState("feederData");
        updateLoadingState("interruptionData");
      } catch (error) {
        console.error("MapClient: Error loading data:", error);
        // Mark all as loaded even on error to prevent infinite loading
        updateLoadingState("geoData");
        updateLoadingState("barangayData");
        updateLoadingState("feederData");
        updateLoadingState("interruptionData");
      }
    };

    loadAllData();
  }, []);

  // Track loading progress
  useEffect(() => {
    const allLoaded = Object.values(loadingStates).every((state) => state);
    console.log("Loading states:", loadingStates, "All loaded:", allLoaded);

    if (allLoaded && isLoading) {
      // Add a small delay to prevent flashing
      setTimeout(() => {
        console.log("Setting loading to false");
        setIsLoading(false);
      }, 500);
    }
  }, [loadingStates, isLoading]);

  const updateLoadingState = (key: keyof typeof loadingStates) => {
    console.log(`Updating loading state: ${key} = true`);
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
        <div className="bg-background/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-white font-bold text-sm">IM</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Iloilo Feeder Map
              </h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                <p className="text-lg font-medium">Loading map data...</p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Geographic boundaries</span>
                  <span
                    className={loadingStates.geoData ? "text-green-500" : ""}
                  >
                    {loadingStates.geoData ? "✓" : "⏳"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Barangay information</span>
                  <span
                    className={
                      loadingStates.barangayData ? "text-green-500" : ""
                    }
                  >
                    {loadingStates.barangayData ? "✓" : "⏳"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Power feeders</span>
                  <span
                    className={loadingStates.feederData ? "text-green-500" : ""}
                  >
                    {loadingStates.feederData ? "✓" : "⏳"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Interruption data</span>
                  <span
                    className={
                      loadingStates.interruptionData ? "text-green-500" : ""
                    }
                  >
                    {loadingStates.interruptionData ? "✓" : "⏳"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <NavBar
        onBarangaySelect={setSelectedBarangay}
        onFilterChange={setFilters}
        barangayNames={barangayNames}
      />
      <div className="flex-1 pt-20">
        <Map
          selectedBarangay={selectedBarangay}
          filters={filters}
          geoData={geoData}
          barangayData={barangayData}
        />
      </div>
    </div>
  );
}
