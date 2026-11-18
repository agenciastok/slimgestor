"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { displayDate } from "@/lib/billing";
import { useApp } from "@/lib/store";
import { Button, Field, PageHeader, fieldClass } from "@/components/ui";

export default function AccessPage() {
  const { settings, saveSettings, unlock, saving } = useApp();
  const [name, setName] = useState(settings?.display_name ?? "");
  const [phone, setPhone] = useState(settings?.phone ?? "");
  const [rate, setRate] = useState(settings?.eur_to_brl ?? 6.2);
  const [expires, setExpires] = useState(settings?.access_expires_at?.slice(0, 10) ?? "");
  const [pin, setPin] = useState("");
  const [tryPin, setTryPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  if (!settings) return null;

  return (
    <div>
      <PageHeader icon={<KeyRound size={18} />} title="Conta e acesso" subtitle="Nome, cotação do euro, validade do seu acesso e PIN do financeiro." />
      <form
        className="grid max-w-xl gap-3 rounded-2xl border border-white/10 bg-[#10192e] p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveSettings({
            display_name: name,
            phone,
            eur_to_brl: rate,
            access_expires_at: expires ? new Date(`${expires}T23:59:00`).toISOString() : null,
            pin: pin || undefined,
          });
          setPin("");
        }}
      >
        <Field label="Nome no painel"><input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Telefone"><input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
        <Field label="Quantos reais vale 1 euro" hint="Usado para converter BRL e EUR no dashboard e no financeiro.">
          <input className={fieldClass} type="number" min={0.0001} step="0.0001" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        </Field>
        <Field label="Seu acesso vence em" hint={settings.access_expires_at ? `Salvo: ${displayDate(settings.access_expires_at)}` : "Opcional, só um lembrete seu."}>
          <input className={fieldClass} type="date" value={expires} onChange={(event) => setExpires(event.target.value)} />
        </Field>
        <Field label="PIN do financeiro" hint="4 dígitos ou mais. Deixe vazio para manter o atual.">
          <input className={fieldClass} inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="••••" />
        </Field>
        <div className="flex gap-2">
          <Button disabled={saving}>Salvar</Button>
          {settings.finance_pin_hash ? (
            <Button type="button" tone="ghost" onClick={() => saveSettings({ clearPin: true })}>Remover PIN</Button>
          ) : null}
        </div>
      </form>
      {settings.finance_pin_hash ? (
        <form
          className="mt-4 grid max-w-xl gap-3 rounded-2xl border border-white/10 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await unlock(tryPin);
            setPinMessage(ok ? "Financeiro liberado nesta sessão." : "PIN incorreto.");
            if (ok) setTryPin("");
          }}
        >
          <Field label="Desbloquear valores"><input className={fieldClass} type="password" value={tryPin} onChange={(event) => setTryPin(event.target.value)} /></Field>
          <Button type="submit" tone="cyan">Desbloquear</Button>
          {pinMessage ? <p className="text-sm text-slate-300">{pinMessage}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
