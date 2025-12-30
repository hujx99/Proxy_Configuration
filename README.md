# Clash Verge Rev / Mihomo Party 覆写脚本说明

基于订阅自动生成常用分流规则、策略组和 DNS 配置，追求“最小、可用”的默认体验。来源：`https://github.com/dahaha-365/YaNet/`。

---

## 快速上手

1) 将脚本作为覆写（扩展脚本）应用到现有配置。  
2) 保持默认开关即可获得“最小可用”：只启用必要规则组。  
3) 需要流媒体/通讯等场景时，在 **`ruleOptions`** 中按需开启。

---

## 核心开关

- **`enable: boolean`**：`true` 启用脚本（Mihomo Party 建议保持 `true`）。
- **`ruleOptions`**：默认值即“最小可用”。  
  - `apple/microsoft/github/google/openai/youtube/tracker/ads: true`  
  - 其余（`spotify/netflix/tiktok/telegram/games` 等）默认 `false`，按需打开即可生成对应规则与策略组。

---

## 地区分组（`regionOptions`）

- **`excludeHighPercentage`**：是否排除高倍率节点（仅地区分组生效）。  
- **`regions: { name, regex, ratioLimit, icon }[]`**：通过正则匹配节点名称归组，`ratioLimit` 超出则忽略。  
- 调整建议：若节点命名或倍率标注与正则不符，可微调 `regex` 或倍率提取逻辑。

---

## DNS 配置

- **`defaultDNS`**：DNS 解析上游，仅支持 IP（建议 ≤2 个）。  
- **`chinaDNS`**：国内解析上游。  
- **`foreignDNS`**：国外解析上游（可含 DoH/DoT）。  
- **`dnsConfig`** 关键项：`enable`、`listen`、`ipv6`、`prefer-h3`、`use-hosts`、`use-system-hosts`、`respect-rules`、`enhanced-mode: fake-ip`（含 `fake-ip-range` 与 `fake-ip-filter`）、`nameserver`、`proxy-server-nameserver`、`nameserver-policy`（将 `geosite:cn`、私网分流到 `chinaDNS` 或系统 DNS）。  
- 默认以国外 DNS 为主，仅对国内域名与私网回流，兼顾准确性与可用性。

---

## 通用配置模板

- 规则集：`ruleProviderCommon = { type: 'http', format: 'yaml', interval: 86400 }`  
- 代理组：`groupBaseOption = { interval: 300, timeout: 3000, url: 'http://cp.cloudflare.com/generate_204', lazy: true, 'max-failed-times': 3, hidden: false }`

---

## 入口逻辑（`main(config)`）概要

- 校验：无代理或提供者则报错。  
- 基础覆盖：`allow-lan`、`bind-address`、`mode: 'rule'`、`dns = dnsConfig`、`profile = { 'store-selected': true, 'store-fake-ip': true }`、`unified-delay`、`tcp-concurrent`、`keep-alive-interval`。  
- 嗅探：启用，`override-destination = false`，跳过 `Mijia Cloud` 与 `+.oray.com`。  
- 时间同步：启用但不写系统时间，使用 `cn.ntp.org.cn`。  
- Geo 数据：启用自动更新，轻量模式 `memconservative`。  
- 地区分组：按 `regions` 与倍率规则生成 `url-test` 策略组，并维护“其他节点”聚合。  
- 核心策略组：`默认节点`、`国内网站`、`其他外网`、`下载软件` 等；按 `ruleOptions` 生成各类服务/流媒体/通讯分组。  
- 规则：`GEOSITE,private` / `GEOIP,private` 优先直连，`GEOSITE,cn` / `GEOIP,cn` 国内分流，`MATCH,其他外网` 兜底。  
- 规则提供者：按需添加，如 `ai`、`applications`、`category-bank-jp` 等。  
- 默认逻辑不改变你的开关状态，确保“最小可用”保持不变。

---

## 常见自定义

- 仅启用特定服务：在 `ruleOptions` 将对应项设为 `true`。  
- 优先某地区：在 `默认节点` 或相关分组中优先选择目标地区策略组。  
- 调整探测参数：在 `groupBaseOption` 修改 `url` / `timeout` / `interval`。  
- 倍率规则不匹配：根据节点命名调整 `regionOptions.regions[*].regex` 或倍率提取逻辑。

---

## 注意事项

1) `enable = false` 时，仅保留基础覆盖，不改动策略组与规则。  
2) 建议保持 `override-destination = false`，避免少数应用异常。  
3) `write-to-system = true` 可能导致时间异常，非必要勿开。  
4) DNS 上游精简为 1~2 个，避免堆叠造成不稳定。

---

## 本次变更

- 重新梳理脚本注释，汇总为清晰版文档。  
- 保持默认开关与“最小可用”策略不变。
