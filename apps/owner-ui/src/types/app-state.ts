import type {
  AuditLogDto,
  EthereumAddressDto,
  EthereumBalanceEthDto,
  EthereumBalanceUsdtDto,
  NervosAddressDto,
  NervosBalanceCkbDto,
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

export type CkbTransferFormState = {
  to: string;
  amount: string;
};

export type EthTransferFormState = {
  to: string;
  amount: string;
};

export type UsdtTransferFormState = {
  to: string;
  amount: string;
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
  };
  audits: AuditLogDto[];
};

export const OWNER_RISK_NOTICES = [
  "签名和转账都会直接使用当前唯一钱包，请先确认链与资产类型。",
  "导入私钥会替换当前钱包；导出私钥后，Owner 将直接掌握钱包控制权。",
  "JWT 访问令牌默认 1 小时有效，过期后需要重新登录。",
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
  },
  audits: [],
};
