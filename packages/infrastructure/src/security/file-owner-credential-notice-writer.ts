import { chmodSync, writeFileSync } from "node:fs";
import type { OwnerCredentialNoticeWriter } from "@superise/application";
import { nowIso } from "@superise/shared";
import type { WalletServerConfig } from "../config/wallet-server-config";

export class FileOwnerCredentialNoticeWriter implements OwnerCredentialNoticeWriter {
  constructor(private readonly config: WalletServerConfig) {}

  async write(password: string): Promise<string> {
    const contents = [
      "SupeRISE Owner Credential",
      "",
      `Created At: ${nowIso()}`,
      "Login password:",
      password,
      "",
      "Treat this file as sensitive local secret material.",
      "This wallet is an Agent credit wallet. Rotate this password after the first Owner login.",
    ].join("\n");

    writeFileSync(this.config.ownerNoticePath, contents, {
      encoding: "utf8",
      mode: 0o600,
    });
    chmodSync(this.config.ownerNoticePath, 0o600);
    return this.config.ownerNoticePath;
  }
}
