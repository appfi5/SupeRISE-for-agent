import { LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Layout, Space, Typography } from "antd";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLocalization } from "../localization";

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

type LoginScreenProps = {
  isPending: boolean;
  loginPassword: string;
  onLoginPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginScreen({
  isPending,
  loginPassword,
  onLoginPasswordChange,
  onSubmit,
}: LoginScreenProps) {
  const { t } = useLocalization();

  return (
    <Layout className="login-layout">
      <Content className="login-content">
        <div className="login-toolbar">
          <LanguageSwitcher />
        </div>

        <div className="login-hero">
          <Text className="login-kicker">{t("login.kicker")}</Text>
          <Title>{t("login.title")}</Title>
          <Paragraph>
            {t("login.description")}
          </Paragraph>

          <Space direction="vertical" size={12} className="owner-stack">
            <Alert
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
              message={t("login.notice.first_boot")}
            />
          </Space>
        </div>

        <Card className="login-card" bordered={false}>
          <Space direction="vertical" size={20} className="owner-stack">
            <div>
              <Text type="secondary">{t("login.auth_label")}</Text>
              <Title level={3}>{t("login.console_title")}</Title>
            </div>

            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder={t("login.password_placeholder")}
              value={loginPassword}
              onChange={(event) => onLoginPasswordChange(event.target.value)}
              onPressEnter={onSubmit}
            />

            <Button
              type="primary"
              size="large"
              block
              onClick={onSubmit}
              loading={isPending}
              disabled={!loginPassword.trim()}
            >
              {t("login.submit")}
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}
