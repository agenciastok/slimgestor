"use client";

import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Currency, Plan } from "@/lib/types";
import { Money } from "@/components/money";
import { Badge, Button, ConfirmDialog, Field, Modal, PageHeader, fieldClass } from "@/components/ui";

const blank = {
  name: "",
  product_id: null as number | null,
  price: 30,
  currency: "BRL" as Currency,
  duration_months: 1,
  description: "",
  active: true,
};

export default function PlansPage() {
  const { plans, products, clients, savePlan, deletePlan, saving } = useApp();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<(typeof blank & { id?: number }) | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const visible = plans.filter((plan) => plan.name.toLowerCase().includes(search.toLowerCase()));

  function edit(plan: Plan) {
    setDraft({
      id: plan.id,
      name: plan.name,
      product_id: plan.product_id,
      price: plan.price,
      currency: plan.currency,
      duration_months: plan.duration_months,
      description: plan.description,
      active: plan.active,
    });
  }

  return (
    <div>
      <PageHeader
        icon={<CreditCard size={18} />}
        title="Planos dos clientes"
        subtitle="Preço, moeda e duração usados na criação e na renovação."
        tone="violet"
        action={<Button onClick={() => setDraft({ ...blank })}><Plus size={16} /> Novo plano</Button>}
      />
      <input className={fieldClass + " mb-4 max-w-md"} placeholder="Buscar plano" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-3">Nome</th>
              <th>Clientes</th>
              <th>Valor</th>
              <th>Duração</th>
              <th>Moeda</th>
              <th>Produto</th>
              <th className="px-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((plan) => (
              <tr key={plan.id} className="border-t border-white/5">
                <td className="px-3 py-3 font-medium text-white">
                  {plan.name} {!plan.active ? <Badge>inativo</Badge> : null}
                </td>
                <td>{clients.filter((client) => client.plan_id === plan.id && !client.archived).length}</td>
                <td><Money amount={plan.price} from={plan.currency} /></td>
                <td>{plan.duration_months} mês(es)</td>
                <td>{plan.currency}</td>
                <td>{products.find((item) => item.id === plan.product_id)?.name ?? "—"}</td>
                <td className="px-3">
                  <div className="flex gap-2">
                    <Button tone="ghost" onClick={() => edit(plan)}>Editar</Button>
                    <Button tone="danger" onClick={() => setRemovingId(plan.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} title={draft?.id ? "Editar plano" : "Novo plano"}>
        {draft ? (
          <div className="grid gap-3">
            <Field label="Nome"><input className={fieldClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="Produto">
              <select className={fieldClass} value={draft.product_id ?? ""} onChange={(event) => setDraft({ ...draft, product_id: event.target.value ? Number(event.target.value) : null })}>
                <option value="">Livre</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Valor"><input className={fieldClass} type="number" min={0} step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} /></Field>
              <Field label="Moeda">
                <select className={fieldClass} value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>
                  <option>BRL</option>
                  <option>EUR</option>
                </select>
              </Field>
              <Field label="Meses"><input className={fieldClass} type="number" min={1} max={36} value={draft.duration_months} onChange={(event) => setDraft({ ...draft, duration_months: Number(event.target.value) })} /></Field>
            </div>
            <Field label="Descrição"><input className={fieldClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Ativo</label>
            <Button disabled={saving || !draft.name.trim()} onClick={async () => { await savePlan(draft); setDraft(null); }}>Salvar</Button>
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={removingId !== null}
        title="Excluir plano"
        message={`${plans.find((item) => item.id === removingId)?.name ?? "Este plano"} sai da lista. Os clientes que já usam esse plano continuam com o valor atual.`}
        busy={saving}
        onClose={() => setRemovingId(null)}
        onConfirm={() => {
          if (removingId !== null) deletePlan(removingId);
          setRemovingId(null);
        }}
      />
    </div>
  );
}
