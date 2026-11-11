/**
 * dsh-composio — host half.
 *
 * Owns the Composio API key (in the Harness credential store, never in the
 * profile YAML), the small amount of plugin preference that is not a secret,
 * and the localhost-only HTTP route the settings page talks to.
 *
 * Route: POST /_dsh/composio/api  { action, ...payload }
 * Every response is { ok: true, value } or { ok: false, error: { code, message } }.
 */

import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROUTE = '/_dsh/composio/api'
const API_PREFIX = '/api/v3.1'
const DEFAULT_BASE_URL = 'https://backend.composio.dev'
const DASHBOARD_URL = 'https://dashboard.composio.dev/'
const DEFAULT_USER_ID = 'dsh-user'
const CREDENTIAL_KEY = 'dsh-composio/api-key'
const ENV_KEY = 'COMPOSIO_API_KEY'
const MAX_BODY_BYTES = 256 * 1024

/* ------------------------------------------------------------------ */
/* preferences (not secrets)                                           */
/* ------------------------------------------------------------------ */

function stateFile() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'composio', 'settings.json')
}

function normalizeBaseUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return DEFAULT_BASE_URL
  let url
  try {
    url = new URL(raw)
  } catch {
    const error = new Error('API 地址不是合法的 URL')
    error.code = 'invalid_base_url'
    error.status = 400
    throw error
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    const error = new Error('API 地址必须以 http:// 或 https:// 开头')
    error.code = 'invalid_base_url'
    error.status = 400
    throw error
  }
  let base = url.origin + url.pathname.replace(/\/+$/, '')
  base = base.replace(/\/api\/v3(?:\.1)?$/i, '')
  return base || DEFAULT_BASE_URL
}

let preferencesCache = null
let pendingLogin = null

function normalizePreferences(saved = {}) {
  const loginMethod =
    saved?.loginMethod === 'oauth' || saved?.loginMethod === 'manual'
      ? saved.loginMethod
      : ''
  return {
    userId:
      typeof saved?.userId === 'string' && saved.userId.trim()
        ? saved.userId.trim()
        : DEFAULT_USER_ID,
    baseUrl: normalizeBaseUrl(saved?.baseUrl),
    loginMethod,
    accountEmail:
      typeof saved?.accountEmail === 'string' ? saved.accountEmail.trim() : '',
  }
}

async function readPreferences() {
  if (preferencesCache) return preferencesCache
  let saved = null
  try {
    saved = JSON.parse(await fs.readFile(stateFile(), 'utf8'))
  } catch {
    saved = null
  }
  preferencesCache = normalizePreferences(saved)
  return preferencesCache
}

