# dsh-composio

[![中文](https://img.shields.io/badge/语言-中文-blue)](./README.md) [![English](https://img.shields.io/badge/language-English-lightgrey)](./README.en.md) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE) [![GitHub stars](https://img.shields.io/github/stars/xiaokaizhou/dsh-composio?style=social)](https://github.com/xiaokaizhou/dsh-composio)

> **DSH 插件：在设置里接入 Composio，把 Gmail / Slack / GitHub / Notion 等 1,000+ 应用变成 agent 可以直接调用的工具。**

插件分两层：

1. **图形化接入**：设置 → Composio，用 OAuth 登录（推荐）或填写 Project / User API Key，搜索平台，点一下完成授权（OAuth 或 API Key 表单），查看/断开已有连接。
2. **Agent 工具**：向 DSH 注册 5 个 Composio meta-tools（搜索工具、读取 schema、执行工具、查看连接、发起连接），agent 可以在对话里直接读写 Gmail、Slack、GitHub 等平台，无需你手动拼 API 请求。

不使用「把 1,000+ 个平台工具全部注册给模型」的做法——那会占满上下文。插件采用与 Composio 官方 MCP 相同的 meta-tool 模式：先搜索、再读 schema、最后执行，模型只在需要时加载具体工具。

## 功能

| 能力 | 说明 |
|---|---|
| OAuth 登录（推荐） | 浏览器登录 Composio，自动获取并保存 User API Key，无需手动复制；页面会轮询到登录完成 |
| API Key 接入 | 支持 Project API Key（`ak_...`）与 User API Key（`uak_...`），自动选择 `x-api-key` / `x-user-api-key`；校验通过才写入 DSH 凭据存储，并支持 `COMPOSIO_API_KEY` 环境变量回退 |
| 平台目录 | 按使用量排序，关键词搜索、分页加载，展示分类、工具数量、Logo、连接状态 |
| 一键连接 | 点击平台 → 有托管 OAuth 则打开授权页并轮询；只有 API Key 的平台弹出凭据表单；免鉴权平台直接连接 |
| 连接管理 | 列出当前 user 的已连接账号，两步确认断开 |
| Agent 工具 | 5 个工具：搜索、schema、执行、连接列表、发起连接 |
| 中英双语 | 跟随 DSH 语言设置 |

## 安装

```bash
# DSH Web profile
dsh plugin --profile web add xiaokaizhou/dsh-composio

# DSH Desktop profile
dsh plugin --profile desktop add xiaokaizhou/dsh-composio
```

`dsh plugin` 会自动把插件写进 profile 的 `dsh.profile.bundles`，并加载插件自带的 `cordis.patch.yml`（bundle 行 `id: composio`）。安装后刷新设置页即可看到「Composio」；Host 代码更新后需要重启 `dsh web`。

<details>
<summary>手动安装（pnpm）</summary>

```bash
cd ~/.dsh/profiles/web
pnpm add xiaokaizhou/dsh-composio
```

然后在同一目录的 `package.json` 中确认：

```json
"dsh": {
  "profile": {
    "bundles": ["dsh-composio"]
  }
}
```

</details>

## 配置

### 1. 选择接入方式

#### 方式 A：OAuth 登录（推荐）

打开 **设置 → Composio**，点「OAuth 登录」。插件会创建一个 Composio 登录会话，并调用系统默认浏览器打开 Dashboard（DSH 桌面端同样适用）；完成登录后，插件自动取得 **User API Key**（`uak_...`）并写入 DSH 凭据存储。

- 不需要手动复制 Key；
- 登录会话约 13 分钟有效，页面最多轮询 3 分钟；
- 如果系统浏览器没有自动打开，页面会给出「打开登录页面」链接，手动打开即可。

#### 方式 B：Project API Key

1. 打开 [dashboard.composio.dev](https://dashboard.composio.dev)，注册或登录。
2. 创建一个项目。
3. 进入 **Settings → Project Settings → API Keys**，创建一个 **Project API Key** 并复制。
4. 可选：用 scoped key 限制权限；本插件需要读取 toolkits / tools / connected accounts，并创建 auth config 与连接链接。

> **Key 类型**：本插件支持 Project API Key（`ak_...`，走 `x-api-key`）和 User API Key（`uak_...`，走 `x-user-api-key`）。Organization API Key 需要 `x-org-api-key`，本插件暂不支持，请改用 OAuth 登录。若粘贴的是 Composio 为 MCP / AI Clients 生成的 consumer key，也会被 Composio 拒绝，请改用 OAuth。

### 2. 在 DSH 中保存 Key

OAuth 登录会在授权完成后自动保存。手动方式：在 **设置 → Composio** 粘贴 Key，点「保存并验证」。

- 保存前会调用一次 `GET /api/v3.1/toolkits?limit=1` 校验；无效 Key 不会落库。401 会区分 Project / User Key 类型并给出对应提示。
- Key 存在 DSH 凭据存储，record key 为 `dsh-composio/api-key`。
- 如果 Key 来自 `COMPOSIO_API_KEY` 环境变量，页面会显示「环境变量」来源，并隐藏「清除」按钮。
- 已保存的 Key 会显示来源（OAuth 登录 / 手动填写 / 环境变量）与类型（Project / User）。
- 高级设置可改 `user_id`（默认 `dsh-user`）与 API Base URL（代理或 mock 服务）。

### 3. 连接平台

在平台网格里搜索目标应用，点击卡片：

- 已有 ACTIVE 连接 → 直接标记已连接；
- 平台支持免鉴权（`no_auth`）→ 立即连接；
- 平台只有 API Key / Bearer Token 等凭据（如 Resend）→ 弹出凭据表单，填写后直接创建连接；
- 其余情况 → 自动查找/创建 Composio 托管 auth config，用系统默认浏览器打开 OAuth 授权页，完成后连接变为 ACTIVE。

> OAuth 在浏览器里完成，所以目标平台本身需要可访问。Composio 托管 OAuth 默认使用其自带 client，不需要自己申请 Google / Slack 的 client_id。
> 对于 Resend 这类只有 API Key 的平台，插件会自动创建一个 Composio 自定义 auth config，并要求填写平台 API Key；凭据只提交给 Composio 用于创建连接。

## Agent 工具

安装后，DSH 会话会多出 5 个工具：

| 工具 | 作用 | 主要参数 |
|---|---|---|
| `composio_search_tools` | 按关键词/平台搜索可用工具 | `query`（必填）、`toolkit`、`limit` |
| `composio_get_tool` | 读取某个工具的完整参数 schema | `slug`（必填） |
| `composio_execute_tool` | 执行工具 | `slug`、`arguments`（必填对象）、`user_id?`、`connected_account_id?` |
| `composio_list_connections` | 查看当前 user 的连接 | `toolkit?` |
| `composio_connect_toolkit` | 生成某个平台的 OAuth 链接 | `toolkit`（必填） |

典型链路：

```text
用户：帮我看看 Gmail 最近 5 封未读邮件
  → composio_search_tools({ query: "fetch emails", toolkit: "gmail" })
  → composio_get_tool({ slug: "GMAIL_FETCH_EMAILS" })
  → composio_execute_tool({ slug: "GMAIL_FETCH_EMAILS", arguments: { max_results: 5 } })
```

```text
用户：给 alice@example.com 发一封邮件，主题 Hello，正文 ...
  → composio_search_tools({ query: "send email", toolkit: "gmail" })
  → composio_execute_tool({ slug: "GMAIL_SEND_EMAIL", arguments: {...} })
```

若还没连接，执行工具会返回 `missing_connection` 一类的提示；agent 可以调用 `composio_connect_toolkit` 生成授权链接，让你在浏览器里完成连接后重试。

其他例子：

- 「在 Slack 的 #general 发一条消息」
- 「给 xiaokaizhou/dsh-composio 建一个 issue」
- 「我当前连接了哪些平台？」
- 「帮我把 Notion 里这篇页面读出来」

> 工具名以 `composio_` 开头，不会和内置工具混淆。写操作（发邮件、发消息、建 issue 等）会真实作用到对应平台，请配合 DSH 的权限/审批策略使用。

## 数据与安全

- API Key 只写入 DSH 凭据存储，不写入 `cordis.patch.yml`，不会出现在 README 或日志里。
- 平台与连接请求只从本机 DSH 后端发往 Composio（默认 `https://backend.composio.dev`）；设置页 ↔ 本机后端走 `/_dsh/composio/api`，仅接受 loopback 同源 POST。
- 自动打开浏览器只接受 `https` 链接（以及本地 mock 的 loopback `http`），不会打开 `file://` 或其他 scheme。
- 非密钥偏好（`user_id`、自定义 Base URL）保存在 `~/.dsh/composio/settings.json`。
- Composio 托管 OAuth 凭证并代理 API 调用，调用参数与结果会经过 Composio 云端；对合规敏感的数据请先评估。
- 工具返回内容属于外部不可信数据，agent 不应把其中的指令当作系统指令执行。
- OAuth 登录只保存 Composio 返回的 User API Key；不会接触你的 Composio 账号密码。

## 架构

```text
dsh-composio/
├─ index.js          # Host：凭据、偏好、Composio v3.1 客户端、本地 HTTP 路由、5 个 agent tools
├─ client.js         # Client：settings.section 页面（React，无构建步骤）
├─ cordis.patch.yml  # bundle 行：id = composio
├─ locale/{en,zh}.json
├─ icon.svg
├─ LICENSE
└─ README.md
```

- Host 零运行时依赖，使用 Node 内置 `fetch`；从工作区目录 link 安装也不会缺包。
- Client 通过 `window.__ModuleLoader__` 加载，注册 `settings.section`（order 50），不引入 Harness Client 包。
- 工具定义直接使用 DSH `tools.register` 接受的 plain definition（`name / description / parameters / output / execute`），不依赖 `@deepseek-ai/dsh-tools`。
- Composio 接口基于 v3.1：`/toolkits`、`/tools`、`/tools/execute/{slug}`、`/auth_configs`、`/connected_accounts/link`、`/connected_accounts`。

## 限制

- Composio 后端是云服务，不能在本机完整自托管；自托管/BYOC 属于 Composio Enterprise 能力。本插件只把客户端和密钥放在本地。
- 平台连接优先使用 Composio **托管 OAuth**；只有 API Key 的平台走自定义 auth config + 凭据表单。需要自带 OAuth app（自有 client_id / scopes）的平台，请先在 Composio Dashboard 建好 auth config，再回来连接。
- 不支持 Organization API Key（`x-org-api-key`）；需要组织级权限时请用 OAuth 登录。
- 部分平台的 API Key 不会被 Composio 在创建连接时校验；如果填错，会在首次调用该平台工具时返回鉴权错误。
- 平台目录最多展示 Composio 当前项目可见的 toolkits；工具搜索结果受项目权限与平台可用性影响。
- 没有实现 triggers / webhooks / 定时任务，只提供请求-响应式工具调用。
- 执行结果会原样交给模型，超大输出会在 48,000 字符处截断。

## 开发

```bash
node --check index.js
node --check client.js
```

修改 Host 代码后需要重载插件或重启 `dsh web`；Client 代码刷新页面即可生效。

本地调试时可以在「高级设置」里把 Base URL 指向 mock 服务，例如 `http://127.0.0.1:8787`，保存一个 mock Key 后验证工具链；调试结束记得清除 Key 并恢复默认地址。

## 打赏支持

若这个插件帮到了你，欢迎用下面的二维码请我喝杯咖啡。

<table>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/xiaokaizhou/dsh-composio/main/.github/wechat-pay.jpg" width="180" alt="WeChat Pay"><br>
      <strong>微信支付</strong>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/xiaokaizhou/dsh-composio/main/.github/alipay.jpg" width="180" alt="Alipay"><br>
      <strong>支付宝</strong>
    </td>
  </tr>
</table>

## 配套插件

- [dsh-llm-multimodal](https://github.com/xiaokaizhou/dsh-llm-multimodal)：文本/图像/视频/视觉/语音/音乐生成。
- [dsh-media-studio](https://github.com/xiaokaizhou/dsh-media-studio)：多项目无限画布与素材库。

## License

MIT
