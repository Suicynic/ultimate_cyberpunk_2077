"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as React from "react";
import { MapContainer, Pane, Polygon, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { districtShapes } from "@/data/map";
import { CATEGORY_GLYPH, markerColor, type DisplayMarker } from "@/lib/map/markers";
import { resolveMarkerLayout } from "@/lib/map/layout";
import { MARKER_CATEGORY_LABEL, DISTRICT_LABEL } from "@/lib/labels";

export type { DisplayMarker } from "@/lib/map/markers";

/**
 * Original schematic map of Night City on a simple coordinate plane.
 * District shapes are abstract polygons (original artwork, not game assets);
 * positions are approximate by design. The layer model supports swapping in
 * licensed or community-permitted tile sets later (see docs/architecture).
 *
 * Markers are rendered as real, keyboard-focusable <button> elements via
 * `L.divIcon`, so hover, keyboard-focus and selection all get first-class,
 * non-colour-only affordances, and overlapping signals are fanned apart at the
 * current zoom so each stays individually selectable.
 */

/** Convert normalized (x, y) — y down — to Leaflet latlng (lat up). */
const toLatLng = (x: number, y: number): [number, number] => [100 - y, x];

/** HTML-escape a string destined for a divIcon template. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Full, spoiler-safe accessible name for a marker button. */
function markerLabel(m: DisplayMarker): string {
  const name = m.shielded ? "Shielded signal" : m.name;
  const cat = MARKER_CATEGORY_LABEL[m.category];
  const district = DISTRICT_LABEL[m.district];
  const state = m.completed ? ", completed" : m.discovered ? ", discovered" : "";
  return `${name} — ${cat} in ${district}${state}`;
}

/** Signature of the parts of a marker baked into its icon (not toggled by CSS). */
function iconSignature(m: DisplayMarker): string {
  return `${m.category}|${m.shielded ? 1 : 0}|${m.isCustom ? 1 : 0}`;
}

/** Build the divIcon for a marker. Interaction state is applied via classes. */
function buildIcon(m: DisplayMarker): L.DivIcon {
  const glyph = m.shielded ? "?" : (CATEGORY_GLYPH[m.category] ?? "◆");
  const color = markerColor(m);
  const html =
    `<button type="button" class="ncmap-marker" tabindex="0"` +
    ` data-marker-id="${esc(m.id)}" aria-label="${esc(markerLabel(m))}"` +
    ` style="--dot:${color}">` +
    `<span class="ncmap-marker__glyph" aria-hidden="true">${esc(glyph)}</span>` +
    `<span class="ncmap-marker__check" aria-hidden="true">✓</span>` +
    `</button>`;
  return L.divIcon({
    html,
    className: "ncmap-marker-wrap",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** Toggle interaction/progress state classes on a live marker element. */
function applyState(el: HTMLElement, m: DisplayMarker, selected: boolean): void {
  const btn = el.querySelector<HTMLButtonElement>(".ncmap-marker");
  if (!btn) return;
  btn.classList.toggle("is-selected", selected);
  btn.classList.toggle("is-completed", m.completed);
  btn.classList.toggle("is-discovered", m.discovered && !m.completed);
  btn.classList.toggle("is-custom", m.isCustom);
  btn.setAttribute("aria-pressed", selected ? "true" : "false");
  btn.setAttribute("aria-label", markerLabel(m));
  btn.setAttribute("data-selected", selected ? "true" : "false");
  btn.setAttribute("data-completed", m.completed ? "true" : "false");
  btn.title = m.shielded ? "Shielded signal" : m.name;
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

/**
 * Imperative marker layer. Markers are reconciled by id so that toggling
 * completion/selection never recreates the DOM node — keyboard focus survives
 * a select, and overlapping markers re-fan smoothly on zoom.
 */
function MarkerLayer({
  markers,
  selectedId,
  onSelect,
}: {
  markers: DisplayMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const groupRef = React.useRef<L.LayerGroup | null>(null);
  const objs = React.useRef<Map<string, { marker: L.Marker; sig: string }>>(new Map());
  const onSelectRef = React.useRef(onSelect);
  const selectedRef = React.useRef(selectedId);
  const [zoom, setZoom] = React.useState<number>(() => map.getZoom());

  onSelectRef.current = onSelect;

  React.useEffect(() => {
    const group = L.layerGroup().addTo(map);
    groupRef.current = group;
    const store = objs.current;
    return () => {
      group.remove();
      store.clear();
    };
  }, [map]);

  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  // Reconcile markers whenever the set, their state, or the zoom changes.
  React.useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const store = objs.current;
    const layout = resolveMarkerLayout(
      markers.map((m) => ({ id: m.id, x: m.x, y: m.y })),
      zoom,
    );
    const seen = new Set<string>();

    for (const m of markers) {
      seen.add(m.id);
      const p = layout.get(m.id) ?? { x: m.x, y: m.y };
      const latlng = toLatLng(p.x, p.y);
      const sig = iconSignature(m);
      let entry = store.get(m.id);

      if (!entry) {
        const marker = L.marker(latlng, {
          icon: buildIcon(m),
          keyboard: false, // the inner <button> is the single, native tab stop
          riseOnHover: true,
          riseOffset: 400,
        });
        marker.on("click", () => onSelectRef.current(m.id));
        marker.addTo(group);
        entry = { marker, sig };
        store.set(m.id, entry);
      } else {
        entry.marker.setLatLng(latlng);
        if (entry.sig !== sig) {
          entry.marker.setIcon(buildIcon(m));
          entry.sig = sig;
        }
      }

      const el = entry.marker.getElement();
      if (el) applyState(el, m, m.id === selectedRef.current);
    }

    for (const [id, entry] of store) {
      if (!seen.has(id)) {
        group.removeLayer(entry.marker);
        store.delete(id);
      }
    }
  }, [markers, zoom]);

  // Selection changes only toggle classes + stacking, preserving focus/DOM.
  React.useEffect(() => {
    selectedRef.current = selectedId;
    for (const [id, entry] of objs.current) {
      const el = entry.marker.getElement();
      const btn = el?.querySelector<HTMLButtonElement>(".ncmap-marker");
      const selected = id === selectedId;
      if (btn) {
        btn.classList.toggle("is-selected", selected);
        btn.setAttribute("aria-pressed", selected ? "true" : "false");
        btn.setAttribute("data-selected", selected ? "true" : "false");
      }
      entry.marker.setZIndexOffset(selected ? 1000 : 0);
    }
  }, [selectedId]);

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

      {/* District labels ride in a dedicated pane below the marker pane so they
          never sit on top of, or compete for clicks with, dense marker groups. */}
      <Pane name="district-labels" style={{ zIndex: 450, pointerEvents: "none" }} />

      {/* District polygons — decorative only; non-interactive so map clicks
          (custom-marker placement) always reach the map, not a district. */}
      {Object.entries(districtShapes).map(([district, shape]) => (
        <Polygon
          key={district}
          positions={shape.points.map(([x, y]) => toLatLng(x, y))}
          interactive={false}
          pathOptions={{
            color: district === "dogtown" ? "#a78bfa" : "#37548a",
            weight: 1.5,
            fillColor: district === "dogtown" ? "#2d2547" : "#1a2333",
            fillOpacity: 0.55,
          }}
        >
          <Tooltip
            pane="district-labels"
            direction="center"
            permanent
            className="ncmap-district-label"
          >
            {shape.label}
          </Tooltip>
        </Polygon>
      ))}

      <MarkerLayer markers={markers} selectedId={selectedId} onSelect={onSelect} />
    </MapContainer>
  );
}
