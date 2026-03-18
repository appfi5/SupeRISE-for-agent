import type {
  AddressBookContactDto,
  AuditLogDto,
  EthereumAddressDto,
  EthereumBalanceEthDto,
  EthereumBalanceUsdcDto,
  EthereumBalanceUsdtDto,
  NervosAddressDto,
  NervosBalanceCkbDto,
  OwnerAssetLimitEntryDto,
  OwnerCredentialStatusDto,
  WalletCurrentDto,
} from "@superise/app-contracts";

export type RotateCredentialFormState = {
  currentPassword: string;
  newPassword: string;
};

export type MessageSigningFormState = {
  message: string;
  encoding: "utf8" | "hex";
};

export type AssetAmountUnit = "display" | "gwei" | "base";

export type AssetAmountInputState = {
  value: string;
  unit: AssetAmountUnit;
};

export type CkbTransferFormState = {
  to: string;
  toType: "address" | "contact_name";
  amount: AssetAmountInputState;
};

export type EthTransferFormState = {
  to: string;
  toType: "address" | "contact_name";
  amount: AssetAmountInputState;
};

export type UsdtTransferFormState = {
  to: string;
  toType: "address" | "contact_name";
  amount: AssetAmountInputState;
};

export type UsdcTransferFormState = {
  to: string;
  toType: "address" | "contact_name";
  amount: AssetAmountInputState;
};

export type AddressBookEditorState = {
  currentName: string | null;
  name: string;
  note: string;
  nervosAddress: string;
  ethereumAddress: string;
};

export type AssetLimitFormState = {
  dailyLimit: AssetAmountInputState;
  weeklyLimit: AssetAmountInputState;
  monthlyLimit: AssetAmountInputState;
};

export type AppState = {
  credential: OwnerCredentialStatusDto | null;
  current: WalletCurrentDto | null;
  nervos: {
    address: NervosAddressDto | null;
    ckbBalance: NervosBalanceCkbDto | null;
  };
  ethereum: {
    address: EthereumAddressDto | null;
    ethBalance: EthereumBalanceEthDto | null;
    usdtBalance: EthereumBalanceUsdtDto | null;
    usdcBalance: EthereumBalanceUsdcDto | null;
  };
  addressBookContacts: AddressBookContactDto[];
  assetLimits: OwnerAssetLimitEntryDto[];
  audits: AuditLogDto[];
};

export const OWNER_RISK_NOTICE_KEYS = [
  "risk_notice.sign_transfer",
  "risk_notice.owner_limit_bypass",
  "risk_notice.import_export",
  "risk_notice.jwt_expiry",
] as const;

export const emptyAppState: AppState = {
  credential: null,
  current: null,
  nervos: {
    address: null,
    ckbBalance: null,
  },
  ethereum: {
    address: null,
    ethBalance: null,
    usdtBalance: null,
    usdcBalance: null,
  },
  addressBookContacts: [],
  assetLimits: [],
  audits: [],
};
