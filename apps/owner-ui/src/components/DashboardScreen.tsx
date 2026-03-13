import { useEffect, useMemo, useState } from "react";
import {
  AuditOutlined,
  BookOutlined,
  DashboardOutlined,
  KeyOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  SignatureOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Menu,
  Modal,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps, TableColumnsType } from "antd";
import type {
  AddressBookContactDto,
  AddressBookLookupByAddressResponse,
  AuditLogDto,
  OwnerAssetLimitEntryDto,
} from "@superise/app-contracts";
import { OWNER_RISK_NOTICES, type AppState } from "../types/app-state";
import type {
  AssetAmountInputState,
  AssetAmountUnit,
  AddressBookEditorState,
  AssetLimitFormState,
  CkbTransferFormState,
  EthTransferFormState,
  MessageSigningFormState,
  RotateCredentialFormState,
  UsdcTransferFormState,
  UsdtTransferFormState,
} from "../types/app-state";
import {
  getAmountInputHint,
  getAmountUnitOptions,
  validateAmountInput,
  type SupportedAsset,
} from "../utils/asset-amounts";

const { Header, Sider, Content } = Layout;
const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

type SectionKey =
  | "overview"
  | "wallet"
  | "transfers"
  | "signing"
  | "address-book"
  | "limits"
  | "security"
  | "audit";

type DashboardScreenProps = {
  activeAction: string | null;
  appState: AppState;
  addressBookEditor: AddressBookEditorState;
  addressBookFilter: string;
  addressLookupAddress: string;
  addressLookupResult: AddressBookLookupByAddressResponse | null;
  ckbTransfer: CkbTransferFormState;
  ethTransfer: EthTransferFormState;
  ethereumSignForm: MessageSigningFormState;
  ethereumSignResult: string;
  exportedKey: string;
  importConfirmed: boolean;
  importKey: string;
  isRefreshing: boolean;
  nervosSignForm: MessageSigningFormState;
  nervosSignResult: string;
  rotateForm: RotateCredentialFormState;
  assetLimitDrafts: Record<string, AssetLimitFormState>;
  usdcTransfer: UsdcTransferFormState;
  usdtTransfer: UsdtTransferFormState;
  onRefresh: () => void;
  onCkbAmountChange: (value: string) => void;
  onCkbAmountUnitChange: (unit: AssetAmountUnit) => void;
  onCkbSubmit: () => void;
  onCkbToChange: (value: string) => void;
  onEthAmountChange: (value: string) => void;
  onEthAmountUnitChange: (unit: AssetAmountUnit) => void;
  onEthSubmit: () => void;
  onEthToChange: (value: string) => void;
  onEthereumSignEncodingChange: (value: MessageSigningFormState["encoding"]) => void;
  onEthereumSignMessageChange: (value: string) => void;
  onEthereumSignSubmit: () => void;
  onExport: () => void;
  onImport: () => void;
  onImportConfirmedChange: (value: boolean) => void;
  onImportKeyChange: (value: string) => void;
  onLogout: () => void;
  onNervosSignEncodingChange: (value: MessageSigningFormState["encoding"]) => void;
  onNervosSignMessageChange: (value: string) => void;
  onNervosSignSubmit: () => void;
  onRotateCurrentPasswordChange: (value: string) => void;
  onRotateNewPasswordChange: (value: string) => void;
  onRotateSubmit: () => void;
  onAssetLimitChange: (
    key: string,
    field: keyof AssetLimitFormState,
    value: string,
  ) => void;
  onAssetLimitUnitChange: (
    key: string,
    field: keyof AssetLimitFormState,
    unit: AssetAmountUnit,
  ) => void;
  onAssetLimitSave: (key: string) => void;
  onAddressBookDelete: () => Promise<void>;
  onAddressBookEditorChange: (
    field: keyof Omit<AddressBookEditorState, "currentName">,
    value: string,
  ) => void;
  onAddressBookFilterChange: (value: string) => void;
  onAddressBookLookup: () => void;
  onAddressBookLookupAddressChange: (value: string) => void;
  onAddressBookReset: () => void;
  onAddressBookSave: () => Promise<void>;
  onAddressBookSelect: (contact: AppState["addressBookContacts"][number]) => void;
  onUsdtAmountChange: (value: string) => void;
  onUsdtAmountUnitChange: (unit: AssetAmountUnit) => void;
  onUsdtSubmit: () => void;
  onUsdtToChange: (value: string) => void;
  onUsdtToTypeChange: (value: "address" | "contact_name") => void;
  onUsdcAmountChange: (value: string) => void;
  onUsdcAmountUnitChange: (unit: AssetAmountUnit) => void;
  onUsdcSubmit: () => void;
  onUsdcToChange: (value: string) => void;
  onUsdcToTypeChange: (value: "address" | "contact_name") => void;
  onCkbToTypeChange: (value: "address" | "contact_name") => void;
  onEthToTypeChange: (value: "address" | "contact_name") => void;
};

