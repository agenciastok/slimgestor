"use client";

import { useEffect, useState } from "react";
import { displayDate, fillTemplate, formatMoney, waLink } from "@/lib/billing";
import { useApp } from "@/lib/store";
import type { Client } from "@/lib/types";
import { Button, Field, Modal, fieldClass } from "./ui";

export function RenewDialog({
  client,
  onClose,
}: {
  client: Client | null;
  onClose: () => void;
}) {
  const { plans, templates, renewClient, saving } = useApp();
  const [due, setDue] = useState("");
  const [invoice, setInvoice] = useState<"pago" | "pendente">("pago");
  const [templateId, setTemplateId] = useState("");
  const [planId, setPlanId] = useState("");
  const currentPlan = plans.find((item) => item.id === client?.plan_id);
  const planOptions = plans
    .filter((item) => item.active || item.id === client?.plan_id)
    .slice()
    .sort((a, b) => a.duration_months - b.duration_months || a.name.localeCompare(b.name, "pt-BR"));
  const selected = planOptions.find((item) => String(item.id) === planId) ?? currentPlan;
  const switching = Boolean(selected && client && selected.id !== client.plan_id);
  const charge = switching && selected
    ? { amount: selected.price, currency: selected.currency }
    : { amount: client?.price ?? 0, currency: client?.currency ?? "BRL" };

  useEffect(() => {
    setDue("");
    setInvoice("pago");
    setTemplateId("");
    setPlanId(client?.plan_id ? String(client.plan_id) : "");
  }, [client?.id, client?.plan_id]);

  if (!client) return null;

  async function confirm() {
    if (!client) return;
    const saved = await renewClient(client.id, {
      due,
      invoice,
      planId: planId ? Number(planId) : undefined,
    });
    const template = templates.find((item) => String(item.id) === templateId);
    if (template && saved.whatsapp) {
      const text = fillTemplate(template.body, {
        nome: saved.name,
        usuario: saved.username,
        plano: selected?.name ?? "",
        vencimento: displayDate(saved.due_date),
        valor: formatMoney(saved.price, saved.currency),
      });
      window.open(waLink(saved.whatsapp, text), "_blank", "noopener,noreferrer");
    }
    onClose();
  }

  return (
    <Modal open={Boolean(client)} onClose={onClose} title="Renovar cliente" subtitle="Atualiza o vencimento, a fatura e o financeiro.">
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">Cliente selecionado</div>
        <div className="mt-1 text-lg font-semibold text-white">{client.name}</div>
        <div className="text-sm text-slate-400">
          {client.username || "sem usuário"} · vence {displayDate(client.due_date)}
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <div className="text-xs uppercase tracking-wide text-emerald-200">Período do plano</div>
        <div className="text-lg font-semibold text-white">{selected ? `${selected.duration_months} mês(es)` : "1 mês"}</div>
        <div className="text-sm text-slate-300">{selected ? `${selected.name} · ${formatMoney(charge.amount, charge.currency)}` : formatMoney(charge.amount, charge.currency)}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Plano" hint="Se trocar, o cadastro do cliente passa a usar este plano, o valor e a moeda. A nova data usa a duração dele.">
            <select className={fieldClass} value={planId} onChange={(event) => setPlanId(event.target.value)}>
              <option value="">Manter o plano atual</option>
              {planOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.duration_months} mês(es) · {formatMoney(item.price, item.currency)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Nova data" hint="Vazio renova pelo plano, a partir do vencimento atual.">
          <input className={fieldClass} type="date" value={due} onChange={(event) => setDue(event.target.value)} />
        </Field>
        <Field label="Fatura">
          <select className={fieldClass} value={invoice} onChange={(event) => setInvoice(event.target.value as "pago" | "pendente")}>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="WhatsApp" hint="Se escolher um template, o WhatsApp abre com a mensagem pronta. O envio é seu.">
            <select className={fieldClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              <option value="">Não abrir WhatsApp</option>
              {templates
                .filter((item) => item.purpose === "renovacao" || item.purpose === "cobranca")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button tone="ghost" onClick={onClose}>Cancelar</Button>
        <Button disabled={saving} onClick={confirm}>Renovar</Button>
      </div>
    </Modal>
  );
}