async function writePreferences(next) {
  const normalized = normalizePreferences({ ...(preferencesCache || {}), ...next })
  const target = stateFile()
  await fs.mkdir(path.dirname(target), { recursive: true })
  const temp = `${target}.${process.pid}.tmp`
  await fs.writeFile(temp, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  await fs.rename(temp, target)
  preferencesCache = normalized
  return normalized
}

/* ------------------------------------------------------------------ */
/* credentials                                                         */
/* ------------------------------------------------------------------ */

async function readApiKey(ctx) {
  try {
    const record = await ctx.credentials.readRecord(CREDENTIAL_KEY)
    if (record?.kind === 'api-key' && typeof record.key === 'string' && record.key.trim()) {
      return { key: record.key.trim(), source: 'store' }
    }
  } catch {
    /* The store may be locked or absent; the env fallback still works. */
  }
  const fromEnv = typeof process.env[ENV_KEY] === 'string' ? process.env[ENV_KEY].trim() : ''
  if (fromEnv) return { key: fromEnv, source: 'env' }
  return { key: '', source: null }
}

async function saveApiKey(ctx, key) {
  if (typeof ctx.credentials?.modifyRecord !== 'function') {
    const error = new Error('当前 DSH 配置没有可用的凭据存储，无法保存 API Key')
    error.code = 'credentials_unavailable'
    error.status = 500
    throw error
  }
  await ctx.credentials.modifyRecord(CREDENTIAL_KEY, () => ({ kind: 'api-key', key }))
}

async function clearApiKey(ctx) {
  if (typeof ctx.credentials?.deleteRecord !== 'function') return
  try {
    await ctx.credentials.deleteRecord(CREDENTIAL_KEY)
  } catch {
    /* Already absent is fine. */
  }
}

/* ------------------------------------------------------------------ */
/* Composio client                                                     */
/* ------------------------------------------------------------------ */

function keyTypeOf(key) {
  const value = typeof key === 'string' ? key.trim() : ''
  if (/^uak_/i.test(value)) return 'user'
  if (/^ak_/i.test(value)) return 'project'
  return value ? 'unknown' : null
}

function authHeadersFor(key) {
  return keyTypeOf(key) === 'user'
    ? { 'x-user-api-key': key }
    : { 'x-api-key': key }
}

async function composio(pathname, options = {}) {
  const {
    method = 'GET',
    apiKey,
    baseUrl,
    body,
    timeoutMs = 20_000,
  } = options
  const url = `${normalizeBaseUrl(baseUrl)}${API_PREFIX}${pathname}`
  const headers = { accept: 'application/json' }
  if (apiKey) Object.assign(headers, authHeadersFor(apiKey))
  if (body !== undefined) headers['content-type'] = 'application/json'
  const requestKeyType = keyTypeOf(apiKey)

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (cause) {
    const error = new Error(
      cause?.name === 'TimeoutError'
        ? '连接 Composio 超时，请检查网络后重试'
        : '无法连接 Composio，请检查网络或 API 地址',
    )
    error.code = cause?.name === 'TimeoutError' ? 'timeout' : 'network'
    error.status = 502
    throw error
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const detail =
      data?.error?.message ||
      data?.message ||
      (typeof data?.error === 'string' ? data.error : '') ||
      text.slice(0, 300) ||
      `HTTP ${response.status}`
    const error = new Error(detail)
    error.code = data?.error?.code || data?.code || 'composio_error'
    error.status = response.status
    error.composioMessage = detail
    if (requestKeyType) error.keyType = requestKeyType
    throw error
  }

  return data
}

function mapToolkit(toolkit, baseUrl) {
  const logo = toolkit?.meta?.logo || ''
  return {
    slug: toolkit?.slug || '',
    name: toolkit?.name || toolkit?.slug || '',
    description: toolkit?.meta?.description || '',
    logo:
      logo.startsWith('/') && baseUrl ? `${normalizeBaseUrl(baseUrl)}${logo}` : logo,
    appUrl: toolkit?.meta?.app_url || '',
    categories: Array.isArray(toolkit?.meta?.categories)
      ? toolkit.meta.categories.map((category) => category?.name).filter(Boolean)
      : [],
    toolsCount: Number.isFinite(toolkit?.meta?.tools_count)
      ? toolkit.meta.tools_count
      : null,
    triggersCount: Number.isFinite(toolkit?.meta?.triggers_count)
      ? toolkit.meta.triggers_count
      : null,
    noAuth: Boolean(toolkit?.no_auth),
    managedSchemes: Array.isArray(toolkit?.composio_managed_auth_schemes)
      ? toolkit.composio_managed_auth_schemes
      : [],
    authGuideUrl: toolkit?.auth_guide_url || '',
  }
}

function requireKey(key) {
  if (!key) {
    const error = new Error('请先填写 Composio API Key')
    error.code = 'missing_key'
    error.status = 401
    throw error
  }
}

function requireSlug(value) {
  const slug = typeof value === 'string' ? value.trim() : ''
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(slug)) {
    const error = new Error('平台标识不合法')
    error.code = 'invalid_slug'
    error.status = 400
    throw error
  }
  return slug
}

/* ------------------------------------------------------------------ */
/* actions                                                             */
/* ------------------------------------------------------------------ */

async function actionStatus(ctx) {
  const [preferences, key] = await Promise.all([readPreferences(), readApiKey(ctx)])
  return {
    configured: Boolean(key.key),
    source: key.source,
    keyType: key.key ? keyTypeOf(key.key) : null,
    loginMethod: key.source === 'env' ? 'env' : key.key ? preferences.loginMethod || 'manual' : '',
    accountEmail: preferences.accountEmail || '',
    userId: preferences.userId,
    baseUrl: preferences.baseUrl,
  }
}

async function actionSaveKey(ctx, payload) {
  const key = typeof payload.apiKey === 'string' ? payload.apiKey.trim() : ''
  if (!key) {
    const error = new Error('请填写 API Key')
    error.code = 'missing_key'
    error.status = 400
    throw error
  }
  if (key.length < 8 || key.length > 512) {
    const error = new Error('API Key 长度不正确')
    error.code = 'invalid_key'
    error.status = 400
    throw error
  }

  const preferences = await readPreferences()
  // Verify before persisting, so a typo never replaces a working key.
  const probe = await composio('/toolkits?limit=1', {
    apiKey: key,
    baseUrl: preferences.baseUrl,
  })
  await saveApiKey(ctx, key)
  await writePreferences({
    ...(await readPreferences()),
    loginMethod: 'manual',
    accountEmail: '',
  })
  return {
    ...(await actionStatus(ctx)),
    verified: true,
    toolkitTotal: Number.isFinite(probe?.total_items) ? probe.total_items : null,
  }
}

async function actionClearKey(ctx) {
  await clearApiKey(ctx)
  await writePreferences({
    ...(await readPreferences()),
    loginMethod: '',
    accountEmail: '',
  })
  return actionStatus(ctx)
}

function requireLoginSessionId(value) {
  const id = typeof value === 'string' ? value.trim() : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    const error = new Error('OAuth 登录会话不合法')
    error.code = 'invalid_login_session'
    error.status = 400
    throw error
  }
  return id
}

function loginExpired(message = 'OAuth 登录已过期，请重新发起登录') {
  pendingLogin = null
  const error = new Error(message)
  error.code = 'login_expired'
  error.status = 410
  return error
}

