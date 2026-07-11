import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as navigation from "next/navigation";
import { db } from "@/lib/database/db";
import { DistrictScan } from "@/app/map/DistrictScan";

/**
 * The real Leaflet map is exercised end-to-end in Playwright; here we mock it so
 * the district-scan shell (filters, legend, counts, callout, detail panel) can
 * be tested in jsdom without pulling Leaflet's CSS through PostCSS. The mock
 * still surfaces each marker as a button so selection wiring is covered too.
 */
vi.mock("@/components/map/NightCityMap", () => ({
  __esModule: true,
  default: ({
    markers,
    selectedId,
    onSelect,
  }: {
    markers: { id: string; name: string; shielded: boolean }[];
    selectedId: string | null;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="nightcitymap" data-count={markers.length} data-selected={selectedId ?? ""}>
      {markers.map((m) => (
        <button
          key={m.id}
          type="button"
          data-testid="map-marker"
          data-marker-id={m.id}
          aria-pressed={m.id === selectedId}
          onClick={() => onSelect(m.id)}
        >
          {m.shielded ? "Shielded signal" : m.name}
        </button>
      ))}
    </div>
  ),
}));

/** Stateful next/navigation mock: router.replace drives useSearchParams. */
vi.mock("next/navigation", async () => {
  const React = await import("react");
  let params = new URLSearchParams();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const setFromUrl = (url: string) => {
    params = new URLSearchParams(url.split("?")[1] ?? "");
    emit();
  };
  return {
    __setParams: (qs = "") => {
      params = new URLSearchParams(qs);
      emit();
    },
    usePathname: () => "/map",
    useRouter: () => ({
      replace: setFromUrl,
      push: setFromUrl,
      prefetch: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
    }),
    useSearchParams: () =>
      React.useSyncExternalStore(
        (cb: () => void) => {
          listeners.add(cb);
          return () => listeners.delete(cb);
        },
        () => params,
        () => params,
      ),
  };
});

const setParams = (qs = "") =>
  (navigation as unknown as { __setParams: (q: string) => void }).__setParams(qs);

const map = () => screen.findByTestId("nightcitymap");
const markerButtons = () => screen.getAllByTestId("map-marker");
const liveCount = () => screen.getByText(/^\d+(?: of \d+)? signals?$/);

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  setParams("");
});

afterEach(cleanup);

describe("DistrictScan", () => {
  it("shows every signal and its count with no filters applied", async () => {
    render(<DistrictScan />);
    await map();
    expect(markerButtons()).toHaveLength(16);
    expect(liveCount()).toHaveTextContent("16 signals");
    expect(screen.getByText("No filters")).toBeInTheDocument();
    // No default filter is active → no Clear action offered.
    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it("renders the no-playthrough callout with a create CTA", async () => {
    render(<DistrictScan />);
    await map();
    expect(screen.getByText(/browse every signal/i)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /create a playthrough/i });
    expect(cta).toHaveAttribute("href", "/playthroughs?new=1");
  });

  it("filters by category, surfaces a Clear action and a filter summary", async () => {
    const user = userEvent.setup();
    render(<DistrictScan />);
    await map();

    await user.selectOptions(screen.getByLabelText(/category filter/i), "ripperdoc");

    expect(markerButtons()).toHaveLength(2);
    expect(liveCount()).toHaveTextContent("2 of 16 signals");
    const summary = screen.getByRole("list", { name: /active filters/i });
    expect(within(summary).getByText("Ripperdoc")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("clears all filters and restores the full set", async () => {
    const user = userEvent.setup();
    render(<DistrictScan />);
    await map();

    await user.selectOptions(screen.getByLabelText(/category filter/i), "ripperdoc");
    expect(markerButtons()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(markerButtons()).toHaveLength(16);
    expect(liveCount()).toHaveTextContent("16 signals");
    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it("reflects a zero-result filter state", async () => {
    const user = userEvent.setup();
    render(<DistrictScan />);
    await map();

    await user.type(screen.getByLabelText(/search markers/i), "zzzznope");

    expect(screen.queryAllByTestId("map-marker")).toHaveLength(0);
    expect(liveCount()).toHaveTextContent("0 of 16 signals");
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("opens an unmistakable detail panel for the focused marker", async () => {
    setParams("focus=marker:afterlife");
    render(<DistrictScan />);
    await map();

    const panel = screen.getByTestId("detail-panel");
    expect(panel).toHaveAttribute("data-mode", "sheet");
    expect(within(panel).getByRole("heading", { name: "Afterlife" })).toBeInTheDocument();
    expect(within(panel).getByText(/^Selected ·/)).toBeInTheDocument();
    // Non-colour state cues are present as text.
    expect(within(panel).getByText(/Undiscovered/)).toBeInTheDocument();
    expect(within(panel).getByText(/Incomplete/)).toBeInTheDocument();
  });

  it("selecting a marker updates the detail panel and marks it pressed", async () => {
    const user = userEvent.setup();
    render(<DistrictScan />);
    await map();
    expect(screen.getByTestId("detail-panel")).toHaveAttribute("data-mode", "standby");

    const viktors = screen
      .getAllByTestId("map-marker")
      .find((b) => b.getAttribute("data-marker-id") === "marker:viktors-clinic")!;
    await user.click(viktors);

    await waitFor(() =>
      expect(screen.getByTestId("detail-panel")).toHaveAttribute("data-mode", "sheet"),
    );
    const panel = screen.getByTestId("detail-panel");
    expect(within(panel).getByRole("heading", { name: "Viktor's Clinic" })).toBeInTheDocument();
    expect(screen.getByTestId("nightcitymap")).toHaveAttribute(
      "data-selected",
      "marker:viktors-clinic",
    );
  });
});
