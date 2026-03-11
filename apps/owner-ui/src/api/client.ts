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

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    if (response.status === 401) {
      clearOwnerAccessToken();
    }

    throw new ApiError(payload.error?.message ?? "Request failed", response.status);
  }

  return payload.data;
}
