import { writeFileSync } from "node:fs";
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
      "This wallet is an Agent credit wallet. Rotate this password after the first Owner login.",
    ].join("\n");

    writeFileSync(this.config.ownerNoticePath, contents, "utf8");
    return this.config.ownerNoticePath;
  }
}
