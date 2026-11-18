"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarClock,
  CreditCard,
  FlaskConical,
  Gift,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  Server,
  Smartphone,
  Tv,
  Upload,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/billing";

const groups = [
  {
    label: "Gerenciamento",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/indique", label: "Indique & Ganhe", icon: Gift },
      { href: "/acesso", label: "Renovar Acesso", icon: KeyRound },
    ],
  },
  {
    label: "Clientes",
    items: [
      { href: "/clientes", label: "Listar / Criar", icon: Users },
      { href: "/clientes/planos", label: "Planos", icon: CreditCard },
      { href: "/clientes/produtos", label: "Produtos", icon: Package },
      { href: "/clientes/aplicativos", label: "Aplicativos", icon: Smartphone },
      { href: "/clientes/indicacoes", label: "Indicações", icon: UserPlus },
      { href: "/clientes/testes", label: "Testes", icon: FlaskConical },
      { href: "/clientes/importar", label: "Importar Clientes", icon: Upload },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/financeiro", label: "Visão Geral", icon: Wallet },
      { href: "/financeiro/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    label: "Cobranças",
    items: [
      { href: "/cobrancas", label: "Ativar Lembretes", icon: Bell },
      { href: "/cobrancas/previa", label: "Prévia de Envios", icon: CalendarClock },
    ],
  },
  {
    label: "Mensagens",
    items: [{ href: "/mensagens", label: "Templates", icon: MessageSquare }],
  },
  {
    label: "Integrações",
    items: [
      { href: "/paineis", label: "Painéis IPTV", icon: Server },
      { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/aplicativo", label: "App do Cliente", icon: Tv },
    ],
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { settings, saveSettings, saving } = useApp();
  const [open, setOpen] = useState(false);
  const code = user?.id.slice(0, 6).toUpperCase();
  const currency = settings?.preferred_currency ?? "BRL";

  async function logout() {
    await db().auth.signOut();
    router.replace("/login");
  }

  async function setCurrency(next: "BRL" | "EUR") {
    if (!settings || next === currency) return;
    await saveSettings({ preferred_currency: next });
  }

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-emerald-400 text-base font-black text-slate-950">
          S
        </div>
        <div>
          <div className="text-sm font-semibold tracking-[0.14em] text-white">SLIM GESTOR</div>
          <div className="text-[11px] text-slate-500">Painel {code}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                      active ? "bg-cyan-400/15 text-cyan-200" : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100">
      <div className="md:grid md:grid-cols-[16.5rem_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-[#0a1022] md:block">{nav}</aside>
        {open ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Fechar menu" />
            <aside className="relative h-full w-72 border-r border-white/10 bg-[#0a1022]">{nav}</aside>
          </div>
        ) : null}
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#070b16]/90 px-4 py-3 backdrop-blur">
            <button className="rounded-lg p-2 text-slate-300 md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="text-xs text-slate-500">
              Cotação 1 EUR = {formatMoney(settings?.eur_to_brl ?? 6.2, "BRL")}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs font-semibold">
                {(["BRL", "EUR"] as const).map((item) => (
                  <button
                    key={item}
                    disabled={saving}
                    onClick={() => setCurrency(item)}
                    className={`rounded-lg px-2.5 py-1 ${currency === item ? "bg-cyan-400 text-slate-950" : "text-slate-300"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-sm text-white">{settings?.display_name || "Minha conta"}</div>
                <div className="text-[11px] text-slate-500">{user?.email}</div>
              </div>
              <button onClick={logout} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5" aria-label="Sair">
                <LogOut size={16} />
              </button>
            </div>
          </header>
          <main className="px-4 py-5 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
