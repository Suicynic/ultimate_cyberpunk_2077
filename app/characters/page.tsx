import type { Metadata } from "next";
import { CharacterArchive } from "@/app/characters/CharacterArchive";

export const metadata: Metadata = {
  title: "Character Database",
  description:
    "Dossier-style archive of major Cyberpunk 2077 and Phantom Liberty characters, factions and relationships — spoiler-shielded and source-backed.",
};

export default function CharactersPage() {
  return <CharacterArchive />;
}
