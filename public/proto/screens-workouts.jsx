// WORKOUTS — what you actually trained, plan or no plan.
//
// The Plan tab answers "what am I supposed to do"; this one answers "what did I
// do". It reads the same session universe the rest of the app holds (the /home
// week array is unbounded and already contains every done/skipped session ever,
// plus every block's sessions) and shows only sessions that really happened —
// including any done outside the current plan.

const TW = window.STRIDE_THEME;

/** Every session the client knows about, de-duplicated by id, newest first. */
function strideAllSessions() {
  const byId = {};
  (window.STRIDE_WEEK_PLAN || []).forEach((s) => { if (s && s.id != null) byId[s.id] = s; });
  (window.STRIDE_BLOCKS || []).forEach((b) => (b.sessions || []).forEach((s) => {
    if (s && s.id != null && !byId[s.id]) byId[s.id] = s;
  }));
  return Object.keys(byId).map((k) => byId[k])
    .filter((s) => s.scheduledDate)
    .sort((a, b) => String(b.scheduledDate).localeCompare(String(a.scheduledDate)));
}

/** Sessions that actually happened (done), inside a date window. */
function strideDoneBetween(fromIso, toIso) {
  return strideAllSessions().filter((s) => s.status === 'done' && s.scheduledDate >= fromIso && s.scheduledDate <= toIso);
}

const strideIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function WorkoutsScreen({ go, persona }) {
  const [view, setView] = React.useState('week'); // 'week' | 'month'
  const [openSession, setOpenSession] = React.useState(null);
  const wide = useStrideWide();
  const close = () => setOpenSession(null);

  return (
    <StrideSplit title={openSession && openSession.title} onClose={close}
      empty={window.t('Pick a workout to see what you did.')}
      detail={openSession && <SessionDetail key={openSession.id} session={openSession} go={go} persona={persona} onClose={close}/>}
      list={(
        <Screen>
          {/* The sidebar links to Routines on desktop. */}
          <StrideHeader title="Workouts" kicker={window.t('What you actually trained')}
            right={!wide && <StrideButton variant="ghost" size="sm" icon="timer" onClick={() => go('routines')}>Routines</StrideButton>}/>
          <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
            <ToggleSeg value={view} onChange={setView} options={[
              { v: 'week', label: 'Week' },
              { v: 'month', label: 'Month' },
            ]}/>
          </div>

          {view === 'week'
            ? <WorkoutsWeek onOpen={setOpenSession} selected={openSession}/>
            : <WorkoutsMonth onOpen={setOpenSession} selected={openSession}/>}
        </Screen>
      )}/>
  );
}

