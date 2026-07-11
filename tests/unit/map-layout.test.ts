import { describe, expect, it } from "vitest";
import { pixelsPerUnit, resolveMarkerLayout, type LayoutPoint } from "@/lib/map/layout";
import { mapMarkers } from "@/data/map";

/**
 * Declustering is the mechanism that keeps overlapping Watson signals
 * individually selectable. It is a pure function, so we can assert its
 * guarantees directly without a live Leaflet map.
 */

/** Screen-space distance between two placed points at a given zoom. */
function pixelDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
  zoom: number,
): number {
  const ppu = pixelsPerUnit(zoom);
  return Math.hypot((a.x - b.x) * ppu, (a.y - b.y) * ppu);
}

describe("resolveMarkerLayout", () => {
  it("leaves an isolated marker exactly where it is", () => {
    const points: LayoutPoint[] = [{ id: "a", x: 10, y: 10 }];
    const placed = resolveMarkerLayout(points, 3).get("a")!;
    expect(placed.x).toBe(10);
    expect(placed.y).toBe(10);
    expect(placed.offset).toBe(false);
  });

  it("returns a placement for every input marker", () => {
    const points: LayoutPoint[] = mapMarkers.map((m) => ({ id: m.id, x: m.x, y: m.y }));
    const out = resolveMarkerLayout(points, 3);
    expect(out.size).toBe(points.length);
    for (const p of points) expect(out.has(p.id)).toBe(true);
  });

  it("fans out two coincident markers so both stay clickable", () => {
    const points: LayoutPoint[] = [
      { id: "a", x: 40, y: 22 },
      { id: "b", x: 39, y: 24 }, // ~2.2 units away → overlaps at default zoom
    ];
    const zoom = 3;
    const out = resolveMarkerLayout(points, zoom);
    const a = out.get("a")!;
    const b = out.get("b")!;
    expect(a.offset).toBe(true);
    expect(b.offset).toBe(true);
    // At least one marker-width of screen separation after declustering.
    expect(pixelDistance(a, b, zoom)).toBeGreaterThanOrEqual(30);
  });

  it("merges groups joined by a bridge point (connected components, not greedy)", () => {
    // a and b are 3 units apart (> the 2.75-unit threshold at zoom 3), so a
    // greedy first-match grouping would put a+c together and leave b nearly on
    // top of c. c bridges both, so all three must land in one fanned-out group.
    const zoom = 3;
    const points: LayoutPoint[] = [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 0, y: 3 },
      { id: "c", x: 0, y: 0.5 }, // within threshold of BOTH a and b
    ];
    const out = resolveMarkerLayout(points, zoom);
    for (const id of ["a", "b", "c"]) expect(out.get(id)!.offset).toBe(true);

    const placed = points.map((p) => out.get(p.id)!);
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        // Each marker centre must stay clear of any other marker's body
        // (radius ~15px) so all three remain individually clickable.
        expect(pixelDistance(placed[i]!, placed[j]!, zoom)).toBeGreaterThan(20);
      }
    }
  });

  it("keeps every marker in the dense Watson cluster separable at default zoom", () => {
    const zoom = 3;
    // The real Watson signals — several sit within a couple of units.
    const watson = mapMarkers
      .filter((m) => m.district === "watson")
      .map((m) => ({ id: m.id, x: m.x, y: m.y }));
    expect(watson.length).toBeGreaterThanOrEqual(6);

    const out = resolveMarkerLayout(watson, zoom);
    const placed = watson.map((m) => out.get(m.id)!);

    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(pixelDistance(placed[i]!, placed[j]!, zoom)).toBeGreaterThan(20);
      }
    }
  });

  it("is deterministic — identical input yields identical placements", () => {
    const points: LayoutPoint[] = [
      { id: "a", x: 50, y: 12 },
      { id: "b", x: 51, y: 13 },
      { id: "c", x: 49, y: 11 },
    ];
    const first = resolveMarkerLayout(points, 3);
    const second = resolveMarkerLayout(points, 3);
    for (const id of ["a", "b", "c"]) {
      expect(first.get(id)).toEqual(second.get(id));
    }
  });

  it("spreads a cluster wider at lower zoom (fewer pixels per unit)", () => {
    const points: LayoutPoint[] = [
      { id: "a", x: 50, y: 12 },
      { id: "b", x: 51, y: 13 },
    ];
    const low = resolveMarkerLayout(points, 2);
    const high = resolveMarkerLayout(points, 5);
    const lowSpread = Math.hypot(
      low.get("a")!.x - low.get("b")!.x,
      low.get("a")!.y - low.get("b")!.y,
    );
    const highSpread = Math.hypot(
      high.get("a")!.x - high.get("b")!.x,
      high.get("a")!.y - high.get("b")!.y,
    );
    // Same target pixel separation over fewer px/unit ⇒ larger coordinate spread.
    expect(lowSpread).toBeGreaterThan(highSpread);
  });
});
