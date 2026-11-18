"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import type { WaSession } from "@/lib/types";
import { Badge, Button, Field, PageHeader, fieldClass } from "@/components/ui";

const blank: Omit<WaSession, "id"> = { name: "", phone: "", status: "desconectado" };

export default function WhatsappPage() {
  const { sessions, clients, saveSession, deleteSession, saving } = useApp();
  const [form, setForm] = useState<Omit<WaSession, "id"> & { id?: number }>(blank);

  return (
    <div>
      <PageHeader
        icon={<MessageCircle size={18} />}
        title="WhatsApp"
        subtitle="Sessões usadas no cadastro do cliente. O envio abre o WhatsApp Web ou o app, com a mensagem preenchida."
        tone="green"
      />
      <form
        className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-[#10192e] p-4 md:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveSession(form);
          setForm(blank);
        }}
      >
        <Field label="Nome da sessão"><input className={fieldClass} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Número"><input className={fieldClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Status">
          <select className={fieldClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as WaSession["status"] })}>
            <option value="conectado">Conectado</option>
            <option value="desconectado">Desconectado</option>
          </select>
        </Field>
        <div className="md:col-span-3"><Button disabled={saving}>Salvar sessão</Button></div>
      </form>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
            <div>
              <div className="flex items-center gap-2 text-white">{session.name} <Badge tone={session.status === "conectado" ? "green" : "slate"}>{session.status}</Badge></div>
              <div className="text-sm text-slate-400">{session.phone || "Sem número"} · {clients.filter((client) => client.billing_session_id === session.id).length} clientes</div>
            </div>
            <div className="flex gap-2">
              <Button tone="ghost" onClick={() => setForm(session)}>Editar</Button>
              <Button tone="danger" onClick={() => deleteSession(session.id)}>Excluir</Button>
            </div>
          </div>
        ))}
        {sessions.length === 0 ? <p className="text-sm text-slate-500">Nenhuma sessão. Você ainda pode cobrar pelo botão de WhatsApp do cliente.</p> : null}
      </div>
    </div>
  );
}
