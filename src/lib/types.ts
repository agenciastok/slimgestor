export type Currency = "BRL" | "EUR";

export type ClientStatus = "ativo" | "vencido" | "teste" | "arquivado";

export type InvoiceStatus = "pago" | "pendente";

export type ClientKind = "cliente" | "teste";

export type TxDirection = "entrada" | "saida";

export type TxCategory =
  | "novo_cliente"
  | "renovacao"
  | "custo_servidor"
  | "manual"
  | "ativacao_app";

export type BillingTemplate =
  | "apos_vencimento"
  | "vence_hoje"
  | "prestes_a_vencer";

export type Settings = {
  owner_id: string;
  display_name: string;
  phone: string;
  preferred_currency: Currency;
  eur_to_brl: number;
  finance_pin_hash: string | null;
  auto_archive_days: number;
  access_expires_at: string | null;
};

export type ServerPanel = {
  id: number;
  name: string;
  url: string;
  username: string;
  password: string;
  auto_renew: boolean;
  renewal_cost: number;
  cost_currency: Currency;
  credits: number;
  status: "ativo" | "inativo";
  notes: string;
};

export type Product = {
  id: number;
  name: string;
  server_id: number | null;
  active: boolean;
};

export type Plan = {
  id: number;
  product_id: number | null;
  name: string;
  price: number;
  currency: Currency;
  duration_months: number;
  description: string;
  active: boolean;
};

export type AppItem = {
  id: number;
  name: string;
  activation_price: number;
  currency: Currency;
  description: string;
  active: boolean;
};

export type Template = {
  id: number;
  name: string;
  body: string;
  purpose: "cobranca" | "boas_vindas" | "renovacao";
};

export type WaSession = {
  id: number;
  name: string;
  phone: string;
  status: "conectado" | "desconectado";
};

export type ExtraApp = { app_id: string; mac: string; key: string };
export type ExtraAccess = { username: string; password: string; notes: string };

export type Client = {
  id: number;
  name: string;
  whatsapp: string;
  line: string;
  email: string;
  document: string;
  birthday: string | null;
  username: string;
  password: string;
  billing_session_id: number | null;
  welcome_template_id: number | null;
  reminders_enabled: boolean;
  heard_from: string;
  referrer_id: number | null;
  notes: string;
  product_id: number | null;
  plan_id: number | null;
  server_id: number | null;
  screens: number;
  due_date: string | null;
  fixed_due: boolean;
  invoice_status: InvoiceStatus;
  kind: ClientKind;
  archived: boolean;
  non_renewal_reason: string;
  non_renewal_note: string;
  non_renewed_at: string | null;
  discount: number;
  discount_until: string | null;
  discount_always: boolean;
  currency: Currency;
  price: number;
  app_id: number | null;
  app_due: string | null;
  device: string;
  mac_or_email: string;
  app_key: string;
  extra_apps: ExtraApp[];
  extra_accesses: ExtraAccess[];
  state: string;
  created_at: string;
};

export type ClientInput = {
  name: string;
  whatsapp: string;
  line: string;
  email: string;
  document: string;
  birthday: string;
  username: string;
  password: string;
  billing_session_id: string;
  welcome_template_id: string;
  reminders_enabled: boolean;
  heard_from: string;
  referrer_id: string;
  notes: string;
  product_id: string;
  plan_id: string;
  server_id: string;
  screens: number;
  due_date: string;
  fixed_due: boolean;
  invoice_status: InvoiceStatus;
  kind: ClientKind;
  non_renewal_reason: string;
  non_renewal_note: string;
  non_renewed_at: string;
  discount: number;
  discount_until: string;
  discount_always: boolean;
  currency: Currency;
  price: number;
  app_id: string;
  app_due: string;
  device: string;
  mac_or_email: string;
  app_key: string;
  extra_apps: ExtraApp[];
  extra_accesses: ExtraAccess[];
  state: string;
};

export type Transaction = {
  id: number;
  client_id: number | null;
  server_id: number | null;
  plan_id: number | null;
  product_id: number | null;
  direction: TxDirection;
  category: TxCategory;
  amount: number;
  currency: Currency;
  description: string;
  occurred_at: string;
};

export type BillingRule = {
  id: number;
  template: BillingTemplate;
  weekdays: number[];
  send_time: string;
  offset_days: number;
  active: boolean;
};

export function emptyClient(kind: ClientKind = "cliente"): ClientInput {
  return {
    name: "",
    whatsapp: "",
    line: "",
    email: "",
    document: "",
    birthday: "",
    username: "",
    password: "",
    billing_session_id: "",
    welcome_template_id: "",
    reminders_enabled: true,
    heard_from: "",
    referrer_id: "",
    notes: "",
    product_id: "",
    plan_id: "",
    server_id: "",
    screens: 1,
    due_date: "",
    fixed_due: false,
    invoice_status: "pago",
    kind,
    non_renewal_reason: "",
    non_renewal_note: "",
    non_renewed_at: "",
    discount: 0,
    discount_until: "",
    discount_always: false,
    currency: "BRL",
    price: 0,
    app_id: "",
    app_due: "",
    device: "",
    mac_or_email: "",
    app_key: "",
    extra_apps: [],
    extra_accesses: [],
    state: "",
  };
}

export function clientToInput(c: Client): ClientInput {
  return {
    name: c.name,
    whatsapp: c.whatsapp,
    line: c.line,
    email: c.email,
    document: c.document,
    birthday: c.birthday ?? "",
    username: c.username,
    password: c.password,
    billing_session_id: c.billing_session_id ? String(c.billing_session_id) : "",
    welcome_template_id: c.welcome_template_id ? String(c.welcome_template_id) : "",
    reminders_enabled: c.reminders_enabled,
    heard_from: c.heard_from,
    referrer_id: c.referrer_id ? String(c.referrer_id) : "",
    notes: c.notes,
    product_id: c.product_id ? String(c.product_id) : "",
    plan_id: c.plan_id ? String(c.plan_id) : "",
    server_id: c.server_id ? String(c.server_id) : "",
    screens: c.screens,
    due_date: c.due_date ?? "",
    fixed_due: c.fixed_due,
    invoice_status: c.invoice_status,
    kind: c.kind,
    non_renewal_reason: c.non_renewal_reason,
    non_renewal_note: c.non_renewal_note,
    non_renewed_at: c.non_renewed_at ?? "",
    discount: c.discount,
    discount_until: c.discount_until ?? "",
    discount_always: c.discount_always,
    currency: c.currency,
    price: c.price,
    app_id: c.app_id ? String(c.app_id) : "",
    app_due: c.app_due ?? "",
    device: c.device,
    mac_or_email: c.mac_or_email,
    app_key: c.app_key,
    extra_apps: c.extra_apps,
    extra_accesses: c.extra_accesses,
    state: c.state,
  };
}
