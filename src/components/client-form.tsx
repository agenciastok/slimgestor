"use client";

import { useMemo, useState } from "react";
import { HEARD_FROM, NON_RENEWAL_REASONS, formatMoney, todayISO } from "@/lib/billing";
import { useApp } from "@/lib/store";
import type { ClientInput } from "@/lib/types";
import { Button, Field, Modal, Toggle, fieldClass } from "./ui";

export function ClientForm({
  open,
  initial,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ClientInput;
  editing: boolean;
  onClose: () => void;
  onSave: (input: ClientInput) => Promise<void>;
}) {
  const { products, plans, apps, servers, clients, lines, saving } = useApp();
  const [tab, setTab] = useState<"dados" | "plano" | "app" | "extra">("dados");
  const [form, setForm] = useState(initial);
  const [onlyProductPlans, setOnlyProductPlans] = useState(true);

  const visiblePlans = useMemo(() => {
    return plans.filter((plan) => {
      if (!plan.active) return false;
      if (!onlyProductPlans || !form.product_id) return true;
      return !plan.product_id || String(plan.product_id) === form.product_id;
    });
  }, [plans, onlyProductPlans, form.product_id]);

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setNonRenewal(code: string) {
    setForm((current) => ({
      ...current,
      non_renewal_reason: code,
      non_renewal_note: code ? current.non_renewal_note : "",
      non_renewed_at: code ? current.non_renewed_at || todayISO() : "",
    }));
  }

  function choosePlan(planId: string) {
    const plan = plans.find((item) => String(item.id) === planId);
    setForm((current) => ({
      ...current,
      plan_id: planId,
      price: plan ? plan.price : current.price,
      currency: plan ? plan.currency : current.currency,
      product_id: plan?.product_id ? String(plan.product_id) : current.product_id,
    }));
  }

  function chooseProduct(productId: string) {
    const product = products.find((item) => String(item.id) === productId);
    setForm((current) => ({
      ...current,
      product_id: productId,
      server_id: product?.server_id ? String(product.server_id) : current.server_id,
    }));
  }

  const selectedApp = apps.find((item) => String(item.id) === form.app_id);

  const tabs = [
    ["dados", "Dados"],
    ["plano", "Plano"],
    ["app", "Aplicativo"],
    ["extra", "Adicionais"],
  ] as const;

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar cliente" : "Novo cliente"} wide>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl px-2 py-2 text-sm ${tab === id ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "dados" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome *">
            <input className={fieldClass} value={form.name} onChange={(event) => set("name", event.target.value)} />
          </Field>
          <Field label="WhatsApp *">
            <input className={fieldClass} value={form.whatsapp} onChange={(event) => set("whatsapp", event.target.value)} placeholder="5511999999999" />
          </Field>
          <Field label="Linha" hint="WhatsApp que responde este cliente e envia as mensagens.">
            <select className={fieldClass} value={form.line} onChange={(event) => set("line", event.target.value)}>
              <option value="">Selecione</option>
              {(lines.length ? lines : ["IE", "AL", "BR", "P"]).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Usuário do painel">
            <input className={fieldClass} value={form.username} onChange={(event) => set("username", event.target.value)} />
          </Field>
          <Field label="Senha do painel">
            <input className={fieldClass} value={form.password} onChange={(event) => set("password", event.target.value)} />
          </Field>
          <Field label="Como conheceu">
            <select className={fieldClass} value={form.heard_from} onChange={(event) => set("heard_from", event.target.value)}>
              <option value="">Selecione</option>
              {HEARD_FROM.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Cliente indicador">
            <select className={fieldClass} value={form.referrer_id} onChange={(event) => set("referrer_id", event.target.value)}>
              <option value="">Nenhum</option>
              {clients
                .filter((item) => !item.archived)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Motivo da não renovação" hint="Preencha quando o cliente cancelou ou não quis renovar.">
            <select className={fieldClass} value={form.non_renewal_reason} onChange={(event) => setNonRenewal(event.target.value)}>
              <option value="">Vai renovar / ainda não definido</option>
              {NON_RENEWAL_REASONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="O que aconteceu" hint="Detalhe para a empresa corrigir este ponto.">
            <textarea
              className={fieldClass}
              rows={3}
              value={form.non_renewal_note}
              disabled={!form.non_renewal_reason}
              onChange={(event) => set("non_renewal_note", event.target.value)}
              placeholder={form.non_renewal_reason ? "Ex.: achou caro perto do outro fornecedor" : "Escolha um motivo ao lado"}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Observações">
              <textarea className={fieldClass} rows={3} value={form.notes} onChange={(event) => set("notes", event.target.value)} />
            </Field>
          </div>
        </div>
      ) : null}
      {tab === "plano" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Produto">
            <select className={fieldClass} value={form.product_id} onChange={(event) => chooseProduct(event.target.value)}>
              <option value="">Sem produto</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Plano">
            <select className={fieldClass} value={form.plan_id} onChange={(event) => choosePlan(event.target.value)}>
              <option value="">Sem plano</option>
              {visiblePlans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.price} {item.currency}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Servidor / painel">
            <select className={fieldClass} value={form.server_id} onChange={(event) => set("server_id", event.target.value)}>
              <option value="">Sem servidor</option>
              {servers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.renewal_cost} {item.cost_currency} por crédito
                </option>
              ))}
            </select>
          </Field>
          <Field label="Telas">
            <input className={fieldClass} type="number" min={1} max={20} value={form.screens} onChange={(event) => set("screens", Number(event.target.value))} />
          </Field>
          <Field label="Valor" hint="Moeda do plano. O topo do painel converte a exibição.">
            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <input className={fieldClass} type="number" min={0} step="0.01" value={form.price} onChange={(event) => set("price", Number(event.target.value))} />
              <select className={fieldClass} value={form.currency} onChange={(event) => set("currency", event.target.value as ClientInput["currency"])}>
                <option>BRL</option>
                <option>EUR</option>
              </select>
            </div>
          </Field>
          <Field label="Fatura">
            <select className={fieldClass} value={form.invoice_status} onChange={(event) => set("invoice_status", event.target.value as ClientInput["invoice_status"])}>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </Field>
          <Field label="Vencimento">
            <input className={fieldClass} type="date" value={form.due_date} onChange={(event) => set("due_date", event.target.value)} />
          </Field>
          <div className="flex items-end">
            <Toggle checked={form.fixed_due} onChange={(value) => set("fixed_due", value)} label="Vencimento fixo no mesmo dia" />
          </div>
          <div className="md:col-span-2">
            <Toggle checked={onlyProductPlans} onChange={setOnlyProductPlans} label="Mostrar só os planos do produto" />
          </div>
        </div>
      ) : null}
      {tab === "app" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Aplicativo"
            hint={
              selectedApp && selectedApp.activation_price > 0
                ? `Custo de ${formatMoney(selectedApp.activation_price, selectedApp.currency)} pago pela empresa. Entra como saída.`
                : undefined
            }
          >
            <select className={fieldClass} value={form.app_id} onChange={(event) => set("app_id", event.target.value)}>
              <option value="">Nenhum</option>
              {apps.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vencimento do app">
            <input className={fieldClass} type="date" value={form.app_due} onChange={(event) => set("app_due", event.target.value)} />
          </Field>
          <Field label="Dispositivo">
            <input className={fieldClass} value={form.device} onChange={(event) => set("device", event.target.value)} placeholder="Smart TV, TV Box, celular" />
          </Field>
          <Field label="MAC / e-mail">
            <input className={fieldClass} value={form.mac_or_email} onChange={(event) => set("mac_or_email", event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Key / OTP">
              <input className={fieldClass} value={form.app_key} onChange={(event) => set("app_key", event.target.value)} />
            </Field>
          </div>
        </div>
      ) : null}
      {tab === "extra" ? (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Acessos adicionais</div>
              <Button
                type="button"
                tone="ghost"
                onClick={() => set("extra_accesses", [...form.extra_accesses, { username: "", password: "", notes: "" }])}
              >
                Adicionar acesso
              </Button>
            </div>
            <div className="space-y-2">
              {form.extra_accesses.map((access, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-white/10 p-3 md:grid-cols-3">
                  <input className={fieldClass} placeholder="Usuário" value={access.username} onChange={(event) => {
                    const next = [...form.extra_accesses];
                    next[index] = { ...access, username: event.target.value };
                    set("extra_accesses", next);
                  }} />
                  <input className={fieldClass} placeholder="Senha" value={access.password} onChange={(event) => {
                    const next = [...form.extra_accesses];
                    next[index] = { ...access, password: event.target.value };
                    set("extra_accesses", next);
                  }} />
                  <input className={fieldClass} placeholder="Notas" value={access.notes} onChange={(event) => {
                    const next = [...form.extra_accesses];
                    next[index] = { ...access, notes: event.target.value };
                    set("extra_accesses", next);
                  }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Aplicativos adicionais</div>
              <Button type="button" tone="ghost" onClick={() => set("extra_apps", [...form.extra_apps, { app_id: "", mac: "", key: "" }])}>
                Adicionar app
              </Button>
            </div>
            {form.extra_apps.map((extra, index) => (
              <div key={index} className="mb-2 grid gap-2 rounded-xl border border-white/10 p-3 md:grid-cols-3">
                <select className={fieldClass} value={extra.app_id} onChange={(event) => {
                  const next = [...form.extra_apps];
                  next[index] = { ...extra, app_id: event.target.value };
                  set("extra_apps", next);
                }}>
                  <option value="">App</option>
                  {apps.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <input className={fieldClass} placeholder="MAC" value={extra.mac} onChange={(event) => {
                  const next = [...form.extra_apps];
                  next[index] = { ...extra, mac: event.target.value };
                  set("extra_apps", next);
                }} />
                <input className={fieldClass} placeholder="Key" value={extra.key} onChange={(event) => {
                  const next = [...form.extra_apps];
                  next[index] = { ...extra, key: event.target.value };
                  set("extra_apps", next);
                }} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" tone="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="button" disabled={saving} onClick={() => onSave(form)}>Salvar cliente</Button>
      </div>
    </Modal>
  );
}
