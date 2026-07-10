import { db } from "@/lib/database/db";
import { exportEnvelopeSchema } from "@/lib/validation/schemas";
import { EXPORT_SCHEMA_VERSION, type ExportEnvelope } from "@/types/domain";

/**
 * JSON export/import for user-owned data.
 * Import validates the full envelope with Zod and rejects invalid payloads
 * before touching the database.
 */

export async function buildExportEnvelope(): Promise<ExportEnvelope> {
  const [
    playthroughs,
    jobProgress,
    achievementProgress,
    collectibleProgress,
    markerProgress,
    customMarkers,
    decisions,
    endingProgress,
    relationshipProgress,
    builds,
    notes,
    pins,
    settings,
  ] = await Promise.all([
    db.playthroughs.toArray(),
    db.jobProgress.toArray(),
    db.achievementProgress.toArray(),
    db.collectibleProgress.toArray(),
    db.markerProgress.toArray(),
    db.customMarkers.toArray(),
    db.decisions.toArray(),
    db.endingProgress.toArray(),
    db.relationshipProgress.toArray(),
    db.builds.toArray(),
    db.notes.toArray(),
    db.pins.toArray(),
    db.settings.get("app"),
  ]);
  return {
    app: "ultimate-cyberpunk-2077",
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      playthroughs,
      jobProgress,
      achievementProgress,
      collectibleProgress,
      markerProgress,
      customMarkers,
      decisions,
      endingProgress,
      relationshipProgress,
      builds,
      notes,
      pins,
      settings,
    },
  };
}

export async function exportToJson(): Promise<string> {
  return JSON.stringify(await buildExportEnvelope(), null, 2);
}

export type ImportResult =
  { ok: true; counts: Record<string, number> } | { ok: false; error: string };

/** Validate an import payload without writing anything. */
export function parseImportPayload(
  json: string,
): ImportResult | { ok: true; envelope: ExportEnvelope; counts: Record<string, number> } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  const parsed = exportEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: `Not a valid Ultimate Cyberpunk 2077 export: ${first ? `${first.path.join(".")} — ${first.message}` : "schema mismatch"}`,
    };
  }
  if (parsed.data.schemaVersion > EXPORT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `This export uses schema v${parsed.data.schemaVersion}; this app version supports up to v${EXPORT_SCHEMA_VERSION}. Update the app first.`,
    };
  }
  const envelope = parsed.data as ExportEnvelope;
  const counts = Object.fromEntries(
    Object.entries(envelope.data)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => [k, (v as unknown[]).length]),
  );
  return { ok: true, envelope, counts };
}

/**
 * Import an export file. `mode: "merge"` keeps existing rows and overwrites
 * on ID collision; `mode: "replace"` clears user data first.
 */
export async function importFromJson(
  json: string,
  mode: "merge" | "replace" = "merge",
): Promise<ImportResult> {
  const parsed = parseImportPayload(json);
  if (!parsed.ok) return parsed;
  if (!("envelope" in parsed)) return { ok: false, error: "Unexpected parse state." };
  const { envelope, counts } = parsed;

  const tables = [
    db.playthroughs,
    db.jobProgress,
    db.achievementProgress,
    db.collectibleProgress,
    db.markerProgress,
    db.customMarkers,
    db.decisions,
    db.endingProgress,
    db.relationshipProgress,
    db.builds,
    db.notes,
    db.pins,
    db.settings,
  ];

  await db.transaction("rw", tables, async () => {
    if (mode === "replace") {
      await Promise.all(tables.map((t) => t.clear()));
    }
    const d = envelope.data;
    await Promise.all([
      db.playthroughs.bulkPut(d.playthroughs),
      db.jobProgress.bulkPut(d.jobProgress),
      db.achievementProgress.bulkPut(d.achievementProgress),
      db.collectibleProgress.bulkPut(d.collectibleProgress),
      db.markerProgress.bulkPut(d.markerProgress),
      db.customMarkers.bulkPut(d.customMarkers),
      db.decisions.bulkPut(d.decisions),
      db.endingProgress.bulkPut(d.endingProgress),
      db.relationshipProgress.bulkPut(d.relationshipProgress),
      db.builds.bulkPut(d.builds),
      db.notes.bulkPut(d.notes),
      db.pins.bulkPut(d.pins),
      ...(d.settings ? [db.settings.put(d.settings)] : []),
    ]);
  });

  return { ok: true, counts };
}

/** Trigger a browser download of the current export. */
export async function downloadExport(): Promise<void> {
  const json = await exportToJson();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uc77-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
