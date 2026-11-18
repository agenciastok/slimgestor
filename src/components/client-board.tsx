"use client";

import { useMemo, useState } from "react";
import { Archive, MessageCircle, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { clientStatus, displayDate, fillTemplate, formatMoney, netAmount, nonRenewalLabel, STATUS_LABEL, waLink } from "@/lib/billing";
import { useApp } from "@/lib/store";
import { clientToInput, emptyClient, type Client, type ClientInput } from "@/lib/types";
import { ClientForm } from "./client-form";
import { Money } from "./money";
import { RenewDialog } from "./renew-dialog";
import { Badge, Button, ConfirmDialog, PageHeader, fieldClass } from "./ui";

export function ClientBoard({ mode = "all" }: { mode?: "all" | "teste" }) {
  const {
    clients,
    plans,
    products,
    servers,
    apps,
    templates,
    saveClient,
    archiveClients,
    deleteClients,
    receiveClient,
    saving,
  } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [planId, setPlanId] = useState("");
  const [productId, setProductId] = useState("");
  const [appId, setAppId] = useState("");
  const [invoice, setInvoice] = useState("todas");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [archived, setArchived] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<ClientInput | null>(null);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [renewing, setRenewing] = useState<Client | null>(null);
  const [removing, setRemoving] = useState<Client | null>(null);

  const rows = useMemo(() => {
    return clients
      .filter((client) => (mode === "teste" ? client.kind === "teste" : true))
      .filter((client) => client.archived === archived)
      .filter((client) => {
        const label = clientStatus(client);
        if (status === "nao_renovou") {
          if (!client.non_renewal_reason) return false;
        } else if (status !== "todos" && label !== status) return false;
        if (planId && String(client.plan_id) !== planId) return false;
        if (productId && String(client.product_id) !== productId) return false;
        if (appId && String(client.app_id) !== appId) return false;
        if (invoice !== "todas" && client.invoice_status !== invoice) return false;
        if (from && (!client.due_date || client.due_date < from)) return false;
        if (to && (!client.due_date || client.due_date > to)) return false;
        if (!search.trim()) return true;
        const blob = `${client.name} ${client.username} ${client.whatsapp} ${client.line} ${client.email}`.toLowerCase();
        return blob.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  }, [clients, mode, archived, status, planId, productId, appId, invoice, from, to, search]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  function openCreate() {
    setEditingId(undefined);
    setForm(emptyClient(mode === "teste" ? "teste" : "cliente"));
  }

  function openEdit(client: Client) {
    setEditingId(client.id);
    setForm(clientToInput(client));
  }

  async function save(input: ClientInput) {
    await saveClient(input, editingId);
    setForm(null);
  }

  function message(client: Client) {
    const template = templates.find((item) => item.purpose === "cobranca") ?? templates[0];
    const plan = plans.find((item) => item.id === client.plan_id);
    const text = template
      ? fillTemplate(template.body, {
          nome: client.name,
          usuario: client.username,
          plano: plan?.name ?? "",
          vencimento: displayDate(client.due_date),
          valor: formatMoney(netAmount(client), client.currency),
        })
      : `Olá ${client.name}`;
    window.open(waLink(client.whatsapp, text), "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <PageHeader
        icon={<span className="text-lg">☺</span>}
        title={mode === "teste" ? "Testes" : "Clientes"}
        subtitle={mode === "teste" ? "Linhas de teste com vencimento curto." : "Cadastre, renove e cobre a sua base."}
        action={<Button onClick={openCreate}><Plus size={16} /> {mode === "teste" ? "Novo teste" : "Novo cliente"}</Button>}
      />
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#10192e] p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Filtros</div>
        <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
          <input className={fieldClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input className={fieldClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <select className={fieldClass} value={invoice} onChange={(event) => setInvoice(event.target.value)}>
            <option value="todas">Faturas</option>
            <option value="pago">Pagas</option>
            <option value="pendente">Pendentes</option>
          </select>
          <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="todos">Status</option>
            <option value="ativo">Ativos</option>
            <option value="vencido">Vencidos</option>
            <option value="teste">Testes</option>
            <option value="nao_renovou">Não renovou</option>
          </select>
          <select className={fieldClass} value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="">Planos</option>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select>
          <select className={fieldClass} value={productId} onChange={(event) => setProductId(event.target.value)}>
            <option value="">Produtos</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <select className={fieldClass} value={appId} onChange={(event) => setAppId(event.target.value)}>
            <option value="">Aplicativos</option>
            {apps.map((app) => <option key={app.id} value={app.id}>{app.name}</option>)}
          </select>
          <button className="rounded-xl border border-white/10 px-3 text-sm text-slate-300" onClick={() => setArchived((value) => !value)}>
            {archived ? "Ver ativos" : "Arquivados"}
          </button>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input className={fieldClass + " max-w-md"} placeholder="Buscar cliente..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        <select className={fieldClass + " w-28"} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
          {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-3">Nome</th>
              <th>Usuário</th>
              <th>Plano</th>
              <th>Produto</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Painel</th>
              <th className="px-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((client) => {
              const label = clientStatus(client);
              const tone = label === "ativo" ? "green" : label === "vencido" ? "rose" : label === "teste" ? "amber" : "slate";
              return (
                <tr key={client.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-3 py-3">
                    <div className="font-medium text-white">{client.name}</div>
                    <div className="text-xs text-slate-500">{client.whatsapp}{client.line ? ` · linha ${client.line}` : ""}</div>
                    {client.non_renewal_reason ? (
                      <div className="text-xs text-amber-300">Não renovou · {nonRenewalLabel(client.non_renewal_reason)}</div>
                    ) : null}
                  </td>
                  <td>{client.username || "—"}</td>
                  <td>
                    <div>{plans.find((item) => item.id === client.plan_id)?.name ?? "—"}</div>
                    <div className="text-xs text-cyan-200"><Money amount={netAmount(client)} from={client.currency} /></div>
                  </td>
                  <td>{products.find((item) => item.id === client.product_id)?.name ?? "—"}</td>
                  <td>{displayDate(client.due_date)}</td>
                  <td><Badge tone={tone}>{STATUS_LABEL[label]}</Badge></td>
                  <td>{servers.find((item) => item.id === client.server_id)?.name ?? "—"}</td>
                  <td className="px-3">
                    <div className="flex gap-1">
                      <IconButton label="Renovar" onClick={() => setRenewing(client)}><RotateCcw size={14} /></IconButton>
                      <IconButton label="WhatsApp" onClick={() => message(client)}><MessageCircle size={14} /></IconButton>
                      <IconButton label="Editar" onClick={() => openEdit(client)}><Pencil size={14} /></IconButton>
                      {client.invoice_status === "pendente" ? (
                        <IconButton label="Receber" onClick={() => receiveClient(client.id)}><span className="px-1 text-[11px]">R$</span></IconButton>
                      ) : null}
                      <IconButton label={client.archived ? "Restaurar" : "Arquivar"} onClick={() => archiveClients([client.id], !client.archived)}>
                        <Archive size={14} />
                      </IconButton>
                      <IconButton label="Excluir" onClick={() => setRemoving(client)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">Nenhum cliente neste filtro.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Mostrando {visible.length} de {rows.length}</span>
        <div className="flex gap-2">
          <Button tone="ghost" disabled={safePage <= 1 || saving} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
          <Button tone="ghost" disabled={safePage >= pages || saving} onClick={() => setPage((value) => value + 1)}>Próxima</Button>
        </div>
      </div>
      {form ? (
        <ClientForm
          key={editingId ?? "new"}
          open
          initial={form}
          editing={Boolean(editingId)}
          onClose={() => setForm(null)}
          onSave={save}
        />
      ) : null}
      <RenewDialog client={renewing} onClose={() => setRenewing(null)} />
      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir cliente"
        message={removing ? `${removing.name} sai da lista. Os lançamentos financeiros permanecem, sem o vínculo.` : ""}
        busy={saving}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) deleteClients([removing.id]);
          setRemoving(null);
        }}
      />
    </div>
  );
}

function IconButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button title={label} aria-label={label} onClick={onClick} className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10">
      {children}
    </button>
  );
}
