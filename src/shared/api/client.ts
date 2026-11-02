const BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || "/api/v1").replace(
  /\/+$/,
  "",
);
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public traceId?: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}
let csrf: Promise<string> | undefined;
export function resetCsrf() {
  csrf = undefined;
}
async function csrfToken(): Promise<string> {
  csrf ??= fetch(`${BASE}/auth/csrf`, {
    credentials: "include",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      if (!response.ok)
        throw new ApiError(
          response.status,
          "Unable to establish a secure connection.",
        );
      return (await response.json()).token as string;
    })
    .catch((error) => {
      csrf = undefined;
      throw error;
    });
  return csrf;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method))
    headers.set("X-CSRF-TOKEN", await csrfToken());
  headers.set("X-Correlation-ID", crypto.randomUUID());
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(30000);
    response = await fetch(`${BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
      signal: options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      0,
      "The server could not be reached. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const message = problem.errors
      ? Object.values(problem.errors as Record<string, string[]>)
          .flat()
          .join(" ")
      : problem.title;
    throw new ApiError(
      response.status,
      message ??
        (response.status === 401
          ? "Your session has expired. Please sign in."
          : "The request could not be completed."),
      problem.traceId,
      problem.errors,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export function jsonBody(value: unknown) {
  return JSON.stringify(value);
}
export function params(
  values: Record<string, string | number | boolean | undefined | null>,
) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      query.set(key, String(value));
  });
  return query.size ? `?${query}` : "";
}
export async function download(path: string, name: string) {
  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.title ?? "The download failed.");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: name,
  });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
