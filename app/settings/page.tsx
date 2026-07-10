"use client";

import * as React from "react";
import { Button, Checkbox, Field, PageHeader, Panel, Select } from "@/components/ui";
import { resetRevealedSpoilers, updateSettings } from "@/lib/database/repo";
import { downloadExport, importFromJson, parseImportPayload } from "@/lib/import-export";
import { useSettings } from "@/lib/hooks";
import { SPOILER_MODE_LABEL } from "@/lib/spoilers";
import type { SpoilerMode } from "@/types/domain";

export default function SettingsPage() {
  const settings = useSettings();
  const [importStatus, setImportStatus] = React.useState<{
    kind: "idle" | "ok" | "error";
    message?: string;
  }>({ kind: "idle" });
  const [importMode, setImportMode] = React.useState<"merge" | "replace">("merge");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    const text = await file.text();
    // Validate first so nothing is written on schema mismatch.
    const parsed = parseImportPayload(text);
    if (!parsed.ok) {
      setImportStatus({ kind: "error", message: parsed.error });
      return;
    }
    const result = await importFromJson(text, importMode);
    if (result.ok) {
      const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
      setImportStatus({
        kind: "ok",
        message: `Import complete — ${total} records restored (${importMode} mode).`,
      });
    } else {
      setImportStatus({ kind: "error", message: result.error });
    }
  };

  return (
    <>
      <PageHeader
        readout="// system config"
        title="Settings"
        description="Spoiler shield, accessibility, interface language, and data control. Everything is stored locally in this browser."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel readout="// spoiler shield" title="Spoiler visibility">
          <Field
            label="Global spoiler mode"
            htmlFor="spoiler-mode"
            hint="Individual playthroughs can override this. Reveal-on-demand choices are remembered."
          >
            <Select
              id="spoiler-mode"
              value={settings.spoilerMode}
              onChange={(e) => void updateSettings({ spoilerMode: e.target.value as SpoilerMode })}
            >
              {Object.entries(SPOILER_MODE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="mt-3 flex items-center gap-3">
            <Button size="sm" onClick={() => void resetRevealedSpoilers()}>
              Re-shield all revealed items
            </Button>
            <span className="text-xs text-ink-faint">
              {settings.revealedSpoilers.length} item(s) currently revealed
            </span>
          </div>
        </Panel>

        <Panel readout="// accessibility" title="Interface & effects">
          <div className="space-y-4">
            <Checkbox
              id="reduced-effects"
              label="Reduce visual effects"
              description="Disables scanlines, flicker, and non-essential animation. The OS-level reduced-motion preference is always respected."
              checked={settings.reducedEffects}
              onChange={(v) => void updateSettings({ reducedEffects: v })}
            />
            <Checkbox
              id="conventional-labels"
              label="Conventional labels"
              description='Replace thematic interface language ("Command Center", "District Scan") with plain terms ("Dashboard", "Map").'
              checked={settings.conventionalLabels}
              onChange={(v) => void updateSettings({ conventionalLabels: v })}
            />
          </div>
        </Panel>

        <Panel readout="// progress sync" title="Backup & export">
          <p className="mb-3 text-sm text-ink-dim">
            Download everything — playthroughs, progress, builds, notes, decisions, settings — as a
            single JSON file. Store it anywhere; import it here or on another device.
          </p>
          <Button variant="primary" onClick={() => void downloadExport()}>
            Export all data (JSON)
          </Button>
        </Panel>

        <Panel readout="// progress sync" title="Import">
          <Field
            label="Import mode"
            htmlFor="import-mode"
            hint="Merge keeps existing data and overwrites on ID collision. Replace clears local data first."
          >
            <Select
              id="import-mode"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as "merge" | "replace")}
            >
              <option value="merge">Merge into existing data</option>
              <option value="replace">Replace all local data</option>
            </Select>
          </Field>
          <div className="mt-3">
            <label htmlFor="import-file" className="sr-only">
              Choose backup file
            </label>
            <input
              id="import-file"
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="block w-full text-sm text-ink-dim file:clip-chip file:mr-3 file:min-h-[44px] file:cursor-pointer file:border file:border-line-bright file:bg-panel-2 file:px-4 file:py-2 file:text-sm file:font-semibold file:uppercase file:tracking-wider file:text-ink"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
                e.target.value = "";
              }}
            />
          </div>
          {importStatus.kind !== "idle" && (
            <p
              role="status"
              className={`clip-chip mt-3 border px-3 py-2 text-sm ${
                importStatus.kind === "ok"
                  ? "border-lime/50 text-lime"
                  : "border-signal/50 text-signal"
              }`}
            >
              {importStatus.message}
            </p>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            Invalid or unrecognized files are rejected before anything is written.
          </p>
        </Panel>

        <Panel readout="// about" title="About this project" className="lg:col-span-2">
          <div className="space-y-2 text-sm text-ink-dim">
            <p>
              Ultimate Cyberpunk 2077 Companion is an unofficial, open-source fan project — a
              local-first tracker for playthroughs, jobs, builds, achievements, and discoveries. It
              is not affiliated with or endorsed by CD Projekt Red.
            </p>
            <p>
              Game facts in the starter dataset are paraphrased and carry source links plus a
              verification status. Found an error? The repository accepts data corrections with
              sources.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
