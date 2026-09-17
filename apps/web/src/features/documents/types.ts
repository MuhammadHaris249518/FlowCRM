export interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedByName: string | null;
  createdAt: string;
}
