"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { PlaythroughSwitcher } from "@/components/shared/PlaythroughSwitcher";
import { useSettings } from "@/lib/hooks";
import { NAV_SECTIONS } from "@/lib/labels";
import { useUiStore } from "@/lib/stores/ui";

/** Sets html[data-reduced-effects] from settings so CSS can react. */
function EffectsController() {
  const settings = useSettings();
  React.useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduced-effects",
      settings.reducedEffects ? "true" : "false",
    );
  }, [settings.reducedEffects]);
  return null;
}

const NAV_ICONS: Record<string, string> = {
  "/dashboard": "◈",
  "/playthroughs": "▣",
  "/jobs": "☰",
  "/map": "⌖",
  "/builds": "⬡",
  "/achievements": "✦",
  "/collections": "▤",
  "/characters": "◪",
  "/endings": "◒",
  "/resources": "≡",
  "/settings": "⚙",
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const settings = useSettings();
  return (
    <ul className="flex flex-col gap-0.5">
      {NAV_SECTIONS.map((section) => {
        const active = pathname?.startsWith(section.href);
        const label = settings.conventionalLabels ? section.conventional : section.thematic;
        return (
          <li key={section.href}>
            <Link
              href={section.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "clip-chip flex min-h-[44px] items-center gap-3 border-l-2 px-3 py-2 text-sm uppercase tracking-wider transition-colors",
                active
                  ? "border-holo bg-panel-3 font-semibold text-holo"
                  : "border-transparent text-ink-dim hover:bg-panel-2 hover:text-ink",
              )}
            >
              <span aria-hidden="true" className="w-5 text-center font-mono">
                {NAV_ICONS[section.href]}
              </span>
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { mobileNavOpen, setMobileNavOpen, setPaletteOpen } = useUiStore();

  return (
    <div className="flex min-h-dvh">
      <EffectsController />
      <CommandPalette />

      {/* Visible only when focused, and positioned against the physical viewport
          edge under viewport-fit=cover — so its top/left offsets must clear the
          notch / status bar / landscape inset. Base 0.5rem kept where inset 0. */}
      <a
        href="#main-content"
        className="sr-only [--sa-left:0.5rem] [--sa-top:0.5rem] focus:not-sr-only focus:absolute focus:left-safe focus:top-safe focus:z-[70] focus:bg-holo focus:px-3 focus:py-2 focus:text-void"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-panel lg:flex">
        <div className="border-b border-line px-4 py-4">
          <p className="readout">nc/os v0.1 · unofficial</p>
          <Link href="/dashboard" className="block">
            <span className="text-lg font-bold uppercase tracking-widest text-ink">
              UC<span className="text-holo">77</span>
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              Night City Companion
            </span>
          </Link>
        </div>
        <nav aria-label="Primary" className="scroll-thin flex-1 overflow-y-auto p-2">
          <NavLinks />
        </nav>
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="clip-chip flex w-full min-h-[44px] items-center justify-between border border-line bg-panel-2 px-3 py-2 text-xs text-ink-dim hover:border-holo hover:text-holo"
          >
            <span className="uppercase tracking-wider">Search</span>
            <kbd className="font-mono text-[10px] text-ink-faint">Ctrl K</kbd>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — sticky at the top edge: pad past the status bar / notch on
            iOS, and past the side insets in landscape. Base spacing (py-2 top,
            px-3 / md:px-5 sides) is preserved where the inset is 0. */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-panel/95 pb-2 pt-safe [--sa-pt:0.5rem] px-safe [--sa-px:0.75rem] backdrop-blur md:[--sa-px:1.25rem]">
          <button
            type="button"
            className="clip-chip flex h-11 w-11 items-center justify-center border border-line text-ink lg:hidden"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <span aria-hidden="true">{mobileNavOpen ? "✕" : "☰"}</span>
          </button>
          <Link href="/dashboard" className="mr-auto flex items-baseline gap-2 lg:hidden">
            <span className="text-base font-bold uppercase tracking-widest text-ink">
              UC<span className="text-holo">77</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="clip-chip hidden min-h-[44px] items-center gap-3 border border-line bg-panel-2 px-3 py-1.5 text-xs text-ink-dim hover:border-holo hover:text-holo md:flex"
            >
              <span className="uppercase tracking-wider">Command palette</span>
              <kbd className="font-mono text-[10px] text-ink-faint">Ctrl K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open search"
              className="clip-chip flex h-11 w-11 items-center justify-center border border-line text-ink-dim hover:text-holo md:hidden"
            >
              <span aria-hidden="true">⌕</span>
            </button>
            <PlaythroughSwitcher />
          </div>
        </header>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-30 bg-void/70"
              aria-hidden="true"
              onClick={() => setMobileNavOpen(false)}
            />
            <nav
              aria-label="Primary"
              // Full-height fixed drawer: pad its top past the notch, its bottom
              // past the home indicator, and its left past the side inset so the
              // nav controls stay reachable. Right edge is interior (keeps pr-3).
              className="scroll-thin fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-line bg-panel pr-3 pt-safe [--sa-pt:0.75rem] pb-safe [--sa-pb:0.75rem] pl-safe [--sa-pl:0.75rem]"
            >
              <p className="readout mb-2 px-2">{"// navigation"}</p>
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            </nav>
          </div>
        )}

        {/* Horizontal gutters follow the side insets in landscape so content
            never slides under the notch; base px-3 / md:px-6 kept where inset 0. */}
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 py-6 px-safe [--sa-px:0.75rem] md:[--sa-px:1.5rem]"
        >
          {children}
        </main>

        {/* Last element in the scroll flow: pad its bottom past the home
            indicator and its sides past the landscape insets (base p-4 kept). */}
        <footer className="border-t border-line pt-4 pb-safe [--sa-pb:1rem] px-safe [--sa-px:1rem] text-center">
          <p className="mx-auto max-w-3xl text-[11px] leading-relaxed text-ink-faint">
            Unofficial fan project. Not affiliated with, endorsed by, or sponsored by CD Projekt
            Red. Cyberpunk 2077 and related marks are the property of their respective owners. Your
            saved progress stays in your browser; only anonymous, cookie-free page views are
            collected.{" "}
            <Link href="/resources" className="text-holo underline underline-offset-2">
              Sources & disclaimer
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
