# ADR 0005 Owner UI 多语言边界

## 状态

Accepted

## 日期

2026-03-17

## 背景

产品侧已新增正式多语言需求：

- 当前支持语言为英文与中文
- 默认语言为英文
- 当前多语言范围只覆盖 Owner UI 中的固定界面文案和产品提示文案
- 用户自行输入的内容不属于本期翻译范围

如果不尽早收紧架构边界，开发很容易把这项需求做重，演变成：

- 后端 API 的多语言输出
- MCP tool 的多语言返回
- 错误消息文本直出到 UI
- 地址、备注、联系人名称等用户输入内容翻译

这些都不属于当前产品范围。

## 决策

### 1. 多语言只属于 Owner UI 展示层能力

当前多语言能力只落在 `apps/owner-ui`。

正式要求：

- 当前只支持 `en` 与 `zh`
- 默认语言固定为 `en`
- 固定界面文案和产品提示文案由 UI 本地翻译资源渲染

### 2. 后端契约保持语言无关

当前架构下：

- Owner HTTP API 不新增多语言业务接口
- wallet tools HTTP gateway 不新增 `locale` 协商
- MCP tools 不新增 `locale` 协商
- 后端继续返回稳定的错误码、字段和值对象

### 3. 语言切换状态由 UI 本地管理

正式要求：

- 当前语言选择只在本地浏览器侧持久化
- 不要求 server 保存语言偏好
- 语言偏好丢失时回退到默认英文

### 4. 用户输入和原始数据不进入翻译流程

本期不翻译：

- 联系人名称
- 备注
- 地址
- 交易哈希
- 资产符号

## 结果

这项决策带来的结果是：

- 多语言需求被收敛在最小可交付范围内
- 后端契约与 Agent 能力保持稳定，不被 UI 文案需求污染
- Owner UI 可以独立迭代中英文文案，而不影响钱包业务接口

## 后续影响

开发时必须同步更新：

- `design/architecture/03-repo-structure.md`
- `design/architecture/04-modules-and-runtime.md`
- `design/contracts/mcp-and-owner-interfaces.md`
- `design/architecture/12-implementation-roadmap.md`
- `design/architecture/13-development-requirements-and-quality-gates.md`