async function actionStartLogin(ctx) {
  const preferences = await readPreferences()
  const session = await composio('/cli/create-session', {
    method: 'POST',
    body: { scope: 'user' },
    baseUrl: preferences.baseUrl,
  })
  const sessionId = typeof session?.id === 'string' ? session.id.trim() : ''
  if (!sessionId) {
    const error = new Error('Composio 没有返回登录会话')
    error.code = 'login_failed'
    error.status = 502
    throw error
  }
  pendingLogin = { id: sessionId, expiresAt: session?.expiresAt || '' }
  return {
    sessionId,
    loginUrl: `${DASHBOARD_URL}?cliKey=${encodeURIComponent(sessionId)}`,
    expiresAt: session?.expiresAt || '',
  }
}

async function actionPollLogin(ctx, payload) {
  const sessionId = requireLoginSessionId(payload?.sessionId)
  if (!pendingLogin || pendingLogin.id !== sessionId) {
    const error = new Error('登录会话已失效，请重新发起 OAuth 登录')
    error.code = 'login_not_found'
    error.status = 404
    throw error
  }

  const preferences = await readPreferences()
  let session
  try {
    session = await composio(`/cli/get-session?id=${encodeURIComponent(sessionId)}`, {
      baseUrl: preferences.baseUrl,
    })
  } catch (cause) {
    if (cause?.status === 401 || cause?.status === 403) {
      pendingLogin = null
      throw loginExpired('OAuth 登录会话已失效，请重新发起登录')
    }
    throw cause
  }

  if (!pendingLogin || pendingLogin.id !== sessionId) {
    const error = new Error('登录已取消，请重新发起 OAuth 登录')
    error.code = 'login_cancelled'
    error.status = 409
    throw error
  }

  const expiresAt = session?.expiresAt || pendingLogin.expiresAt
  const expired = expiresAt && Date.parse(expiresAt) <= Date.now()
  if (expired) throw loginExpired()

  if (session?.status === 'linked') {
    const apiKey = typeof session.api_key === 'string' ? session.api_key.trim() : ''
    if (!apiKey) throw loginExpired('OAuth 登录已完成，但没有返回 API Key，请重新登录')

    // The returned key is a User API key. Probe it before persisting so a
    // project mismatch is reported here rather than on the next tool call.
    const probe = await composio('/toolkits?limit=1', {
      apiKey,
      baseUrl: preferences.baseUrl,
    })
    await saveApiKey(ctx, apiKey)
    const accountEmail =
      typeof session?.account?.email === 'string' ? session.account.email.trim() : ''
    await writePreferences({ ...preferences, loginMethod: 'oauth', accountEmail })
    pendingLogin = null
    return {
      ...(await actionStatus(ctx)),
      verified: true,
      toolkitTotal: Number.isFinite(probe?.total_items) ? probe.total_items : null,
      accountEmail,
    }
  }

  if (session?.status && session.status !== 'pending') {
    throw loginExpired(`OAuth 登录未完成（${session.status}），请重新发起登录`)
  }

  return {
    status: 'pending',
    sessionId,
    expiresAt,
  }
}

function actionCancelLogin() {
  pendingLogin = null
  return { cancelled: true }
}

function normalizeExternalUrl(value) {
  let parsed
  try {
    parsed = new URL(String(value || ''))
  } catch {
    const error = new Error('无法打开这个链接')
    error.code = 'invalid_url'
    error.status = 400
    throw error
  }
  const loopback = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost' || parsed.hostname === '::1' || parsed.hostname === '[::1]'
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    const error = new Error('只允许用系统浏览器打开 https 链接')
    error.code = 'invalid_url'
    error.status = 400
    throw error
  }
  return parsed.href
}

function openInSystemBrowser(target) {
  const command = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'cmd'
      : 'xdg-open'
  const args = process.platform === 'win32'
    ? ['/c', 'start', '', target]
    : [target]
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: 15_000, windowsHide: true }, (cause) => {
      if (cause) reject(cause)
      else resolve()
    })
  })
}

async function actionOpenExternal(ctx, payload) {
  const url = normalizeExternalUrl(payload?.url)
  try {
    await openInSystemBrowser(url)
  } catch (cause) {
    const error = new Error('无法自动打开系统浏览器，请点击页面上的链接手动打开')
    error.code = 'open_failed'
    error.status = 502
    error.details = { url }
    throw error
  }
  return { opened: true, url }
}

async function actionSaveSettings(ctx, payload) {
  const previous = await readPreferences()
  const userId =
    typeof payload.userId === 'string' ? payload.userId.trim() : previous.userId
  if (!userId || userId.length > 128 || /\s/.test(userId)) {
    const error = new Error('User ID 不能为空、不能包含空白，且最多 128 个字符')
    error.code = 'invalid_user_id'
    error.status = 400
    throw error
  }
  const baseUrl = normalizeBaseUrl(
    typeof payload.baseUrl === 'string' ? payload.baseUrl : previous.baseUrl,
  )
  await writePreferences({ userId, baseUrl })
  return actionStatus(ctx)
}

