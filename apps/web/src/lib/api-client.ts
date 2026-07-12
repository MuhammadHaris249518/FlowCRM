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

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    // TODO: inject Clerk session token once auth module lands
    // Authorization: `Bearer ${await getToken()}`,
    // TODO: inject X-Organization-Id from an org-context provider once the
    // org-switcher UI exists — every CRM endpoint requires it (see auth.ts).
  };
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  // DELETE returns 204 with no body — nothing to parse.
  if (res.status === 204) return undefined as T;

  const body: ApiEnvelope<T> = await res.json();

  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? "Something went wrong. Please try again.",
      res.status
    );
  }

  return body.data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const res = await fetch(url.toString(), {
    headers: buildHeaders(),
    credentials: "include",
  });

  return parseEnvelope<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseEnvelope<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseEnvelope<T>(res);
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: buildHeaders(),
    credentials: "include",
  });

  await parseEnvelope<void>(res);
}

// ============================================================================
// Legacy context-based client (used by auth and dashboard modules)
// ============================================================================

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

  return parseEnvelope<T>(res);
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