"use client";

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Filter, Zap, AlertTriangle, MapPin } from "lucide-react";

interface Feeder {
  id: string;
  name: string;
  feederCoverage: Array<{
    barangay: {
      id: string;
      name: string;
      psgcId: string;
    };
  }>;
  interruptedFeeders: Array<{
    interruption: {
      id: string;
      description: string;
      startTime: string;
    } | null;
  }>;
}

interface Interruption {
  id: string;
  description: string;
  startTime: string;
  endTime?: string;
  type: string;
  customArea?: boolean;
  polygon?: any;
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

interface FilterAccordionProps {
  onFeederFilter: (feederIds: string[]) => void;
  onInterruptionFilter: (interruptionIds: string[]) => void;
  onFilterChange: (filters: {
    feeders: string[];
    interruptions: string[];
  }) => void;
}

export default function FilterAccordion({
  onFeederFilter,
  onInterruptionFilter,
  onFilterChange,
}: FilterAccordionProps) {
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [selectedFeeders, setSelectedFeeders] = useState<string[]>([]);
  const [selectedInterruptions, setSelectedInterruptions] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("FilterAccordion: Starting to fetch data");
    const fetchData = async () => {
      try {
        const [feedersRes, interruptionsRes] = await Promise.all([
          fetch("/api/v1/feeders"),
          fetch("/api/v1/interruptions"),
        ]);

        const [feedersData, interruptionsData] = await Promise.all([
          feedersRes.json(),
          interruptionsRes.json(),
        ]);

        setFeeders(feedersData);
        setInterruptions(interruptionsData);

        console.log("FilterAccordion: Data loaded successfully");
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFeederToggle = (feederId: string) => {
    const newSelected = selectedFeeders.includes(feederId)
      ? selectedFeeders.filter((id) => id !== feederId)
      : [...selectedFeeders, feederId];

    setSelectedFeeders(newSelected);
    onFeederFilter(newSelected);
    onFilterChange({
      feeders: newSelected,
      interruptions: selectedInterruptions,
    });
  };

  const handleInterruptionToggle = (interruptionId: string) => {
    const newSelected = selectedInterruptions.includes(interruptionId)
      ? selectedInterruptions.filter((id) => id !== interruptionId)
      : [...selectedInterruptions, interruptionId];

    setSelectedInterruptions(newSelected);
    onInterruptionFilter(newSelected);
    onFilterChange({ feeders: selectedFeeders, interruptions: newSelected });
  };

  if (loading) {
    return (
      <div className="p-4 bg-background/20 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-background/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Map Filters</h3>
        </div>
      </div>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="feeders" className="border-white/10">
          <AccordionTrigger className="px-4 py-3 hover:bg-white/5">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>Feeders</span>
              <Badge
                variant="secondary"
                className="ml-auto bg-blue-500/20 text-blue-400"
              >
                {feeders.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {feeders.map((feeder) => (
                  <div
                    key={feeder.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedFeeders.includes(feeder.id)}
                          onCheckedChange={() => handleFeederToggle(feeder.id)}
                          className="data-[state=checked]:bg-blue-500"
                        />
                        <div>
                          <p className="font-medium text-sm truncate">
                            {feeder.name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {feeder.feederCoverage.length} barangays
                            </span>
                            {feeder.interruptedFeeders.some(
                              (f) => f.interruption
                            ) && (
                              <Badge
                                variant="destructive"
                                className="text-xs px-1.5 py-0.5"
                              >
                                Interrupted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="interruptions" className="border-white/10">
          <AccordionTrigger className="px-4 py-3 hover:bg-white/5">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Interruptions</span>
              <Badge
                variant="destructive"
                className="ml-auto bg-red-500/20 text-red-400"
              >
                {interruptions.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ScrollArea className="h-48">
              {interruptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interruptions
                </p>
              ) : (
                <div className="space-y-3">
                  {interruptions.map((interruption) => {
                    const isActive = !interruption.endTime;
                    const displayDescription =
                      interruption.description || "No extra description";
                    const typeLabel =
                      interruption.type?.charAt(0) +
                        interruption.type?.slice(1).toLowerCase() || "Unknown";

                    return (
                      <div
                        key={interruption.id}
                        className={`flex items-start justify-between p-3 rounded-xl transition-colors ${
                          isActive
                            ? "bg-red-500/10 hover:bg-red-500/20"
                            : "bg-gray-500/10 hover:bg-gray-500/20"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start space-x-2">
                            <Switch
                              checked={selectedInterruptions.includes(
                                interruption.id
                              )}
                              onCheckedChange={() =>
                                handleInterruptionToggle(interruption.id)
                              }
                              className={`mt-0.5 ${
                                isActive
                                  ? "data-[state=checked]:bg-red-500"
                                  : "data-[state=checked]:bg-gray-500"
                              }`}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-sm">
                                  {typeLabel} Power Interruption
                                </p>
                                {interruption.customArea && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-orange-500/50 text-orange-400"
                                  >
                                    Custom Area
                                  </Badge>
                                )}
                                {!isActive && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {displayDescription}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Started:{" "}
                                {new Date(
                                  interruption.startTime
                                ).toLocaleString()}
                              </p>
                              {interruption.endTime && (
                                <p className="text-xs text-muted-foreground">
                                  Ended:{" "}
                                  {new Date(
                                    interruption.endTime
                                  ).toLocaleString()}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {interruption.customArea
                                  ? "Custom drawn area"
                                  : `Affects ${interruption.interruptedFeeders.length} feeder(s)`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
