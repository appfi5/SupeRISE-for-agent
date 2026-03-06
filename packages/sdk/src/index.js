import {
  importWalletSchema,
  signMessageSchema,
  transferCkbSchema,
  walletIdParamSchema,
  parse,
} from "@superise/contracts";

export class WalletApiClient {
  constructor({ baseUrl, adminToken, runtimeToken }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.adminToken = adminToken;
    this.runtimeToken = runtimeToken;
  }

  async #request(path, { method = "GET", body, admin = false } = {}) {
    const token = admin ? this.adminToken : this.runtimeToken;
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        [admin ? "x-admin-token" : "x-runtime-token"]: token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message ?? `Request failed with status ${response.status}`);
    }
    return json;
  }

  importWallet(payload) {
    return this.#request("/api/v1/admin/wallets/import", {
      method: "POST",
      body: parse(importWalletSchema, payload),
      admin: true,
    });
  }

  exportWalletSecret(walletId) {
    const parsed = parse(walletIdParamSchema, { walletId });
    return this.#request(`/api/v1/admin/wallets/${parsed.walletId}/export`, {
      method: "POST",
      admin: true,
    });
  }

  listWallets() {
    return this.#request("/api/v1/admin/wallets", { admin: true });
  }

  getCurrentWallet() {
    return this.#request("/api/v1/wallets/current");
  }

  signMessage(walletId, payload) {
    const parsedId = parse(walletIdParamSchema, { walletId });
    const parsedBody = parse(signMessageSchema, payload);
    return this.#request(`/api/v1/wallets/${parsedId.walletId}/sign-message`, {
      method: "POST",
      body: parsedBody,
    });
  }

  transferCkb(walletId, payload) {
    const parsedId = parse(walletIdParamSchema, { walletId });
    const parsedBody = parse(transferCkbSchema, payload);
    return this.#request(`/api/v1/wallets/${parsedId.walletId}/transfers/ckb`, {
      method: "POST",
      body: {
        ...parsedBody,
        amountShannon: parsedBody.amountShannon.toString(),
      },
    });
  }
}