async function actionToolkits(ctx, payload) {
  const key = await readApiKey(ctx)
  requireKey(key.key)
  const preferences = await readPreferences()

  const search = typeof payload.search === 'string' ? payload.search.trim().slice(0, 80) : ''
  const cursor = typeof payload.cursor === 'string' ? payload.cursor : ''
  const limit = Math.min(48, Math.max(1, Number(payload.limit) || 24))

  const query = new URLSearchParams()
  query.set('limit', String(limit))
  query.set('sort_by', 'usage')
  if (search) query.set('search', search)
  if (cursor) query.set('cursor', cursor)

  const data = await composio(`/toolkits?${query.toString()}`, {
    apiKey: key.key,
    baseUrl: preferences.baseUrl,
  })

  return {
    items: Array.isArray(data?.items)
      ? data.items.map((item) => mapToolkit(item, preferences.baseUrl))
      : [],
    nextCursor: data?.next_cursor || null,
    total: Number.isFinite(data?.total_items) ? data.total_items : null,
  }
}

function mapConnection(account) {
  return {
    id: account?.id || '',
    slug: account?.toolkit?.slug || '',
    name: account?.toolkit?.name || account?.toolkit?.slug || 'Unknown',
    status: String(account?.status || 'UNKNOWN').toUpperCase(),
    authScheme: account?.auth_scheme || account?.authScheme || '',
    alias: account?.alias || '',
    error: account?.status_reason || '',
  }
}

async function actionConnections(ctx, payload) {
  const key = await readApiKey(ctx)
  requireKey(key.key)
  const preferences = await readPreferences()

  const query = new URLSearchParams()
  query.set('user_ids', preferences.userId)
  query.set('limit', '100')
  if (Array.isArray(payload.slugs) && payload.slugs.length) {
    const slugs = payload.slugs
      .map((slug) => (typeof slug === 'string' ? slug.trim() : ''))
      .filter(Boolean)
      .slice(0, 50)
    if (slugs.length) query.set('toolkit_slugs', slugs.join(','))
  }

  const data = await composio(`/connected_accounts?${query.toString()}`, {
    apiKey: key.key,
    baseUrl: preferences.baseUrl,
  })

  return {
    items: Array.isArray(data?.items) ? data.items.map(mapConnection) : [],
    userId: preferences.userId,
  }
}

async function findManagedAuthConfig(ctx, preferences, slug, key) {
  const data = await composio(
    `/auth_configs?toolkit_slug=${encodeURIComponent(slug)}&is_composio_managed=true&limit=20`,
    { apiKey: key, baseUrl: preferences.baseUrl },
  )
  const items = Array.isArray(data?.items) ? data.items : []
  return items.find((item) => String(item?.status || '').toUpperCase() === 'ENABLED') || null
}

async function createManagedAuthConfig(ctx, preferences, slug, key) {
  try {
    const data = await composio('/auth_configs', {
      method: 'POST',
      apiKey: key,
      baseUrl: preferences.baseUrl,
      body: {
        toolkit: { slug },
        auth_config: {
          type: 'use_composio_managed_auth',
          credentials: {},
          restrict_to_following_tools: [],
        },
      },
    })
    return data?.auth_config || null
  } catch (cause) {
    // A concurrent request may have created it between our GET and POST.
    if (cause?.status === 409 || cause?.status === 422) {
      const existing = await findManagedAuthConfig(ctx, preferences, slug, key)
      if (existing) return existing
    }
    throw cause
  }
}

async function connectToolkit(ctx, slugValue) {
  const key = await readApiKey(ctx)
  requireKey(key.key)
  const preferences = await readPreferences()
  const slug = requireSlug(slugValue)

  const toolkitData = await composio(
    `/toolkits?search=${encodeURIComponent(slug)}&limit=50`,
    { apiKey: key.key, baseUrl: preferences.baseUrl },
  )
  const toolkit = Array.isArray(toolkitData?.items)
    ? toolkitData.items.find((item) => item?.slug === slug)
    : null
  if (!toolkit) {
    const error = new Error('没有找到这个平台')
    error.code = 'unknown_toolkit'
    error.status = 404
    throw error
  }
  if (toolkit.no_auth) {
    return { noAuth: true, message: '该平台无需授权即可使用' }
  }

  // Already connected? Reconnecting would create a duplicate account.
  const existingQuery = new URLSearchParams()
  existingQuery.set('user_ids', preferences.userId)
  existingQuery.set('toolkit_slugs', slug)
  existingQuery.set('statuses', 'ACTIVE,INITIALIZING')
  existingQuery.set('limit', '10')
  const existingData = await composio(
    `/connected_accounts?${existingQuery.toString()}`,
    { apiKey: key.key, baseUrl: preferences.baseUrl },
  )
  const existing = Array.isArray(existingData?.items)
    ? existingData.items.find((item) =>
        ['ACTIVE', 'INITIALIZING'].includes(String(item?.status || '').toUpperCase()),
      )
    : null
  if (existing) {
    return {
      alreadyConnected: true,
      status: existing.status,
      connectedAccountId: existing.id,
      message: '该平台已经连接',
    }
  }

  let authConfig = await findManagedAuthConfig(ctx, preferences, slug, key.key)
  if (!authConfig) {
    const managedSchemes = Array.isArray(toolkit.composio_managed_auth_schemes)
      ? toolkit.composio_managed_auth_schemes
      : []
    if (!managedSchemes.length) {
      const error = new Error(
        '这个平台暂不支持 Composio 托管授权，需要先在 Composio 控制台配置自定义认证',
      )
      error.code = 'no_managed_auth'
      error.status = 409
      error.details = {
        authGuideUrl: toolkit.auth_guide_url || '',
        appUrl: toolkit?.meta?.app_url || '',
      }
      throw error
    }
    authConfig = await createManagedAuthConfig(ctx, preferences, slug, key.key)
  }
  if (!authConfig?.id) {
    const error = new Error('无法为这个平台创建授权配置')
    error.code = 'auth_config_failed'
    error.status = 502
    throw error
  }

  const link = await composio('/connected_accounts/link', {
    method: 'POST',
    apiKey: key.key,
    baseUrl: preferences.baseUrl,
    timeoutMs: 30_000,
    body: {
      auth_config_id: authConfig.id,
      user_id: preferences.userId,
    },
  })

  if (!link?.redirect_url) {
    const error = new Error('Composio 没有返回授权链接，请稍后重试')
    error.code = 'link_failed'
    error.status = 502
    throw error
  }

  return {
    redirectUrl: link.redirect_url,
    connectedAccountId: link.connected_account_id || null,
    expiresAt: link.expires_at || null,
  }
}

