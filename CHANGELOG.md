# Changelog

## [0.3.0](https://github.com/appfi5/SupeRISE-for-agent/compare/v0.2.1...v0.3.0) (2026-03-20)


### Features

* add address book support ([2ebdcb2](https://github.com/appfi5/SupeRISE-for-agent/commit/2ebdcb270806ecd77205041f70661328a8472f5c))
* add multilingual support ([275a784](https://github.com/appfi5/SupeRISE-for-agent/commit/275a784f9a9d4e65f48ec33ab9221c65c8d6156f))
* Agent 消息签名接口 ([c357e0a](https://github.com/appfi5/SupeRISE-for-agent/commit/c357e0a68cf0d77e4714cd4d31449fef8f76d04a))
* **application:** implement address-book services and target resolution ([b10a300](https://github.com/appfi5/SupeRISE-for-agent/commit/b10a300ed146290432b042cc3c1d5c86ebfd4345))
* **bootstrap:** add quickstart first-run owner notices ([c644fea](https://github.com/appfi5/SupeRISE-for-agent/commit/c644feabcd7874bc99a28860a6a8f720c2f604c8))
* **contracts:** add address-book schemas and transfer targets ([cd2e5c3](https://github.com/appfi5/SupeRISE-for-agent/commit/cd2e5c3cf607d665779b2c5e7a05d88447b8637a))
* **contracts:** add usdc tx-status and asset-limit schemas ([ad88f36](https://github.com/appfi5/SupeRISE-for-agent/commit/ad88f36a1c9a6b35836696d8e0de50c179df9d07))
* **deployment:** add single-image docker deployment profiles ([a471a14](https://github.com/appfi5/SupeRISE-for-agent/commit/a471a144506c5db89be594c7b0fc72be5566a68d))
* **deployment:** enforce quickstart runtime persistence ([717e9ce](https://github.com/appfi5/SupeRISE-for-agent/commit/717e9ced4f9855ebe39fbdad5d05f185dcaeaa09))
* **deployment:** enforce quickstart runtime persistence ([6dbbb04](https://github.com/appfi5/SupeRISE-for-agent/commit/6dbbb045e685675dd76c00dc4ed7d1a22273eac4))
* **deployment:** implement single-image docker deployment profiles ([f359127](https://github.com/appfi5/SupeRISE-for-agent/commit/f359127ac3026f882fb86a082ca49fa28b79b3cd))
* **infra:** add deployment profiles and runtime secrets ([ad0657a](https://github.com/appfi5/SupeRISE-for-agent/commit/ad0657a2c7df1a39a002445bc4892199ab0e17ba))
* **ops:** add docker deployment workflow ([78f2ba0](https://github.com/appfi5/SupeRISE-for-agent/commit/78f2ba082d5ee79d5a74e2d6ca499881c1ccea4a))
* **owner-ui:** add address-book management and target types ([47e1217](https://github.com/appfi5/SupeRISE-for-agent/commit/47e1217ea3312026c370dac09684d63423e0bc55))
* **owner-ui:** add owner ui localization runtime ([0fc5c26](https://github.com/appfi5/SupeRISE-for-agent/commit/0fc5c26f4379a4e7c296891445ce26925772910e))
* **owner-ui:** add usdc and asset limit controls ([4ea3598](https://github.com/appfi5/SupeRISE-for-agent/commit/4ea35989518b12b6492ed5db66f01325f1cc2dfa))
* **owner-ui:** rebuild owner console ui ([c5ec7f5](https://github.com/appfi5/SupeRISE-for-agent/commit/c5ec7f516d1b628bd93f5bd868766a49124ca725))
* **product:** define agent credit wallet PRD ([d44c552](https://github.com/appfi5/SupeRISE-for-agent/commit/d44c5526430abde2da2ce131dee16f4b7ed17c42))
* rebuild owner console ui ([da59dba](https://github.com/appfi5/SupeRISE-for-agent/commit/da59dba2186f1b88bbc587afd00b3a3bd5d5440c))
* redesign docker release automation ([24813a7](https://github.com/appfi5/SupeRISE-for-agent/commit/24813a7b271cdc584d456079ee16d4b9a217128e))
* split build metadata from health check ([9f89a36](https://github.com/appfi5/SupeRISE-for-agent/commit/9f89a36491bcff6810c86a73b1162b2e93ec2431))
* **storage:** add address-book persistence and transfer metadata ([0049d7b](https://github.com/appfi5/SupeRISE-for-agent/commit/0049d7b3924aa920475605245170d095a11c2aed))
* support Ethereum USDC and per-asset limits ([afaaf12](https://github.com/appfi5/SupeRISE-for-agent/commit/afaaf1263dd1b91c191482bbd7ecd7ad86ae3f3c))
* **sustain:** add self-sustaining agent module for SupeRISE Market ([1790119](https://github.com/appfi5/SupeRISE-for-agent/commit/1790119ab212ae100d6998e45d91de0777dfcd8e))
* **sustain:** add self-sustaining agent module for SupeRISE Market ([e107a4e](https://github.com/appfi5/SupeRISE-for-agent/commit/e107a4e37b605f1c4f87bdd8c328a41f6703dbcd))
* **wallet-server:** expose address-book tools through registry ([87d0ca6](https://github.com/appfi5/SupeRISE-for-agent/commit/87d0ca6a75b5a700c4e529c1d1ea4cd887f39a36))
* **wallet-server:** implement usdc tx-status and asset limits ([238cb5d](https://github.com/appfi5/SupeRISE-for-agent/commit/238cb5d4ed08880dc28ea87952fedd078bdb9fc8))
* **wallet:** expose chain identity public keys ([58cb22e](https://github.com/appfi5/SupeRISE-for-agent/commit/58cb22e78c283ef2797d52e0d8c846b3dc49c125))
* **wallet:** expose chain identity public keys ([0688c5c](https://github.com/appfi5/SupeRISE-for-agent/commit/0688c5cfd35cc7eedaca718f22635e25765cd46e))


### Bug Fixes

* **ckb:** normalize tx status fields for mcp ([c75972f](https://github.com/appfi5/SupeRISE-for-agent/commit/c75972f0d37e982b5c92f3aa963419107128e5af))
* **infra:** clarify quickstart migration errors ([7a74657](https://github.com/appfi5/SupeRISE-for-agent/commit/7a74657bb252143f08699da6aad9c9a13d8dc8f3))
* **owner-ui:** harden response and port parsing ([6984ea3](https://github.com/appfi5/SupeRISE-for-agent/commit/6984ea399388b2bb4d693bd518d2783b9e30adec))
* 修复 swagger 文档地址错误 ([07d8242](https://github.com/appfi5/SupeRISE-for-agent/commit/07d8242299c4e332af5ebbde3f005a039051d4ce))
* 修复安装脚本文档错误 ([008a413](https://github.com/appfi5/SupeRISE-for-agent/commit/008a4137dd3d0a7a268fd1f7c491c375b0bc1374))
