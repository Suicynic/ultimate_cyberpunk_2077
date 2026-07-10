# Map architecture

## Legal position (why the map looks the way it does)

Shipping the game's map artwork (or tiles derived from it) is not legally safe for a public
repository. The MVP therefore renders an **original schematic diagram**: abstract district
polygons on a simple coordinate plane, drawn from scratch for this project. It is deliberately
approximate and labeled as such in the UI. This is the same trade-off transit-style "diagram
maps" make: topology over geography.

## Implementation

- **Leaflet + react-leaflet** with `L.CRS.Simple` — no geographic projection, just a 0–100
  normalized plane. The map component is dynamically imported (`ssr: false`).
- District shapes live in `data/map/index.ts` (`districtShapes`) as polygon point lists —
  data, not artwork, so they're trivially replaceable.
- Markers store normalized `x`/`y` (0–100, y-down). `toLatLng` flips to Leaflet's y-up plane.
- Marker rendering uses `CircleMarker` (SVG) with category colors, completed = hollow,
  custom = dashed, shielded = neutral gray with generic tooltip.
- Filters (category, district, incomplete/undiscovered, search) plus focus marker are encoded
  in the URL (`?focus=&cat=&d=`) for deep links.
- Detail panel is a side panel on desktop and a bottom sheet on mobile.

## Swapping in real map layers later

The layer contract is intentionally thin:

1. **Coordinates:** markers already use normalized coordinates. A licensed/community-permitted
   tile set needs one affine transform (normalized → tile CRS) applied in `toLatLng`.
2. **Base layer:** replace the `<Polygon>` district layer with a `<TileLayer>`/`<ImageOverlay>`
   behind the same marker layer. Keep the schematic as a fallback layer toggle.
3. **Clustering:** add `leaflet.markercluster` (or supercluster) once marker counts exceed a
   few hundred; the `DisplayMarker` interface already carries everything a cluster popup needs.
4. **Per-marker positions** would then be re-verified and their `meta.verification` upgraded.

Do **not** commit proprietary tiles or extracted map imagery — see
[`docs/legal/ip-guardrails.md`](../legal/ip-guardrails.md).
