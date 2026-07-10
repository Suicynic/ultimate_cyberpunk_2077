"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import * as React from "react";
import { SourceList } from "@/components/shared/SourceList";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  Select,
  Textarea,
  type Tone,
} from "@/components/ui";
import { endings, relationships } from "@/data/endings";
import { jobById, jobs } from "@/data/jobs";
import { db } from "@/lib/database/db";
import { newId, nowIso, progressId } from "@/lib/ids";
import { useActivePlaythrough, useSettings } from "@/lib/hooks";
import type {
  DecisionEntry,
  EndingProgressState,
  RelationshipProgressState,
  RequirementConfidence,
  SpoilerLevel,
} from "@/types/domain";

const CONFIDENCE_TONE: Record<RequirementConfidence, Tone> = {
  confirmed: "lime",
  probable: "amber",
  disputed: "signal",
};

const ENDING_STATE_LABEL: Record<EndingProgressState, string> = {
  hidden: "Untracked",
  revealed: "Revealed",
  unlocked: "Unlocked",
  completed: "Completed",
};

const REL_STATE_LABEL: Record<RelationshipProgressState, string> = {
  not_met: "Not met",
  met: "Met",
  in_progress: "In progress",
  committed: "Committed",
  declined: "Declined",
  ended: "Ended",
};

