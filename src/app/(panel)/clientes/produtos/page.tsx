"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button, ConfirmDialog, Field, Modal, PageHeader, fieldClass } from "@/components/ui";

export default function ProductsPage() {
  const { products, servers, clients, saveProduct, deleteProduct, saving } = useApp();
  const [draft, setDraft] = useState<{ id?: number; name: string; server_id: number | null; active: boolean } | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        icon={<Package size={18} />}
        title="Produtos"
        subtitle="Cada produto pode apontar para o painel onde a linha é renovada."
        action={<Button onClick={() => setDraft({ name: "", server_id: servers[0]?.id ?? null, active: true })}><Plus size={16} /> Novo produto</Button>}
      />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-3 py-3">Nome</th><th>Painel</th><th>Clientes</th><th className="px-3">Ações</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-white/5">
                <td className="px-3 py-3 text-white">{product.name}</td>
                <td>{servers.find((item) => item.id === product.server_id)?.name ?? "—"}</td>
                <td>{clients.filter((client) => client.product_id === product.id && !client.archived).length}</td>
                <td className="px-3">
                  <div className="flex gap-2">
                    <Button tone="ghost" onClick={() => setDraft(product)}>Editar</Button>
                    <Button tone="danger" onClick={() => setRemovingId(product.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} title="Produto">
        {draft ? (
          <div className="grid gap-3">
            <Field label="Nome"><input className={fieldClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="Painel">
              <select className={fieldClass} value={draft.server_id ?? ""} onChange={(event) => setDraft({ ...draft, server_id: event.target.value ? Number(event.target.value) : null })}>
                <option value="">Nenhum</option>
                {servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}
              </select>
            </Field>
            <Button disabled={saving || !draft.name.trim()} onClick={async () => { await saveProduct(draft); setDraft(null); }}>Salvar</Button>
          </div>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={removingId !== null}
        title="Excluir produto"
        message={`${products.find((item) => item.id === removingId)?.name ?? "Este produto"} sai da lista. Os clientes ligados a ele permanecem.`}
        busy={saving}
        onClose={() => setRemovingId(null)}
        onConfirm={() => {
          if (removingId !== null) deleteProduct(removingId);
          setRemovingId(null);
        }}
      />
    </div>
  );
}
