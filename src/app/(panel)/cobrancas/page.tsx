"use client";

import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { offsetLabel, TEMPLATE_LABEL, WEEKDAYS } from "@/lib/billing";
import { useApp } from "@/lib/store";
import type { BillingRule } from "@/lib/types";
import { Badge, Button, Field, Modal, PageHeader, fieldClass } from "@/components/ui";

export default function BillingPage() {
  const { rules, settings, saveRule, deleteRule, createDefaultRules, saveSettings, applyAutoArchive, saving } = useApp();
  const [days, setDays] = useState(settings?.auto_archive_days ?? 90);
  const [draft, setDraft] = useState<Omit<BillingRule, "id" | "template"> & { id?: number } | null>(null);

  return (
    <div>
      <PageHeader
        icon={<Bell size={18} />}
        title="Ativar cobranças"
        subtitle="A prévia mostra quem receberia a mensagem. O WhatsApp abre com o texto, sem envio automático."
        tone="violet"
        action={
          <div className="flex gap-2">
            {rules.length === 0 ? <Button tone="ghost" disabled={saving} onClick={() => createDefaultRules()}>Lembretes padrão</Button> : null}
            <Button onClick={() => setDraft({ weekdays: [1, 2, 3, 4, 5, 6], send_time: "09:00", offset_days: 0, active: true })}><Plus size={16} /> Nova configuração</Button>
          </div>
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-3 py-3">Template</th><th>Dias</th><th>Hora</th><th>Envio</th><th className="px-3">Ações</th></tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-t border-white/5">
                <td className="px-3 py-3"><Badge tone="cyan">{TEMPLATE_LABEL[rule.template]}</Badge></td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map((day) => (
                      <span key={day.id} className={`rounded-md px-1.5 py-0.5 text-[11px] ${rule.weekdays.includes(day.id) ? "bg-cyan-400/20 text-cyan-100" : "text-slate-600"}`}>{day.label}</span>
                    ))}
                  </div>
                </td>
                <td>{rule.send_time}</td>
                <td>{offsetLabel(rule.offset_days)}{rule.active ? "" : " · pausado"}</td>
                <td className="px-3">
                  <div className="flex gap-2">
                    <Button tone="ghost" onClick={() => setDraft(rule)}>Editar</Button>
                    <Button tone="danger" onClick={() => deleteRule(rule.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Nenhum lembrete. Use o padrão ou crie o seu.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#10192e] p-4">
        <div className="text-sm font-medium text-white">Arquivamento automático</div>
        <p className="mt-1 text-sm text-slate-400">Arquiva clientes vencidos há mais dias do que o limite. Roda quando você confirmar, não sozinho.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input className={fieldClass + " w-28"} type="number" min={0} value={days} onChange={(event) => setDays(Number(event.target.value))} />
          <span className="text-sm text-slate-400">dias</span>
          <Button tone="ghost" disabled={saving} onClick={() => saveSettings({ auto_archive_days: days })}>Salvar</Button>
          <Button disabled={saving} onClick={() => applyAutoArchive()}>Arquivar agora</Button>
        </div>
      </div>
      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} title="Lembrete">
        {draft ? (
          <div className="grid gap-3">
            <Field label="Dias em relação ao vencimento" hint="Negativo cobra antes. Zero é no dia. Positivo cobra depois.">
              <input className={fieldClass} type="number" value={draft.offset_days} onChange={(event) => setDraft({ ...draft, offset_days: Number(event.target.value) })} />
            </Field>
            <Field label="Hora">
              <input className={fieldClass} type="time" value={draft.send_time} onChange={(event) => setDraft({ ...draft, send_time: event.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const on = draft.weekdays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, weekdays: on ? draft.weekdays.filter((item) => item !== day.id) : [...draft.weekdays, day.id] })}
                    className={`rounded-lg px-2 py-1 text-xs ${on ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300"}`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Ativo</label>
            <Button disabled={saving} onClick={async () => { await saveRule(draft); setDraft(null); }}>Salvar</Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
