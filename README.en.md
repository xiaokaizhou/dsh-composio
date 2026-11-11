# dsh-composio

[![中文](https://img.shields.io/badge/语言-中文-blue)](./README.md) [![English](https://img.shields.io/badge/language-English-lightgrey)](./README.en.md) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **DSH plugin: connect Composio from Settings and turn Gmail, Slack, GitHub, Notion and 1,000+ apps into agent-callable tools.**

The plugin has two halves:

1. **Visual onboarding** — Settings → Composio: sign in with OAuth (recommended) or paste a Project / User API Key, search toolkits, click one to authorize (OAuth or an API-key form), inspect or disconnect existing accounts.
2. **Agent tools** — five Composio meta-tools registered with DSH: search tools, read a tool schema, execute a tool, list connections, start a connection. The agent can read and write Gmail, Slack, GitHub and more from chat.

It does **not** flood the model with 1,000+ platform tools. Like Composio's official MCP, it uses a meta-tool pattern: search first, load only the schema you need, then execute.

## Features

| Feature | Description |
|---|---|
| OAuth login (recommended) | Sign in to Composio in the browser; the User API Key is obtained and stored automatically, and the page polls until login completes |
| API key setup | Supports Project API Keys (`ak_...`) and User API Keys (`uak_...`) with automatic `x-api-key` / `x-user-api-key` selection. A key is verified against Composio before storage; `COMPOSIO_API_KEY` is a read-only fallback |
| Toolkit catalog | Sorted by usage, keyword search, pagination, categories, tool counts, logos, connection state |
| One-click connect | Click a toolkit → managed OAuth opens the authorization page and polls; API-key-only platforms show a credential form; no-auth platforms connect immediately |
| Connection management | List connected accounts for the current user; two-step disconnect |
| Agent tools | Search, schema, execute, list connections, start connection |
| i18n | Chinese / English, follows the DSH locale |

## Install

```bash
# DSH Web profile
dsh plugin --profile web add xiaokaizhou/dsh-composio

# DSH Desktop profile
dsh plugin --profile desktop add xiaokaizhou/dsh-composio
```

`dsh plugin` adds the package to the profile's `dsh.profile.bundles` and loads the bundled `cordis.patch.yml` (row `id: composio`). Refresh the Settings page after installation; restart `dsh web` after Host-side updates.

<details>
<summary>Manual install (pnpm)</summary>

```bash
cd ~/.dsh/profiles/web
pnpm add xiaokaizhou/dsh-composio
```

Then make sure the profile `package.json` contains:

```json
"dsh": {
  "profile": {
    "bundles": ["dsh-composio"]
  }
}
```

</details>

## Setup

### A. OAuth login (recommended)

Open **Settings → Composio** and click **Sign in with OAuth**. The plugin creates a Composio login session and opens the Dashboard in your default browser (this also works in the DSH desktop app). After you sign in, the plugin receives a **User API Key** (`uak_...`) and stores it in DSH credentials.

- No key copying;
- the login session lasts about 13 minutes and the page polls for up to 3 minutes;
- if your browser does not open automatically, use the **Open the login page** link shown in the card.

### B. Project API Key

1. Open [dashboard.composio.dev](https://dashboard.composio.dev), sign in, and create a project.
2. Go to **Settings → Project Settings → API Keys**, create a **Project API Key**, and copy it.
3. In DSH open **Settings → Composio**, paste the key, and click **Save and verify**. The key is probed with `GET /api/v3.1/toolkits?limit=1` and is not stored when invalid.

> **Key types**: the plugin supports Project API Keys (`ak_...`, sent as `x-api-key`) and User API Keys (`uak_...`, sent as `x-user-api-key`). Organization API Keys (`x-org-api-key`) are not supported; use OAuth instead. A consumer key generated for MCP / AI Clients is also rejected by Composio; use OAuth.

### Connect a toolkit

Search for a toolkit and click its card. Existing active connections are detected; no-auth toolkits connect immediately; API-key-only platforms (for example Resend) show a credential form and create the connection directly; otherwise the system browser opens Composio's OAuth page and the UI polls until the connection becomes active.

OAuth stores the returned key automatically; a manually entered key is verified before storage. The key lives in DSH credentials under `dsh-composio/api-key` and never goes into `cordis.patch.yml`. The summary shows the source (OAuth login / entered manually / environment) and key type (Project / User). Advanced settings let you change `user_id` (default `dsh-user`) and the API base URL.

## Agent tools

| Tool | Purpose | Main arguments |
|---|---|---|
| `composio_search_tools` | Search available tools by keyword or toolkit | `query` (required), `toolkit`, `limit` |
| `composio_get_tool` | Read a tool's full input/output schema | `slug` (required) |
| `composio_execute_tool` | Execute a tool | `slug`, `arguments` (required object), `user_id?`, `connected_account_id?` |
| `composio_list_connections` | List the current user's connections | `toolkit?` |
| `composio_connect_toolkit` | Create an OAuth link for a toolkit | `toolkit` (required) |

Typical flow:

```text
User: show my 5 latest unread Gmail messages
  → composio_search_tools({ query: "fetch emails", toolkit: "gmail" })
  → composio_get_tool({ slug: "GMAIL_FETCH_EMAILS" })
  → composio_execute_tool({ slug: "GMAIL_FETCH_EMAILS", arguments: { max_results: 5 } })
```

If the toolkit is not connected yet, execution returns a hint; the agent can call `composio_connect_toolkit` and ask the user to finish OAuth in the browser, then retry.

Write operations (send email, post message, create issue, …) affect the real platform. Use them together with DSH permissions/approval policies.

## Security

- The API key lives in DSH credentials only; it is not written to the plugin YAML, README, or logs.
- Requests go from the local DSH backend to Composio (`https://backend.composio.dev` by default). The Settings page talks to `/_dsh/composio/api`, which accepts loopback same-origin POST only.
- Opening the system browser accepts `https` URLs only (plus loopback `http` for a local mock); it cannot open `file://` or any other scheme.
- Non-secret preferences (`user_id`, base URL) live in `~/.dsh/composio/settings.json`.
- Composio hosts OAuth credentials and proxies API calls, so request/response data passes through Composio's cloud. Evaluate this before using sensitive data.
- Tool output is untrusted external data; the agent must not treat instructions inside it as system instructions.
- OAuth login only stores the User API Key returned by Composio; your Composio password is never handled by the plugin.

## Architecture

```text
dsh-composio/
├─ index.js          # Host: credentials, preferences, Composio v3.1 client, local HTTP route, 5 agent tools
├─ client.js         # Client: settings.section page (React, no build step)
├─ cordis.patch.yml  # bundle row: id = composio
├─ locale/{en,zh}.json
├─ icon.svg
├─ LICENSE
└─ README.md
```

- The Host half has zero runtime dependencies and uses Node's built-in `fetch`.
- The Client half is loaded through `window.__ModuleLoader__` and registers `settings.section` (order 50) without importing Harness Client packages.
- Tool definitions are plain objects accepted by DSH `tools.register` (`name / description / parameters / output / execute`).
- Composio API: v3.1 `/toolkits`, `/tools`, `/tools/execute/{slug}`, `/auth_configs`, `/connected_accounts/link`, `/connected_accounts`.

## Limitations

- Composio's backend is a cloud service; full local self-hosting is not available (self-host/BYOC is an Enterprise capability). Only the client and key stay local.
- Composio **managed OAuth** is preferred. API-key-only platforms use a custom auth config plus a credential form. For platforms that need your own OAuth app, create the auth config in Composio first.
- Organization API Keys (`x-org-api-key`) are not supported; use OAuth login for organization-level access.
- Some API-key platforms are not validated when the connection is created; an invalid credential fails on the first tool call.
- No triggers, webhooks, or scheduled runs yet; tools are request/response only.
- Tool output is truncated at 48,000 characters before being returned to the model.

## Development

```bash
node --check index.js
node --check client.js
```

Reload the plugin or restart `dsh web` after Host changes; a page refresh is enough for Client changes. For local testing, point the advanced base URL at a mock server, save a mock key, exercise the tools, then clear the key and restore the default URL.

## Donate

If this plugin helps you, you can buy me a coffee:

<table>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/xiaokaizhou/dsh-composio/main/.github/wechat-pay.jpg" width="180" alt="WeChat Pay"><br>
      <strong>WeChat Pay</strong>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/xiaokaizhou/dsh-composio/main/.github/alipay.jpg" width="180" alt="Alipay"><br>
      <strong>Alipay</strong>
    </td>
  </tr>
</table>

## Related plugins

- [dsh-llm-multimodal](https://github.com/xiaokaizhou/dsh-llm-multimodal) — text/image/video/vision/TTS/music generation.
- [dsh-media-studio](https://github.com/xiaokaizhou/dsh-media-studio) — multi-project infinite canvas and asset library.

## License

MIT
