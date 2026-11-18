import type { ClientStatus, Currency } from "./types";

export function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return formatDate(new Date());
}

export function displayDate(iso?: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatDate(dt);
}

export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, last));
  return formatDate(target);
}

export function localDay(iso: string) {
  return formatDate(new Date(iso));
}

export function weekday(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function netAmount(
  row: {
    price: number;
    discount: number;
    discount_until: string | null;
    discount_always: boolean;
  },
  on = todayISO(),
) {
  const active = row.discount_always || !row.discount_until || row.discount_until >= on;
  return active ? Math.max(0, row.price - row.discount) : row.price;
}

export function clientStatus(
  c: { archived: boolean; kind: string; due_date: string | null },
  today = todayISO(),
): ClientStatus {
  if (c.archived) return "arquivado";
  if (c.due_date && c.due_date < today) return "vencido";
  if (c.kind === "teste") return "teste";
  return "ativo";
}

export function convert(amount: number, from: Currency, to: Currency, eurToBrl: number) {
  if (from === to) return amount;
  const rate = eurToBrl > 0 ? eurToBrl : 1;
  if (from === "EUR" && to === "BRL") return amount * rate;
  return amount / rate;
}

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function creditCycles(durationMonths?: number | null) {
  const months = Math.trunc(Number(durationMonths));
  return Number.isFinite(months) && months > 0 ? months : 1;
}

export function nextDue(
  current: string | null,
  months: number,
  fixed: boolean,
  override?: string,
) {
  if (override) return override;
  const step = Math.max(1, months);
  const today = todayISO();
  if (fixed && current) {
    let cursor = current;
    for (let i = 0; i < 48 && cursor <= today; i += 1) cursor = addMonths(cursor, step);
    return cursor;
  }
  const base = current && current > today ? current : today;
  return addMonths(base, step);
}

export function fillTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export function waLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function offsetLabel(days: number) {
  if (days === 0) return "No dia do vencimento";
  if (days > 0) return `${days}d após o vencimento`;
  return `${Math.abs(days)}d antes do vencimento`;
}

export function templateFromOffset(days: number) {
  if (days > 0) return "apos_vencimento" as const;
  if (days < 0) return "prestes_a_vencer" as const;
  return "vence_hoje" as const;
}

export function daysInMonth(ref = new Date()) {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
}

export function monthKey(ref = new Date()) {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
}

export async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const WEEKDAYS = [
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
  { id: 0, label: "Dom" },
];

export const STATUS_LABEL: Record<ClientStatus, string> = {
  ativo: "Ativo",
  vencido: "Vencido",
  teste: "Teste",
  arquivado: "Arquivado",
};

export const CATEGORY_LABEL = {
  novo_cliente: "Novo cliente",
  renovacao: "Renovação",
  custo_servidor: "Custo do servidor",
  manual: "Lançamento manual",
  ativacao_app: "Custo de ativação",
};

export const TEMPLATE_LABEL = {
  apos_vencimento: "Após o vencimento",
  vence_hoje: "Vence hoje",
  prestes_a_vencer: "Prestes a vencer",
};

export const HEARD_FROM = ["Indicação", "Instagram", "WhatsApp", "Google", "Facebook", "Outro"];

export const NON_RENEWAL_REASONS = [
  { code: "preco", label: "Preço" },
  { code: "qualidade", label: "Qualidade do conteúdo" },
  { code: "instabilidade", label: "Instabilidade ou travamento" },
  { code: "atendimento", label: "Atendimento" },
  { code: "concorrente", label: "Foi para outro fornecedor" },
  { code: "nao_usa", label: "Não usa mais" },
  { code: "sem_resposta", label: "Não respondeu" },
  { code: "pagamento", label: "Problema no pagamento" },
  { code: "outro", label: "Outro" },
] as const;

export function nonRenewalLabel(code: string) {
  return NON_RENEWAL_REASONS.find((item) => item.code === code)?.label ?? code;
}

export const STATES = [
  ["AC", "Acre"],
  ["AL", "Alagoas"],
  ["AP", "Amapá"],
  ["AM", "Amazonas"],
  ["BA", "Bahia"],
  ["CE", "Ceará"],
  ["DF", "Distrito Federal"],
  ["ES", "Espírito Santo"],
  ["GO", "Goiás"],
  ["MA", "Maranhão"],
  ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"],
  ["PA", "Pará"],
  ["PB", "Paraíba"],
  ["PR", "Paraná"],
  ["PE", "Pernambuco"],
  ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"],
  ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"],
  ["RR", "Roraima"],
  ["SC", "Santa Catarina"],
  ["SP", "São Paulo"],
  ["SE", "Sergipe"],
  ["TO", "Tocantins"],
] as const;
