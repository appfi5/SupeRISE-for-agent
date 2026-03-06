import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_POLICY } from "./defaults.js";
import {
  loadLocalPolicy,
  classifyStatus,
  calculateBurnRate,
  buildForecast,
} from "./engine.js";
import {
  getTopUpAmountRange,
  validateTopUpAmount,
} from "./config.js";

describe("sustain/defaults", () => {
  it("should have a valid default policy", () => {
    assert.equal(DEFAULT_POLICY.strategy, "balanced");
    assert.equal(typeof DEFAULT_POLICY.thresholds.critical, "number");
    assert.equal(typeof DEFAULT_POLICY.thresholds.low, "number");
    assert.ok(DEFAULT_POLICY.thresholds.critical < DEFAULT_POLICY.thresholds.low);
    assert.ok(DEFAULT_POLICY.budget.singleTopUpMinCKB > 0);
  });
});

describe("sustain/engine", () => {
  describe("loadLocalPolicy", () => {
    it("should return defaults when no stored policy", () => {
      const policy = loadLocalPolicy(null);
      assert.deepEqual(policy, DEFAULT_POLICY);
    });

    it("should merge stored overrides with defaults", () => {
      const stored = { thresholds: { critical: 5 }, strategy: "cost" };
      const policy = loadLocalPolicy(stored);
      assert.equal(policy.strategy, "cost");
      assert.equal(policy.thresholds.critical, 5);
      assert.equal(policy.thresholds.low, DEFAULT_POLICY.thresholds.low);
    });
  });

  describe("classifyStatus", () => {
    it("should return critical when balance <= critical", () => {
      assert.equal(classifyStatus(5, 10, 100), "critical");
      assert.equal(classifyStatus(10, 10, 100), "critical");
    });

    it("should return low when balance <= low", () => {
      assert.equal(classifyStatus(50, 10, 100), "low");
      assert.equal(classifyStatus(100, 10, 100), "low");
    });

    it("should return healthy when balance > low", () => {
      assert.equal(classifyStatus(500, 10, 100), "healthy");
    });
  });

  describe("calculateBurnRate", () => {
    it("should return 0 with fewer than 2 observations", () => {
      assert.equal(calculateBurnRate([]), 0);
      assert.equal(calculateBurnRate([{ ts: "2026-01-01T00:00:00Z", remaining: 100 }]), 0);
    });

    it("should calculate positive burn rate", () => {
      const observations = [
        { ts: "2026-01-01T00:00:00Z", remaining: 100 },
        { ts: "2026-01-01T00:10:00Z", remaining: 90 },
      ];
      const rate = calculateBurnRate(observations);
      assert.equal(rate, 1); // 10 credits / 10 min = 1 credit/min
    });

    it("should ignore negative deltas (top-ups)", () => {
      const observations = [
        { ts: "2026-01-01T00:00:00Z", remaining: 100 },
        { ts: "2026-01-01T00:10:00Z", remaining: 200 },
        { ts: "2026-01-01T00:20:00Z", remaining: 190 },
      ];
      const rate = calculateBurnRate(observations);
      assert.equal(rate, 1); // only 200→190 counts
    });
  });

  describe("buildForecast", () => {
    const policy = loadLocalPolicy(null);

    it("should return fallback when <2 observations", () => {
      const result = buildForecast([], policy, 2);
      assert.equal(result.burnRate, 2);
      assert.equal(result.etaCritical, -1);
      assert.equal(result.confidence, 0);
    });

    it("should compute ETA from observations", () => {
      const observations = [
        { ts: "2026-01-01T00:10:00Z", remaining: 90 },
        { ts: "2026-01-01T00:00:00Z", remaining: 100 },
      ];
      const result = buildForecast(observations, policy);
      assert.ok(result.burnRate > 0);
      assert.ok(result.etaCritical > 0);
      assert.ok(result.etaZero > 0);
      assert.equal(result.observationCount, 2);
    });
  });
});

describe("sustain/config", () => {
  describe("getTopUpAmountRange", () => {
    it("should return min and max", () => {
      const range = getTopUpAmountRange();
      assert.equal(typeof range.min, "number");
      assert.equal(typeof range.max, "number");
      assert.ok(range.min <= range.max);
    });
  });

  describe("validateTopUpAmount", () => {
    it("should accept valid amount", () => {
      const { min } = getTopUpAmountRange();
      assert.equal(validateTopUpAmount(min), min);
    });

    it("should reject amount below min", () => {
      assert.throws(() => validateTopUpAmount(0), /must be between/);
    });

    it("should reject amount above max", () => {
      assert.throws(() => validateTopUpAmount(999_999), /must be between/);
    });

    it("should reject non-finite values", () => {
      assert.throws(() => validateTopUpAmount(NaN), /must be between/);
      assert.throws(() => validateTopUpAmount(Infinity), /must be between/);
    });
  });
});
