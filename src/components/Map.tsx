"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface BarangayData {
  adm1_psgc: string;
  adm2_psgc: string;
  adm3_psgc: string;
  adm4_psgc: string;
  adm4_en: string;
  geo_level: string;
  len_crs: number;
  area_crs: number;
  len_km: number;
  area_km2: number;
}

interface BarangayFeederData {
  id: string;
  name: string;
  psgcId: string;
  FeederCoverage: Array<{
    feeder: {
      id: string;
      name: string;
      interruptedFeeders: Array<{
        interruption: {
          id: string;
          description: string;
          startTime: string;
        } | null;
      }>;
    };
  }>;
}

interface InterruptionData {
  id: string;
  description: string;
  startTime: string;
  polygon?: any;
  customArea?: boolean;
  interruptedFeeders: Array<{
    feeder: {
      id: string;
      name: string;
      feederCoverage: Array<{
        barangay: {
          id: string;
          name: string;
          psgcId: string;
        };
      }>;
    };
  }>;
}

interface MapProps {
  selectedBarangay?: string | null;
  filters: { feeders: string[]; interruptions: string[] };
  geoData: any;
  barangayData: BarangayFeederData[];
}

// Function to fix encoding issues (same as in MapClient)
const fixEncoding = (text: string): string => {
  if (!text) return text;

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

export default function Map({
  selectedBarangay,
  filters,
  geoData,
  barangayData,
}: MapProps) {
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [clickedBarangayData, setClickedBarangayData] = useState<{
    geoData: BarangayData;
    feederData: BarangayFeederData | null;
  } | null>(null);
  const [interruptions, setInterruptions] = useState<InterruptionData[]>([]);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Iloilo City coordinates and bounds
  const center: [number, number] = [10.7202, 122.5621];

  // Define strict bounds for Iloilo City area
  const iloiloBounds = L.latLngBounds(
    L.latLng(10.65, 122.48), // Southwest corner
    L.latLng(10.78, 122.62) // Northeast corner
  );

  // Log barangay data when it changes for debugging
  useEffect(() => {
    if (barangayData && barangayData.length > 0) {
      console.log("Map: Received barangay data", {
        count: barangayData.length,
        sample: barangayData[0],
        samplePsgc: barangayData[0]?.psgcId,
        sampleName: barangayData[0]?.name,
      });
    }
  }, [barangayData]);

  useEffect(() => {
    if (selectedBarangay && geoData && mapRef) {
      // Find and zoom to selected barangay
      const feature = geoData.features?.find(
        (f: any) =>
          f.properties?.adm4_en?.toLowerCase() ===
          selectedBarangay.toLowerCase()
      );

      if (feature && feature.geometry) {
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        mapRef.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [selectedBarangay, geoData, mapRef]);

  const getBarangayFeederData = (psgcId: string) => {
    if (!barangayData || barangayData.length === 0) {
      console.log("No barangay data available");
      return null;
    }

    const found = barangayData.find((b) => b.psgcId === psgcId);

    if (!found && psgcId) {
      console.log(`No feeder data found for PSGC ID: ${psgcId}`);
      console.log(
        `Available PSGC IDs:`,
        barangayData.slice(0, 5).map((b) => b.psgcId)
      );

      // Try to find by name as fallback with encoding fix
      const nameFromGeo = geoData?.features?.find(
        (f: any) => f.properties?.adm4_psgc === psgcId
      )?.properties?.adm4_en;

      if (nameFromGeo) {
        const fixedNameFromGeo = fixEncoding(nameFromGeo);
        console.log(
          `Trying name fallback for: ${fixedNameFromGeo} (original: ${nameFromGeo})`
        );

        const foundByName = barangayData.find((b) => {
          const fixedDbName = fixEncoding(b.name);
          return fixedDbName.toLowerCase() === fixedNameFromGeo.toLowerCase();
        });

        if (foundByName) {
          console.log(
            `Found by name fallback: ${fixedNameFromGeo} -> ${foundByName.psgcId}`
          );
          return foundByName;
        } else {
          console.log(
            `Available names:`,
            barangayData.slice(0, 5).map((b) => fixEncoding(b.name))
          );
        }
      }
    }

    if (found) {
      console.log(`Found feeder data for ${psgcId}:`, {
        name: fixEncoding(found.name),
        feeders: found.FeederCoverage?.length || 0,
      });
    }

    return found || null;
  };

  const hasActiveInterruption = (feederData: BarangayFeederData) => {
    return feederData.FeederCoverage.some((coverage) =>
      coverage.feeder.interruptedFeeders.some(
        (interrupted) => interrupted.interruption
      )
    );
  };

  const isBarangayFiltered = (psgcId: string) => {
    const feederData = getBarangayFeederData(psgcId);
    if (!feederData) return false;

    // Check if any of the barangay's feeders are in the selected filters
    if (filters.feeders.length > 0) {
      const hasFilteredFeeder = feederData.FeederCoverage.some((coverage) =>
        filters.feeders.includes(coverage.feeder.id)
      );
      if (hasFilteredFeeder) return true;
    }

    // Check if any interruptions affect this barangay
    if (filters.interruptions.length > 0) {
      const hasFilteredInterruption = feederData.FeederCoverage.some(
        (coverage) =>
          coverage.feeder.interruptedFeeders.some(
            (interrupted) =>
              interrupted.interruption &&
              filters.interruptions.includes(interrupted.interruption.id)
          )
      );
      if (hasFilteredInterruption) return true;
    }

    return false;
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties && feature.properties.adm4_en) {
      const properties = feature.properties;
      const feederData = getBarangayFeederData(properties.adm4_psgc);
      const displayName = fixEncoding(properties.adm4_en);

      layer.bindPopup(
        `<div class="font-semibold text-sm">
          <strong class="text-primary">${displayName}</strong><br/>
          <span class="text-xs text-blue-400">
            ${feederData?.FeederCoverage?.length || 0} feeder(s)
          </span>
        </div>`,
        {
          className: "custom-popup",
        }
      );

      layer.on({
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 3,
            color: "#3b82f6",
            dashArray: "",
            fillOpacity: 0.6,
          });
          setHoveredBarangay(displayName);
        },
        mouseout: (e) => {
          if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle(e.target);
          }
          setHoveredBarangay(null);
        },
        click: (e) => {
          setClickedBarangayData({
            geoData: { ...properties, adm4_en: displayName },
            feederData: feederData,
          });
          if (mapRef) {
            const layer = L.geoJSON(feature);
            const bounds = layer.getBounds();
            mapRef.fitBounds(bounds, { padding: [50, 50] });
          }
        },
      });
    }
  };

  useEffect(() => {
    if (selectedBarangay && geoData && mapRef) {
      // Find and zoom to selected barangay (with encoding fix)
      const feature = geoData.features?.find((f: any) => {
        const featureName = fixEncoding(f.properties?.adm4_en || "");
        const searchName = fixEncoding(selectedBarangay);
        return featureName.toLowerCase() === searchName.toLowerCase();
      });

      if (feature && feature.geometry) {
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        mapRef.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [selectedBarangay, geoData, mapRef]);

  const getFeatureStyle = (feature: any) => {
    const properties = feature.properties;
    const feederData = getBarangayFeederData(properties.adm4_psgc);

    const isSelected =
      selectedBarangay &&
      fixEncoding(properties?.adm4_en || "").toLowerCase() ===
        fixEncoding(selectedBarangay).toLowerCase();

    const isHovered =
      hoveredBarangay === fixEncoding(properties?.adm4_en || "");
    const isFiltered = isBarangayFiltered(properties.adm4_psgc);
    const hasInterruption = feederData && hasActiveInterruption(feederData);

    if (isSelected) {
      return {
        fillColor: "#3b82f6",
        weight: 3,
        opacity: 1,
        color: "#1d4ed8",
        dashArray: "",
        fillOpacity: 0.7,
      };
    }

    if (isFiltered) {
      if (hasInterruption) {
        return {
          fillColor: "#ef4444",
          weight: 2,
          opacity: 1,
          color: "#dc2626",
          dashArray: "",
          fillOpacity: 0.6,
        };
      }
      return {
        fillColor: "#3b82f6",
        weight: 2,
        opacity: 1,
        color: "#2563eb",
        dashArray: "",
        fillOpacity: 0.5,
      };
    }

    if (isHovered) {
      return {
        fillColor: "#06b6d4",
        weight: 2,
        opacity: 1,
        color: "#0891b2",
        dashArray: "",
        fillOpacity: 0.5,
      };
    }

    // Default style - dimmed if filters are active but this barangay doesn't match
    const hasActiveFilters =
      filters.feeders.length > 0 || filters.interruptions.length > 0;

    return {
      fillColor: hasInterruption ? "#fbbf24" : "#10b981",
      weight: 1,
      opacity: hasActiveFilters ? 0.3 : 0.8,
      color: hasInterruption ? "#f59e0b" : "#059669",
      dashArray: "",
      fillOpacity: hasActiveFilters ? 0.1 : 0.3,
    };
  };

  // Load interruptions with polygon data
  useEffect(() => {
    const loadInterruptions = async () => {
      try {
        const response = await fetch("/api/v1/interruptions");
        const data = await response.json();
        setInterruptions(data);
        console.log("Loaded interruptions with polygon data:", data);
      } catch (error) {
        console.error("Error loading interruptions:", error);
      }
    };

    loadInterruptions();
  }, []);

  const renderInterruptionPolygons = () => {
    return interruptions
      .filter((interruption) => interruption.customArea && interruption.polygon)
      .map((interruption) => (
        <GeoJSON
          key={interruption.id}
          data={
            {
              type: "Feature",
              geometry: interruption.polygon as GeoJSON.Geometry,
              properties: {
                id: interruption.id,
                description: interruption.description,
                startTime: interruption.startTime,
              },
            } as GeoJSON.Feature
          }
          style={{
            fillColor: "#ef4444",
            weight: 2,
            opacity: 0.8,
            color: "#dc2626",
            dashArray: "5, 5",
            fillOpacity: 0.3,
          }}
          onEachFeature={(feature, layer) => {
            layer.bindPopup(
              `<div class="font-semibold text-sm">
                <strong class="text-red-500">Power Interruption</strong><br/>
                <span class="text-xs">${interruption.description}</span><br/>
                <span class="text-xs text-gray-500">
                  Started: ${new Date(interruption.startTime).toLocaleString()}
                </span>
              </div>`,
              { className: "custom-popup" }
            );
          }}
        />
      ));
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        minZoom={11}
        maxZoom={16}
        style={{ height: "100%", width: "100%" }}
        ref={setMapRef}
        className="z-10"
        maxBounds={iloiloBounds}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoData && (
          <GeoJSON
            ref={geoJsonRef}
            data={geoData}
            onEachFeature={onEachFeature}
            style={getFeatureStyle}
          />
        )}

        {/* Render custom interruption areas */}
        {renderInterruptionPolygons()}
      </MapContainer>

      {/* Enhanced Floating Info Widget */}
      {clickedBarangayData && (
        <div className="absolute top-4 left-4 z-30 w-96 bg-background/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
          {/* ...existing clickedBarangayData content... */}
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredBarangay && !clickedBarangayData && (
        <div className="absolute top-4 left-4 z-20 bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg px-4 py-2">
          <p className="text-sm font-medium">{hoveredBarangay}</p>
          <p className="text-xs text-muted-foreground">Click to view details</p>
        </div>
      )}
    </div>
  );
}
