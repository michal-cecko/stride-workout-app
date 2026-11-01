function WebNotificationsBody() {
  const [preferences, setPreferences] = React.useState(null);
  const [enabled, setEnabled] = React.useState(false);
  const [configured, setConfigured] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const pwa = window.StridePWA;
  const push = window.__stridePush;

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([push.config(), push.enabled()]).then(([config, active]) => {
      if (cancelled) return;
      setPreferences(config.preferences);
      setConfigured(config.configured);
      setEnabled(active);
    }).catch(() => { if (!cancelled) setError('Could not load notification settings. Reopen this sheet to try again.'); });
    return () => { cancelled = true; };
  }, []);

  const run = (action) => {
    setBusy(true);
    setError('');
    setNotice('');
    return action().catch((e) => setError(e.message || 'Could not save notification settings.')).finally(() => setBusy(false));
  };
  const save = (patch) => run(() => push.save(patch).then((result) => {
    setPreferences(result.preferences);
    if (patch.weigh_reminder !== undefined) localStorage.setItem('stride_weigh_reminder', patch.weigh_reminder ? '1' : '0');
    if (patch.coach_pokes !== undefined) localStorage.setItem('stride_coach_pokes', patch.coach_pokes ? '1' : '0');
  }));
  const row = (key, label, sub, timeKey) => (
    <div style={{ padding: 16, borderBottom: `1px solid ${TT.lineSoft}` }}>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontFamily: 'Archivo', fontWeight: 800, fontSize: 14 }}>
        {window.t(label)}
        <input type="checkbox" role="switch" aria-label={window.t(label)} checked={!!preferences[key]} disabled={busy || !enabled}
          onChange={(e) => save({ [key]: e.target.checked })} style={{ accentColor: TT.accent, width: 22, height: 22 }}/>
      </label>
      <div style={{ marginTop: 5, fontFamily: 'Inter', fontSize: 12, color: TT.ink3, lineHeight: 1.5 }}>{window.t(sub)}</div>
      {timeKey && <input type="time" aria-label={window.t(label + ' time')} value={preferences[timeKey] || ''}
        disabled={busy || !enabled || !preferences[key]} onChange={(e) => { if (e.target.value) save({ [timeKey]: e.target.value }); }}
        style={{ marginTop: 10, padding: 8, border: `1px solid ${TT.line}`, borderRadius: 8, background: TT.surface, color: TT.ink, font: '14px Inter' }}/>}
    </div>
  );

  return <div style={{ padding: '4px 0 12px' }}>
    {!pwa.pushSupported && <p style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink2, lineHeight: 1.6 }}>
      Add Stride to your Home Screen first, then open it there. In Safari, tap Share, then Add to Home Screen.
    </p>}
    {preferences && !configured && <p style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink2 }}>Notifications are not configured on the server yet.</p>}
    <StrideButton block variant="primary" disabled={busy || !configured || !pwa.pushSupported}
      onClick={() => run(() => enabled ? push.disable().then(() => setEnabled(false)) : push.enable().then(() => setEnabled(true)))}>
      {window.t(enabled ? 'Disable notifications on this device' : 'Enable notifications')}
    </StrideButton>
    {preferences && <>
      <div style={{ marginTop: 16, border: `1px solid ${TT.line}`, borderRadius: 16, overflow: 'hidden', background: TT.surface }}>
        {row('workout_reminder', 'Workout reminders', 'On training days, until your session is done.', 'workout_reminder_time')}
        {row('weigh_reminder', 'Weigh-in reminders', 'Every day, unless you already logged your weight.', 'weigh_reminder_time')}
        {row('coach_pokes', 'Coach updates', 'Messages from your coach, based on your day.')}
      </div>
      <p style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3 }}>{window.t('Timezone')}: {preferences.notification_timezone}</p>
      {enabled && <StrideButton block variant="ghost" disabled={busy} onClick={() => run(() => push.test().then(() => setNotice('Test notification sent.')))}>
        Send a test notification
      </StrideButton>}
    </>}
    {error && <p role="alert" style={{ fontFamily: 'Inter', color: TT.rose, fontSize: 13 }}>{window.t(error)}</p>}
    {notice && <p role="status" style={{ fontFamily: 'Inter', color: TT.green, fontSize: 13 }}>{window.t(notice)}</p>}
  </div>;
}

function WebAppBody() {
  const [persistent, setPersistent] = React.useState(null);
  const [pending, setPending] = React.useState([]);
  const [error, setError] = React.useState('');
  const pwa = window.StridePWA;
  const refresh = () => pwa.pending().then(setPending).catch(() => setError('Could not read saved data.'));
  React.useEffect(() => {
    navigator.storage?.persisted?.().then(setPersistent);
    refresh();
    window.addEventListener('stride-sync', refresh);
    return () => window.removeEventListener('stride-sync', refresh);
  }, []);

  return <div style={{ fontFamily: 'Inter', fontSize: 13, lineHeight: 1.6, color: TT.ink2 }}>
    <h3 style={{ fontFamily: 'Archivo', color: TT.ink }}>Install Stride</h3>
    <p>{window.t(pwa.installed ? 'Stride is installed on this device.' : 'In Safari, tap Share, then Add to Home Screen. Open Stride from its icon.')}</p>
    <h3 style={{ fontFamily: 'Archivo', color: TT.ink }}>Saved on this device</h3>
    <p>Plans and exercises you opened are available offline. Workout logs and weigh-ins wait here until they can sync. AI coaching needs a connection.</p>
    <p>{window.t('Waiting to sync')}: {pending.length}</p>
    {pending.length > 0 && <StrideButton block variant="primary" onClick={() => pwa.sync().then(refresh).catch(() => setError('Could not sync. Check your connection.'))}>Sync now</StrideButton>}
    {pending.some((item) => item.status === 401 || item.status === 403) && <StrideButton block variant="ghost" onClick={() => location.reload()}>Sign in again</StrideButton>}
    {pending.filter((item) => item.status).map((item) => <div key={item.id} style={{ marginTop: 12, padding: 12, background: TT.lineSoft, borderRadius: 10 }}>
      <div>{window.t(item.url.endsWith('/weight') ? 'Weigh-in' : 'Workout log')} · {new Date(item.createdAt).toLocaleString(window.STRIDE_LANG === 'sk' ? 'sk-SK' : 'en-US')}</div>
      <div>{window.t('A saved change needs attention.')}</div>
      <StrideButton variant="ghost" onClick={() => {
        if (window.confirm(window.t('Discard this unsynced change?'))) pwa.discard(item.id).then(refresh);
      }}>Discard this change</StrideButton>
    </div>)}
    {persistent !== null && <p>{window.t(persistent ? 'Persistent storage is enabled.' : 'Your browser manages how long saved data is kept.')}</p>}
    {!persistent && <StrideButton block variant="ghost" onClick={() => pwa.persist().then(setPersistent).catch(() => setError('Could not request persistent storage.'))}>Keep data on this device</StrideButton>}
    {error && <p role="alert" style={{ color: TT.rose }}>{window.t(error)}</p>}
  </div>;
}
