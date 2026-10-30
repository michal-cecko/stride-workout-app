(function () {
  if (window.strideIsCapacitor) return;
  var dbPromise;
  var syncing;
  var session;
  var currentToken;

  function database() {
    if (!dbPromise) dbPromise = new Promise(function (resolve, reject) {
      var request = indexedDB.open('stride-offline', 2);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains('responses')) db.createObjectStore('responses');
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts');
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
    return dbPromise;
  }

  function store(table, mode, action) {
    return database().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(table, mode);
        var result = action(tx.objectStore(table));
        tx.oncomplete = function () { resolve(result.result); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function fingerprint(token) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)).then(function (bytes) {
      return Array.from(new Uint8Array(bytes), function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function localKeys() {
    return Object.keys(localStorage).filter(function (key) {
      return /^stride[_-]/.test(key) && !['stride_token', 'stride_web_session', 'stride_web_account'].includes(key);
    });
  }

  async function bind(token, userId, api) {
    var account = api + ':' + userId;
    var previous = localStorage.getItem('stride_web_account');
    if (previous && previous !== account) {
      var snapshot = {};
      localKeys().forEach(function (key) { snapshot[key] = localStorage.getItem(key); });
      await store('accounts', 'readwrite', function (s) { return s.put(snapshot, previous); });
      var saved = await store('accounts', 'readonly', function (s) { return s.get(account); });
      localKeys().forEach(function (key) { localStorage.removeItem(key); });
      Object.keys(saved || {}).forEach(function (key) { localStorage.setItem(key, saved[key]); });
    }
    session = { account: account, fingerprint: await fingerprint(token) };
    currentToken = token;
    localStorage.setItem('stride_web_account', account);
    localStorage.setItem('stride_web_session', JSON.stringify(session));
  }

  async function identify(token) {
    if (!token) return null;
    if (session && currentToken === token) return session;
    var saved;
    try { saved = JSON.parse(localStorage.getItem('stride_web_session') || 'null'); } catch {}
    if (!saved || saved.fingerprint !== await fingerprint(token)) return null;
    session = saved;
    currentToken = token;
    return session;
  }

  function notify() { window.dispatchEvent(new Event('stride-sync')); }

  async function pending() {
    var active = await identify(localStorage.getItem('stride_token'));
    if (!active) return [];
    var rows = await store('outbox', 'readonly', function (s) { return s.getAll(); });
    return rows.filter(function (row) { return row.account === active.account; });
  }

  async function flush(active, token) {
    if (syncing) await syncing;
    var run = async function () {
      var replies = new Map();
      var rows = await store('outbox', 'readonly', function (s) { return s.getAll(); });
      for (var row of rows.filter(function (item) { return item.account === active.account; })) {
        var response;
        try {
          response = await fetch(row.url, { method: row.method, body: row.body, headers: {
            Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + token,
          } });
        } catch { break; }
        replies.set(row.id, response);
        if (!response.ok) {
          row.status = response.status;
          await store('outbox', 'readwrite', function (s) { return s.put(row); });
          break;
        }
        await store('outbox', 'readwrite', function (s) { return s.delete(row.id); });
      }
      notify();
      return replies;
    };
    syncing = navigator.locks ? navigator.locks.request('stride-sync', run) : run();
    try { return await syncing; } finally { syncing = null; }
  }

  async function overlayWeight(active, url, body) {
    var rows = await store('outbox', 'readonly', function (s) { return s.getAll(); });
    rows.filter(function (row) { return row.account === active.account && row.url === url; }).forEach(function (row) {
      var change = JSON.parse(row.body);
      body.entries = (body.entries || []).filter(function (entry) { return entry.date !== change.recorded_on; });
      body.entries.push({ date: change.recorded_on, kg: change.kg, note: change.note || null });
    });
    body.entries.sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (body.entries.length) body.current_kg = body.entries[body.entries.length - 1].kg;
    return body;
  }

  async function request(url, options, token) {
    if (!token || !crypto.subtle) return fetch(url, options);
    var active = await identify(token);
    var method = options.method || 'GET';
    var path = new URL(url, location.href).pathname;
    var queueable = (method === 'PATCH' && /\/sessions\/\d+\/sets\/\d+$/.test(path)) ||
      (method === 'POST' && /\/sessions\/\d+\/(start|complete)$/.test(path)) ||
      (method === 'POST' && path.endsWith('/weight') && JSON.parse(options.body || '{}').recorded_on);
    if (active && queueable) {
      var id = await store('outbox', 'readwrite', function (s) { return s.add({
        account: active.account, url: url, method: method, body: options.body, createdAt: Date.now(),
      }); });
      notify();
      var results = await flush(active, token);
      var result = results.get(id);
      return result || new Response(JSON.stringify({ queued: true }), { status: 202, headers: { 'Content-Type': 'application/json' } });
    }
    if (method !== 'GET') return fetch(url, options);
    var response;
    try { response = await fetch(url, options); } catch (error) {
      if (!active) throw error;
      var cached = await store('responses', 'readonly', function (s) { return s.get(active.account + ':' + url); });
      if (!cached) throw error;
      var body = JSON.parse(cached.body);
      if (path.endsWith('/weight')) body = await overlayWeight(active, url, body);
      window.StridePWA?.setOffline(true);
      return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
    }
    if (!response.ok || response.status === 204) return response;
    var data = await response.clone().json();
    if (path.endsWith('/auth/me')) {
      await bind(token, data.user.id, url.slice(0, url.lastIndexOf('/auth/me')));
      active = session;
    }
    if (active) {
      await store('responses', 'readwrite', function (s) { return s.put({ body: JSON.stringify(data), savedAt: Date.now() }, active.account + ':' + url); }).catch(function () {});
      if (path.endsWith('/weight')) {
        data = await overlayWeight(active, url, data);
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    return response;
  }

  async function sync(refresh = true) {
    var token = localStorage.getItem('stride_token');
    var active = await identify(token);
    if (active) await flush(active, token);
    if (refresh && window.__strideRefresh) await window.__strideRefresh();
  }

  window.StrideOffline = {
    bind: bind, request: request, pending: pending, sync: sync,
    discard: async function (id) {
      var rows = await pending();
      if (rows.some(function (row) { return row.id === id; })) await store('outbox', 'readwrite', function (s) { return s.delete(id); });
      notify();
    },
    clear: async function () {
      if ((await pending()).length) throw new Error('Connect and sync your saved changes before signing out.');
      var account = localStorage.getItem('stride_web_account');
      var keys = await store('responses', 'readonly', function (s) { return s.getAllKeys(); });
      for (var key of keys.filter(function (key) { return key.startsWith(account + ':'); })) {
        await store('responses', 'readwrite', function (s) { return s.delete(key); });
      }
      await store('accounts', 'readwrite', function (s) { return s.delete(account); });
      localKeys().forEach(function (key) { localStorage.removeItem(key); });
      localStorage.removeItem('stride_web_session');
      localStorage.removeItem('stride_web_account');
      session = null;
      currentToken = null;
    },
  };
  window.addEventListener('online', function () { sync().catch(function () {}); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') sync().catch(function () {});
  });
  window.addEventListener('storage', function (event) {
    if (event.key === 'stride_token') location.reload();
  });
})();
