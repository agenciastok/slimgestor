"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useApp } from "@/lib/store";
import { emptyClient, type ClientInput, type Currency } from "@/lib/types";
import { Button, PageHeader } from "@/components/ui";

function parseCsv(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && (char === "," || char === ";")) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function toIso(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const match = clean.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

export default function ImportPage() {
  const { plans, saveClient, saving } = useApp();
  const [preview, setPreview] = useState<ClientInput[]>([]);
  const [report, setReport] = useState("");

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const table = parseCsv(String(reader.result ?? ""));
      if (table.length < 2) {
        setPreview([]);
        setReport("A planilha precisa de cabeçalho e ao menos uma linha.");
        return;
      }
      const header = table[0].map((item) => item.toLowerCase());
      const index = (names: string[]) => header.findIndex((item) => names.includes(item));
      const col = {
        name: index(["nome", "name"]),
        whatsapp: index(["whatsapp", "telefone", "phone"]),
        email: index(["email", "e-mail"]),
        user: index(["usuario", "usuário", "user"]),
        pass: index(["senha", "password"]),
        due: index(["vencimento", "due"]),
        plan: index(["plano", "plan"]),
        value: index(["valor", "preco", "preço", "price"]),
        currency: index(["moeda", "currency"]),
        state: index(["estado", "uf"]),
      };
      const inputs = table.slice(1).map((line) => {
        const base = emptyClient();
        const pick = (position: number) => (position >= 0 ? line[position] ?? "" : "");
        const planName = pick(col.plan).toLowerCase();
        const plan = plans.find((item) => item.name.toLowerCase() === planName);
        const currency = pick(col.currency).toUpperCase() === "EUR" ? "EUR" : "BRL";
        return {
          ...base,
          name: pick(col.name),
          whatsapp: pick(col.whatsapp),
          email: pick(col.email),
          username: pick(col.user),
          password: pick(col.pass),
          due_date: toIso(pick(col.due)),
          plan_id: plan ? String(plan.id) : "",
          product_id: plan?.product_id ? String(plan.product_id) : "",
          price: Number(pick(col.value).replace(",", ".")) || plan?.price || 0,
          currency: (plan?.currency ?? currency) as Currency,
          state: pick(col.state).toUpperCase(),
          invoice_status: "pendente" as const,
        };
      }).filter((item) => item.name);
      setPreview(inputs);
      setReport(`${inputs.length} linha(s) pronta(s). A importação entra como fatura pendente, sem lançar financeiro.`);
    };
    reader.readAsText(file);
  }

  async function commit() {
    for (const input of preview) await saveClient(input);
    setReport(`${preview.length} cliente(s) importado(s).`);
    setPreview([]);
  }

  return (
    <div>
      <PageHeader icon={<Upload size={18} />} title="Importar clientes" subtitle="CSV ou planilha exportada com colunas nome, whatsapp, usuario, senha, vencimento, plano, valor, moeda, estado." />
      <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#10192e] px-6 py-10 text-center">
        <div className="text-white">Selecionar planilha</div>
        <div className="mt-1 text-sm text-slate-500">Aceita vírgula ou ponto e vírgula. Datas em dd/mm/aaaa.</div>
        <input className="hidden" type="file" accept=".csv,text/csv,text/plain" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }} />
      </label>
      {report ? <p className="mb-3 text-sm text-slate-300">{report}</p> : null}
      {preview.length > 0 ? (
        <>
          <div className="mb-3 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase text-slate-400"><tr><th className="px-3 py-2">Nome</th><th>WhatsApp</th><th>Vencimento</th><th>Valor</th></tr></thead>
              <tbody>
                {preview.slice(0, 8).map((item, index) => (
                  <tr key={index} className="border-t border-white/5">
                    <td className="px-3 py-2">{item.name}</td>
                    <td>{item.whatsapp}</td>
                    <td>{item.due_date || "—"}</td>
                    <td>{item.price} {item.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button disabled={saving} onClick={commit}>Confirmar importação</Button>
        </>
      ) : null}
    </div>
  );
}
