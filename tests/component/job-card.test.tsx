import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JobCard } from "@/app/jobs/JobCard";
import { jobById } from "@/data/jobs";
import { db } from "@/lib/database/db";
import { progressId } from "@/lib/ids";
import type { JobProgress } from "@/types/domain";

/**
 * Regression coverage for issue #3: the per-job notes textarea must hydrate
 * from persisted progress that arrives asynchronously (the parent's
 * `useLiveQuery` resolves undefined → loaded), while never clobbering an edit
 * the user is actively making.
 */

const RUN_ID = "run_test";
const JOB = jobById.get("job:the-rescue")!;

/** Build a JobProgress row for the fixture job in a given run. */
function progressRow(runId: string, notes: string | undefined): JobProgress {
  return {
    id: progressId(runId, JOB.id),
    playthroughId: runId,
    jobId: JOB.id,
    status: "available",
    pinned: false,
    notes,
    updatedAt: new Date(0).toISOString(),
  };
}

/** Expand the (initially collapsed) card so its notes textarea is mounted. */
async function expand(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { expanded: false }));
}

function notesField(): HTMLTextAreaElement {
  return screen.getByLabelText("Personal notes & decisions") as HTMLTextAreaElement;
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

afterEach(() => {
  cleanup();
});

describe("JobCard notes hydration (issue #3)", () => {
  it("hydrates the textarea when persisted progress arrives asynchronously", async () => {
    const user = userEvent.setup();
    // Mount before the live query has resolved — progress is undefined.
    const { rerender } = render(
      <JobCard job={JOB} progress={undefined} playthroughId={RUN_ID} focused={false} />,
    );
    await expand(user);
    expect(notesField()).toHaveValue("");

    // The persisted row arrives (Dexie resolved). The card is not remounted.
    rerender(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, "romanced Judy")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    await waitFor(() => expect(notesField()).toHaveValue("romanced Judy"));
  });

  it("shows a saved note on a fresh mount (reload / navigate back)", async () => {
    const user = userEvent.setup();
    // A reload mounts the card with the row already present.
    render(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, "sided with Panam")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    await expand(user);
    expect(notesField()).toHaveValue("sided with Panam");
  });

  it("does not overwrite an in-progress edit when a late Dexie result arrives", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <JobCard job={JOB} progress={undefined} playthroughId={RUN_ID} focused={false} />,
    );
    await expand(user);

    // User starts typing before the persisted value has loaded.
    await user.type(notesField(), "my draft");
    expect(notesField()).toHaveValue("my draft");

    // A late live-query result resolves with a different persisted value.
    rerender(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, "stale persisted value")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );

    // The in-progress edit must survive — never clobbered.
    expect(notesField()).toHaveValue("my draft");
  });

  it("adopts an external persisted update while the draft is clean and unfocused", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, "first")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    await expand(user);
    expect(notesField()).toHaveValue("first");

    // An external write (e.g. another tab) updates the persisted note; the
    // local field is clean and unfocused, so it is safe to hydrate.
    rerender(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, "second")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    await waitFor(() => expect(notesField()).toHaveValue("second"));
  });

  it("defers an external update while focused-but-clean, then adopts it on blur without writing the stale value", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, "original")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    await expand(user);
    // Focus the field without typing anything — the draft stays clean.
    await user.click(notesField());
    expect(notesField()).toHaveValue("original");

    // An external write lands while the field is focused. Adoption is deferred
    // so text never shifts under the caret: the value must stay stable.
    rerender(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, "external update")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    expect(notesField()).toHaveValue("original");

    // On blur the deferred value is adopted, and the stale draft must NOT be
    // written back to Dexie (which would clobber the external update).
    await user.tab();
    await waitFor(() => expect(notesField()).toHaveValue("external update"));
    const row = await db.jobProgress.get(progressId(RUN_ID, JOB.id));
    expect(row).toBeUndefined();
  });

  it("keeps an empty persisted note empty", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <JobCard job={JOB} progress={undefined} playthroughId={RUN_ID} focused={false} />,
    );
    await expand(user);
    expect(notesField()).toHaveValue("");

    // Row loads with no notes recorded.
    rerender(
      <JobCard
        job={JOB}
        progress={progressRow(RUN_ID, undefined)}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    expect(notesField()).toHaveValue("");
  });

  it("re-seeds from the new run's note when the card is remounted per playthrough", async () => {
    const user = userEvent.setup();
    // The page keys each card `${playthrough.id}:${job.id}`, so switching runs
    // remounts the card. A remount must show the new run's saved note.
    const { rerender } = render(
      <JobCard
        key={`${RUN_ID}:${JOB.id}`}
        job={JOB}
        progress={progressRow(RUN_ID, "run A note")}
        playthroughId={RUN_ID}
        focused={false}
      />,
    );
    await expand(user);
    expect(notesField()).toHaveValue("run A note");

    const OTHER_RUN = "run_other";
    rerender(
      <JobCard
        key={`${OTHER_RUN}:${JOB.id}`}
        job={JOB}
        progress={progressRow(OTHER_RUN, "run B note")}
        playthroughId={OTHER_RUN}
        focused={false}
      />,
    );
    await expand(user);
    expect(notesField()).toHaveValue("run B note");
  });

  it("persists the draft to Dexie on blur and keeps it displayed", async () => {
    const user = userEvent.setup();
    render(<JobCard job={JOB} progress={undefined} playthroughId={RUN_ID} focused={false} />);
    await expand(user);

    await user.type(notesField(), "clicked the door");
    // Blur by moving focus away from the textarea.
    await user.tab();

    await waitFor(async () => {
      const row = await db.jobProgress.get(progressId(RUN_ID, JOB.id));
      expect(row?.notes).toBe("clicked the door");
    });
    // Blur-based persistence must not wipe the visible draft.
    expect(notesField()).toHaveValue("clicked the door");
  });
});
