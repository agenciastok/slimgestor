"use client";

import { convert, formatMoney } from "@/lib/billing";
import { useApp } from "@/lib/store";
import type { Currency } from "@/lib/types";

export function Money({
  amount,
  from,
  className = "",
}: {
  amount: number;
  from: Currency;
  className?: string;
}) {
  const { settings, unlocked } = useApp();
  if (settings?.finance_pin_hash && !unlocked) return <span className={className}>••••</span>;
  const target = settings?.preferred_currency ?? "BRL";
  const value = convert(amount, from, target, settings?.eur_to_brl ?? 6.2);
  const title = from === target ? undefined : formatMoney(amount, from);
  return (
    <span className={className} title={title}>
      {formatMoney(value, target)}
    </span>
  );
}
