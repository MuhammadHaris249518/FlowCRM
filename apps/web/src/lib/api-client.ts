const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// Every authenticated call needs a fresh Clerk token (they're short-lived)
// and the active organization id — bundled here so hooks don't repeat it.
export interface RequestContext {
  getToken: () => Promise<string | null>;
  organizationId?: string | null;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  ctx: RequestContext,
  options?: { params?: Record<string, string>; body?: unknown }
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const token = await ctx.getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (ctx.organizationId) headers["X-Organization-Id"] = ctx.organizationId;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  const body: ApiEnvelope<T> = await res.json();

  if (!res.ok || !body.success || body.data === undefined) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? "Something went wrong. Please try again.",
      res.status
    );
  }

  return body.data;
}

export const apiClient = {
  get: <T>(path: string, ctx: RequestContext, params?: Record<string, string>) =>
    request<T>("GET", path, ctx, { params }),
  post: <T>(path: string, ctx: RequestContext, body?: unknown) =>
    request<T>("POST", path, ctx, { body }),
  patch: <T>(path: string, ctx: RequestContext, body?: unknown) =>
    request<T>("PATCH", path, ctx, { body }),
  delete: <T>(path: string, ctx: RequestContext) => request<T>("DELETE", path, ctx),
};