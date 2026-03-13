# ADR 0003 地址簿与转账目标解析模型

## 状态

Accepted

## 日期

2026-03-13

## 背景

产品基线新增了地址簿能力，要求：

- Agent 可以按联系人名称管理常用收款目标
- 同一个联系人名称可同时记录 `Nervos` 地址和 `Ethereum` 地址
- 同一联系人名称在同一条链下只允许一个地址
- 同一条链下的同一个地址可以被多个联系人名称记录
- Agent 能通过精确地址查询地址簿中的匹配联系人
- 转账时支持直接使用联系人名称
- 系统按当前转账链自动解析地址
- Owner 在 UI 中具备与 Agent 对应的地址簿能力

这组需求会直接影响三类架构决策：

1. 地址簿是否是独立能力域
2. 地址簿在数据模型上是否需要抽象成任意链映射系统
3. 现有转账 tools 如何接入联系人名称

如果这些边界不先定清楚，开发很容易走向两种错误：

- 把地址簿做成一套过度抽象的任意链通讯录系统
- 额外发明“地址簿转账”或“地址簿解析”外部接口，破坏现有工具边界

## 决策

### 1. 地址簿是独立能力域，但不是独立的钱包子系统

系统正式增加一组地址簿 tools：

- `address_book.list`
- `address_book.search`
- `address_book.lookup_by_address`
- `address_book.get`
- `address_book.get_all`
- `address_book.create`
- `address_book.update`
- `address_book.delete`

原因：

- 地址簿是独立的名称映射与目标管理能力
- 它需要完整的 CRUD 与读取能力
- 但它不是第二套钱包系统，也不承载转账逻辑本身

### 2. 地址簿是共享数据，不是权限边界

地址簿的正式语义是共享名称映射层：

- Agent 创建的联系人，Owner 可以查看和修改
- Owner 创建的联系人，Agent 也可以查看和使用
- 地址簿不承载“创建者私有”语义
- 地址簿不承担白名单、风控或权限隔离职责

### 3. 当前数据模型按两条链直接建模，不做任意链抽象

地址簿当前正式模型为：

- `name`
- `note`
- `nervosAddress`
- `ethereumAddress`

原因：

- 当前产品只支持两条链
- 产品规则已经明确 `ETH`、`USDT`、`USDC` 共用同一个 `Ethereum` 地址映射
- 直接建模最贴合需求，最容易指导开发
- 同一地址允许被多个联系人复用，不需要引入更复杂的地址归属模型

因此：

- 当前不设计“任意链地址映射表”
- 当前不设计“联系人地址子表 + chain enum”作为正式默认方案
- 未来若支持更多链，再单独演进数据模型

同时：

- 不对链地址字段施加唯一约束
- 应保存可用于精确匹配的规范化地址字段

### 4. 联系人名称唯一性按归一化规则判断

正式规则：

- 先去首尾空格
- 再按大小写不敏感比较
- 归一化结果唯一

对外仍保留原始展示名称。

原因：

- 防止 `Bob` / `bob` / ` bob ` 被误认为不同联系人
- 让 Agent 与 Owner 在搜索和维护时更稳定

### 5. 转账继续使用现有 transfer tools，不新增地址簿转账工具

保留现有工具：

- `nervos.transfer.ckb`
- `ethereum.transfer.eth`
- `ethereum.transfer.usdt`
- `ethereum.transfer.usdc`

不新增：

- `address_book.transfer`
- `wallet.transfer`
- `address_book.resolve`

原因：

- 一个 tool 只做一件事
- 地址簿负责目标管理，转账工具负责转账
- 不让外部接口变成抽象万能入口

### 6. 联系人名称通过 `to + toType` 接入现有转账工具

现有 transfer tool 输入扩展为：

- `to`
- `toType?`

其中：

- `toType=address` 表示 `to` 是原始地址
- `toType=contact_name` 表示 `to` 是联系人名称
- `toType` 省略时按 `address` 处理

### 7. 联系人解析发生在应用层，不发生在 UI 或链适配器

正式执行顺序：

1. 校验 transfer 输入
2. 按 `to + toType` 解析最终地址
3. 解析成功后再进入限额评估、额度预占和链适配器

不允许：

- UI 先自行解析联系人名称
- 链适配器直接查询地址簿
- `toType` 省略时自动猜测联系人名称
- `toType=address` 时自动反查地址簿并回填联系人名称

### 8. 按精确地址查询使用独立工具，且只返回联系人名称

正式新增工具：

- `address_book.lookup_by_address`

正式输入：

- `address`

正式输出：

- `address`
- `chain?`
- `matched`
- `contacts`

规则：

- `contacts` 只返回联系人名称数组
- 这项能力只表达“地址簿中匹配到哪些联系人”
- 不表达链上真实归属
- 匹配到多少联系人，就返回多少联系人
- 空字符串输入返回校验错误
- 无法识别为当前支持链地址格式时返回未匹配结果，而不是业务错误

原因：

- 用户真实问题是“这个地址在我们的地址簿里是谁的”
- 不是“这个地址在链上真实属于谁”
- 联系人数受控时，名称数组已经足够支撑 Agent 后续判断

### 9. 地址簿解析失败必须明确报错

至少定义两类失败：

- `ADDRESS_BOOK_CONTACT_NOT_FOUND`
- `ADDRESS_BOOK_ADDRESS_NOT_FOUND_FOR_CHAIN`

不允许：

- 降级到其他链地址
- 模糊匹配联系人名称
- 静默回退为原始地址模式

## 结果

这项决策带来的直接结果是：

- 地址簿能力边界清晰，开发不会把它做成第二套钱包系统
- 当前数据模型直接服务当前需求，不被过度抽象拖慢
- 转账能力与地址簿能力可以稳定协作，不会引入新的万能接口
- Agent 和 Owner 可以共享同一套地址簿心智和能力面

## 后续影响

开发时必须同步更新：

- `design/contracts/mcp-and-owner-interfaces.md`
- `design/architecture/04-modules-and-runtime.md`
- `design/architecture/06-wallet-domain-and-use-cases.md`
- `design/architecture/08-data-and-persistence.md`
- `design/architecture/09-chain-integration.md`
- `design/architecture/11-cleanup-plan.md`
- `design/architecture/12-implementation-roadmap.md`
- `design/architecture/13-development-requirements-and-quality-gates.md`
