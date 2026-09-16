"use client";

import React from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    primary: "bg-signal-500 text-ink-900 hover:bg-signal-600",
    secondary: "border border-line-400 text-paper-100 hover:border-paper-300 hover:bg-ink-800",
    ghost: "text-paper-300 hover:text-paper-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  autoFocus,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helper?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="block mb-2 text-sm text-paper-300">{label}</span>
      )}
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-ink-800 border border-line-500 px-4 py-3 text-paper-100 placeholder:text-paper-500/60 focus:border-signal-500 outline-none transition-colors"
      />
      {helper && <span className="block mt-2 text-xs text-paper-500">{helper}</span>}
    </label>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  autoFocus,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-ink-800 border border-line-500 px-4 py-3 text-paper-100 placeholder:text-paper-500/60 focus:border-signal-500 outline-none transition-colors resize-none"
    />
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "risk" | "signal";
}) {
  const tones: Record<string, string> = {
    neutral: "border-line-400 text-paper-300",
    positive: "border-positive-500/50 text-positive-500",
    risk: "border-risk-500/50 text-risk-500",
    signal: "border-signal-500/50 text-signal-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-mono ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-line-500" />;
}
