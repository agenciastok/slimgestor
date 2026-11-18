"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { AppProvider, useApp } from "@/lib/store";

function Guard({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="grid min-h-screen place-items-center bg-[#070b16] text-sm text-slate-400">Carregando sessão...</div>;
  }

  return (
    <AppProvider>
      <Boot>{children}</Boot>
    </AppProvider>
  );
}

function Boot({ children }: { children: React.ReactNode }) {
  const { loading, error } = useApp();
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#070b16] text-sm text-slate-400">Carregando o painel...</div>;
  }
  return (
    <Shell>
      {error ? <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      {children}
    </Shell>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <Guard>{children}</Guard>;
}
