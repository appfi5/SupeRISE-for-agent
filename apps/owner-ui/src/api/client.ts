import type { ApiResponse } from "@superise/app-contracts";
import { clearOwnerAccessToken, getOwnerAccessToken } from "./owner-auth-token";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const accessToken = getOwnerAccessToken();
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const payload = await parseApiResponse<T>(response);
  if (!payload) {
    if (!response.ok) {
      if (response.status === 401) {
        clearOwnerAccessToken();
      }

      throw new ApiError(response.statusText || "Request failed", response.status);
    }

    return undefined as T;
  }

  if (!response.ok || !payload.success) {
    if (response.status === 401) {
      clearOwnerAccessToken();
    }

    throw new ApiError(
      payload?.error?.message ?? (response.statusText || "Request failed"),
      response.status,
    );
  }

  return payload.data;
}

async function parseApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T> | undefined> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return undefined;
  }

  if (!contentType.includes("application/json")) {
    if (!response.ok) {
      throw new ApiError(rawBody.trim() || response.statusText || "Request failed", response.status);
    }

    throw new ApiError("Server returned a non-JSON response", response.status);
  }

  try {
    return JSON.parse(rawBody) as ApiResponse<T>;
  } catch {
    throw new ApiError("Server returned invalid JSON", response.status);
  }
}
