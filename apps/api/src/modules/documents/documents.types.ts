export interface DocumentDTO {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  contactId: string | null;
  leadId: string | null;
  dealId: string | null;
  uploadedByName: string | null;
  createdAt: string;
}
