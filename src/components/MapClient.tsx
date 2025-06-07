"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import NavBar from "./NavBar";

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-muted">
      <p>Loading map...</p>
    </div>
  ),
});

export default function MapClient() {
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);

  return (
    <>
      <NavBar onBarangaySelect={setSelectedBarangay} />
      <div className="flex-1">
        <Map selectedBarangay={selectedBarangay} />
      </div>
    </>
  );
}
