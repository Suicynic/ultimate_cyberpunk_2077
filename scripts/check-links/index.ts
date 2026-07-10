/**
 * External link health check.
 *
 * Verifies that curated resource URLs and cited source URLs still respond.
 * Deliberately fetches headers only — this tool never imports or stores
 * external content. Run manually or on a schedule (see .github/workflows).
 *
 * Exit code 0 with warnings: broken links are reported for human review
 * rather than failing CI hard (sites rate-limit and flake).
 */
import { achievements } from "../../data/achievements";
import { collectibles } from "../../data/collections";
import { endings, relationships } from "../../data/endings";
import { jobs } from "../../data/jobs";
import { mapMarkers } from "../../data/map";
import { resources } from "../../data/resources";

const urls = new Map<string, string[]>(); // url -> record ids

function collect(id: string, url: string) {
  urls.set(url, [...(urls.get(url) ?? []), id]);
}

for (const r of resources) collect(r.id, r.url);
for (const list of [jobs, achievements, mapMarkers, collectibles, endings, relationships]) {
  for (const record of list) {
    for (const s of record.meta.sources) collect(record.id, s.url);
  }
}

async function head(url: string): Promise<{ ok: boolean; status: number | string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "uc77-link-check/1.0 (+github community project)" },
    });
    // Some hosts reject HEAD; retry with GET.
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "uc77-link-check/1.0 (+github community project)" },
      });
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: err instanceof Error ? err.name : "error" };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const entries = [...urls.entries()];
  console.log(`Checking ${entries.length} unique external URLs…`);

  let broken = 0;
  for (const [url, ids] of entries) {
    const result = await head(url);
    if (!result.ok) {
      broken++;
      console.warn(
        `⚠ ${result.status} ${url} (used by: ${ids.slice(0, 3).join(", ")}${ids.length > 3 ? "…" : ""})`,
      );
    } else {
      console.log(`✓ ${result.status} ${url}`);
    }
  }

  console.log(broken === 0 ? "\nAll links healthy ✓" : `\n${broken} link(s) need review.`);
}

void main();
