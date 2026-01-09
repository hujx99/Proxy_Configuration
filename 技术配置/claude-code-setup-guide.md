Root Cause Check: VS Code env ≠ Terminal env

关键词：隔离

我看了你当前的 VS Code settings.json：JSON 结构本身没有问题，而且你确实把 ANTHROPIC_BASE_URL / ANTHROPIC_AUTH_TOKEN / 代理 写进了 claudeCode.environmentVariables。
但你现在报错是 在 macOS 终端里直接运行 claude 时出现的，而 终端里的 claude 不会读取 VS Code 的 settings.json，所以它仍然去连 console.anthropic.com（默认 Anthropic 登录/服务端）。这与官方文档的描述一致：VS Code 扩展的“Environment Variables”只影响扩展启动的 Claude 进程；要做到“扩展 + CLI 共享”，应使用 ~/.claude/settings.json。 ￼

English: Your VS Code settings do not automatically apply to the claude CLI in an external terminal.
中文：VS Code 的设置不会自动影响你在外部终端运行的 claude。

⸻

What’s Wrong in Your Current Setup

关键词：路径

你现在的状态是：
	•	VS Code 扩展：可能能拿到你配置的 env（取决于扩展对 claudeCode.environmentVariables 的解析格式）。
	•	终端 CLI（你正在用的）：完全没拿到这些 env → 所以仍然走 Anthropic 默认地址 → 报 console.anthropic.com: ERR_BAD_REQUEST。

因此，真正要修的是：让终端启动 claude 时就带上 OpenRouter 的环境变量（推荐写到 ~/.zshrc 或 ~/.claude/settings.json）。 ￼

⸻

Fix Option A (Recommended): Put env in ~/.zshrc

关键词：zshrc

直接把这些加入 ~/.zshrc（把 KEY 换成你自己的）：

cat >> ~/.zshrc <<'EOF'
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="YOUR_OPENROUTER_API_KEY"
export ANTHROPIC_API_KEY=""   # must be explicitly empty
export HTTPS_PROXY="http://127.0.0.1:6152"
export HTTP_PROXY="http://127.0.0.1:6152"
export NO_PROXY="localhost,127.0.0.1"
EOF

source ~/.zshrc

验证（关键是看 base url 是否变成 openrouter）：

echo $ANTHROPIC_BASE_URL
claude


⸻

Fix Option B: Put env in ~/.claude/settings.json (Shared config)

关键词：共享

Claude Code 的用户级 settings 支持 env 字段，用于“每个 session 自动注入环境变量”。 ￼
你可以创建/编辑：

~/.claude/settings.json

内容类似：

{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_OPENROUTER_API_KEY",
    "ANTHROPIC_API_KEY": "",
    "HTTPS_PROXY": "http://127.0.0.1:6152",
    "HTTP_PROXY": "http://127.0.0.1:6152",
    "NO_PROXY": "localhost,127.0.0.1"
  }
}

English: This is the recommended way to share settings between VS Code extension and CLI.  ￼
中文：这是让扩展和 CLI 共用配置的推荐方式。 ￼

⸻

Immediate Security Issue: Your OpenRouter key is exposed

关键词：泄露

你把 sk-or-v1-... 明文写在 VS Code settings.json 里，而且也已经在对话里出现过。出于安全与费用风险控制，我强烈建议你：
	1.	立刻到 OpenRouter 撤销/轮换这个 key（重新生成新的）
	2.	新 key 不要再放在会被同步/截图/日志记录的位置；优先放 ~/.claude/settings.json 或 shell env（并控制文件权限）

⸻

Quick sanity check (you run, paste back)

关键词：诊断

在终端执行：

env | egrep 'ANTHROPIC|HTTP_PROXY|HTTPS_PROXY|NO_PROXY'

然后再运行：

claude

如果配置生效，接下来出现的错误（如果还有）应该不再提 console.anthropic.com，而会体现 OpenRouter 的请求路径/鉴权问题，这样就能继续精准定位（例如 key 权限、OpenRouter 侧返回、代理是否拦截等）。

如果你愿意，我也可以顺手帮你把 VS Code 的 settings.json 里那串 key 替换成占位符（避免继续明文存储）。你只要说一句“把 VSCode 里的 key 清掉”。

Add OpenRouter Env in VS Code settings.json

关键词：环境变量

你这个文件里已经有入口了："claudeCode.environmentVariables": [ ... ]，现在是空数组。你要做的就是把它填成一组 KEY=VALUE 字符串（不要再塞一个 { "env": {...} } 对象进去）。

把下面这一段，直接替换你现在的空数组部分：

"claudeCode.environmentVariables": [
  "ANTHROPIC_BASE_URL=https://openrouter.ai/api",
  "ANTHROPIC_AUTH_TOKEN=YOUR_OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY=",
  "HTTPS_PROXY=http://127.0.0.1:6152",
  "HTTP_PROXY=http://127.0.0.1:6152",
  "NO_PROXY=localhost,127.0.0.1"
],

你现在的结构会变成这样（我只展示相关片段）：

"claudeCode.preferredLocation": "panel",
"claudeCode.environmentVariables": [
  "ANTHROPIC_BASE_URL=https://openrouter.ai/api",
  "ANTHROPIC_AUTH_TOKEN=YOUR_OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY=",
  "HTTPS_PROXY=http://127.0.0.1:6152",
  "HTTP_PROXY=http://127.0.0.1:6152",
  "NO_PROXY=localhost,127.0.0.1"
],
"claudeCode.disableLoginPrompt": true,

关键注意点
	1.	ANTHROPIC_API_KEY= 这一行要保留（显式为空），否则容易回退到 Anthropic 默认逻辑。
	2.	不要把真实 key 发在聊天里。你只需要本地把 YOUR_OPENROUTER_API_KEY 替换成自己的即可。
	3.	修改后 完全退出 VS Code（Cmd+Q）再打开，然后在 Claude Code 面板里 /status 检查：
	•	Anthropic base URL: https://openrouter.ai/api
	•	Proxy: http://127.0.0.1:6152

English: Fill claudeCode.environmentVariables with KEY=VALUE strings, then restart VS Code and check /status.
中文：把数组填成 KEY=VALUE 字符串，重启 VS Code，用 /status 验证即可。

如果你填完后 VS Code 里仍然卡在 Determining...，把 /status 截图和 “Claude Code: Show Logs” 最后 20 行贴出来（打码），我可以直接定位是 key/计费/代理/请求格式哪一类问题。