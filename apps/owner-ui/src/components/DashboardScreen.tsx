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
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLocalization } from "../localization";
import { OWNER_RISK_NOTICE_KEYS, type AppState } from "../types/app-state";
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
  const { formatDateTime, formatDecimalString, formatNumber, t } = useLocalization();
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
    { key: "overview", icon: <DashboardOutlined />, label: t("menu.overview") },
    { key: "wallet", icon: <WalletOutlined />, label: t("menu.wallet") },
    { key: "transfers", icon: <SendOutlined />, label: t("menu.transfers") },
    { key: "signing", icon: <SignatureOutlined />, label: t("menu.signing") },
    { key: "address-book", icon: <BookOutlined />, label: t("menu.address_book") },
    { key: "limits", icon: <SafetyCertificateOutlined />, label: t("menu.limits") },
    { key: "security", icon: <KeyOutlined />, label: t("menu.security") },
    { key: "audit", icon: <AuditOutlined />, label: t("menu.audit") },
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
            <Title level={4}>{t("brand.owner_console")}</Title>
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
            <Title level={2}>{t("header.title")}</Title>
          </div>

          <Space wrap>
            <Badge
              status={appState.credential?.credentialStatus === "DEFAULT_PENDING_ROTATION" ? "warning" : "success"}
              text={formatCredentialStatus(appState.credential?.credentialStatus, t)}
            />
            <LanguageSwitcher />
            <Button
              icon={isRefreshing ? <LoadingOutlined /> : <ReloadOutlined />}
              loading={isRefreshing}
              onClick={onRefresh}
            >
              {t("header.refresh")}
            </Button>
            <Button danger onClick={onLogout} loading={activeAction === "logout"}>
              {t("header.logout")}
            </Button>
          </Space>
        </Header>

        <Content className="owner-content">
          <div className="owner-page-head">
            <div>
              <Title level={2}>{getSectionTitle(selectedKey, t)}</Title>
              <Paragraph type="secondary">{getSectionDescription(selectedKey, t)}</Paragraph>
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
  const { formatDecimalString, formatNumber, t } = useLocalization();
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
        message={t("overview.alert.owner_bypass")}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic
              title={t("overview.stat.wallet_fingerprint")}
              value={appState.current?.walletFingerprint ?? "-"}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic
              title={t("overview.stat.wallet_status")}
              value={formatWalletStatus(appState.current?.status, t)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic
              title={t("overview.stat.address_book_contacts")}
              value={appState.addressBookContacts.length}
              formatter={(value) => formatNumber(Number(value ?? 0))}
              suffix={t("common.page_item.contacts")}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={isRefreshing}>
            <Statistic
              title={t("overview.stat.audit_records")}
              value={appState.audits.length}
              formatter={(value) => formatNumber(Number(value ?? 0))}
              suffix={t("common.page_item.records")}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={t("overview.card.balance_summary")}
            extra={<Tag color="processing">{t("overview.card.live_tag")}</Tag>}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.nervos.ckbBalance?.amount,
                      appState.nervos.ckbBalance?.decimals,
                      "CKB",
                      formatDecimalString,
                    )}
                  >
                    <Statistic
                      title="CKB"
                      value={formatCompactAssetAmount(
                        appState.nervos.ckbBalance?.amount,
                        appState.nervos.ckbBalance?.decimals,
                        "CKB",
                        formatDecimalString,
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
                      formatDecimalString,
                    )}
                  >
                    <Statistic
                      title="ETH"
                      value={formatCompactAssetAmount(
                        appState.ethereum.ethBalance?.amount,
                        appState.ethereum.ethBalance?.decimals,
                        "ETH",
                        formatDecimalString,
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
                      formatDecimalString,
                    )}
                  >
                    <Statistic
                      title="USDT"
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdtBalance?.amount,
                        appState.ethereum.usdtBalance?.decimals,
                        "USDT",
                        formatDecimalString,
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
                      formatDecimalString,
                    )}
                  >
                    <Statistic
                      title="USDC"
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdcBalance?.amount,
                        appState.ethereum.usdcBalance?.decimals,
                        "USDC",
                        formatDecimalString,
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
            title={t("overview.card.console_status")}
            extra={
              <Tag color={defaultCredentialPending ? "warning" : "success"}>
                {formatCredentialStatus(appState.credential?.credentialStatus, t)}
              </Tag>
            }
          >
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t("overview.card.current_wallet_source")}>
                {formatWalletSource(appState.current?.source, t)}
              </Descriptions.Item>
              <Descriptions.Item label={t("overview.card.configured_limit_assets")}>
                {formatNumber(configuredLimitCount)} / {formatNumber(appState.assetLimits.length)}
              </Descriptions.Item>
              <Descriptions.Item label={t("overview.card.address_book_availability")}>
                <Tag color={appState.addressBookContacts.length > 0 ? "success" : "default"}>
                  {appState.addressBookContacts.length > 0
                    ? t("address_book.state.ready")
                    : t("address_book.state.empty")}
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
              format={(percent) =>
                t("overview.card.limit_progress", {
                  percent: formatNumber(percent ?? 0),
                })
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={t("overview.card.risk_notices")}
            extra={<Tag color="warning">{t("overview.card.high_privilege")}</Tag>}
          >
            <List
              dataSource={[...OWNER_RISK_NOTICE_KEYS]}
              renderItem={(item) => (
                <List.Item>
                  <Text>{t(item)}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title={t("overview.card.quick_summary")}>
            <List
              size="small"
              dataSource={[
                <Space key="nervos-address" direction="vertical" size={4}>
                  <Text type="secondary">{t("overview.summary.nervos_address")}</Text>
                  {renderAddressValue(appState.nervos.identity?.address)}
                </Space>,
                <Space key="ethereum-address" direction="vertical" size={4}>
                  <Text type="secondary">{t("overview.summary.ethereum_address")}</Text>
                  {renderAddressValue(appState.ethereum.identity?.address)}
                </Space>,
                t("overview.summary.latest_audit_count", {
                  count: formatNumber(appState.audits.length),
                }),
                t("overview.summary.contact_count", {
                  count: formatNumber(appState.addressBookContacts.length),
                }),
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
  const { t, formatDecimalString } = useLocalization();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card title={t("wallet.card.current_wallet")} loading={isRefreshing}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t("wallet.field.fingerprint")}>
              {appState.current?.walletFingerprint ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label={t("wallet.field.status")}>
              {formatWalletStatus(appState.current?.status, t)}
            </Descriptions.Item>
            <Descriptions.Item label={t("wallet.field.source")}>
              {formatWalletSource(appState.current?.source, t)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      <Col xs={24} xl={10}>
        <Card title={t("wallet.card.nervos_balance")} loading={isRefreshing} className="owner-full-card">
          <Space direction="vertical" size={20} className="owner-stack">
            <Tooltip
              title={formatAssetAmount(
                appState.nervos.ckbBalance?.amount,
                appState.nervos.ckbBalance?.decimals,
                "CKB",
                formatDecimalString,
              )}
            >
              <Statistic
                title={t("wallet.balance.label", { asset: "CKB" })}
                value={formatCompactAssetAmount(
                  appState.nervos.ckbBalance?.amount,
                  appState.nervos.ckbBalance?.decimals,
                  "CKB",
                  formatDecimalString,
                )}
                valueStyle={{ fontSize: 32, fontWeight: 700 }}
              />
            </Tooltip>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t("wallet.field.address")}>
                {renderAddressValue(appState.nervos.identity?.address)}
              </Descriptions.Item>
              <Descriptions.Item label={t("wallet.field.public_key")}>
                {renderAddressValue(appState.nervos.identity?.publicKey)}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      </Col>

      <Col xs={24} xl={14}>
        <Card title={t("wallet.card.ethereum_balance")} loading={isRefreshing} className="owner-full-card">
          <Space direction="vertical" size={20} className="owner-stack">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" className="inner-card owner-balance-card">
                  <Tooltip
                    title={formatAssetAmount(
                      appState.ethereum.ethBalance?.amount,
                      appState.ethereum.ethBalance?.decimals,
                      "ETH",
                      formatDecimalString,
                    )}
                  >
                    <Statistic
                      title={t("wallet.balance.label", { asset: "ETH" })}
                      value={formatCompactAssetAmount(
                        appState.ethereum.ethBalance?.amount,
                        appState.ethereum.ethBalance?.decimals,
                        "ETH",
                        formatDecimalString,
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
                      formatDecimalString,
                    )}
                  >
                    <Statistic
                      title={t("wallet.balance.label", { asset: "USDT" })}
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdtBalance?.amount,
                        appState.ethereum.usdtBalance?.decimals,
                        "USDT",
                        formatDecimalString,
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
                      formatDecimalString,
                    )}
                  >
                    <Statistic
                      title={t("wallet.balance.label", { asset: "USDC" })}
                      value={formatCompactAssetAmount(
                        appState.ethereum.usdcBalance?.amount,
                        appState.ethereum.usdcBalance?.decimals,
                        "USDC",
                        formatDecimalString,
                      )}
                      valueStyle={{ fontSize: 28, fontWeight: 700 }}
                    />
                  </Tooltip>
                </Card>
              </Col>
            </Row>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t("wallet.field.address")}>
                {renderAddressValue(appState.ethereum.identity?.address)}
              </Descriptions.Item>
              <Descriptions.Item label={t("wallet.field.public_key")}>
                {renderAddressValue(appState.ethereum.identity?.publicKey)}
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
  const { t } = useLocalization();

  return (
    <Tabs
      items={[
        {
          key: "nervos",
          label: t("tab.nervos"),
          children: (
            <TransferCard
              actionKey="transfer-ckb"
              activeAction={props.activeAction}
              asset="CKB"
              description={t("transfers.description.CKB")}
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
          label: t("tab.ethereum"),
          children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={8}>
                <TransferCard
                  actionKey="transfer-eth"
                  activeAction={props.activeAction}
                  asset="ETH"
                  description={t("transfers.description.ETH")}
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
                  description={t("transfers.description.USDT")}
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
                  description={t("transfers.description.USDC")}
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
  const { t } = useLocalization();
  const amountValidation = validateAmountInput(
    asset,
    form.amount,
    {
      allowEmpty: true,
      requirePositive: true,
    },
    t,
  );

  return (
    <Card title={t("transfers.card.title", { asset })}>
      <Form layout="vertical">
        <Form.Item label={t("transfers.target_type")}>
          <Radio.Group
            value={form.toType}
            onChange={(event) => onToTypeChange(event.target.value as "address" | "contact_name")}
          >
            <Radio.Button value="address">{t("transfers.target_type.address")}</Radio.Button>
            <Radio.Button value="contact_name">{t("transfers.target_type.contact_name")}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={
            form.toType === "address"
              ? t("transfers.target_address")
              : t("transfers.contact_name")
          }
        >
          <Input value={form.to} onChange={(event) => onToChange(event.target.value)} />
        </Form.Item>
        <Form.Item
          label={t("transfers.amount", { description })}
          validateStatus={amountValidation.error ? "error" : undefined}
          help={
            amountValidation.error
              ? amountValidation.error
              : amountValidation.baseValue
                ? t("common.base_value", { value: amountValidation.baseValue })
                : getAmountInputHint(asset, form.amount.unit, t)
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
          {t("transfers.submit", { asset })}
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
  const { t } = useLocalization();
  const validation = validateAmountInput(
    asset,
    input,
    {
      allowEmpty: true,
    },
    t,
  );

  return (
    <Form.Item
      label={label}
      validateStatus={validation.error ? "error" : undefined}
      help={
        validation.error
          ? validation.error
          : validation.baseValue
            ? t("common.base_value", { value: validation.baseValue })
            : getAmountInputHint(asset, input.unit, t)
      }
    >
      <Space.Compact className="owner-compact-row">
        <Input
          placeholder={t("limits.placeholder")}
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
  const { t } = useLocalization();

  return (
    <Tabs
      items={[
        {
          key: "nervos",
          label: t("tab.nervos"),
          children: (
            <SignCard
              actionKey="sign-nervos"
              activeAction={props.activeAction}
              title={t("signing.card.title", { chain: "Nervos" })}
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
          label: t("tab.ethereum"),
          children: (
            <SignCard
              actionKey="sign-ethereum"
              activeAction={props.activeAction}
              title={t("signing.card.title", { chain: "Ethereum" })}
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
  const { t } = useLocalization();

  return (
    <Card title={title}>
      <Form layout="vertical">
        <Form.Item label={t("signing.message")}>
          <TextArea rows={6} value={value.message} onChange={(event) => onMessageChange(event.target.value)} />
        </Form.Item>
        <Form.Item label={t("signing.encoding")}>
          <Radio.Group
            value={value.encoding}
            onChange={(event) => onEncodingChange(event.target.value as MessageSigningFormState["encoding"])}
          >
            <Radio.Button value="utf8">utf8</Radio.Button>
            <Radio.Button value="hex">hex</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Button type="primary" onClick={onSubmit} loading={activeAction === actionKey}>
          {t("signing.submit")}
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
  const { t } = useLocalization();
  const [editorOpen, setEditorOpen] = useState(false);

  const columns: TableColumnsType<AddressBookContactDto> = [
    {
      title: t("address_book.table.contact"),
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
      title: t("address_book.table.nervos"),
      key: "nervosAddress",
      width: 240,
      render: (_, record) =>
        renderAddressCell(record.addresses.nervosAddress),
    },
    {
      title: t("address_book.table.ethereum"),
      key: "ethereumAddress",
      width: 240,
      render: (_, record) =>
        renderAddressCell(record.addresses.ethereumAddress),
    },
    {
      title: t("address_book.table.note"),
      dataIndex: "note",
      key: "note",
      width: 180,
      ellipsis: true,
      render: (value: string | null) => value ?? "-",
    },
    {
      title: t("address_book.table.actions"),
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
            {t("common.edit")}
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              onAddressBookSelect(record);
              void handleDelete();
            }}
          >
            {t("common.delete")}
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
        title={t("address_book.card.contacts")}
        extra={
          <Space wrap>
            <Input
              placeholder={t("address_book.filter_placeholder")}
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
              {t("address_book.new_contact")}
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
          locale={{ emptyText: <Empty description={t("address_book.empty")} /> }}
        />
      </Card>

      <Card title={t("address_book.lookup.title")}>
        <Space direction="vertical" size={16} className="owner-stack">
          <Space.Compact className="owner-compact-row">
            <Input
              placeholder={t("address_book.lookup.placeholder")}
              value={addressLookupAddress}
              onChange={(event) => onAddressBookLookupAddressChange(event.target.value)}
            />
            <Button
              type="primary"
              onClick={onAddressBookLookup}
              loading={activeAction === "address-book-lookup"}
            >
              {t("common.query")}
            </Button>
          </Space.Compact>

          {addressLookupResult ? (
            <Alert
              type={addressLookupResult.matched ? "success" : "info"}
              showIcon
              message={
                addressLookupResult.matched
                  ? t("address_book.lookup.matched", {
                      chainSuffix: addressLookupResult.chain ? ` · ${addressLookupResult.chain}` : "",
                    })
                  : t("address_book.lookup.not_matched")
              }
              description={
                <Space direction="vertical">
                  <Text>{addressLookupResult.address}</Text>
                  <Space wrap>
                    {addressLookupResult.contacts.length > 0
                      ? addressLookupResult.contacts.map((contact) => (
                          <Tag key={contact}>{contact}</Tag>
                        ))
                      : t("address_book.lookup.none")}
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
        title={
          addressBookEditor.currentName
            ? t("address_book.modal.edit_title")
            : t("address_book.modal.create_title")
        }
        onCancel={() => setEditorOpen(false)}
        footer={
          <Space wrap>
            {addressBookEditor.currentName ? (
              <Button
                danger
                onClick={() => void handleDelete()}
                loading={activeAction === "address-book-delete"}
              >
                {t("address_book.modal.delete_contact")}
              </Button>
            ) : null}
            <Button onClick={() => setEditorOpen(false)}>{t("common.cancel")}</Button>
            <Button
              type="primary"
              onClick={() => void handleSave()}
              loading={activeAction === "address-book-save"}
            >
              {addressBookEditor.currentName
                ? t("address_book.modal.save_contact")
                : t("address_book.modal.create_contact")}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical">
          <Form.Item label={t("address_book.field.name")}>
            <Input
              value={addressBookEditor.name}
              onChange={(event) => onAddressBookEditorChange("name", event.target.value)}
            />
          </Form.Item>
          <Form.Item label={t("address_book.field.nervos_address")}>
            <Input
              value={addressBookEditor.nervosAddress}
              onChange={(event) =>
                onAddressBookEditorChange("nervosAddress", event.target.value)
              }
            />
          </Form.Item>
          <Form.Item label={t("address_book.field.ethereum_address")}>
            <Input
              value={addressBookEditor.ethereumAddress}
              onChange={(event) =>
                onAddressBookEditorChange("ethereumAddress", event.target.value)
              }
            />
          </Form.Item>
          <Form.Item label={t("address_book.field.note")}>
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
  const { t } = useLocalization();

  return (
    <Tabs
      items={[
        {
          key: "nervos",
          label: t("tab.nervos"),
          children: renderLimitCards({
            activeAction,
            assetLimitDrafts,
            limits: limits.filter((limit) => limit.chain === "nervos"),
            onAssetLimitChange,
            onAssetLimitSave,
            onAssetLimitUnitChange,
            t,
          }),
        },
        {
          key: "ethereum",
          label: t("tab.ethereum"),
          children: renderLimitCards({
            activeAction,
            assetLimitDrafts,
            limits: limits.filter((limit) => limit.chain === "ethereum"),
            onAssetLimitChange,
            onAssetLimitSave,
            onAssetLimitUnitChange,
            t,
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
  t,
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
  t: ReturnType<typeof useLocalization>["t"];
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
                  {t("common.save")}
                </Button>
              }
            >
              <Form layout="vertical">
                <AmountInputField
                  asset={asset}
                  input={draft.dailyLimit}
                  label={t("limits.window.daily_limit")}
                  onUnitChange={(unit) => onAssetLimitUnitChange(key, "dailyLimit", unit)}
                  onValueChange={(value) => onAssetLimitChange(key, "dailyLimit", value)}
                />
                <AmountInputField
                  asset={asset}
                  input={draft.weeklyLimit}
                  label={t("limits.window.weekly_limit")}
                  onUnitChange={(unit) => onAssetLimitUnitChange(key, "weeklyLimit", unit)}
                  onValueChange={(value) => onAssetLimitChange(key, "weeklyLimit", value)}
                />
                <AmountInputField
                  asset={asset}
                  input={draft.monthlyLimit}
                  label={t("limits.window.monthly_limit")}
                  onUnitChange={(unit) => onAssetLimitUnitChange(key, "monthlyLimit", unit)}
                  onValueChange={(value) => onAssetLimitChange(key, "monthlyLimit", value)}
                />
              </Form>

              <Row gutter={[12, 12]}>
                {renderUsageCard(t("limits.window.day"), limit.usage.daily)}
                {renderUsageCard(t("limits.window.week"), limit.usage.weekly)}
                {renderUsageCard(t("limits.window.month"), limit.usage.monthly)}
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
  const { t, formatDateTime } = useLocalization();

  return (
    <Col xs={24} md={8} key={label}>
      <Card size="small" className="inner-card">
        <Space direction="vertical" size={4}>
          <Text strong>{t("limits.window.card", { label })}</Text>
          <Text type="secondary">
            {t("limits.usage.configured", {
              amount: usage.limitAmount ?? t("common.unlimited"),
            })}
          </Text>
          <Text type="secondary">
            {t("limits.usage.consumed", { amount: usage.consumedAmount })}
          </Text>
          <Text type="secondary">
            {t("limits.usage.reserved", { amount: usage.reservedAmount })}
          </Text>
          <Text type="secondary">
            {t("limits.usage.effective_used", { amount: usage.effectiveUsedAmount })}
          </Text>
          <Text type="secondary">
            {t("limits.usage.remaining", {
              amount: usage.remainingAmount ?? t("common.unlimited"),
            })}
          </Text>
          <Text type="secondary">
            {t("limits.usage.resets_at", { value: formatDateTime(usage.resetsAt) })}
          </Text>
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
  const { t } = useLocalization();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={8}>
        <Card title={t("security.card.rotate")}>
          <Form layout="vertical">
            <Form.Item label={t("security.field.current_password")}>
              <Input.Password
                value={rotateForm.currentPassword}
                onChange={(event) => onRotateCurrentPasswordChange(event.target.value)}
              />
            </Form.Item>
            <Form.Item label={t("security.field.new_password")}>
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
              {t("security.submit.rotate")}
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <Card title={t("security.card.import")}>
          <Alert
            type="warning"
            showIcon
            message={t("security.alert.import")}
          />
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label={t("security.field.private_key")}>
              <TextArea
                rows={7}
                value={importKey}
                onChange={(event) => onImportKeyChange(event.target.value)}
              />
            </Form.Item>
            <Form.Item label={t("security.field.confirm_replace")}>
              <Switch checked={importConfirmed} onChange={onImportConfirmedChange} />
            </Form.Item>
            <Button
              danger
              type="primary"
              onClick={onImport}
              disabled={!importConfirmed || importKey.trim().length === 0}
              loading={activeAction === "import-wallet"}
            >
              {t("security.submit.import")}
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <Card title={t("security.card.export")}>
          <Alert
            type="error"
            showIcon
            message={t("security.alert.export")}
          />
          <Space direction="vertical" size={16} className="owner-stack" style={{ marginTop: 16 }}>
            <Button
              danger
              type="primary"
              onClick={onExport}
              loading={activeAction === "export-wallet"}
            >
              {t("security.submit.export")}
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
  const { formatDateTime, t } = useLocalization();
  const columns: TableColumnsType<AuditLogDto> = [
    {
      title: t("audit.table.action"),
      dataIndex: "action",
      key: "action",
      render: (value: string) => getAuditActionLabel(value, t),
    },
    {
      title: t("audit.table.role"),
      dataIndex: "actorRole",
      key: "actorRole",
      render: (value: string) => (
        <Tag color={value === "OWNER" ? "green" : "default"}>
          {getAuditRoleLabel(value, t)}
        </Tag>
      ),
    },
    {
      title: t("audit.table.result"),
      dataIndex: "result",
      key: "result",
      render: (value: string) => (
        <Tag color={value === "SUCCESS" ? "success" : value === "FAILED" ? "error" : "default"}>
          {getAuditResultLabel(value, t)}
        </Tag>
      ),
    },
    {
      title: t("audit.table.time"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <Card title={t("section.audit.title")}>
      <Table
        rowKey="auditId"
        columns={columns}
        dataSource={audits}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description={t("audit.empty")} /> }}
      />
    </Card>
  );
}

function getSectionTitle(
  key: SectionKey,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  switch (key) {
    case "overview":
      return t("section.overview.title");
    case "wallet":
      return t("section.wallet.title");
    case "transfers":
      return t("section.transfers.title");
    case "signing":
      return t("section.signing.title");
    case "address-book":
      return t("section.address_book.title");
    case "limits":
      return t("section.limits.title");
    case "security":
      return t("section.security.title");
    case "audit":
      return t("section.audit.title");
  }
}

function getSectionDescription(
  key: SectionKey,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  switch (key) {
    case "overview":
      return t("section.overview.description");
    case "wallet":
      return t("section.wallet.description");
    case "transfers":
      return t("section.transfers.description");
    case "signing":
      return t("section.signing.description");
    case "address-book":
      return t("section.address_book.description");
    case "limits":
      return t("section.limits.description");
    case "security":
      return t("section.security.description");
    case "audit":
      return t("section.audit.description");
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

function formatCredentialStatus(
  status: string | null | undefined,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  if (!status) {
    return t("credential.unknown");
  }

  return status === "DEFAULT_PENDING_ROTATION"
    ? t("credential.pending_rotation")
    : t("credential.active");
}

function formatAssetAmount(
  amount: string | undefined,
  decimals: number | undefined,
  asset: string,
  formatDecimalString: ReturnType<typeof useLocalization>["formatDecimalString"],
): string {
  if (!amount || decimals === undefined) {
    return "-";
  }

  return `${formatDecimalString(toDisplayAmount(amount, decimals))} ${asset}`;
}

function formatCompactAssetAmount(
  amount: string | undefined,
  decimals: number | undefined,
  asset: string,
  formatDecimalString: ReturnType<typeof useLocalization>["formatDecimalString"],
): string {
  if (!amount || decimals === undefined) {
    return "-";
  }

  const display = toDisplayAmount(amount, decimals);
  const [whole = "0", fraction = ""] = display.split(".");
  const compactFraction = fraction.slice(0, 6).replace(/0+$/, "");
  const compactValue = compactFraction ? `${whole}.${compactFraction}` : whole;

  return `${formatDecimalString(compactValue)} ${asset}`;
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

function formatWalletStatus(
  status: string | undefined,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  if (status === "ACTIVE") {
    return t("wallet.status.ACTIVE");
  }

  if (status === "EMPTY") {
    return t("wallet.status.EMPTY");
  }

  return t("wallet.status.unknown");
}

function formatWalletSource(
  source: string | undefined,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  if (source === "AUTO_GENERATED") {
    return t("wallet.source.AUTO_GENERATED");
  }

  if (source === "IMPORTED") {
    return t("wallet.source.IMPORTED");
  }

  return t("wallet.source.UNKNOWN");
}

function getAuditRoleLabel(
  role: string,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  if (role === "AGENT") {
    return t("audit.role.AGENT");
  }

  if (role === "OWNER") {
    return t("audit.role.OWNER");
  }

  if (role === "SYSTEM") {
    return t("audit.role.SYSTEM");
  }

  return role;
}

function getAuditResultLabel(
  result: string,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  if (result === "SUCCESS") {
    return t("audit.result.SUCCESS");
  }

  if (result === "FAILED") {
    return t("audit.result.FAILED");
  }

  return result;
}

function getAuditActionLabel(
  action: string,
  t: ReturnType<typeof useLocalization>["t"],
): string {
  const mapped = AUDIT_ACTION_KEYS[action as keyof typeof AUDIT_ACTION_KEYS];
  return mapped ? t(mapped) : action;
}

const AUDIT_ACTION_KEYS = {
  "wallet.bootstrap": "audit.action.wallet.bootstrap",
  "owner_credential.bootstrap": "audit.action.owner_credential.bootstrap",
  "address_book.create": "audit.action.address_book.create",
  "address_book.update": "audit.action.address_book.update",
  "address_book.delete": "audit.action.address_book.delete",
  "nervos.sign_message": "audit.action.nervos.sign_message",
  "nervos.transfer_ckb": "audit.action.nervos.transfer_ckb",
  "ethereum.sign_message": "audit.action.ethereum.sign_message",
  "ethereum.transfer_eth": "audit.action.ethereum.transfer_eth",
  "ethereum.transfer_usdt": "audit.action.ethereum.transfer_usdt",
  "ethereum.transfer_usdc": "audit.action.ethereum.transfer_usdc",
  "owner.login": "audit.action.owner.login",
  "owner.rotate_credential": "audit.action.owner.rotate_credential",
  "wallet.import": "audit.action.wallet.import",
  "wallet.export": "audit.action.wallet.export",
  "vault.rotate_kek": "audit.action.vault.rotate_kek",
  "owner.asset_limit.update": "audit.action.owner.asset_limit.update",
  "transfer.settlement_confirmed": "audit.action.transfer.settlement_confirmed",
  "transfer.settlement_failed": "audit.action.transfer.settlement_failed",
} as const;
