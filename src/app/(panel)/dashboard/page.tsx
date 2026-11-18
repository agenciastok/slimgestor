"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { clientStatus, convert, daysInMonth, localDay, monthKey, todayISO } from "@/lib/billing";
import { useApp } from "@/lib/store";
import { BrazilMap } from "@/components/brazil-map";
import { Money } from "@/components/money";
import { Button, Stat } from "@/components/ui";

const COLORS = ["#2ee6c7", "#38bdf8", "#a78bfa", "#fbbf24", "#fb7185"];

export default function DashboardPage() {
  const { clients, transactions, servers, plans, settings, seedDemo, saving } = useApp();
  const [banner, setBanner] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const today = todayISO();
  const currency = settings?.preferred_currency ?? "BRL";
  const rate = settings?.eur_to_brl ?? 6.2;
  const active = clients.filter((client) => !client.archived && clientStatus(client) === "ativo");
  const expired = clients.filter((client) => !client.archived && clientStatus(client) === "vencido");
  const createdToday = clients.filter((client) => localDay(client.created_at) === today);
  const dueToday = clients.filter((client) => !client.archived && client.due_date === today);

  const month = monthKey();
  const days = daysInMonth();
  const newSeries = useMemo(() => {
    return Array.from({ length: days }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const key = `${month}-${day}`;
      return {
        day: String(index + 1),
        value: clients.filter((client) => localDay(client.created_at) === key).length,
      };
    });
  }, [clients, days, month]);

  const paySeries = useMemo(() => {
    return Array.from({ length: days }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const key = `${month}-${day}`;
      const value = transactions
        .filter((item) => item.direction === "entrada" && localDay(item.occurred_at) === key)
        .reduce((sum, item) => sum + convert(item.amount, item.currency, currency, rate), 0);
      return { day: String(index + 1), value: Number(value.toFixed(2)) };
    });
  }, [transactions, days, month, currency, rate]);

  const serverSlices = servers
    .map((server) => {
      const value = transactions
        .filter((item) => item.server_id === server.id && item.direction === "entrada")
        .reduce((sum, item) => sum + convert(item.amount, item.currency, currency, rate), 0);
      return { name: server.name, value };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const counts: Record<string, number> = {};
  for (const client of clients) {
    if (client.archived || !client.state) continue;
    counts[client.state] = (counts[client.state] ?? 0) + 1;
  }

  const monthIncome = transactions
    .filter((item) => item.direction === "entrada" && localDay(item.occurred_at).startsWith(month))
    .reduce((sum, item) => sum + convert(item.amount, item.currency, currency, rate), 0);
  const monthCost = transactions
    .filter((item) => item.direction === "saida" && localDay(item.occurred_at).startsWith(month))
    .reduce((sum, item) => sum + convert(item.amount, item.currency, currency, rate), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Visão do mês, em {currency}.</p>
      </div>
      {banner && settings && !settings.finance_pin_hash ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <span>Proteja os valores com um PIN de 4 dígitos em Renovar Acesso.</span>
          <button onClick={() => setBanner(false)} className="text-amber-200">fechar</button>
        </div>
      ) : null}
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-5">
          <div className="text-white">Sua base ainda está vazia.</div>
          <p className="mt-1 text-sm text-slate-400">Cadastre um painel e um cliente, ou carregue um exemplo para ver o painel funcionando.</p>
          <div className="mt-3 flex gap-2">
            <Button disabled={saving} onClick={() => seedDemo()}>Carregar exemplo</Button>
            <Link href="/clientes" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Ir para clientes</Link>
          </div>
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Total de clientes" value={clients.filter((client) => !client.archived).length} hint={`${createdToday.length} novos hoje`} />
        <Stat label="Clientes ativos" value={active.length} hint={`${dueToday.length} vencem hoje`} />
        <Stat label="Clientes vencidos" value={expired.length} hint="Fora de arquivados" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Entradas do mês" value={<Money amount={monthIncome} from={currency} />} />
        <Stat label="Custos do mês" value={<Money amount={monthCost} from={currency} />} hint="Inclui o custo de cada renovação no servidor" />
        <Stat label="Lucro do mês" value={<Money amount={monthIncome - monthCost} from={currency} />} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#10192e] p-4">
        <div className="mb-2 text-sm font-medium text-white">Créditos dos painéis</div>
        <div className="flex flex-wrap gap-2">
          {servers.length === 0 ? <span className="text-sm text-slate-500">Nenhum painel cadastrado.</span> : null}
          {servers.map((server) => (
            <div key={server.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm">
              <span className="text-white">{server.name}</span>
              <span className="ml-2 text-cyan-200">{server.credits} créditos</span>
              <span className="ml-2 text-slate-500">custo <Money amount={server.renewal_cost} from={server.cost_currency} /> por crédito</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <ChartCard title="Clientes novos · mês atual">
          {mounted ? <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={newSeries}>
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #243049", borderRadius: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#2ee6c7" fill="#2ee6c733" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer> : <div className="h-[220px]" />}
        </ChartCard>
        <ChartCard title={`Pagamentos · mês atual (${currency})`}>
          {mounted ? <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={paySeries}>
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #243049", borderRadius: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#34d399" fill="#34d39933" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer> : <div className="h-[220px]" />}
        </ChartCard>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#10192e] p-4">
          <div className="mb-2 text-sm font-medium">Top painéis por receita</div>
          {serverSlices.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">Sem receita ligada a um painel.</div>
          ) : (
            <div className="grid items-center gap-2 md:grid-cols-[220px_1fr]">
              {mounted ? <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={serverSlices} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86}>
                    {serverSlices.map((slice, index) => (
                      <Cell key={slice.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #243049", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer> : <div className="h-[220px]" />}
              <div className="space-y-2 text-sm">
                {serverSlices.map((slice, index) => (
                  <div key={slice.name} className="flex justify-between gap-3">
                    <span className="text-slate-300">{slice.name}</span>
                    <span style={{ color: COLORS[index % COLORS.length] }}><Money amount={slice.value} from={currency} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-2 text-xs text-slate-500">{plans.length} planos cadastrados</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#10192e] p-4">
          <div className="mb-2 text-sm font-medium">Clientes por estado</div>
          <BrazilMap counts={counts} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#10192e] p-4">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}
