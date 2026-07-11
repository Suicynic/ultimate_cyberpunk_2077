import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PlayerRecordForm } from "@/app/characters/CharacterDossier";
import { db } from "@/lib/database/db";
import { progressId } from "@/lib/ids";
import type { CharacterDef, CharacterProgress } from "@/types/domain";

/**
 * Regression coverage for the per-run character notes field. It mirrors
 * JobCard's issue-#3 reconciliation: `row` is delivered by the parent's
 * useLiveQuery and can change without the form remounting, so a stale draft must
 * never be written back over a newer persisted value.
 */

const RUN_ID = "run_test";
const CHAR: CharacterDef = {
  id: "character:test-record",
  slug: "test-record",
  name: "Test Record",
  archiveId: "NCPA-9003",
  initials: "TR",
  role: "Test",
  affiliations: ["Test"],
  status: "active",
  gameScope: "base_game",
  importance: "major",
  category: "core",
  shortDescription: "Safe blurb.",
  biography: "Safe biography.",
  spoilerLevel: "none",
  tags: ["test"],
  meta: {
    gameVersion: "2.3",
    expansion: "base",
    verification: "community_verified",
    sources: [{ title: "src", url: "https://example.com" }],
  },
};

function progressRow(runId: string, notes: string | undefined): CharacterProgress {
  return {
    id: progressId(runId, CHAR.id),
    playthroughId: runId,
    characterId: CHAR.id,
    encountered: false,
    notes,
    updatedAt: new Date(0).toISOString(),
  };
}

function notesField(): HTMLTextAreaElement {
  return screen.getByLabelText("Personal notes") as HTMLTextAreaElement;
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(cleanup);

describe("PlayerRecordForm notes reconciliation", () => {
  it("adopts a persisted note that arrives asynchronously while clean and unfocused", async () => {
    const { rerender } = render(
      <PlayerRecordForm playthroughId={RUN_ID} character={CHAR} row={undefined} />,
    );
    expect(notesField()).toHaveValue("");

    rerender(
      <PlayerRecordForm
        playthroughId={RUN_ID}
        character={CHAR}
        row={progressRow(RUN_ID, "met in Watson")}
      />,
    );
    await waitFor(() => expect(notesField()).toHaveValue("met in Watson"));
  });

  it("does not overwrite an in-progress edit when a late row arrives", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PlayerRecordForm playthroughId={RUN_ID} character={CHAR} row={undefined} />,
    );
    await user.type(notesField(), "my draft");
    expect(notesField()).toHaveValue("my draft");

    rerender(
      <PlayerRecordForm
        playthroughId={RUN_ID}
        character={CHAR}
        row={progressRow(RUN_ID, "stale persisted value")}
      />,
    );
    expect(notesField()).toHaveValue("my draft");
  });

  it("adopts an external persisted update while the draft is clean and unfocused", async () => {
    const { rerender } = render(
      <PlayerRecordForm
        playthroughId={RUN_ID}
        character={CHAR}
        row={progressRow(RUN_ID, "first")}
      />,
    );
    expect(notesField()).toHaveValue("first");

    rerender(
      <PlayerRecordForm
        playthroughId={RUN_ID}
        character={CHAR}
        row={progressRow(RUN_ID, "second")}
      />,
    );
    await waitFor(() => expect(notesField()).toHaveValue("second"));
  });

  it("defers an external update while focused-but-clean, then adopts it on blur without writing the stale value", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PlayerRecordForm
        playthroughId={RUN_ID}
        character={CHAR}
        row={progressRow(RUN_ID, "original")}
      />,
    );
    // Focus the field without typing — the draft stays clean.
    await user.click(notesField());
    expect(notesField()).toHaveValue("original");

    // An external write lands while the field is focused. Adoption is deferred so
    // the text does not shift under the caret.
    rerender(
      <PlayerRecordForm
        playthroughId={RUN_ID}
        character={CHAR}
        row={progressRow(RUN_ID, "external update")}
      />,
    );
    expect(notesField()).toHaveValue("original");

    // On blur the deferred value is adopted, and the stale draft must NOT be
    // written back to Dexie (which would clobber the external update).
    await user.tab();
    await waitFor(() => expect(notesField()).toHaveValue("external update"));
    const persisted = await db.characterProgress.get(progressId(RUN_ID, CHAR.id));
    expect(persisted).toBeUndefined();
  });

  it("persists a genuine edit to Dexie on blur", async () => {
    const user = userEvent.setup();
    render(<PlayerRecordForm playthroughId={RUN_ID} character={CHAR} row={undefined} />);

    await user.type(notesField(), "sided against Arasaka");
    await user.tab();

    await waitFor(async () => {
      const row = await db.characterProgress.get(progressId(RUN_ID, CHAR.id));
      expect(row?.notes).toBe("sided against Arasaka");
    });
    expect(notesField()).toHaveValue("sided against Arasaka");
  });
});
