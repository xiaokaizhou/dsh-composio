// dsh-composio — client half (settings page).
//
// This file is shipped as-is: it is plain browser JavaScript loaded through the
// Harness module loader, with React supplied by the host through require().
// Keep it dependency-free and run `node --check client.js` after edits.
window.__ModuleLoader__.load({ id: 'dsh-composio', factory: (require) => {
  var module = { exports: {} }; var exports = module.exports;
  'use strict';

  const React = require('react');
  const { useState, useEffect, useCallback, useRef, useMemo } = React;
  const h = React.createElement;

  // Harness supplies document.baseURI for reverse-proxy mounts.
  const ROUTE = '_dsh/composio/api';
  const POLL_MS = 2500;
  const AUTH_TIMEOUT_MS = 180000;

  /* ---------------------------------------------------------------- */
  /* strings                                                           */
  /* ---------------------------------------------------------------- */

  const UI = {
    zh: {
      nav: 'Composio',
      title: 'Composio 集成',
      subtitle: '连接 Gmail、Slack、GitHub、Notion 等 1,000+ 应用，让 DSH 直接替你操作这些平台。',
      dashboard: 'Dashboard',
      keyTitle: '接入你的 Composio 项目',
      keyBody: '先通过 OAuth 登录 Composio，或手动填写 Project API Key。Composio 托管各平台的 OAuth 授权与 Token 刷新，不必自己注册每个应用。',
      step1Title: '打开 Composio Dashboard',
      step1Body: '注册或登录，创建一个项目。',
      step2Title: '复制 Project API Key',
      step2Body: '进入 Settings → Project Settings → API Keys，创建并复制密钥。',
      step3Title: '粘贴并验证',
      step3Body: '保存时会调用一次 Composio 校验密钥。',
      openDashboard: '打开 Dashboard',
      keyPlaceholder: '粘贴 Project API Key（ak_...）或 User API Key（uak_...）',
      saveVerify: '保存并验证',
      verifying: '验证中…',
      keyPrivacy: '密钥只写入本机 DSH 凭据存储，不会写入配置文件，也不会发送到 Composio 以外的服务。',
      keyConfigured: 'Composio 已连接',
      keySourceStore: '本机凭据存储',
      keySourceOAuth: 'OAuth 登录',
      keySourceManual: '手动填写',
      keySourceEnv: '环境变量 COMPOSIO_API_KEY',
      keyTypeUser: 'User API Key',
      keyTypeProject: 'Project API Key',
      keyTypeUnknown: 'API Key',
      oauthTitle: '通过 OAuth 登录（推荐）',
      oauthBody: '在浏览器中登录 Composio，自动写入 User API Key，无需复制密钥。',
      oauthButton: 'OAuth 登录',
      oauthWaiting: '等待授权中…',
      oauthHint: '完成登录后会自动返回，最多等待 3 分钟。',
      oauthSuccess: 'OAuth 登录成功，已连接 Composio。',
      oauthFailed: 'OAuth 登录未完成，请重试。',
      oauthOpenFailed: '无法自动打开系统浏览器，请点击下方“打开登录页面”继续。',
      oauthOpenLink: '打开登录页面',
      oauthCancel: '取消登录',
      oauthConfigHint: 'OAuth 登录使用 Composio 账号，不需要手动复制 API Key。',
      orManual: '或手动填写 API Key',
      keyEnvLocked: '由环境变量提供，请在启动环境中修改或移除。',
      change: '更换',
      clear: '清除',
      clearConfirm: '确认清除？',
      cancel: '取消',
      save: '保存',
      keySaved: 'API Key 已验证并保存',
      keyCleared: '已清除本机保存的 API Key',
      keyRequired: '请先填写 API Key',
      keyInvalid: 'Key 无效或类型不匹配。可改用 OAuth 登录，或确认使用的是 Project API Key（ak_...）/ User API Key（uak_...）。',
      cannotReach: '无法连接 Composio，请检查网络或 API 地址。',
      timedOut: '连接 Composio 超时，请稍后重试。',
      rateLimited: '请求过于频繁，请稍后再试。',
      credentialsUnavailable: '当前 DSH 配置没有可用的凭据存储，无法保存 API Key。',
      advanced: '高级设置',
      userId: 'User ID',
      userIdHint: '连接会归到这个 ID 名下，用于区分不同用户的账号。',
      baseUrl: 'API 地址',
      baseUrlHint: '默认 https://backend.composio.dev，仅在使用代理或企业版时修改。',
      saveSettings: '保存设置',
      settingsSaved: '设置已保存',
      invalidSettings: '请检查 User ID 与 API 地址。',
      usageTitle: '本月用量',
      usagePlan: '套餐 {plan}',
      usageToolCalls: '工具调用',
      usageInstantCharge: 'Instant 费用',
      usageSessions: '会话',
      usageNoLimit: '未设置月度目标',
      usageSetGoal: '设置月度目标',
      usageRemaining: '剩余 {value}',
      usageUsed: '已用 {value}',
      usageOf: '{used} / {limit}',
      usageTopToolkits: '主要平台',
      usageUnavailable: '暂时无法读取用量：{message}',
      usageOfficialHint: 'Composio 公共 API 只返回实际用量，不返回官方配额；官方余量请到 Dashboard 账单页查看。',
      usageRange: '{from} – {to}',
      usageLimitLabel: '每月工具调用上限',
      usageLimitHint: '可选。填写套餐额度后，这里会显示已用 / 剩余进度。',
      usageBudgetLabel: '每月 Instant 预算（USD）',
      usageBudgetHint: '可选。填写月度预算后，这里会显示费用进度。',
      usageInvalidLimit: '请填写大于 0 的数字。',
      usageDashboard: '查看官方账单',
      usageRefresh: '刷新用量',
      usageGoalSaved: '月度目标已保存',
      connectedServices: '已连接的服务',
      connectedCount: '{n} 个',
      noConnections: '还没有连接任何服务。点击下面的平台卡片即可开始授权。',
      disconnect: '断开',
      confirmDisconnect: '确认断开',
      disconnecting: '断开中…',
      disconnected: '已断开连接',
      reconnect: '重新连接',
      connectedNow: '连接成功，现在可以让 DSH 使用这个平台了。',
      alreadyConnected: '这个平台已经连接，无需重复授权。',
      noAuthNotice: '这个平台无需授权即可使用。',
      connect: '连接',
      connecting: '请求中…',
      statusActive: '已连接',
      statusInitializing: '连接中',
      statusFailed: '授权失败',
      statusExpired: '已过期',
      statusOther: '未连接',
      appsTitle: '可用平台',
      appsTotal: '共 {n} 个平台',
      searchResults: '找到 {n} 个平台',
      searchPlaceholder: '搜索平台，例如 Gmail、Slack、Notion…',
      clearSearch: '清空搜索',
      refresh: '刷新',
      loading: '加载中…',
      loadMore: '加载更多',
      emptyTitle: '没有找到匹配的平台',
      emptyBody: '换个关键词试试，或清空搜索查看全部平台。',
      errorTitle: '加载失败',
      retry: '重试',
      toolsCount: '{n} 个工具',
      noKeyHint: '保存 API Key 后即可浏览全部平台。',
      waitingAuth: '正在等待你完成授权…',
      cancelWait: '取消等待',
      authTimeout: '还没有检测到连接完成。完成授权后会显示在已连接列表里。',
      authPopupBlocked: '无法自动打开系统浏览器。点击下面的按钮继续。',
      openAuth: '打开授权页面',
      connectFailed: '无法创建授权链接，请稍后重试。',
      credentialTitle: '连接 {name}',
      credentialBody: '这个平台不支持自动跳转授权，需要填写 {field}。',
      credentialPlaceholder: '粘贴 {label}',
      credentialSubmit: '连接',
      credentialConnecting: '连接中…',
      credentialRequired: '请填写 API Key',
      credentialRejected: 'API Key 被平台拒绝，请检查后重试。',
      credentialConnected: '连接已创建；凭据会在首次调用该平台工具时校验。',
      getApiKey: '获取 API Key',
      openPlatform: '打开平台页面',
      manualAuthOpened: '这个平台需要在平台页面完成授权配置，已为你打开页面。',
      openAuthGuide: '查看认证配置指南',
      managedAuthUnavailable: '这个平台暂不支持 Composio 托管授权，需要先在 Composio 控制台配置自定义认证。',
      unknownPlatform: '没有找到这个平台。',
      unknownError: '操作失败，请稍后重试。',
      dismiss: '关闭',
      footerNote: '由 Composio 提供连接能力 · 页面仅在本机可访问',
      docs: '文档',
      poweredBy: 'Powered by Composio',
    },
    en: {
      nav: 'Composio',
      title: 'Composio integrations',
      subtitle: 'Connect Gmail, Slack, GitHub, Notion and 1,000+ apps, and let DSH work across them for you.',
      dashboard: 'Dashboard',
      keyTitle: 'Connect your Composio project',
      keyBody: 'Sign in with OAuth, or paste a Project API Key. Composio hosts each app’s OAuth and token refresh, so you never register an app yourself.',
      step1Title: 'Open the Composio Dashboard',
      step1Body: 'Sign up or sign in and create a project.',
      step2Title: 'Copy the Project API Key',
      step2Body: 'Go to Settings → Project Settings → API Keys, create a key and copy it.',
      step3Title: 'Paste and verify',
      step3Body: 'Saving calls Composio once to validate the key.',
      openDashboard: 'Open Dashboard',
      keyPlaceholder: 'Paste a Project API Key (ak_...) or User API Key (uak_...)',
      saveVerify: 'Save and verify',
      verifying: 'Verifying…',
      keyPrivacy: 'The key is stored only in the local DSH credential store. It is never written to configuration files or sent anywhere except Composio.',
      keyConfigured: 'Composio connected',
      keySourceStore: 'Local credential store',
      keySourceOAuth: 'OAuth login',
      keySourceManual: 'Entered manually',
      keySourceEnv: 'COMPOSIO_API_KEY environment variable',
      keyTypeUser: 'User API Key',
      keyTypeProject: 'Project API Key',
      keyTypeUnknown: 'API Key',
      oauthTitle: 'Sign in with OAuth (recommended)',
      oauthBody: 'Sign in to Composio in your browser and the User API Key is saved automatically. No copying required.',
      oauthButton: 'Sign in with OAuth',
      oauthWaiting: 'Waiting for authorization…',
      oauthHint: 'This returns automatically after login; it waits up to 3 minutes.',
      oauthSuccess: 'Signed in with OAuth. Composio is connected.',
      oauthFailed: 'OAuth login did not finish. Please try again.',
      oauthOpenFailed: 'Could not open the system browser automatically. Use “Open the login page” below to continue.',
      oauthOpenLink: 'Open the login page',
      oauthCancel: 'Cancel login',
      oauthConfigHint: 'OAuth uses your Composio account; there is no API key to copy.',
      orManual: 'Or paste an API key manually',
      keyEnvLocked: 'Provided by the environment. Change or remove it in the launch environment.',
      change: 'Replace',
      clear: 'Clear',
      clearConfirm: 'Clear it?',
      cancel: 'Cancel',
      save: 'Save',
      keySaved: 'API key verified and saved',
      keyCleared: 'The locally saved API key was cleared',
      keyRequired: 'Enter an API key first',
      keyInvalid: 'The key is invalid or the type does not match. Use OAuth, or a Project API Key (ak_...) / User API Key (uak_...).',
      cannotReach: 'Could not reach Composio. Check the network or API URL.',
      timedOut: 'The Composio request timed out. Try again shortly.',
      rateLimited: 'Too many requests. Try again in a moment.',
      credentialsUnavailable: 'This DSH profile has no usable credential store, so the API key cannot be saved.',
      advanced: 'Advanced settings',
      userId: 'User ID',
      userIdHint: 'Connections are grouped under this ID to separate accounts of different users.',
      baseUrl: 'API URL',
      baseUrlHint: 'Default https://backend.composio.dev. Change only for a proxy or enterprise deployment.',
      saveSettings: 'Save settings',
      settingsSaved: 'Settings saved',
      invalidSettings: 'Check the User ID and API URL.',
      usageTitle: 'Usage this month',
      usagePlan: '{plan} plan',
      usageToolCalls: 'Tool calls',
      usageInstantCharge: 'Instant charges',
      usageSessions: 'Sessions',
      usageNoLimit: 'No monthly target set',
      usageSetGoal: 'Set monthly target',
      usageRemaining: '{value} remaining',
      usageUsed: '{value} used',
      usageOf: '{used} / {limit}',
      usageTopToolkits: 'Top toolkits',
      usageUnavailable: 'Could not read usage: {message}',
      usageOfficialHint: 'The public Composio API reports actual usage, not plan quota. Check the Dashboard billing page for official remaining quota.',
      usageRange: '{from} – {to}',
      usageLimitLabel: 'Monthly tool-call target',
      usageLimitHint: 'Optional. Enter your plan allowance to show used / remaining progress.',
      usageBudgetLabel: 'Monthly Instant budget (USD)',
      usageBudgetHint: 'Optional. Enter a monthly budget to show cost progress.',
      usageInvalidLimit: 'Enter a number greater than 0.',
      usageDashboard: 'View official billing',
      usageRefresh: 'Refresh usage',
      usageGoalSaved: 'Monthly target saved',
      connectedServices: 'Connected services',
      connectedCount: '{n}',
      noConnections: 'No service is connected yet. Click a toolkit card below to start authorizing.',
      disconnect: 'Disconnect',
      confirmDisconnect: 'Confirm disconnect',
      disconnecting: 'Disconnecting…',
      disconnected: 'Disconnected',
      reconnect: 'Reconnect',
      connectedNow: 'Connected. DSH can use this service now.',
      alreadyConnected: 'This service is already connected; no need to authorize again.',
      noAuthNotice: 'This service needs no authorization.',
      connect: 'Connect',
      connecting: 'Requesting…',
      statusActive: 'Connected',
      statusInitializing: 'Connecting',
      statusFailed: 'Failed',
      statusExpired: 'Expired',
      statusOther: 'Not connected',
      appsTitle: 'Available toolkits',
      appsTotal: '{n} toolkits',
      searchResults: '{n} toolkits found',
      searchPlaceholder: 'Search toolkits, for example Gmail, Slack, Notion…',
      clearSearch: 'Clear search',
      refresh: 'Refresh',
      loading: 'Loading…',
      loadMore: 'Load more',
      emptyTitle: 'No matching toolkit',
      emptyBody: 'Try another keyword, or clear the search to see every toolkit.',
      errorTitle: 'Failed to load',
      retry: 'Retry',
      toolsCount: '{n} tools',
      noKeyHint: 'Save an API key to browse every toolkit.',
      waitingAuth: 'Waiting for you to finish signing in…',
      cancelWait: 'Stop waiting',
      authTimeout: 'No completed connection was detected yet. It will appear in the connected list once authorization finishes.',
      authPopupBlocked: 'Could not open the system browser automatically. Use the button below to continue.',
      openAuth: 'Open authorization page',
      connectFailed: 'Could not create an authorization link. Try again shortly.',
      credentialTitle: 'Connect {name}',
      credentialBody: 'This toolkit cannot redirect for authorization; enter its {field}.',
      credentialPlaceholder: 'Paste the {label}',
      credentialSubmit: 'Connect',
      credentialConnecting: 'Connecting…',
      credentialRequired: 'Enter the API key',
      credentialRejected: 'The app rejected this API key. Check it and try again.',
      credentialConnected: 'Connection created. The credential is checked on the first tool call.',
      getApiKey: 'Get API key',
      openPlatform: 'Open the app page',
      manualAuthOpened: 'This toolkit needs authorization configured on its own page; it has been opened for you.',
      openAuthGuide: 'See the auth setup guide',
      managedAuthUnavailable: 'This toolkit needs custom authentication configured in Composio first.',
      unknownPlatform: 'Toolkit not found.',
      unknownError: 'The operation failed. Try again shortly.',
      dismiss: 'Dismiss',
      footerNote: 'Connections powered by Composio · This page is local to your machine',
      docs: 'Docs',
      poweredBy: 'Powered by Composio',
    },
  };

  let UI_LANG = 'zh';
  const langListeners = new Set();

  function localeToLang(active) {
    const tag = String(active === undefined || active === null ? '' : active).toLowerCase();
    if (tag.indexOf('en') === 0) return 'en';
    return 'zh';
  }

  function localeServiceOf(ctx) {
    try {
      if (typeof ctx.get === 'function') {
        const viaGet = ctx.get('locale');
        if (viaGet !== undefined && viaGet !== null) return viaGet;
      }
    } catch (e) { /* fall through */ }
    const direct = ctx.locale;
    return direct === undefined || direct === null ? null : direct;
  }

  function subscribeLocale(ctx) {
    const service = localeServiceOf(ctx);
    if (service === null) return () => {};
    const apply = () => {
      try {
        if (typeof service.getSnapshot === 'function') {
          UI_LANG = localeToLang(service.getSnapshot().active);
        }
      } catch (e) {
        UI_LANG = 'zh';
      }
      for (const listener of langListeners) {
        try { listener(UI_LANG); } catch (e) { /* keep notifying others */ }
      }
    };
    apply();
    try {
      if (typeof service.subscribe !== 'function') return () => {};
      const off = service.subscribe(apply);
      return typeof off === 'function' ? off : () => {};
    } catch (e) {
      return () => {};
    }
  }

  function useLang() {
    const [lang, setLang] = useState(UI_LANG);
    useEffect(() => {
      const listener = () => setLang(UI_LANG);
      langListeners.add(listener);
      return () => { langListeners.delete(listener); };
    }, []);
    return lang;
  }

  function t(lang, key, params) {
    const table = UI[lang] || UI.zh;
    const raw = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : UI.zh[key] || key;
    if (typeof raw !== 'string' || params === undefined || params === null) return raw;
    return raw.replace(/\{(\w+)\}/g, (whole, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole);
  }

  function errorText(lang, error) {
    const code = error && error.code;
    const map = {
      invalid_key: 'keyInvalid',
      missing_key: 'keyRequired',
      network: 'cannotReach',
      timeout: 'timedOut',
      rate_limited: 'rateLimited',
      credentials_unavailable: 'credentialsUnavailable',
      no_managed_auth: 'managedAuthUnavailable',
      unknown_toolkit: 'unknownPlatform',
      invalid_user_id: 'invalidSettings',
      invalid_usage_limit: 'usageInvalidLimit',
      invalid_base_url: 'invalidSettings',
      invalid_slug: 'unknownPlatform',
      connect_failed: 'connectFailed',
      link_failed: 'connectFailed',
      auth_config_failed: 'connectFailed',
      credential_rejected: 'credentialRejected',
      credentials_required: 'credentialRequired',
      invalid_credentials: 'credentialRequired',
      invalid_auth_config: 'credentialRejected',
      no_api_key_scheme: 'credentialRejected',
      login_expired: 'oauthFailed',
      login_not_found: 'oauthFailed',
      login_cancelled: 'oauthFailed',
      login_failed: 'oauthFailed',
      invalid_login_session: 'oauthFailed',
    };
    if (map[code]) return t(lang, map[code]);
    return (error && error.message) || t(lang, 'unknownError');
  }

  /* ---------------------------------------------------------------- */
  /* tiny icons                                                        */
  /* ---------------------------------------------------------------- */

  function Icon({ name, size = 16 }) {
    const common = {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
    };
    switch (name) {
      case 'search':
        return h('svg', common, h('circle', { cx: 11, cy: 11, r: 7 }), h('path', { d: 'm16.5 16.5 4 4' }));
      case 'refresh':
        return h('svg', common, h('path', { d: 'M20 11a8 8 0 1 0-.8 5' }), h('path', { d: 'M20 4v7h-7' }));
      case 'external':
        return h('svg', common, h('path', { d: 'M14 3h7v7' }), h('path', { d: 'M10 14 21 3' }), h('path', { d: 'M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5' }));
      case 'check':
        return h('svg', common, h('path', { d: 'm20 6-11 11-5-5' }));
      case 'alert':
        return h('svg', common, h('path', { d: 'M12 3 2.5 20h19L12 3Z' }), h('path', { d: 'M12 9v4' }), h('path', { d: 'M12 17h.01' }));
      case 'info':
        return h('svg', common, h('circle', { cx: 12, cy: 12, r: 9 }), h('path', { d: 'M12 11v5' }), h('path', { d: 'M12 8h.01' }));
      case 'link':
        return h('svg', common, h('path', { d: 'M10 13a5 5 0 0 0 7.1.4l3-3a5 5 0 0 0-7-7l-1.7 1.6' }), h('path', { d: 'M14 11a5 5 0 0 0-7.1-.4l-3 3a5 5 0 0 0 7 7l1.7-1.6' }));
      case 'lock':
        return h('svg', common, h('rect', { x: 4, y: 10, width: 16, height: 11, rx: 2 }), h('path', { d: 'M8 10V7a4 4 0 0 1 8 0v3' }));
      case 'chevron':
        return h('svg', common, h('path', { d: 'm9 6 6 6-6 6' }));
      case 'plus':
        return h('svg', common, h('path', { d: 'M12 5v14' }), h('path', { d: 'M5 12h14' }));
      case 'close':
        return h('svg', common, h('path', { d: 'M6 6l12 12' }), h('path', { d: 'M18 6 6 18' }));
      case 'spark':
        return h('svg', common, h('path', { d: 'M12 3v4' }), h('path', { d: 'M12 17v4' }), h('path', { d: 'M3 12h4' }), h('path', { d: 'M17 12h4' }), h('path', { d: 'm5.6 5.6 2.8 2.8' }), h('path', { d: 'm15.6 15.6 2.8 2.8' }), h('path', { d: 'm18.4 5.6-2.8 2.8' }), h('path', { d: 'm8.4 15.6-2.8 2.8' }));
      case 'chart':
        return h('svg', common, h('path', { d: 'M4 19V5' }), h('path', { d: 'M4 19h16' }), h('path', { d: 'M8 16v-5' }), h('path', { d: 'M12 16V8' }), h('path', { d: 'M16 16v-3' }));
      default:
        return null;
    }
  }

  /* ---------------------------------------------------------------- */
  /* data access                                                       */
  /* ---------------------------------------------------------------- */

  async function api(action, payload, signal) {
    let response;
    try {
      response = await fetch(new URL(ROUTE, document.baseURI), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ action }, payload || {})),
        signal,
      });
    } catch (cause) {
      const error = new Error(String(cause && cause.message || cause));
      error.code = 'network';
      throw error;
    }
    let body = null;
    try { body = await response.json(); } catch (e) { body = null; }
    if (!response.ok || !body || !body.ok) {
      const info = (body && body.error) || {};
      const error = new Error(info.message || ('HTTP ' + response.status));
      error.code = info.code || 'http_error';
      error.status = info.status || response.status;
      error.details = info.details;
      throw error;
    }
    return body.value;
  }

  function hueOf(value) {
    let hash = 0;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 360;
    return hash;
  }

  function badgeKind(status) {
    if (status === 'ACTIVE') return 'active';
    if (status === 'INITIALIZING') return 'pending';
    if (status === 'FAILED') return 'failed';
    if (status === 'EXPIRED') return 'expired';
    return 'idle';
  }

  function statusLabel(lang, status) {
    if (status === 'ACTIVE') return t(lang, 'statusActive');
    if (status === 'INITIALIZING') return t(lang, 'statusInitializing');
    if (status === 'FAILED') return t(lang, 'statusFailed');
    if (status === 'EXPIRED') return t(lang, 'statusExpired');
    return t(lang, 'statusOther');
  }

  /* ---------------------------------------------------------------- */
  /* small components                                                  */
  /* ---------------------------------------------------------------- */

  function NoticeBar({ notice, onClose, lang }) {
    if (!notice) return null;
    const kind = notice.kind || 'info';
    return h('div', {
      className: 'cmp-notice cmp-notice-' + kind,
      role: kind === 'error' ? 'alert' : 'status',
    },
      h('span', { className: 'cmp-notice-icon' }, h(Icon, { name: kind === 'error' ? 'alert' : kind === 'success' ? 'check' : 'info' })),
      h('div', { className: 'cmp-notice-body' },
        h('span', null, notice.text),
        notice.href ? h('a', {
          className: 'cmp-notice-link',
          href: notice.href,
          target: '_blank',
          rel: 'noreferrer',
        }, notice.hrefLabel || t(lang, 'openAuthGuide')) : null),
      h('button', {
        className: 'cmp-notice-x',
        type: 'button',
        onClick: onClose,
        'aria-label': t(lang, 'dismiss'),
      }, h(Icon, { name: 'close', size: 14 })));
  }

  function AppLogo({ app, size = 34 }) {
    const [broken, setBroken] = useState(false);
    const name = (app && app.name) || (app && app.slug) || '?';
    if (app && app.logo && !broken) {
      return h('img', {
        className: 'cmp-logo',
        src: app.logo,
        alt: '',
        width: size,
        height: size,
        loading: 'lazy',
        onError: () => setBroken(true),
      });
    }
    const hue = hueOf(app && app.slug);
    return h('span', {
      className: 'cmp-logo cmp-logo-fallback',
      style: {
        width: size,
        height: size,
        background: 'hsl(' + hue + ' 72% 60% / .16)',
        color: 'hsl(' + hue + ' 60% 44%)',
        fontSize: Math.round(size * 0.42),
      },
      'aria-hidden': 'true',
    }, name.slice(0, 1).toUpperCase());
  }

  function Badge({ status, lang }) {
    return h('span', { className: 'cmp-badge cmp-badge-' + badgeKind(status) },
      status === 'INITIALIZING' ? h('span', { className: 'cmp-spin' }) : null,
      statusLabel(lang, status));
  }

  /* ---------------------------------------------------------------- */
  /* key card                                                          */
  /* ---------------------------------------------------------------- */

  function KeyCard({ status, onSaved, onNotice }) {
    const lang = useLang();
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(!status.configured);
    const [confirmClear, setConfirmClear] = useState(false);
    const [oauthBusy, setOauthBusy] = useState(false);
    const [oauthUrl, setOauthUrl] = useState('');
    const oauthRun = useRef(0);

    useEffect(() => {
      if (!status.configured) setEditing(true);
    }, [status.configured]);

    useEffect(() => {
      if (!confirmClear) return undefined;
      const timer = setTimeout(() => setConfirmClear(false), 4000);
      return () => clearTimeout(timer);
    }, [confirmClear]);

    useEffect(() => () => {
      oauthRun.current += 1;
    }, []);

    const stopOAuth = useCallback((cancelRemote) => {
      oauthRun.current += 1;
      setOauthBusy(false);
      setOauthUrl('');
      if (cancelRemote) void api('cancelLogin').catch(() => {});
    }, []);

    const startOAuth = async () => {
      const run = oauthRun.current + 1;
      oauthRun.current = run;
      setOauthBusy(true);
      setOauthUrl('');

      try {
        const session = await api('startLogin');
        if (run !== oauthRun.current) return;
        setOauthUrl(session.loginUrl);
        // The host process opens the default system browser; this also works
        // inside the desktop app, where window.open() does not reach it.
        try {
          await api('openExternal', { url: session.loginUrl });
        } catch {
          if (run !== oauthRun.current) return;
          onNotice({ kind: 'warn', text: t(lang, 'oauthOpenFailed') });
        }

        const deadline = Date.now() + AUTH_TIMEOUT_MS;
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, POLL_MS));
          if (run !== oauthRun.current) return;
          const value = await api('pollLogin', { sessionId: session.sessionId });
          if (run !== oauthRun.current) return;
          if (value && value.configured) {
            setOauthBusy(false);
            setOauthUrl('');
            setDraft('');
            setEditing(false);
            onSaved(value);
            onNotice({ kind: 'success', text: t(lang, 'oauthSuccess') });
            return;
          }
        }
        if (run !== oauthRun.current) return;
        setOauthBusy(false);
        onNotice({ kind: 'warn', text: t(lang, 'authTimeout') });
      } catch (error) {
        if (run !== oauthRun.current) return;
        setOauthBusy(false);
        setOauthUrl('');
        onNotice({ kind: 'error', text: errorText(lang, error) });
      }
    };

    const save = async () => {
      const key = draft.trim();
      if (!key) {
        onNotice({ kind: 'error', text: t(lang, 'keyRequired') });
        return;
      }
      setSaving(true);
      try {
        const value = await api('saveKey', { apiKey: key });
        onSaved(value);
        setDraft('');
        setEditing(false);
        onNotice({ kind: 'success', text: t(lang, 'keySaved') });
      } catch (error) {
        onNotice({ kind: 'error', text: errorText(lang, error) });
      } finally {
        setSaving(false);
      }
    };

    const clear = async () => {
      if (!confirmClear) {
        setConfirmClear(true);
        return;
      }
      stopOAuth(false);
      setSaving(true);
      try {
        const value = await api('clearKey');
        onSaved(value);
        setConfirmClear(false);
        setEditing(true);
        onNotice({ kind: 'success', text: t(lang, 'keyCleared') });
      } catch (error) {
        onNotice({ kind: 'error', text: errorText(lang, error) });
      } finally {
        setSaving(false);
      }
    };

    const sourceKey = status.source === 'env'
      ? 'keySourceEnv'
      : status.loginMethod === 'oauth'
        ? 'keySourceOAuth'
        : 'keySourceManual';
    const typeKey = status.keyType === 'user'
      ? 'keyTypeUser'
      : status.keyType === 'project'
        ? 'keyTypeProject'
        : 'keyTypeUnknown';
    const sourceText = t(lang, sourceKey);
    const typeText = status.keyType ? ' · ' + t(lang, typeKey) : '';

    if (status.configured && !editing) {
      return h('section', { className: 'cmp-keycard cmp-keycard-compact' },
        h('span', { className: 'cmp-dot cmp-dot-on' }),
        h('div', { className: 'cmp-keycard-summary' },
          h('div', { className: 'cmp-keycard-name' }, t(lang, 'keyConfigured')),
          h('div', { className: 'cmp-fine' }, sourceText + typeText)),
        h('button', {
          className: 'cmp-btn cmp-btn-ghost',
          type: 'button',
          disabled: oauthBusy,
          onClick: () => { setConfirmClear(false); setEditing(true); },
        }, t(lang, 'change')),
        status.source !== 'env' ? h('button', {
          className: 'cmp-btn cmp-btn-ghost cmp-btn-danger',
          type: 'button',
          disabled: saving || oauthBusy,
          onClick: clear,
        }, confirmClear ? t(lang, 'clearConfirm') : t(lang, 'clear')) : null);
    }

    const oauthBlock = (!status.configured || editing) ? h('div', { className: 'cmp-oauth' },
      h('div', { className: 'cmp-oauth-head' },
        h('span', { className: 'cmp-oauth-mark' }, h(Icon, { name: 'link', size: 16 })),
        h('div', { className: 'cmp-oauth-copy' },
          h('div', { className: 'cmp-oauth-title' }, t(lang, 'oauthTitle')),
          h('p', { className: 'cmp-oauth-body' }, t(lang, 'oauthBody')),
          h('p', { className: 'cmp-fine' }, t(lang, 'oauthConfigHint')))),
      h('div', { className: 'cmp-oauth-actions' },
        h('button', {
          className: 'cmp-btn cmp-btn-primary',
          type: 'button',
          disabled: oauthBusy,
          onClick: startOAuth,
        }, oauthBusy ? h('span', { className: 'cmp-spin' }) : h(Icon, { name: 'link', size: 14 }),
        oauthBusy ? t(lang, 'oauthWaiting') : t(lang, 'oauthButton')),
        oauthBusy ? h('button', {
          className: 'cmp-btn cmp-btn-ghost',
          type: 'button',
          onClick: () => stopOAuth(true),
        }, t(lang, 'oauthCancel')) : null),
      oauthBusy ? h('div', { className: 'cmp-fine cmp-oauth-wait' }, t(lang, 'oauthHint')) : null,
      oauthUrl ? h('a', {
        className: 'cmp-textlink',
        href: oauthUrl,
        target: '_blank',
        rel: 'noreferrer',
      }, t(lang, 'oauthOpenLink'), ' ', h(Icon, { name: 'external', size: 12 })) : null
    ) : null;

    return h('section', { className: 'cmp-keycard' },
      status.configured
        ? h('div', { className: 'cmp-keycard-head' },
          h('span', { className: 'cmp-dot cmp-dot-on' }),
          h('div', { className: 'cmp-keycard-summary' },
            h('h2', { className: 'cmp-keycard-title' }, t(lang, 'keyConfigured')),
            h('div', { className: 'cmp-fine' }, sourceText + typeText)))
        : h('div', { className: 'cmp-keycard-head' },
          h('div', { className: 'cmp-keycard-mark' }, h(Icon, { name: 'link', size: 20 })),
          h('div', { className: 'cmp-keycard-intro' },
            h('h2', { className: 'cmp-keycard-title' }, t(lang, 'keyTitle')),
            h('p', { className: 'cmp-keycard-desc' }, t(lang, 'keyBody')))),
      oauthBlock,
      (!status.configured || editing) ? h('div', { className: 'cmp-divider' },
        h('span', null, t(lang, 'orManual'))) : null,
      h('div', { className: 'cmp-keyrow' },
        h('input', {
          className: 'cmp-input',
          type: 'password',
          value: draft,
          autoComplete: 'off',
          spellCheck: false,
          placeholder: t(lang, 'keyPlaceholder'),
          onChange: (event) => setDraft(event.target.value),
          onKeyDown: (event) => { if (event.key === 'Enter' && !saving) void save(); },
        }),
        h('button', {
          className: 'cmp-btn cmp-btn-primary',
          type: 'button',
          disabled: saving || !draft.trim(),
          onClick: save,
        }, saving ? h('span', { className: 'cmp-spin' }) : null, saving ? t(lang, 'verifying') : t(lang, 'saveVerify'))),
      !status.configured ? h('div', { className: 'cmp-steps' },
        h('div', { className: 'cmp-step' },
          h('span', { className: 'cmp-step-n' }, '1'),
          h('div', null, h('div', { className: 'cmp-step-t' }, t(lang, 'step1Title')), h('div', { className: 'cmp-step-b' }, t(lang, 'step1Body')))),
        h('div', { className: 'cmp-step' },
          h('span', { className: 'cmp-step-n' }, '2'),
          h('div', null, h('div', { className: 'cmp-step-t' }, t(lang, 'step2Title')), h('div', { className: 'cmp-step-b' }, t(lang, 'step2Body')))),
        h('div', { className: 'cmp-step' },
          h('span', { className: 'cmp-step-n' }, '3'),
          h('div', null, h('div', { className: 'cmp-step-t' }, t(lang, 'step3Title')), h('div', { className: 'cmp-step-b' }, t(lang, 'step3Body'))))) : null,
      status.configured && status.source === 'env'
        ? h('p', { className: 'cmp-fine cmp-fine-block' }, t(lang, 'keyEnvLocked'))
        : null,
      h('div', { className: 'cmp-keycard-foot' },
        status.configured ? h('button', {
          className: 'cmp-btn cmp-btn-ghost',
          type: 'button',
          disabled: saving || oauthBusy,
          onClick: () => { stopOAuth(false); setDraft(''); setEditing(false); },
        }, t(lang, 'cancel')) : h('a', {
          className: 'cmp-textlink',
          href: 'https://dashboard.composio.dev',
          target: '_blank',
          rel: 'noreferrer',
        }, t(lang, 'openDashboard'), ' ', h(Icon, { name: 'external', size: 12 })),
        status.configured && status.source !== 'env' ? h('button', {
          className: 'cmp-btn cmp-btn-ghost cmp-btn-danger',
          type: 'button',
          disabled: saving || oauthBusy,
          onClick: clear,
        }, confirmClear ? t(lang, 'clearConfirm') : t(lang, 'clear')) : null),
      h('p', { className: 'cmp-fine cmp-fine-block' },
        h('span', { className: 'cmp-inline-icon' }, h(Icon, { name: 'lock', size: 12 })),
        ' ' + t(lang, 'keyPrivacy')));

  }

  /* ---------------------------------------------------------------- */
  /* toolkit tile                                                      */
  /* ---------------------------------------------------------------- */

  function ToolkitTile({ app, connection, pending, waiting, onConnect }) {
    const lang = useLang();
    const connected = connection && (connection.status === 'ACTIVE' || connection.status === 'INITIALIZING');
    const busy = pending || waiting;
    const activate = () => {
      if (connected || busy) return;
      onConnect(app);
    };
    return h('div', {
      className: 'cmp-tile' + (connected ? ' is-connected' : '') + (busy ? ' is-busy' : ''),
      role: 'button',
      tabIndex: connected || busy ? -1 : 0,
      'aria-disabled': connected || busy ? 'true' : undefined,
      onClick: activate,
      onKeyDown: (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      },
    },
      h('div', { className: 'cmp-tile-top' },
        h(AppLogo, { app }),
        h('div', { className: 'cmp-tile-id' },
          h('div', { className: 'cmp-tile-name' }, app.name),
          h('div', { className: 'cmp-tile-cat' },
            app.categories && app.categories.length
              ? app.categories.slice(0, 2).join(' · ')
              : (app.toolsCount != null ? t(lang, 'toolsCount', { n: app.toolsCount }) : ''))),
        connection ? h(Badge, { status: connection.status, lang })
          : h('span', { className: 'cmp-tile-plus' }, h(Icon, { name: 'plus', size: 14 }))),
      h('p', { className: 'cmp-tile-desc' }, app.description || ''),
      h('div', { className: 'cmp-tile-foot' },
        h('span', { className: 'cmp-tile-stat' },
          app.toolsCount != null ? t(lang, 'toolsCount', { n: app.toolsCount }) : ''),
        h('span', { className: 'cmp-tile-action' },
          pending ? h('span', null, h('span', { className: 'cmp-spin' }), ' ' + t(lang, 'connecting'))
            : waiting ? h('span', null, h('span', { className: 'cmp-spin' }), ' ' + t(lang, 'statusInitializing'))
              : connected ? h('span', { className: 'cmp-tile-check' }, h(Icon, { name: 'check', size: 13 }), ' ' + statusLabel(lang, connection.status))
                : h('span', null, t(lang, 'connect')))));
  }

  /* ---------------------------------------------------------------- */
  /* credential dialog (toolkits without managed auth)                 */
  /* ---------------------------------------------------------------- */

  function UsageCard({ usage, loading, error, onRefresh, onSetGoal, onOpenDashboard }) {
    const lang = useLang();
    const busy = loading && !usage;
    const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
    const number = new Intl.NumberFormat(locale);
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
    const toolCalls = Number(usage && usage.toolCalls) || 0;
    const sessions = Number(usage && usage.sessions) || 0;
    const instantCharge = Number(usage && usage.instantCharge) || 0;
    const toolLimit = Number(usage && usage.limits && usage.limits.toolCalls) || 0;
    const budgetLimit = Number(usage && usage.limits && usage.limits.budgetUsd) || 0;
    const toolPercent = toolLimit > 0 ? Math.min(100, (toolCalls / toolLimit) * 100) : 0;
    const budgetPercent = budgetLimit > 0 ? Math.min(100, (instantCharge / budgetLimit) * 100) : 0;
    const toolOver = toolLimit > 0 && toolCalls > toolLimit;
    const budgetOver = budgetLimit > 0 && instantCharge > budgetLimit;
    const range = usage && usage.from && usage.to
      ? t(lang, 'usageRange', {
        from: new Date(usage.from).toLocaleDateString(locale),
        to: new Date(usage.to).toLocaleDateString(locale),
      })
      : '';

    const head = h('div', { className: 'cmp-usage-head' },
      h('div', { className: 'cmp-usage-title-wrap' },
        h('span', { className: 'cmp-usage-icon' }, h(Icon, { name: 'chart', size: 16 })),
        h('div', null,
          h('h2', { className: 'cmp-usage-title' }, t(lang, 'usageTitle')),
          range ? h('div', { className: 'cmp-usage-range' }, range) : null)),
      h('div', { className: 'cmp-usage-actions' },
        usage && usage.plan
          ? h('span', { className: 'cmp-plan' }, String(usage.plan).toUpperCase())
          : null,
        h('button', {
          className: 'cmp-icon-btn',
          type: 'button',
          title: t(lang, 'usageRefresh'),
          'aria-label': t(lang, 'usageRefresh'),
          disabled: loading,
          onClick: onRefresh,
        }, h(Icon, { name: 'refresh', size: 14 }))));

    if (busy) {
      return h('section', { className: 'cmp-usage' }, head,
        h('div', { className: 'cmp-usage-skeleton' }),
        h('div', { className: 'cmp-usage-skeleton cmp-usage-skeleton-short' }));
    }

    if (error && !usage) {
      return h('section', { className: 'cmp-usage' }, head,
        h('div', { className: 'cmp-inline-error' },
          h('span', null, errorText(lang, error)),
          h('button', { className: 'cmp-textlink', type: 'button', onClick: onRefresh }, t(lang, 'retry'))));
    }

    if (usage && usage.available === false) {
      return h('section', { className: 'cmp-usage' }, head,
        h('div', { className: 'cmp-usage-unavailable' },
          h('span', null, t(lang, 'usageUnavailable', { message: usage.message || '' })),
          h('button', { className: 'cmp-textlink', type: 'button', onClick: onOpenDashboard },
            t(lang, 'usageDashboard'), ' ', h(Icon, { name: 'external', size: 11 }))));
    }

    const toolBar = h('div', { className: 'cmp-usage-meter' },
      h('div', { className: 'cmp-usage-meter-head' },
        h('span', null, t(lang, 'usageToolCalls')),
        h('span', { className: 'cmp-usage-meter-value' },
          toolLimit > 0
            ? t(lang, 'usageOf', { used: number.format(toolCalls), limit: number.format(toolLimit) })
            : number.format(toolCalls))),
      toolLimit > 0
        ? h('div', { className: 'cmp-bar' },
          h('span', {
            className: 'cmp-bar-fill' + (toolOver ? ' cmp-bar-over' : ''),
            style: { width: toolPercent + '%' },
          }))
        : h('div', { className: 'cmp-bar cmp-bar-empty' }),
      h('div', { className: 'cmp-usage-meter-foot' },
        toolLimit > 0
          ? h('span', { className: toolOver ? 'cmp-usage-over' : '' },
            t(lang, 'usageRemaining', { value: number.format(Math.max(0, toolLimit - toolCalls)) }))
          : h(React.Fragment, null,
            h('span', null, t(lang, 'usageNoLimit')),
            h('button', { className: 'cmp-textlink', type: 'button', onClick: onSetGoal }, t(lang, 'usageSetGoal')))));

    const budgetBar = h('div', { className: 'cmp-usage-meter' },
      h('div', { className: 'cmp-usage-meter-head' },
        h('span', null, t(lang, 'usageInstantCharge')),
        h('span', { className: 'cmp-usage-meter-value' },
          budgetLimit > 0
            ? t(lang, 'usageOf', { used: money.format(instantCharge), limit: money.format(budgetLimit) })
            : money.format(instantCharge))),
      budgetLimit > 0
        ? h('div', { className: 'cmp-bar' },
          h('span', {
            className: 'cmp-bar-fill cmp-bar-budget' + (budgetOver ? ' cmp-bar-over' : ''),
            style: { width: budgetPercent + '%' },
          }))
        : h('div', { className: 'cmp-bar cmp-bar-empty' }),
      h('div', { className: 'cmp-usage-meter-foot' },
        budgetLimit > 0
          ? h('span', { className: budgetOver ? 'cmp-usage-over' : '' },
            t(lang, 'usageRemaining', { value: money.format(Math.max(0, budgetLimit - instantCharge)) }))
          : h(React.Fragment, null,
            h('span', null, t(lang, 'usageNoLimit')),
            h('button', { className: 'cmp-textlink', type: 'button', onClick: onSetGoal }, t(lang, 'usageSetGoal')))));

    const top = usage && Array.isArray(usage.topToolkits) ? usage.topToolkits : [];

    return h('section', { className: 'cmp-usage' }, head,
      h('div', { className: 'cmp-usage-stats' },
        h('div', { className: 'cmp-usage-stat' },
          h('span', { className: 'cmp-usage-value' }, number.format(toolCalls)),
          h('span', { className: 'cmp-usage-label' }, t(lang, 'usageToolCalls'))),
        h('div', { className: 'cmp-usage-stat' },
          h('span', { className: 'cmp-usage-value' }, money.format(instantCharge)),
          h('span', { className: 'cmp-usage-label' }, t(lang, 'usageInstantCharge'))),
        h('div', { className: 'cmp-usage-stat' },
          h('span', { className: 'cmp-usage-value' }, number.format(sessions)),
          h('span', { className: 'cmp-usage-label' }, t(lang, 'usageSessions')))),
      h('div', { className: 'cmp-usage-bars' }, toolBar, budgetBar),
      top.length > 0 ? h('div', { className: 'cmp-usage-top' },
        h('span', { className: 'cmp-usage-top-label' }, t(lang, 'usageTopToolkits')),
        h('div', { className: 'cmp-chips' },
          top.map((item) => h('span', { className: 'cmp-chip', key: item.key },
            h('span', { className: 'cmp-chip-name' }, item.key),
            h('span', { className: 'cmp-chip-count' }, number.format(item.count)))))) : null,
      h('div', { className: 'cmp-usage-foot' },
        h('span', null, t(lang, 'usageOfficialHint')),
        h('button', { className: 'cmp-textlink', type: 'button', onClick: onOpenDashboard },
          t(lang, 'usageDashboard'), ' ', h(Icon, { name: 'external', size: 11 }))));
  }

  function CredentialDialog({ prompt, lang, onCancel, onConnected }) {
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const field = prompt.field || {};
    const label = field.label || 'API Key';
    const link = prompt.hintUrl || prompt.appUrl;

    const submit = async (event) => {
      event.preventDefault();
      if (busy || !value.trim()) return;
      setBusy(true);
      setError(null);
      try {
        const result = await api('connectWithKey', {
          slug: prompt.slug,
          authConfigId: prompt.authConfigId,
          value: value.trim(),
        });
        onConnected(result);
      } catch (cause) {
        setError(cause);
      } finally {
        setBusy(false);
      }
    };

    return h('div', {
      className: 'cmp-modal-backdrop',
      role: 'presentation',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      },
    },
      h('form', {
        className: 'cmp-modal',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'cmp-credential-title',
        onSubmit: submit,
      },
        h('div', { className: 'cmp-modal-head' },
          h('div', { className: 'cmp-modal-icon' }, h(Icon, { name: 'lock', size: 18 })),
          h('div', { className: 'cmp-modal-main' },
            h('h2', { id: 'cmp-credential-title', className: 'cmp-modal-title' },
              t(lang, 'credentialTitle', { name: prompt.toolkit && prompt.toolkit.name ? prompt.toolkit.name : prompt.slug })),
            h('p', { className: 'cmp-modal-sub' },
              t(lang, 'credentialBody', { field: label })))),
        field.description ? h('p', { className: 'cmp-modal-desc' }, field.description) : null,
        h('div', { className: 'cmp-field' },
          h('label', { className: 'cmp-label', htmlFor: 'cmp-credential-input' }, label),
          h('input', {
            id: 'cmp-credential-input',
            className: 'cmp-input',
            type: field.secret === false ? 'text' : 'password',
            value,
            autoFocus: true,
            autoComplete: 'off',
            spellCheck: false,
            placeholder: t(lang, 'credentialPlaceholder', { label }),
            onChange: (event) => setValue(event.target.value),
          })),
        link ? h('button', {
          className: 'cmp-textlink cmp-modal-link',
          type: 'button',
          onClick: () => {
            void api('openExternal', { url: link }).catch(() => {
              setError({ code: 'open_failed', message: t(lang, 'authPopupBlocked') });
            });
          },
        }, t(lang, prompt.hintUrl ? 'getApiKey' : 'openPlatform'), ' ', h(Icon, { name: 'external', size: 11 })) : null,
        error ? h('div', { className: 'cmp-modal-error' }, errorText(lang, error)) : null,
        h('div', { className: 'cmp-modal-actions' },
          h('button', {
            className: 'cmp-btn',
            type: 'button',
            disabled: busy,
            onClick: onCancel,
          }, t(lang, 'cancel')),
          h('button', {
            className: 'cmp-btn cmp-btn-primary',
            type: 'submit',
            disabled: busy || !value.trim(),
          }, busy ? h('span', { className: 'cmp-spin' }) : null,
            busy ? t(lang, 'credentialConnecting') : t(lang, 'credentialSubmit')))));
  }

  /* ---------------------------------------------------------------- */
  /* advanced settings                                                 */
  /* ---------------------------------------------------------------- */

  function AdvancedSettings({ status, onSaved, onNotice }) {
    const lang = useLang();
    const [userId, setUserId] = useState(status.userId || '');
    const [baseUrl, setBaseUrl] = useState(status.baseUrl || '');
    const [monthlyToolLimit, setMonthlyToolLimit] = useState(
      status.monthlyToolLimit != null ? String(status.monthlyToolLimit) : '',
    );
    const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(
      status.monthlyBudgetUsd != null ? String(status.monthlyBudgetUsd) : '',
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => { setUserId(status.userId || ''); }, [status.userId]);
    useEffect(() => { setBaseUrl(status.baseUrl || ''); }, [status.baseUrl]);
    useEffect(() => {
      setMonthlyToolLimit(status.monthlyToolLimit != null ? String(status.monthlyToolLimit) : '');
    }, [status.monthlyToolLimit]);
    useEffect(() => {
      setMonthlyBudgetUsd(status.monthlyBudgetUsd != null ? String(status.monthlyBudgetUsd) : '');
    }, [status.monthlyBudgetUsd]);

    const save = async () => {
      setSaving(true);
      try {
        const value = await api('saveSettings', {
          userId,
          baseUrl,
          monthlyToolLimit,
          monthlyBudgetUsd,
        });
        onSaved(value);
        onNotice({ kind: 'success', text: t(UI_LANG, 'settingsSaved') });
      } catch (error) {
        onNotice({ kind: 'error', text: errorText(UI_LANG, error) });
      } finally {
        setSaving(false);
      }
    };

    return h('details', { className: 'cmp-advanced', id: 'cmp-advanced' },
      h('summary', null, h('span', { className: 'cmp-chevron' }, h(Icon, { name: 'chevron', size: 13 })), t(lang, 'advanced')),
      h('div', { className: 'cmp-advanced-body' },
        h('div', { className: 'cmp-field' },
          h('label', { className: 'cmp-label', htmlFor: 'cmp-user-id' }, t(lang, 'userId')),
          h('input', {
            id: 'cmp-user-id',
            className: 'cmp-input',
            value: userId,
            spellCheck: false,
            onChange: (event) => setUserId(event.target.value),
          }),
          h('div', { className: 'cmp-fine' }, t(lang, 'userIdHint'))),
        h('div', { className: 'cmp-field' },
          h('label', { className: 'cmp-label', htmlFor: 'cmp-base-url' }, t(lang, 'baseUrl')),
          h('input', {
            id: 'cmp-base-url',
            className: 'cmp-input',
            value: baseUrl,
            spellCheck: false,
            onChange: (event) => setBaseUrl(event.target.value),
          }),
          h('div', { className: 'cmp-fine' }, t(lang, 'baseUrlHint'))),
        h('div', { className: 'cmp-advanced-grid' },
          h('div', { className: 'cmp-field' },
            h('label', { className: 'cmp-label', htmlFor: 'cmp-usage-tool-limit' }, t(lang, 'usageLimitLabel')),
            h('input', {
              id: 'cmp-usage-tool-limit',
              className: 'cmp-input',
              type: 'number',
              min: '1',
              step: '1',
              value: monthlyToolLimit,
              placeholder: '10000',
              onChange: (event) => setMonthlyToolLimit(event.target.value),
            }),
            h('div', { className: 'cmp-fine' }, t(lang, 'usageLimitHint'))),
          h('div', { className: 'cmp-field' },
            h('label', { className: 'cmp-label', htmlFor: 'cmp-usage-budget' }, t(lang, 'usageBudgetLabel')),
            h('input', {
              id: 'cmp-usage-budget',
              className: 'cmp-input',
              type: 'number',
              min: '0.01',
              step: '0.01',
              value: monthlyBudgetUsd,
              placeholder: '2.00',
              onChange: (event) => setMonthlyBudgetUsd(event.target.value),
            }),
            h('div', { className: 'cmp-fine' }, t(lang, 'usageBudgetHint')))),
        h('div', { className: 'cmp-advanced-actions' },
          h('button', {
            className: 'cmp-btn cmp-btn-primary',
            type: 'button',
            disabled: saving,
            onClick: save,
          }, saving ? h('span', { className: 'cmp-spin' }) : null, t(lang, 'saveSettings')))));
  }

  /* ---------------------------------------------------------------- */
  /* root                                                              */
  /* ---------------------------------------------------------------- */

  function ComposioSection() {
    const lang = useLang();
    const [status, setStatus] = useState(null);
    const [statusError, setStatusError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [connections, setConnections] = useState([]);
    const [connLoading, setConnLoading] = useState(false);
    const [connError, setConnError] = useState(null);
    const [apps, setApps] = useState({ items: [], nextCursor: null, total: null, loading: false, error: null });
    const [query, setQuery] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [pendingSlug, setPendingSlug] = useState('');
    const [waiting, setWaiting] = useState(null);
    const [authFallback, setAuthFallback] = useState(null);
    const [credentialPrompt, setCredentialPrompt] = useState(null);
    const [usage, setUsage] = useState(null);
    const [usageLoading, setUsageLoading] = useState(false);
    const [usageError, setUsageError] = useState(null);
    const [disconnectId, setDisconnectId] = useState('');
    const [disconnecting, setDisconnecting] = useState('');

    const queryRef = useRef('');
    const cursorRef = useRef(null);
    const requestSeq = useRef(0);
    const waitingRef = useRef(null);
    const pollRef = useRef(null);

    const loadStatus = useCallback(async () => {
      setStatusError(null);
      try {
        const value = await api('status');
        setStatus(value);
      } catch (error) {
        setStatusError(error);
      }
    }, []);

    useEffect(() => { void loadStatus(); }, [loadStatus]);

    const loadUsage = useCallback(async () => {
      setUsageLoading(true);
      setUsageError(null);
      try {
        const value = await api('usage');
        setUsage(value);
      } catch (error) {
        setUsageError(error);
      } finally {
        setUsageLoading(false);
      }
    }, []);

    useEffect(() => {
      if (status && status.configured) {
        void loadUsage();
      } else {
        setUsage(null);
        setUsageError(null);
      }
    }, [status && status.configured, status && status.userId, loadUsage]);

    const handleSaved = useCallback((value) => {
      setStatus(value);
      void loadUsage();
    }, [loadUsage]);

    const loadConnections = useCallback(async () => {
      setConnLoading(true);
      setConnError(null);
      try {
        const value = await api('connections');
        setConnections(Array.isArray(value.items) ? value.items : []);
      } catch (error) {
        setConnError(error);
      } finally {
        setConnLoading(false);
      }
    }, []);

    useEffect(() => {
      if (status && status.configured) {
        void loadConnections();
      } else if (status && !status.configured) {
        setConnections([]);
      }
    }, [status && status.configured, status && status.userId, loadConnections]);

    const fetchToolkits = useCallback(async (options) => {
      const opts = options || {};
      const reset = Boolean(opts.reset);
      const search = opts.search !== undefined ? opts.search : queryRef.current;
      const seq = requestSeq.current + 1;
      requestSeq.current = seq;
      setApps((prev) => Object.assign({}, prev, {
        loading: true,
        error: null,
        ...(reset ? { items: [], nextCursor: null } : {}),
      }));
      try {
        const value = await api('toolkits', {
          search,
          cursor: reset ? '' : (cursorRef.current || ''),
          limit: 24,
        });
        if (seq !== requestSeq.current) return;
        cursorRef.current = value.nextCursor || null;
        setApps((prev) => ({
          items: reset ? value.items : prev.items.concat(value.items),
          nextCursor: value.nextCursor || null,
          total: value.total,
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (seq !== requestSeq.current) return;
        setApps((prev) => Object.assign({}, prev, { loading: false, error }));
      }
    }, []);

    useEffect(() => {
      if (!status || !status.configured) return undefined;
      queryRef.current = query;
      const timer = setTimeout(() => {
        cursorRef.current = null;
        void fetchToolkits({ reset: true, search: query });
      }, query ? 280 : 0);
      return () => clearTimeout(timer);
    }, [query, status && status.configured, refreshKey, fetchToolkits]);

    useEffect(() => {
      if (status && !status.configured) {
        setApps({ items: [], nextCursor: null, total: null, loading: false, error: null });
        cursorRef.current = null;
      }
    }, [status && status.configured]);

    const stopPolling = useCallback(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, []);

    const finishAuth = useCallback(() => {
      stopPolling();
      setWaiting(null);
      waitingRef.current = null;
    }, [stopPolling]);

    const startPolling = useCallback((slug) => {
      stopPolling();
      const started = Date.now();
      const tick = async () => {
        if (!waitingRef.current) return;
        try {
          const value = await api('connections');
          const items = Array.isArray(value.items) ? value.items : [];
          setConnections(items);
          const hit = items.find((item) => item.slug === slug && item.status === 'ACTIVE');
          if (hit) {
            finishAuth();
            setAuthFallback(null);
            setNotice({ kind: 'success', text: t(UI_LANG, 'connectedNow') });
          } else if (Date.now() - started > AUTH_TIMEOUT_MS) {
            finishAuth();
            setNotice({ kind: 'warn', text: t(UI_LANG, 'authTimeout') });
          }
        } catch (error) {
          if (Date.now() - started > AUTH_TIMEOUT_MS) {
            finishAuth();
            setNotice({ kind: 'error', text: errorText(UI_LANG, error) });
          }
        }
      };
      void tick();
      pollRef.current = setInterval(() => { void tick(); }, POLL_MS);
    }, [finishAuth, stopPolling]);

    useEffect(() => () => stopPolling(), [stopPolling]);

    useEffect(() => {
      if (!notice) return undefined;
      if (notice.kind === 'error') return undefined;
      const timer = setTimeout(() => setNotice(null), 6000);
      return () => clearTimeout(timer);
    }, [notice]);

    const connect = useCallback(async (app) => {
      if (pendingSlug || waiting) return;
      setPendingSlug(app.slug);
      setNotice(null);
      setAuthFallback(null);

      try {
        const value = await api('connect', { slug: app.slug });
        if (value.alreadyConnected) {
          setNotice({ kind: 'info', text: t(UI_LANG, 'alreadyConnected') });
          await loadConnections();
          return;
        }
        if (value.noAuth) {
          setNotice({ kind: 'info', text: t(UI_LANG, 'noAuthNotice') });
          return;
        }
        if (value.requiresCredentials) {
          setCredentialPrompt(Object.assign({}, value, { slug: app.slug }));
          setNotice(null);
          return;
        }
        if (!value.redirectUrl) {
          const error = new Error(t(UI_LANG, 'connectFailed'));
          error.code = 'link_failed';
          throw error;
        }
        try {
          await api('openExternal', { url: value.redirectUrl });
        } catch {
          setAuthFallback({ url: value.redirectUrl, slug: app.slug });
        }
        waitingRef.current = app.slug;
        setWaiting(app.slug);
        setNotice({ kind: 'info', text: t(UI_LANG, 'waitingAuth') });
        startPolling(app.slug);
      } catch (error) {
        const details = error && error.details;
        const url = details && (details.hintUrl || details.appUrl || details.authGuideUrl);
        if (error && error.code === 'no_managed_auth' && url) {
          try {
            await api('openExternal', { url });
            setNotice({ kind: 'info', text: t(UI_LANG, 'manualAuthOpened'), href: url });
          } catch {
            setNotice({
              kind: 'info',
              text: t(UI_LANG, 'authPopupBlocked'),
              href: url,
            });
          }
          return;
        }
        setNotice({
          kind: 'error',
          text: errorText(UI_LANG, error),
          href: error && error.code === 'no_managed_auth' ? url : undefined,
        });
      } finally {
        setPendingSlug('');
      }
    }, [pendingSlug, waiting, loadConnections, startPolling]);

    const disconnect = useCallback(async (id) => {
      if (!id || disconnecting) return;
      setDisconnecting(id);
      try {
        await api('disconnect', { id });
        setConnections((prev) => prev.filter((item) => item.id !== id));
        setDisconnectId('');
        setNotice({ kind: 'success', text: t(UI_LANG, 'disconnected') });
      } catch (error) {
        setNotice({ kind: 'error', text: errorText(UI_LANG, error) });
      } finally {
        setDisconnecting('');
      }
    }, [disconnecting]);

    const cancelWaiting = () => {
      finishAuth();
      setAuthFallback(null);
      setNotice(null);
    };

    const retryStatus = () => { void loadStatus(); };
    const retryApps = () => { void fetchToolkits({ reset: true, search: queryRef.current }); };
    const openAdvanced = () => {
      const element = document.getElementById('cmp-advanced');
      if (!element) return;
      element.open = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    const openBilling = () => {
      void api('openExternal', { url: 'https://dashboard.composio.dev/' }).catch(() => {
        setNotice({ kind: 'error', text: t(lang, 'authPopupBlocked') });
      });
    };

    const connectionBySlug = useMemo(() => {
      const rank = { ACTIVE: 5, INITIALIZING: 4, FAILED: 3, EXPIRED: 2, INACTIVE: 1, UNKNOWN: 0 };
      const map = new Map();
      for (const item of connections) {
        const previous = map.get(item.slug);
        if (!previous || (rank[item.status] || 0) > (rank[previous.status] || 0)) map.set(item.slug, item);
      }
      return map;
    }, [connections]);

    const toolkitBySlug = useMemo(() => {
      const map = new Map();
      for (const item of apps.items) map.set(item.slug, item);
      return map;
    }, [apps.items]);

    const sortedConnections = useMemo(() => {
      const rank = { ACTIVE: 0, INITIALIZING: 1, EXPIRED: 2, FAILED: 3, INACTIVE: 4, UNKNOWN: 5 };
      return connections.slice().sort((a, b) => {
        const diff = (rank[a.status] || 0) - (rank[b.status] || 0);
        return diff !== 0 ? diff : String(a.name).localeCompare(String(b.name));
      });
    }, [connections]);

    const activeCount = connections.filter((item) => item.status === 'ACTIVE').length;
    const totalHint = apps.total != null ? apps.total : apps.items.length;

    const header = h('header', { className: 'cmp-header' },
      h('div', { className: 'cmp-mark', 'aria-hidden': 'true' },
        h('svg', { viewBox: '0 0 64 64', width: 26, height: 26 },
          h('circle', { cx: 26, cy: 32, r: 9, fill: 'none', stroke: '#fff', strokeWidth: 4 }),
          h('circle', { cx: 38, cy: 32, r: 9, fill: 'none', stroke: '#fff', strokeWidth: 4, opacity: 0.62 }))),
      h('div', { className: 'cmp-header-main' },
        h('h1', { className: 'cmp-title' }, t(lang, 'title')),
        h('p', { className: 'cmp-subtitle' }, t(lang, 'subtitle'))),
      h('a', {
        className: 'cmp-btn cmp-btn-ghost cmp-header-link',
        href: 'https://dashboard.composio.dev',
        target: '_blank',
        rel: 'noreferrer',
      }, t(lang, 'dashboard'), h(Icon, { name: 'external', size: 13 })));

    if (status === null && !statusError) {
      return h('section', { className: 'cmp-root' }, header,
        h('div', { className: 'cmp-skeleton cmp-skeleton-key' }),
        h('div', { className: 'cmp-grid' },
          Array.from({ length: 6 }).map((_, index) => h('div', { key: index, className: 'cmp-skeleton' }))));
    }

    if (statusError) {
      return h('section', { className: 'cmp-root' }, header,
        h(NoticeBar, {
          notice: { kind: 'error', text: errorText(lang, statusError) },
          onClose: () => setStatusError(null),
          lang,
        }),
        h('button', { className: 'cmp-btn cmp-btn-primary', type: 'button', onClick: retryStatus }, t(lang, 'retry')));
    }

    const toolbar = h('div', { className: 'cmp-toolbar' },
      h('div', { className: 'cmp-search' },
        h('span', { className: 'cmp-search-icon' }, h(Icon, { name: 'search', size: 15 })),
        h('input', {
          className: 'cmp-search-input',
          value: query,
          placeholder: t(lang, 'searchPlaceholder'),
          'aria-label': t(lang, 'searchPlaceholder'),
          spellCheck: false,
          onChange: (event) => setQuery(event.target.value),
        }),
        query ? h('button', {
          className: 'cmp-search-clear',
          type: 'button',
          'aria-label': t(lang, 'clearSearch'),
          onClick: () => setQuery(''),
        }, h(Icon, { name: 'close', size: 13 })) : null),
      h('button', {
        className: 'cmp-btn cmp-btn-ghost',
        type: 'button',
        disabled: apps.loading,
        onClick: () => {
          setRefreshKey((value) => value + 1);
          void loadConnections();
          void loadUsage();
        },
      }, h(Icon, { name: 'refresh', size: 14 }), t(lang, 'refresh')));

    const appsBody = (() => {
      if (apps.loading && apps.items.length === 0) {
        return h('div', { className: 'cmp-grid' },
          Array.from({ length: 8 }).map((_, index) => h('div', { key: index, className: 'cmp-skeleton' })));
      }
      if (apps.error && apps.items.length === 0) {
        return h('div', { className: 'cmp-empty cmp-empty-error' },
          h('div', { className: 'cmp-empty-icon' }, h(Icon, { name: 'alert', size: 22 })),
          h('div', { className: 'cmp-empty-title' }, t(lang, 'errorTitle')),
          h('div', { className: 'cmp-empty-body' }, errorText(lang, apps.error)),
          h('button', { className: 'cmp-btn cmp-btn-primary', type: 'button', onClick: retryApps }, t(lang, 'retry')));
      }
      if (!apps.loading && apps.items.length === 0) {
        return h('div', { className: 'cmp-empty' },
          h('div', { className: 'cmp-empty-icon' }, h(Icon, { name: 'search', size: 22 })),
          h('div', { className: 'cmp-empty-title' }, t(lang, 'emptyTitle')),
          h('div', { className: 'cmp-empty-body' }, t(lang, 'emptyBody')));
      }
      return h(React.Fragment, null,
        apps.error ? h('div', { className: 'cmp-inline-error' },
          h('span', null, errorText(lang, apps.error)),
          h('button', { className: 'cmp-textlink', type: 'button', onClick: retryApps }, t(lang, 'retry'))) : null,
        h('div', { className: 'cmp-grid' },
          apps.items.map((app) => h(ToolkitTile, {
            key: app.slug,
            app,
            connection: connectionBySlug.get(app.slug),
            pending: pendingSlug === app.slug,
            waiting: waiting === app.slug,
            onConnect: connect,
          }))),
        apps.nextCursor ? h('div', { className: 'cmp-more' },
          h('button', {
            className: 'cmp-btn',
            type: 'button',
            disabled: apps.loading,
            onClick: () => { void fetchToolkits({ reset: false }); },
          }, apps.loading ? h('span', { className: 'cmp-spin' }) : null, t(lang, 'loadMore'))) : null);
    })();

    return h('section', { className: 'cmp-root' },
      header,
      h(NoticeBar, { notice, onClose: () => setNotice(null), lang }),
      h(KeyCard, { status, onSaved: handleSaved, onNotice: setNotice }),
      status.configured ? h(UsageCard, {
        usage,
        loading: usageLoading,
        error: usageError,
        onRefresh: () => { void loadUsage(); },
        onSetGoal: openAdvanced,
        onOpenDashboard: openBilling,
      }) : null,
      authFallback ? h('div', { className: 'cmp-notice cmp-notice-info' },
        h('span', { className: 'cmp-notice-icon' }, h(Icon, { name: 'info' })),
        h('div', { className: 'cmp-notice-body' }, h('span', null, t(lang, 'authPopupBlocked'))),
        h('button', {
          className: 'cmp-btn cmp-btn-primary',
          type: 'button',
          onClick: () => {
            void api('openExternal', { url: authFallback.url }).catch(() => {
              setNotice({ kind: 'error', text: t(lang, 'authPopupBlocked') });
            });
          },
        }, t(lang, 'openAuth'))) : null,
      credentialPrompt ? h(CredentialDialog, {
        prompt: credentialPrompt,
        lang,
        onCancel: () => setCredentialPrompt(null),
        onConnected: async (result) => {
          const slug = credentialPrompt.slug;
          setCredentialPrompt(null);
          await loadConnections();
          if (result && result.status === 'ACTIVE') {
            setNotice({ kind: 'success', text: t(lang, 'credentialConnected') });
          } else {
            waitingRef.current = slug;
            setWaiting(slug);
            setNotice({ kind: 'info', text: t(lang, 'waitingAuth') });
            startPolling(slug);
          }
        },
      }) : null,
      status.configured ? h(React.Fragment, null,
        sortedConnections.length > 0 || connLoading || connError ? h('section', { className: 'cmp-section' },
          h('div', { className: 'cmp-section-head' },
            h('h2', { className: 'cmp-section-title' }, t(lang, 'connectedServices')),
            h('span', { className: 'cmp-count' }, t(lang, 'connectedCount', { n: activeCount })),
            connLoading ? h('span', { className: 'cmp-spin cmp-section-spin' }) : null),
          connError ? h('div', { className: 'cmp-inline-error' },
            h('span', null, errorText(lang, connError)),
            h('button', { className: 'cmp-textlink', type: 'button', onClick: () => { void loadConnections(); } }, t(lang, 'retry')))
            : h('div', { className: 'cmp-conns' },
              sortedConnections.map((item) => h('div', { className: 'cmp-conn-row', key: item.id },
                h(AppLogo, { app: toolkitBySlug.get(item.slug) || { name: item.name, slug: item.slug }, size: 28 }),
                h('div', { className: 'cmp-conn-main' },
                  h('div', { className: 'cmp-conn-name' }, item.name || item.slug),
                  h('div', { className: 'cmp-conn-meta' },
                    statusLabel(lang, item.status),
                    item.alias ? ' · ' + item.alias : '',
                    item.error ? ' · ' + item.error : '')),
                h(Badge, { status: item.status, lang }),
                h('button', {
                  className: 'cmp-btn cmp-btn-ghost cmp-btn-danger cmp-conn-action',
                  type: 'button',
                  disabled: disconnecting === item.id,
                  onClick: () => {
                    if (disconnectId === item.id) void disconnect(item.id);
                    else {
                      setDisconnectId(item.id);
                      setTimeout(() => setDisconnectId((current) => current === item.id ? '' : current), 4000);
                    }
                  },
                }, disconnecting === item.id
                  ? h('span', { className: 'cmp-spin' })
                  : disconnectId === item.id
                    ? t(lang, 'confirmDisconnect')
                    : t(lang, 'disconnect')))))) : null,
        h('div', { className: 'cmp-toolbar-wrap' },
          toolbar,
          h('div', { className: 'cmp-meta-line' },
            query
              ? t(lang, 'searchResults', { n: totalHint })
              : t(lang, 'appsTotal', { n: totalHint }),
            !connLoading && sortedConnections.length === 0
              ? h('span', { className: 'cmp-meta-extra' }, t(lang, 'noConnections'))
              : null)),
        waiting ? h('div', { className: 'cmp-waiting' },
          h('span', { className: 'cmp-spin' }),
          h('span', null, t(lang, 'waitingAuth')),
          h('button', { className: 'cmp-btn cmp-btn-ghost', type: 'button', onClick: cancelWaiting }, t(lang, 'cancelWait'))) : null,
        appsBody,
        h('div', { className: 'cmp-foot' },
          h('span', null, t(lang, 'footerNote')),
          h('a', {
            className: 'cmp-textlink',
            href: 'https://docs.composio.dev',
            target: '_blank',
            rel: 'noreferrer',
          }, t(lang, 'docs'), ' ', h(Icon, { name: 'external', size: 11 }))))
        : h('div', { className: 'cmp-locked' },
          h('span', { className: 'cmp-locked-icon' }, h(Icon, { name: 'lock', size: 16 })),
          t(lang, 'noKeyHint')),
      h(AdvancedSettings, { status, onSaved: handleSaved, onNotice: setNotice }));
  }

  /* ---------------------------------------------------------------- */
  /* styles                                                            */
  /* ---------------------------------------------------------------- */

  const CSS = [
    '.cmp-root{--cmp-accent:#6f5bf5;--cmp-accent-strong:#5b46e8;max-width:1020px;padding:2px 0 28px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.55;min-width:0}',
    '.cmp-root *,.cmp-root *::before,.cmp-root *::after{box-sizing:border-box}',
    '.cmp-header{display:flex;align-items:flex-start;gap:13px;margin:0 0 18px}',
    '.cmp-mark{width:42px;height:42px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#6366f1,#a855f7);box-shadow:0 6px 18px rgba(99,102,241,.28)}',
    '.cmp-header-main{flex:1;min-width:0}',
    '.cmp-title{margin:0 0 2px;font-size:20px;line-height:1.3;font-weight:650;letter-spacing:-.02em}',
    '.cmp-subtitle{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.55;max-width:680px}',
    '.cmp-header-link{flex:none;margin-top:3px;text-decoration:none}',
    '.cmp-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:9px;padding:7px 12px;font-size:12.5px;font-weight:500;line-height:1.2;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;text-decoration:none;font-family:inherit;transition:background .16s,border-color .16s,color .16s,transform .16s}',
    '.cmp-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}',
    '.cmp-btn:active:not(:disabled){transform:translateY(1px)}',
    '.cmp-btn:disabled{opacity:.5;cursor:not-allowed}',
    '.cmp-btn:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--cmp-accent) 24%,transparent)}',
    '.cmp-btn-primary{background:var(--cmp-accent);border-color:transparent;color:#fff;font-weight:600;box-shadow:0 1px 2px rgba(20,16,60,.18)}',
    '.cmp-btn-primary:hover:not(:disabled){background:var(--cmp-accent-strong);border-color:transparent;filter:none}',
    '.cmp-btn-ghost{background:transparent;border-color:transparent}',
    '.cmp-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:transparent}',
    '.cmp-btn-danger{color:var(--dsw-alias-state-error-primary)}',
    '.cmp-spin{width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:cmp-spin .7s linear infinite;flex:none}',
    '@keyframes cmp-spin{to{transform:rotate(360deg)}}',
    '.cmp-keycard{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:18px;margin:0 0 18px;background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(168,85,247,.05)),var(--dsw-alias-bg-layer-1)}',
    '.cmp-keycard-compact{display:flex;align-items:center;gap:11px;padding:13px 15px;background:var(--dsw-alias-bg-layer-1)}',
    '.cmp-keycard-head{display:flex;align-items:flex-start;gap:12px}',
    '.cmp-keycard-mark{width:34px;height:34px;border-radius:9px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,.14);color:#6366f1}',
    '.cmp-keycard-intro{min-width:0}',
    '.cmp-keycard-title{margin:0 0 3px;font-size:15px;font-weight:650;letter-spacing:-.01em}',
    '.cmp-keycard-desc{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.6;max-width:760px}',
    '.cmp-keycard-summary{flex:1;min-width:0}',
    '.cmp-keycard-name{font-size:13px;font-weight:600}',
    '.cmp-dot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block;background:var(--dsw-alias-state-idle-primary)}',
    '.cmp-dot-on{background:var(--dsw-alias-state-success-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}',
    '.cmp-oauth{margin:14px 0 0;padding:12px 13px;border:1px solid color-mix(in srgb,var(--cmp-accent) 28%,transparent);border-radius:11px;background:color-mix(in srgb,var(--cmp-accent) 7%,transparent)}',
    '.cmp-oauth-head{display:flex;align-items:flex-start;gap:10px}',
    '.cmp-oauth-mark{width:28px;height:28px;border-radius:8px;flex:none;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--cmp-accent) 16%,transparent);color:var(--cmp-accent)}',
    '.cmp-oauth-copy{min-width:0}',
    '.cmp-oauth-title{font-size:13px;font-weight:650;line-height:1.4}',
    '.cmp-oauth-body{margin:3px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.55}',
    '.cmp-oauth-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:11px}',
    '.cmp-oauth-wait{margin:9px 0 0}',
    '.cmp-divider{display:flex;align-items:center;gap:10px;margin:16px 0 10px;color:var(--dsw-alias-label-secondary);font-size:11.5px;white-space:nowrap}',
    '.cmp-divider::before,.cmp-divider::after{content:"";height:1px;flex:1;background:var(--dsw-alias-border-l1)}',
    '.cmp-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0 14px}',
    '.cmp-step{display:flex;gap:8px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 45%,transparent)}',
    '.cmp-step-n{width:18px;height:18px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;background:rgba(99,102,241,.16);color:#6366f1}',
    '.cmp-step-t{font-size:12px;font-weight:600;line-height:1.4;margin-bottom:2px}',
    '.cmp-step-b{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
    '.cmp-keyrow{display:flex;gap:8px;align-items:center;margin-top:12px}',
    '.cmp-keycard-compact .cmp-keyrow{display:none}',
    '.cmp-input{width:100%;min-width:0;height:36px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:0 11px;font-size:12.5px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}',
    '.cmp-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.8}',
    '.cmp-input:focus{border-color:var(--cmp-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--cmp-accent) 20%,transparent)}',
    '.cmp-keycard-foot{display:flex;align-items:center;gap:8px;margin-top:12px}',
    '.cmp-keycard-foot:empty{display:none}',
    '.cmp-fine{font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-secondary)}',
    '.cmp-fine-block{margin:10px 0 0;display:flex;align-items:flex-start;gap:4px}',
    '.cmp-inline-icon{display:inline-flex;align-items:center;margin-top:2px}',
    '.cmp-textlink{color:var(--cmp-accent);text-decoration:none;font-size:12px;display:inline-flex;align-items:center;gap:3px;background:none;border:none;padding:0;cursor:pointer;font-family:inherit}',
    '.cmp-textlink:hover{text-decoration:underline}',
    '.cmp-section{margin:0 0 16px}',
    '.cmp-section-head{display:flex;align-items:center;gap:8px;margin:0 0 8px;min-height:22px}',
    '.cmp-section-title{margin:0;font-size:13px;font-weight:650;letter-spacing:0}',
    '.cmp-count{font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
    '.cmp-section-spin{margin-left:2px;color:var(--dsw-alias-label-secondary)}',
    '.cmp-conns{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
    '.cmp-conn-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid var(--dsw-alias-border-l1)}',
    '.cmp-conn-row:first-child{border-top:none}',
    '.cmp-conn-main{flex:1;min-width:0}',
    '.cmp-conn-name{font-size:12.5px;font-weight:600;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cmp-conn-meta{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cmp-conn-action{flex:none;font-size:11.5px;padding:5px 9px}',
    '.cmp-toolbar-wrap{margin:0 0 12px}',
    '.cmp-toolbar{display:flex;gap:8px;align-items:center}',
    '.cmp-search{position:relative;flex:1;min-width:0;display:flex;align-items:center}',
    '.cmp-search-icon{position:absolute;left:11px;display:flex;color:var(--dsw-alias-label-secondary);pointer-events:none}',
    '.cmp-search-input{width:100%;height:36px;padding:0 34px 0 34px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12.5px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}',
    '.cmp-search-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.8}',
    '.cmp-search-input:focus{border-color:var(--cmp-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--cmp-accent) 18%,transparent)}',
    '.cmp-search-clear{position:absolute;right:7px;width:22px;height:22px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}',
    '.cmp-search-clear:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
    '.cmp-meta-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 1px 0;font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
    '.cmp-meta-extra{opacity:.9}',
    '.cmp-waiting{display:flex;align-items:center;gap:8px;padding:9px 12px;margin:0 0 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);font-size:12px}',
    '.cmp-waiting span:nth-child(2){flex:1;min-width:0}',
    '.cmp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}',
    '.cmp-tile{display:flex;flex-direction:column;gap:8px;min-height:136px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:13px;cursor:pointer;outline:none;transition:border-color .16s,box-shadow .16s,transform .16s}',
    '.cmp-tile:hover{border-color:var(--dsw-alias-border-l2);box-shadow:0 5px 16px rgba(20,20,40,.07);transform:translateY(-1px)}',
    '.cmp-tile:focus-visible{box-shadow:0 0 0 3px color-mix(in srgb,var(--cmp-accent) 22%,transparent);border-color:var(--cmp-accent)}',
    '.cmp-tile.is-connected{cursor:default;background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 4%,var(--dsw-alias-bg-layer-1))}',
    '.cmp-tile.is-connected:hover{transform:none;box-shadow:none;border-color:var(--dsw-alias-border-l1)}',
    '.cmp-tile.is-busy{cursor:progress}',
    '.cmp-tile-top{display:flex;align-items:center;gap:9px;min-width:0}',
    '.cmp-logo{width:34px;height:34px;object-fit:contain;border-radius:8px;flex:none;background:#fff;border:1px solid var(--dsw-alias-border-l1)}',
    '.cmp-logo-fallback{display:flex;align-items:center;justify-content:center;font-weight:700;border:none;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
    '.cmp-tile-id{flex:1;min-width:0}',
    '.cmp-tile-name{font-size:12.5px;font-weight:650;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cmp-tile-cat{font-size:10.5px;color:var(--dsw-alias-label-secondary);line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cmp-tile-plus{width:22px;height:22px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}',
    '.cmp-tile-desc{margin:0;flex:1;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.cmp-tile-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:16px;font-size:10.5px;color:var(--dsw-alias-label-secondary)}',
    '.cmp-tile-action{display:inline-flex;align-items:center;gap:4px;font-weight:600;color:var(--cmp-accent);white-space:nowrap}',
    '.cmp-tile.is-connected .cmp-tile-action,.cmp-tile.is-connected .cmp-tile-check{color:var(--dsw-alias-state-success-primary)}',
    '.cmp-badge{display:inline-flex;align-items:center;gap:4px;flex:none;font-size:10px;font-weight:650;padding:2px 7px;border-radius:999px;line-height:1.5;white-space:nowrap}',
    '.cmp-badge-active{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 13%,transparent)}',
    '.cmp-badge-pending{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 14%,transparent)}',
    '.cmp-badge-failed{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}',
    '.cmp-badge-expired{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,transparent)}',
    '.cmp-badge-idle{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}',
    '.cmp-notice{display:flex;align-items:flex-start;gap:8px;padding:9px 11px;border-radius:9px;margin:0 0 14px;font-size:12px;line-height:1.55;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}',
    '.cmp-notice-icon{display:flex;margin-top:1px;flex:none}',
    '.cmp-notice-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;align-items:flex-start}',
    '.cmp-notice-link{color:var(--cmp-accent);font-size:11.5px;text-decoration:none}',
    '.cmp-notice-link:hover{text-decoration:underline}',
    '.cmp-notice-x{appearance:none;border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:2px;display:flex;border-radius:5px;flex:none}',
    '.cmp-notice-x:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
    '.cmp-notice-success{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 34%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 7%,var(--dsw-alias-bg-layer-1))}',
    '.cmp-notice-success .cmp-notice-icon{color:var(--dsw-alias-state-success-primary)}',
    '.cmp-notice-error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 34%,var(--dsw-alias-border-l1));background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,var(--dsw-alias-bg-layer-1))}',
    '.cmp-notice-error .cmp-notice-icon{color:var(--dsw-alias-state-error-primary)}',
    '.cmp-notice-warn .cmp-notice-icon{color:var(--dsw-alias-state-warn-primary)}',
    '.cmp-notice-info .cmp-notice-icon{color:var(--cmp-accent)}',
    '.cmp-inline-error{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;font-size:11.5px;color:var(--dsw-alias-state-error-primary)}',
    '.cmp-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:44px 20px;border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;text-align:center}',
    '.cmp-empty-icon{color:var(--dsw-alias-label-secondary);opacity:.75;margin-bottom:2px}',
    '.cmp-empty-title{font-size:13px;font-weight:650}',
    '.cmp-empty-body{font-size:12px;color:var(--dsw-alias-label-secondary);max-width:420px}',
    '.cmp-empty .cmp-btn{margin-top:8px}',
    '.cmp-more{display:flex;justify-content:center;margin:14px 0 0}',
    '.cmp-skeleton{min-height:136px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:linear-gradient(90deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));background-size:200% 100%;animation:cmp-shimmer 1.5s linear infinite}',
    '.cmp-skeleton-key{height:188px;margin-bottom:18px}',
    '@keyframes cmp-shimmer{to{background-position:-200% 0}}',
    '.cmp-locked{display:flex;align-items:center;gap:8px;padding:13px 14px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;color:var(--dsw-alias-label-secondary);font-size:12px}',
    '.cmp-locked-icon{display:flex}',
    '.cmp-advanced{margin-top:18px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
    '.cmp-advanced summary{list-style:none;display:flex;align-items:center;gap:5px;padding:10px 13px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none}',
    '.cmp-advanced summary::-webkit-details-marker{display:none}',
    '.cmp-advanced summary:hover{color:var(--dsw-alias-label-primary)}',
    '.cmp-chevron{display:inline-flex;transition:transform .16s}',
    '.cmp-advanced[open] .cmp-chevron{transform:rotate(90deg)}',
    '.cmp-advanced[open] summary{border-bottom:1px solid var(--dsw-alias-border-l1)}',
    '.cmp-advanced-body{display:flex;flex-direction:column;gap:12px;padding:13px}',
    '.cmp-field{display:flex;flex-direction:column;gap:5px;max-width:520px}',
    '.cmp-label{font-size:12px;font-weight:600}',
    '.cmp-advanced-actions{display:flex;gap:8px;padding-top:2px}',
    '.cmp-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(10,10,20,.5)}',
    '.cmp-modal{width:min(460px,100%);max-height:calc(100vh - 48px);overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 24px 70px rgba(0,0,0,.35);padding:20px;display:flex;flex-direction:column;gap:12px}',
    '.cmp-modal-head{display:flex;gap:11px;align-items:flex-start}',
    '.cmp-modal-icon{width:34px;height:34px;border-radius:9px;flex:none;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,.14);color:#6366f1}',
    '.cmp-modal-main{min-width:0}',
    '.cmp-modal-title{margin:0 0 3px;font-size:16px;font-weight:650;letter-spacing:-.01em}',
    '.cmp-modal-sub{margin:0;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}',
    '.cmp-modal-desc{margin:0;font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary);padding:9px 11px;border-radius:8px;background:var(--dsw-alias-bg-layer-2)}',
    '.cmp-modal .cmp-field{max-width:none}',
    '.cmp-modal-link{margin-top:-2px}',
    '.cmp-modal-error{margin-top:2px;padding:8px 10px;border-radius:8px;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}',
    '.cmp-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:4px}',
    '.cmp-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;font-size:11px;color:var(--dsw-alias-label-secondary)}',

    '.cmp-usage{margin:0 0 18px;padding:15px 16px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}',
    '.cmp-usage-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}',
    '.cmp-usage-title-wrap{display:flex;align-items:flex-start;gap:9px;min-width:0}',
    '.cmp-usage-icon{display:flex;align-items:center;justify-content:center;width:28px;height:28px;flex:none;border-radius:8px;background:rgba(111,91,245,.13);color:var(--cmp-accent)}',
    '.cmp-usage-title{font-size:13px;font-weight:600;margin:0;line-height:1.35}',
    '.cmp-usage-range{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:1px}',
    '.cmp-usage-actions{display:flex;align-items:center;gap:7px}',
    '.cmp-plan{font-size:10px;font-weight:600;letter-spacing:.04em;padding:3px 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}',
    '.cmp-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
    '.cmp-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
    '.cmp-icon-btn:disabled{opacity:.5;cursor:default}',
    '.cmp-usage-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}',
    '.cmp-usage-stat{display:flex;flex-direction:column;gap:1px;padding:8px 10px;border-radius:9px;background:var(--dsw-alias-bg-layer-2)}',
    '.cmp-usage-value{font-size:16px;font-weight:650;line-height:1.3;font-variant-numeric:tabular-nums}',
    '.cmp-usage-label{font-size:10px;color:var(--dsw-alias-label-secondary)}',
    '.cmp-usage-bars{display:flex;flex-direction:column;gap:10px}',
    '.cmp-usage-meter{display:flex;flex-direction:column;gap:4px}',
    '.cmp-usage-meter-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
    '.cmp-usage-meter-value{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:500}',
    '.cmp-bar{height:7px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
    '.cmp-bar-fill{display:block;height:100%;min-width:2px;border-radius:999px;background:var(--cmp-accent);transition:width .25s ease}',
    '.cmp-bar-budget{background:linear-gradient(90deg,#2bb673,#7ac943)}',
    '.cmp-bar-over{background:var(--dsw-alias-state-error-primary)}',
    '.cmp-bar-empty{background:var(--dsw-alias-bg-layer-2);border:1px dashed var(--dsw-alias-border-l2)}',
    '.cmp-usage-meter-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:10px;color:var(--dsw-alias-label-secondary);min-height:15px}',
    '.cmp-usage-over{color:var(--dsw-alias-state-error-primary)}',
    '.cmp-usage-top{display:flex;align-items:center;gap:9px;margin-top:11px;min-width:0}',
    '.cmp-usage-top-label{font-size:10px;color:var(--dsw-alias-label-secondary);flex:none}',
    '.cmp-chips{display:flex;flex-wrap:wrap;gap:5px;min-width:0}',
    '.cmp-chip{display:inline-flex;align-items:center;gap:5px;padding:2px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);font-size:10px;max-width:100%}',
    '.cmp-chip-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}',
    '.cmp-chip-count{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
    '.cmp-usage-foot{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-top:11px;padding-top:9px;border-top:1px solid var(--dsw-alias-border-l1);font-size:10px;color:var(--dsw-alias-label-secondary);line-height:1.45}',
    '.cmp-usage-foot .cmp-textlink{flex:none}',
    '.cmp-usage-skeleton{height:42px;border-radius:9px;background:var(--dsw-alias-bg-layer-2);animation:cmp-pulse 1.4s ease-in-out infinite;margin-bottom:8px}',
    '.cmp-usage-skeleton-short{height:24px;width:65%;margin-bottom:0}',
    '.cmp-usage-unavailable{display:flex;flex-direction:column;gap:7px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
    '.cmp-advanced-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '@media (max-width:720px){.cmp-header-link{display:none}.cmp-steps{grid-template-columns:1fr}.cmp-keyrow{flex-wrap:wrap}.cmp-keyrow .cmp-input{flex-basis:100%}.cmp-keyrow .cmp-btn{width:100%}.cmp-grid{grid-template-columns:1fr}.cmp-usage-stats{grid-template-columns:1fr 1fr}.cmp-advanced-grid{grid-template-columns:1fr}.cmp-conn-meta{white-space:normal}.cmp-toolbar{flex-wrap:wrap}.cmp-search{flex-basis:100%}}',
  ].join('\n');

  /* ---------------------------------------------------------------- */
  /* registration                                                      */
  /* ---------------------------------------------------------------- */

  const inject = ['slots', 'locale'];

  function apply(ctx) {
    ctx.effect(() => subscribeLocale(ctx), 'dsh-composio: locale');

    ctx.effect(() => {
      const id = 'dsh-composio/client';
      if (document.querySelector('style[data-plugin-css="' + id + '"]')) return () => {};
      const style = document.createElement('style');
      style.dataset.plugin = 'dsh-composio';
      style.dataset.pluginCss = id;
      style.textContent = CSS;
      document.head.appendChild(style);
      return () => { style.remove(); };
    }, 'dsh-composio: styles');

    ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'composio',
      order: 50,
      label: () => t(UI_LANG, 'nav'),
      inject: () => ({}),
    }, ComposioSection));
  }

  exports.apply = apply;
  exports.inject = inject;

  return module.exports;
}});
