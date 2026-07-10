"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import * as React from "react";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import { Checkbox, Field, Panel, Textarea } from "@/components/ui";
import { db } from "@/lib/database/db";
import { setCharacterProgress } from "@/lib/database/repo";
import { useActivePlaythrough } from "@/lib/hooks";
import { progressId } from "@/lib/ids";
import type { CharacterDef, CharacterProgress } from "@/types/domain";

/**
 * Interactive portion of a dossier: the spoiler-sensitive biography (behind the
 * shared spoiler shield) and the per-run player record (encounter + notes).
 * The spoiler-safe identity, connections and provenance are server-rendered by
 * the route so this client surface stays small.
 */
export function CharacterDossier({ character }: { character: CharacterDef }) {
  return (
    <div className="space-y-4">
      {character.spoilerBiography && (
        <Panel as="section" readout="// classified addendum" title="Story-sensitive details">
          <SpoilerShield
            level={character.spoilerLevel}
            revealKey={character.id}
            label="Reveal spoiler-sensitive biography"
          >
            <p className="border-l-2 border-holo/50 pl-3 text-sm text-ink-dim">
              {character.spoilerBiography}
            </p>
          </SpoilerShield>
        </Panel>
      )}

      <PlayerRecord character={character} />
    </div>
  );
}

function PlayerRecord({ character }: { character: CharacterDef }) {
  const { playthrough } = useActivePlaythrough();

  const result = useLiveQuery(async (): Promise<{ row: CharacterProgress | undefined }> => {
    if (!playthrough) return { row: undefined };
    return { row: await db.characterProgress.get(progressId(playthrough.id, character.id)) };
  }, [playthrough?.id, character.id]);

  return (
    <Panel as="section" readout="// player record" title="Your run">
      {!playthrough ? (
        <p className="text-sm text-ink-dim">
          Encounter tracking is per playthrough.{" "}
          <Link href="/playthroughs?new=1" className="text-holo underline underline-offset-2">
            Create a run
          </Link>{" "}
          to log whether you&apos;ve met {character.name}.
        </p>
      ) : result === undefined ? (
        <p className="readout">loading run data…</p>
      ) : (
        <PlayerRecordForm
          key={progressId(playthrough.id, character.id)}
          playthroughId={playthrough.id}
          character={character}
          row={result.row}
        />
      )}
    </Panel>
  );
}

function PlayerRecordForm({
  playthroughId,
  character,
  row,
}: {
  playthroughId: string;
  character: CharacterDef;
  row: CharacterProgress | undefined;
}) {
  const [notesDraft, setNotesDraft] = React.useState(row?.notes ?? "");
  const encountered = row?.encountered ?? false;

  return (
    <div className="space-y-3">
      <Checkbox
        id={`encountered-${character.id}`}
        label="Encountered in this run"
        description="Mark once you've met this character in your current playthrough."
        checked={encountered}
        onChange={(checked) =>
          void setCharacterProgress(playthroughId, character.id, { encountered: checked })
        }
      />
      <Field label="Personal notes" htmlFor={`character-notes-${character.id}`}>
        <Textarea
          id={`character-notes-${character.id}`}
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => {
            if (notesDraft !== (row?.notes ?? "")) {
              void setCharacterProgress(playthroughId, character.id, { notes: notesDraft });
            }
          }}
          placeholder="Where did you meet them? Any decisions involving them?"
        />
      </Field>
      <p className="text-[11px] text-ink-faint">Notes save when you click away.</p>
    </div>
  );
}
