"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/supabase";
import { Button, fieldClass } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const client = db();
    const result =
      mode === "entrar"
        ? await client.auth.signInWithPassword({ email: email.trim(), password })
        : await client.auth.signUp({ email: email.trim(), password });
    setPending(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "criar" && !result.data.session) {
      setMessage("Conta criada. Confirme o e-mail para entrar, se a confirmação estiver ativa.");
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#070b16] px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#10192e] p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-emerald-400 text-lg font-black text-slate-950">
            S
          </div>
          <div>
            <div className="text-lg font-semibold text-white">SLIM GESTOR</div>
            <div className="text-sm text-slate-400">Clientes, cobrança e financeiro IPTV</div>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1 text-sm">
          <button type="button" onClick={() => setMode("entrar")} className={`rounded-lg py-2 ${mode === "entrar" ? "bg-cyan-400 text-slate-950" : "text-slate-300"}`}>
            Entrar
          </button>
          <button type="button" onClick={() => setMode("criar")} className={`rounded-lg py-2 ${mode === "criar" ? "bg-cyan-400 text-slate-950" : "text-slate-300"}`}>
            Criar conta
          </button>
        </div>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-slate-300">E-mail</span>
          <input className={fieldClass} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-300">Senha</span>
          <input className={fieldClass} type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {message ? <p className="mb-3 text-sm text-amber-200">{message}</p> : null}
        <Button className="w-full" disabled={pending}>
          {pending ? "Aguarde..." : mode === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Cada conta vê somente os próprios clientes. Real e euro ficam no mesmo painel, com cotação editável.
        </p>
      </form>
    </div>
  );
}
