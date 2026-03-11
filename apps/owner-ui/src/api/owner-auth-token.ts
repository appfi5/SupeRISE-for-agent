const OWNER_ACCESS_TOKEN_STORAGE_KEY = "superise_owner_access_token";

export function getOwnerAccessToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(OWNER_ACCESS_TOKEN_STORAGE_KEY) ?? "";
}

export function hasOwnerAccessToken(): boolean {
  return getOwnerAccessToken().length > 0;
}

export function setOwnerAccessToken(accessToken: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(OWNER_ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function clearOwnerAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(OWNER_ACCESS_TOKEN_STORAGE_KEY);
}
