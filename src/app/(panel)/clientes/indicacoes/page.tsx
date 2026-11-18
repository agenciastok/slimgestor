"use client";

import { UserPlus } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/ui";

export default function ReferralsPage() {
  const { clients } = useApp();
  const rows = clients
    .filter((client) => !client.archived)
    .map((client) => ({
      client,
      total: clients.filter((item) => item.referrer_id === client.id).length,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader icon={<UserPlus size={18} />} title="Indicações" subtitle="Quem trouxe clientes novos para a base." />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-3 py-3">Indicador</th><th>WhatsApp</th><th>Indicados</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.client.id} className="border-t border-white/5">
                <td className="px-3 py-3 text-white">{row.client.name}</td>
                <td>{row.client.whatsapp || "—"}</td>
                <td>{row.total}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-8 text-center text-slate-500">Nenhuma indicação ainda. O campo fica no cadastro do cliente.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
