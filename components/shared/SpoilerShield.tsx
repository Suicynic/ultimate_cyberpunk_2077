"use client";

import * as React from "react";
import { revealSpoiler } from "@/lib/database/repo";
import { useSpoilerGuard } from "@/lib/hooks";
import { useUiStore } from "@/lib/stores/ui";
import { SPOILER_LEVEL_LABEL } from "@/lib/spoilers";
import type { SpoilerLevel } from "@/types/domain";

/**
 * Reveal-on-demand spoiler wrapper. When shielded, content is replaced (not
 * merely blurred — nothing leaks to screen readers or search) by a reveal
 * button. "Reveal" persists for this record; "peek" reveals for the session.
 */
export function SpoilerShield({
  level,
  revealKey,
  children,
  inline = false,
  label,
}: {
  level: SpoilerLevel;
  /** Stable key so this reveal can be persisted, e.g. "job:the-heist". */
  revealKey: string;
  children: React.ReactNode;
  inline?: boolean;
  label?: string;
}) {
  const shielded = useSpoilerGuard()(level, revealKey);
  const revealForSession = useUiStore((s) => s.revealForSession);

  if (!shielded) return <>{children}</>;

  const Tag = inline ? "span" : "div";
  return (
    <Tag
      className={
        inline
          ? "inline-flex items-center gap-2"
          : "clip-chip flex flex-wrap items-center gap-3 border border-amber/40 bg-panel-2 px-3 py-2"
      }
    >
      <span className="readout !text-amber">⛨ {SPOILER_LEVEL_LABEL[level]}</span>
      {label && <span className="text-xs text-ink-faint">{label}</span>}
      <span className="flex items-center gap-2">
        <button
          type="button"
          className="clip-chip border border-line-bright bg-panel-3 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-holo hover:border-holo"
          onClick={() => revealForSession(revealKey)}
        >
          Peek
        </button>
        <button
          type="button"
          className="clip-chip border border-line px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-dim hover:border-holo hover:text-holo"
          onClick={() => void revealSpoiler(revealKey)}
        >
          Always show
        </button>
      </span>
    </Tag>
  );
}
