"use client";

import { useState } from "react";
import { Plus, Smartphone } from "lucide-react";
import { useApp } from "@/lib/store";
import type { AppItem, Currency } from "@/lib/types";
import { Money } from "@/components/money";
import { Button, ConfirmDialog, Field, Modal, PageHeader, fieldClass } from "@/components/ui";

export default function AppsPage() {
  const { apps, clients, saveApp, deleteApp, saving } = useApp();
  const [draft, setDraft] = useState<(Omit<AppItem, "id"> & { id?: number }) | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        icon={<Smartphone size={18} />}
        title="Aplicativos dos clientes"
        subtitle="O valor de ativação é pago pela empresa e entra como saída ao cadastrar o cliente pago."
        tone="violet"
        action={<Button onClick={() => setDraft({ name: "", activation_price: 0, currency: "BRL", description: "", active: true })}><Plus size={16} /> Novo aplicativo</Button>}
      />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-3 py-3">Nome</th><th>Ativação</th><th>Clientes</th><th>Descrição</th><th className="px-3">Ações</th></tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id} className="border-t border-white/5">
                <td className="px-3 py-3 text-white">{app.name}</td>
                <td><Money amount={app.activation_price} from={app.currency} /></td>
                <td>{clients.filter((client) => client.app_id === app.id).length}</td>
                <td className="text-slate-400">{app.description || "—"}</td>
                <td className="px-3">
                  <div className="flex gap-2">
                    <Button tone="ghost" onClick={() => setDraft(app)}>Editar</Button>
                    <Button tone="danger" onClick={() => setRemovingId(app.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} title="Aplicativo">
        {draft ? (
          <div className="grid gap-3">
            <Field label="Nome"><input className={fieldClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Valor de ativação" hint="Custo pago pela empresa. Vira saída no financeiro."><input className={fieldClass} type="number" min={0} step="0.01" value={draft.activation_price} onChange={(event) => setDraft({ ...draft, activation_price: Number(event.target.value) })} /></Field>
              <Field label="Moeda">
                <select className={fieldClass} value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>
                  <option>BRL</option>
                  <option>EUR</option>
                </select>
              </Field>
            </div>
            <Field label="Descrição"><input className={fieldClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
            <Button disabled={saving || !draft.name.trim()} onClick={async () => { await saveApp(draft); setDraft(null); }}>Salvar</Button>
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={removingId !== null}
        title="Excluir aplicativo"
        message={`${apps.find((item) => item.id === removingId)?.name ?? "Este aplicativo"} sai da lista. Os clientes ligados a ele permanecem.`}
        busy={saving}
        onClose={() => setRemovingId(null)}
        onConfirm={() => {
          if (removingId !== null) deleteApp(removingId);
          setRemovingId(null);
        }}
      />
    </div>
  );
}
