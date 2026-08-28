const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

export interface SendEmailResult {
  externalId: string | null;
}

export const resendClient = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Resend's error payload has a "message" field, similar shape to Twilio's.
      throw new Error(`Resend send failed (${res.status}): ${json.message ?? res.statusText}`);
    }

    // Unlike SendGrid (message ID in a response header), Resend returns it
    // directly in the JSON body as "id".
    return { externalId: json.id ?? null };
  },
};
