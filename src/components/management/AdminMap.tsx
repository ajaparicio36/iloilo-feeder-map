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
  barangayData?: any[];
  onPolygonDrawn?: (
    polygon: any,
    affectedBarangays: { psgcIds: string[]; names: string[] }
  ) => void;
  existingPolygons?: any[];
}

export default function AdminMap({
  geoData,
  barangayData = [],
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

  // Add point-in-polygon detection function
  const isPointInPolygon = (point: [number, number], polygon: any): boolean => {
    const [x, y] = point;
    let inside = false;

    // Handle different polygon structures from leaflet
    let coords: number[][];
    if (polygon.geometry && polygon.geometry.coordinates) {
      coords = polygon.geometry.coordinates[0];
    } else if (polygon.coordinates) {
      coords = polygon.coordinates[0];
    } else {
      return false;
    }

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      // Ensure we have valid coordinate pairs
      if (
        !coords[i] ||
        coords[i].length < 2 ||
        !coords[j] ||
        coords[j].length < 2
      ) {
        continue;
      }

      const [xi, yi] = coords[i];
      const [xj, yj] = coords[j];

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  };

  // Enhanced polygon bounds intersection
  const isPolygonIntersecting = (
    drawnPolygon: any,
    barangayFeature: any
  ): boolean => {
    try {
      // Safely get the drawn polygon coordinates
      let drawnCoords: number[][];
      if (drawnPolygon.coordinates && drawnPolygon.coordinates[0]) {
        drawnCoords = drawnPolygon.coordinates[0];
      } else {
        return false;
      }

      // Safely get the barangay coordinates
      let barangayCoords: number[][];
      if (
        barangayFeature.geometry &&
        barangayFeature.geometry.coordinates &&
        barangayFeature.geometry.coordinates[0]
      ) {
        barangayCoords = barangayFeature.geometry.coordinates[0];
      } else {
        return false;
      }

      // Check if any vertex of the drawn polygon is inside the barangay
      for (const coord of drawnCoords) {
        // Ensure coord is a valid coordinate pair
        if (coord && coord.length >= 2) {
          const point: [number, number] = [coord[0], coord[1]];
          if (isPointInPolygon(point, barangayFeature.geometry)) {
            return true;
          }
        }
      }

      // Check if any vertex of the barangay is inside the drawn polygon
      for (const coord of barangayCoords) {
        // Ensure coord is a valid coordinate pair
        if (coord && coord.length >= 2) {
          const point: [number, number] = [coord[0], coord[1]];
          if (isPointInPolygon(point, drawnPolygon)) {
            return true;
          }
        }
      }

      // Check if the centroids are within each other's bounds
      const barangayLayer = L.geoJSON(barangayFeature);
      const barangayCenter = barangayLayer.getBounds().getCenter();
      const drawnLayer = L.geoJSON({
        type: "Feature",
        geometry: drawnPolygon,
        properties: {},
      } as GeoJSON.Feature);
      const drawnCenter = drawnLayer.getBounds().getCenter();

      // Check if centers are within bounding boxes as fallback
      const barangayBounds = barangayLayer.getBounds();
      const drawnBounds = drawnLayer.getBounds();

      return (
        barangayBounds.intersects(drawnBounds) &&
        (barangayBounds.contains(drawnCenter) ||
          drawnBounds.contains(barangayCenter))
      );
    } catch (error) {
      console.warn("Error in polygon intersection detection:", error);
      return false;
    }
  };

  const onCreated = (e: any) => {
    const { layer } = e;

    if (layer instanceof L.Polygon) {
      const drawnPolygon = layer.toGeoJSON();

      // Find barangays that intersect with the drawn polygon
      const affectedBarangays: string[] = [];
      const affectedBarangayNames: string[] = [];

      console.log("=== Polygon Intersection Detection ===");
      console.log("Drawn polygon:", drawnPolygon);

      if (geoData && geoData.features) {
        console.log(
          `Checking against ${geoData.features.length} barangay features`
        );

        // Sample some features for debugging
        const sampleFeatures = geoData.features.slice(0, 3);
        console.log("Sample features structure:", sampleFeatures);

        geoData.features.forEach((feature: any, index: number) => {
          if (feature.geometry && feature.properties?.adm4_psgc) {
            try {
              // Use the enhanced intersection detection
              const intersects = isPolygonIntersecting(
                drawnPolygon.geometry,
                feature
              );

              if (intersects) {
                const barangayName =
                  feature.properties.adm4_en ||
                  feature.properties.name ||
                  feature.properties.NAME ||
                  "Unknown";
                console.log(`✓ Intersection found with barangay:`, {
                  name: barangayName,
                  psgc: feature.properties.adm4_psgc,
                  properties: feature.properties,
                });
                affectedBarangays.push(feature.properties.adm4_psgc);
                affectedBarangayNames.push(barangayName);
              } else {
                // Debug: Show first few non-intersecting for comparison
                if (index < 5) {
                  console.log(`✗ No intersection with:`, {
                    name:
                      feature.properties.adm4_en ||
                      feature.properties.name ||
                      feature.properties.NAME ||
                      "Unknown",
                    psgc: feature.properties.adm4_psgc,
                    bounds: L.geoJSON(feature).getBounds(),
                  });
                }
              }
            } catch (error) {
              console.warn(
                `Error checking intersection for barangay ${index}:`,
                feature.properties?.adm4_psgc,
                error
              );
            }
          } else {
            if (index < 5) {
              console.warn(`Invalid feature at index ${index}:`, {
                hasGeometry: !!feature.geometry,
                properties: feature.properties,
                psgcProperty: feature.properties?.adm4_psgc,
              });
            }
          }
        });
      } else {
        console.warn("No geoData or features available", { geoData });
      }

      console.log("Final affected barangays:", affectedBarangays);
      console.log("Final affected barangay names:", affectedBarangayNames);
      console.log("=== End Polygon Intersection Detection ===");

      // Pass both PSGC IDs and names for fallback matching
      onPolygonDrawn?.(drawnPolygon.geometry, {
        psgcIds: affectedBarangays,
        names: affectedBarangayNames,
      });
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
