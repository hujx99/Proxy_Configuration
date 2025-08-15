1. 概述

- **名称**：Clash Verge Rev 全局扩展脚本（懒人配置）/ Mihomo Party 覆写脚本  
- **来源**：`https://github.com/dahaha-365/YaNet/`  
- **用途**：基于已有订阅，自动生成常用分流规则、策略组与 DNS 设置，追求“最小、可用”的默认启用范围。

---

2. 快速上手

1. 将本脚本作为覆写（或扩展脚本）应用到你的配置。  
2. 保持默认开关即可获得“最小可用”体验：  
   - 仅启用必要的规则组，其他均保持禁用。  
3. 如需更多场景（流媒体、通讯软件等），在 **`ruleOptions`** 中逐项开启即可。

---

3. 总开关

- **`enable: boolean`**  
  - `true` = 启用脚本（Mihomo Party 建议保持 `true`）

---

4. 分流规则开关（**`ruleOptions`**）

- 按需开启，默认保持“最小可用”。以下为本仓库默认值：  
  - **`apple: true`**   苹果服务  
  - **`microsoft: true`** 微软服务  
  - **`github: true`**  GitHub 服务  
  - **`google: true`**  Google 服务  
  - **`openai: true`**  国外 AI / GPT  
  - **`youtube: true`**  YouTube  
  - **`tracker: true`**  网络分析和跟踪服务  
  - **`ads: true`**    广告过滤  
  - 其余选项（如 `spotify`, `netflix`, `tiktok`, `telegram`, `games` 等）默认 `false`

- 保持以上默认值即代表“最小可用”方案：  
  - 常用服务可用，非必要场景不启用以提升效率与清晰度。

---

5. 地区分组（**`regionOptions`**）

- **`excludeHighPercentage: boolean`**  
  - 是否排除高倍率节点（仅对地区分组生效）。  
- **`regions: Array<{ name, regex, ratioLimit, icon }>`**  
  - 通过 **`regex`** 匹配节点名称决定归属分组。  
  - **`ratioLimit`**：倍率上限，超过将被排除。

- 建议：  
  - 如节点命名习惯与正则不完全匹配，可按需微调 **`regex`**；  
  - 若供应商存在倍率标注格式差异，也可同步调整倍率提取规则。

---

6. DNS 相关

- **`defaultDNS`**：用于解析 DNS 的上游，仅支持 IP（建议不超过 2 个）。  
- **`chinaDNS`**：国内解析使用。  
- **`foreignDNS`**：国外解析使用（可含 DoH/DoT）。  
- **`dnsConfig`** 关键项：  
  - **`enable`**, **`listen`**, **`ipv6`**, **`prefer-h3`**  
  - **`use-hosts`**, **`use-system-hosts`**, **`respect-rules`**  
  - **`enhanced-mode: fake-ip`**，并设定 **`fake-ip-range`** 与 **`fake-ip-filter`**  
  - **`nameserver`** 与 **`proxy-server-nameserver`** 默认指向国外；  
  - **`nameserver-policy`** 将 `geosite:cn` 等国内域名与私有网段分流到 **`chinaDNS`** 或系统 DNS。

- 说明：  
  - 默认国外 DNS 为主，仅对国内域名与私网网段做回流，兼顾准确性与可用性。

---

7. 规则集与策略组通用配置

- 规则集通用：  
  - **`ruleProviderCommon = { type: 'http', format: 'yaml', interval: 86400 }`**  
- 代理组通用：  
  - **`groupBaseOption = { interval: 300, timeout: 3000, url: 'http://cp.cloudflare.com/generate_204', lazy: true, 'max-failed-times': 3, hidden: false }`**

---

8. 入口逻辑（**`main(config)`**）概要

- 校验：  
  - 若未发现任何代理或提供者，抛出错误提示。  
- 基础覆盖：  
  - **`allow-lan`**, **`bind-address`**, **`mode: 'rule'`**  
  - 覆盖 **`dns`** 为上述 **`dnsConfig`**  
  - **`profile = { 'store-selected': true, 'store-fake-ip': true }`**  
  - 性能/体验：**`unified-delay`**, **`tcp-concurrent`**, **`keep-alive-interval`**  
- 嗅探（sniffer）：  
  - 启用，保留 **`override-destination = false`**，并跳过 `Mijia Cloud` 与 `+.oray.com`。  
- 时间同步（ntp）：  
  - 启用但不写系统时间，使用 **`cn.ntp.org.cn`**。  
- Geo 数据：  
  - 启用并自动更新，轻量加载方式 **`memconservative`**。  
- 地区分组：  
  - 基于 **`regions`** 与倍率规则筛选节点，生成 **`url-test`** 类型策略组。  
  - 同步维护“其他节点”聚合。  
- 生成核心策略组：  
  - `默认节点`、`国内网站`、`其他外网`、`下载软件` 等通用分组  
  - 根据 **`ruleOptions`** 条件生成各类服务/流媒体/通讯分组  
- 规则（rules）：  
  - 优先私网直连：`GEOSITE,private` 与 `GEOIP,private`  
  - 国内分流：`GEOSITE,cn` 与 `GEOIP,cn`  
  - 最终兜底：`MATCH,其他外网`  
- 规则提供者（rule-providers）：  
  - 按需添加，如 `ai`, `applications`, `category-bank-jp` 等。

- 以上逻辑均在不改动你默认开关的前提下执行，确保“最小可用”保持不变。

---

9. 常见自定义

- 只想启用某类服务：  
  - 在 **`ruleOptions`** 将对应项设为 `true`，即可自动生成对应规则与策略组。  
- 优先某地区：  
  - 在 `默认节点` 或对应服务分组中，优先选择目标地区策略组。  
- 调整探测 URL/超时：  
  - 在 **`groupBaseOption`** 修改 **`url`** / **`timeout`** / **`interval`**。  
- 代理倍率规则不匹配：  
  - 根据你的命名规范调整 **`regionOptions.regions[*].regex`** 或倍率提取逻辑（脚本内已有注释）。

---

10. 注意事项

1. **`enable`** 置 `false` 时，不再改动策略组与规则，仅保留基础配置覆盖。  
2. **`override-destination`** 建议保持 `false`，可避免部分应用异常。  
3. **`write-to-system`** 若置 `true`，可能导致电脑时间异常（非必要不建议开启）。  
4. DNS 条目建议精简为 1~2 个；切勿堆叠过多上游以免引入不稳定。

---

11. 变更说明（本次）

- 将脚本内的关键注释整理为本文档，便于查阅与维护。  
- 不改动任何默认开关与规则，完整保留“最小可用”禁用状态。

如需补充更多示例或 FAQ，可在本文件追加小节。
