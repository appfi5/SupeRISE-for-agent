import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { PasswordHasher } from "@superise/application";

export class ScryptPasswordHasher implements PasswordHasher {
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `scrypt$${salt}$${hash}`;
  }

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    const [, salt, expected] = passwordHash.split("$");
    if (!salt || !expected) {
      return false;
    }

    const actual = scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  }

  generateOwnerPassword(): string {
    return randomBytes(12).toString("base64url");
  }
}
