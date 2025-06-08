"use client";

import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

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

interface AdminMapProps {
  geoData: any;
  onPolygonDrawn?: (polygon: any, affectedBarangays: string[]) => void;
  existingPolygons?: any[];
}

export default function AdminMap({
  geoData,
  onPolygonDrawn,
  existingPolygons = [],
}: AdminMapProps) {
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const existingPolygonsRef = useRef<L.FeatureGroup | null>(null);

  // Iloilo City coordinates and bounds
  const center: [number, number] = [10.7202, 122.5621];
  const iloiloBounds = L.latLngBounds(
    L.latLng(10.65, 122.48), // Southwest corner
    L.latLng(10.78, 122.62) // Northeast corner
  );

  // Add existing polygons to map
  useEffect(() => {
    if (mapRef && existingPolygonsRef.current && existingPolygons.length > 0) {
      existingPolygonsRef.current.clearLayers();

      existingPolygons.forEach((polygon, index) => {
        const layer = L.geoJSON(polygon, {
          style: {
            color: "#8b5cf6",
            fillColor: "#8b5cf6",
            fillOpacity: 0.2,
            weight: 2,
            dashArray: "5, 5",
          },
        });

        if (existingPolygonsRef.current) {
          existingPolygonsRef.current.addLayer(layer);
        }
      });
    }
  }, [mapRef, existingPolygons]);

  const onCreated = (e: any) => {
    const { layer } = e;

    if (layer instanceof L.Polygon) {
      const drawnPolygon = layer.toGeoJSON();

      // Find barangays that intersect with the drawn polygon
      const affectedBarangays: string[] = [];

      if (geoData && geoData.features) {
        geoData.features.forEach((feature: any) => {
          if (feature.geometry && feature.properties?.adm4_psgc) {
            // Simple bounding box intersection check
            // In a production app, you'd want more precise geometric intersection
            const featureLayer = L.geoJSON(feature);
            const featureBounds = featureLayer.getBounds();
            const drawnBounds = layer.getBounds();

            if (featureBounds.intersects(drawnBounds)) {
              affectedBarangays.push(feature.properties.adm4_psgc);
            }
          }
        });
      }

      onPolygonDrawn?.(drawnPolygon.geometry, affectedBarangays);
    }
  };

  const getFeatureStyle = () => {
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
    <MapContainer
      center={center}
      zoom={12}
      minZoom={11}
      maxZoom={16}
      style={{ height: "100%", width: "100%" }}
      ref={setMapRef}
      maxBounds={iloiloBounds}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {geoData && <GeoJSON data={geoData} style={getFeatureStyle} />}

      {/* Existing polygons layer */}
      <FeatureGroup ref={existingPolygonsRef} />

      {/* Drawing layer */}
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={onCreated}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: {
              allowIntersection: false,
              drawError: {
                color: "#e74c3c",
                message: "<strong>Error:</strong> Polygon lines cannot cross!",
              },
              shapeOptions: {
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.3,
                weight: 2,
              },
            },
          }}
          edit={{
            edit: false,
            remove: true,
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}
