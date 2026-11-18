"use client";

import { BarChart3 } from "lucide-react";
import { convert, localDay } from "@/lib/billing";
import { useApp } from "@/lib/store";
import { Money } from "@/components/money";
import { Button, PageHeader } from "@/components/ui";

export default function ReportsPage() {
  const { transactions, settings } = useApp();
  const currency = settings?.preferred_currency ?? "BRL";
  const rate = settings?.eur_to_brl ?? 6.2;
  const buckets = new Map<string, { income: number; cost: number }>();
  for (const item of transactions) {
    const key = localDay(item.occurred_at).slice(0, 7);
    const bucket = buckets.get(key) ?? { income: 0, cost: 0 };
    const amount = convert(item.amount, item.currency, currency, rate);
    if (item.direction === "entrada") bucket.income += amount;
    else bucket.cost += amount;
    buckets.set(key, bucket);
  }
  const rows = [...buckets.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  function exportCsv() {
    const lines = ["mes,entradas,saidas,lucro", ...rows.map(([month, bucket]) => `${month},${bucket.income.toFixed(2)},${bucket.cost.toFixed(2)},${(bucket.income - bucket.cost).toFixed(2)}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "slim-gestor-financeiro.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        icon={<BarChart3 size={18} />}
        title="Relatórios"
        subtitle={`Totais convertidos para ${currency}. O valor original de cada lançamento continua no financeiro.`}
        tone="green"
        action={<Button tone="ghost" onClick={exportCsv}>Exportar CSV</Button>}
      />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-3 py-3">Mês</th><th>Entradas</th><th>Saídas</th><th>Lucro</th></tr>
          </thead>
          <tbody>
            {rows.map(([month, bucket]) => (
              <tr key={month} className="border-t border-white/5">
                <td className="px-3 py-3 text-white">{month.split("-").reverse().join("/")}</td>
                <td><Money amount={bucket.income} from={currency} /></td>
                <td><Money amount={bucket.cost} from={currency} /></td>
                <td><Money amount={bucket.income - bucket.cost} from={currency} /></td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">Sem lançamentos.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
