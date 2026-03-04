/**
 * Platform Authentication Service (CKB Address-based)
 * 
 * New authentication flow using CKB address as identity.
 */

import { getWallet, signMessage as signServerSignMessage } from "@/services/sign-server";
import { homedir } from "os";
import { join } from "path";
import { getConfigValue } from "@/core/sustain/config";

export type AuthSession = {
  address: string;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
};

export interface PlatformAuthService {
  ensureToken(): Promise<string>;
  getAddress(): Promise<string>;
  logout(): void;
  isTokenValid(): boolean;
}

class CKBAuthService implements PlatformAuthService {
  private baseUrl: string;
  private session: AuthSession | null = null;
  private sessionFilePath: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    const riseHome = process.env.RISE_HOME || join(homedir(), ".rise");
    this.sessionFilePath = join(riseHome, "market-session.json");
    this.loadSession();
  }

  private loadSession(): void {
    try {
      const fs = require("fs");
      if (fs.existsSync(this.sessionFilePath)) {
        const data = fs.readFileSync(this.sessionFilePath, "utf-8");
        this.session = JSON.parse(data);
      }
    } catch (error) {
      this.session = null;
    }
  }

  private saveSession(): void {
    try {
      const fs = require("fs");
      const path = require("path");
      const dir = path.dirname(this.sessionFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.sessionFilePath,
        JSON.stringify(this.session, null, 2)
      );
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  async getAddress(): Promise<string> {
    const wallet = await getWallet();
    if (!wallet) {
      throw new Error("No wallet configured. Please check sign server.");
    }
    return wallet.address;
  }

  isTokenValid(): boolean {
    if (!this.session || !this.session.token) {
      return false;
    }
    if (this.session.expiresAt && Date.now() > this.session.expiresAt) {
      return false;
    }
    return true;
  }

  async ensureToken(): Promise<string> {
    if (this.isTokenValid() && this.session) {
      return this.session.token;
    }

    const address = await this.getAddress();
    
    if (this.session && this.session.address !== address) {
      this.session = null;
    }

    const wallet = await getWallet();
    if (!wallet) {
      throw new Error("No wallet configured");
    }

    const message = await this.genSignMessage(address);
    const signature = await this.signMessage(message);
    const tokenVo = await this.loginForAgent(address, wallet.publicKey, message, signature);

    this.session = {
      address,
      token: tokenVo.accessToken,
      refreshToken: tokenVo.refreshToken,
      expiresAt: tokenVo.expiresIn ? Date.now() + Number(tokenVo.expiresIn) * 1000 : undefined,
    };
    this.saveSession();

    return this.session.token;
  }

  private async genSignMessage(ckbAddress: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/user/gen-sign-message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ckbAddress }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate sign message: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error(`Invalid gen-sign-message response: ${data.message || "Unknown error"}`);
    }

    return data.data;
  }

  private async signMessage(message: string): Promise<string> {
    const result = await signServerSignMessage(message);
    return result.signature;
  }

  private async loginForAgent(
    ckbAddress: string,
    publicKey: string,
    originMessage: string,
    signature: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string; scope: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/user/login-for-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ckbAddress,
        publicKey,
        originMessage,
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.data || !data.data.accessToken) {
      throw new Error(`Invalid login response: ${data.message || "Unknown error"}`);
    }

    return data.data;
  }

  logout(): void {
    this.session = null;
    try {
      const fs = require("fs");
      if (fs.existsSync(this.sessionFilePath)) {
        fs.unlinkSync(this.sessionFilePath);
      }
    } catch (error) {
      console.error("Failed to delete session file:", error);
    }
  }
}

let authServiceInstance: PlatformAuthService | null = null;

export function getAuthService(): PlatformAuthService {
  if (authServiceInstance) {
    return authServiceInstance;
  }

  const baseUrl = getConfigValue("platformBaseUrl");
  authServiceInstance = new CKBAuthService(baseUrl);
  return authServiceInstance;
}

export function resetAuthService(): void {
  authServiceInstance = null;
}
