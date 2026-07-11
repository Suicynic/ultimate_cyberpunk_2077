import Link from "next/link";
import { CharacterPortrait } from "@/app/characters/CharacterPortrait";
import { Badge, type Tone } from "@/components/ui";
import {
  CHARACTER_RELATIONSHIP_TYPE_LABEL,
  CHARACTER_STATUS_LABEL,
  GAME_SCOPE_SHORT,
  VERIFICATION_LABEL,
} from "@/lib/labels";
import type { CharacterDef, VerificationStatus } from "@/types/domain";

const VERIFICATION_TONE: Record<VerificationStatus, Tone> = {
  unverified: "amber",
  community_verified: "holo",
  source_verified: "lime",
  version_outdated: "signal",
  disputed: "signal",
  deprecated: "neutral",
};

/**
 * Compact NC/OS personnel record. Presentational and spoiler-safe: it renders
 * only fields that never leak plot outcomes. Shielded material is not part of
 * the card at all — the dossier is where reveal-on-demand lives. The whole card
 * is a single keyboard-focusable link (stretched over the article).
 */
export function CharacterCard({ character }: { character: CharacterDef }) {
  const scopeTone: Tone = character.gameScope === "base_game" ? "neutral" : "violet";
  const primaryAffiliation = character.affiliations[0];
  const jobCount = character.firstRelevantJobIds?.length ?? 0;
  const isRomanceable = character.relationshipTypes?.includes("romance") ?? false;

  return (
    <article className="clip-panel relative flex flex-col border border-line bg-panel transition-colors hover:border-line-bright focus-within:border-holo">
      <header className="flex items-start gap-2 border-b border-line px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="readout">{character.archiveId}</p>
          <h3 className="truncate text-sm font-semibold uppercase tracking-wider text-ink">
            {character.name}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {character.spoilerBiography && (
            <Badge tone="amber" title="Contains shielded story details">
              <span aria-hidden="true">⛨</span>
              <span className="sr-only">Contains shielded story details</span>
            </Badge>
          )}
          <Badge tone={scopeTone}>{GAME_SCOPE_SHORT[character.gameScope]}</Badge>
        </div>
      </header>

      <div className="flex gap-3 p-4">
        <CharacterPortrait character={character} className="w-20 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{character.role}</p>
          {primaryAffiliation && (
            <p className="readout mt-0.5 truncate" title={primaryAffiliation}>
              {primaryAffiliation}
            </p>
          )}
          <p className="mt-1 text-[11px] text-ink-faint">
            <span className="readout !normal-case !tracking-normal">status → </span>
            {CHARACTER_STATUS_LABEL[character.status]}
          </p>
          <p className="mt-2 text-sm leading-snug text-ink-dim">{character.shortDescription}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isRomanceable && <Badge tone="violet">Romanceable</Badge>}
            {character.relationshipTypes
              ?.filter((t) => t !== "romance")
              .map((t) => (
                <Badge key={t} tone="neutral">
                  {CHARACTER_RELATIONSHIP_TYPE_LABEL[t]}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <Link
          href={`/characters/${character.slug}`}
          aria-label={`Open dossier for ${character.name}`}
          className="clip-chip inline-flex min-h-[44px] items-center gap-2 border border-line-bright bg-panel-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink after:absolute after:inset-0 hover:border-holo hover:text-holo"
        >
          Open dossier <span aria-hidden="true">→</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 text-right">
          {jobCount > 0 && (
            <span className="readout">
              {jobCount} job{jobCount === 1 ? "" : "s"}
            </span>
          )}
          <Badge tone={VERIFICATION_TONE[character.meta.verification]} title="Verification status">
            {VERIFICATION_LABEL[character.meta.verification]}
          </Badge>
        </div>
      </footer>
    </article>
  );
}
