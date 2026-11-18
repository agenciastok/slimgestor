"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Template } from "@/lib/types";
import { Button, Field, PageHeader, fieldClass } from "@/components/ui";

const blank: Omit<Template, "id"> = { name: "", body: "Olá {nome}, seu plano {plano} vence em {vencimento}. Valor {valor}.", purpose: "cobranca" };

export default function MessagesPage() {
  const { templates, saveTemplate, deleteTemplate, saving } = useApp();
  const [form, setForm] = useState<Omit<Template, "id"> & { id?: number }>(blank);

  return (
    <div>
      <PageHeader icon={<MessageSquare size={18} />} title="Templates" subtitle="Variáveis: {nome} {usuario} {plano} {vencimento} {valor}." />
      <form
        className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-[#10192e] p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveTemplate(form);
          setForm(blank);
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome"><input className={fieldClass} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Uso">
            <select className={fieldClass} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value as Template["purpose"] })}>
              <option value="cobranca">Cobrança</option>
              <option value="boas_vindas">Boas-vindas</option>
              <option value="renovacao">Renovação</option>
            </select>
          </Field>
        </div>
        <Field label="Mensagem"><textarea className={fieldClass} rows={4} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Field>
        <div className="flex gap-2">
          <Button disabled={saving}>Salvar template</Button>
          {form.id ? <Button type="button" tone="ghost" onClick={() => setForm(blank)}>Cancelar</Button> : null}
        </div>
      </form>
      <div className="grid gap-3">
        {templates.map((template) => (
          <div key={template.id} className="rounded-2xl border border-white/10 bg-[#10192e] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-white">{template.name}</div>
              <div className="flex gap-2">
                <Button tone="ghost" onClick={() => setForm(template)}>Editar</Button>
                <Button tone="danger" onClick={() => deleteTemplate(template.id)}>Excluir</Button>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{template.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
