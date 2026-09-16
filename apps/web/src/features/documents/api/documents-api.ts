import { apiClient, type RequestContext } from "@/lib/api-client";
import type { Document } from "../types";

export const documentsApi = {
  listLibrary: (ctx: RequestContext) =>
    apiClient.get<Document[]>("/documents", ctx, { library: "true" }),

  upload: async (ctx: RequestContext, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postFormData<Document>("/documents", ctx, formData);
  },
};
