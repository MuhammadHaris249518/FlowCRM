import { AppError } from "../../errors/app-error";
import type { AuthContext } from "../../middleware/auth";
import { supabaseStorageClient } from "../../lib/supabase-storage-client";
import { documentsRepository } from "./documents.repository";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "./documents.validation";
import type { DocumentDTO } from "./documents.types";

function toDTO(doc: {
  id: string; fileName: string; fileSize: number; mimeType: string;
  contactId: string | null; leadId: string | null; dealId: string | null;
  uploadedBy: { fullName: string } | null; createdAt: Date;
}): DocumentDTO {
  return {
    id: doc.id,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    contactId: doc.contactId,
    leadId: doc.leadId,
    dealId: doc.dealId,
    uploadedByName: doc.uploadedBy?.fullName ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const documentsService = {
  async list(auth: AuthContext, filter: { contactId?: string; leadId?: string; dealId?: string; libraryOnly?: boolean }): Promise<DocumentDTO[]> {
    const docs = await documentsRepository.list(auth, filter);
    return docs.map(toDTO);
  },

  async upload(
    auth: AuthContext,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    links: { contactId: string | null; leadId: string | null; dealId: string | null }
  ): Promise<DocumentDTO> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw AppError.badRequest("File exceeds the 25MB limit", "FILE_TOO_LARGE");
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw AppError.badRequest(`Unsupported file type: ${file.mimetype}`, "UNSUPPORTED_FILE_TYPE");
    }

    const storageKey = `${auth.organizationId}/${Date.now()}-${file.originalname}`;
    await supabaseStorageClient.uploadFile({
      buffer: file.buffer,
      storageKey,
      mimeType: file.mimetype,
    });

    const doc = await documentsRepository.create({
      organizationId: auth.organizationId,
      contactId: links.contactId,
      leadId: links.leadId,
      dealId: links.dealId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageKey,
      uploadedById: auth.userId,
    });

    return toDTO(doc);
  },

  async getDownloadUrl(auth: AuthContext, id: string): Promise<string> {
    const doc = await documentsRepository.findById(auth, id);
    if (!doc) throw AppError.notFound("Document not found");
    return supabaseStorageClient.getSignedDownloadUrl(doc.storageKey);
  },

  async delete(auth: AuthContext, id: string): Promise<void> {
    const doc = await documentsRepository.findById(auth, id);
    if (!doc) throw AppError.notFound("Document not found");
    await supabaseStorageClient.deleteFile(doc.storageKey);
    await documentsRepository.delete(id);
  },
};
