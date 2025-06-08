"use client";

import { useEffect, useState, useRef, JSX } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BarangayDetailsPanel } from "./map/BarangayDetailsPanel";
import {
  MapProps,
  ClickedBarangayData,
  BarangayData,
  InterruptionData,
} from "@/types/map";
import {
  fixEncoding,
  hasActiveInterruption,
  getBarangayFeederData,
  isBarangayFiltered,
} from "@/utils/map-utils";

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

export default function Map({
  selectedBarangay,
  filters,
  geoData,
  barangayData,
  interruptions,
}: MapProps) {
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [clickedBarangayData, setClickedBarangayData] =
    useState<ClickedBarangayData | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Iloilo City coordinates and bounds
  const center: [number, number] = [10.7202, 122.5621];
  const iloiloBounds = L.latLngBounds(
    L.latLng(10.65, 122.48), // Southwest corner
    L.latLng(10.78, 122.62) // Northeast corner
  );

  useEffect(() => {
    if (selectedBarangay && geoData && mapRef) {
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

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties && feature.properties.adm4_en) {
      const properties = feature.properties;
      const feederData = getBarangayFeederData(
        properties.adm4_psgc,
        barangayData,
        geoData
      );
      const displayName = fixEncoding(properties.adm4_en);

      layer.bindPopup(
        `<div class="font-semibold text-sm">
          <strong class="text-primary">${displayName}</strong><br/>
          <span class="text-xs text-blue-400">
            ${feederData?.FeederCoverage?.length || 0} feeder(s)
          </span>
        </div>`,
        { className: "custom-popup" }
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

  const getFeatureStyle = (feature: any) => {
    const properties = feature.properties;
    const feederData = getBarangayFeederData(
      properties.adm4_psgc,
      barangayData,
      geoData
    );

    const isSelected =
      selectedBarangay &&
      fixEncoding(properties?.adm4_en || "").toLowerCase() ===
        fixEncoding(selectedBarangay).toLowerCase();

    const isHovered =
      hoveredBarangay === fixEncoding(properties?.adm4_en || "");
    const isFiltered = isBarangayFiltered(
      properties.adm4_psgc,
      filters,
      barangayData,
      geoData
    );
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

  const renderInterruptionPolygons = () => {
    if (!interruptions || interruptions.length === 0) {
      return null;
    }

    const filteredInterruptions =
      filters.interruptions.length > 0
        ? interruptions.filter((interruption) =>
            filters.interruptions.includes(interruption.id)
          )
        : interruptions;

    const polygonElements: JSX.Element[] = [];

    filteredInterruptions
      .filter((interruption) => interruption.customArea && interruption.polygon)
      .forEach((interruption, interruptionIndex) => {
        const displayDescription =
          interruption.description || "No extra description";
        const typeLabel =
          interruption.type?.charAt(0) +
            interruption.type?.slice(1).toLowerCase() || "Unknown";

        // Handle different polygon data structures
        let polygonsToRender: any[] = [];

        if (Array.isArray(interruption.polygon)) {
          // Array of polygon geometries
          polygonsToRender = interruption.polygon.map((geom, index) => ({
            geometry: geom,
            index,
          }));
        } else if (interruption.polygon.type === "FeatureCollection") {
          // GeoJSON FeatureCollection
          polygonsToRender = interruption.polygon.features.map(
            (feature: any, index: number) => ({
              geometry: feature.geometry,
              index,
            })
          );
        } else if (
          interruption.polygon.type === "Polygon" ||
          interruption.polygon.type === "MultiPolygon"
        ) {
          // Single polygon geometry
          polygonsToRender = [{ geometry: interruption.polygon, index: 0 }];
        }

        // Render each polygon
        polygonsToRender.forEach(({ geometry, index }) => {
          const endTimeDisplay = interruption.endTime
            ? `<span class="text-xs text-gray-500">
                 Ended: ${new Date(interruption.endTime).toLocaleString()}
               </span><br/>`
            : "";

          polygonElements.push(
            <GeoJSON
              key={`${interruption.id}-${index}`}
              data={
                {
                  type: "Feature",
                  geometry: geometry as GeoJSON.Geometry,
                  properties: {
                    id: interruption.id,
                    description: interruption.description,
                    startTime: interruption.startTime,
                    polygonIndex: index,
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
                    <strong class="text-red-500">${typeLabel} Power Interruption</strong><br/>
                    ${
                      polygonsToRender.length > 1
                        ? `<span class="text-xs text-blue-400">Area ${
                            index + 1
                          } of ${polygonsToRender.length}</span><br/>`
                        : ""
                    }
                    <span class="text-xs">${displayDescription}</span><br/>
                    <span class="text-xs text-gray-500">
                      Started: ${new Date(
                        interruption.startTime
                      ).toLocaleString()}
                    </span><br/>
                    ${endTimeDisplay}
                  </div>`,
                  { className: "custom-popup" }
                );
              }}
            />
          );
        });
      });

    return polygonElements;
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

        {renderInterruptionPolygons()}
      </MapContainer>

      {/* Barangay Details Panel */}
      <BarangayDetailsPanel
        data={clickedBarangayData}
        open={!!clickedBarangayData}
        onClose={() => setClickedBarangayData(null)}
      />

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
