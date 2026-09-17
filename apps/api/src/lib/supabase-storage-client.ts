const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

export interface UploadFileResult {
  storageKey: string;
}

export const supabaseStorageClient = {
  async uploadFile(input: {
    buffer: Buffer;
    storageKey: string;
    mimeType: string;
  }): Promise<UploadFileResult> {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${input.storageKey}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": input.mimeType,
        },
        body: new Uint8Array(input.buffer),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase Storage upload failed (${res.status}): ${body}`);
    }

    return { storageKey: input.storageKey };
  },

  async getSignedDownloadUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/${SUPABASE_STORAGE_BUCKET}/${storageKey}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase Storage sign failed (${res.status}): ${body}`);
    }

    const json = await res.json();
    // Supabase returns a relative path like "/object/sign/...&token=..." —
    // prefix with the storage host to make it a directly usable URL.
    return `${SUPABASE_URL}/storage/v1${json.signedURL}`;
  },

  async deleteFile(storageKey: string): Promise<void> {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${storageKey}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase Storage delete failed (${res.status}): ${body}`);
    }
  },
};
