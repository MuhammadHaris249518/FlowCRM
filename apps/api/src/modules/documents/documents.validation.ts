import { z } from "zod";

export const listDocumentsQuerySchema = z.object({
  contactId: z.string().optional(),
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  library: z.coerce.boolean().optional(),
});

// A generous but real ceiling — prevents someone accidentally uploading a
// multi-gigabyte file meant for something else entirely.
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
