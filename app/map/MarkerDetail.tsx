"use client";

import Link from "next/link";
import { SourceList } from "@/components/shared/SourceList";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import { Badge, Button } from "@/components/ui";
import { setMarkerProgress } from "@/lib/database/repo";
import { DISTRICT_LABEL, MARKER_CATEGORY_LABEL } from "@/lib/labels";
import { CATEGORY_GLYPH, markerColor, type DisplayMarker } from "@/lib/map/markers";

/**
 * Detail panel for the selected marker. Renders the source, completion and
 * discovery controls, and leads with an unmistakable identity block (the same
 * glyph + hue used on the map) so the selection reads the same in both places.
 */
export function MarkerDetail({
  marker,
  playthroughId,
  onClose,
  onDeleteCustom,
}: {
  marker: DisplayMarker;
  playthroughId: string | undefined;
  onClose: () => void;
  onDeleteCustom?: () => void;
}) {
  const def = marker.def;
  const glyph = marker.shielded ? "?" : (CATEGORY_GLYPH[marker.category] ?? "◆");
  const color = markerColor(marker);

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
            style={{ color, borderColor: color }}
          >
            {glyph}
          </span>
          <div className="min-w-0">
            <p className="readout">
              Selected · {MARKER_CATEGORY_LABEL[marker.category]} ·{" "}
              {DISTRICT_LABEL[marker.district]}
            </p>
            <h2 className="text-lg font-bold uppercase tracking-wide text-ink">
              {marker.shielded ? "Shielded signal" : marker.name}
            </h2>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close marker details"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-dim hover:text-signal"
        >
          ✕
        </button>
      </div>

      {!marker.isCustom && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge tone={marker.discovered ? "holo" : "neutral"}>
            {marker.discovered ? "◉ Discovered" : "○ Undiscovered"}
          </Badge>
          <Badge tone={marker.completed ? "lime" : "neutral"}>
            {marker.completed ? "✓ Completed" : "▪ Incomplete"}
          </Badge>
        </div>
      )}

      {def && marker.shielded ? (
        <SpoilerShield level={def.spoilerLevel} revealKey={def.id} label="Marker intel">
          <p className="text-sm text-ink-dim">{def.description}</p>
        </SpoilerShield>
      ) : (
        <p className="mb-3 text-sm text-ink-dim">
          {def?.description ?? marker.custom?.description ?? "Custom marker."}
        </p>
      )}

      {def?.expansion === "phantom_liberty" && (
        <Badge tone="violet" className="mb-3">
          Phantom Liberty
        </Badge>
      )}

      {playthroughId && !marker.isCustom && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={marker.discovered ? "outline" : "primary"}
            onClick={() =>
              void setMarkerProgress(playthroughId, marker.id, { discovered: !marker.discovered })
            }
          >
            {marker.discovered ? "Mark undiscovered" : "Mark discovered"}
          </Button>
          <Button
            size="sm"
            variant={marker.completed ? "outline" : "primary"}
            onClick={() =>
              void setMarkerProgress(playthroughId, marker.id, { completed: !marker.completed })
            }
          >
            {marker.completed ? "Mark incomplete" : "Mark completed"}
          </Button>
        </div>
      )}

      {def?.relatedJobId && (
        <p className="mb-3 text-sm">
          <Link
            href={`/jobs?focus=${encodeURIComponent(def.relatedJobId)}`}
            className="text-holo underline underline-offset-2"
          >
            Related job →
          </Link>
        </p>
      )}

      {onDeleteCustom && (
        <Button size="sm" variant="danger" onClick={onDeleteCustom} className="mb-3">
          Delete custom marker
        </Button>
      )}

      {def && !marker.shielded && <SourceList meta={def.meta} />}

      <p className="readout mt-3">Coordinates (schematic)</p>
      <p className="font-mono text-xs text-ink-faint">
        x {marker.x} · y {marker.y} — approximate schematic position
      </p>
    </div>
  );
}
