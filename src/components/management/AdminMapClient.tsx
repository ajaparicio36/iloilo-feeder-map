"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const AdminMap = dynamic(() => import("./AdminMap"), {
  ssr: false,
});

interface AdminMapClientProps {
  onPolygonDrawn?: (
    polygon: any,
    affectedBarangays: { psgcIds: string[]; names: string[] }
  ) => void;
  geoData?: any;
  existingPolygons?: any[];
}

export default function AdminMapClient({
  onPolygonDrawn,
  geoData: initialGeoData,
  existingPolygons = [],
}: AdminMapClientProps) {
  const [geoData, setGeoData] = useState<any>(initialGeoData || null);
  const [barangayData, setBarangayData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!initialGeoData);

  useEffect(() => {
    const loadData = async () => {
      try {
        const promises = [];

        // Load GeoJSON data if not provided
        if (!initialGeoData) {
          promises.push(
            fetch("/barangay-data.json").then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
              }
              const data = await response.json();
              console.log("Loaded GeoJSON data:", {
                type: data.type,
                featuresCount: data.features?.length || 0,
                sampleFeature: data.features?.[0],
              });
              return data;
            })
          );
        }

        // Load barangay data with feeder coverage
        promises.push(
          fetch("/api/v1/barangays").then(async (response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch barangays: ${response.status}`);
            }
            const data = await response.json();
            console.log("Loaded barangay data:", {
              count: data.length,
              sampleBarangay: data[0],
              withCoverage: data.filter(
                (b: any) => b.FeederCoverage?.length > 0
              ).length,
            });
            return data;
          })
        );

        const results = await Promise.all(promises);

        if (!initialGeoData) {
          setGeoData(results[0]);
          setBarangayData(results[1]);
        } else {
          setBarangayData(results[0]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [initialGeoData]);

  // Enhanced polygon drawn handler that uses loaded barangay data
  const handlePolygonDrawn = (
    polygon: any,
    affectedBarangays: { psgcIds: string[]; names: string[] }
  ) => {
    if (onPolygonDrawn) {
      onPolygonDrawn(polygon, affectedBarangays);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background/50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <AdminMap
        geoData={geoData}
        barangayData={barangayData}
        onPolygonDrawn={handlePolygonDrawn}
        existingPolygons={existingPolygons}
      />
    </div>
  );
}
