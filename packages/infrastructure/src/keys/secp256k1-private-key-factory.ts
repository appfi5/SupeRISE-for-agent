import { createECDH } from "node:crypto";
import type { WalletPrivateKeyFactory } from "@superise/application";

export class Secp256k1PrivateKeyFactory implements WalletPrivateKeyFactory {
  async create(): Promise<string> {
    const ecdh = createECDH("secp256k1");
    ecdh.generateKeys();
    return `0x${ecdh.getPrivateKey("hex")}`;
  }
}
