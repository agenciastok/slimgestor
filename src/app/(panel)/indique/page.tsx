"use client";

import { Gift } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import { PageHeader, Stat } from "@/components/ui";

export default function IndicatePage() {
  const { user } = useAuth();
  const { clients } = useApp();
  const code = user?.id.slice(0, 8).toUpperCase();
  const referred = clients.filter((client) => client.heard_from === "Indicação" && !client.archived).length;

  return (
    <div>
      <PageHeader icon={<Gift size={18} />} title="Indique & Ganhe" subtitle="Use este código para marcar a origem dos clientes que chegam por indicação." tone="green" />
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#10192e] p-5">
        <div className="text-xs uppercase tracking-wide text-slate-500">Seu código</div>
        <div className="mt-1 text-3xl font-semibold tracking-[0.2em] text-white">{code}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Stat label="Clientes por indicação" value={referred} hint="Campo “Como conheceu” = Indicação" />
        <Stat label="Com indicador marcado" value={clients.filter((client) => client.referrer_id).length} />
      </div>
    </div>
  );
}
