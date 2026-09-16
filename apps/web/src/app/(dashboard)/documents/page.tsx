"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { useApiContext } from "@/features/auth/hooks/use-api-context";
import { documentsApi } from "@/features/documents/api/documents-api";

export default function DocumentsPage() {
  const ctx = useApiContext();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const docs = useQuery({
    queryKey: ["documents", "library", ctx.organizationId],
    queryFn: () => documentsApi.listLibrary(ctx),
    enabled: Boolean(ctx.organizationId),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await documentsApi.upload(ctx, file);
      queryClient.invalidateQueries({ queryKey: ["documents", "library"] });
      e.target.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Topbar title="Document Library" />
      <main className="space-y-6 p-6 sm:p-8">
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <label className="inline-block cursor-pointer rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            {uploading ? "Uploading..." : "Upload document"}
            <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
          {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          <p className="mt-2 text-xs text-ink-500">
            Reusable documents (pricing sheets, templates) not tied to a
            specific lead — attach them to AI-drafted emails from a
            workflow&apos;s configuration.
          </p>
        </div>

        {docs.isPending && <div className="text-sm text-ink-500">Loading...</div>}
        {docs.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Failed to load documents. Please retry.
          </div>
        )}
        {docs.data && docs.data.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-ink-500 shadow-card">
            No library documents yet. Upload a document above to get started.
          </div>
        )}
        {docs.data && docs.data.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <ul className="divide-y divide-surface-border">
              {docs.data.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium text-ink-900">{doc.fileName}</span>
                  <span className="text-xs text-ink-500">
                    {Math.round(doc.fileSize / 1024)} KB · {doc.uploadedByName ?? "Unknown"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
