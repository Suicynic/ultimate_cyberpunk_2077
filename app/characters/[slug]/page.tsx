import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterDossier } from "@/app/characters/CharacterDossier";
import { CharacterPortrait } from "@/app/characters/CharacterPortrait";
import { SourceList } from "@/components/shared/SourceList";
import { Badge, PageHeader, Panel, type Tone } from "@/components/ui";
import { characterById, characters, characterBySlug } from "@/data/characters";
import { factionById } from "@/data/factions";
import { jobById } from "@/data/jobs";
import {
  CHARACTER_CATEGORY_LABEL,
  CHARACTER_IMPORTANCE_LABEL,
  CHARACTER_RELATIONSHIP_TYPE_LABEL,
  CHARACTER_STATUS_LABEL,
  FACTION_CATEGORY_LABEL,
  GAME_SCOPE_LABEL,
} from "@/lib/labels";
import type { CharacterDef, FactionDef } from "@/types/domain";

export function generateStaticParams(): { slug: string }[] {
  return characters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const character = characterBySlug.get(slug);
  if (!character) return { title: "Character not found" };
  return {
    title: character.name,
    description: character.shortDescription,
  };
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="readout">{label}</dt>
      <dd className="text-sm text-ink-dim">{value}</dd>
    </div>
  );
}

export default async function CharacterDossierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const character = characterBySlug.get(slug);
  if (!character) notFound();

  const scopeTone: Tone = character.gameScope === "base_game" ? "neutral" : "violet";

  const relatedCharacters = (character.relatedCharacterIds ?? [])
    .map((id) => characterById.get(id))
    .filter((c): c is CharacterDef => Boolean(c));
  const relatedFactions = (character.relatedFactionIds ?? [])
    .map((id) => factionById.get(id))
    .filter((f): f is FactionDef => Boolean(f));
  const relevantJobs = (character.firstRelevantJobIds ?? []).map((id) => ({
    id,
    name: jobById.get(id)?.name ?? id,
  }));

  const hasConnections =
    relatedCharacters.length > 0 ||
    relatedFactions.length > 0 ||
    relevantJobs.length > 0 ||
    (character.relationshipTypes?.length ?? 0) > 0;

  return (
    <>
      <Link
        href="/characters"
        className="readout mb-3 inline-flex min-h-[44px] items-center text-holo hover:underline"
      >
        <span aria-hidden="true">←</span>&nbsp;Personnel archive
      </Link>

      <PageHeader
        readout={`// dossier · ${character.archiveId}`}
        title={character.name}
        description={character.role}
        actions={<Badge tone={scopeTone}>{GAME_SCOPE_LABEL[character.gameScope]}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Identity */}
        <div className="space-y-4 lg:col-span-1">
          <Panel as="section" readout="// identity" title="Identity block">
            <CharacterPortrait character={character} className="mb-4 w-full max-w-[220px]" />
            <dl className="space-y-2.5">
              {character.aliases && character.aliases.length > 0 && (
                <Meta label="Aliases" value={character.aliases.join(", ")} />
              )}
              <Meta
                label="Archive ID"
                value={<span className="font-mono">{character.archiveId}</span>}
              />
              <Meta label="Role" value={character.role} />
              {character.occupations && character.occupations.length > 0 && (
                <Meta label="Occupations" value={character.occupations.join(", ")} />
              )}
              <Meta label="Affiliations" value={character.affiliations.join(", ")} />
              {character.location && <Meta label="Location" value={character.location} />}
              {character.gender && <Meta label="Gender" value={character.gender} />}
              {character.pronouns && <Meta label="Pronouns" value={character.pronouns} />}
              <Meta label="Status" value={CHARACTER_STATUS_LABEL[character.status]} />
              <Meta label="Game scope" value={GAME_SCOPE_LABEL[character.gameScope]} />
              <Meta label="Category" value={CHARACTER_CATEGORY_LABEL[character.category]} />
              <Meta label="Importance" value={CHARACTER_IMPORTANCE_LABEL[character.importance]} />
            </dl>
          </Panel>
        </div>

        {/* Biography, dossier, connections, provenance */}
        <div className="space-y-4 lg:col-span-2">
          <Panel as="section" readout="// biography" title="Field biography">
            <p className="text-sm leading-relaxed text-ink-dim">{character.biography}</p>
          </Panel>

          <CharacterDossier character={character} />

          {hasConnections && (
            <Panel as="section" readout="// connections" title="Connections">
              <div className="grid gap-4 sm:grid-cols-2">
                {relatedCharacters.length > 0 && (
                  <div>
                    <p className="readout mb-1.5">Related characters</p>
                    <ul className="space-y-1">
                      {relatedCharacters.map((c) => (
                        <li key={c.id} className="text-sm">
                          <Link
                            href={`/characters/${c.slug}`}
                            className="text-holo underline underline-offset-2"
                          >
                            {c.name}
                          </Link>
                          <span className="text-ink-faint"> · {c.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {relatedFactions.length > 0 && (
                  <div>
                    <p className="readout mb-1.5">Related factions</p>
                    <ul className="space-y-1">
                      {relatedFactions.map((f) => (
                        <li key={f.id} className="text-sm text-ink-dim">
                          {f.name}
                          <span className="text-ink-faint">
                            {" "}
                            · {FACTION_CATEGORY_LABEL[f.category]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {relevantJobs.length > 0 && (
                  <div>
                    <p className="readout mb-1.5">Relevant jobs</p>
                    <ul className="space-y-1">
                      {relevantJobs.map((j) => (
                        <li key={j.id} className="text-sm">
                          <Link
                            href={`/jobs?focus=${encodeURIComponent(j.id)}`}
                            className="text-holo underline underline-offset-2"
                          >
                            {j.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {character.relationshipTypes && character.relationshipTypes.length > 0 && (
                  <div>
                    <p className="readout mb-1.5">Relationship relevance</p>
                    <div className="flex flex-wrap gap-1.5">
                      {character.relationshipTypes.map((t) => (
                        <Badge key={t} tone={t === "romance" ? "violet" : "neutral"}>
                          {CHARACTER_RELATIONSHIP_TYPE_LABEL[t]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}

          <Panel as="section" readout="// provenance" title="Sources & verification">
            <p className="readout mb-2">Verified against game v{character.meta.gameVersion}</p>
            <SourceList meta={character.meta} />
          </Panel>
        </div>
      </div>
    </>
  );
}
