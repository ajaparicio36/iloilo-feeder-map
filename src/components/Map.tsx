"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Ruler, Square } from "lucide-react";

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

interface MapProps {
  selectedBarangay?: string | null;
}

export default function Map({ selectedBarangay }: MapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [clickedBarangay, setClickedBarangay] = useState<BarangayData | null>(
    null
  );
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Iloilo City coordinates
  const center: [number, number] = [10.7202, 122.5621];

  useEffect(() => {
    // Load barangay data
    fetch("/barangay-data.json")
      .then((response) => response.json())
      .then((data) => setGeoData(data))
      .catch((error) => console.error("Error loading barangay data:", error));
  }, []);

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

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties && feature.properties.adm4_en) {
      const properties = feature.properties;

      layer.bindPopup(
        `<div class="font-semibold text-sm">
          <strong class="text-primary">${properties.adm4_en}</strong><br/>
          <span class="text-xs text-muted-foreground">Area: ${
            properties.area_km2?.toFixed(2) || "N/A"
          } km²</span>
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
          setHoveredBarangay(properties.adm4_en);
        },
        mouseout: (e) => {
          if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle(e.target);
          }
          setHoveredBarangay(null);
        },
        click: (e) => {
          setClickedBarangay(properties);
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
    const isSelected =
      selectedBarangay &&
      feature.properties?.adm4_en?.toLowerCase() ===
        selectedBarangay.toLowerCase();

    const isHovered = hoveredBarangay === feature.properties?.adm4_en;

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

    return {
      fillColor: "#10b981",
      weight: 1,
      opacity: 0.8,
      color: "#059669",
      dashArray: "",
      fillOpacity: 0.3,
    };
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        ref={setMapRef}
        className="z-10"
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
      </MapContainer>

      {/* Floating Info Widget */}
      {clickedBarangay && (
        <div className="absolute top-4 left-4 z-30 w-80 bg-background/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  {clickedBarangay.adm4_en}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Barangay Information
                </p>
              </div>
            </div>
            <button
              onClick={() => setClickedBarangay(null)}
              className="p-1 hover:bg-accent/50 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-accent/30 rounded-xl p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Square className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Area
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {clickedBarangay.area_km2?.toFixed(2) || "N/A"} km²
                </p>
              </div>
              <div className="bg-accent/30 rounded-xl p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Ruler className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Perimeter
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {clickedBarangay.len_km?.toFixed(2) || "N/A"} km
                </p>
              </div>
            </div>

            <div className="bg-accent/20 rounded-xl p-4">
              <h4 className="font-medium mb-3 text-sm">Administrative Codes</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Province:</span>
                  <span className="font-mono">{clickedBarangay.adm1_psgc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City:</span>
                  <span className="font-mono">{clickedBarangay.adm2_psgc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">District:</span>
                  <span className="font-mono">{clickedBarangay.adm3_psgc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barangay:</span>
                  <span className="font-mono">{clickedBarangay.adm4_psgc}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredBarangay && !clickedBarangay && (
        <div className="absolute top-4 left-4 z-20 bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg px-4 py-2">
          <p className="text-sm font-medium">{hoveredBarangay}</p>
          <p className="text-xs text-muted-foreground">Click to view details</p>
        </div>
      )}
    </div>
  );
}
