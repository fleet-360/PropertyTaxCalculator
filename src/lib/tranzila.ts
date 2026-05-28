const HANDSHAKE_URL = 'https://secure5.tranzila.com/cgi-bin/tranzila71dtls.cgi';
const DIRECT_BASE = 'https://direct.tranzila.com';

/** Public base URL for Tranzila callbacks (no trailing slash). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  return 'http://localhost:3005';
}

export interface TranzilaIframeParams {
  orderId: string;
  amountNis: number;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
}

export function isTranzilaConfigured(): boolean {
  return Boolean(
    process.env.TRANZILA_TERMINAL?.trim() && process.env.TRANZILA_TERMINAL_PASSWORD?.trim(),
  );
}

function getTerminal(): string {
  const terminal = process.env.TRANZILA_TERMINAL?.trim();
  if (!terminal) throw new Error('TRANZILA_TERMINAL is not configured');
  return terminal;
}

function getTerminalPassword(): string {
  const pw = process.env.TRANZILA_TERMINAL_PASSWORD?.trim();
  if (!pw) throw new Error('TRANZILA_TERMINAL_PASSWORD is not configured');
  return pw;
}

/** Parse handshake response body for thtk token. */
function parseHandshakeToken(body: string): string | null {
  const trimmed = body.trim();
  const match =
    trimmed.match(/thtk=([^\s&]+)/i) ||
    trimmed.match(/^([a-f0-9]{20,})$/i);
  return match ? match[1] : null;
}

async function requestHandshakeToken(amountNis: number): Promise<string> {
  const terminal = getTerminal();
  const password = getTerminalPassword();
  const params = new URLSearchParams({
    supplier: terminal,
    TranzilaPW: password,
    sum: amountNis.toFixed(2),
    currency: '1',
    cred_type: '1',
    tranmode: 'VK',
  });

  const res = await fetch(HANDSHAKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Tranzila handshake HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const token = parseHandshakeToken(text);
  if (!token) {
    throw new Error(`Tranzila handshake failed: ${text.slice(0, 200)}`);
  }
  return token;
}

/** Build hosted iframe URL after server-side handshake. */
export async function buildTranzilaIframeUrl(params: TranzilaIframeParams): Promise<string> {
  const terminal = getTerminal();
  const siteUrl = getSiteUrl();
  const thtk = await requestHandshakeToken(params.amountNis);

  const query = new URLSearchParams({
    thtk,
    sum: params.amountNis.toFixed(2),
    currency: '1',
    cred_type: '1',
    tranmode: 'VK',
    myid: params.orderId,
    success_url_address: `${siteUrl}/calculator/payment/success?orderId=${encodeURIComponent(params.orderId)}`,
    fail_url_address: `${siteUrl}/calculator/payment/fail?orderId=${encodeURIComponent(params.orderId)}`,
    notify_url_address: `${siteUrl}/api/payments/tranzila/notify`,
  });

  if (params.payerName) query.set('contact', params.payerName.slice(0, 80));
  if (params.payerEmail) query.set('email', params.payerEmail.slice(0, 80));
  if (params.payerPhone) query.set('phone', params.payerPhone.replace(/\D/g, '').slice(0, 20));

  return `${DIRECT_BASE}/${terminal}/iframenew.php?${query.toString()}`;
}

export type TranzilaNotifyFields = Record<string, string>;

/** Normalize Tranzila server notify body (form or query). */
export function parseTranzilaNotifyFields(
  input: URLSearchParams | FormData,
): TranzilaNotifyFields {
  const out: TranzilaNotifyFields = {};
  input.forEach((value, key) => {
    out[key] = String(value);
  });
  return out;
}

/** Tranzila success response code (000 / 0000 variants). */
export function isTranzilaSuccessResponse(fields: TranzilaNotifyFields): boolean {
  console.log("isTranzilaSuccessResponse - fields", fields);
  const response = (fields.Response ?? fields.response ?? '').trim();
  return response === '000' || response === '0000' || response === '0';
}

export function getNotifyOrderId(fields: TranzilaNotifyFields): string | null {
  return (
    fields.myid?.trim() ||
    fields.MyId?.trim() ||
    fields.orderId?.trim() ||
    null
  );
}

export function getNotifyTransactionId(fields: TranzilaNotifyFields): string | undefined {
  const id = fields.index ?? fields.Index ?? fields.transaction_id;
  return id?.trim() || undefined;
}
