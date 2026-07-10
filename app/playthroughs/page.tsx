"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  Select,
  Textarea,
} from "@/components/ui";
import {
  createPlaythrough,
  deletePlaythrough,
  duplicatePlaythrough,
  setActivePlaythrough,
  setPlaythroughArchived,
  updatePlaythrough,
} from "@/lib/database/repo";
import { useActivePlaythrough, usePlaythroughs, useSettings } from "@/lib/hooks";
import { LIFEPATH_LABEL, PLATFORM_LABEL, PLAYTHROUGH_STATUS_LABEL } from "@/lib/labels";
import type {
  Difficulty,
  Lifepath,
  Platform,
  Playthrough,
  PlaythroughStatus,
} from "@/types/domain";

function NewRunDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = React.useState("");
  const [lifepath, setLifepath] = React.useState<Lifepath>("streetkid");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("normal");
  const [platform, setPlatform] = React.useState<Platform>("pc_steam");
  const [hasPl, setHasPl] = React.useState(true);
  const [label, setLabel] = React.useState("");
  const [concept, setConcept] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const run = await createPlaythrough({
        name: name.trim(),
        lifepath,
        difficulty,
        platform,
        hasPhantomLiberty: hasPl,
        label: label.trim() || undefined,
        concept: concept.trim() || undefined,
      });
      await setActivePlaythrough(run.id);
      onOpenChange(false);
      setName("");
      setConcept("");
      setLabel("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Register new run"
      description="A run is one character's journey. All progress you track is scoped to it."
    >
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Character name" htmlFor="run-name">
          <Input
            id="run-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="V"
            maxLength={80}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lifepath" htmlFor="run-lifepath">
            <Select
              id="run-lifepath"
              value={lifepath}
              onChange={(e) => setLifepath(e.target.value as Lifepath)}
            >
              {Object.entries(LIFEPATH_LABEL).map(([value, l]) => (
                <option key={value} value={value}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty" htmlFor="run-difficulty">
            <Select
              id="run-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="very_hard">Very Hard</option>
            </Select>
          </Field>
          <Field label="Platform" htmlFor="run-platform">
            <Select
              id="run-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
            >
              {Object.entries(PLATFORM_LABEL).map(([value, l]) => (
                <option key={value} value={value}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pronouns / label" htmlFor="run-label" hint="Optional">
            <Input id="run-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
        </div>
        <Checkbox
          id="run-pl"
          label="Phantom Liberty installed"
          description="Enables Dogtown content, relic perks, and level cap 60."
          checked={hasPl}
          onChange={setHasPl}
        />
        <Field
          label="Roleplay concept"
          htmlFor="run-concept"
          hint="Optional — what is this run about?"
        >
          <Textarea
            id="run-concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Non-lethal netrunner who never works for corps…"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!name.trim() || busy}>
            {busy ? "Registering…" : "Create run"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function RunCard({ run, isActive }: { run: Playthrough; isActive: boolean }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <Panel
      readout={`// run ${run.id.slice(-6)} · ${run.gameVersion}`}
      title={
        <span className="flex items-center gap-2">
          {run.name}
          {isActive && <Badge tone="holo">Active</Badge>}
          {run.archived && <Badge tone="neutral">Archived</Badge>}
        </span>
      }
      actions={
        !isActive && !run.archived ? (
          <Button size="sm" variant="primary" onClick={() => void setActivePlaythrough(run.id)}>
            Activate
          </Button>
        ) : undefined
      }
    >
      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <InfoRow label="Lifepath" value={LIFEPATH_LABEL[run.lifepath]} />
        <InfoRow label="Platform" value={PLATFORM_LABEL[run.platform]} />
        <InfoRow label="Status" value={PLAYTHROUGH_STATUS_LABEL[run.status]} />
        <InfoRow label="Level" value={String(run.level)} />
        <InfoRow label="Street Cred" value={String(run.streetCred)} />
        <InfoRow label="Act" value={`Act ${run.act}`} />
      </dl>
      {run.concept && <p className="mb-3 text-sm text-ink-dim">{run.concept}</p>}
      {run.hasPhantomLiberty && (
        <Badge tone="violet" className="mb-3">
          Phantom Liberty
        </Badge>
      )}

      <div className="mb-3 grid grid-cols-3 gap-2">
        <Field label="Level" htmlFor={`lvl-${run.id}`}>
          <Input
            id={`lvl-${run.id}`}
            type="number"
            min={1}
            max={60}
            value={run.level}
            onChange={(e) =>
              void updatePlaythrough(run.id, {
                level: Math.min(60, Math.max(1, Number(e.target.value) || 1)),
              })
            }
          />
        </Field>
        <Field label="Street Cred" htmlFor={`sc-${run.id}`}>
          <Input
            id={`sc-${run.id}`}
            type="number"
            min={1}
            max={50}
            value={run.streetCred}
            onChange={(e) =>
              void updatePlaythrough(run.id, {
                streetCred: Math.min(50, Math.max(1, Number(e.target.value) || 1)),
              })
            }
          />
        </Field>
        <Field label="Act" htmlFor={`act-${run.id}`}>
          <Select
            id={`act-${run.id}`}
            value={run.act}
            onChange={(e) =>
              void updatePlaythrough(run.id, { act: Number(e.target.value) as 1 | 2 | 3 })
            }
          >
            <option value={1}>Act 1</option>
            <option value={2}>Act 2</option>
            <option value={3}>Act 3</option>
          </Select>
        </Field>
      </div>

      <Field label="Run status" htmlFor={`status-${run.id}`} className="mb-4">
        <Select
          id={`status-${run.id}`}
          value={run.status}
          onChange={(e) =>
            void updatePlaythrough(run.id, { status: e.target.value as PlaythroughStatus })
          }
        >
          {Object.entries(PLAYTHROUGH_STATUS_LABEL).map(([value, l]) => (
            <option key={value} value={value}>
              {l}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void duplicatePlaythrough(run.id)}>
          Duplicate
        </Button>
        <Button size="sm" onClick={() => void setPlaythroughArchived(run.id, !run.archived)}>
          {run.archived ? "Unarchive" : "Archive"}
        </Button>
        {confirmDelete ? (
          <span className="flex items-center gap-2">
            <span className="text-xs text-signal">Delete run and all its progress?</span>
            <Button size="sm" variant="danger" onClick={() => void deletePlaythrough(run.id)}>
              Confirm delete
            </Button>
            <Button size="sm" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        )}
      </div>
    </Panel>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="readout">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

export default function PlaythroughsPage() {
  return (
    <React.Suspense fallback={null}>
      <PlaythroughsPageInner />
    </React.Suspense>
  );
}

function PlaythroughsPageInner() {
  const playthroughs = usePlaythroughs();
  const { playthrough: active } = useActivePlaythrough();
  const settings = useSettings();
  const params = useSearchParams();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (params.get("new") === "1") setDialogOpen(true);
  }, [params]);

  return (
    <>
      <PageHeader
        readout="// run registry"
        title={settings.conventionalLabels ? "Playthroughs" : "Active Runs"}
        description="Each run tracks one character. Duplicate a run to fork it, archive finished ones, or export everything from Settings."
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            + New run
          </Button>
        }
      />

      <NewRunDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {playthroughs && playthroughs.length === 0 ? (
        <EmptyState
          title="No runs registered"
          body="Create your first playthrough to unlock the rest of the app."
          action={
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              + Create playthrough
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {(playthroughs ?? []).map((run) => (
            <RunCard key={run.id} run={run} isActive={active?.id === run.id} />
          ))}
        </div>
      )}
    </>
  );
}
