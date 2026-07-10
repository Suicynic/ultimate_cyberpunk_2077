"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import * as React from "react";
import { buildCanonicalSearchDocs, type SearchDoc } from "@/lib/search";
import { db } from "@/lib/database/db";
import { downloadExport } from "@/lib/import-export";
import { setActivePlaythrough, updateSettings } from "@/lib/database/repo";
import { useLiveQuery } from "dexie-react-hooks";
import { useSettings, useSpoilerGuard } from "@/lib/hooks";
import { useUiStore } from "@/lib/stores/ui";

/**
 * Global command palette (Ctrl/Cmd+K): search across canonical records and
 * user data, plus quick actions. Spoiler-shielded records show their
 * spoiler-safe titles only.
 */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUiStore();
  const router = useRouter();
  const settings = useSettings();
  const guard = useSpoilerGuard();

  const canonicalDocs = React.useMemo(() => buildCanonicalSearchDocs(), []);

  const userDocs = useLiveQuery(async (): Promise<SearchDoc[]> => {
    const [playthroughs, notes, builds] = await Promise.all([
      db.playthroughs.toArray(),
      db.notes.toArray(),
      db.builds.toArray(),
    ]);
    return [
      ...playthroughs.map((p): SearchDoc => ({
        id: p.id,
        type: "playthrough",
        title: p.name,
        subtitle: "Playthrough",
        href: "/playthroughs",
        spoilerLevel: "none",
      })),
      ...notes.map((n): SearchDoc => ({
        id: n.id,
        type: "note",
        title: n.title,
        subtitle: "Note",
        href: "/dashboard",
        spoilerLevel: "none",
      })),
      ...builds.map((b): SearchDoc => ({
        id: b.id,
        type: "build",
        title: b.name,
        subtitle: "Build",
        href: `/builds?focus=${encodeURIComponent(b.id)}`,
        spoilerLevel: "none",
      })),
    ];
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  const go = (href: string) => {
    setPaletteOpen(false);
    router.push(href);
  };

  const allDocs = React.useMemo(
    () => [...canonicalDocs, ...(userDocs ?? [])],
    [canonicalDocs, userDocs],
  );

  const playthroughs = useLiveQuery(() => db.playthroughs.toArray(), []);

  return (
    <Command.Dialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      label="Global search and commands"
      contentClassName="clip-panel fixed left-1/2 top-[12dvh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 border border-line-bright bg-panel shadow-2xl"
      overlayClassName="fixed inset-0 z-40 bg-void/80 backdrop-blur-sm"
    >
      <div className="border-b border-line px-3 py-1">
        <Command.Input
          placeholder="Search jobs, characters, achievements, markers…"
          className="w-full bg-transparent px-1 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>
      <Command.List className="max-h-[50dvh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-ink-faint">
          No records match. // try a different query
        </Command.Empty>

        <Command.Group
          heading="Actions"
          className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-ink-faint"
        >
          <PaletteItem onSelect={() => go("/playthroughs?new=1")}>Create playthrough</PaletteItem>
          <PaletteItem onSelect={() => go("/builds?new=1")}>Create build</PaletteItem>
          <PaletteItem
            onSelect={() => {
              void updateSettings({
                spoilerMode: settings.spoilerMode === "show_all" ? "hide_major" : "show_all",
              });
              setPaletteOpen(false);
            }}
          >
            Toggle spoiler shield ({settings.spoilerMode === "show_all" ? "enable" : "disable"})
          </PaletteItem>
          <PaletteItem
            onSelect={() => {
              void downloadExport();
              setPaletteOpen(false);
            }}
          >
            Export data (JSON backup)
          </PaletteItem>
          {(playthroughs ?? []).slice(0, 5).map((p) => (
            <PaletteItem
              key={p.id}
              onSelect={() => {
                void setActivePlaythrough(p.id);
                setPaletteOpen(false);
              }}
            >
              Switch run → {p.name}
            </PaletteItem>
          ))}
        </Command.Group>

        <Command.Group
          heading="Database"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-ink-faint"
        >
          {allDocs.map((doc) => {
            const shielded = guard(doc.spoilerLevel, doc.id);
            return (
              <PaletteItem
                key={`${doc.type}:${doc.id}`}
                value={`${doc.title} ${doc.subtitle ?? ""} ${doc.keywords ?? ""}`}
                onSelect={() => go(doc.href)}
              >
                <span className="min-w-0 flex-1 truncate">
                  {doc.title}
                  {shielded && <span className="ml-2 text-amber">⛨</span>}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  {doc.subtitle}
                </span>
              </PaletteItem>
            );
          })}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

function PaletteItem({
  children,
  onSelect,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex min-h-[44px] cursor-pointer items-center gap-3 px-3 py-2 text-sm text-ink-dim data-[selected=true]:bg-panel-3 data-[selected=true]:text-holo"
    >
      {children}
    </Command.Item>
  );
}
