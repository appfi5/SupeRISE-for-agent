import React from "react";
import ReactDOM from "react-dom/client";
import { App as AntdApp, ConfigProvider } from "antd";
import { App } from "./App";
import { LocalizationProvider, useLocalization } from "./localization";
import "antd/dist/reset.css";
import "./styles.css";

function OwnerUiRoot() {
  const { antdLocale } = useLocalization();

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: "#14532d",
          borderRadius: 10,
          fontFamily:
            '"IBM Plex Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
          colorBgLayout: "#f3f5f7",
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LocalizationProvider>
      <OwnerUiRoot />
    </LocalizationProvider>
  </React.StrictMode>,
);
