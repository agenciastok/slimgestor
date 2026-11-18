"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { addDays, convert, creditCycles, localDay, netAmount, todayISO } from "@/lib/billing";
import { useApp } from "@/lib/store";
import type { Currency, TxDirection } from "@/lib/types";
import { Money } from "@/components/money";
import { Badge, Button, ConfirmDialog, Field, Modal, PageHeader, Stat, fieldClass } from "@/components/ui";

export default function FinancePage() {
  const { transactions, clients, products, plans, servers, settings, addTransaction, deleteTransactions, saving } = useApp();
  const [from, setFrom] = useState(todayISO().slice(0, 8) + "01");
  const [to, setTo] = useState(todayISO());
  const [direction, setDirection] = useState("todas");
  const [productId, setProductId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({
    direction: "entrada" as TxDirection,
    amount: 0,
    currency: "BRL" as Currency,
    description: "",
    occurred_at: todayISO(),
  });

  const currency = settings?.preferred_currency ?? "BRL";
  const rate = settings?.eur_to_brl ?? 6.2;
  const filtered = useMemo(() => {
    return transactions.filter((item) => {
      const day = localDay(item.occurred_at);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (direction !== "todas" && item.direction !== direction) return false;
      if (productId && String(item.product_id) !== productId) return false;
      if (search && !`${item.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, from, to, direction, productId, search]);

  const income = filtered.filter((item) => item.direction === "entrada").reduce((sum, item) => sum + convert(item.amount, item.currency, currency, rate), 0);
  const cost = filtered.filter((item) => item.direction === "saida").reduce((sum, item) => sum + convert(item.amount, item.currency, currency, rate), 0);

  function projection(days: number) {
    const start = todayISO();
    const end = addDays(start, days);
    return clients
      .filter((client) => !client.archived && client.due_date && client.due_date >= start && client.due_date <= end)
      .reduce((sum, client) => {
        const net = convert(netAmount(client), client.currency, currency, rate);
        const server = servers.find((item) => item.id === client.server_id);
        const cycles = creditCycles(plans.find((plan) => plan.id === client.plan_id)?.duration_months);
        const serverCost = server ? convert(server.renewal_cost * cycles, server.cost_currency, currency, rate) : 0;
        return sum + net - serverCost;
      }, 0);
  }

  function annual() {
    return clients.filter((client) => !client.archived).reduce((sum, client) => {
      const months = creditCycles(plans.find((plan) => plan.id === client.plan_id)?.duration_months);
      const renewals = 12 / months;
      const net = convert(netAmount(client) * renewals, client.currency, currency, rate);
      const server = servers.find((item) => item.id === client.server_id);
      const serverCost = server ? convert(server.renewal_cost * 12, server.cost_currency, currency, rate) : 0;
      return sum + net - serverCost;
    }, 0);
  }

  return (
    <div>
      <PageHeader
        icon={<Wallet size={18} />}
        title="Financeiro"
        subtitle="Entradas dos clientes e o custo de cada renovação no servidor."
        tone="green"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Novo</Button>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Lucro" value={<Money amount={income - cost} from={currency} />} hint="No filtro" />
        <Stat label="Entradas" value={<Money amount={income} from={currency} />} />
        <Stat label="Saídas" value={<Money amount={cost} from={currency} />} />
        <Stat label="Projeção semanal" value={<Money amount={projection(7)} from={currency} />} hint="Lucro dos vencimentos" />
        <Stat label="Projeção mensal" value={<Money amount={projection(30)} from={currency} />} />
        <Stat label="Projeção anual" value={<Money amount={annual()} from={currency} />} hint="Se a base renovar o ano" />
      </div>
      <div className="mb-4 grid gap-2 rounded-2xl border border-white/10 bg-[#10192e] p-4 md:grid-cols-5">
        <input className={fieldClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input className={fieldClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <select className={fieldClass} value={direction} onChange={(event) => setDirection(event.target.value)}>
          <option value="todas">Todas</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select className={fieldClass} value={productId} onChange={(event) => setProductId(event.target.value)}>
          <option value="">Produtos</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
        <input className={fieldClass} placeholder="Pesquisar" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <div className="mb-2 flex justify-end">
        <Button
          tone="danger"
          disabled={selected.length === 0 || saving}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={14} /> Excluir selecionados
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-3"></th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-white/5">
                <td className="px-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                  />
                </td>
                <td className="py-3">
                  <div className="text-white">{item.description}</div>
                  <div className="text-xs text-slate-500">{clients.find((client) => client.id === item.client_id)?.name ?? ""}</div>
                </td>
                <td><Badge tone={item.direction === "entrada" ? "green" : "rose"}>{item.direction === "entrada" ? "Entrada" : "Saída"}</Badge></td>
                <td><Money amount={item.amount} from={item.currency} /></td>
                <td>{localDay(item.occurred_at).split("-").reverse().join("/")}</td>
              </tr>
            ))}
            {filtered.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Nenhum lançamento no período.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo lançamento">
        <div className="grid gap-3">
          <Field label="Tipo">
            <select className={fieldClass} value={draft.direction} onChange={(event) => setDraft({ ...draft, direction: event.target.value as TxDirection })}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Valor"><input className={fieldClass} type="number" min={0} step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} /></Field>
            <Field label="Moeda">
              <select className={fieldClass} value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>
                <option>BRL</option>
                <option>EUR</option>
              </select>
            </Field>
          </div>
          <Field label="Data"><input className={fieldClass} type="date" value={draft.occurred_at} onChange={(event) => setDraft({ ...draft, occurred_at: event.target.value })} /></Field>
          <Field label="Descrição"><input className={fieldClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
          <Button disabled={saving} onClick={async () => { await addTransaction(draft); setOpen(false); }}>Salvar</Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={selected.length === 1 ? "Excluir lançamento" : "Excluir lançamentos"}
        message={
          selected.length === 1
            ? `${transactions.find((item) => item.id === selected[0])?.description ?? "Este lançamento"} sai do financeiro. O cliente continua cadastrado.`
            : `${selected.length} lançamentos saem do financeiro. Os clientes continuam cadastrados.`
        }
        busy={saving}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteTransactions(selected);
          setSelected([]);
          setConfirmDelete(false);
        }}
      />
    </div>
  );
}
