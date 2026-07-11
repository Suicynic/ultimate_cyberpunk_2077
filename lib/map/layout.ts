/**
 * Zoom-aware marker declustering for the schematic Night City map.
 *
 * The map uses `L.CRS.Simple`, so one schematic coordinate unit projects to
 * `2^zoom` screen pixels. Several Watson signals sit within a couple of units
 * of each other, so at the app's default zoom they overlap into an unclickable
 * blob. Rather than hide them behind a cluster badge (which would break "each
 * marker stays individually selectable"), we gently fan out any group of
 * markers that would collide at the CURRENT zoom, arranging them on a small
 * ring around their shared centroid.
 *
 * Everything here is pure and framework-free so it can be unit-tested without a
 * live Leaflet map. `NightCityMap` recomputes the layout on every `zoomend`.
 */

export interface LayoutPoint {
  id: string;
  x: number;
  y: number;
}

export interface PlacedPoint {
  id: string;
  /** Display x after declustering (schematic units). */
  x: number;
  /** Display y after declustering (schematic units). */
  y: number;
  /** True when the marker was nudged off its canonical position to declutter. */
  offset: boolean;
}

/** Screen pixels per schematic unit at a given Leaflet CRS.Simple zoom. */
export function pixelsPerUnit(zoom: number): number {
  return Math.pow(2, zoom);
}

/** Two markers closer than this many screen pixels are treated as colliding. */
const COLLIDE_PX = 22;
/** Minimum arc spacing (px) between fanned-out members of a group. */
const MIN_ARC_PX = 24;
/** Base ring radius (px) for a two-marker group. */
const BASE_RING_PX = 18;

/**
 * Single-link clustering by connected components (union-find): two points join
 * the same group when a chain of within-threshold points connects them, so a
 * "bridge" point that is close to two otherwise-separate points correctly merges
 * both — a greedy first-match grouping would leave one of them nearly on top of
 * a neighbour. Deterministic: points are processed in ascending id order, so the
 * same input always yields the same groups (and therefore stable offsets).
 */
function clusterByProximity(points: LayoutPoint[], thresholdUnits: number): LayoutPoint[][] {
  const ordered = [...points].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const n = ordered.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[i] !== root) {
      const next = parent[i]!;
      parent[i] = root;
      i = next;
    }
    return root;
  };
  const union = (i: number, j: number) => {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[Math.max(ri, rj)] = Math.min(ri, rj);
  };

  const t2 = thresholdUnits * thresholdUnits;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = ordered[i]!.x - ordered[j]!.x;
      const dy = ordered[i]!.y - ordered[j]!.y;
      if (dx * dx + dy * dy <= t2) union(i, j);
    }
  }

  const byRoot = new Map<number, LayoutPoint[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const bucket = byRoot.get(root);
    if (bucket) bucket.push(ordered[i]!);
    else byRoot.set(root, [ordered[i]!]);
  }
  return [...byRoot.values()];
}

/**
 * Resolve overlapping markers into individually selectable positions for the
 * given zoom. Singletons keep their exact schematic coordinates; members of a
 * colliding group are placed on a ring around the group centroid, sized so each
 * stays at least ~one marker-width from its neighbours on screen.
 */
export function resolveMarkerLayout(points: LayoutPoint[], zoom: number): Map<string, PlacedPoint> {
  const ppu = pixelsPerUnit(zoom);
  const thresholdUnits = COLLIDE_PX / ppu;
  const groups = clusterByProximity(points, thresholdUnits);
  const out = new Map<string, PlacedPoint>();

  for (const group of groups) {
    if (group.length === 1) {
      const p = group[0]!;
      out.set(p.id, { id: p.id, x: p.x, y: p.y, offset: false });
      continue;
    }

    const n = group.length;
    const cx = group.reduce((s, p) => s + p.x, 0) / n;
    const cy = group.reduce((s, p) => s + p.y, 0) / n;

    // Ring radius (px) large enough that N members are ~MIN_ARC_PX apart on the
    // circumference, then converted to schematic units for the current zoom.
    const ringPx = Math.max(BASE_RING_PX, (n * MIN_ARC_PX) / (2 * Math.PI));
    const ringUnits = ringPx / ppu;

    // Stable ordering so a marker keeps the same slot across renders.
    const ordered = [...group].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    ordered.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2; // start at top
      out.set(p.id, {
        id: p.id,
        x: cx + ringUnits * Math.cos(angle),
        y: cy + ringUnits * Math.sin(angle),
        offset: true,
      });
    });
  }

  return out;
}
