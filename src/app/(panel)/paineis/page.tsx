"use client";

import { useState } from "react";
import { Server } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Currency, ServerPanel } from "@/lib/types";
import { Money } from "@/components/money";
import { Badge, Button, ConfirmDialog, Field, PageHeader, Toggle, fieldClass } from "@/components/ui";

const blank: Omit<ServerPanel, "id"> = {
  name: "",
  url: "",
  username: "",
  password: "",
  auto_renew: true,
  renewal_cost: 0,
  cost_currency: "BRL",
  credits: 0,
  status: "ativo",
  notes: "",
};

export default function PanelsPage() {
  const { servers, clients, saveServer, deleteServer, saving } = useApp();
  const [form, setForm] = useState<Omit<ServerPanel, "id"> & { id?: number }>(blank);
  const [showPassword, setShowPassword] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        icon={<Server size={18} />}
        title="Painéis IPTV"
        subtitle="O custo de 1 crédito vira saída ao criar ou renovar. Mensal usa 1, trimestral 3 e anual 12."
        tone="cyan"
      />
      <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-100">
        O SLIM GESTOR guarda o acesso e controla vencimento, crédito e custo. A linha dentro do Sigma, XUI ou outro painel continua renovada por você — esta tela não chama a API do servidor.
      </div>
      <form
        className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-[#10192e] p-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveServer(form);
          setForm(blank);
        }}
      >
        <div className="md:col-span-2 text-sm font-medium text-white">{form.id ? `Editar ${form.name}` : "Adicionar painel"}</div>
        <Field label="Nome"><input className={fieldClass} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="URL"><input className={fieldClass} value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://seu-painel.com" /></Field>
        <Field label="Usuário"><input className={fieldClass} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
        <Field label="Senha">
          <input className={fieldClass} type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </Field>
        <Field label="Custo por crédito" hint="Mensal desconta 1, trimestral 3 e anual 12, ao criar e ao renovar.">
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <input className={fieldClass} type="number" min={0} step="0.01" value={form.renewal_cost} onChange={(event) => setForm({ ...form, renewal_cost: Number(event.target.value) })} />
            <select className={fieldClass} value={form.cost_currency} onChange={(event) => setForm({ ...form, cost_currency: event.target.value as Currency })}>
              <option>BRL</option>
              <option>EUR</option>
            </select>
          </div>
        </Field>
        <Field label="Créditos atuais"><input className={fieldClass} type="number" step="1" value={form.credits} onChange={(event) => setForm({ ...form, credits: Number(event.target.value) })} /></Field>
        <Field label="Status">
          <select className={fieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ServerPanel["status"] })}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </Field>
        <div className="flex items-end">
          <Toggle checked={form.auto_renew} onChange={(value) => setForm({ ...form, auto_renew: value })} label="Contabilizar renovação neste painel" />
        </div>
        <div className="md:col-span-2">
          <Field label="Notas"><input className={fieldClass} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Button disabled={saving}>{form.id ? "Salvar painel" : "Criar painel"}</Button>
          <Button type="button" tone="ghost" onClick={() => { setShowPassword((value) => !value); }}>
            {showPassword ? "Ocultar senha" : "Mostrar senha"}
          </Button>
          {form.id ? <Button type="button" tone="ghost" onClick={() => setForm(blank)}>Cancelar edição</Button> : null}
        </div>
      </form>
      <div className="space-y-3">
        {servers.map((server) => (
          <div key={server.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#10192e] p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{server.name}</span>
                <Badge tone={server.status === "ativo" ? "green" : "slate"}>{server.status}</Badge>
              </div>
              <div className="text-sm text-slate-400">{server.url || "Sem URL"} · {clients.filter((client) => client.server_id === server.id && !client.archived).length} clientes</div>
              <div className="text-sm text-slate-300">
                Custo <Money amount={server.renewal_cost} from={server.cost_currency} /> por crédito · {server.credits} créditos
              </div>
            </div>
            <div className="flex gap-2">
              <Button tone="ghost" onClick={() => setForm(server)}>Editar</Button>
              <Button tone="danger" onClick={() => setRemovingId(server.id)}>Remover</Button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={removingId !== null}
        title="Remover painel"
        message={`${servers.find((item) => item.id === removingId)?.name ?? "Este painel"} sai da lista. Os clientes ligados a ele permanecem.`}
        busy={saving}
        onClose={() => setRemovingId(null)}
        onConfirm={() => {
          if (removingId !== null) deleteServer(removingId);
          setRemovingId(null);
        }}
      />
    </div>
  );
}