export function DashboardScreen({
  activeAction,
  appState,
  addressBookEditor,
  addressBookFilter,
  addressLookupAddress,
  addressLookupResult,
  ckbTransfer,
  ethTransfer,
  ethereumSignForm,
  ethereumSignResult,
  exportedKey,
  importConfirmed,
  importKey,
  isRefreshing,
  nervosSignForm,
  nervosSignResult,
  rotateForm,
  assetLimitDrafts,
  usdcTransfer,
  usdtTransfer,
  onRefresh,
  onCkbAmountChange,
  onCkbAmountUnitChange,
  onCkbSubmit,
  onCkbToChange,
  onEthAmountChange,
  onEthAmountUnitChange,
  onEthSubmit,
  onEthToChange,
  onEthereumSignEncodingChange,
  onEthereumSignMessageChange,
  onEthereumSignSubmit,
  onExport,
  onImport,
  onImportConfirmedChange,
  onImportKeyChange,
  onLogout,
  onNervosSignEncodingChange,
  onNervosSignMessageChange,
  onNervosSignSubmit,
  onRotateCurrentPasswordChange,
  onRotateNewPasswordChange,
  onRotateSubmit,
  onAssetLimitChange,
  onAssetLimitUnitChange,
  onAssetLimitSave,
  onAddressBookDelete,
  onAddressBookEditorChange,
  onAddressBookFilterChange,
  onAddressBookLookup,
  onAddressBookLookupAddressChange,
  onAddressBookReset,
  onAddressBookSave,
  onAddressBookSelect,
  onUsdtAmountChange,
  onUsdtAmountUnitChange,
  onUsdtSubmit,
  onUsdtToChange,
  onUsdtToTypeChange,
  onUsdcAmountChange,
  onUsdcAmountUnitChange,
  onUsdcSubmit,
  onUsdcToChange,
  onUsdcToTypeChange,
  onCkbToTypeChange,
  onEthToTypeChange,
}: DashboardScreenProps) {
  const [selectedKey, setSelectedKey] = useState<SectionKey>(() => getSectionKeyFromHash());
  const filteredContacts = useMemo(() => {
    const normalized = addressBookFilter.trim().toLowerCase();
    if (!normalized) {
      return appState.addressBookContacts;
    }

    return appState.addressBookContacts.filter((contact) =>
      `${contact.name} ${contact.note ?? ""}`.toLowerCase().includes(normalized),
    );
  }, [addressBookFilter, appState.addressBookContacts]);

  const menuItems: MenuProps["items"] = [
    { key: "overview", icon: <DashboardOutlined />, label: "概览" },
    { key: "wallet", icon: <WalletOutlined />, label: "钱包状态" },
    { key: "transfers", icon: <SendOutlined />, label: "转账" },
    { key: "signing", icon: <SignatureOutlined />, label: "签名" },
    { key: "address-book", icon: <BookOutlined />, label: "地址簿" },
    { key: "limits", icon: <SafetyCertificateOutlined />, label: "限额管理" },
    { key: "security", icon: <KeyOutlined />, label: "安全与凭证" },
    { key: "audit", icon: <AuditOutlined />, label: "审计日志" },
  ];

  useEffect(() => {
    if (!window.location.hash || !isSectionHash(window.location.hash)) {
      window.location.hash = getHashForSection("overview");
      setSelectedKey("overview");
    }

    const handleHashChange = () => {
      setSelectedKey(getSectionKeyFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <Layout className="owner-layout">
      <Sider breakpoint="lg" collapsedWidth={72} width={248} className="owner-sider">
        <div className="owner-brand">
          <div className="owner-brand-mark">S</div>
          <div className="owner-brand-copy">
            <Title level={4}>Owner Console</Title>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => {
            const nextKey = key as SectionKey;
            window.location.hash = getHashForSection(nextKey);
            setSelectedKey(nextKey);
          }}
        />
      </Sider>

      <Layout>
        <Header className="owner-header">
          <div>
            <Title level={2}>高权限操作台</Title>
          </div>

          <Space wrap>
            <Badge
              status={appState.credential?.credentialStatus === "DEFAULT_PENDING_ROTATION" ? "warning" : "success"}
              text={formatCredentialStatus(appState.credential?.credentialStatus)}
            />
            <Button
              icon={isRefreshing ? <LoadingOutlined /> : <ReloadOutlined />}
              loading={isRefreshing}
              onClick={onRefresh}
            >
              刷新
            </Button>
            <Button danger onClick={onLogout} loading={activeAction === "logout"}>
              退出
            </Button>
          </Space>
        </Header>

        <Content className="owner-content">
          <div className="owner-page-head">
            <div>
              <Title level={2}>{getSectionTitle(selectedKey)}</Title>
              <Paragraph type="secondary">{getSectionDescription(selectedKey)}</Paragraph>
            </div>
          </div>

          {selectedKey === "overview" ? (
            <OverviewSection appState={appState} isRefreshing={isRefreshing} />
          ) : null}
          {selectedKey === "wallet" ? (
            <WalletSection appState={appState} isRefreshing={isRefreshing} />
          ) : null}
          {selectedKey === "transfers" ? (
            <TransfersSection
              activeAction={activeAction}
              ckbTransfer={ckbTransfer}
              ethTransfer={ethTransfer}
              usdcTransfer={usdcTransfer}
              usdtTransfer={usdtTransfer}
              onCkbAmountChange={onCkbAmountChange}
              onCkbAmountUnitChange={onCkbAmountUnitChange}
              onCkbSubmit={onCkbSubmit}
              onCkbToChange={onCkbToChange}
              onCkbToTypeChange={onCkbToTypeChange}
              onEthAmountChange={onEthAmountChange}
              onEthAmountUnitChange={onEthAmountUnitChange}
              onEthSubmit={onEthSubmit}
              onEthToChange={onEthToChange}
              onEthToTypeChange={onEthToTypeChange}
              onUsdcAmountChange={onUsdcAmountChange}
              onUsdcAmountUnitChange={onUsdcAmountUnitChange}
              onUsdcSubmit={onUsdcSubmit}
              onUsdcToChange={onUsdcToChange}
              onUsdcToTypeChange={onUsdcToTypeChange}
              onUsdtAmountChange={onUsdtAmountChange}
              onUsdtAmountUnitChange={onUsdtAmountUnitChange}
              onUsdtSubmit={onUsdtSubmit}
              onUsdtToChange={onUsdtToChange}
              onUsdtToTypeChange={onUsdtToTypeChange}
            />
          ) : null}
          {selectedKey === "signing" ? (
            <SigningSection
              activeAction={activeAction}
              ethereumSignForm={ethereumSignForm}
              ethereumSignResult={ethereumSignResult}
              nervosSignForm={nervosSignForm}
              nervosSignResult={nervosSignResult}
              onEthereumSignEncodingChange={onEthereumSignEncodingChange}
              onEthereumSignMessageChange={onEthereumSignMessageChange}
              onEthereumSignSubmit={onEthereumSignSubmit}
              onNervosSignEncodingChange={onNervosSignEncodingChange}
              onNervosSignMessageChange={onNervosSignMessageChange}
              onNervosSignSubmit={onNervosSignSubmit}
            />
          ) : null}
          {selectedKey === "address-book" ? (
            <AddressBookSection
              activeAction={activeAction}
              addressBookEditor={addressBookEditor}
              addressLookupAddress={addressLookupAddress}
              addressLookupResult={addressLookupResult}
              contacts={filteredContacts}
              filter={addressBookFilter}
              onAddressBookDelete={onAddressBookDelete}
              onAddressBookEditorChange={onAddressBookEditorChange}
              onAddressBookFilterChange={onAddressBookFilterChange}
              onAddressBookLookup={onAddressBookLookup}
              onAddressBookLookupAddressChange={onAddressBookLookupAddressChange}
              onAddressBookReset={onAddressBookReset}
              onAddressBookSave={onAddressBookSave}
              onAddressBookSelect={onAddressBookSelect}
            />
          ) : null}
          {selectedKey === "limits" ? (
            <LimitsSection
              activeAction={activeAction}
              assetLimitDrafts={assetLimitDrafts}
              limits={appState.assetLimits}
              onAssetLimitChange={onAssetLimitChange}
              onAssetLimitUnitChange={onAssetLimitUnitChange}
              onAssetLimitSave={onAssetLimitSave}
            />
          ) : null}
          {selectedKey === "security" ? (
            <SecuritySection
              activeAction={activeAction}
              exportedKey={exportedKey}
              importConfirmed={importConfirmed}
              importKey={importKey}
              rotateForm={rotateForm}
              onExport={onExport}
              onImport={onImport}
              onImportConfirmedChange={onImportConfirmedChange}
              onImportKeyChange={onImportKeyChange}
              onRotateCurrentPasswordChange={onRotateCurrentPasswordChange}
              onRotateNewPasswordChange={onRotateNewPasswordChange}
              onRotateSubmit={onRotateSubmit}
            />
          ) : null}
          {selectedKey === "audit" ? <AuditSection audits={appState.audits} /> : null}
        </Content>
      </Layout>
    </Layout>
  );
}

function OverviewSection({
  appState,
  isRefreshing,
}: {
  appState: AppState;
  isRefreshing: boolean;
}) {
  const configuredLimitCount = appState.assetLimits.filter(
    (limit) => limit.dailyLimit || limit.weeklyLimit || limit.monthlyLimit,
  ).length;
  const defaultCredentialPending =
    appState.credential?.credentialStatus === "DEFAULT_PENDING_ROTATION";

  return (
    <Space direction="vertical" size={16} className="owner-stack">
      <Alert
        type="warning"
        showIcon
        message="Owner 操作不受 Agent 侧限额拦截，请在执行转账、导出和导入前再次确认。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic
              title="钱包指纹"
              value={appState.current?.walletFingerprint ?? "-"}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic title="钱包状态" value={appState.current?.status ?? "-"} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic
              title="地址簿联系人"
              value={appState.addressBookContacts.length}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic title="审计记录" value={appState.audits.length} suffix="条" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="链上余额概览"
            extra={<Tag color="processing">实时视图</Tag>}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.nervos.ckbBalance?.amount,
                      appState.nervos.ckbBalance?.decimals,
                      "CKB",
                    )}
                  >
                    <Statistic
                      title="CKB"
                      value={formatCompactAssetAmount(
                        appState.nervos.ckbBalance?.amount,
                        appState.nervos.ckbBalance?.decimals,
                        "CKB",
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.ethereum.ethBalance?.amount,
                      appState.ethereum.ethBalance?.decimals,
                      "ETH",
                    )}
                  >
                    <Statistic
                      title="ETH"
                      value={formatCompactAssetAmount(
                        appState.ethereum.ethBalance?.amount,
                        appState.ethereum.ethBalance?.decimals,
                        "ETH",
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.ethereum.usdtBalance?.amount,
                      appState.ethereum.usdtBalance?.decimals,
                      "USDT",
                    )}
                  >
                    <Statistic
                      title="USDT"
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdtBalance?.amount,
                        appState.ethereum.usdtBalance?.decimals,
                        "USDT",
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.ethereum.usdcBalance?.amount,
                      appState.ethereum.usdcBalance?.decimals,
                      "USDC",
                    )}
                  >
                    <Statistic
                      title="USDC"
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdcBalance?.amount,
                        appState.ethereum.usdcBalance?.decimals,
                        "USDC",
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            title="控制台状态"
            extra={
              <Tag color={defaultCredentialPending ? "warning" : "success"}>
                {formatCredentialStatus(appState.credential?.credentialStatus)}
              </Tag>
            }
          >
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="当前钱包来源">
                {appState.current?.source ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="已配置限额资产">
                {configuredLimitCount} / {appState.assetLimits.length}
              </Descriptions.Item>
              <Descriptions.Item label="地址簿可用性">
                <Tag color={appState.addressBookContacts.length > 0 ? "success" : "default"}>
                  {appState.addressBookContacts.length > 0 ? "已就绪" : "空"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Progress
              percent={
                appState.assetLimits.length === 0
                  ? 0
                  : Math.round((configuredLimitCount / appState.assetLimits.length) * 100)
              }
              size="small"
              status="active"
              format={(percent) => `限额配置 ${percent ?? 0}%`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="风险提示" extra={<Tag color="warning">Owner 高权限</Tag>}>
            <List
              dataSource={[...OWNER_RISK_NOTICES]}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="快速摘要">
            <List
              size="small"
              dataSource={[
                <Space key="nervos-address" direction="vertical" size={4}>
                  <Text type="secondary">Nervos 地址</Text>
                  {renderAddressValue(appState.nervos.address?.address)}
                </Space>,
                <Space key="ethereum-address" direction="vertical" size={4}>
                  <Text type="secondary">Ethereum 地址</Text>
                  {renderAddressValue(appState.ethereum.address?.address)}
                </Space>,
                `最新审计数量：${appState.audits.length} 条`,
                `联系人数量：${appState.addressBookContacts.length} 个`,
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

function WalletSection({
  appState,
  isRefreshing,
}: {
  appState: AppState;
  isRefreshing: boolean;
}) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card title="当前钱包" loading={isRefreshing}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Fingerprint">
              {appState.current?.walletFingerprint ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {appState.current?.status ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="来源">
              {appState.current?.source ?? "-"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      <Col xs={24} xl={10}>
        <Card title="Nervos / CKB" loading={isRefreshing} className="owner-full-card">
          <Space direction="vertical" size={20} className="owner-stack">
            <Tooltip
              title={formatAssetAmount(
                appState.nervos.ckbBalance?.amount,
                appState.nervos.ckbBalance?.decimals,
                "CKB",
              )}
            >
              <Statistic
                title="CKB 余额"
                value={formatCompactAssetAmount(
                  appState.nervos.ckbBalance?.amount,
                  appState.nervos.ckbBalance?.decimals,
                  "CKB",
                )}
                valueStyle={{ fontSize: 32, fontWeight: 700 }}
              />
            </Tooltip>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="地址">
                {renderAddressValue(appState.nervos.address?.address)}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      </Col>

      <Col xs={24} xl={14}>
        <Card title="Ethereum" loading={isRefreshing} className="owner-full-card">
          <Space direction="vertical" size={20} className="owner-stack">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.ethereum.ethBalance?.amount,
                      appState.ethereum.ethBalance?.decimals,
                      "ETH",
                    )}
                  >
                    <Statistic
                      title="ETH 余额"
                      value={formatCompactAssetAmount(
                        appState.ethereum.ethBalance?.amount,
                        appState.ethereum.ethBalance?.decimals,
                        "ETH",
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.ethereum.usdtBalance?.amount,
                      appState.ethereum.usdtBalance?.decimals,
                      "USDT",
                    )}
                  >
                    <Statistic
                      title="USDT 余额"
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdtBalance?.amount,
                        appState.ethereum.usdtBalance?.decimals,
                        "USDT",
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.ethereum.usdcBalance?.amount,
                      appState.ethereum.usdcBalance?.decimals,
                      "USDC",
                    )}
                  >
                    <Statistic
                      title="USDC 余额"
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdcBalance?.amount,
                        appState.ethereum.usdcBalance?.decimals,
                        "USDC",
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
            </Row>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="地址">
                {renderAddressValue(appState.ethereum.address?.address)}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

function TransfersSection(
  props: Pick<
    DashboardScreenProps,
    | "activeAction"
    | "ckbTransfer"
    | "ethTransfer"
    | "usdcTransfer"
    | "usdtTransfer"
    | "onCkbAmountChange"
    | "onCkbAmountUnitChange"
    | "onCkbSubmit"
    | "onCkbToChange"
    | "onCkbToTypeChange"
    | "onEthAmountChange"
    | "onEthAmountUnitChange"
    | "onEthSubmit"
    | "onEthToChange"
    | "onEthToTypeChange"
    | "onUsdcAmountChange"
    | "onUsdcAmountUnitChange"
    | "onUsdcSubmit"
    | "onUsdcToChange"
    | "onUsdcToTypeChange"
    | "onUsdtAmountChange"
    | "onUsdtAmountUnitChange"
    | "onUsdtSubmit"
    | "onUsdtToChange"
    | "onUsdtToTypeChange"
  >,
) {
  return (
    <Tabs
      items={[
        {
          key: "nervos",
          label: "Nervos",
          children: (
            <TransferCard
              actionKey="transfer-ckb"
              activeAction={props.activeAction}
              asset="CKB"
              description="最小单位整数，100000000 = 1 CKB"
              form={props.ckbTransfer}
              onAmountChange={props.onCkbAmountChange}
              onAmountUnitChange={props.onCkbAmountUnitChange}
              onSubmit={props.onCkbSubmit}
              onToChange={props.onCkbToChange}
              onToTypeChange={props.onCkbToTypeChange}
            />
          ),
        },
        {
          key: "ethereum",
          label: "Ethereum",
          children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={8}>
                <TransferCard
                  actionKey="transfer-eth"
                  activeAction={props.activeAction}
                  asset="ETH"
                  description="最小单位整数，1000000000000000000 = 1 ETH"
                  form={props.ethTransfer}
                  onAmountChange={props.onEthAmountChange}
                  onAmountUnitChange={props.onEthAmountUnitChange}
                  onSubmit={props.onEthSubmit}
                  onToChange={props.onEthToChange}
                  onToTypeChange={props.onEthToTypeChange}
                />
              </Col>
              <Col xs={24} xl={8}>
                <TransferCard
                  actionKey="transfer-usdt"
                  activeAction={props.activeAction}
                  asset="USDT"
                  description="最小单位整数，1000000 = 1 USDT"
                  form={props.usdtTransfer}
                  onAmountChange={props.onUsdtAmountChange}
                  onAmountUnitChange={props.onUsdtAmountUnitChange}
                  onSubmit={props.onUsdtSubmit}
                  onToChange={props.onUsdtToChange}
                  onToTypeChange={props.onUsdtToTypeChange}
                />
              </Col>
              <Col xs={24} xl={8}>
                <TransferCard
                  actionKey="transfer-usdc"
                  activeAction={props.activeAction}
                  asset="USDC"
                  description="最小单位整数，1000000 = 1 USDC"
                  form={props.usdcTransfer}
                  onAmountChange={props.onUsdcAmountChange}
                  onAmountUnitChange={props.onUsdcAmountUnitChange}
                  onSubmit={props.onUsdcSubmit}
                  onToChange={props.onUsdcToChange}
                  onToTypeChange={props.onUsdcToTypeChange}
                />
              </Col>
            </Row>
          ),
        },
      ]}
    />
  );
}

function TransferCard({
  actionKey,
  activeAction,
  asset,
  description,
  form,
  onAmountChange,
  onAmountUnitChange,
  onSubmit,
  onToChange,
  onToTypeChange,
}: {
  actionKey: string;
  activeAction: string | null;
  asset: SupportedAsset;
  description: string;
  form: CkbTransferFormState | EthTransferFormState | UsdtTransferFormState | UsdcTransferFormState;
  onAmountChange: (value: string) => void;
  onAmountUnitChange: (unit: AssetAmountUnit) => void;
  onSubmit: () => void;
  onToChange: (value: string) => void;
  onToTypeChange: (value: "address" | "contact_name") => void;
}) {
  const amountValidation = validateAmountInput(asset, form.amount, {
    allowEmpty: true,
    requirePositive: true,
  });

  return (
    <Card title={`${asset} 转账`}>
      <Form layout="vertical">
        <Form.Item label="目标类型">
          <Radio.Group
            value={form.toType}
            onChange={(event) => onToTypeChange(event.target.value as "address" | "contact_name")}
          >
            <Radio.Button value="address">原始地址</Radio.Button>
            <Radio.Button value="contact_name">联系人名称</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label={form.toType === "address" ? "目标地址" : "联系人名称"}>
          <Input value={form.to} onChange={(event) => onToChange(event.target.value)} />
        </Form.Item>
        <Form.Item
          label={`数量 (${description})`}
          validateStatus={amountValidation.error ? "error" : undefined}
          help={
            amountValidation.error
              ? amountValidation.error
              : amountValidation.baseValue
                ? `基础单位值：${amountValidation.baseValue}`
                : getAmountInputHint(asset, form.amount.unit)
          }
        >
          <Space.Compact className="owner-compact-row">
            <Input
              value={form.amount.value}
              onChange={(event) => onAmountChange(event.target.value)}
            />
            <Select
              value={form.amount.unit}
              options={getAmountUnitOptions(asset)}
              onChange={(value) => onAmountUnitChange(value)}
              style={{ width: 132 }}
            />
          </Space.Compact>
        </Form.Item>
        <Button type="primary" onClick={onSubmit} loading={activeAction === actionKey}>
          提交 {asset} 转账
        </Button>
      </Form>
    </Card>
  );
}

function AmountInputField({
  asset,
  input,
  label,
  onUnitChange,
  onValueChange,
}: {
  asset: SupportedAsset;
  input: AssetAmountInputState;
  label: string;
  onUnitChange: (unit: AssetAmountUnit) => void;
  onValueChange: (value: string) => void;
}) {
  const validation = validateAmountInput(asset, input, {
    allowEmpty: true,
  });

  return (
    <Form.Item
      label={label}
      validateStatus={validation.error ? "error" : undefined}
      help={
        validation.error
          ? validation.error
          : validation.baseValue
            ? `基础单位值：${validation.baseValue}`
            : getAmountInputHint(asset, input.unit)
      }
    >
      <Space.Compact className="owner-compact-row">
        <Input
          placeholder="留空表示不限额"
          value={input.value}
          onChange={(event) => onValueChange(event.target.value)}
        />
        <Select
          value={input.unit}
          options={getAmountUnitOptions(asset)}
          onChange={(value) => onUnitChange(value)}
          style={{ width: 132 }}
        />
      </Space.Compact>
    </Form.Item>
  );
}

function SigningSection(
  props: Pick<
    DashboardScreenProps,
    | "activeAction"
    | "ethereumSignForm"
    | "ethereumSignResult"
    | "nervosSignForm"
    | "nervosSignResult"
    | "onEthereumSignEncodingChange"
    | "onEthereumSignMessageChange"
    | "onEthereumSignSubmit"
    | "onNervosSignEncodingChange"
    | "onNervosSignMessageChange"
    | "onNervosSignSubmit"
  >,
) {
  return (
    <Tabs
      items={[
        {
          key: "nervos",
          label: "Nervos",
          children: (
            <SignCard
              actionKey="sign-nervos"
              activeAction={props.activeAction}
              title="Nervos 消息签名"
              result={props.nervosSignResult}
              value={props.nervosSignForm}
              onEncodingChange={props.onNervosSignEncodingChange}
              onMessageChange={props.onNervosSignMessageChange}
              onSubmit={props.onNervosSignSubmit}
            />
          ),
        },
        {
          key: "ethereum",
          label: "Ethereum",
          children: (
            <SignCard
              actionKey="sign-ethereum"
              activeAction={props.activeAction}
              title="Ethereum 消息签名"
              result={props.ethereumSignResult}
              value={props.ethereumSignForm}
              onEncodingChange={props.onEthereumSignEncodingChange}
              onMessageChange={props.onEthereumSignMessageChange}
              onSubmit={props.onEthereumSignSubmit}
            />
          ),
        },
      ]}
    />
  );
}

function SignCard({
  actionKey,
  activeAction,
  title,
  result,
  value,
  onEncodingChange,
  onMessageChange,
  onSubmit,
}: {
  actionKey: string;
  activeAction: string | null;
  title: string;
  result: string;
  value: MessageSigningFormState;
  onEncodingChange: (value: MessageSigningFormState["encoding"]) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Card title={title}>
      <Form layout="vertical">
        <Form.Item label="消息">
          <TextArea rows={6} value={value.message} onChange={(event) => onMessageChange(event.target.value)} />
        </Form.Item>
        <Form.Item label="编码">
          <Radio.Group
            value={value.encoding}
            onChange={(event) => onEncodingChange(event.target.value as MessageSigningFormState["encoding"])}
          >
            <Radio.Button value="utf8">utf8</Radio.Button>
            <Radio.Button value="hex">hex</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Button type="primary" onClick={onSubmit} loading={activeAction === actionKey}>
          提交签名
        </Button>
      </Form>

      {result ? (
        <Card size="small" className="owner-result-card">
          <Paragraph copyable={{ text: result }} className="owner-pre">
            {result}
          </Paragraph>
        </Card>
      ) : null}
    </Card>
  );
}

function AddressBookSection({
  activeAction,
  addressBookEditor,
  addressLookupAddress,
  addressLookupResult,
  contacts,
  filter,
  onAddressBookDelete,
  onAddressBookEditorChange,
  onAddressBookFilterChange,
  onAddressBookLookup,
  onAddressBookLookupAddressChange,
  onAddressBookReset,
  onAddressBookSave,
  onAddressBookSelect,
}: {
  activeAction: string | null;
  addressBookEditor: AddressBookEditorState;
  addressLookupAddress: string;
  addressLookupResult: AddressBookLookupByAddressResponse | null;
  contacts: AddressBookContactDto[];
  filter: string;
  onAddressBookDelete: () => Promise<void>;
  onAddressBookEditorChange: (
    field: keyof Omit<AddressBookEditorState, "currentName">,
    value: string,
  ) => void;
  onAddressBookFilterChange: (value: string) => void;
  onAddressBookLookup: () => void;
  onAddressBookLookupAddressChange: (value: string) => void;
  onAddressBookReset: () => void;
  onAddressBookSave: () => Promise<void>;
  onAddressBookSelect: (contact: AddressBookContactDto) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);

  const columns: TableColumnsType<AddressBookContactDto> = [
    {
      title: "联系人",
      dataIndex: "name",
      key: "name",
      width: 180,
      ellipsis: true,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            onAddressBookSelect(record);
            setEditorOpen(true);
          }}
        >
          {record.name}
        </Button>
      ),
    },
    {
      title: "Nervos",
      key: "nervosAddress",
      width: 240,
      render: (_, record) =>
        renderAddressCell(record.addresses.nervosAddress),
    },
    {
      title: "Ethereum",
      key: "ethereumAddress",
      width: 240,
      render: (_, record) =>
        renderAddressCell(record.addresses.ethereumAddress),
    },
    {
      title: "备注",
      dataIndex: "note",
      key: "note",
      width: 180,
      ellipsis: true,
      render: (value: string | null) => value ?? "-",
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            onClick={() => {
              onAddressBookSelect(record);
              setEditorOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              onAddressBookSelect(record);
              void handleDelete();
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  async function handleSave() {
    await onAddressBookSave();
    setEditorOpen(false);
  }

  async function handleDelete() {
    await onAddressBookDelete();
    setEditorOpen(false);
  }

  return (
    <Space direction="vertical" size={16} className="owner-stack">
      <Card
        title="联系人列表"
        extra={
          <Space wrap>
            <Input
              placeholder="按名称或备注筛选"
              value={filter}
              onChange={(event) => onAddressBookFilterChange(event.target.value)}
              style={{ width: 240 }}
            />
            <Button
              type="primary"
              onClick={() => {
                onAddressBookReset();
                setEditorOpen(true);
              }}
            >
              新建联系人
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="name"
          columns={columns}
          dataSource={contacts}
          pagination={{ pageSize: 6 }}
          tableLayout="fixed"
          scroll={{ x: 1040 }}
          locale={{ emptyText: <Empty description="暂无联系人" /> }}
        />
      </Card>

      <Card title="地址反查">
        <Space direction="vertical" size={16} className="owner-stack">
          <Space.Compact className="owner-compact-row">
            <Input
              placeholder="输入 CKB / Ethereum 地址"
              value={addressLookupAddress}
              onChange={(event) => onAddressBookLookupAddressChange(event.target.value)}
            />
            <Button
              type="primary"
              onClick={onAddressBookLookup}
              loading={activeAction === "address-book-lookup"}
            >
              查询
            </Button>
          </Space.Compact>

          {addressLookupResult ? (
            <Alert
              type={addressLookupResult.matched ? "success" : "info"}
              showIcon
              message={
                addressLookupResult.matched
                  ? `匹配成功${addressLookupResult.chain ? ` · ${addressLookupResult.chain}` : ""}`
                  : "未匹配到联系人"
              }
              description={
                <Space direction="vertical">
                  <Text>{addressLookupResult.address}</Text>
                  <Space wrap>
                    {addressLookupResult.contacts.length > 0
                      ? addressLookupResult.contacts.map((contact) => (
                          <Tag key={contact}>{contact}</Tag>
                        ))
                      : "当前没有命中联系人"}
                  </Space>
                </Space>
              }
            />
          ) : null}
        </Space>
      </Card>

      <Modal
        destroyOnHidden={false}
        open={editorOpen}
        title={addressBookEditor.currentName ? "编辑联系人" : "新建联系人"}
        onCancel={() => setEditorOpen(false)}
        footer={
          <Space wrap>
            {addressBookEditor.currentName ? (
              <Button
                danger
                onClick={() => void handleDelete()}
                loading={activeAction === "address-book-delete"}
              >
                删除联系人
              </Button>
            ) : null}
            <Button onClick={() => setEditorOpen(false)}>取消</Button>
            <Button
              type="primary"
              onClick={() => void handleSave()}
              loading={activeAction === "address-book-save"}
            >
              {addressBookEditor.currentName ? "保存联系人" : "创建联系人"}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical">
          <Form.Item label="联系人名称">
            <Input
              value={addressBookEditor.name}
              onChange={(event) => onAddressBookEditorChange("name", event.target.value)}
            />
          </Form.Item>
          <Form.Item label="Nervos 地址">
            <Input
              value={addressBookEditor.nervosAddress}
              onChange={(event) =>
                onAddressBookEditorChange("nervosAddress", event.target.value)
              }
            />
          </Form.Item>
          <Form.Item label="Ethereum 地址">
            <Input
              value={addressBookEditor.ethereumAddress}
              onChange={(event) =>
                onAddressBookEditorChange("ethereumAddress", event.target.value)
              }
            />
          </Form.Item>
          <Form.Item label="备注">
            <TextArea
              rows={3}
              value={addressBookEditor.note}
              onChange={(event) => onAddressBookEditorChange("note", event.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function LimitsSection({
  activeAction,
  assetLimitDrafts,
  limits,
  onAssetLimitChange,
  onAssetLimitUnitChange,
  onAssetLimitSave,
}: {
  activeAction: string | null;
  assetLimitDrafts: Record<string, AssetLimitFormState>;
  limits: OwnerAssetLimitEntryDto[];
  onAssetLimitChange: (
    key: string,
    field: keyof AssetLimitFormState,
    value: string,
  ) => void;
  onAssetLimitUnitChange: (
    key: string,
    field: keyof AssetLimitFormState,
    unit: AssetAmountUnit,
  ) => void;
  onAssetLimitSave: (key: string) => void;
}) {
  return (
    <Tabs
      items={[
        {
          key: "nervos",
          label: "Nervos",
          children: renderLimitCards({
            activeAction,
            assetLimitDrafts,
            limits: limits.filter((limit) => limit.chain === "nervos"),
            onAssetLimitChange,
            onAssetLimitSave,
            onAssetLimitUnitChange,
          }),
        },
        {
          key: "ethereum",
          label: "Ethereum",
          children: renderLimitCards({
            activeAction,
            assetLimitDrafts,
            limits: limits.filter((limit) => limit.chain === "ethereum"),
            onAssetLimitChange,
            onAssetLimitSave,
            onAssetLimitUnitChange,
          }),
        },
      ]}
    />
  );
}

function renderLimitCards({
  activeAction,
  assetLimitDrafts,
  limits,
  onAssetLimitChange,
  onAssetLimitSave,
  onAssetLimitUnitChange,
}: {
  activeAction: string | null;
  assetLimitDrafts: Record<string, AssetLimitFormState>;
  limits: OwnerAssetLimitEntryDto[];
  onAssetLimitChange: (
    key: string,
    field: keyof AssetLimitFormState,
    value: string,
  ) => void;
  onAssetLimitSave: (key: string) => void;
  onAssetLimitUnitChange: (
    key: string,
    field: keyof AssetLimitFormState,
    unit: AssetAmountUnit,
  ) => void;
}) {
  return (
    <Row gutter={[16, 16]}>
      {limits.map((limit) => {
        const key = `${limit.chain}:${limit.asset}`;
        const draft = assetLimitDrafts[key] ?? {
          dailyLimit: { value: "", unit: "display" },
          weeklyLimit: { value: "", unit: "display" },
          monthlyLimit: { value: "", unit: "display" },
        };
        const asset = limit.asset as SupportedAsset;

        return (
          <Col xs={24} xl={12} key={key}>
            <Card
              title={limit.asset}
              extra={
                <Button
                  type="primary"
                  onClick={() => onAssetLimitSave(key)}
                  loading={activeAction === `limit:${key}`}
                >
                  保存
                </Button>
              }
            >
              <Form layout="vertical">
                <AmountInputField
                  asset={asset}
                  input={draft.dailyLimit}
                  label="日限额"
                  onUnitChange={(unit) => onAssetLimitUnitChange(key, "dailyLimit", unit)}
                  onValueChange={(value) => onAssetLimitChange(key, "dailyLimit", value)}
                />
                <AmountInputField
                  asset={asset}
                  input={draft.weeklyLimit}
                  label="周限额"
                  onUnitChange={(unit) => onAssetLimitUnitChange(key, "weeklyLimit", unit)}
                  onValueChange={(value) => onAssetLimitChange(key, "weeklyLimit", value)}
                />
                <AmountInputField
                  asset={asset}
                  input={draft.monthlyLimit}
                  label="月限额"
                  onUnitChange={(unit) => onAssetLimitUnitChange(key, "monthlyLimit", unit)}
                  onValueChange={(value) => onAssetLimitChange(key, "monthlyLimit", value)}
                />
              </Form>

              <Row gutter={[12, 12]}>
                {renderUsageCard("日", limit.usage.daily)}
                {renderUsageCard("周", limit.usage.weekly)}
                {renderUsageCard("月", limit.usage.monthly)}
              </Row>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

function renderUsageCard(
  label: string,
  usage: OwnerAssetLimitEntryDto["usage"][keyof OwnerAssetLimitEntryDto["usage"]],
) {
  return (
    <Col xs={24} md={8} key={label}>
      <Card size="small" className="inner-card">
        <Space direction="vertical" size={4}>
          <Text strong>{label}窗口</Text>
          <Text type="secondary">配置：{usage.limitAmount ?? "不限额"}</Text>
          <Text type="secondary">已消耗：{usage.consumedAmount}</Text>
          <Text type="secondary">已预占：{usage.reservedAmount}</Text>
          <Text type="secondary">有效已用：{usage.effectiveUsedAmount}</Text>
          <Text type="secondary">剩余：{usage.remainingAmount ?? "不限额"}</Text>
          <Text type="secondary">重置：{usage.resetsAt}</Text>
        </Space>
      </Card>
    </Col>
  );
}

function renderAddressCell(address: string | null | undefined) {
  if (!address) {
    return "-";
  }

  return (
    renderAddressValue(address)
  );
}

function renderAddressValue(address: string | null | undefined) {
  if (!address) {
    return "-";
  }

  return (
    <Tooltip title={address}>
      <Paragraph copyable={{ text: address }} style={{ marginBottom: 0 }}>
        {truncateAddress(address, 12, 8)}
      </Paragraph>
    </Tooltip>
  );
}

function truncateAddress(value: string, start: number, end: number): string {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function SecuritySection({
  activeAction,
  exportedKey,
  importConfirmed,
  importKey,
  rotateForm,
  onExport,
  onImport,
  onImportConfirmedChange,
  onImportKeyChange,
  onRotateCurrentPasswordChange,
  onRotateNewPasswordChange,
  onRotateSubmit,
}: {
  activeAction: string | null;
  exportedKey: string;
  importConfirmed: boolean;
  importKey: string;
  rotateForm: RotateCredentialFormState;
  onExport: () => void;
  onImport: () => void;
  onImportConfirmedChange: (value: boolean) => void;
  onImportKeyChange: (value: string) => void;
  onRotateCurrentPasswordChange: (value: string) => void;
  onRotateNewPasswordChange: (value: string) => void;
  onRotateSubmit: () => void;
}) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={8}>
        <Card title="凭证轮换">
          <Form layout="vertical">
            <Form.Item label="当前密码">
              <Input.Password
                value={rotateForm.currentPassword}
                onChange={(event) => onRotateCurrentPasswordChange(event.target.value)}
              />
            </Form.Item>
            <Form.Item label="新密码">
              <Input.Password
                value={rotateForm.newPassword}
                onChange={(event) => onRotateNewPasswordChange(event.target.value)}
              />
            </Form.Item>
            <Button
              type="primary"
              onClick={onRotateSubmit}
              loading={activeAction === "rotate-credential"}
            >
              更新凭证
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <Card title="导入恢复">
          <Alert
            type="warning"
            showIcon
            message="导入会直接替换当前唯一钱包，仅建议在恢复场景下使用。"
          />
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="私钥">
              <TextArea
                rows={7}
                value={importKey}
                onChange={(event) => onImportKeyChange(event.target.value)}
              />
            </Form.Item>
            <Form.Item label="确认替换">
              <Switch checked={importConfirmed} onChange={onImportConfirmedChange} />
            </Form.Item>
            <Button
              danger
              type="primary"
              onClick={onImport}
              disabled={!importConfirmed || importKey.trim().length === 0}
              loading={activeAction === "import-wallet"}
            >
              导入并替换钱包
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <Card title="高风险导出">
          <Alert
            type="error"
            showIcon
            message="导出私钥后，Owner 将直接掌握钱包控制权。"
          />
          <Space direction="vertical" size={16} className="owner-stack" style={{ marginTop: 16 }}>
            <Button
              danger
              type="primary"
              onClick={onExport}
              loading={activeAction === "export-wallet"}
            >
              导出私钥
            </Button>

            {exportedKey ? (
              <Card size="small" className="owner-result-card">
                <Paragraph copyable={{ text: exportedKey }} className="owner-pre">
                  {exportedKey}
                </Paragraph>
              </Card>
            ) : null}
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

function AuditSection({ audits }: { audits: AuditLogDto[] }) {
  const columns: TableColumnsType<AuditLogDto> = [
    {
      title: "动作",
      dataIndex: "action",
      key: "action",
    },
    {
      title: "角色",
      dataIndex: "actorRole",
      key: "actorRole",
      render: (value: string) => <Tag color={value === "OWNER" ? "green" : "default"}>{value}</Tag>,
    },
    {
      title: "结果",
      dataIndex: "result",
      key: "result",
      render: (value: string) => (
        <Tag color={value === "SUCCESS" ? "success" : value === "FAILURE" ? "error" : "default"}>
          {value}
        </Tag>
      ),
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <Card title="审计日志">
      <Table
        rowKey="auditId"
        columns={columns}
        dataSource={audits}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="暂无审计记录" /> }}
      />
    </Card>
  );
}

function getSectionTitle(key: SectionKey): string {
  switch (key) {
    case "overview":
      return "概览";
    case "wallet":
      return "钱包状态";
    case "transfers":
      return "转账";
    case "signing":
      return "签名";
    case "address-book":
      return "地址簿";
    case "limits":
      return "限额管理";
    case "security":
      return "安全与凭证";
    case "audit":
      return "审计日志";
  }
}

function getSectionDescription(key: SectionKey): string {
  switch (key) {
    case "overview":
      return "面向人工接管场景的总览视图，聚合余额、风险提示和当前钱包状态。";
    case "wallet":
      return "按链查看当前唯一钱包的地址与余额，不默认铺开交易细节。";
    case "transfers":
      return "按资产拆分转账操作，支持直接输入地址或地址簿联系人名称。";
    case "signing":
      return "执行链上消息签名，返回签名地址与签名结果。";
    case "address-book":
      return "维护共享联系人，支持筛选、编辑和精确地址反查。";
    case "limits":
      return "查看并调整按资产维度的日、周、月限额配置与使用情况。";
    case "security":
      return "处理凭证轮换、钱包导入恢复和高风险私钥导出。";
    case "audit":
      return "查看最新 Owner 操作审计记录。";
  }
}

function getHashForSection(key: SectionKey): string {
  return `#/${key}`;
}

function getSectionKeyFromHash(hash = window.location.hash): SectionKey {
  const normalized = hash.replace(/^#?\/?/, "");
  switch (normalized) {
    case "wallet":
    case "transfers":
    case "signing":
    case "address-book":
    case "limits":
    case "security":
    case "audit":
      return normalized;
    case "overview":
    default:
      return "overview";
  }
}

function isSectionHash(hash: string): boolean {
  const normalized = hash.replace(/^#?\/?/, "");
  return (
    normalized === "overview" ||
    normalized === "wallet" ||
    normalized === "transfers" ||
    normalized === "signing" ||
    normalized === "address-book" ||
    normalized === "limits" ||
    normalized === "security" ||
    normalized === "audit"
  );
}

function formatCredentialStatus(status?: string | null): string {
  if (!status) {
    return "凭证状态未知";
  }

  return status === "DEFAULT_PENDING_ROTATION" ? "默认凭证待轮换" : "凭证已轮换";
}

function formatAssetAmount(
  amount: string | undefined,
  decimals: number | undefined,
  asset: string,
): string {
  if (!amount || decimals === undefined) {
    return "-";
  }

  return `${toDisplayAmount(amount, decimals)} ${asset}`;
}

function formatCompactAssetAmount(
  amount: string | undefined,
  decimals: number | undefined,
  asset: string,
): string {
  if (!amount || decimals === undefined) {
    return "-";
  }

  const display = toDisplayAmount(amount, decimals);
  const [whole, fraction = ""] = display.split(".");
  const compactFraction = fraction.slice(0, 6).replace(/0+$/, "");
  const compactValue = compactFraction ? `${whole}.${compactFraction}` : whole;

  return `${compactValue} ${asset}`;
}

function toDisplayAmount(amount: string, decimals: number): string {
  if (decimals === 0) {
    return amount;
  }

  const normalized = amount.replace(/^0+(?=\d)/, "");
  const padded = normalized.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole;
}
