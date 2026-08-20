const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? "";
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

export interface SendEmailResult {
  // SendGrid returns the message ID in a response header, not the body —
  // this correlates outbound sends with inbound delivery-event webhooks.
  externalId: string | null;
}

export const sendgridClient = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: SENDGRID_FROM_EMAIL },
        subject: input.subject,
        content: [{ type: "text/plain", value: input.text }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`SendGrid send failed (${res.status}): ${body}`);
    }

    return { externalId: res.headers.get("x-message-id") };
  },
};
