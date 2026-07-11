import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CharacterArchive } from "@/app/characters/CharacterArchive";

afterEach(cleanup);

const heading = (name: string) => screen.queryByRole("heading", { name });

describe("CharacterArchive", () => {
  it("renders characters as a one-column grid on mobile", () => {
    const { container } = render(<CharacterArchive />);
    expect(heading("Panam Palmer")).toBeInTheDocument();
    const list = container.querySelector("ul");
    expect(list?.className).toContain("grid-cols-1");
  });

  it("searches by name", async () => {
    const user = userEvent.setup();
    render(<CharacterArchive />);
    await user.type(screen.getByRole("searchbox"), "panam");
    expect(heading("Panam Palmer")).toBeInTheDocument();
    expect(heading("Jackie Welles")).not.toBeInTheDocument();
  });

  it("searches by alias", async () => {
    const user = userEvent.setup();
    render(<CharacterArchive />);
    await user.type(screen.getByRole("searchbox"), "songbird");
    expect(heading("Song So Mi")).toBeInTheDocument();
    expect(heading("Jackie Welles")).not.toBeInTheDocument();
  });

  it("filters to Phantom Liberty characters", async () => {
    const user = userEvent.setup();
    render(<CharacterArchive />);
    await user.selectOptions(screen.getByLabelText(/filter by release/i), "phantom_liberty");
    expect(heading("Song So Mi")).toBeInTheDocument();
    expect(heading("Jackie Welles")).not.toBeInTheDocument();
  });

  it("combines importance and release filters", async () => {
    const user = userEvent.setup();
    render(<CharacterArchive />);
    await user.selectOptions(screen.getByLabelText(/filter by importance/i), "primary");
    await user.selectOptions(screen.getByLabelText(/filter by release/i), "base");
    expect(heading("Jackie Welles")).toBeInTheDocument(); // primary + base
    expect(heading("Regina Jones")).not.toBeInTheDocument(); // supporting
    expect(heading("Song So Mi")).not.toBeInTheDocument(); // PL only
  });

  it("shows an explicit empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<CharacterArchive />);
    await user.type(screen.getByRole("searchbox"), "zzzzzznotarealname");
    expect(screen.getByText("No personnel match the current filters")).toBeInTheDocument();
  });
});