/** Totals for a set of done sessions — the honest kind: computed, never faked. */
function WorkoutTotals({ sessions, label }) {
  const volume = sessions.reduce((n, s) => n + (s.volume || 0), 0);
  const minutes = sessions.reduce((n, s) => n + (s.duration || 0), 0);
  const rpes = sessions.map((s) => s.rpe).filter((r) => r);
  const avgRpe = rpes.length ? (rpes.reduce((n, r) => n + r, 0) / rpes.length).toFixed(1) : '—';
  return (
    <Card style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: TW.ink3, marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <BigStat label="Workouts" value={sessions.length}/>
        <BigStat label="Volume" value={volume ? `${(volume / 1000).toFixed(1)}t` : '—'}/>
        <BigStat label="Time" value={minutes ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}` : '—'}/>
        <BigStat label="Avg RPE" value={avgRpe}/>
      </div>
    </Card>
  );
}

function WorkoutsWeek({ onOpen, selected }) {
  const [offset, setOffset] = React.useState(0);
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const done = strideDoneBetween(strideIso(monday), strideIso(sunday));
  const fmtD = (d) => d.toLocaleDateString(window.strideLocale(), { day: 'numeric', month: 'short' });
  const label = offset === 0 ? window.t('This week') : `${fmtD(monday)} – ${fmtD(sunday)}`;
  const swipe = window.useSwipeNav(() => setOffset((o) => o - 1), () => setOffset((o) => o + 1));

  return (
    <div style={{ padding: '0 20px' }} {...swipe}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <IconBtn icon="chevL" size={32} onClick={() => setOffset((o) => o - 1)}/>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TW.ink }}>{label}</div>
        <IconBtn icon="chevR" size={32} onClick={() => setOffset((o) => o + 1)}/>
      </div>

      <WorkoutTotals sessions={done} label={window.t('This week')}/>
      <WorkoutList sessions={done} onOpen={onOpen} selected={selected} empty={window.t('No workouts logged this week.')}/>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function WorkoutsMonth({ onOpen, selected }) {
  const now = new Date();
  const [monthStart, setMonthStart] = React.useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const y = monthStart.getFullYear(), m = monthStart.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstCol = (monthStart.getDay() + 6) % 7;              // Monday-first
  const rows = Math.ceil((firstCol + daysInMonth) / 7);
  const iso = (d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayIso = strideIso(now);

  // Unlike the plan's month grid, a day can hold MORE than one workout — an extra
  // session on a training day must not hide the planned one.
  const byDate = {};
  strideDoneBetween(iso(1), iso(daysInMonth)).forEach((s) => {
    (byDate[s.scheduledDate] = byDate[s.scheduledDate] || []).push(s);
  });
  const done = Object.keys(byDate).reduce((all, k) => all.concat(byDate[k]), []);
  const page = (delta) => setMonthStart(new Date(y, m + delta, 1));
  const swipe = window.useSwipeNav(() => page(-1), () => page(1));

  return (
    <div style={{ padding: '0 20px' }} {...swipe}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <IconBtn icon="chevL" size={32} onClick={() => page(-1)}/>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TW.ink }}>
          {monthStart.toLocaleDateString(window.strideLocale(), { month: 'long', year: 'numeric' })}
        </div>
        <IconBtn icon="chevR" size={32} onClick={() => page(1)}/>
      </div>

      <WorkoutTotals sessions={done} label={window.t('This month')}/>

      <Card style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TW.ink3 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: rows * 7 }, (_, i) => {
            const day = i - firstCol + 1;
            if (day < 1 || day > daysInMonth) return <div key={i}/>;
            const key = iso(day);
            const sessions = byDate[key] || [];
            const isToday = key === todayIso;
            return (
              <button key={i} onClick={() => sessions[0] && onOpen(sessions[0])} style={{
                aspectRatio: '1', borderRadius: 10, cursor: sessions.length ? 'pointer' : 'default',
                border: isToday ? `1.5px solid ${TW.ink}` : `1px solid ${sessions.length ? 'transparent' : TW.lineSoft}`,
                background: sessions.length ? TW.accent : TW.surface,
                color: sessions.length ? '#fff' : TW.ink3,
                display: 'grid', placeItems: 'center', position: 'relative',
                fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
              }}>
                {day}
                {sessions.length > 1 && (
                  <span style={{
                    position: 'absolute', right: 3, top: 3, width: 6, height: 6, borderRadius: 6,
                    background: TW.volt,
                  }}/>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <WorkoutList sessions={done} onOpen={onOpen} selected={selected} empty={window.t('No workouts logged this month.')}/>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function WorkoutList({ sessions, onOpen, selected, empty }) {
  if (!sessions.length) {
    return (
      <Card style={{ padding: 18 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: TW.ink3 }}>{empty}</div>
      </Card>
    );
  }
  return (
    <div style={{ background: TW.surface, border: `1px solid ${TW.line}`, borderRadius: 16, overflow: 'hidden' }}>
      {sessions.map((s, i) => (
        <button key={s.id} onClick={() => onOpen(s)} style={{
          width: '100%', textAlign: 'left', cursor: 'pointer', background: selected && selected.id === s.id ? TW.lineSoft : 'none',
          border: 'none', borderTop: i ? `1px solid ${TW.lineSoft}` : 'none',
          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: TW.accent + '18', flexShrink: 0,
            display: 'grid', placeItems: 'center',
          }}>
            <StrideIcon name="dumbbell" size={19} color={TW.accent}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14.5, color: TW.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TW.ink3, marginTop: 2 }}>
              {strideWorkoutMeta(s)}
            </div>
          </div>
          <StrideIcon name="chevR" size={16} color={TW.ink3}/>
        </button>
      ))}
    </div>
  );
}

/** "Fri 25 Jul · 62 min · 5.8t · RPE 7.4" — only the parts that exist. */
function strideWorkoutMeta(s) {
  const parts = [];
  if (s.scheduledDate) {
    parts.push(new Date(s.scheduledDate + 'T00:00:00')
      .toLocaleDateString(window.strideLocale(), { weekday: 'short', day: 'numeric', month: 'short' }));
  }
  if (s.duration) parts.push(`${s.duration} min`);
  if (s.volume) parts.push(`${(s.volume / 1000).toFixed(1)}t`);
  if (s.rpe) parts.push(`RPE ${s.rpe}`);
  return parts.join(' · ');
}

Object.assign(window, { WorkoutsScreen, strideAllSessions, strideDoneBetween });
