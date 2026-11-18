"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { addDays, displayDate, offsetLabel, TEMPLATE_LABEL, todayISO, weekday } from "@/lib/billing";
import { useApp } from "@/lib/store";
import { Button, PageHeader, Stat, fieldClass } from "@/components/ui";

export default function PreviewPage() {
  const { clients, rules, plans } = useApp();
  const [date, setDate] = useState(todayISO());
  const [template, setTemplate] = useState("todos");
  const [search, setSearch] = useState("");

  const evaluated = clients.filter((client) => !client.archived && client.reminders_enabled && !client.non_renewal_reason);
  const matches = useMemo(() => {
    return evaluated.flatMap((client) => {
      if (!client.due_date || !client.whatsapp) return [];
      return rules
        .filter((rule) => rule.active)
        .filter((rule) => template === "todos" || rule.template === template)
        .filter((rule) => rule.weekdays.includes(weekday(date)))
        .filter((rule) => addDays(client.due_date as string, rule.offset_days) === date)
        .filter(() => `${client.name} ${client.whatsapp}`.toLowerCase().includes(search.toLowerCase()))
        .map((rule) => ({ client, rule }));
    });
  }, [evaluated, rules, date, template, search]);

  function exportCsv() {
    const lines = ["cliente,whatsapp,vencimento,plano,lembrete", ...matches.map((item) =>
      [item.client.name, item.client.whatsapp, item.client.due_date, plans.find((plan) => plan.id === item.client.plan_id)?.name ?? "", offsetLabel(item.rule.offset_days)].join(","),
    )];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `previa-cobranca-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        icon={<CalendarClock size={18} />}
        title="Prévia de envios de cobrança"
        subtitle="Simulação. Nada é enviado daqui. Use o botão de WhatsApp na lista de clientes para abrir a conversa."
        tone="violet"
        action={<Button tone="ghost" onClick={exportCsv}>Exportar CSV</Button>}
      />
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <select className={fieldClass} value={template} onChange={(event) => setTemplate(event.target.value)}>
          <option value="todos">Todos os templates</option>
          {Object.entries(TEMPLATE_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <input className={fieldClass} placeholder="Buscar cliente" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Stat label="Avaliados" value={evaluated.length} hint="Com lembrete ligado" />
        <Stat label="Vai entrar na lista" value={matches.length} hint={displayDate(date)} />
        <Stat label="Fora da lista" value={Math.max(0, evaluated.length - new Set(matches.map((item) => item.client.id)).size)} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-3 py-3">Cliente</th><th>WhatsApp</th><th>Vencimento</th><th>Plano</th><th>Motivo</th></tr>
          </thead>
          <tbody>
            {matches.map((item) => (
              <tr key={`${item.client.id}-${item.rule.id}`} className="border-t border-white/5">
                <td className="px-3 py-3 text-white">{item.client.name}</td>
                <td>{item.client.whatsapp}</td>
                <td>{displayDate(item.client.due_date)}</td>
                <td>{plans.find((plan) => plan.id === item.client.plan_id)?.name ?? "—"}</td>
                <td>{TEMPLATE_LABEL[item.rule.template]} · {offsetLabel(item.rule.offset_days)} · {item.rule.send_time}</td>
              </tr>
            ))}
            {matches.length === 0 ? <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">Nenhum cliente entra neste dia.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
