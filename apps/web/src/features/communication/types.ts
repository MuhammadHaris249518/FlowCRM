export type MessageChannel = "EMAIL";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MessageStatus =
  | "DRAFT"
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "RECEIVED";

export interface Message {
  id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  status: MessageStatus;
  subject: string | null;
  body: string;
  fromAddress: string | null;
  toAddress: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}
