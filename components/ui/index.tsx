"use client";

import clsx from "clsx";
import * as React from "react";

/**
 * Core UI primitives for the NC/OS design system.
 * Hierarchy comes from typography, spacing, and borders — not glow.
 */

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function Panel({
  title,
  readout,
  actions,
  className,
  children,
  as: Tag = "section",
}: {
  title?: React.ReactNode;
  readout?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={clsx("clip-panel border border-line bg-panel", className)}>
      {(title || readout || actions) && (
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {readout && <p className="readout">{readout}</p>}
            {title && (
              <h2 className="truncate text-sm font-semibold uppercase tracking-wider text-ink">
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "ghost" | "danger" | "outline";

export const buttonClasses = (variant: ButtonVariant = "outline", size: "sm" | "md" = "md") =>
  clsx(
    "clip-chip inline-flex min-h-[44px] items-center justify-center gap-2 font-semibold uppercase tracking-wider transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-40",
    size === "sm" ? "px-3 py-1.5 text-xs min-h-[36px]" : "px-4 py-2 text-sm",
    variant === "primary" &&
      "bg-holo text-void hover:bg-holo-dim focus-visible:outline-holo border border-holo",
    variant === "outline" &&
      "border border-line-bright bg-panel-2 text-ink hover:border-holo hover:text-holo",
    variant === "ghost" && "border border-transparent text-ink-dim hover:text-holo",
    variant === "danger" && "border border-signal/60 bg-panel-2 text-signal hover:bg-signal/10",
  );

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }
>(function Button({ variant = "outline", size = "md", className, type, ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={clsx(buttonClasses(variant, size), className)}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------
// Badge / status pill
// ---------------------------------------------------------------------------

export type Tone = "neutral" | "holo" | "signal" | "amber" | "lime" | "violet";

const toneClasses: Record<Tone, string> = {
  neutral: "border-line text-ink-dim",
  holo: "border-holo/50 text-holo",
  signal: "border-signal/50 text-signal",
  amber: "border-amber/50 text-amber",
  lime: "border-lime/50 text-lime",
  violet: "border-violet/50 text-violet",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  title,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "clip-chip inline-flex items-center gap-1 border bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

export function ProgressBar({
  value,
  label,
  tone = "holo",
  className,
}: {
  value: number;
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const barColor =
    tone === "lime"
      ? "bg-lime"
      : tone === "amber"
        ? "bg-amber"
        : tone === "signal"
          ? "bg-signal"
          : tone === "violet"
            ? "bg-violet"
            : "bg-holo";
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full border border-line bg-panel-2"
      >
        <div
          className={clsx("h-full transition-[width]", barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form primitives
// ---------------------------------------------------------------------------

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="readout !text-ink-dim">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

const inputBase =
  "w-full border border-line bg-panel-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:border-holo min-h-[44px]";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={clsx(inputBase, className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={clsx(inputBase, "min-h-[88px]", className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={clsx(inputBase, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
});

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  description,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-[#58e6d9]"
      />
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-faint">{description}</span>}
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="clip-panel flex flex-col items-center gap-3 border border-dashed border-line bg-panel-2/50 px-6 py-10 text-center">
      <p className="readout">{"// no data on file"}</p>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {body && <p className="max-w-md text-sm text-ink-dim">{body}</p>}
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

export function PageHeader({
  readout,
  title,
  description,
  actions,
}: {
  readout: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="readout">{readout}</p>
        <h1 className="fx-flicker text-2xl font-bold uppercase tracking-wide text-ink md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-dim">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
