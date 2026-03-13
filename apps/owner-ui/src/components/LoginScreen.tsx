import { LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Layout, Space, Typography } from "antd";

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
  return (
    <Layout className="login-layout">
      <Content className="login-content">
        <div className="login-hero">
          <Text className="login-kicker">SupeRISE Owner Mode</Text>
          <Title>接管 Agent 信用钱包</Title>
          <Paragraph>
            这是一个面向 Owner 的本地控制台。Agent 不接触私钥，而 Owner 可以在必要时查看状态、
            签名、转账、调整限额并执行恢复操作。
          </Paragraph>

          <Space direction="vertical" size={12} className="owner-stack">
            <Alert
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
              message="首次启动的默认凭证会写入本机通知文件，登录后请尽快轮换。"
            />
          </Space>
        </div>

        <Card className="login-card" bordered={false}>
          <Space direction="vertical" size={20} className="owner-stack">
            <div>
              <Text type="secondary">Owner Authentication</Text>
              <Title level={3}>登录控制台</Title>
            </div>

            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="输入 Owner 密码"
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
              进入 Owner Console
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}
