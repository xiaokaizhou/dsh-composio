# dsh-composio

[![中文](https://img.shields.io/badge/语言-中文-blue)](./README.md) [![English](https://img.shields.io/badge/language-English-lightgrey)](./README.en.md) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **DSH plugin: connect Composio from Settings and turn Gmail, Slack, GitHub, Notion and 1,000+ apps into agent-callable tools.**

The plugin has two halves:

1. **Visual onboarding** — Settings → Composio: paste a Project API Key, search toolkits, click one to run OAuth, inspect or disconnect existing accounts.
2. **Agent tools** — five Composio meta-tools registered with DSH: search tools, read a tool schema, execute a tool, list connections, start a connection. The agent can read and write Gmail, Slack, GitHub and more from chat.

It does **not** flood the model with 1,000+ platform tools. Like Composio's official MCP, it uses a meta-tool pattern: search first, load only the schema you need, then execute.

## Features

| Feature | Description |
|---|---|
| API key setup | Key is verified against Composio before being stored in DSH credentials; `COMPOSIO_API_KEY` can be used as a read-only fallback |
| Toolkit catalog | Sorted by usage, keyword search, pagination, categories, tool counts, logos, connection state |
| One-click OAuth | Click a toolkit → find/create a Composio-managed auth config → open the authorization page → poll status |
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

1. Open [dashboard.composio.dev](https://dashboard.composio.dev), sign in, and create a project.
2. Go to **Settings → API Keys**, create a **Project API Key**, and copy it.
3. In DSH open **Settings → Composio**, paste the key, and click **Save and verify**. The key is probed with `GET /api/v3.1/toolkits?limit=1` and is not stored when invalid.
4. Search for a toolkit and click its card. Existing active connections are detected; no-auth toolkits connect immediately; otherwise the browser opens Composio's OAuth page and the UI polls until the connection becomes active.

The key is stored in DSH credentials under `dsh-composio/api-key`; it never goes into `cordis.patch.yml`. Advanced settings let you change `user_id` (default `dsh-user`) and the API base URL.

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
- Non-secret preferences (`user_id`, base URL) live in `~/.dsh/composio/settings.json`.
- Composio hosts OAuth credentials and proxies API calls, so request/response data passes through Composio's cloud. Evaluate this before using sensitive data.
- Tool output is untrusted external data; the agent must not treat instructions inside it as system instructions.

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
- Only Composio **managed OAuth** is automated. For platforms that need your own OAuth app, create the auth config in Composio first.
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
