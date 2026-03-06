import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  importWalletSchema,
  signMessageSchema,
  transferCkbSchema,
  walletIdParamSchema,
  parse,
} from "./index.js";

describe("Contracts", () => {
  describe("importWalletSchema", () => {
    it("should validate correct wallet import data", () => {
      const valid = {
        name: "My Wallet",
        privateKey: "a".repeat(64),
      };

      const result = parse(importWalletSchema, valid);

      assert.equal(result.name, "My Wallet");
      assert.equal(result.privateKey, "a".repeat(64));
    });

    it("should reject empty name", () => {
      const invalid = {
        name: "",
        privateKey: "a".repeat(64),
      };

      assert.throws(() => {
        parse(importWalletSchema, invalid);
      });
    });

    it("should reject too long name", () => {
      const invalid = {
        name: "a".repeat(65),
        privateKey: "a".repeat(64),
      };

      assert.throws(() => {
        parse(importWalletSchema, invalid);
      });
    });

    it("should reject short private key", () => {
      const invalid = {
        name: "My Wallet",
        privateKey: "short",
      };

      assert.throws(() => {
        parse(importWalletSchema, invalid);
      });
    });
  });

  describe("signMessageSchema", () => {
    it("should validate correct sign message data", () => {
      const valid = {
        message: "test message",
      };

      const result = parse(signMessageSchema, valid);

      assert.equal(result.message, "test message");
    });

    it("should reject empty message", () => {
      const invalid = {
        message: "",
      };

      assert.throws(() => {
        parse(signMessageSchema, invalid);
      });
    });
  });

  describe("transferCkbSchema", () => {
    it("should validate correct transfer data", () => {
      const valid = {
        toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        amountShannon: "10000000000",
      };

      const result = parse(transferCkbSchema, valid);

      assert.equal(result.toAddress, valid.toAddress);
      assert.equal(typeof result.amountShannon, "bigint");
      assert.equal(result.amountShannon.toString(), "10000000000");
    });

    it("should coerce string to bigint", () => {
      const valid = {
        toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        amountShannon: "12345",
      };

      const result = parse(transferCkbSchema, valid);

      assert.equal(typeof result.amountShannon, "bigint");
      assert.equal(result.amountShannon, 12345n);
    });

    it("should reject negative amount", () => {
      const invalid = {
        toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        amountShannon: "-100",
      };

      assert.throws(() => {
        parse(transferCkbSchema, invalid);
      });
    });

    it("should reject zero amount", () => {
      const invalid = {
        toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        amountShannon: "0",
      };

      assert.throws(() => {
        parse(transferCkbSchema, invalid);
      });
    });

    it("should reject empty address", () => {
      const invalid = {
        toAddress: "",
        amountShannon: "10000000000",
      };

      assert.throws(() => {
        parse(transferCkbSchema, invalid);
      });
    });

    it("should reject invalid address prefix", () => {
      const invalid = {
        toAddress: "abc1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5f",
        amountShannon: "10000000000",
      };

      assert.throws(() => {
        parse(transferCkbSchema, invalid);
      });
    });

    it("should reject invalid address characters", () => {
      const invalid = {
        toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5I",
        amountShannon: "10000000000",
      };

      assert.throws(() => {
        parse(transferCkbSchema, invalid);
      });
    });

    it("should reject bech32-excluded characters", () => {
      const invalid = {
        toAddress: "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwyk5m9vn7qzftgq8j2l8s2fqlkdwzg78c8lq8nkp5o",
        amountShannon: "10000000000",
      };

      assert.throws(() => {
        parse(transferCkbSchema, invalid);
      });
    });
  });

  describe("walletIdParamSchema", () => {
    it("should validate correct wallet ID", () => {
      const valid = {
        walletId: "test-wallet-id",
      };

      const result = parse(walletIdParamSchema, valid);

      assert.equal(result.walletId, "test-wallet-id");
    });

    it("should reject empty wallet ID", () => {
      const invalid = {
        walletId: "",
      };

      assert.throws(() => {
        parse(walletIdParamSchema, invalid);
      });
    });
  });
});
