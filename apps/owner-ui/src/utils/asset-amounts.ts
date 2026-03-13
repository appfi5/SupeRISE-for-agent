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

export function getAmountInputHint(asset: SupportedAsset, unit: AssetAmountUnit): string {
  const config = ASSET_CONFIG[asset];
  const unitConfig = getUnitConfig(config, unit);
  if (unit === "display") {
    return `支持最多 ${config.decimals} 位小数，提交时会自动转换为 ${config.baseUnitLabel}。`;
  }

  if (unitConfig) {
    return `支持最多 ${unitConfig.decimals} 位小数，提交时会自动转换为 ${config.baseUnitLabel}。`;
  }

  return `直接输入基础单位 ${config.baseUnitLabel}，不允许小数。`;
}

export function validateAmountInput(
  asset: SupportedAsset,
  input: AssetAmountInputState,
  options?: { allowEmpty?: boolean; requirePositive?: boolean },
): AmountValidationResult {
  const raw = input.value.trim();
  if (!raw) {
    return options?.allowEmpty
      ? { baseValue: null, error: null }
      : { baseValue: null, error: "请输入金额。" };
  }

  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return { baseValue: null, error: "金额必须是合法数字。" };
  }

  const config = ASSET_CONFIG[asset];
  const unitConfig = getUnitConfig(config, input.unit);

  if (input.unit === "base" && raw.includes(".")) {
    return { baseValue: null, error: `${config.baseUnitLabel} 输入不支持小数。` };
  }

  const decimalPlaces = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
  const allowedDecimals = input.unit === "display" ? config.decimals : unitConfig?.decimals;
  if (allowedDecimals !== undefined && decimalPlaces > allowedDecimals) {
    return {
      baseValue: null,
      error: `${getUnitLabel(config, input.unit)} 最多支持 ${allowedDecimals} 位小数。`,
    };
  }

  let parsed: Decimal;
  try {
    parsed = new Decimal(raw);
  } catch {
    return { baseValue: null, error: "金额格式无效。" };
  }

  if (!parsed.isFinite() || parsed.isNegative()) {
    return { baseValue: null, error: "金额必须是非负数。" };
  }

  if (options?.requirePositive && parsed.lte(0)) {
    return { baseValue: null, error: "金额必须大于 0。" };
  }

  const baseAmount =
    input.unit === "base"
      ? parsed
      : parsed.mul(new Decimal(10).pow(getScaleDecimals(config, input.unit)));

  if (!baseAmount.isInteger()) {
    return { baseValue: null, error: "金额无法精确转换为基础单位。" };
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
