import Decimal from "decimal.js/decimal";
import type { AssetAmountInputState, AssetAmountUnit } from "../types/app-state";

export type SupportedAsset = "CKB" | "ETH" | "USDT" | "USDC";

type AssetConfig = {
  asset: SupportedAsset;
  decimals: number;
  displayUnitLabel: string;
  baseUnitLabel: string;
  extraUnits?: Array<{
    value: AssetAmountUnit;
    label: string;
    decimals: number;
  }>;
};

const ASSET_CONFIG: Record<SupportedAsset, AssetConfig> = {
  CKB: {
    asset: "CKB",
    decimals: 8,
    displayUnitLabel: "CKB",
    baseUnitLabel: "Shannon",
  },
  ETH: {
    asset: "ETH",
    decimals: 18,
    displayUnitLabel: "ETH",
    baseUnitLabel: "Wei",
    extraUnits: [
      {
        value: "gwei",
        label: "Gwei",
        decimals: 9,
      },
    ],
  },
  USDT: {
    asset: "USDT",
    decimals: 6,
    displayUnitLabel: "USDT",
    baseUnitLabel: "Base Unit",
  },
  USDC: {
    asset: "USDC",
    decimals: 6,
    displayUnitLabel: "USDC",
    baseUnitLabel: "Base Unit",
  },
};

export type AmountValidationResult = {
  baseValue: string | null;
  error: string | null;
};

type Translate = (
  key:
    | "amount.hint.display"
    | "amount.hint.scaled"
    | "amount.hint.base"
    | "amount.error.required"
    | "amount.error.invalid_number"
    | "amount.error.base_no_decimal"
    | "amount.error.max_decimals"
    | "amount.error.invalid_format"
    | "amount.error.non_negative"
    | "amount.error.positive_required"
    | "amount.error.precise_conversion",
  params?: Record<string, string | number>,
) => string;

export function createEmptyAmountInput(unit: AssetAmountUnit = "display"): AssetAmountInputState {
  return {
    value: "",
    unit,
  };
}

export function createAmountInputFromBaseValue(
  asset: SupportedAsset,
  baseValue: string | null,
): AssetAmountInputState {
  if (!baseValue) {
    return createEmptyAmountInput();
  }

  return {
    value: formatBaseValueForDisplay(asset, baseValue),
    unit: "display",
  };
}

export function getAmountUnitOptions(asset: SupportedAsset): Array<{
  label: string;
  value: AssetAmountUnit;
}> {
  const config = ASSET_CONFIG[asset];
  return [
    {
      label: config.displayUnitLabel,
      value: "display",
    },
    ...(config.extraUnits ?? []).map((unit) => ({
      label: unit.label,
      value: unit.value,
    })),
    {
      label: config.baseUnitLabel,
      value: "base",
    },
  ];
}

export function getAmountInputHint(
  asset: SupportedAsset,
  unit: AssetAmountUnit,
  t: Translate,
): string {
  const config = ASSET_CONFIG[asset];
  const unitConfig = getUnitConfig(config, unit);
  if (unit === "display") {
    return t("amount.hint.display", {
      decimals: config.decimals,
      baseUnit: config.baseUnitLabel,
    });
  }

  if (unitConfig) {
    return t("amount.hint.scaled", {
      decimals: unitConfig.decimals,
      baseUnit: config.baseUnitLabel,
    });
  }

  return t("amount.hint.base", {
    baseUnit: config.baseUnitLabel,
  });
}

export function validateAmountInput(
  asset: SupportedAsset,
  input: AssetAmountInputState,
  options?: { allowEmpty?: boolean; requirePositive?: boolean },
  t?: Translate,
): AmountValidationResult {
  const raw = input.value.trim();
  if (!raw) {
    return options?.allowEmpty
      ? { baseValue: null, error: null }
      : { baseValue: null, error: t?.("amount.error.required") ?? "Enter an amount." };
  }

  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return {
      baseValue: null,
      error: t?.("amount.error.invalid_number") ?? "The amount must be a valid number.",
    };
  }

  const config = ASSET_CONFIG[asset];
  const unitConfig = getUnitConfig(config, input.unit);

  if (input.unit === "base" && raw.includes(".")) {
    return {
      baseValue: null,
      error:
        t?.("amount.error.base_no_decimal", { baseUnit: config.baseUnitLabel }) ??
        `${config.baseUnitLabel} does not support decimal input.`,
    };
  }

  const decimalPlaces = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
  const allowedDecimals = input.unit === "display" ? config.decimals : unitConfig?.decimals;
  if (allowedDecimals !== undefined && decimalPlaces > allowedDecimals) {
    return {
      baseValue: null,
      error:
        t?.("amount.error.max_decimals", {
          unit: getUnitLabel(config, input.unit),
          decimals: allowedDecimals,
        }) ?? `${getUnitLabel(config, input.unit)} supports up to ${allowedDecimals} decimals.`,
    };
  }

  let parsed: Decimal;
  try {
    parsed = new Decimal(raw);
  } catch {
    return {
      baseValue: null,
      error: t?.("amount.error.invalid_format") ?? "The amount format is invalid.",
    };
  }

  if (!parsed.isFinite() || parsed.isNegative()) {
    return {
      baseValue: null,
      error: t?.("amount.error.non_negative") ?? "The amount must be non-negative.",
    };
  }

  if (options?.requirePositive && parsed.lte(0)) {
    return {
      baseValue: null,
      error: t?.("amount.error.positive_required") ?? "The amount must be greater than 0.",
    };
  }

  const baseAmount =
    input.unit === "base"
      ? parsed
      : parsed.mul(new Decimal(10).pow(getScaleDecimals(config, input.unit)));

  if (!baseAmount.isInteger()) {
    return {
      baseValue: null,
      error:
        t?.("amount.error.precise_conversion") ??
        "The amount cannot be converted to the base unit precisely.",
    };
  }

  return {
    baseValue: baseAmount.toFixed(0),
    error: null,
  };
}

export function formatBaseValueForDisplay(asset: SupportedAsset, baseValue: string): string {
  const config = ASSET_CONFIG[asset];
  const decimal = new Decimal(baseValue);
  const display = decimal.div(new Decimal(10).pow(config.decimals));
  return display.toFixed(config.decimals).replace(/\.?0+$/, "");
}

export function getAssetDecimals(asset: SupportedAsset): number {
  return ASSET_CONFIG[asset].decimals;
}

function getUnitConfig(config: AssetConfig, unit: AssetAmountUnit) {
  return config.extraUnits?.find((item) => item.value === unit);
}

function getScaleDecimals(config: AssetConfig, unit: AssetAmountUnit): number {
  if (unit === "display") {
    return config.decimals;
  }

  return getUnitConfig(config, unit)?.decimals ?? 0;
}

function getUnitLabel(config: AssetConfig, unit: AssetAmountUnit): string {
  if (unit === "display") {
    return config.displayUnitLabel;
  }

  if (unit === "base") {
    return config.baseUnitLabel;
  }

  return getUnitConfig(config, unit)?.label ?? config.baseUnitLabel;
}
