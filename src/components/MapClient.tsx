"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import NavBar from "./NavBar";

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
      <div className="bg-background/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Loading map...</p>
        </div>
      </div>
    </div>
  ),
});

export default function MapClient() {
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col">
      <NavBar onBarangaySelect={setSelectedBarangay} />
      <div className="flex-1 pt-20">
        <Map selectedBarangay={selectedBarangay} />
      </div>
    </div>
  );
}
