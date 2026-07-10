/**
 * Pre-generate the canonical search index as JSON.
 *
 * The app builds its Fuse.js index at runtime (the dataset is small), but
 * this script exists so a static index can be shipped once the full quest
 * database lands. Output: public/search-index.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import { buildCanonicalSearchDocs } from "../../lib/search";

async function main() {
  const docs = buildCanonicalSearchDocs();
  await mkdir("public", { recursive: true });
  await writeFile("public/search-index.json", JSON.stringify(docs, null, 2));
  console.log(`Wrote public/search-index.json with ${docs.length} documents ✓`);
}

void main();
