"use client";

import { Tv } from "lucide-react";
import { displayDate } from "@/lib/billing";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/ui";

export default function ClientAppPage() {
  const { clients, apps } = useApp();
  const rows = clients.filter((client) => !client.archived && (client.app_id || client.mac_or_email || client.app_key));

  return (
    <div>
      <PageHeader icon={<Tv size={18} />} title="App do cliente" subtitle="MAC, chave e vencimento do aplicativo vinculado a cada cliente." />
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-3 py-3">Cliente</th><th>App</th><th>Dispositivo</th><th>MAC / e-mail</th><th>Key</th><th>Vencimento</th></tr>
          </thead>
          <tbody>
            {rows.map((client) => (
              <tr key={client.id} className="border-t border-white/5">
                <td className="px-3 py-3 text-white">{client.name}</td>
                <td>{apps.find((app) => app.id === client.app_id)?.name ?? "—"}</td>
                <td>{client.device || "—"}</td>
                <td>{client.mac_or_email || "—"}</td>
                <td>{client.app_key || "—"}</td>
                <td>{displayDate(client.app_due)}</td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">Nenhum aplicativo vinculado.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
