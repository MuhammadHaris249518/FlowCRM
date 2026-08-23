const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? "";

export interface SendSmsInput {
  to: string; // E.164 format, e.g. +14155551234
  body: string;
}

export interface SendSmsResult {
  externalId: string | null; // Twilio's message SID
}

export const twilioClient = {
  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const basicAuth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.to,
        From: TWILIO_FROM_NUMBER,
        Body: input.body,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      // Twilio's error payload has a human-readable "message" field —
      // surface it instead of a generic HTTP status.
      throw new Error(`Twilio send failed: ${json.message ?? res.statusText}`);
    }

    return { externalId: json.sid ?? null };
  },
};

// SMS-length messages are usually already digits-only or loosely formatted
// (e.g. "0300-1234567" from a CRM contact field) — Twilio requires strict
// E.164. This is a minimal best-effort formatter, not a full phone-number
// validation library. If your contacts are mostly Pakistani numbers,
// adjust the default country code below; this is a placeholder assumption,
// not a researched one — confirm with real contact data before relying on it.
const DEFAULT_COUNTRY_CODE = "+92";

export function toE164(rawPhone: string): string | null {
  const digitsOnly = rawPhone.replace(/[^\d+]/g, "");
  if (digitsOnly.startsWith("+")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return DEFAULT_COUNTRY_CODE + digitsOnly.slice(1);
  if (digitsOnly.length > 0) return DEFAULT_COUNTRY_CODE + digitsOnly;
  return null;
}
