"use client";

import Link from "next/link";
import * as React from "react";
import { setActivePlaythrough } from "@/lib/database/repo";
import { useActivePlaythrough, usePlaythroughs } from "@/lib/hooks";
import { LIFEPATH_LABEL } from "@/lib/labels";

/** Compact active-run selector shown in the top bar. */
export function PlaythroughSwitcher() {
  const { playthrough } = useActivePlaythrough();
  const playthroughs = usePlaythroughs();

  // Only non-archived runs are selectable. If none are visible (no runs, or
  // every run archived) show the "New run" affordance instead of an empty
  // selector with a hidden active run.
  const visiblePlaythroughs = (playthroughs ?? []).filter((p) => !p.archived);

  if (visiblePlaythroughs.length === 0) {
    return (
      <Link
        href="/playthroughs"
        className="clip-chip flex min-h-[44px] items-center border border-holo/60 bg-panel-2 px-3 text-xs font-semibold uppercase tracking-wider text-holo hover:bg-holo/10"
      >
        + New run
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <label htmlFor="active-run" className="sr-only">
        Active playthrough
      </label>
      <select
        id="active-run"
        value={playthrough?.id ?? ""}
        onChange={(e) => void setActivePlaythrough(e.target.value || undefined)}
        className="clip-chip min-h-[44px] max-w-[10rem] border border-line bg-panel-2 px-2 text-xs uppercase tracking-wider text-ink md:max-w-[14rem]"
      >
        {visiblePlaythroughs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {LIFEPATH_LABEL[p.lifepath]}
          </option>
        ))}
      </select>
    </div>
  );
}
