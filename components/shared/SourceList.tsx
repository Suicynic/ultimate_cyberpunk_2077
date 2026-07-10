"use client";

import * as React from "react";
import { Badge, type Tone } from "@/components/ui";
import { VERIFICATION_LABEL } from "@/lib/labels";
import type { CanonicalMeta } from "@/types/domain";

const verificationTone: Record<CanonicalMeta["verification"], Tone> = {
  unverified: "amber",
  community_verified: "holo",
  source_verified: "lime",
  version_outdated: "signal",
  disputed: "signal",
  deprecated: "neutral",
};

/**
 * Provenance readout for a canonical record: game version, expansion,
 * verification status, and outbound source links.
 */
export function SourceList({ meta, className }: { meta: CanonicalMeta; className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral" title="Game version this record was last verified against">
          v{meta.gameVersion}
        </Badge>
        {meta.expansion === "phantom_liberty" && <Badge tone="violet">Phantom Liberty</Badge>}
        <Badge tone={verificationTone[meta.verification]}>
          {VERIFICATION_LABEL[meta.verification]}
        </Badge>
        {meta.maybeOutdated && <Badge tone="amber">May be outdated</Badge>}
      </div>
      <ul className="mt-2 space-y-1">
        {meta.sources.map((s) => (
          <li key={s.url} className="text-xs text-ink-faint">
            <span className="readout !normal-case !tracking-normal">src → </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-holo underline decoration-holo/40 underline-offset-2 hover:decoration-holo"
            >
              {s.title}
            </a>
            {s.publisher && <span> · {s.publisher}</span>}
            {s.accessedAt && <span> · accessed {s.accessedAt}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
