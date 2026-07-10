"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import * as React from "react";

/** Accessible modal built on Radix Dialog, styled for NC/OS. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-void/80 backdrop-blur-sm" />
        <RadixDialog.Content
          className={clsx(
            "clip-panel fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-line-bright bg-panel p-5 shadow-2xl",
            wide ? "max-w-3xl" : "max-w-lg",
          )}
        >
          <div className="mb-4 border-b border-line pb-3">
            <p className="readout">{"// system dialog"}</p>
            <RadixDialog.Title className="text-lg font-bold uppercase tracking-wide text-ink">
              {title}
            </RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-sm text-ink-dim">
                {description}
              </RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
          </div>
          {children}
          <RadixDialog.Close asChild>
            <button
              type="button"
              aria-label="Close dialog"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-ink-dim hover:text-signal"
            >
              ✕
            </button>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
