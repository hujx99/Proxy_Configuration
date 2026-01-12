# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository manages proxy and network environment configurations supporting multiple clients:
- **Surge** (macOS/iOS native client)
- **Clash Verge** (cross-platform, uses JavaScript configuration override)
- **Legacy clients** (ShadowRocket)

## Key Files and Their Purposes

### Configuration Files
- **surge.conf** — Primary Surge proxy configuration. Defines proxy groups (地区分组), routing rules (RULE-SET), and DNS settings. Uses Surge's native config format.
- **clash-verge.js** — Clash Verge override script that transforms proxy configs into Clash format. Key functions:
  - Generates proxy groups (策略组) by filtering node names with regex patterns
  - Creates smart policy groups (url-test) for auto-selection by region/latency
  - Builds rule provider entries for external rule sets
  - Combines specific rules for ChatGPT, Apple services, and domestic traffic

### Supporting Files
- **config-docs/** — Documentation folder with:
  - `claude-code-setup-guide.md` — Environment setup for Claude Code with OpenRouter/custom API endpoint
  - `deepseek-configuration.md` — DeepSeek model integration guide
  - `openwebui-troubleshooting.md` — OpenWebUI proxy troubleshooting
- **legacy/** — Archived configs for older clients (keep for reference)

## Configuration Architecture

### Surge Config Flow
1. **[General]** section: DNS servers (阿里 / 114), proxy test URLs, IPv6/Wi-Fi assist settings
2. **[Proxy Group]** section: Defines strategy groups that select nodes via regex filtering
   - `智能策略` — Auto-selects from HK/JP/SG/TW/US nodes (url-test)
   - `ChatGPT` — Dedicated group for OpenAI services (url-test with tolerance=80)
   - Regional groups (`🇯🇵 日本节点`, etc.) — Filtered by node name patterns
   - `手动选择` — Manual selection excluding internal traffic proxies
3. **[Rule]** section: Routes domains/IPs to appropriate groups
   - External RULE-SET imports from [SKK](https://ruleset.skk.moe) and [Blankwonder](https://github.com/Blankwonder/surge-list)
   - Overrides for specific services (Apple, ChatGPT, cttic)
   - Catch-all: GEOIP CN routes to DIRECT, else routes to Proxy

### Clash Verge Override (clash-verge.js)
The script transforms received proxy list into Clash-compatible config:
1. **Input**: Raw proxies from subscription source
2. **Processing**:
   - Adds a `直连` (direct) proxy if missing
   - Filters proxies using `surgeSmartRegex` (for 智能策略), `surgeTrafficRegex` (for 流量信息), and `surgeRegionDefs` (for regional groups)
   - Deduplicates proxy names in groups via `uniqueList()`
   - Safe fallbacks: if no proxies match a regex, use all available proxies
3. **Output**: Proxy groups + rule providers matching Surge config structure

## Important Implementation Details

### Node Filtering Strategy
Both surge.conf and clash-verge.js use regex patterns to identify proxy nodes:
- **Smart policy**: Matches `Hong\s*Kong|HK|Japan|JP|Singapore|SG|Taiwan|TW|United\s*States|US|美国|日本|新加坡|台湾` (supports Chinese labels)
- **Traffic info**: Matches `SSRDOG|XgCloud` (internal proxy services)
- **Regional groups**: Each region has its own pattern, e.g., `(🇯🇵)|(日本)|(Japan)|(JP)` for Japan nodes

### Rule Precedence in Surge
Rules are evaluated top-to-bottom; first match wins:
1. Domain-specific overrides (cttic → DIRECT, alpha123.uk → Proxy)
2. AI service rules (apple_intelligence, ai → ChatGPT)
3. Blocked domains → Proxy, CN domestic rules → DIRECT
4. Apple service exceptions
5. Ad blocking rules (doubleclick.net, etc.)
6. Geolocation fallback (GEOIP CN → DIRECT, else FINAL → Proxy)

### Test URLs
- Internet connectivity: `http://www.baidu.com` (Surge [General])
- Proxy test (latency measurement): `http://www.apple.com/library/test/success.html` (Surge proxy-test-url)
- ChatGPT test: `http://www.gstatic.com/generate_204` (Google Connectivity Check)

## Common Editing Tasks

**Adding a new regional proxy group:**
1. In surge.conf: Add new group under [Proxy Group] with pattern matching your node naming scheme
2. In clash-verge.js: Add entry to `surgeRegionDefs` array with name, regex, and icon URL

**Updating rule sets:**
- Modify RULE-SET URLs in [Rule] section of surge.conf
- In clash-verge.js, update corresponding rule provider entries under `config['rule-providers']`
- Verify URL format (Surge native vs Clash YAML)

**Debugging proxy selection:**
- Check node names match the regex filters in surge.conf [Proxy Group]
- Verify `policy-regex-filter` parameters are case-insensitive and use word boundaries
- Test: Enable "Alert" on groups (`no-alert=0`) to see which group is active

## Notes

- API keys and sensitive credentials must **not** be committed (see .gitignore expectations)
- Local settings are stored in `.claude/` directory for VS Code extensions
- DNS resolution: Surge uses encrypted DNS (DoH) commented out by default (traditional DNS preferred)
- IPv6 is disabled by default due to network instability in current environments
