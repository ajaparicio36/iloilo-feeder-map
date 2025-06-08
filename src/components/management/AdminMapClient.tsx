"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const AdminMap = dynamic(() => import("./AdminMap"), {
  ssr: false,
});

interface AdminMapClientProps {
  onPolygonDrawn?: (polygon: any, affectedBarangays: string[]) => void;
  geoData?: any;
  existingPolygons?: any[];
}

export default function AdminMapClient({
  onPolygonDrawn,
  geoData: initialGeoData,
  existingPolygons = [],
}: AdminMapClientProps) {
  const [geoData, setGeoData] = useState<any>(initialGeoData || null);
  const [isLoading, setIsLoading] = useState(!initialGeoData);

  useEffect(() => {
    if (!initialGeoData) {
      const loadGeoData = async () => {
        try {
          const response = await fetch("/barangay-data.json");
          if (!response.ok) {
            throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
          }
          const data = await response.json();
          setGeoData(data);
        } catch (error) {
          console.error("Error loading geo data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadGeoData();
    }
  }, [initialGeoData]);

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
        onPolygonDrawn={onPolygonDrawn}
        existingPolygons={existingPolygons}
      />
    </div>
  );
}
