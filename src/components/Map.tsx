"use client";

import { useEffect, useState, useRef, JSX } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Zap, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  endTime?: string | null;
  type: string;
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
  interruptions: InterruptionData[];
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
  interruptions,
}: MapProps) {
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [clickedBarangayData, setClickedBarangayData] = useState<{
    geoData: BarangayData;
    feederData: BarangayFeederData | null;
  } | null>(null);
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

        {/* Render custom interruption areas */}
        {renderInterruptionPolygons()}
      </MapContainer>

      {/* Right Side Information Panel */}
      {clickedBarangayData && (
        <div className="absolute top-4 right-4 z-30 w-96 bg-background/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Barangay Details</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setClickedBarangayData(null)}
              className="hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Barangay Information */}
              <div>
                <h4 className="font-semibold text-xl text-primary mb-3">
                  {clickedBarangayData.geoData.adm4_en}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">PSGC Code:</span>
                    <p className="font-medium">
                      {clickedBarangayData.geoData.adm4_psgc}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Area:</span>
                    <p className="font-medium">
                      {clickedBarangayData.geoData.area_km2?.toFixed(2)} km²
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Perimeter:</span>
                    <p className="font-medium">
                      {clickedBarangayData.geoData.len_km?.toFixed(2)} km
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Level:</span>
                    <p className="font-medium capitalize">
                      {clickedBarangayData.geoData.geo_level}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Power Feeders Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <h5 className="font-semibold">Power Feeders</h5>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-400"
                  >
                    {clickedBarangayData.feederData?.FeederCoverage?.length ||
                      0}
                  </Badge>
                </div>

                {clickedBarangayData.feederData?.FeederCoverage?.length ? (
                  <div className="space-y-3">
                    {clickedBarangayData.feederData.FeederCoverage.map(
                      (coverage, index) => {
                        const feeder = coverage.feeder;
                        const hasInterruption = feeder.interruptedFeeders.some(
                          (interrupted) => interrupted.interruption
                        );
                        const activeInterruptions = feeder.interruptedFeeders
                          .filter((interrupted) => interrupted.interruption)
                          .map((interrupted) => interrupted.interruption!);

                        return (
                          <div
                            key={feeder.id}
                            className={`p-3 rounded-xl border transition-colors ${
                              hasInterruption
                                ? "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Zap
                                    className={`w-4 h-4 ${
                                      hasInterruption
                                        ? "text-yellow-500"
                                        : "text-blue-500"
                                    }`}
                                  />
                                  <span className="font-medium text-sm">
                                    {feeder.name}
                                  </span>
                                  {hasInterruption && (
                                    <Badge
                                      variant="outline"
                                      className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10"
                                    >
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Interrupted
                                    </Badge>
                                  )}
                                </div>

                                {hasInterruption && (
                                  <div className="space-y-2">
                                    {activeInterruptions.map((interruption) => (
                                      <div
                                        key={interruption.id}
                                        className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2"
                                      >
                                        <div className="flex items-start space-x-2">
                                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                              Power Interruption Active
                                            </p>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-300/80 mt-1">
                                              {interruption.description ||
                                                "No additional details"}
                                            </p>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-400/60 mt-1">
                                              Started:{" "}
                                              {new Date(
                                                interruption.startTime
                                              ).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {!hasInterruption && (
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Operating normally</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No feeder information available</p>
                    <p className="text-xs">
                      This barangay may not be covered by the power grid data
                    </p>
                  </div>
                )}
              </div>

              {/* Overall Status Summary */}
              {clickedBarangayData.feederData?.FeederCoverage?.length && (
                <>
                  <Separator className="bg-white/10" />
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Info className="w-4 h-4 text-primary" />
                      <h5 className="font-semibold">Power Status Summary</h5>
                    </div>

                    {hasActiveInterruption(clickedBarangayData.feederData) ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">
                            Power Interruption Detected
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300/80">
                          This barangay is currently experiencing power
                          interruptions. Some areas may be without electricity.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Normal Operation
                          </span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300/80">
                          All power feeders serving this barangay are operating
                          normally.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
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
