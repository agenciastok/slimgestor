"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Trash2 } from "lucide-react";

export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1324] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Button({
  tone = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "ghost" | "danger" | "cyan";
}) {
  const tones = {
    primary: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
    cyan: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    ghost: "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
    danger: "bg-rose-500 text-white hover:bg-rose-400",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
    />
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "rose" | "amber" | "cyan";
}) {
  const tones = {
    slate: "bg-slate-500/15 text-slate-300",
    green: "bg-emerald-500/15 text-emerald-300",
    rose: "bg-rose-500/15 text-rose-300",
    amber: "bg-amber-500/15 text-amber-200",
    cyan: "bg-cyan-400/15 text-cyan-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 text-sm text-slate-200"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-cyan-400" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </span>
      {label}
    </button>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-8">
      <div
        className={`w-full rounded-2xl border border-white/10 bg-[#0d1528] shadow-2xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#070b16]/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#10192e] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
          <Trash2 size={20} />
        </div>
        <h2 id="confirm-title" className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" tone="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="button" tone="danger" disabled={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
  action,
  tone = "cyan",
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
  tone?: "cyan" | "green" | "violet";
}) {
  const tones = {
    cyan: "from-cyan-400/20 to-transparent text-cyan-300",
    green: "from-emerald-400/20 to-transparent text-emerald-300",
    violet: "from-violet-400/25 to-transparent text-violet-200",
  };
  return (
    <div className={`mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r ${tones[tone]} px-5 py-4`}>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black/30">{icon}</div>
        <div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#10192e] p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <div className="text-base font-medium text-slate-200">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{text}</p>
    </div>
  );
}
