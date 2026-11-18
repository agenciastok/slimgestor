"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth";
import { addDays, creditCycles, monthKey, netAmount, nextDue, sha256, todayISO } from "./billing";
import { db } from "./supabase";
import type {
  AppItem,
  BillingRule,
  BillingTemplate,
  Client,
  ClientInput,
  Currency,
  ExtraAccess,
  ExtraApp,
  InvoiceStatus,
  Plan,
  Product,
  ServerPanel,
  Settings,
  Template,
  Transaction,
  TxCategory,
  TxDirection,
  WaSession,
} from "./types";
import { useToast } from "@/components/toast";

type Row = Record<string, unknown>;

function num(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function str(value: unknown) {
  return value == null ? "" : String(value);
}

function dateOrNull(value: unknown) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function idOrNull(value: unknown) {
  if (value == null || value === "") return null;
  return num(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asInts(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => num(item));
  if (typeof value === "string") {
    return value
      .replace(/[{}]/g, "")
      .split(",")
      .filter(Boolean)
      .map((item) => num(item));
  }
  return [];
}

function raise(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function mapSettings(row: Row): Settings {
  return {
    owner_id: str(row.owner_id),
    display_name: str(row.display_name),
    phone: str(row.phone),
    preferred_currency: (str(row.preferred_currency) || "BRL") as Currency,
    eur_to_brl: num(row.eur_to_brl, 6.2),
    finance_pin_hash: row.finance_pin_hash ? str(row.finance_pin_hash) : null,
    auto_archive_days: num(row.auto_archive_days, 90),
    access_expires_at: row.access_expires_at ? str(row.access_expires_at) : null,
  };
}

function mapServer(row: Row): ServerPanel {
  return {
    id: num(row.id),
    name: str(row.name),
    url: str(row.url),
    username: str(row.username),
    password: str(row.password),
    auto_renew: row.auto_renew !== false,
    renewal_cost: num(row.renewal_cost),
    cost_currency: (str(row.cost_currency) || "BRL") as Currency,
    credits: num(row.credits),
    status: str(row.status) === "inativo" ? "inativo" : "ativo",
    notes: str(row.notes),
  };
}

function mapProduct(row: Row): Product {
  return { id: num(row.id), name: str(row.name), server_id: idOrNull(row.server_id), active: row.active !== false };
}

function mapPlan(row: Row): Plan {
  return {
    id: num(row.id),
    product_id: idOrNull(row.product_id),
    name: str(row.name),
    price: num(row.price),
    currency: (str(row.currency) || "BRL") as Currency,
    duration_months: num(row.duration_months, 1),
    description: str(row.description),
    active: row.active !== false,
  };
}

function mapApp(row: Row): AppItem {
  return {
    id: num(row.id),
    name: str(row.name),
    activation_price: num(row.activation_price),
    currency: (str(row.currency) || "BRL") as Currency,
    description: str(row.description),
    active: row.active !== false,
  };
}

function mapTemplate(row: Row): Template {
  const purpose = str(row.purpose);
  return {
    id: num(row.id),
    name: str(row.name),
    body: str(row.body),
    purpose: purpose === "boas_vindas" || purpose === "renovacao" ? purpose : "cobranca",
  };
}

function mapSession(row: Row): WaSession {
  return {
    id: num(row.id),
    name: str(row.name),
    phone: str(row.phone),
    status: str(row.status) === "conectado" ? "conectado" : "desconectado",
  };
}

function mapClient(row: Row): Client {
  return {
    id: num(row.id),
    name: str(row.name),
    whatsapp: str(row.whatsapp),
    line: str(row.line),
    email: str(row.email),
    document: str(row.document),
    birthday: dateOrNull(row.birthday),
    username: str(row.username),
    password: str(row.password),
    billing_session_id: idOrNull(row.billing_session_id),
    welcome_template_id: idOrNull(row.welcome_template_id),
    reminders_enabled: row.reminders_enabled !== false,
    heard_from: str(row.heard_from),
    referrer_id: idOrNull(row.referrer_id),
    notes: str(row.notes),
    product_id: idOrNull(row.product_id),
    plan_id: idOrNull(row.plan_id),
    server_id: idOrNull(row.server_id),
    screens: num(row.screens, 1),
    due_date: dateOrNull(row.due_date),
    fixed_due: row.fixed_due === true,
    invoice_status: str(row.invoice_status) === "pendente" ? "pendente" : "pago",
    kind: str(row.kind) === "teste" ? "teste" : "cliente",
    archived: row.archived === true,
    non_renewal_reason: str(row.non_renewal_reason),
    non_renewal_note: str(row.non_renewal_note),
    non_renewed_at: dateOrNull(row.non_renewed_at),
    discount: num(row.discount),
    discount_until: dateOrNull(row.discount_until),
    discount_always: row.discount_always === true,
    currency: (str(row.currency) || "BRL") as Currency,
    price: num(row.price),
    app_id: idOrNull(row.app_id),
    app_due: dateOrNull(row.app_due),
    device: str(row.device),
    mac_or_email: str(row.mac_or_email),
    app_key: str(row.app_key),
    extra_apps: asArray<ExtraApp>(row.extra_apps),
    extra_accesses: asArray<ExtraAccess>(row.extra_accesses),
    state: str(row.state),
    created_at: str(row.created_at),
  };
}

function mapTx(row: Row): Transaction {
  const category = str(row.category) as TxCategory;
  return {
    id: num(row.id),
    client_id: idOrNull(row.client_id),
    server_id: idOrNull(row.server_id),
    plan_id: idOrNull(row.plan_id),
    product_id: idOrNull(row.product_id),
    direction: str(row.direction) === "saida" ? "saida" : "entrada",
    category: ["novo_cliente", "renovacao", "custo_servidor", "manual", "ativacao_app"].includes(category)
      ? category
      : "manual",
    amount: num(row.amount),
    currency: (str(row.currency) || "BRL") as Currency,
    description: str(row.description),
    occurred_at: str(row.occurred_at),
  };
}

function mapRule(row: Row): BillingRule {
  const template = str(row.template) as BillingTemplate;
  return {
    id: num(row.id),
    template: ["apos_vencimento", "vence_hoje", "prestes_a_vencer"].includes(template)
      ? template
      : "vence_hoje",
    weekdays: asInts(row.weekdays),
    send_time: str(row.send_time).slice(0, 5) || "09:00",
    offset_days: num(row.offset_days),
    active: row.active !== false,
  };
}

const DEFAULT_LINES = ["IE", "AL", "BR", "P"];

const DEFAULT_TEMPLATES = [
  {
    name: "Boas-vindas",
    purpose: "boas_vindas",
    body: "Olá {nome}! Seu acesso foi criado.\nUsuário: {usuario}\nPlano: {plano}\nVencimento: {vencimento}",
  },
  {
    name: "Cobrança",
    purpose: "cobranca",
    body: "Olá {nome}, o plano {plano} vence em {vencimento}. Valor: {valor}. Posso renovar por aqui?",
  },
  {
    name: "Renovação confirmada",
    purpose: "renovacao",
    body: "Olá {nome}! Renovação confirmada até {vencimento}. Plano {plano}, valor {valor}.",
  },
];

type Snapshot = {
  servers: ServerPanel[];
  apps: AppItem[];
  clients: Client[];
  plans: Plan[];
  transactions: Transaction[];
};

type ManualTx = {
  direction: TxDirection;
  amount: number;
  currency: Currency;
  description: string;
  occurred_at: string;
  client_id?: number | null;
  server_id?: number | null;
};

type AppApi = {
  loading: boolean;
  saving: boolean;
  error: string;
  unlocked: boolean;
  settings: Settings | null;
  servers: ServerPanel[];
  products: Product[];
  plans: Plan[];
  apps: AppItem[];
  templates: Template[];
  sessions: WaSession[];
  lines: string[];
  rules: BillingRule[];
  clients: Client[];
  transactions: Transaction[];
  refresh: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  saveSettings: (patch: Partial<Settings> & { pin?: string; clearPin?: boolean }) => Promise<void>;
  saveServer: (input: Omit<ServerPanel, "id"> & { id?: number }) => Promise<void>;
  deleteServer: (id: number) => Promise<void>;
  saveProduct: (input: Omit<Product, "id"> & { id?: number }) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  savePlan: (input: Omit<Plan, "id"> & { id?: number }) => Promise<void>;
  deletePlan: (id: number) => Promise<void>;
  saveApp: (input: Omit<AppItem, "id"> & { id?: number }) => Promise<void>;
  deleteApp: (id: number) => Promise<void>;
  saveTemplate: (input: Omit<Template, "id"> & { id?: number }) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  saveSession: (input: Omit<WaSession, "id"> & { id?: number }) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  saveRule: (input: Omit<BillingRule, "id" | "template"> & { id?: number }) => Promise<void>;
  deleteRule: (id: number) => Promise<void>;
  createDefaultRules: () => Promise<void>;
  saveClient: (input: ClientInput, id?: number) => Promise<void>;
  archiveClients: (ids: number[], archived: boolean) => Promise<void>;
  deleteClients: (ids: number[]) => Promise<void>;
  renewClient: (id: number, opts: { due: string; invoice: InvoiceStatus; planId?: number }) => Promise<Client>;
  receiveClient: (id: number) => Promise<void>;
  addTransaction: (input: ManualTx) => Promise<void>;
  deleteTransactions: (ids: number[]) => Promise<void>;
  applyAutoArchive: () => Promise<number>;
  seedDemo: () => Promise<void>;
};

const Ctx = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [servers, setServers] = useState<ServerPanel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sessions, setSessions] = useState<WaSession[]>([]);
  const [lines, setLines] = useState<string[]>(DEFAULT_LINES);
  const [rules, setRules] = useState<BillingRule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const snap = useRef<Snapshot>({ servers: [], apps: [], clients: [], plans: [], transactions: [] });
  snap.current = { servers, apps, clients, plans, transactions };

  const ownerId = user?.id;
  const refresh = useCallback(async () => {
    if (!ownerId) return;
    const client = db();
    const ensured = await client.from("gs_settings").upsert({ owner_id: ownerId }, { onConflict: "owner_id", ignoreDuplicates: true });
    raise(ensured.error);
    const settingsRow = await client.from("gs_settings").select("*").single();
    raise(settingsRow.error);
    const seededLines = await client.from("gs_lines").upsert(
      DEFAULT_LINES.map((code) => ({ owner_id: ownerId, code })),
      { onConflict: "owner_id,code", ignoreDuplicates: true },
    );
    raise(seededLines.error);
    const [serverRes, productRes, planRes, appRes, templateRes, lineRes, sessionRes, ruleRes, clientRes, txRes] =
      await Promise.all([
        client.from("gs_servers").select("*").order("name"),
        client.from("gs_products").select("*").order("name"),
        client.from("gs_plans").select("*").order("name"),
        client.from("gs_apps").select("*").order("name"),
        client.from("gs_templates").select("*").order("name"),
        client.from("gs_lines").select("code"),
        client.from("gs_whatsapp_sessions").select("*").order("name"),
        client.from("gs_billing_rules").select("*").order("offset_days"),
        client.from("gs_clients").select("*").order("created_at", { ascending: false }).limit(3000),
        client.from("gs_transactions").select("*").order("occurred_at", { ascending: false }).limit(5000),
      ]);
    for (const result of [serverRes, productRes, planRes, appRes, templateRes, lineRes, sessionRes, ruleRes, clientRes, txRes]) {
      raise(result.error);
    }
    let templateRows = (templateRes.data ?? []) as Row[];
    if (templateRows.length === 0) {
      const inserted = await client
        .from("gs_templates")
        .upsert(
          DEFAULT_TEMPLATES.map((item) => ({ ...item, owner_id: ownerId })),
          { onConflict: "owner_id,name", ignoreDuplicates: true },
        )
        .select("*");
      raise(inserted.error);
      templateRows = (inserted.data ?? []) as Row[];
      if (templateRows.length === 0) {
        const again = await client.from("gs_templates").select("*").order("name");
        raise(again.error);
        templateRows = (again.data ?? []) as Row[];
      }
    }
    setSettings(mapSettings(settingsRow.data as Row));
    setServers(((serverRes.data ?? []) as Row[]).map(mapServer));
    setProducts(((productRes.data ?? []) as Row[]).map(mapProduct));
    setPlans(((planRes.data ?? []) as Row[]).map(mapPlan));
    setApps(((appRes.data ?? []) as Row[]).map(mapApp));
    setTemplates(templateRows.map(mapTemplate));
    const storedLines = ((lineRes.data ?? []) as Row[]).map((row) => str(row.code));
    setLines(storedLines.length ? DEFAULT_LINES.filter((code) => storedLines.includes(code)) : DEFAULT_LINES);
    setSessions(((sessionRes.data ?? []) as Row[]).map(mapSession));
    setRules(((ruleRes.data ?? []) as Row[]).map(mapRule));
    setClients(((clientRes.data ?? []) as Row[]).map(mapClient));
    setTransactions(((txRes.data ?? []) as Row[]).map(mapTx));
    setError("");
  }, [ownerId]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    setLoading(true);
    refresh()
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Falha ao carregar");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [ownerId, refresh]);

  const run = useCallback(
    async (work: () => Promise<void>, ok = "Salvo") => {
      setSaving(true);
      try {
        await work();
        await refresh();
        if (ok) toast.success(ok);
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Não foi possível salvar";
        toast.error(message);
        throw reason;
      } finally {
        setSaving(false);
      }
    },
    [refresh, toast],
  );

  const payload = useCallback((input: ClientInput, ownerId: string) => {
    return {
      owner_id: ownerId,
      name: input.name.trim(),
      whatsapp: input.whatsapp.trim(),
      line: input.line || null,
      email: input.email.trim(),
      document: input.document.trim(),
      birthday: input.birthday || null,
      username: input.username.trim(),
      password: input.password,
      billing_session_id: input.billing_session_id ? Number(input.billing_session_id) : null,
      welcome_template_id: input.welcome_template_id ? Number(input.welcome_template_id) : null,
      reminders_enabled: input.reminders_enabled,
      heard_from: input.heard_from,
      referrer_id: input.referrer_id ? Number(input.referrer_id) : null,
      notes: input.notes.trim(),
      product_id: input.product_id ? Number(input.product_id) : null,
      plan_id: input.plan_id ? Number(input.plan_id) : null,
      server_id: input.server_id ? Number(input.server_id) : null,
      screens: Math.max(1, input.screens || 1),
      due_date: input.due_date || null,
      fixed_due: input.fixed_due,
      invoice_status: input.invoice_status,
      kind: input.kind,
      non_renewal_reason: input.non_renewal_reason || null,
      non_renewal_note: input.non_renewal_reason ? input.non_renewal_note.trim() : null,
      non_renewed_at: input.non_renewal_reason ? input.non_renewed_at || todayISO() : null,
      discount: input.discount || 0,
      discount_until: input.discount_until || null,
      discount_always: input.discount_always,
      currency: input.currency,
      price: input.price || 0,
      app_id: input.app_id ? Number(input.app_id) : null,
      app_due: input.app_due || null,
      device: input.device.trim(),
      mac_or_email: input.mac_or_email.trim(),
      app_key: input.app_key.trim(),
      extra_apps: input.extra_apps,
      extra_accesses: input.extra_accesses,
      state: input.state,
    };
  }, []);

  const book = useCallback(
    async (client: Client, category: "novo_cliente" | "renovacao") => {
      if (!user) return;
      const net = netAmount(client);
      const rows: Record<string, unknown>[] = [];
      if (net > 0) {
        rows.push({
          owner_id: user.id,
          client_id: client.id,
          server_id: client.server_id,
          plan_id: client.plan_id,
          product_id: client.product_id,
          direction: "entrada",
          category,
          amount: net,
          currency: client.currency,
          description: `${category === "renovacao" ? "Renovação" : "Novo cliente"} · ${client.name}`,
        });
      }
      const server = snap.current.servers.find((item) => item.id === client.server_id);
      const chargeServer = Boolean(server?.auto_renew);
      const cycles = creditCycles(snap.current.plans.find((item) => item.id === client.plan_id)?.duration_months);
      if (server && chargeServer && server.renewal_cost > 0) {
        rows.push({
          owner_id: user.id,
          client_id: client.id,
          server_id: server.id,
          plan_id: client.plan_id,
          product_id: client.product_id,
          direction: "saida",
          category: "custo_servidor",
          amount: Number(server.renewal_cost) * cycles,
          currency: server.cost_currency,
          description: cycles > 1 ? `Custo de renovação · ${server.name} · ${cycles} créditos` : `Custo de renovação · ${server.name}`,
        });
      }
      if (category === "novo_cliente" && client.app_id) {
        const app = snap.current.apps.find((item) => item.id === client.app_id);
        if (app && app.activation_price > 0) {
          rows.push({
            owner_id: user.id,
            client_id: client.id,
            direction: "saida",
            category: "ativacao_app",
            amount: app.activation_price,
            currency: app.currency,
            description: `Custo de ativação · ${app.name} · ${client.name}`,
          });
        }
      }
      if (rows.length) {
        const { error } = await db().from("gs_transactions").insert(rows);
        raise(error);
      }
      if (server && chargeServer) {
        const { error } = await db()
          .from("gs_servers")
          .update({ credits: Number(server.credits) - cycles })
          .eq("id", server.id);
        raise(error);
      }
    },
    [user],
  );

  const api = useMemo<AppApi>(() => {
    return {
      loading,
      saving,
      error,
      unlocked,
      settings,
      servers,
      products,
      plans,
      apps,
      templates,
      sessions,
      lines: lines.length ? lines : DEFAULT_LINES,
      rules,
      clients,
      transactions,
      refresh,
      unlock: async (pin: string) => {
        if (!settings?.finance_pin_hash) return true;
        const hash = await sha256(pin);
        const ok = hash === settings.finance_pin_hash;
        setUnlocked(ok);
        return ok;
      },
      saveSettings: (patch) =>
        run(async () => {
          if (!user || !settings) return;
          const next: Record<string, unknown> = {
            display_name: patch.display_name ?? settings.display_name,
            phone: patch.phone ?? settings.phone,
            preferred_currency: patch.preferred_currency ?? settings.preferred_currency,
            eur_to_brl: patch.eur_to_brl ?? settings.eur_to_brl,
            auto_archive_days: patch.auto_archive_days ?? settings.auto_archive_days,
            access_expires_at: patch.access_expires_at === undefined ? settings.access_expires_at : patch.access_expires_at,
          };
          if (patch.clearPin) next.finance_pin_hash = null;
          if (patch.pin) next.finance_pin_hash = await sha256(patch.pin);
          const { error } = await db().from("gs_settings").update(next).eq("owner_id", user.id);
          raise(error);
          if (patch.clearPin) setUnlocked(false);
          if (patch.pin) setUnlocked(true);
        }),
      saveServer: (input) =>
        run(async () => {
          if (!user) return;
          const row = {
            owner_id: user.id,
            name: input.name.trim(),
            url: input.url.trim(),
            username: input.username.trim(),
            password: input.password,
            auto_renew: input.auto_renew,
            renewal_cost: input.renewal_cost || 0,
            cost_currency: input.cost_currency,
            credits: input.credits || 0,
            status: input.status,
            notes: input.notes.trim(),
          };
          const query = input.id
            ? db().from("gs_servers").update(row).eq("id", input.id)
            : db().from("gs_servers").insert(row);
          raise((await query).error);
        }),
      deleteServer: (id) => run(async () => raise((await db().from("gs_servers").delete().eq("id", id)).error), "Painel removido"),
      saveProduct: (input) =>
        run(async () => {
          if (!user) return;
          const row = { owner_id: user.id, name: input.name.trim(), server_id: input.server_id, active: input.active };
          const query = input.id
            ? db().from("gs_products").update(row).eq("id", input.id)
            : db().from("gs_products").insert(row);
          raise((await query).error);
        }),
      deleteProduct: (id) => run(async () => raise((await db().from("gs_products").delete().eq("id", id)).error), "Produto removido"),
      savePlan: (input) =>
        run(async () => {
          if (!user) return;
          const row = {
            owner_id: user.id,
            product_id: input.product_id,
            name: input.name.trim(),
            price: input.price || 0,
            currency: input.currency,
            duration_months: input.duration_months || 1,
            description: input.description.trim(),
            active: input.active,
          };
          const query = input.id ? db().from("gs_plans").update(row).eq("id", input.id) : db().from("gs_plans").insert(row);
          raise((await query).error);
        }),
      deletePlan: (id) => run(async () => raise((await db().from("gs_plans").delete().eq("id", id)).error), "Plano removido"),
      saveApp: (input) =>
        run(async () => {
          if (!user) return;
          const row = {
            owner_id: user.id,
            name: input.name.trim(),
            activation_price: input.activation_price || 0,
            currency: input.currency,
            description: input.description.trim(),
            active: input.active,
          };
          const query = input.id ? db().from("gs_apps").update(row).eq("id", input.id) : db().from("gs_apps").insert(row);
          raise((await query).error);
        }),
      deleteApp: (id) => run(async () => raise((await db().from("gs_apps").delete().eq("id", id)).error), "Aplicativo removido"),
      saveTemplate: (input) =>
        run(async () => {
          if (!user) return;
          const row = { owner_id: user.id, name: input.name.trim(), body: input.body, purpose: input.purpose };
          const query = input.id
            ? db().from("gs_templates").update(row).eq("id", input.id)
            : db().from("gs_templates").insert(row);
          raise((await query).error);
        }),
      deleteTemplate: (id) =>
        run(async () => raise((await db().from("gs_templates").delete().eq("id", id)).error), "Template removido"),
      saveSession: (input) =>
        run(async () => {
          if (!user) return;
          const row = { owner_id: user.id, name: input.name.trim(), phone: input.phone.trim(), status: input.status };
          const query = input.id
            ? db().from("gs_whatsapp_sessions").update(row).eq("id", input.id)
            : db().from("gs_whatsapp_sessions").insert(row);
          raise((await query).error);
        }),
      deleteSession: (id) =>
        run(async () => raise((await db().from("gs_whatsapp_sessions").delete().eq("id", id)).error), "Sessão removida"),
      saveRule: (input) =>
        run(async () => {
          if (!user) return;
          const template = input.offset_days > 0 ? "apos_vencimento" : input.offset_days < 0 ? "prestes_a_vencer" : "vence_hoje";
          const row = {
            owner_id: user.id,
            template,
            weekdays: input.weekdays,
            send_time: input.send_time || "09:00",
            offset_days: Math.max(-60, Math.min(90, input.offset_days)),
            active: input.active,
          };
          const query = input.id
            ? db().from("gs_billing_rules").update(row).eq("id", input.id)
            : db().from("gs_billing_rules").insert(row);
          raise((await query).error);
        }),
      deleteRule: (id) => run(async () => raise((await db().from("gs_billing_rules").delete().eq("id", id)).error), "Lembrete removido"),
      createDefaultRules: () =>
        run(async () => {
          if (!user) return;
          const presets = [10, 5, 2, 0, -1, -3, -5];
          const rows = presets.map((offset) => ({
            owner_id: user.id,
            template: offset > 0 ? "apos_vencimento" : offset < 0 ? "prestes_a_vencer" : "vence_hoje",
            weekdays: [1, 2, 3, 4, 5, 6],
            send_time: "09:00",
            offset_days: offset,
            active: true,
          }));
          raise((await db().from("gs_billing_rules").insert(rows)).error);
        }, "Lembretes criados"),
      saveClient: (input, id) =>
        run(async () => {
          if (!user) return;
          if (!input.name.trim()) throw new Error("Informe o nome do cliente");
          if (id && Number(input.referrer_id) === id) throw new Error("O cliente não pode indicar a si mesmo");
          const row = payload(input, user.id);
          if (!id) {
            const inserted = await db().from("gs_clients").insert(row).select("*").single();
            raise(inserted.error);
            const created = mapClient(inserted.data as Row);
            if (created.invoice_status === "pago") await book(created, "novo_cliente");
            return;
          }
          const previous = snap.current.clients.find((item) => item.id === id);
          const updated = await db().from("gs_clients").update(row).eq("id", id).select("*").single();
          raise(updated.error);
          const saved = mapClient(updated.data as Row);
          const hadIncome = snap.current.transactions.some((item) => item.client_id === id && item.direction === "entrada");
          if (previous && previous.invoice_status !== "pago" && saved.invoice_status === "pago") {
            await book(saved, hadIncome ? "renovacao" : "novo_cliente");
          }
        }, id ? "Cliente atualizado" : "Cliente criado"),
      archiveClients: (ids, archived) =>
        run(
          async () => raise((await db().from("gs_clients").update({ archived }).in("id", ids)).error),
          archived ? "Cliente arquivado" : "Cliente restaurado",
        ),
      deleteClients: (ids) =>
        run(async () => raise((await db().from("gs_clients").delete().in("id", ids)).error), "Cliente excluído"),
      renewClient: async (id, opts) => {
        const current = snap.current.clients.find((item) => item.id === id);
        if (!current || !user) throw new Error("Cliente não encontrado");
        const chosen = snap.current.plans.find((item) => item.id === (opts.planId ?? current.plan_id));
        const due = nextDue(current.due_date, chosen?.duration_months ?? 1, current.fixed_due, opts.due || undefined);
        const planPatch =
          chosen && chosen.id !== current.plan_id
            ? {
                plan_id: chosen.id,
                price: chosen.price,
                currency: chosen.currency,
                ...(chosen.product_id ? { product_id: chosen.product_id } : {}),
              }
            : {};
        setSaving(true);
        try {
          const updated = await db()
            .from("gs_clients")
            .update({
              due_date: due,
              invoice_status: opts.invoice,
              kind: "cliente",
              non_renewal_reason: null,
              non_renewal_note: null,
              non_renewed_at: null,
              ...planPatch,
            })
            .eq("id", id)
            .select("*")
            .single();
          raise(updated.error);
          const saved = mapClient(updated.data as Row);
          if (opts.invoice === "pago") await book(saved, "renovacao");
          await refresh();
          toast.success("Cliente renovado");
          return saved;
        } catch (reason) {
          toast.error(reason instanceof Error ? reason.message : "Falha ao renovar");
          throw reason;
        } finally {
          setSaving(false);
        }
      },
      receiveClient: (id) =>
        run(async () => {
          const current = snap.current.clients.find((item) => item.id === id);
          if (!current) return;
          if (current.invoice_status === "pago") return;
          const updated = await db().from("gs_clients").update({ invoice_status: "pago" }).eq("id", id).select("*").single();
          raise(updated.error);
          const saved = mapClient(updated.data as Row);
          const hadIncome = snap.current.transactions.some((item) => item.client_id === id && item.direction === "entrada");
          await book(saved, hadIncome ? "renovacao" : "novo_cliente");
        }, "Pagamento lançado"),
      addTransaction: (input) =>
        run(async () => {
          if (!user) return;
          if (input.amount <= 0) throw new Error("Informe um valor maior que zero");
          raise(
            (
              await db().from("gs_transactions").insert({
                owner_id: user.id,
                client_id: input.client_id ?? null,
                server_id: input.server_id ?? null,
                direction: input.direction,
                category: "manual",
                amount: input.amount,
                currency: input.currency,
                description: input.description.trim() || "Lançamento manual",
                occurred_at: new Date(`${input.occurred_at}T12:00:00`).toISOString(),
              })
            ).error,
          );
        }, "Lançamento criado"),
      deleteTransactions: (ids) =>
        run(async () => raise((await db().from("gs_transactions").delete().in("id", ids)).error), "Lançamentos excluídos"),
      applyAutoArchive: async () => {
        if (!settings) return 0;
        const limit = addDays(todayISO(), -Math.max(0, settings.auto_archive_days));
        const ids = snap.current.clients
          .filter((item) => !item.archived && item.due_date && item.due_date <= limit)
          .map((item) => item.id);
        if (ids.length === 0) {
          toast.success("Nenhum cliente para arquivar");
          return 0;
        }
        await run(async () => raise((await db().from("gs_clients").update({ archived: true }).in("id", ids)).error), `${ids.length} cliente(s) arquivado(s)`);
        return ids.length;
      },
      seedDemo: () =>
        run(async () => {
          if (!user) return;
          if (snap.current.clients.length > 0) throw new Error("Já existem clientes nesta conta");
          const today = new Date();
          const stamp = (day: number, hour = 12) =>
            new Date(today.getFullYear(), today.getMonth(), day, hour).toISOString();
          const day = (offset: number) => {
            const date = new Date(today);
            date.setDate(today.getDate() + offset);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          };
          const serverIns = await db()
            .from("gs_servers")
            .insert({
              owner_id: user.id,
              name: "AZONIX",
              url: "https://painel.exemplo.com",
              username: "admin",
              password: "",
              auto_renew: true,
              renewal_cost: 8,
              cost_currency: "BRL",
              credits: 40,
              status: "ativo",
              notes: "Custo debitado a cada renovação paga",
            })
            .select("*")
            .single();
          raise(serverIns.error);
          const server = mapServer(serverIns.data as Row);
          const productIns = await db()
            .from("gs_products")
            .insert({ owner_id: user.id, name: "Azonix mensal", server_id: server.id, active: true })
            .select("*")
            .single();
          raise(productIns.error);
          const product = mapProduct(productIns.data as Row);
          const planIns = await db()
            .from("gs_plans")
            .insert([
              {
                owner_id: user.id,
                product_id: product.id,
                name: "Mensal",
                price: 30,
                currency: "BRL",
                duration_months: 1,
                description: "1 mês",
                active: true,
              },
              {
                owner_id: user.id,
                product_id: product.id,
                name: "Mensal Europa",
                price: 8,
                currency: "EUR",
                duration_months: 1,
                description: "1 mês em euro",
                active: true,
              },
            ])
            .select("*");
          raise(planIns.error);
          const planRows = ((planIns.data ?? []) as Row[]).map(mapPlan);
          const brl = planRows.find((item) => item.currency === "BRL") ?? planRows[0];
          const eur = planRows.find((item) => item.currency === "EUR") ?? planRows[0];
          if (!brl || !eur) throw new Error("Não foi possível criar os planos de exemplo");
          const appIns = await db()
            .from("gs_apps")
            .insert({
              owner_id: user.id,
              name: "FUN PLAY",
              activation_price: 11,
              currency: "BRL",
              description: "Ativação do aplicativo",
              active: true,
            })
            .select("*")
            .single();
          raise(appIns.error);
          const app = mapApp(appIns.data as Row);
          const people: [string, string, Plan, number, string][] = [
            ["Ana Souza", "SC", brl, 2, "5547991111111"],
            ["Carlos Lima", "SP", brl, -3, "5511988882222"],
            ["Marina Dias", "RJ", brl, 0, "5521977773333"],
            ["Pedro Alves", "PR", brl, 6, "5541988884444"],
            ["Julia Nunes", "RS", eur, 20, "5551999995555"],
            ["Lucas Ferreira", "MG", brl, 12, "5531988886666"],
          ];
          const clientRows = people.map(([name, state, plan, dueOffset, phone], index) => ({
            owner_id: user.id,
            name,
            whatsapp: phone,
            username: name.split(" ")[0].toLowerCase() + "01",
            password: "acesso" + (index + 1),
            product_id: product.id,
            plan_id: plan.id,
            server_id: server.id,
            due_date: day(dueOffset),
            invoice_status: dueOffset < 0 ? "pendente" : "pago",
            currency: plan.currency,
            price: plan.price,
            state,
            kind: "cliente",
            reminders_enabled: true,
            app_id: index === 0 ? app.id : null,
            screens: 1,
            created_at: stamp(Math.max(1, today.getDate() - (index + 1) * 2)),
          }));
          clientRows.push({
            owner_id: user.id,
            name: "Teste Loja",
            whatsapp: "5547988887777",
            username: "teste01",
            password: "teste",
            product_id: product.id,
            plan_id: brl.id,
            server_id: server.id,
            due_date: day(3),
            invoice_status: "pendente",
            currency: "BRL",
            price: 0,
            state: "SC",
            kind: "teste",
            reminders_enabled: false,
            app_id: null,
            screens: 1,
            created_at: stamp(Math.max(1, today.getDate())),
          });
          const insertedClients = await db().from("gs_clients").insert(clientRows).select("*");
          raise(insertedClients.error);
          const createdClients = ((insertedClients.data ?? []) as Row[]).map(mapClient);
          const txRows = createdClients
            .filter((item) => item.invoice_status === "pago")
            .flatMap((item) => {
              const occurred = item.created_at || stamp(today.getDate());
              const list: Record<string, unknown>[] = [
                {
                  owner_id: user.id,
                  client_id: item.id,
                  server_id: server.id,
                  plan_id: item.plan_id,
                  product_id: product.id,
                  direction: "entrada",
                  category: "novo_cliente",
                  amount: item.price,
                  currency: item.currency,
                  description: `Novo cliente · ${item.name}`,
                  occurred_at: occurred,
                },
                {
                  owner_id: user.id,
                  client_id: item.id,
                  server_id: server.id,
                  direction: "saida",
                  category: "custo_servidor",
                  amount: 8,
                  currency: "BRL",
                  description: "Custo de renovação · AZONIX",
                  occurred_at: occurred,
                },
              ];
              return list;
            });
          if (txRows.length) raise((await db().from("gs_transactions").insert(txRows)).error);
          const rulesIns = [10, 5, 2, 0, -1, -3, -5].map((offset) => ({
            owner_id: user.id,
            template: offset > 0 ? "apos_vencimento" : offset < 0 ? "prestes_a_vencer" : "vence_hoje",
            weekdays: [1, 2, 3, 4, 5, 6],
            send_time: "09:00",
            offset_days: offset,
            active: true,
          }));
          raise((await db().from("gs_billing_rules").insert(rulesIns)).error);
          await db()
            .from("gs_servers")
            .update({ credits: 40 - createdClients.filter((item) => item.invoice_status === "pago").length })
            .eq("id", server.id);
        }, "Exemplo carregado"),
    };
  }, [
    loading,
    saving,
    error,
    unlocked,
    settings,
    servers,
    products,
    plans,
    apps,
    templates,
    sessions,
    lines,
    rules,
    clients,
    transactions,
    refresh,
    run,
    user,
    payload,
    book,
    toast,
  ]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useApp fora do painel");
  return value;
}

export { monthKey };
