export interface MessageDTO {
  id: string;
  channel: string;
  direction: string;
  status: string;
  subject: string | null;
  body: string;
  fromAddress: string | null;
  toAddress: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}
