"use client";

import { useEffect, useState } from "react";
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

interface MapProps {
  selectedBarangay?: string | null;
}

export default function Map({ selectedBarangay }: MapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  // Iloilo City coordinates
  const center: [number, number] = [10.7202, 122.5621];

  useEffect(() => {
    // Load barangay data
    fetch("/lib/barangay-data.json")
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
      layer.bindPopup(`<strong>${feature.properties.adm4_en}</strong>`);
    }
  };

  const getFeatureStyle = (feature: any) => {
    const isSelected =
      selectedBarangay &&
      feature.properties?.adm4_en?.toLowerCase() ===
        selectedBarangay.toLowerCase();

    return {
      fillColor: isSelected ? "#3b82f6" : "#10b981",
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? "#1d4ed8" : "#059669",
      dashArray: "",
      fillOpacity: isSelected ? 0.7 : 0.3,
    };
  };

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      ref={setMapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoData && (
        <GeoJSON
          data={geoData}
          onEachFeature={onEachFeature}
          style={getFeatureStyle}
        />
      )}
    </MapContainer>
  );
}
