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
      keyBody: 'Composio 托管 OAuth 授权与 Token 刷新。你只需要一个 Project API Key，不必自己注册每个平台的应用。',
      step1Title: '打开 Composio Dashboard',
      step1Body: '注册或登录，创建一个项目。',
      step2Title: '复制 Project API Key',
      step2Body: '进入 Settings → API Keys，创建并复制密钥。',
      step3Title: '粘贴并验证',
      step3Body: '保存时会调用一次 Composio 校验密钥。',
      openDashboard: '打开 Dashboard',
      keyPlaceholder: '粘贴 Project API Key',
      saveVerify: '保存并验证',
      verifying: '验证中…',
      keyPrivacy: '密钥只写入本机 DSH 凭据存储，不会写入配置文件，也不会发送到 Composio 以外的服务。',
      keyConfigured: 'API Key 已配置',
      keySourceStore: '本机凭据存储',
      keySourceEnv: '环境变量 COMPOSIO_API_KEY',
      keyEnvLocked: '由环境变量提供，请在启动环境中修改或移除。',
      change: '更换',
      clear: '清除',
      clearConfirm: '确认清除？',
      cancel: '取消',
      save: '保存',
      keySaved: 'API Key 已验证并保存',
      keyCleared: '已清除本机保存的 API Key',
      keyRequired: '请先填写 API Key',
      keyInvalid: 'API Key 无效或已过期，请到 Composio Dashboard 重新复制。',
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
      waitingAuth: '已打开授权页面，正在等待你完成登录…',
      cancelWait: '取消等待',
      authTimeout: '还没有检测到连接完成。完成授权后会显示在已连接列表里。',
      authPopupBlocked: '浏览器拦截了授权窗口。点击下面的按钮继续。',
      openAuth: '打开授权页面',
      connectFailed: '无法创建授权链接，请稍后重试。',
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
      keyBody: 'Composio hosts OAuth and token refresh. All you need is a Project API Key; there is no app registration for each service.',
      step1Title: 'Open the Composio Dashboard',
      step1Body: 'Sign up or sign in and create a project.',
      step2Title: 'Copy the Project API Key',
      step2Body: 'Go to Settings → API Keys, create a key and copy it.',
      step3Title: 'Paste and verify',
      step3Body: 'Saving calls Composio once to validate the key.',
      openDashboard: 'Open Dashboard',
      keyPlaceholder: 'Paste your Project API Key',
      saveVerify: 'Save and verify',
      verifying: 'Verifying…',
      keyPrivacy: 'The key is stored only in the local DSH credential store. It is never written to configuration files or sent anywhere except Composio.',
      keyConfigured: 'API key configured',
      keySourceStore: 'Local credential store',
      keySourceEnv: 'COMPOSIO_API_KEY environment variable',
      keyEnvLocked: 'Provided by the environment. Change or remove it in the launch environment.',
      change: 'Replace',
      clear: 'Clear',
      clearConfirm: 'Clear it?',
      cancel: 'Cancel',
      save: 'Save',
      keySaved: 'API key verified and saved',
      keyCleared: 'The locally saved API key was cleared',
      keyRequired: 'Enter an API key first',
      keyInvalid: 'The API key is invalid or expired. Copy a new one from the Composio Dashboard.',
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
      waitingAuth: 'The authorization page is open. Waiting for you to finish signing in…',
      cancelWait: 'Stop waiting',
      authTimeout: 'No completed connection was detected yet. It will appear in the connected list once authorization finishes.',
      authPopupBlocked: 'The browser blocked the authorization window. Use the button below to continue.',
      openAuth: 'Open authorization page',
      connectFailed: 'Could not create an authorization link. Try again shortly.',
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
      invalid_base_url: 'invalidSettings',
      invalid_slug: 'unknownPlatform',
      connect_failed: 'connectFailed',
      link_failed: 'connectFailed',
      auth_config_failed: 'connectFailed',
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

    useEffect(() => {
      if (!status.configured) setEditing(true);
    }, [status.configured]);

    useEffect(() => {
      if (!confirmClear) return undefined;
      const timer = setTimeout(() => setConfirmClear(false), 4000);
      return () => clearTimeout(timer);
    }, [confirmClear]);

    const save = async () => {
      const key = draft.trim();
      if (!key) {
        onNotice({ kind: 'error', text: t(UI_LANG, 'keyRequired') });
        return;
      }
      setSaving(true);
      try {
        const value = await api('saveKey', { apiKey: key });
        onSaved(value);
        setDraft('');
        setEditing(false);
        onNotice({ kind: 'success', text: t(UI_LANG, 'keySaved') });
      } catch (error) {
        onNotice({ kind: 'error', text: errorText(UI_LANG, error) });
      } finally {
        setSaving(false);
      }
    };

    const clear = async () => {
      if (!confirmClear) {
        setConfirmClear(true);
        return;
      }
      setSaving(true);
      try {
        const value = await api('clearKey');
        onSaved(value);
        setConfirmClear(false);
        setEditing(true);
        onNotice({ kind: 'success', text: t(UI_LANG, 'keyCleared') });
      } catch (error) {
        onNotice({ kind: 'error', text: errorText(UI_LANG, error) });
      } finally {
        setSaving(false);
      }
    };

    const sourceText = t(lang, status.source === 'env' ? 'keySourceEnv' : 'keySourceStore');

    if (status.configured && !editing) {
      return h('section', { className: 'cmp-keycard cmp-keycard-compact' },
        h('span', { className: 'cmp-dot cmp-dot-on' }),
        h('div', { className: 'cmp-keycard-summary' },
          h('div', { className: 'cmp-keycard-name' }, t(lang, 'keyConfigured')),
          h('div', { className: 'cmp-fine' }, sourceText)),
        h('button', {
          className: 'cmp-btn cmp-btn-ghost',
          type: 'button',
          onClick: () => { setConfirmClear(false); setEditing(true); },
        }, t(lang, 'change')),
        status.source !== 'env' ? h('button', {
          className: 'cmp-btn cmp-btn-ghost cmp-btn-danger',
          type: 'button',
          disabled: saving,
          onClick: clear,
        }, confirmClear ? t(lang, 'clearConfirm') : t(lang, 'clear')) : null);
    }

    return h('section', { className: 'cmp-keycard' },
      status.configured
        ? h('div', { className: 'cmp-keycard-head' },
          h('span', { className: 'cmp-dot cmp-dot-on' }),
          h('div', { className: 'cmp-keycard-summary' },
            h('h2', { className: 'cmp-keycard-title' }, t(lang, 'keyConfigured')),
            h('div', { className: 'cmp-fine' }, sourceText)))
        : h('div', { className: 'cmp-keycard-head' },
          h('div', { className: 'cmp-keycard-mark' }, h(Icon, { name: 'link', size: 20 })),
          h('div', { className: 'cmp-keycard-intro' },
            h('h2', { className: 'cmp-keycard-title' }, t(lang, 'keyTitle')),
            h('p', { className: 'cmp-keycard-desc' }, t(lang, 'keyBody')))),
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
      h('div', { className: 'cmp-keycard-foot' },
        status.configured ? h('button', {
          className: 'cmp-btn cmp-btn-ghost',
          type: 'button',
          disabled: saving,
          onClick: () => { setDraft(''); setEditing(false); },
        }, t(lang, 'cancel')) : h('a', {
          className: 'cmp-textlink',
          href: 'https://dashboard.composio.dev',
          target: '_blank',
          rel: 'noreferrer',
        }, t(lang, 'openDashboard'), ' ', h(Icon, { name: 'external', size: 12 })),
        status.configured && status.source !== 'env' ? h('button', {
          className: 'cmp-btn cmp-btn-ghost cmp-btn-danger',
          type: 'button',
          disabled: saving,
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
  /* advanced settings                                                 */
  /* ---------------------------------------------------------------- */

  function AdvancedSettings({ status, onSaved, onNotice }) {
    const lang = useLang();
    const [userId, setUserId] = useState(status.userId || '');
    const [baseUrl, setBaseUrl] = useState(status.baseUrl || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => { setUserId(status.userId || ''); }, [status.userId]);
    useEffect(() => { setBaseUrl(status.baseUrl || ''); }, [status.baseUrl]);

    const save = async () => {
      setSaving(true);
      try {
        const value = await api('saveSettings', { userId, baseUrl });
        onSaved(value);
        onNotice({ kind: 'success', text: t(UI_LANG, 'settingsSaved') });
      } catch (error) {
        onNotice({ kind: 'error', text: errorText(UI_LANG, error) });
      } finally {
        setSaving(false);
      }
    };

    return h('details', { className: 'cmp-advanced' },
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
    const [disconnectId, setDisconnectId] = useState('');
    const [disconnecting, setDisconnecting] = useState('');

    const queryRef = useRef('');
    const cursorRef = useRef(null);
    const requestSeq = useRef(0);
    const waitingRef = useRef(null);
    const pollRef = useRef(null);
    const popupRef = useRef(null);

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

    const closePopup = useCallback(() => {
      try { if (popupRef.current) popupRef.current.close(); } catch (e) { /* ignored */ }
      popupRef.current = null;
    }, []);

    const finishAuth = useCallback((success) => {
      stopPolling();
      setWaiting(null);
      waitingRef.current = null;
      if (success) closePopup();
    }, [stopPolling, closePopup]);

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
            finishAuth(true);
            setNotice({ kind: 'success', text: t(UI_LANG, 'connectedNow') });
          } else if (Date.now() - started > AUTH_TIMEOUT_MS) {
            finishAuth(false);
            setNotice({ kind: 'warn', text: t(UI_LANG, 'authTimeout') });
          }
        } catch (error) {
          if (Date.now() - started > AUTH_TIMEOUT_MS) {
            finishAuth(false);
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

      let popup = null;
      try {
        popup = window.open('', 'composio-auth', 'popup=yes,width=520,height=760');
        if (popup) {
          popupRef.current = popup;
          try {
            popup.document.title = 'Composio';
            popup.document.body.innerHTML = '<p style="font-family:system-ui,-apple-system,sans-serif;padding:28px;color:#444">Preparing authorization…</p>';
          } catch (e) { /* cross-origin or closed */ }
        }
      } catch (e) { popup = null; }

      try {
        const value = await api('connect', { slug: app.slug });
        if (value.alreadyConnected) {
          closePopup();
          setNotice({ kind: 'info', text: t(UI_LANG, 'alreadyConnected') });
          await loadConnections();
          return;
        }
        if (value.noAuth) {
          closePopup();
          setNotice({ kind: 'info', text: t(UI_LANG, 'noAuthNotice') });
          return;
        }
        if (!value.redirectUrl) {
          const error = new Error(t(UI_LANG, 'connectFailed'));
          error.code = 'link_failed';
          throw error;
        }
        if (popup && !popup.closed) {
          popup.location.href = value.redirectUrl;
        } else {
          setAuthFallback({ url: value.redirectUrl, slug: app.slug });
        }
        waitingRef.current = app.slug;
        setWaiting(app.slug);
        setNotice({ kind: 'info', text: t(UI_LANG, 'waitingAuth') });
        startPolling(app.slug);
      } catch (error) {
        closePopup();
        const details = error && error.details;
        setNotice({
          kind: 'error',
          text: errorText(UI_LANG, error),
          href: error && error.code === 'no_managed_auth'
            ? (details && (details.authGuideUrl || details.appUrl))
            : undefined,
        });
      } finally {
        setPendingSlug('');
      }
    }, [pendingSlug, waiting, closePopup, loadConnections, startPolling]);

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
      finishAuth(false);
      closePopup();
      setNotice(null);
    };

    const retryStatus = () => { void loadStatus(); };
    const retryApps = () => { void fetchToolkits({ reset: true, search: queryRef.current }); };

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
      h(KeyCard, { status, onSaved: setStatus, onNotice: setNotice }),
      authFallback ? h('div', { className: 'cmp-notice cmp-notice-info' },
        h('span', { className: 'cmp-notice-icon' }, h(Icon, { name: 'info' })),
        h('div', { className: 'cmp-notice-body' }, h('span', null, t(lang, 'authPopupBlocked'))),
        h('button', {
          className: 'cmp-btn cmp-btn-primary',
          type: 'button',
          onClick: () => {
            try {
              window.open(authFallback.url, 'composio-auth', 'popup=yes,width=520,height=760');
            } catch (e) { /* ignore */ }
          },
        }, t(lang, 'openAuth'))) : null,
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
      h(AdvancedSettings, { status, onSaved: setStatus, onNotice: setNotice }));
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
    '.cmp-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
    '@media (max-width:720px){.cmp-header-link{display:none}.cmp-steps{grid-template-columns:1fr}.cmp-keyrow{flex-wrap:wrap}.cmp-keyrow .cmp-input{flex-basis:100%}.cmp-keyrow .cmp-btn{width:100%}.cmp-grid{grid-template-columns:1fr}.cmp-conn-meta{white-space:normal}.cmp-toolbar{flex-wrap:wrap}.cmp-search{flex-basis:100%}}',
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
