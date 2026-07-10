import clsx from "clsx";
import type { CharacterCategory, CharacterDef } from "@/types/domain";

/**
 * Portrait with a polished NC/OS fallback. When no approved portrait asset
 * exists, an identity panel is rendered: a subtle diagnostic grid, the
 * character's initials/glyph, a role code, and the archive code. The container
 * keeps a stable aspect ratio so cards never shift as data loads.
 *
 * Pure and server-compatible — no client hooks, no animation.
 */

const CATEGORY_CODE: Record<CharacterCategory, string> = {
  core: "CORE",
  fixer: "FIX",
  netrunner: "NET",
  corporate: "CORP",
  nomad: "NMD",
  gang: "GANG",
  night_city: "NC",
  phantom_liberty: "PL",
};

export function CharacterPortrait({
  character,
  className,
}: {
  character: Pick<CharacterDef, "name" | "portrait" | "initials" | "category" | "archiveId">;
  className?: string;
}) {
  const { name, portrait, initials, category, archiveId } = character;

  if (portrait) {
    return (
      <div className={clsx("relative aspect-[3/4] overflow-hidden border border-line", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local /public asset, no remote loader needed */}
        <img
          src={portrait}
          alt={`${name} — archive portrait`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${name} — identity glyph; no portrait on file`}
      className={clsx(
        "dossier-grid relative flex aspect-[3/4] items-center justify-center overflow-hidden border border-line",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="select-none font-display text-4xl font-bold tracking-widest text-ink-dim"
      >
        {initials}
      </span>
      <span aria-hidden="true" className="readout absolute left-1.5 top-1.5">
        {CATEGORY_CODE[category]}
      </span>
      <span aria-hidden="true" className="readout absolute bottom-1.5 right-1.5 !text-ink-faint">
        {archiveId}
      </span>
    </div>
  );
}
