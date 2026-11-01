(function () {
  if (window.strideIsCapacitor) return;

  var registration;
  var updateRequested = false;
  var updateAction;
  var pendingRows = [];
  var installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var pending = new URLSearchParams(location.search).get('screen');
  var screens = ['home', 'plan', 'weight', 'chat', 'workouts', 'profile'];

  function openScreen(screen) {
    if (screens.indexOf(screen) === -1) return;
    if (screen === 'weight') window.__strideOpenWeightLog = true;
    if (window.__strideGo) window.__strideGo(screen);
    else window.__stridePendingScreen = screen;
  }
  openScreen(pending);
  if (pending) {
    var url = new URL(location.href);
    url.searchParams.delete('screen');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function message(text, action, label) {
    var bar = document.getElementById('stride-web-status');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'stride-web-status';
      bar.setAttribute('role', 'status');
      bar.style.cssText = 'position:fixed;left:12px;right:12px;top:max(env(safe-area-inset-top),12px);z-index:2000;background:#151310;color:#fff;padding:12px 16px;border-radius:14px;font:13px Inter,sans-serif;box-shadow:0 4px 20px #0003;display:flex;align-items:center;gap:12px';
      document.body.appendChild(bar);
    }
    bar.replaceChildren(document.createTextNode(window.t ? window.t(text) : text));
    if (action) {
      var button = document.createElement('button');
      button.textContent = window.t ? window.t(label) : label;
      button.style.cssText = 'margin-left:auto;border:0;border-radius:8px;padding:8px;background:#d8ff3a;color:#151310;font-weight:700';
      button.onclick = action;
      bar.appendChild(button);
    }
  }

  function setOffline(value) {
    window.STRIDE_OFFLINE = value;
    renderStatus();
  }
  function renderStatus() {
    if (window.STRIDE_OFFLINE) message('Offline · workout logs and weigh-ins will sync when you reconnect.');
    else if (pendingRows.some(function (row) { return row.status; })) message('Some saved changes need attention. Open Install & saved data in your profile.');
    else if (pendingRows.length) message('Changes saved on this device · waiting to sync.');
    else if (updateAction) message('A Stride update is ready. Finish your workout before updating.', updateAction, 'Update');
    else document.getElementById('stride-web-status')?.remove();
  }
  window.addEventListener('offline', function () { setOffline(true); });
  window.addEventListener('online', function () {
    setOffline(false);
  });
  window.addEventListener('stride-sync', function () {
    window.StrideOffline.pending().then(function (rows) {
      pendingRows = rows;
      renderStatus();
    }).catch(function () {});
  });

  function persist() {
    return navigator.storage?.persist ? navigator.storage.persist() : Promise.resolve(false);
  }

  if ('serviceWorker' in navigator && window.isSecureContext) {
    registration = navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function (reg) {
      function offerUpdate() {
        if (!reg.waiting) return;
        updateAction = function () {
          updateRequested = true;
          reg.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
        };
        renderStatus();
      }
      offerUpdate();
      reg.addEventListener('updatefound', function () {
        var worker = reg.installing;
        worker.addEventListener('statechange', function () {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate();
        });
      });
      return reg;
    });
    registration.catch(function () {});
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (updateRequested) location.reload();
    });
    navigator.serviceWorker.addEventListener('message', function (event) {
      if (event.data?.type === 'OPEN_SCREEN') openScreen(event.data.screen);
    });
  }
  if (installed) persist().catch(function () {});

  window.StridePWA = {
    installed: installed,
    fetch: window.StrideOffline.request,
    bind: window.StrideOffline.bind,
    pending: window.StrideOffline.pending,
    sync: window.StrideOffline.sync,
    discard: window.StrideOffline.discard,
    setOffline: setOffline,
    persist: persist,
    clear: window.StrideOffline.clear,
    pushSupported: !!(registration && 'PushManager' in window && 'Notification' in window),
    ready: function () { return registration ? registration.then(function () { return navigator.serviceWorker.ready; }) : Promise.reject(new Error('Install Stride over HTTPS to enable notifications.')); },
    permission: function () { return 'Notification' in window ? Notification.requestPermission() : Promise.resolve('denied'); },
  };
})();