export default function EndingsPage() {
  const { playthrough } = useActivePlaythrough();
  const settings = useSettings();

  const endingProgress = useLiveQuery(
    async () =>
      playthrough ? db.endingProgress.where("playthroughId").equals(playthrough.id).toArray() : [],
    [playthrough?.id],
  );
  const relProgress = useLiveQuery(
    async () =>
      playthrough
        ? db.relationshipProgress.where("playthroughId").equals(playthrough.id).toArray()
        : [],
    [playthrough?.id],
  );
  const decisions = useLiveQuery(
    async () =>
      playthrough
        ? (
            await db.decisions.where("playthroughId").equals(playthrough.id).sortBy("createdAt")
          ).reverse()
        : [],
    [playthrough?.id],
  );

  if (!playthrough) {
    return (
      <>
        <PageHeader readout="// endgame intel" title="Endings" />
        <EmptyState
          title="No active run"
          body="Ending and relationship tracking is per playthrough."
          action={
            <Link href="/playthroughs?new=1" className="text-holo underline underline-offset-2">
              Create one now →
            </Link>
          }
        />
      </>
    );
  }

  const endingStateById = new Map((endingProgress ?? []).map((p) => [p.endingId, p]));
  const relStateById = new Map((relProgress ?? []).map((p) => [p.relationshipId, p]));

  return (
    <>
      <PageHeader
        readout="// endgame intel · spoiler shield engaged"
        title={settings.conventionalLabels ? "Endings & Relationships" : "Endgame Intel"}
        description="Everything meaningful stays hidden until you reveal it. Requirements are labeled confirmed, probable, or disputed — community findings are never presented as fact."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Endings */}
        <section aria-label="Endings" className="space-y-3">
          <h2 className="readout !text-ink-dim">Epilogue paths ({endings.length})</h2>
          {endings
            .filter((e) => e.expansion === "base" || playthrough.hasPhantomLiberty)
            .map((ending) => {
              const state = endingStateById.get(ending.id)?.state ?? "hidden";
              return (
                <Panel
                  key={ending.id}
                  as="article"
                  readout={`// ${ending.expansion === "phantom_liberty" ? "phantom liberty" : "base game"}`}
                  title={
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{ending.codename}</span>
                      {state !== "hidden" && (
                        <Badge tone={state === "completed" ? "lime" : "holo"}>
                          {ENDING_STATE_LABEL[state]}
                        </Badge>
                      )}
                    </span>
                  }
                  actions={
                    <>
                      <label htmlFor={`ending-state-${ending.id}`} className="sr-only">
                        Tracking state for {ending.codename}
                      </label>
                      <select
                        id={`ending-state-${ending.id}`}
                        value={state}
                        onChange={(e) =>
                          void db.endingProgress.put({
                            id: progressId(playthrough.id, ending.id),
                            playthroughId: playthrough.id,
                            endingId: ending.id,
                            state: e.target.value as EndingProgressState,
                            updatedAt: nowIso(),
                          })
                        }
                        className="clip-chip min-h-[36px] border border-line bg-panel-2 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-dim"
                      >
                        {Object.entries(ENDING_STATE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </>
                  }
                >
                  <SpoilerShield
                    level="endgame"
                    revealKey={ending.id}
                    label="Reveal name, summary & requirements"
                  >
                    <h3 className="mb-1 text-base font-bold text-ink">{ending.name}</h3>
                    <p className="mb-3 text-sm text-ink-dim">{ending.summarySpoiler}</p>
                    <p className="readout mb-1">Requirements</p>
                    <ul className="mb-3 space-y-1.5">
                      {ending.requirements.map((req) => (
                        <li key={req.text} className="flex items-start gap-2 text-sm">
                          <Badge tone={CONFIDENCE_TONE[req.confidence]} className="mt-0.5 shrink-0">
                            {req.confidence}
                          </Badge>
                          <span className="text-ink-dim">{req.text}</span>
                        </li>
                      ))}
                    </ul>
                    {(ending.relatedJobIds?.length ?? 0) > 0 && (
                      <p className="mb-2 text-xs text-ink-faint">
                        Related jobs:{" "}
                        {ending.relatedJobIds?.map((jid, i) => (
                          <React.Fragment key={jid}>
                            {i > 0 && ", "}
                            <Link
                              href={`/jobs?focus=${encodeURIComponent(jid)}`}
                              className="text-holo underline underline-offset-2"
                            >
                              {jobById.get(jid)?.name ?? jid}
                            </Link>
                          </React.Fragment>
                        ))}
                      </p>
                    )}
                    <SourceList meta={ending.meta} />
                  </SpoilerShield>
                </Panel>
              );
            })}
        </section>

        <div className="space-y-6">
          {/* Relationships */}
          <section aria-label="Relationships" className="space-y-3">
            <h2 className="readout !text-ink-dim">Relationship paths</h2>
            {relationships.map((rel) => {
              const state = relStateById.get(rel.id)?.state ?? "not_met";
              return (
                <Panel
                  key={rel.id}
                  as="article"
                  readout={`// ${rel.kind}`}
                  title={rel.characterName}
                  actions={
                    <>
                      <label htmlFor={`rel-${rel.id}`} className="sr-only">
                        Relationship state with {rel.characterName}
                      </label>
                      <select
                        id={`rel-${rel.id}`}
                        value={state}
                        onChange={(e) =>
                          void db.relationshipProgress.put({
                            id: progressId(playthrough.id, rel.id),
                            playthroughId: playthrough.id,
                            relationshipId: rel.id,
                            state: e.target.value as RelationshipProgressState,
                            updatedAt: nowIso(),
                          })
                        }
                        className="clip-chip min-h-[36px] border border-line bg-panel-2 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-dim"
                      >
                        {Object.entries(REL_STATE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </>
                  }
                >
                  <SpoilerShield level={rel.spoilerLevel} revealKey={rel.id} label="Availability">
                    <p className="text-sm text-ink-dim">{rel.availability}</p>
                  </SpoilerShield>
                </Panel>
              );
            })}
          </section>

          {/* Decision journal */}
          <DecisionJournal playthroughId={playthrough.id} decisions={decisions ?? []} />
        </div>
      </div>
    </>
  );
}

function DecisionJournal({
  playthroughId,
  decisions,
}: {
  playthroughId: string;
  decisions: DecisionEntry[];
}) {
  const [title, setTitle] = React.useState("");
  const [choice, setChoice] = React.useState("");
  const [jobId, setJobId] = React.useState("");
  const [immediate, setImmediate] = React.useState("");
  const [reasoning, setReasoning] = React.useState("");
  const [spoilerLevel, setSpoilerLevel] = React.useState<SpoilerLevel>("major");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !choice.trim()) return;
    await db.decisions.add({
      id: newId("dec"),
      playthroughId,
      jobId: jobId || undefined,
      title: title.trim(),
      choice: choice.trim(),
      immediateResult: immediate.trim() || undefined,
      reasoning: reasoning.trim() || undefined,
      spoilerLevel,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    setTitle("");
    setChoice("");
    setImmediate("");
    setReasoning("");
  };

  return (
    <section aria-label="Decision journal">
      <h2 className="readout mb-3 !text-ink-dim">Decision & consequence journal</h2>
      <Panel readout="// new entry" title="Log a decision">
        <form onSubmit={add} className="grid gap-3">
          <Field label="Decision title" htmlFor="dec-title">
            <Input
              id="dec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Who I sided with at the stadium"
              maxLength={160}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Related job (optional)" htmlFor="dec-job">
              <Select id="dec-job" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                <option value="">— none —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Spoiler sensitivity" htmlFor="dec-spoiler">
              <Select
                id="dec-spoiler"
                value={spoilerLevel}
                onChange={(e) => setSpoilerLevel(e.target.value as SpoilerLevel)}
              >
                <option value="none">None</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="endgame">Endgame</option>
              </Select>
            </Field>
          </div>
          <Field label="What did you choose?" htmlFor="dec-choice">
            <Textarea
              id="dec-choice"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              required
            />
          </Field>
          <Field label="Immediate result (optional)" htmlFor="dec-immediate">
            <Textarea
              id="dec-immediate"
              value={immediate}
              onChange={(e) => setImmediate(e.target.value)}
            />
          </Field>
          <Field label="Why? (optional)" htmlFor="dec-why">
            <Textarea
              id="dec-why"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={!title.trim() || !choice.trim()}>
              Log decision
            </Button>
          </div>
        </form>
      </Panel>

      <div className="mt-3 space-y-2">
        {decisions.map((d) => (
          <Panel
            key={d.id}
            as="article"
            readout={`// ${d.createdAt.slice(0, 10)}${d.jobId ? ` · ${jobById.get(d.jobId)?.name ?? d.jobId}` : ""}`}
            title={d.title}
            actions={
              <Button
                size="sm"
                variant="danger"
                aria-label={`Delete decision "${d.title}"`}
                onClick={() => void db.decisions.delete(d.id)}
              >
                Delete
              </Button>
            }
          >
            <SpoilerShield level={d.spoilerLevel} revealKey={d.id} label="Journal entry">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="readout">Choice</dt>
                  <dd className="text-ink-dim">{d.choice}</dd>
                </div>
                {d.immediateResult && (
                  <div>
                    <dt className="readout">Immediate result</dt>
                    <dd className="text-ink-dim">{d.immediateResult}</dd>
                  </div>
                )}
                {d.reasoning && (
                  <div>
                    <dt className="readout">Reasoning</dt>
                    <dd className="text-ink-dim">{d.reasoning}</dd>
                  </div>
                )}
              </dl>
            </SpoilerShield>
          </Panel>
        ))}
      </div>
    </section>
  );
}
