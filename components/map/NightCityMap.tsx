"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as React from "react";
import { CircleMarker, MapContainer, Polygon, Tooltip, useMapEvents } from "react-leaflet";
import type { CustomMarker, District, MapMarkerDef, MarkerCategory } from "@/types/domain";
import { districtShapes } from "@/data/map";

/**
 * Original schematic map of Night City on a simple coordinate plane.
 * District shapes are abstract polygons (original artwork, not game assets);
 * positions are approximate by design. The layer model supports swapping in
 * licensed or community-permitted tile sets later (see docs/architecture).
 */

export const CATEGORY_COLORS: Partial<Record<MarkerCategory, string>> = {
  fast_travel: "#58e6d9",
  vendor: "#9fb0c8",
  ripperdoc: "#a3e635",
  apartment: "#ffc857",
  tarot_card: "#a78bfa",
  iconic_weapon: "#ff5d7a",
  cyberpsycho: "#ff5d7a",
  easter_egg: "#a78bfa",
  custom: "#ffffff",
};

/** Convert normalized (x, y) — y down — to Leaflet latlng (lat up). */
const toLatLng = (x: number, y: number): [number, number] => [100 - y, x];

export interface DisplayMarker {
  id: string;
  name: string;
  category: MarkerCategory;
  x: number;
  y: number;
  district: District;
  shielded: boolean;
  completed: boolean;
  discovered: boolean;
  isCustom: boolean;
  def?: MapMarkerDef;
  custom?: CustomMarker;
}

function ClickCapture({ onMapClick }: { onMapClick?: (x: number, y: number) => void }) {
  useMapEvents({
    click(e) {
      if (!onMapClick) return;
      const x = Math.min(100, Math.max(0, e.latlng.lng));
      const y = Math.min(100, Math.max(0, 100 - e.latlng.lat));
      onMapClick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    },
  });
  return null;
}

export default function NightCityMap({
  markers,
  selectedId,
  onSelect,
  onMapClick,
  placing,
}: {
  markers: DisplayMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMapClick?: (x: number, y: number) => void;
  placing?: boolean;
}) {
  const bounds = L.latLngBounds([-5, -5], [105, 105]);

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds}
      minZoom={2}
      maxZoom={6}
      zoom={3}
      center={[50, 48]}
      className={`h-full w-full ${placing ? "cursor-crosshair" : ""}`}
      attributionControl={false}
      aria-label="Schematic map of Night City districts"
    >
      <ClickCapture onMapClick={onMapClick} />

      {/* District polygons */}
      {Object.entries(districtShapes).map(([district, shape]) => (
        <Polygon
          key={district}
          positions={shape.points.map(([x, y]) => toLatLng(x, y))}
          pathOptions={{
            color: district === "dogtown" ? "#a78bfa" : "#37548a",
            weight: 1.5,
            fillColor: district === "dogtown" ? "#2d2547" : "#1a2333",
            fillOpacity: 0.55,
          }}
        >
          <Tooltip
            direction="center"
            permanent
            className="!border-0 !bg-transparent !text-[10px] !font-mono !uppercase !tracking-widest !text-[#64748f] !shadow-none"
          >
            {shape.label}
          </Tooltip>
        </Polygon>
      ))}

      {/* Markers */}
      {markers.map((m) => {
        const selected = m.id === selectedId;
        const color = m.shielded ? "#64748f" : (CATEGORY_COLORS[m.category] ?? "#9fb0c8");
        return (
          <CircleMarker
            key={m.id}
            center={toLatLng(m.x, m.y)}
            radius={selected ? 10 : 7}
            pathOptions={{
              color: selected ? "#ffffff" : color,
              weight: selected ? 3 : 2,
              fillColor: color,
              fillOpacity: m.completed ? 0.15 : 0.85,
              dashArray: m.isCustom ? "3 3" : undefined,
            }}
            eventHandlers={{
              click: () => onSelect(m.id),
              keypress: (e) => {
                if ((e.originalEvent as KeyboardEvent).key === "Enter") onSelect(m.id);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {m.shielded ? "Shielded marker" : m.name}
              {m.completed ? " ✓" : ""}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
