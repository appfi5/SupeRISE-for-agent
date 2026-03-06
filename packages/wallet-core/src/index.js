import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
} from "node:crypto";

function ensureMasterKey(masterKey) {
  if (!masterKey || Buffer.byteLength(masterKey, "utf8") < 32) {
    throw new Error("MASTER_KEY must be at least 32 bytes.");
  }
}

function deriveKey(masterKey, salt) {
  return scryptSync(masterKey, salt, 32);
}

function encryptPrivateKey(masterKey, privateKey) {
  ensureMasterKey(masterKey);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(masterKey, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const fingerprint = createHash("sha256").update(privateKey).digest("hex").slice(0, 16);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    salt: salt.toString("base64"),
    fingerprint,
  };
}

function decryptPrivateKey(masterKey, encrypted) {
  ensureMasterKey(masterKey);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveKey(masterKey, Buffer.from(encrypted.salt, "base64")),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
      decipher.final(),
    ]);
  return plaintext.toString("utf8");
}

function requestHash(input) {
  return createHash("sha256").update(input).digest("hex");
}

export class WalletCoreService {
  constructor({ repository, ckbAdapter, masterKey }) {
    this.repository = repository;
    this.ckbAdapter = ckbAdapter;
    this.masterKey = masterKey;
  }

  async importWallet({ name, privateKey }) {
    const walletId = randomUUID();
    const identity = await this.ckbAdapter.deriveIdentity(privateKey);
    const encrypted = encryptPrivateKey(this.masterKey, privateKey);

    this.repository.createWallet(
      { id: walletId, name, sourceType: "imported_private_key" },
      encrypted,
      identity,
    );

    return {
      walletId,
      name,
      chain: identity.chain,
      address: identity.address,
      publicKey: identity.publicKey,
    };
  }

  listWallets() {
    return this.repository.listWallets();
  }

  getWalletIdentity(walletId) {
    const wallet = walletId
      ? this.repository.getWallet(walletId)
      : this.repository.getDefaultWallet();

    if (!wallet) {
      throw new Error("Wallet not found.");
    }

    return wallet;
  }

  exportWalletSecret(walletId) {
    const keyMaterial = this.repository.getKeyMaterial(walletId);
    if (!keyMaterial) {
      throw new Error("Wallet key material not found.");
    }

    const privateKey = decryptPrivateKey(this.masterKey, keyMaterial);
    this.repository.addSignRecord({
      id: randomUUID(),
      walletId,
      chain: "ckb",
      operation: "export_wallet_secret",
      requestHash: requestHash(walletId),
      resultRef: null,
      actor: "admin",
    });

    return { privateKey };
  }

  async signMessage(walletId, message) {
    const keyMaterial = this.repository.getKeyMaterial(walletId);
    if (!keyMaterial) {
      throw new Error("Wallet key material not found.");
    }

    const privateKey = decryptPrivateKey(this.masterKey, keyMaterial);
    const signature = await this.ckbAdapter.signMessage(privateKey, message);
    this.repository.addSignRecord({
      id: randomUUID(),
      walletId,
      chain: "ckb",
      operation: "sign_message",
      requestHash: requestHash(`${walletId}:${message}`),
      resultRef: signature,
      actor: "runtime",
    });

    return { signature };
  }

  async transferCkb(walletId, toAddress, amountShannon) {
    const keyMaterial = this.repository.getKeyMaterial(walletId);
    if (!keyMaterial) {
      throw new Error("Wallet key material not found.");
    }

    const privateKey = decryptPrivateKey(this.masterKey, keyMaterial);
    const txResult = await this.ckbAdapter.transfer(privateKey, toAddress, amountShannon);

    this.repository.addSignRecord({
      id: randomUUID(),
      walletId,
      chain: "ckb",
      operation: "transfer_ckb",
      requestHash: requestHash(`${walletId}:${toAddress}:${amountShannon.toString()}`),
      resultRef: txResult.txHash,
      actor: "runtime",
    });

    return txResult;
  }
}
