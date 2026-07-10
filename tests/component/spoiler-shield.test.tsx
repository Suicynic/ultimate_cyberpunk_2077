import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SpoilerShield } from "@/components/shared/SpoilerShield";
import { db } from "@/lib/database/db";
import { updateSettings } from "@/lib/database/repo";

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("SpoilerShield", () => {
  it("hides major content under the default hide_major mode", () => {
    render(
      <SpoilerShield level="major" revealKey="test:secret">
        <p>Jackie dies</p>
      </SpoilerShield>,
    );
    expect(screen.queryByText("Jackie dies")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /peek/i })).toBeInTheDocument();
  });

  it("shows non-spoiler content immediately", () => {
    render(
      <SpoilerShield level="none" revealKey="test:open">
        <p>Visit Viktor</p>
      </SpoilerShield>,
    );
    expect(screen.getByText("Visit Viktor")).toBeInTheDocument();
  });

  it("reveals content for the session on Peek", async () => {
    const user = userEvent.setup();
    render(
      <SpoilerShield level="endgame" revealKey="test:peek">
        <p>Secret ending intel</p>
      </SpoilerShield>,
    );
    await user.click(screen.getByRole("button", { name: /peek/i }));
    expect(await screen.findByText("Secret ending intel")).toBeInTheDocument();
  });

  it("respects show_all mode from settings", async () => {
    await updateSettings({ spoilerMode: "show_all" });
    render(
      <SpoilerShield level="endgame" revealKey="test:showall">
        <p>All revealed</p>
      </SpoilerShield>,
    );
    expect(await screen.findByText("All revealed")).toBeInTheDocument();
  });
});