async function actionConnect(ctx, payload) {
  return connectToolkit(ctx, payload?.slug)
}

async function actionDisconnect(ctx, payload) {
  const key = await readApiKey(ctx)
  requireKey(key.key)
  const preferences = await readPreferences()
  const id = typeof payload.id === 'string' ? payload.id.trim() : ''
  if (!id || id.length > 128) {
    const error = new Error('连接标识不合法')
    error.code = 'invalid_connection'
    error.status = 400
    throw error
  }
  await composio(`/connected_accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    apiKey: key.key,
    baseUrl: preferences.baseUrl,
  })
  return { ok: true }
}


/* ------------------------------------------------------------------ */
/* Agent tools                                                         */
/* ------------------------------------------------------------------ */

function toolFailure(code, message, extra = {}) {
  return { success: false, code, message, ...extra }
}

function toolFailureFrom(cause, fallbackMessage = 'Composio request failed') {
  const code = cause?.code || 'composio_error'
  const message = cause?.message || fallbackMessage
  const hint =
    code === 'missing_key'
      ? 'Open DSH Settings → Composio and save a Project API Key, then retry.'
      : /connect|connected account|no account/i.test(message)
        ? 'The app is not connected for this user. Call composio_connect_toolkit, give the returned URL to the user, and retry after authorization.'
        : undefined
  return toolFailure(code, message, hint ? { hint } : {})
}

async function toolConfig(ctx) {
  const [{ key }, preferences] = await Promise.all([readApiKey(ctx), readPreferences()])
  if (!key) {
    const error = new Error(
      'Composio API Key is not configured. Open DSH Settings → Composio and save a Project API Key.',
    )
    error.code = 'missing_key'
    error.status = 401
    throw error
  }
  return { key, preferences }
}

function compactText(value, limit = 240) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit)
}

function mapToolSummary(item) {
  const toolkit = item?.toolkit || {}
  const input = item?.input_parameters && typeof item.input_parameters === 'object'
    ? item.input_parameters
    : {}
  return {
    slug: item?.slug || '',
    name: item?.name || item?.slug || '',
    toolkit: {
      slug: toolkit?.slug || '',
      name: toolkit?.name || toolkit?.slug || '',
    },
    description: compactText(item?.description || item?.human_description, 240),
    noAuth: Boolean(item?.no_auth),
    tags: Array.isArray(item?.tags) ? item.tags.slice(0, 6) : [],
    requiredInputs: Object.entries(input)
      .filter(([, spec]) => spec && spec.required === true)
      .map(([name]) => name),
  }
}

function mapToolDetail(item) {
  const toolkit = item?.toolkit || {}
  return {
    slug: item?.slug || '',
    name: item?.name || item?.slug || '',
    toolkit: {
      slug: toolkit?.slug || '',
      name: toolkit?.name || toolkit?.slug || '',
      logo: toolkit?.logo || '',
    },
    description: item?.description || item?.human_description || '',
    noAuth: Boolean(item?.no_auth),
    version: item?.version || '',
    tags: Array.isArray(item?.tags) ? item.tags : [],
    inputParameters:
      item?.input_parameters && typeof item.input_parameters === 'object'
        ? item.input_parameters
        : {},
    outputParameters:
      item?.output_parameters && typeof item.output_parameters === 'object'
        ? item.output_parameters
        : {},
  }
}

async function toolSearchTools(ctx, args) {
  try {
    const { key, preferences } = await toolConfig(ctx)
    const query = typeof args?.query === 'string' ? args.query.trim() : ''
    if (!query) return toolFailure('invalid_arguments', 'query is required')
    const toolkit = typeof args?.toolkit === 'string' ? args.toolkit.trim() : ''
    const limit = Math.min(50, Math.max(1, Number(args?.limit) || 15))

    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('query', query.slice(0, 200))
    params.set('include_deprecated', 'false')
    if (toolkit) params.set('toolkit_slug', toolkit.slice(0, 64))

    const data = await composio(`/tools?${params.toString()}`, {
      apiKey: key,
      baseUrl: preferences.baseUrl,
      timeoutMs: 30_000,
    })
    const items = Array.isArray(data?.items) ? data.items : []
    const tools = items.map(mapToolSummary)
    return {
      success: true,
      count: tools.length,
      total: Number.isFinite(data?.total_items) ? data.total_items : null,
      tools,
      ...(tools.length
        ? {}
        : { message: `No Composio tools matched "${query}". Try a shorter keyword or omit toolkit.` }),
    }
  } catch (cause) {
    return toolFailureFrom(cause, 'Tool search failed')
  }
}

async function toolGetTool(ctx, args) {
  try {
    const { key, preferences } = await toolConfig(ctx)
    const slug = typeof args?.slug === 'string' ? args.slug.trim() : ''
    if (!slug) return toolFailure('invalid_arguments', 'slug is required')
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,199}$/.test(slug)) {
      return toolFailure('invalid_arguments', 'slug contains unsupported characters')
    }

    const params = new URLSearchParams()
    params.set('tool_slugs', slug)
    params.set('limit', '1')
    const data = await composio(`/tools?${params.toString()}`, {
      apiKey: key,
      baseUrl: preferences.baseUrl,
      timeoutMs: 30_000,
    })
    const items = Array.isArray(data?.items) ? data.items : []
    let item = items.find((candidate) => String(candidate?.slug || '').toLowerCase() === slug.toLowerCase())

    if (!item) {
      const fallbackParams = new URLSearchParams()
      fallbackParams.set('query', slug)
      fallbackParams.set('limit', '10')
      const fallback = await composio(`/tools?${fallbackParams.toString()}`, {
        apiKey: key,
        baseUrl: preferences.baseUrl,
        timeoutMs: 30_000,
      })
      const candidates = Array.isArray(fallback?.items) ? fallback.items : []
      item = candidates.find(
        (candidate) => String(candidate?.slug || '').toLowerCase() === slug.toLowerCase(),
      )
      if (!item) {
        return {
          success: false,
          code: 'tool_not_found',
          message: `No Composio tool with slug "${slug}".`,
          suggestions: candidates.slice(0, 10).map(mapToolSummary),
        }
      }
    }

    return { success: true, tool: mapToolDetail(item) }
  } catch (cause) {
    return toolFailureFrom(cause, 'Tool lookup failed')
  }
}

async function toolExecuteTool(ctx, args) {
  try {
    const { key, preferences } = await toolConfig(ctx)
    const slug = typeof args?.slug === 'string' ? args.slug.trim() : ''
    if (!slug) return toolFailure('invalid_arguments', 'slug is required')
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,199}$/.test(slug)) {
      return toolFailure('invalid_arguments', 'slug contains unsupported characters')
    }

    let input = args?.arguments
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input)
      } catch {
        return toolFailure('invalid_arguments', 'arguments must be a JSON object')
      }
    }
    if (input === undefined || input === null) input = {}
    if (typeof input !== 'object' || Array.isArray(input)) {
      return toolFailure('invalid_arguments', 'arguments must be a JSON object')
    }

    const userId =
      typeof args?.user_id === 'string' && args.user_id.trim()
        ? args.user_id.trim().slice(0, 128)
        : preferences.userId
    const body = { user_id: userId, arguments: input }
    if (typeof args?.connected_account_id === 'string' && args.connected_account_id.trim()) {
      body.connected_account_id = args.connected_account_id.trim().slice(0, 128)
    }

    const data = await composio(`/tools/execute/${encodeURIComponent(slug)}`, {
      method: 'POST',
      apiKey: key,
      baseUrl: preferences.baseUrl,
      body,
      timeoutMs: 120_000,
    })

    if (data?.successful === false || data?.error) {
      const message = String(data?.error || 'Composio reported a failed execution')
      const hint = /connect|connected account|no account|auth/i.test(message)
        ? 'The app is not connected for this user. Call composio_connect_toolkit, give the returned URL to the user, and retry after authorization.'
        : undefined
      return toolFailure('tool_execution_failed', message, {
        data: data?.data ?? null,
        logId: data?.log_id ?? null,
        ...(hint ? { hint } : {}),
      })
    }

    return {
      success: true,
      data: data?.data ?? null,
      logId: data?.log_id ?? null,
      ...(data?.session_info ? { sessionInfo: data.session_info } : {}),
    }
  } catch (cause) {
    return toolFailureFrom(cause, 'Tool execution failed')
  }
}

async function toolListConnections(ctx, args) {
  try {
    const { key, preferences } = await toolConfig(ctx)
    const toolkit = typeof args?.toolkit === 'string' ? args.toolkit.trim() : ''
    const params = new URLSearchParams()
    params.set('user_ids', preferences.userId)
    params.set('limit', '100')
    if (toolkit) params.set('toolkit_slugs', toolkit.slice(0, 64))

    const data = await composio(`/connected_accounts?${params.toString()}`, {
      apiKey: key,
      baseUrl: preferences.baseUrl,
      timeoutMs: 30_000,
    })
    const connections = Array.isArray(data?.items) ? data.items.map(mapConnection) : []
    return {
      success: true,
      userId: preferences.userId,
      count: connections.length,
      connections,
    }
  } catch (cause) {
    return toolFailureFrom(cause, 'Listing connections failed')
  }
}

async function toolConnectToolkit(ctx, args) {
  try {
    const slug = requireSlug(args?.toolkit)
    const result = await connectToolkit(ctx, slug)
    if (result?.redirectUrl) {
      return {
        success: true,
        ...result,
        instruction:
          'Give this URL to the user and ask them to finish the OAuth flow in a browser. After authorization the connection becomes ACTIVE automatically.',
      }
    }
    return {
      success: true,
      ...result,
      instruction: result?.alreadyConnected
        ? 'The app is already connected; you can execute its tools now.'
        : 'No OAuth step is required for this app.',
    }
  } catch (cause) {
    return toolFailureFrom(cause, 'Creating the connection link failed')
  }
}

const TOOL_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: {
    success: { type: 'boolean' },
    code: { type: 'string' },
    message: { type: 'string' },
    hint: { type: 'string' },
  },
}

function renderToolOutput(_args, value) {
  let text
  try {
    text = JSON.stringify(value, null, 2)
  } catch {
    text = String(value)
  }
  if (text.length > 48_000) text = `${text.slice(0, 48_000)}\n... [truncated]`
  return [{ type: 'text', text }]
}

function agentToolDefinitions(ctx) {
  return [
    {
      name: 'composio_search_tools',
      description:
        "Search Composio's tool catalog for actions in external apps (Gmail, Slack, GitHub, Notion, Google Drive, Linear, ...). Use this first when the user asks to read or send email, post to Slack, create a GitHub issue, update Notion, etc. Returns tool slugs and required input names. Next call composio_get_tool for the full input schema, then composio_execute_tool.",
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string', description: 'What the user wants to do, e.g. "send email" or "create issue".' },
          toolkit: { type: 'string', description: 'Optional toolkit slug to narrow the search, e.g. gmail, slack, github.' },
          limit: { type: 'number', description: 'Max results, 1-50. Default 15.' },
        },
        required: ['query'],
      },
      output: { schema: TOOL_OUTPUT_SCHEMA, render: renderToolOutput },
      timeoutMs: 40_000,
      execute: (args) => toolSearchTools(ctx, args),
    },
    {
      name: 'composio_get_tool',
      description:
        'Get the full input JSON schema for one Composio tool slug returned by composio_search_tools. Call this before composio_execute_tool so the arguments match the schema exactly.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          slug: { type: 'string', description: 'Composio tool slug, e.g. GMAIL_SEND_EMAIL.' },
        },
        required: ['slug'],
      },
      output: { schema: TOOL_OUTPUT_SCHEMA, render: renderToolOutput },
      timeoutMs: 40_000,
      execute: (args) => toolGetTool(ctx, args),
    },
    {
      name: 'composio_execute_tool',
      description:
        'Execute one Composio tool for the current DSH user. The target app must be connected first; if it is not, call composio_connect_toolkit and give the returned URL to the user. Pass arguments as a JSON object matching the input schema from composio_get_tool. Returns the external app response data.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          slug: { type: 'string', description: 'Composio tool slug to execute.' },
          arguments: { type: 'object', additionalProperties: true, description: 'Tool arguments; must match the input schema from composio_get_tool.' },
          user_id: { type: 'string', description: 'Optional Composio user id; defaults to the plugin-configured user.' },
          connected_account_id: { type: 'string', description: 'Optional specific connected account id.' },
        },
        required: ['slug', 'arguments'],
      },
      output: { schema: TOOL_OUTPUT_SCHEMA, render: renderToolOutput },
      timeoutMs: 150_000,
      execute: (args) => toolExecuteTool(ctx, args),
    },
    {
      name: 'composio_list_connections',
      description:
        'List the external accounts currently connected through Composio for this DSH user, including ACTIVE/INITIALIZING status. Use it to check whether Gmail, Slack, GitHub, or another app is ready before executing a tool.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          toolkit: { type: 'string', description: 'Optional toolkit slug, e.g. gmail.' },
        },
      },
      output: { schema: TOOL_OUTPUT_SCHEMA, render: renderToolOutput },
      timeoutMs: 40_000,
      execute: (args) => toolListConnections(ctx, args),
    },
    {
      name: 'composio_connect_toolkit',
      description:
        'Create a Composio OAuth link for an app (toolkit slug such as gmail, slack, github). Return the redirect URL to the user; the connection becomes ACTIVE after they finish authorization. If already connected, returns alreadyConnected=true without creating a duplicate.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          toolkit: { type: 'string', description: 'Toolkit slug to connect, e.g. gmail, slack, github.' },
        },
        required: ['toolkit'],
      },
      output: { schema: TOOL_OUTPUT_SCHEMA, render: renderToolOutput },
      timeoutMs: 60_000,
      execute: (args) => toolConnectToolkit(ctx, args),
    },
  ]
}

function registerAgentTools(toolsCtx) {
  const disposers = agentToolDefinitions(toolsCtx).map((definition) =>
    toolsCtx.tools.register(definition),
  )
  return () => {
    for (const dispose of disposers.reverse()) {
      try {
        dispose()
      } catch {
        /* Already disposed. */
      }
    }
  }
}

async function dispatch(ctx, action, payload) {
  switch (action) {
    case 'status':
      return actionStatus(ctx)
    case 'saveKey':
      return actionSaveKey(ctx, payload)
    case 'startLogin':
      return actionStartLogin(ctx)
    case 'pollLogin':
      return actionPollLogin(ctx, payload)
    case 'cancelLogin':
      return actionCancelLogin()
    case 'openExternal':
      return actionOpenExternal(ctx, payload)
    case 'clearKey':
      return actionClearKey(ctx)
    case 'saveSettings':
      return actionSaveSettings(ctx, payload)
    case 'toolkits':
      return actionToolkits(ctx, payload)
    case 'connections':
      return actionConnections(ctx, payload)
    case 'connect':
      return actionConnect(ctx, payload)
    case 'disconnect':
      return actionDisconnect(ctx, payload)
    default: {
      const error = new Error(`未知操作：${action || '(empty)'}`)
      error.code = 'unknown_action'
      error.status = 400
      throw error
    }
  }
}

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

function isLoopback(hostname) {
  return (
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname === '::ffff:127.0.0.1' ||
    hostname === 'localhost'
  )
}

function postVerdict(headers) {
  const contentType = String(headers?.['content-type'] || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return { status: 415, code: 'unsupported_media_type', message: '请求必须是 JSON' }
  }
  const origin = headers?.origin
  if (typeof origin === 'string' && origin) {
    try {
      if (!isLoopback(new URL(origin).hostname)) {
        return { status: 403, code: 'forbidden_origin', message: '只允许本机页面访问' }
      }
    } catch {
      return { status: 403, code: 'forbidden_origin', message: 'Origin 不合法' }
    }
  }
  const site = headers?.['sec-fetch-site']
  if (typeof site === 'string' && site && site !== 'same-origin' && site !== 'none') {
    return { status: 403, code: 'forbidden_origin', message: '只允许同源请求' }
  }
  return null
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      const error = new Error('请求体过大')
      error.code = 'body_too_large'
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    const error = new Error('请求体不是合法 JSON')
    error.code = 'invalid_json'
    error.status = 400
    throw error
  }
}

function sendJson(res, status, payload) {
  if (res.headersSent) return
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function errorPayload(cause) {
  const status = Number.isFinite(cause?.status) ? Number(cause.status) : 500
  let code = cause?.code || 'internal_error'
  let message = cause?.message || '操作失败'
  let details = cause?.details

  if (status === 401 && code !== 'missing_key') {
    code = 'invalid_key'
    const keyType = cause?.keyType || 'unknown'
    if (keyType === 'user') {
      message =
        'Composio 返回 401：User API Key 未被接受。请确认这个 key 属于当前项目，或改用 OAuth 登录 / Project API Key。'
    } else if (keyType === 'project') {
      message =
        'Composio 返回 401：Project API Key 无效或已过期。请到 Dashboard 的 Settings → Project Settings → API Keys 重新复制，或改用 OAuth 登录。'
    } else {
      message =
        'Composio 返回 401：Key 无效或类型不匹配。本插件支持 Project API Key（ak_...）和 User API Key（uak_...）；Organization API Key 请改用 OAuth 登录。'
    }
    details = {
      ...(details || {}),
      keyType,
      composioMessage: cause?.composioMessage || cause?.message || '',
    }
  } else if (status === 403) {
    message = `当前 API Key 没有权限：${message}`
  } else if (status === 429) {
    code = 'rate_limited'
    message = 'Composio 请求过于频繁，请稍后再试'
  } else if (status >= 500 && code === 'composio_error') {
    message = `Composio 服务暂时不可用：${message}`
  }

  return { code, message, status, ...(details ? { details } : {}) }
}

export const inject = ['webServer', 'credentials']

export function apply(ctx) {
  const handler = async (req, res) => {
    try {
      if (req.method !== 'POST') {
        sendJson(res, 405, {
          ok: false,
          error: { code: 'method_not_allowed', message: '只支持 POST' },
        })
        return
      }
      const verdict = postVerdict(req.headers)
      if (verdict) {
        sendJson(res, verdict.status, {
          ok: false,
          error: { code: verdict.code, message: verdict.message },
        })
        return
      }
      const payload = await readJsonBody(req)
      const action = typeof payload.action === 'string' ? payload.action : ''
      const value = await dispatch(ctx, action, payload)
      sendJson(res, 200, { ok: true, value })
    } catch (cause) {
      const error = errorPayload(cause)
      sendJson(res, error.status, { ok: false, error })
    }
  }

  ctx.inject(['tools'], (toolsCtx) => {
    toolsCtx.effect(
      () => registerAgentTools(toolsCtx),
      'dsh-composio: agent tools',
    )
  })

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const dispose = webCtx.webServer.register({
        kind: 'exact',
        path: ROUTE,
        handler,
      })
      return () => {
        try {
          dispose()
        } catch {
          /* Already gone. */
        }
      }
    }, 'dsh-composio: route')
  })
}
