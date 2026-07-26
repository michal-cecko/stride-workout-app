// Main screens: Home, Plan, Weight, Profile/Settings, Goals
// Depends on data.jsx + ui.jsx (loaded earlier).

const TT = window.STRIDE_THEME;

// Recent-feed icon tints — give each activity type its own colorway
const RECENT_ICON_TINT = {
  dumbbell: { bg: '#2563EB18', fg: '#2563EB' },  // strength — blue
  flame:    { bg: '#FF4D1F18', fg: '#FF4D1F' },  // hard session — coral
  heart:    { bg: '#16A34A18', fg: '#16A34A' },  // cardio/run — green
};

// Done-card copy by how much of the session was actually logged. Finishing two
// of seventeen sets is still worth acknowledging — it just isn't "crushed it".
const DONE_HEADLINE = {
  full: (name) => `CRUSHED IT, ${name}.`,
  most: (name) => `SOLID WORK, ${name}.`,
  half: (name) => `HALF A SESSION, ${name}.`,
  short: (name) => `YOU SHOWED UP, ${name}.`,
};
const DONE_BLURB = {
  full: "Today's training is in the books — every set logged. Rest up and recover, or stack on a bonus session if you've still got it in you.",
  most: 'Most of the work is done and it counts. Whatever you cut, the coach will factor in next time.',
  half: 'You cut it short and that is fine — half a session beats none. Log how it felt so the plan adapts.',
  short: 'Short one today. Showing up on a bad day is still training; the coach will pick it up from here.',
};

// ────────────────────────────────────────────────────────────────────
// HOME / TODAY
// ────────────────────────────────────────────────────────────────────
function HomeScreen({ go, persona }) {
  const u = window.STRIDE_USER;
  const w = window.STRIDE_TODAYS_WORKOUT;
  const recent = window.STRIDE_RECENT;
  const prefs = window.useStridePrefs();
  const today = new Date();
  const todaySession = (window.STRIDE_WEEK_PLAN || []).find(d => d.status === 'today');
  // null = closed, 'view' = detail sheet, 'edit' = editor sheet
  const [sessionSheet, setSessionSheet] = React.useState(null);
  // Daily check-in (energy) — keyed by the REAL date so it resets each morning
  // and the coach-poke context can read today's energy.
  const _ciIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const checkInKey = 'stride_checkin_' + _ciIso;
  const checkInNoteKey = 'stride_checkin_note_' + _ciIso;
  const [energy, setEnergy] = React.useState(() => {
    try { const v = localStorage.getItem(checkInKey); return v ? Number(v) : null; } catch (e) { return null; }
  });
  const [energyNote, setEnergyNote] = React.useState(() => {
    try { return localStorage.getItem(checkInNoteKey) || ''; } catch (e) { return ''; }
  });
  const [checkInOpen, setCheckInOpen] = React.useState(false);
  // Whether today's training has been completed. Server-derived (today's session
  // came back status 'done') OR the local date-stamped flag written when a session
  // finishes — the flag self-expires tomorrow. Never cleared by navigation.
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const doneFlag = (() => {
    try { return localStorage.getItem('stride_today_done') === todayISO; } catch (e) { return false; }
  })();
  const doneToday = (w && w.status === 'done') || doneFlag;
  // How much of it actually got done — a session finished early must not be
  // congratulated as if every set had been logged.
  const done = window.strideCompletion(w, (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('stride_last_log') || 'null');
      return saved && w && saved.sessionId === w.id ? saved.log : null;
    } catch (e) { return null; }
  })());
  const startAnotherSession = () => go('generate');
  // Session left running (quit mid-workout): offer Resume + an explicit end,
  // instead of a "Start" that reads like the logged work is gone.
  const inProgress = !doneToday && window.strideIsInProgress(w);
  const progress = window.strideProgressStats(w, window.strideActiveProgress(w && w.id));
  const [endOpen, setEndOpen] = React.useState(false);
  const endSession = () => {
    setEndOpen(false);
    window.strideClearProgress();
    try { localStorage.setItem('stride_today_done', todayISO); } catch (e) {}
    Promise.resolve(w && w.id != null && window.__strideCompleteSession ? window.__strideCompleteSession(w.id, {}) : null)
      .then(() => { if (window.__strideRerender) window.__strideRerender(); });
  };
  const commitEnergy = (k) => {
    setEnergy(k);
    try { localStorage.setItem(checkInKey, String(k)); } catch (e) {}
  };
  const commitEnergyNote = (note) => {
    setEnergyNote(note);
    try { note.trim() ? localStorage.setItem(checkInNoteKey, note) : localStorage.removeItem(checkInNoteKey); } catch (e) {}
  };
  const dateStr = today.toLocaleDateString(window.strideLocale(), { weekday: 'long', month: 'short', day: 'numeric' });

  // "Starter plan" notice: the backend set ai_degraded because the AI couldn't
  // fully build the last plan, so it's the deterministic builder. Shown once,
  // dismissible — so a fallback is never silently passed off as AI-tailored.
  const [planDegraded, setPlanDegraded] = React.useState(() => {
    try { return localStorage.getItem('stride_plan_degraded') === '1'; } catch (e) { return false; }
  });
  const dismissPlanDegraded = () => {
    try { localStorage.removeItem('stride_plan_degraded'); } catch (e) {}
    setPlanDegraded(false);
  };

  return (
    <Screen>
      {/* Top bar */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: TT.ink3 }}>{dateStr}</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: -1, color: TT.ink, marginTop: 2 }}>Hi, {u.name}.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AILogButton scopes={['today']} scopeLabel="today's training" persona={persona} go={go}/>
        </div>
      </div>

      {/* Starter-plan notice (deterministic fallback, not silently AI-tailored) */}
      {planDegraded && (
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 16, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 18, lineHeight: '20px' }}>💪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: TT.ink }}>Starter plan ready</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2, lineHeight: 1.45 }}>The AI coach was busy, so we built you a solid starter plan. Regenerate anytime for one fully tailored to you.</div>
            </div>
            <button onClick={dismissPlanDegraded} aria-label="Dismiss" style={{ border: 'none', background: 'transparent', color: TT.ink3, fontSize: 20, lineHeight: '18px', cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        </div>
      )}

      {/* Hero: Today's workout */}
      <div style={{ padding: '10px 20px 0' }}>
        {doneToday ? (
          <Card dark style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 170, height: 170, borderRadius: 170, background: TT.volt, filter: 'blur(44px)', opacity: 0.3 }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: TT.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <StrideIcon name="check" size={18} color={TT.ink} strokeWidth={3}/>
                </div>
                <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: TT.volt }}>
                  {done.planned ? window.t('{done} of {total} sets', { done: done.done, total: done.planned }) : window.t('All done today')}
                </span>
              </div>
              <h2 style={{ margin: '0 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 34, lineHeight: 0.98, letterSpacing: -1.4, color: '#fff' }}>
                {DONE_HEADLINE[done.tier](u.name.toUpperCase())}
              </h2>
              <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, color: '#bbb' }}>
                {DONE_BLURB[done.tier]}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                <StrideButton variant="volt" size="md" icon="plus" block onClick={startAnotherSession}>Add another session</StrideButton>
                <StrideButton variant="ghost" size="md" block onClick={() => go('summary')} style={{ color: '#fff', borderColor: '#ffffff33' }}>Recap</StrideButton>
              </div>
            </div>
          </Card>
        ) : (!w && window.STRIDE_HAS_PLAN) ? (
          <Card dark style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 160, background: TT.volt, filter: 'blur(44px)', opacity: 0.22 }}/>
            <div style={{ position: 'relative' }}>
              <Chip bg="#ffffff14" ink="#fff" dot color={TT.volt}>Today</Chip>
              <h2 style={{ margin: '10px 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 34, lineHeight: 0.98, letterSpacing: -1.4, color: '#fff' }}>
                REST DAY.
              </h2>
              {(() => {
                const n = window.STRIDE_NEXT_SESSION;
                if (!n) return <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, color: '#bbb' }}>Recover well — no session scheduled today.</p>;
                const whenT = n.inDays <= 0 ? window.t('later today') : n.inDays === 1 ? window.t('tomorrow') : window.t('in {n} days', { n: n.inDays });
                return (
                  <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, color: '#bbb' }}>
                    Recover well. Next up: <b style={{ color: '#fff' }}>{n.title}</b> {whenT}.
                  </p>
                );
              })()}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                <StrideButton variant="volt" size="md" iconRight="arrowRight" onClick={() => go('plan')} block>View plan</StrideButton>
                <StrideButton variant="ghost" size="md" icon="sparkles" onClick={() => go('generate')} block style={{ color: '#fff', borderColor: '#ffffff33' }}>Add a session</StrideButton>
              </div>
            </div>
          </Card>
        ) : !w ? (
          <Card dark style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 160, background: TT.accent, filter: 'blur(40px)', opacity: 0.25 }}/>
            <div style={{ position: 'relative' }}>
              <Chip bg="#ffffff14" ink="#fff" dot color={TT.volt}>Today</Chip>
              <h2 style={{ margin: '10px 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 34, lineHeight: 0.98, letterSpacing: -1.4, color: '#fff' }}>
                NOTHING PLANNED.
              </h2>
              <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, color: '#bbb' }}>
                Do a quick one-off session now, or have your coach build a plan you can stick to.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                <StrideButton variant="volt" size="md" icon="sparkles" onClick={() => go('onboarding')} block>Build a plan</StrideButton>
                <StrideButton variant="ghost" size="md" icon="sparkles" onClick={() => go('generate')} block style={{ color: '#fff', borderColor: '#ffffff33' }}>Generate a session</StrideButton>
              </div>
            </div>
          </Card>
        ) : (
        <Card dark onClick={() => setSessionSheet('view')} style={{ padding: 22, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
          {/* corner glow */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 160, background: TT.accent, filter: 'blur(40px)', opacity: 0.35 }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <Chip bg="#ffffff14" ink="#fff" dot color={TT.volt}>Today</Chip>
              <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 0.8 }}>{w.block}</span>
            </div>
            <h2 style={{
              margin: '6px 0 4px', fontFamily: 'Archivo, sans-serif',
              fontWeight: 900, fontSize: 38, lineHeight: 0.95, letterSpacing: -1.5,
              color: '#fff',
            }}>{w.title.toUpperCase()}</h2>
            <div style={{ display: 'flex', gap: 18, marginTop: 14, color: '#fff' }}>
              <Stat label="Exercises" value={w.exercises.length}/>
              <Stat label="Duration" value={`${w.durationMin}m`} muted/>
            </div>
            {/* Left mid-session? Pick up where you stopped instead of starting over. */}
            {inProgress && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: TT.volt }}>
                <span style={{ width: 7, height: 7, borderRadius: 7, background: TT.volt }}/>
                {progress.done > 0
                  ? window.t('In progress · {done} of {total} sets done', { done: progress.done, total: progress.total })
                  : window.t('In progress')}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }} onClick={(e) => e.stopPropagation()}>
              {inProgress ? (
                <>
                  <StrideButton variant="volt" size="md" iconRight="arrowRight" onClick={() => {
                    window.STRIDE_ACTIVE_WORKOUT = null;
                    if (window.__strideSetAutoRest) window.__strideSetAutoRest(window.strideResumeAuto());
                    go('active');
                  }} style={{ flex: 1 }}>Resume</StrideButton>
                  <IconBtn icon="check" onClick={() => setEndOpen(true)} bg="#ffffff14" color="#fff" border="#ffffff22"/>
                </>
              ) : (
                <>
                  <StrideButton variant="volt" size="md" iconRight="arrowRight" onClick={() => { window.STRIDE_ACTIVE_WORKOUT = null; go('active-config'); }} style={{ flex: 1 }}>Start</StrideButton>
                  <IconBtn icon="edit" onClick={() => setSessionSheet('edit')} bg="#ffffff14" color="#fff" border="#ffffff22"/>
                </>
              )}
            </div>
          </div>
        </Card>
        )}
      </div>

      {/* Quick-action row */}
      <div style={{ padding: '14px 20px 0' }}>
        {todaySession ? (
          <DailyCheckIn level={energy} note={energyNote} onOpen={() => setCheckInOpen(true)} go={go}/>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <QuickTile icon="sparkles" label={doneToday ? 'Add session' : 'Generate today\'s session'} sub={window.t('with {name}', { name: persona.name })} onClick={() => go('generate')} bgColor={TT.volt} inkColor={TT.ink}/>
            <QuickTile icon="bandage" label="Log how you feel" sub="Soreness · injuries · sleep" onClick={() => go('injuries')} bgColor={TT.surface} inkColor={TT.ink}/>
          </div>
        )}
      </div>

      {/* Goals snapshot — hidden until the user has set goals */}
      {window.STRIDE_GOALS.length > 0 && (
      <div style={{ padding: '22px 20px 0' }}>
        <SectionHeader title="Goals on track" right={
          <button onClick={() => go('goals')} style={{ border: 'none', background: 'none', color: TT.ink2, fontFamily: 'Inter', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            All {window.STRIDE_GOALS.length} <StrideIcon name="chevR" size={14}/>
          </button>
        }/>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20 }}>
          {window.STRIDE_GOALS.slice(0, 3).map(g => (
            <div key={g.id} onClick={() => go('goals')} style={{
              minWidth: 180, background: TT.surface, border: `1px solid ${TT.line}`,
              borderRadius: 18, padding: 14, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <Chip bg={g.color + '18'} ink={g.color} color={g.color} dot>{g.cat}</Chip>
                <ProgressRing value={g.progress} size={42} stroke={4} color={g.color}>
                  <span style={{ fontSize: 11, color: TT.ink }}>{Math.round(g.progress*100)}</span>
                </ProgressRing>
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, lineHeight: 1.15, color: TT.ink }}>{g.title}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, marginTop: 6 }}>{g.current} → {g.target}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Recent activity — hidden until there's session history */}
      {recent.length > 0 && (
      <div style={{ padding: '22px 20px 0' }}>
        <SectionHeader title="Recent"/>
        <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, overflow: 'hidden' }}>
          {recent.map((r, i) => {
            const tint = RECENT_ICON_TINT[r.icon] || { bg: TT.lineSoft, fg: TT.ink2 };
            const stats = [r.dur, prefs.showVolume && r.vol, ...(r.extra || []), prefs.showRpe && r.rpe].filter(Boolean).join(' · ');
            return (
              <div key={i} style={{
                padding: '14px 16px',
                borderTop: i ? `1px solid ${TT.lineSoft}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: tint.bg, display: 'grid', placeItems: 'center' }}>
                  <StrideIcon name={r.icon} size={20} color={tint.fg}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TT.ink }}>{r.title}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, marginTop: 2 }}>{stats}</div>
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, fontWeight: 700 }}>{r.d}</div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Spacer */}
      <div style={{ height: 20 }}/>

      {/* Daily check-in slide-over */}
      {checkInOpen && (
        <CheckInOverlay level={energy} note={energyNote} onSet={commitEnergy} onSetNote={commitEnergyNote} onClose={() => setCheckInOpen(false)} go={go}/>
      )}

      {/* End a session you walked away from — logged sets are already saved. */}
      {endOpen && (
        <Sheet title={window.t('End this session?')} onClose={() => setEndOpen(false)}>
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.55, color: TT.ink2, marginBottom: 16 }}>
              {progress.done > 0
                ? window.t('{done} of {total} sets are logged and stay logged. The session is marked done — the rest of the sets are simply not counted.', { done: progress.done, total: progress.total })
                : window.t('Nothing has been logged yet. The session is marked done with no sets counted.')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StrideButton variant="ghost" style={{ flex: 1 }} onClick={() => setEndOpen(false)}>Keep going</StrideButton>
              <StrideButton variant="primary" icon="check" style={{ flex: 1.3 }} onClick={endSession}>End session</StrideButton>
            </div>
          </div>
        </Sheet>
      )}

      {/* Today's session — detail / editor sheet */}
      {sessionSheet && todaySession && (
        <Sheet title={todaySession.title} onClose={() => setSessionSheet(null)}>
          <SessionDetail
            session={todaySession}
            go={go}
            persona={persona}
            startEditing={sessionSheet === 'edit'}
            onClose={() => setSessionSheet(null)}
          />
        </Sheet>
      )}
    </Screen>
  );
}

function Stat({ label, value, muted }) {
  return (
    <div>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: muted ? '#ddd' : '#fff', letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 1 }}>{label}</div>
    </div>
  );
}

// ── Daily check-in — energy logger with a morphing face ───────
const CHECKIN_LEVELS = [
  { key: 1, label: 'Drained', color: '#E11D48', read: "Noted — I'll keep today's loads conservative and lean on form work." },
  { key: 2, label: 'Sore',    color: '#F97316', read: "Thanks — I'll prioritise a thorough warm-up and ease into the main lifts." },
  { key: 3, label: 'OK',      color: '#F59E0B', read: "Got it — sticking to the plan as programmed." },
  { key: 4, label: 'Good',    color: '#84CC16', read: "Nice — you're cleared for the full session as built." },
  { key: 5, label: 'Primed',  color: '#16A34A', read: "Love it — if the top sets feel easy, you've got room to push." },
];

// Line-drawn face whose eyes + mouth morph with the energy level (1–5).
function EnergyFace({ level, size = 140, stroke = '#0A0A0A', bg = '#EFEBE0', sw = 6 }) {
  const lv = level || 3;
  const p = { stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const mouthCy = 56 + (lv - 3) * 7; // 1→42 (frown) … 5→70 (smile)
  let eyes;
  if (lv <= 1) {
    eyes = <><path {...p} d="M30 45 L41 47"/><path {...p} d="M70 45 L59 47"/></>; // tired droop
  } else if (lv >= 4) {
    eyes = <><path {...p} d="M31 47 Q36 40 41 47"/><path {...p} d="M59 47 Q64 40 69 47"/></>; // happy arcs
  } else {
    eyes = <><path {...p} d="M36 40 L36 49"/><path {...p} d="M64 40 L64 49"/></>; // neutral marks
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="48" fill={bg}/>
      {eyes}
      <path {...p} d={`M33 58 Q50 ${mouthCy} 67 58`}/>
    </svg>
  );
}

// Compact home card — a launcher that shows the logged state + a soreness button.
function DailyCheckIn({ level, note, onOpen, go }) {
  const chosen = CHECKIN_LEVELS.find((l) => l.key === level);
  const noteText = (note || '').trim();
  return (
    <div style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Energy launcher row */}
      <button onClick={onOpen} style={{
        display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer', width: '100%',
        background: 'transparent', border: 'none', borderRadius: 12, padding: 6, textAlign: 'left',
      }}>
        <EnergyFace level={level} size={48} sw={4.5} bg={chosen ? chosen.color + '22' : TT.lineSoft} stroke={chosen ? chosen.color : TT.ink}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TT.ink, lineHeight: 1 }}>Daily check-in</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {chosen
              ? (noteText
                  ? <>“{noteText}”</>
                  : <>Energy: <b style={{ color: TT.ink2 }}>{chosen.label}</b> · tap to update</>)
              : "How's your energy today?"}
          </div>
        </div>
        {chosen
          ? <StrideIcon name="chevR" size={18} color={TT.ink3}/>
          : <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, color: TT.ink, background: TT.volt, borderRadius: 9, padding: '7px 13px' }}>Check in</span>}
      </button>

      <div style={{ height: 1, background: TT.lineSoft }}/>

      {/* Soreness / injury button */}
      <button onClick={() => go('injuries')} style={{
        display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer', width: '100%',
        background: 'transparent', border: 'none', borderRadius: 12, padding: 6, textAlign: 'left',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 999, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="bandage" size={22} color={TT.ink2} strokeWidth={1.9}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TT.ink, lineHeight: 1 }}>Log soreness or injury</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 4 }}>Flag anything for your coach</div>
        </div>
        <StrideIcon name="chevR" size={18} color={TT.ink3}/>
      </button>
    </div>
  );
}

// Fullscreen slide-over — big morphing face + energy slider.
function CheckInOverlay({ level, note, onSet, onSetNote, onClose, go }) {
  const [val, setVal] = React.useState(level || 3);
  const [touched, setTouched] = React.useState(!!level);
  const [comment, setComment] = React.useState(note || '');
  const chosen = CHECKIN_LEVELS.find((l) => l.key === val);
  const pct = ((val - 1) / 4) * 100;
  const change = (k) => { setVal(k); setTouched(true); onSet(k); };
  const finish = () => { onSet(val); if (onSetNote) onSetNote(comment); onClose(); };

  // Coach reacts to the comment first (keyword match), else to the energy level.
  const commentReply = (txt) => {
    const t = (txt || '').toLowerCase();
    if (!t.trim()) return null;
    if (/sleep|slept|tired|exhaust|insomnia|restless/.test(t)) return "Noted on the sleep — I'll keep loads sensible today and add a longer warm-up so you ease in.";
    if (/sore|ache|aching|tight|stiff|doms/.test(t)) return "Thanks for flagging the soreness — I'll steer around aggravating positions and prioritise mobility first.";
    if (/pain|hurt|injur|tweak|strain|niggle/.test(t)) return "Appreciate you telling me — I'll keep it conservative, cap the load, and note it for your coach.";
    if (/stress|busy|work|rough|anxious|overwhelm/.test(t)) return "Got it — I'll keep today simple and efficient so training is one less thing to carry.";
    if (/motivat|strong|great|good|ready|pumped|fresh|energ|amazing/.test(t)) return "Love that energy — if the openers feel easy, you've got room to push the top sets.";
    if (/hungry|under.?eat|diet|fasted|low.?carb/.test(t)) return "Thanks — I'll keep the session tight on volume so fuelling doesn't become the limiter.";
    return "Thanks for the note — I've logged it and factored it into today's plan.";
  };
  const coachReply = commentReply(comment) || chosen.read;
  const tint = chosen.color;

  return (
    <div style={{ position: window.STRIDE_NATIVE ? 'fixed' : 'absolute', inset: 0, zIndex: 60, background: TT.bg, display: 'flex', flexDirection: 'column', animation: 'sheetUp 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 4px' }}>
        <IconBtn icon="close" size={38} onClick={onClose}/>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TT.ink3, padding: '8px 10px' }}>Skip</button>
      </div>

      {/* Scrollable content */}
      <div className="screen-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Question */}
        <div style={{ padding: '8px 32px 0', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 27, letterSpacing: -0.6, color: TT.ink, lineHeight: 1.12 }}>How's your energy today?</h2>
        </div>

        {/* Face + label */}
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div key={val} style={{ display: 'inline-block', animation: 'facePop 0.25s ease' }}>
              <EnergyFace level={val} size={150} sw={6} bg={tint + '22'} stroke={tint}/>
            </div>
            <div style={{ marginTop: 20, fontFamily: 'Inter', fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: TT.ink3 }}>{touched ? 'I feel' : 'Slide to set'}</div>
            <div style={{ marginTop: 4, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 32, letterSpacing: -1, color: tint }}>{chosen.label}</div>
          </div>
        </div>

        {/* Slider */}
        <div style={{ padding: '0 28px' }}>
          <div style={{ position: 'relative', height: 34, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 10, borderRadius: 999, background: TT.lineSoft }}/>
            <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 10, borderRadius: 999, background: tint, transition: 'background 0.15s ease' }}/>
            <div style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', width: 30, height: 30, borderRadius: 999, background: '#fff', border: `4px solid ${tint}`, boxShadow: '0 2px 8px rgba(0,0,0,0.20)', pointerEvents: 'none', transition: 'border-color 0.15s ease' }}/>
            <input type="range" min="1" max="5" step="1" value={val} onChange={(e) => change(Number(e.target.value))} aria-label="Energy level"
              style={{ position: 'absolute', left: 0, right: 0, width: '100%', height: 34, margin: 0, opacity: 0, cursor: 'pointer' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.4 }}>Drained</span>
            <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.4 }}>Primed</span>
          </div>
        </div>

        {/* Optional comment */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.6 }}>Add a comment</span>
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3 }}>Optional</span>
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={200}
            placeholder="Anything your coach should know? e.g. slept badly, tight hamstrings, feeling motivated…"
            style={{ width: '100%', boxSizing: 'border-box', resize: 'none', padding: '12px 14px', borderRadius: 14, border: `1px solid ${TT.line}`, background: TT.surface, color: TT.ink, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, outline: 'none' }}/>
        </div>

        {/* Coach read-back — reacts to energy + comment */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: TT.ink, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
              <StrideIcon name="sparkles" size={13} color={TT.volt}/>
            </div>
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: TT.ink2, lineHeight: 1.45 }}>{coachReply}</div>
          </div>
        </div>
      </div>

      {/* Done */}
      <div style={{ padding: '14px 24px 28px' }}>
        <StrideButton variant="accent" block size="lg" icon="check" onClick={finish}>Done</StrideButton>
      </div>
    </div>
  );
}

function QuickTile({ icon, label, sub, onClick, bgColor, inkColor }) {
  return (
    <button onClick={onClick} style={{
      background: bgColor, color: inkColor, border: bgColor === TT.surface ? `1px solid ${TT.line}` : 'none',
      borderRadius: 18, padding: 14, textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: 26, cursor: 'pointer',
      minHeight: 110,
    }}>
      <StrideIcon name={icon} size={22} color={inkColor} strokeWidth={2.2}/>
      <div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, lineHeight: 1.15 }}>{label}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, opacity: 0.6, marginTop: 3 }}>{sub}</div>
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// AI ACTIVITY LOG — scoped trainer-change history (opens from header icon)
// ────────────────────────────────────────────────────────────────────
const AI_SCOPE_GROUPS = { today: "Today's session", week: 'This week', block: 'This block' };

// Find the plan session a coach change touched (week view first, then blocks).
function strideFindSession(id) {
  if (id == null) return null;
  return [(window.STRIDE_WEEK_PLAN || [])]
    .concat((window.STRIDE_BLOCKS || []).map((b) => b.sessions || []))
    .flat()
    .find((x) => x.id === id) || null;
}

function AILogButton({ scopes, scopeLabel, persona, go, dark = false }) {
  const [open, setOpen] = React.useState(false);          // the "what changed" sheet
  const [openSession, setOpenSession] = React.useState(null);
  const entries = (window.STRIDE_AI_LOG || []).filter((e) => scopes.includes(e.scope));
  const trainer = (persona && persona.name) || 'Coach';
  // Badge = UNREAD changes: opening the log marks everything seen (persisted),
  // so the count only reappears when the coach makes new changes.
  const seenKey = 'stride_ailog_seen_' + scopes.join('-');
  const [seen, setSeen] = React.useState(() => {
    try { return parseInt(localStorage.getItem(seenKey) || '0', 10) || 0; } catch (e) { return 0; }
  });
  const unread = Math.max(0, entries.length - seen);
  const markSeen = () => {
    setSeen(entries.length);
    try { localStorage.setItem(seenKey, String(entries.length)); } catch (e) {}
  };
  // Tap = talk to the coach (the AI tab's old job); long-press / the badge still
  // gets you to the change log, which is also linked from the chat header.
  const openCoach = () => { markSeen(); if (go) go('chat'); };
  return (
    <>
      <button
        onClick={openCoach}
        onContextMenu={(e) => { e.preventDefault(); markSeen(); setOpen(true); }}
        aria-label={window.t('Coach')}
        style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
        background: dark ? '#ffffff14' : TT.surface,
        border: `1px solid ${dark ? '#ffffff22' : TT.line}`,
      }}>
        <StrideIcon name="chat" size={19} color={dark ? '#fff' : TT.ink}/>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 8, background: TT.accent, color: '#fff',
            fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10,
            display: 'grid', placeItems: 'center', border: `2px solid ${dark ? TT.ink : TT.bg}`,
          }}>{unread}</span>
        )}
      </button>
      {open && (
        <Sheet title="Coach activity" onClose={() => setOpen(false)}>
          <AILogBody entries={entries} scopes={scopes} scopeLabel={scopeLabel} trainer={trainer}
            onOpenEntry={(e) => {
              const session = strideFindSession(e.sessionId);
              if (session) { setOpenSession(session); return; }
              if (e.blockId != null && go) {
                window.__strideOpenBlockId = e.blockId;
                setOpen(false);
                go('block-detail');
              }
            }}/>
        </Sheet>
      )}
      {openSession && (
        <Sheet title={openSession.title} onClose={() => setOpenSession(null)}>
          <SessionDetail session={openSession} go={go} persona={persona} onClose={() => setOpenSession(null)}/>
        </Sheet>
      )}
    </>
  );
}

function AILogBody({ entries, scopes, scopeLabel, trainer, onOpenEntry }) {
  return (
    <div style={{ padding: '4px 0 8px' }}>
      {/* Scope banner */}
      <div style={{ display: 'flex', gap: 11, alignItems: 'center', background: TT.ink, color: '#fff', borderRadius: 14, padding: 14, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: TT.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="sparkles" size={18} color={TT.ink}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 14, lineHeight: 1.15 }}>{window.t('What {name} changed', { name: trainer })}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11.5, opacity: 0.7, marginTop: 2 }}>{window.t('Scoped to {scope}', { scope: window.t(scopeLabel) })} · {window.t(entries.length === 1 ? '{n} change' : '{n} changes', { n: entries.length })}</div>
        </div>
      </div>

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 0', fontFamily: 'Inter', fontSize: 13, color: TT.ink3 }}>
          No coach changes here yet.
        </div>
      )}

      {scopes.filter((sc) => entries.some((e) => e.scope === sc)).map((sc) => (
        <div key={sc} style={{ marginBottom: 18 }}>
          <SectionHeader title={AI_SCOPE_GROUPS[sc] || sc}/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {entries.filter((e) => e.scope === sc).map((e, i) => {
              // A change that points at a session/block opens it; the rest stay static.
              const linked = !!onOpenEntry && (e.sessionId != null || e.blockId != null);
              return (
                <div key={i} role={linked ? 'button' : undefined} onClick={linked ? () => onOpenEntry(e) : undefined}
                  style={{
                    display: 'flex', gap: 12, padding: '13px 14px', borderTop: i ? `1px solid ${TT.lineSoft}` : 'none',
                    cursor: linked ? 'pointer' : 'default',
                  }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <StrideIcon name={e.icon} size={15} color={TT.ink2}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink, lineHeight: 1.25 }}>{e.text}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginTop: 5 }}>{e.kind} · {e.target}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink2, lineHeight: 1.45, marginTop: 5 }}>{e.why}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: TT.ink3, marginTop: 6 }}>{e.when}</div>
                  </div>
                  {linked && <div style={{ alignSelf: 'center' }}><StrideIcon name="chevR" size={16} color={TT.ink3}/></div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 14, color: TT.ink, letterSpacing: 1, textTransform: 'uppercase' }}>{title}</h3>
      {right}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// PLAN — week / month view
// ────────────────────────────────────────────────────────────────────
function PlanScreen({ go, persona }) {
  const [view, setView] = React.useState(() => {
    const v = window.__stridePlanView;
    window.__stridePlanView = null;
    return v || 'week';
  });
  const week = window.STRIDE_WEEK_PLAN;
  // Header subtitle from the live active block — blank when there's no plan yet.
  const activeBlock = (window.STRIDE_BLOCKS || []).find(b => b.status === 'active');
  const planKicker = activeBlock
    ? `${activeBlock.name} · ${window.t('Week {w} of {total}', { w: activeBlock.weekOf, total: activeBlock.weeks })}`
    : undefined;

  return (
    <Screen>
      <StrideHeader title="Training Plan" kicker={planKicker} right={
        <AILogButton scopes={['today', 'week', 'block']} scopeLabel="your full plan" persona={persona} go={go}/>
      }/>
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
        <ToggleSeg value={view} onChange={setView} options={[
          { v: 'week', label: 'Week' },
          { v: 'month', label: 'Month' },
          { v: 'block', label: 'Block' },
        ]}/>
      </div>

      {view === 'week' && <PlanWeekView week={week} go={go} persona={persona}/>}
      {view === 'month' && <PlanMonthView go={go} persona={persona}/>}
      {view === 'block' && <PlanBlockView go={go} persona={persona}/>}
    </Screen>
  );
}

function ToggleSeg({ value, onChange, options }) {
  return (
    <div style={{
      flex: 1, display: 'inline-flex', background: TT.lineSoft, padding: 3, borderRadius: 12,
    }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          flex: 1, padding: '8px 10px', borderRadius: 9,
          border: 'none', background: o.v === value ? TT.surface : 'transparent',
          color: o.v === value ? TT.ink : TT.ink2,
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
          letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer',
          boxShadow: o.v === value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function PlanWeekView({ week, go, persona }) {
  const [openSession, setOpenSession] = React.useState(null);
  // Paged by calendar week (Mon–Sun); swipe or chevrons move the window. `dir`
  // remembers which way the last page turn went so the incoming week slides in
  // from that side (see the stridePage* keyframes) instead of snapping.
  const [offset, setOffset] = React.useState(0);
  const [dir, setDir] = React.useState(0);
  const page = (d) => { setDir(d); setOffset((o) => o + d); };
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const inWindow = (s) => {
    if (!s.scheduledDate) return offset === 0; // undated (mock) rows belong to "this week" only
    const d = new Date(s.scheduledDate + 'T00:00:00');
    return d >= monday && d <= sunday;
  };
  const rows = (week || []).filter(inWindow).slice()
    .sort((a, b) => String(a.scheduledDate || '').localeCompare(String(b.scheduledDate || '')));
  // Fill the no-training days so the week reads as a full Mon–Sun grid, not just the
  // days that have sessions — a gap day shows a muted "Rest day" row. Only when the
  // week has real dated sessions (live data); an empty week keeps its empty state,
  // and undated mock rows render as-is.
  const pad2 = (n) => String(n).padStart(2, '0');
  const isoOf = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  const todayIso = isoOf(new Date());
  const displayRows = (!rows.length || !rows.some((r) => r.scheduledDate)) ? rows : (() => {
    const byDate = {};
    rows.forEach((r) => { if (r.scheduledDate) (byDate[r.scheduledDate] = byDate[r.scheduledDate] || []).push(r); });
    const out = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const iso = isoOf(dt);
      if (byDate[iso]) { byDate[iso].forEach((r) => out.push(r)); continue; } // keep all sessions that day
      out.push({
        __rest: true, scheduledDate: iso, kind: 'Rest',
        day: dt.toLocaleDateString('en-US', { weekday: 'short' }), // EN abbrev → SK dict maps it
        date: dt.getDate(), isToday: iso === todayIso,
      });
    }
    rows.forEach((r) => { if (!r.scheduledDate) out.push(r); }); // defensive: keep any undated rows
    return out;
  })();
  const swipe = useSwipeNav(() => page(-1), () => page(1));
  const fmtD = (d) => d.toLocaleDateString(window.strideLocale(), { day: 'numeric', month: 'short' });
  const label = offset === 0 ? window.t('This week') : `${fmtD(monday)} – ${fmtD(sunday)}`;

  return (
    <div style={{ padding: '0 20px' }} {...swipe}>
      {/* ‹ Week › header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <IconBtn icon="chevL" size={32} onClick={() => page(-1)}/>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TT.ink }}>{label}</div>
        <IconBtn icon="chevR" size={32} onClick={() => page(1)}/>
      </div>

      <div key={offset} style={{ animation: dir ? `${dir > 0 ? 'stridePageNext' : 'stridePagePrev'} .3s cubic-bezier(.22,.61,.36,1) both` : 'none' }}>
        {rows.length === 0 && (
          <Card style={{ padding: 18 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink3 }}>Nothing planned this week yet.</div>
          </Card>
        )}
        {displayRows.map((d, i) => {
          if (d.__rest) return <RestRow key={i} d={d} last={i === displayRows.length - 1}/>;
          if (d.status === 'today') return <TodayRow key={i} d={d} go={go} onOpen={() => setOpenSession(d)}/>;
          return <WeekRow key={i} d={d} last={i === displayRows.length - 1} onOpen={() => setOpenSession(d)}/>;
        })}
      </div>
      <div style={{ paddingTop: 18 }}>
        <StrideButton variant="ghost" block icon="plus">Add session</StrideButton>
      </div>
      <div style={{ height: 24 }}/>

      {openSession && (
        <Sheet title={openSession.title} onClose={() => setOpenSession(null)}>
          <SessionDetail session={openSession} go={go} persona={persona} onClose={() => setOpenSession(null)}/>
        </Sheet>
      )}
    </div>
  );
}

function PlanChangesCard({ persona, changes }) {
  const [open, setOpen] = React.useState(true);
  const [dismissed, setDismissed] = React.useState(!!window.__strideTunedDismissed);
  if (!changes || !changes.length || dismissed) return null;
  const dismiss = (e) => {
    e.stopPropagation();
    window.__strideTunedDismissed = true;
    setDismissed(true);
  };
  return (
    <div style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 16, padding: 14, margin: '4px 0 18px' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', gap: 11, alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: TT.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="sparkles" size={17} color={TT.ink}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 14, color: TT.ink, lineHeight: 1.15 }}>
            {(persona && persona.name) || 'Trainer'} tuned your week
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>
            {changes.length} change{changes.length > 1 ? 's' : ''} · tap to {open ? 'hide' : 'review'}
          </div>
        </div>
        <div style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <StrideIcon name="chevD" size={20} color={TT.ink3}/>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" style={{
          width: 28, height: 28, borderRadius: 8, border: `1px solid ${TT.line}`, background: TT.bg,
          display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <StrideIcon name="x" size={15} color={TT.ink3}/>
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 6 }}>
          {changes.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0 2px', borderTop: `1px solid ${TT.lineSoft}`, marginTop: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <StrideIcon name={c.icon} size={15} color={TT.ink2}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink, lineHeight: 1.2 }}>{c.text}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginTop: 4 }}>{c.kind} · {c.day}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink2, lineHeight: 1.45, marginTop: 4 }}>{c.why}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${TT.lineSoft}`, fontFamily: 'Inter', fontSize: 11.5, color: TT.ink3 }}>
            <StrideIcon name="sparkles" size={13} color={TT.ink3}/>
            Dismiss anytime — find every change under the ✦ activity log up top.
          </div>
        </div>
      )}
    </div>
  );
}

function DayPill({ d, dark }) {
  const rest = d.kind === 'Rest';
  const done = d.status === 'done';
  const skipped = d.status === 'skipped';
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 56, padding: '8px 0', borderRadius: 14,
        background: 'transparent',
        border: dark ? `1px solid #ffffff33` : (rest ? `1px dashed ${TT.line}` : `1px solid ${TT.line}`),
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        color: dark ? '#fff' : (skipped ? TT.ink3 : TT.ink),
      }}>
        <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>{d.day}</span>
        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22 }}>{d.date}</span>
      </div>
      {(done || skipped) && (
        <div style={{
          position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9,
          background: done ? TT.green : TT.amber, display: 'grid', placeItems: 'center',
          border: `2px solid ${TT.bg}`,
        }}>
          <StrideIcon name={done ? 'check' : 'x'} size={10} color="#fff" strokeWidth={3.5}/>
        </div>
      )}
    </div>
  );
}

function TodayRow({ d, go, onOpen }) {
  return (
    <div onClick={onOpen} style={{
      background: TT.ink, borderRadius: 18, padding: 16, margin: '4px 0 16px',
      color: '#fff', cursor: 'pointer', position: 'relative', overflow: 'hidden',
      boxShadow: '0 10px 28px rgba(10,10,10,0.18)',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, position: 'relative' }}>
        <DayPill d={d} dark/>
        <div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: TT.volt, marginBottom: 4 }}>
            Today
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 21, lineHeight: 1.1 }}>{d.title}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#ffffffaa', marginTop: 4 }}>
            {d.duration ? window.t('{m} min planned', { m: d.duration }) : '—'}
            {d.adjustments && d.adjustments.length > 0 && <span style={{ color: TT.volt, fontWeight: 600 }}> · {d.adjustments.length} changes</span>}
          </div>
        </div>
      </div>
      <StrideButton variant="volt" size="md" block
        onClick={(e) => {
          e.stopPropagation();
          (d.id ? window.__strideLoadSession(d.id) : Promise.resolve(window.STRIDE_ACTIVE_WORKOUT = null))
            .then(() => go('active-config')).catch(() => go('active-config'));
        }}>Start workout</StrideButton>
    </div>
  );
}

// A no-training day in the week grid — muted, non-interactive (no session to open).
function RestRow({ d, last }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 0', alignItems: 'center',
      borderBottom: last ? 'none' : `1px solid ${TT.lineSoft}`,
      opacity: 0.7,
    }}>
      <DayPill d={d}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 17, lineHeight: 1.15, color: TT.ink3, display: 'flex', alignItems: 'center', gap: 8 }}>
          {window.t('Rest day')}
          {d.isToday && (
            <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 800, color: TT.ink, background: TT.volt, borderRadius: 6, padding: '2px 6px', letterSpacing: 0.6, textTransform: 'uppercase' }}>{window.t('Today')}</span>
          )}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 4 }}>{window.t('Recovery')}</div>
      </div>
    </div>
  );
}

function WeekRow({ d, last, onOpen }) {
  const rest = d.kind === 'Rest';
  const done = d.status === 'done';
  const skipped = d.status === 'skipped';
  return (
    <div onClick={onOpen} style={{
      display: 'flex', gap: 14, padding: '14px 0', alignItems: 'center',
      borderBottom: last ? 'none' : `1px solid ${TT.lineSoft}`,
      cursor: 'pointer', opacity: skipped ? 0.85 : 1,
    }}>
      <DayPill d={d}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 17, lineHeight: 1.15,
          color: skipped ? TT.ink3 : TT.ink,
        }}>{d.title}</div>
        {skipped ? (
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.amber, fontWeight: 600, marginTop: 4 }}>
            {d.skipReason ? `${window.t('Skipped ·')} ${d.skipReason}` : window.t('Skipped')}
          </div>
        ) : (
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 4 }}>
            {d.duration ? `${d.duration} min` : '—'}{d.volume ? ` · ${(d.volume/1000).toFixed(1)}t volume` : ''}
            {d.adjustments && d.adjustments.length > 0 && <span style={{ color: TT.ink2, fontWeight: 600 }}> · adjusted</span>}
          </div>
        )}
      </div>
      <StrideIcon name="chevR" size={20} color={TT.ink3}/>
    </div>
  );
}

// Canned per-outcome trainer note. Every line goes through window.t so the
// SK dictionary can localise it (the template string IS the dictionary key;
// values are substituted after translation).
// A localized, natural day phrase for a session: "today"/"tomorrow"/"on Friday"
// in EN, "dnes"/"zajtra"/"v piatok" in SK — never the raw "Fri" abbreviation.
function strideDayPhrase(s) {
  const sk = window.readStrideLanguage() === 'sk';
  const iso = s.scheduledDate;
  if (iso) {
    const d = new Date(iso + 'T00:00:00');
    const now = new Date();
    const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    if (diff === 0) return sk ? 'dnes' : 'today';
    if (diff === 1) return sk ? 'zajtra' : 'tomorrow';
    if (sk) return ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'][d.getDay()];
    return 'on ' + d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  // No date (mock/legacy) — best effort from the abbreviation.
  return s.day || '';
}

function aiSessionNote(personaKey, s) {
  const k = ['coach','calm','nerd'].includes(personaKey) ? personaKey : 'calm';
  const rest = s.kind === 'Rest';
  const v = {
    kind: s.kind, day: strideDayPhrase(s), duration: s.duration,
    vol: (s.volume / 1000).toFixed(1),
    done: s.completion ? s.completion.done : 0,
    total: s.completion ? s.completion.planned : 0,
    pct: s.completion ? Math.round(s.completion.ratio * 100) : 0,
    volKg: (s.volume || 0).toLocaleString(window.strideLocale()),
    reason: (s.skipReason || '').toLowerCase(),
  };
  let bucket;
  // An auto-skip (nightly roll, no reason logged) reads differently from a
  // deliberate skip the athlete explained — don't render a reason-shaped hole.
  if (s.status === 'skipped') bucket = s.skipReason ? 'skipped' : 'skippedAuto';
  else if (s.status === 'today') bucket = 'today';
  else if (s.status === 'planned') bucket = 'planned';
  else if (rest) bucket = 'recovery';
  // `s.result` was never set by anything — the "bad" copy could never appear.
  // Judge the session by how much of it was actually logged instead.
  else bucket = (s.completion && s.completion.tier === 'full') || !s.completion ? 'good'
    : s.completion.tier === 'most' ? 'good' : 'partial';

  const lines = {
    good: {
      coach: window.t(`{vol} tonnes moved and bar speed held to the last rep. That's the standard now — match it next {kind}.`, v),
      calm: window.t(`Really clean work. Volume and effort landed right where we planned, and your top sets looked controlled. Recover well and we'll build from here.`, v),
      nerd: window.t(`{volKg} kg tonnage @ RPE 7.4 — within 3% of target. Velocity steady across working sets, so you're cleared for +2.5 kg next cycle.`, v),
    },
    partial: {
      coach: window.t(`You got {done} of {total} sets in before calling it. That's still work in the bank — we pick the rest up next {kind}.`, v),
      calm: window.t(`{done} of {total} sets logged. Stopping early isn't failing — the session still counted, and I'll carry what you missed into the next one.`, v),
      nerd: window.t(`{done}/{total} working sets logged ({pct}% of planned volume). Enough to maintain stimulus; I'll rebalance the next {kind} accordingly.`, v),
    },
    bad: {
      coach: window.t(`Rough one — but you showed up and logged it, and that counts. We trim 5% off {kind} next time and rebuild bar speed. No quitting.`, v),
      calm: window.t(`That felt heavier than usual, and that's okay — sleep, stress and fuel all read into a session. Let's deload slightly next {kind} and reset.`, v),
      nerd: window.t(`Bar velocity down ~12% vs baseline, RPE overshot target by ~1.5 — reads like recovery debt. Recommend −5% load and an extra rest day before next {kind}.`, v),
    },
    skipped: {
      coach: window.t(`You called it on the {reason} — smart, not soft. Protecting a joint beats grinding through it. We reschedule and hit it fresh.`, v),
      calm: window.t(`Skipping for {reason} was the right call — listening to your body is training too. I've kept the volume; let's slot it later this week.`, v),
      nerd: window.t(`Missed session logged. {reason} flagged — pausing was the lower-risk option (injury cost far exceeds one session). Weekly target auto-adjusts.`, v),
    },
    skippedAuto: {
      coach: window.t(`This one got away — happens. What matters is the next one: the work goes back on the board and you show up for it.`, v),
      calm: window.t(`The day ended before this session happened — no stress, one missed day doesn't undo your progress. We simply pick it up from here.`, v),
      nerd: window.t(`Missed session logged automatically — the day ended with it untouched. One skip has a negligible effect on the block; the weekly target auto-adjusts.`, v),
    },
    recovery: {
      coach: window.t(`Recovery logged. Good — you can't grind every day. Mobility is part of the plan, not a day off. Back to work tomorrow.`, v),
      calm: window.t(`Lovely — recovery days are where the adaptation actually happens. Mobility and an easy walk is exactly right for today.`, v),
      nerd: window.t(`Active recovery complete. Z2 + mobility supports parasympathetic recovery between hard sessions — expect HRV to read higher tomorrow.`, v),
    },
    today: {
      coach: window.t(`{kind} day. {duration} minutes, no wasted sets. Every session is a brick in the wall — get to work.`, v),
      calm: window.t(`Your {kind} session is ready when you are — about {duration} minutes. Warm up well and we'll go.`, v),
      nerd: window.t(`Today: {kind}, ~{duration} min, target RPE 7.5. Volume's primed — execute.`, v),
    },
    planned: {
      coach: window.t(`On the board for {day}. Come in ready — glance at the openers tonight so there's no thinking on the day, just lifting.`, v),
      calm: window.t(`This one's coming up {day}. Nothing to do yet — keep eating and sleeping well and it'll be ready when you are.`, v),
      nerd: window.t(`Scheduled {day}. Load/volume set from current block periodization; I'll finalize working weights from your prior session's RPE.`, v),
    },
  };
  return lines[bucket][k];
}

function AITrainerNote({ persona, s }) {
  const note = aiSessionNote(persona && persona.key, s);
  return (
    <div style={{ marginBottom: 16 }}>
      <SectionHeader title={window.t('{name} says', { name: (persona && persona.name) || 'Trainer' })}/>
      <div style={{ marginTop: 10, display: 'flex', gap: 12, padding: 14, background: TT.ink, borderRadius: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 15, background: TT.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="sparkles" size={16} color={TT.ink}/>
        </div>
        <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, lineHeight: 1.55, color: '#fff', alignSelf: 'center' }}>
          {note}
        </div>
      </div>
    </div>
  );
}

// Default planned exercises per training type
const SESSION_SAMPLES = {
  Push: [
    { name: 'Barbell Bench Press', sets: 4, reps: 8, load: '75 kg' },
    { name: 'Incline DB Press', sets: 3, reps: 10, load: '22 kg' },
    { name: 'Cable Lateral Raise', sets: 3, reps: 15, load: '8 kg' },
    { name: 'Tricep Rope Pushdown', sets: 3, reps: 12, load: '25 kg' },
    { name: 'Overhead Extension', sets: 3, reps: 12, load: '22 kg' },
  ],
  Pull: [
    { name: 'Pull-up (Strict)', sets: 4, reps: 8, load: 'BW' },
    { name: 'Barbell Row', sets: 3, reps: 10, load: '70 kg' },
    { name: 'Lat Pulldown', sets: 3, reps: 12, load: '55 kg' },
    { name: 'Face Pull', sets: 3, reps: 15, load: '15 kg' },
    { name: 'EZ-bar Curl', sets: 3, reps: 12, load: '30 kg' },
  ],
  Legs: [
    { name: 'Back Squat', sets: 5, reps: 5, load: '100 kg' },
    { name: 'Romanian Deadlift', sets: 4, reps: 8, load: '80 kg' },
    { name: 'Leg Press', sets: 3, reps: 10, load: '140 kg' },
    { name: 'Walking Lunge', sets: 3, reps: 12, load: '16 kg' },
    { name: 'Standing Calf Raise', sets: 4, reps: 15, load: '60 kg' },
  ],
  'Full Body': [
    { name: 'Back Squat', sets: 4, reps: 6, load: '95 kg' },
    { name: 'Barbell Bench Press', sets: 4, reps: 8, load: '72.5 kg' },
    { name: 'Barbell Row', sets: 3, reps: 10, load: '70 kg' },
    { name: 'DB Shoulder Press', sets: 3, reps: 10, load: '20 kg' },
  ],
  Rest: [
    { name: 'Foam roll — full body', sets: 1, reps: '5 min', load: '—' },
    { name: 'Hip mobility flow', sets: 2, reps: '8 / side', load: 'BW' },
    { name: 'Easy walk (Z2)', sets: 1, reps: '20 min', load: 'Z2' },
  ],
};

// Larger swap pool per training type (used by the editor dropdowns)
const EXERCISE_POOL = {
  Push: ['Barbell Bench Press','Incline Barbell Press','Incline DB Press','Machine Chest Press','Weighted Dip','Push-up (weighted)','DB Shoulder Press','Arnold Press','Cable Lateral Raise','Pec Deck Fly','Tricep Rope Pushdown','Overhead Extension','Close-grip Bench'],
  Pull: ['Pull-up (Strict)','Lat Pulldown','Barbell Row','Pendlay Row','Chest-Supported Row','Seated Cable Row','T-bar Row','Face Pull','Rear Delt Fly','EZ-bar Curl','Hammer Curl','Incline DB Curl','Straight-arm Pulldown'],
  Legs: ['Back Squat','Front Squat','Hack Squat','Romanian Deadlift','Conventional Deadlift','Leg Press','Bulgarian Split Squat','Walking Lunge','Leg Extension','Lying Leg Curl','Seated Leg Curl','Standing Calf Raise','Hip Thrust'],
  'Full Body': ['Back Squat','Front Squat','Barbell Bench Press','Incline DB Press','Barbell Row','Lat Pulldown','Romanian Deadlift','DB Shoulder Press','Walking Lunge','Pull-up (Strict)','Hip Thrust','Farmer Carry'],
  Rest: ['Foam roll — full body','Hip mobility flow','Thoracic openers','Easy walk (Z2)','Yoga flow','Band stretch series','Light swim','Sauna + stretch'],
};

const RANDOM_OPT = '__random__';

// Map a live session exercise ({name, sets:[{kind,reps,kg}]}) to the compact
// display shape the list expects ({name, sets:<count>, reps, load}).
function liveExToDisplay(ex) {
  const sets = ex.sets || [];
  const work = sets.filter(st => (st.kind || '').toLowerCase() !== 'warm-up');
  const rep = work[0] || sets[0] || {};
  return {
    name: ex.name,
    sets: work.length || sets.length || (typeof ex.sets === 'number' ? ex.sets : 0),
    reps: rep.reps != null ? rep.reps : (ex.reps != null ? ex.reps : ''),
    load: rep.kg ? `${rep.kg} kg` : (ex.load || '—'),
    raw: ex, // full exercise (sets, note, catalog id) for the detail slideover
  };
}

// The object the exercise slideover renders. Real sessions pass their exercise
// straight through; the per-kind sample fallback has only a summary line, so
// hand that over instead of an empty sheet.
function exerciseDetailShape(row) {
  if (row.raw) return row.raw;
  const summary = `${row.sets} × ${row.reps}${row.load && row.load !== '—' ? ` · ${row.load}` : ''}`;
  return { name: row.name, tag: '', note: '', sets: [], plannedSummary: summary };
}

function SessionDetail({ session: s, go, persona, onClose, startEditing = false }) {
  const [mode, setMode] = React.useState(startEditing ? 'edit' : 'view');
  const done = s.status === 'done';
  const today = s.status === 'today';
  const planned = s.status === 'planned';
  const skipped = s.status === 'skipped';
  const isRest = s.kind === 'Rest';
  // Load the tapped session into the player before entering it (so it runs THIS
  // session, not the stale global). Falls back to today's workout if no id.
  const startSession = () => {
    onClose();
    (s.id ? window.__strideLoadSession(s.id) : Promise.resolve(window.STRIDE_ACTIVE_WORKOUT = null))
      .then(() => go('active-config')).catch(() => go('active-config'));
  };

  // Moving a session: the athlete picks the day (the old action silently shoved
  // it to "tomorrow" with nothing on screen saying where it landed). The bridge
  // refreshes the globals; closing re-renders onto fresh data.
  const moveSession = (isoDate) => {
    if (!s.id || !window.__strideSessionAction) { onClose(); return Promise.resolve(); }
    return window.__strideSessionAction(s.id, 'postpone', isoDate ? { date: isoDate } : {})
      .then(onClose).catch(onClose);
  };

  // "Do it again" vs "Do it now": has this exact training (same title) ever
  // been completed before, anywhere in the plan history?
  const doneBefore = [(window.STRIDE_WEEK_PLAN || [])]
    .concat((window.STRIDE_BLOCKS || []).map((b) => b.sessions || []))
    .flat()
    .some((x) => x.status === 'done' && x.title === s.title && x.id !== s.id);

  // Show THIS session's REAL exercises. If the summary already carries them
  // (today's workout), map them; otherwise load /sessions/{id}. Only fall back to
  // the kind sample if there's genuinely nothing to load.
  // NOTE: ALL hooks must run before any conditional return below — an early
  // return between hooks ("edit" mode) crashes React with a hooks-order error
  // (the original black-screen on "Edit").
  const [liveEx, setLiveEx] = React.useState(() =>
    (s.exercises && s.exercises.length) ? s.exercises.filter(e => e.section !== 'warmup').map(liveExToDisplay) : null
  );
  // Exercise slideover stacked on top of this sheet (tap a row in the list below).
  const [openEx, setOpenEx] = React.useState(null);
  const [movingOpen, setMovingOpen] = React.useState(false);
  React.useEffect(() => {
    if ((!s.exercises || !s.exercises.length) && s.id && window.__strideLoadSession) {
      // __strideLoadSession parks the session on STRIDE_ACTIVE_WORKOUT (that's what
      // the player runs) — browsing a session in Plan must NOT hijack a workout that
      // is in progress, so put the previous one back.
      const previous = window.STRIDE_ACTIVE_WORKOUT;
      window.__strideLoadSession(s.id)
        .then(() => {
          const w = window.STRIDE_ACTIVE_WORKOUT;
          if (w && w.exercises && w.exercises.length) setLiveEx(w.exercises.filter(e => e.section !== 'warmup').map(liveExToDisplay));
          window.STRIDE_ACTIVE_WORKOUT = previous;
        })
        .catch(() => { window.STRIDE_ACTIVE_WORKOUT = previous; });
    }
  }, [s.id]);

  // Editing = talking to the REAL coach (propose → confirm), scoped to THIS
  // session. The old SessionEditor/SessionChat were prototype mocks: fake
  // "sent to trainer" flows that never touched the API.
  if (mode === 'edit' || mode === 'chat') {
    return <SessionEditCoachChat session={s} persona={persona} onBack={() => setMode('view')}/>;
  }

  const exercises = liveEx || SESSION_SAMPLES[s.kind] || [];

  // How much of this session was actually logged (sets carry `done` from the API).
  const completion = window.strideCompletion(
    (liveEx && liveEx.length) ? { exercises: liveEx.map((r) => r.raw).filter(Boolean) } : (s.exercises ? s : null),
    null,
  );

  // Coach changes for THIS session: the live activity log (scoped by session id),
  // falling back to whatever the session object carries.
  const logged = (window.STRIDE_AI_LOG || []).filter((e) => s.id != null && e.sessionId === s.id);
  const changes = logged.length ? logged : (s.adjustments || []);
  // Which exercise a change is about — the coach names it in `target`/`text`,
  // sometimes shorter than the catalog name ("Bench press" → "Barbell Bench Press").
  const changedExercise = (a) => {
    const hay = `${a.target || ''} ${a.text || ''}`.toLowerCase();
    const target = String(a.target || '').toLowerCase().trim();
    return exercises.find((x) => {
      const name = String(x.name || '').toLowerCase();
      return name && (hay.includes(name) || (target.length > 4 && name.includes(target)));
    }) || null;
  };

  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Hero */}
      <div style={{
        borderRadius: 16, padding: 16, marginBottom: 14,
        background: done ? TT.ink : (today ? `linear-gradient(135deg, ${TT.ink}, #1a1a1a)` : TT.surface),
        border: (planned || skipped) ? `1px solid ${TT.line}` : 'none',
        borderLeft: skipped ? `3px solid ${TT.amber}` : undefined,
        color: (done || today) ? '#fff' : TT.ink,
        position: 'relative', overflow: 'hidden',
      }}>
        {(done || today) && (
          <div style={{ position: 'absolute', right: -20, top: -10, opacity: 0.12 }}>
            <StrideIcon name="dumbbell" size={120} color={TT.volt}/>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <Chip bg={(done || today) ? '#ffffff22' : TT.lineSoft} ink={(done || today) ? '#fff' : TT.ink2}>
            {s.kind}
          </Chip>
          {done && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: TT.volt }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: TT.green, display: 'grid', placeItems: 'center' }}>
                <StrideIcon name="check" size={11} color="#fff" strokeWidth={3.5}/>
              </span>
              Completed
            </span>
          )}
          {skipped && <Chip bg={TT.amber + '22'} ink={TT.amber} dot color={TT.amber}>Skipped</Chip>}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
          {s.day}{s.date ? ' · ' + s.date : ''}
        </div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1.15 }}>{s.title}</div>
        {!skipped && (
          <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${(done || today) ? '#ffffff22' : TT.lineSoft}` }}>
            <SessionStat label="Duration" value={`${s.duration} min`} dim={!done && !today}/>
            {!isRest && <SessionStat label={done ? 'Volume' : 'Target'} value={done ? `${(s.volume/1000).toFixed(1)}t` : window.t('{n} lifts', { n: exercises.length })} dim={!done && !today}/>}
            <SessionStat label={done ? 'Avg RPE' : 'Intensity'} value={done ? '7.4' : (isRest ? 'Z2' : 'RPE 7')} dim={!done && !today}/>
          </div>
        )}
      </div>

      {/* Ask coach about this session */}
      {(today || planned) && (
        <button onClick={() => setMode('chat')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer',
          background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, padding: '12px 14px', marginBottom: 16,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: TT.ink, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <StrideIcon name="chat" size={17} color={TT.volt}/>
          </div>
          <div style={{ flex: 1, textAlign: 'left', fontFamily: 'Inter', fontSize: 13, color: TT.ink3 }}>
            {window.t('Ask {name} to change something…', { name: persona.name })}
          </div>
          <StrideIcon name="chevR" size={18} color={TT.ink3}/>
        </button>
      )}

      {/* Skip reflection — only render what was actually logged. An auto-skip
          (nightly roll) has no reason/mood/note; show one honest line instead
          of a card of empty cells. */}
      {skipped && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="Why I skipped"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {(s.skipReason || s.mood) ? (
              <div style={{ display: 'flex' }}>
                <SkipCell label="Reason" value={s.skipReason || '—'}/>
                {s.mood && <div style={{ width: 1, background: TT.lineSoft }}/>}
                {s.mood && <SkipCell label="How I felt" value={s.mood}/>}
              </div>
            ) : (
              <div style={{ padding: '12px 14px', fontFamily: 'Inter', fontSize: 13, lineHeight: 1.55, color: TT.ink2 }}>
                {window.t('No reason was logged — the day ended and this session was skipped automatically.')}
              </div>
            )}
            {s.skipNote && (
              <div style={{ padding: '12px 14px', borderTop: `1px solid ${TT.lineSoft}`, fontFamily: 'Inter', fontSize: 13, lineHeight: 1.55, color: TT.ink2 }}>
                {s.skipNote}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Trainer response — varies by outcome */}
      <AITrainerNote persona={persona} s={{ ...s, completion }}/>

      {/* What the trainer changed for this session — tap a change to open the
          exercise it touched, so "swapped dips for push-ups" is one tap from the
          push-up detail instead of a hunt through the list. */}
      {changes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="What I changed"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {changes.map((a, i) => {
              const hit = changedExercise(a);
              return (
                <div key={i} role={hit ? 'button' : undefined} onClick={hit ? () => setOpenEx(exerciseDetailShape(hit)) : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderTop: i ? `1px solid ${TT.lineSoft}` : 'none', cursor: hit ? 'pointer' : 'default',
                  }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <StrideIcon name={a.icon || 'sliders'} size={14} color={TT.ink2}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink }}>{a.text}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: TT.ink3, marginTop: 3 }}>{a.note || a.why || a.when || ''}</div>
                  </div>
                  {hit && <StrideIcon name="chevR" size={16} color={TT.ink3}/>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise list */}
      {exercises.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title={isRest ? 'Recovery flow' : (skipped ? 'What you missed' : (done ? 'What you did' : "What's planned"))}/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {exercises.map((ex, i) => (
              <button key={i} onClick={() => setOpenEx(exerciseDetailShape(ex))} style={{
                width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderTop: i ? `1px solid ${TT.lineSoft}` : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, background: TT.lineSoft,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 12, color: TT.ink2,
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, marginTop: 2 }}>
                    {ex.sets} × {ex.reps}{ex.load && ex.load !== '—' ? ` · ${ex.load}` : ''}
                  </div>
                </div>
                {done && <StrideIcon name="check" size={14} color={TT.green} strokeWidth={3}/>}
                <StrideIcon name="chevR" size={16} color={TT.ink3}/>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions — two 50/50 secondary buttons on top, one full-width primary below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {today && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <StrideButton variant="ghost" icon="edit" style={{ flex: 1, minWidth: 0 }} onClick={() => setMode('edit')}>Edit</StrideButton>
              <StrideButton variant="ghost" icon="cal" style={{ flex: 1, minWidth: 0 }} onClick={() => setMovingOpen(true)}>Move</StrideButton>
            </div>
            <StrideButton variant="volt" icon="play" block onClick={startSession}>Start</StrideButton>
          </>
        )}
        {planned && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <StrideButton variant="ghost" icon="edit" style={{ flex: 1, minWidth: 0 }} onClick={() => setMode('edit')}>Edit</StrideButton>
              <StrideButton variant="ghost" icon="cal" style={{ flex: 1, minWidth: 0 }} onClick={() => setMovingOpen(true)}>Move</StrideButton>
            </div>
            <StrideButton variant="primary" icon="play" block onClick={startSession}>Start early</StrideButton>
          </>
        )}
        {done && (
          <div style={{ display: 'flex', gap: 8 }}>
            <StrideButton variant="ghost" style={{ flex: 1, minWidth: 0 }}>View summary</StrideButton>
            <StrideButton variant="primary" icon="plus" style={{ flex: 1, minWidth: 0 }}>Repeat</StrideButton>
          </div>
        )}
        {skipped && (
          <div style={{ display: 'flex', gap: 8 }}>
            <StrideButton variant="ghost" icon="cal" style={{ flex: 1, minWidth: 0 }} onClick={() => setMovingOpen(true)}>Reschedule</StrideButton>
            <StrideButton variant="primary" icon="play" style={{ flex: 1, minWidth: 0 }} onClick={startSession}>
              {doneBefore ? 'Do it again' : 'Do it now'}
            </StrideButton>
          </div>
        )}
      </div>

      {/* Exercise detail — a second sheet stacked over this one */}
      {openEx && (
        <Sheet title={openEx.name} onClose={() => setOpenEx(null)}>
          <ActiveExerciseDetail ex={openEx} setsLabel={done ? window.t('What you did') : (today ? window.t("Today's sets") : window.t('Planned sets'))}/>
        </Sheet>
      )}

      {/* Move to another day — pick the date instead of a silent "+1 day" */}
      {movingOpen && (
        <Sheet title={window.t('Move session')} onClose={() => setMovingOpen(false)}>
          <MoveSessionPicker
            currentDate={s.scheduledDate || null}
            onPick={(iso) => { setMovingOpen(false); moveSession(iso); }}
          />
        </Sheet>
      )}
    </div>
  );
}

// Pick the day a session moves to. Shows the next ten days with what's already
// scheduled on each day (so you don't stack two trainings by accident), plus a
// date field for anything further out.
function MoveSessionPicker({ currentDate, onPick }) {
  const pad2 = (n) => String(n).padStart(2, '0');
  const isoOf = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  const today = new Date();
  const todayIso = isoOf(today);
  const [custom, setCustom] = React.useState('');

  // Everything already on the calendar, so each day can say what's there.
  const scheduled = {};
  [(window.STRIDE_WEEK_PLAN || [])]
    .concat((window.STRIDE_BLOCKS || []).map((b) => b.sessions || []))
    .flat()
    .forEach((x) => {
      if (!x.scheduledDate || x.status === 'done' || x.status === 'skipped') return;
      if (!scheduled[x.scheduledDate]) scheduled[x.scheduledDate] = x;
    });

  const days = Array.from({ length: 10 }, (_, i) => {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const iso = isoOf(dt);
    const taken = scheduled[iso];
    return {
      iso, dt,
      label: i === 0 ? window.t('Today') : (i === 1 ? window.t('Tomorrow') : dt.toLocaleDateString(window.strideLocale(), { weekday: 'long' })),
      sub: dt.toLocaleDateString(window.strideLocale(), { day: 'numeric', month: 'long' }),
      busy: taken && taken.scheduledDate !== currentDate ? taken.title : null,
      isCurrent: iso === currentDate,
    };
  });

  return (
    <div style={{ padding: '4px 0 0' }}>
      <div style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
        {days.map((d, i) => (
          <button key={d.iso} disabled={d.isCurrent} onClick={() => onPick(d.iso)} style={{
            width: '100%', textAlign: 'left', border: 'none', background: 'none',
            cursor: d.isCurrent ? 'default' : 'pointer', opacity: d.isCurrent ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderTop: i ? `1px solid ${TT.lineSoft}` : 'none',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: TT.lineSoft, flexShrink: 0,
              display: 'grid', placeItems: 'center', alignContent: 'center',
            }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TT.ink, lineHeight: 1 }}>{d.dt.getDate()}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TT.ink }}>
                {d.label}{d.isCurrent ? ` · ${window.t('scheduled now')}` : ''}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: d.busy ? TT.amber : TT.ink3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {d.busy ? `${d.sub} · ${d.busy}` : d.sub}
              </div>
            </div>
            {!d.isCurrent && <StrideIcon name="chevR" size={16} color={TT.ink3}/>}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <SectionHeader title="Another date"/>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="date" value={custom} min={todayIso} onChange={(e) => setCustom(e.target.value)} style={{
            flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '11px 12px', borderRadius: 12,
            border: `1px solid ${TT.line}`, background: TT.surface, color: TT.ink,
            fontFamily: 'Inter', fontSize: 14, outline: 'none',
          }}/>
          <StrideButton variant="primary" style={{ flex: 'none', opacity: custom ? 1 : 0.5 }} onClick={() => custom && onPick(custom)}>Move</StrideButton>
        </div>
      </div>
    </div>
  );
}

// Styled native dropdown used across the editor
function EditSelect({ value, onChange, options, bold = true }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        width: '100%', padding: '11px 36px 11px 13px', borderRadius: 11,
        border: `1px solid ${TT.line}`, background: TT.surface, color: TT.ink,
        fontFamily: 'Archivo, sans-serif', fontWeight: bold ? 800 : 600, fontSize: 13.5,
        cursor: 'pointer', lineHeight: 1.2,
      }}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <StrideIcon name="chevD" size={16} color={TT.ink3}/>
      </div>
    </div>
  );
}

// Live session editing via the real coach: every request goes to the general
// coach conversation prefixed with which session is being edited (the backend
// resolves any session by title/date via session_ref tools), replies come back
// with proposal cards the athlete applies or dismisses.
function SessionEditCoachChat({ session: s, persona, onBack }) {
  const trainer = (persona && persona.name) || 'Coach';
  const isToday = s.status === 'today';
  const greeting = {
    who: 'ai',
    text: window.t('Tell me what to change in this session — I’ll stage it and you confirm. e.g. “swap dips for push-ups” or “make it shorter”.'),
  };
  const [messages, setMessages] = React.useState([greeting]);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typing]);

  const send = (text) => {
    const t = (text || input).trim();
    if (!t || !window.__strideCoach) return;
    setMessages((m) => [...m, { who: 'me', text: t }]);
    setInput('');
    setTyping(true);
    const scoped = window.t(isToday ? "[Editing TODAY's session: {title}] " : '[Editing session: {title}] ', { title: s.title }) + t;
    window.__strideCoach.send(scoped)
      .then((reply) => { setTyping(false); setMessages((m) => [...m, reply]); })
      .catch(() => { setTyping(false); setMessages((m) => [...m, { who: 'ai', text: window.t('Sorry — I couldn’t reach your coach just now.') }]); });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0 0' }}>
      <div onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 12, color: TT.ink2 }}>
        <StrideIcon name="arrowLeft" size={18} color={TT.ink2}/>
        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 700 }}>{window.t('Back to session')}</span>
      </div>
      <SectionHeader title={window.t('Edit with {name}', { name: trainer })}/>
      <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 16, padding: 12 }}>
        <div ref={scrollRef} style={{ maxHeight: '52vh', minHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {messages.map((m, i) => <ChatBubble key={i} m={m} onCard={() => {}}/>)}
          {typing && <ChatBubble m={{ who: 'ai', text: '…', typing: true }}/>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TT.bg, border: `1px solid ${TT.line}`, borderRadius: 999, padding: '5px 6px 5px 14px' }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={window.t('Ask {name} to change this session…', { name: trainer })}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 13.5, color: TT.ink, padding: '7px 0' }}/>
          <button onClick={() => send()} aria-label="Send" style={{ width: 36, height: 36, borderRadius: 999, background: TT.ink, border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <StrideIcon name="send" size={16} color="#fff"/>
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionEditor({ session: s, persona, go, onBack, onClose }) {
  const TYPES = ['Push', 'Pull', 'Legs', 'Full Body', 'Rest'];
  const trainerName = (persona && persona.name) || 'Coach';

  const [kind, setKind] = React.useState(TYPES.includes(s.kind) ? s.kind : 'Push');
  const [rows, setRows] = React.useState(() => (SESSION_SAMPLES[s.kind] || SESSION_SAMPLES.Push).map((e) => ({ ...e })));
  const [message, setMessage] = React.useState('');
  const [phase, setPhase] = React.useState('edit'); // edit | sent
  const isRest = kind === 'Rest';

  const pool = EXERCISE_POOL[kind] || [];
  const pickRandom = (exclude) => {
    const avail = pool.filter((n) => !exclude.includes(n));
    const src = avail.length ? avail : pool;
    return src[Math.floor(Math.random() * src.length)];
  };

  // Spot context — regeneration is built around where you're training.
  const [spots] = window.useStrideSpots();
  const editDate = new Date(2026, 4, 21);
  const spot = window.resolveScheduledSpot(spots, editDate);
  const [regenNote, setRegenNote] = React.useState(false);
  const regenerate = () => {
    const base = SESSION_SAMPLES[kind] || SESSION_SAMPLES.Push;
    const picked = [];
    setRows(base.map((t) => { const name = pickRandom(picked); picked.push(name); return { ...t, name }; }));
    setRegenNote(true);
  };

  const changeType = (next) => {
    setKind(next);
    setRows((SESSION_SAMPLES[next] || []).map((e) => ({ ...e })));
  };

  const swapRow = (i, value) => {
    setRows((prev) => {
      const used = prev.map((r) => r.name);
      const name = value === RANDOM_OPT ? pickRandom(used) : value;
      return prev.map((r, idx) => (idx === i ? { ...r, name } : r));
    });
  };

  const shuffleRow = (i) => {
    setRows((prev) => {
      const used = prev.map((r) => r.name);
      const name = pickRandom(used);
      return prev.map((r, idx) => (idx === i ? { ...r, name } : r));
    });
  };

  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const addRow = () => setRows((prev) => {
    const used = prev.map((r) => r.name);
    return [...prev, { name: pickRandom(used), sets: 3, reps: 10, load: '—' }];
  });

  const surpriseAll = () => setRows((prev) => {
    const picked = [];
    return prev.map((r) => {
      const name = pickRandom(picked);
      picked.push(name);
      return { ...r, name };
    });
  });

  const PROMPTS = [
    'Keep it under 45 min',
    'Go easier — shoulders are sore',
    'Add more volume',
    'Dumbbells only today',
    'Lower impact on my knees',
    'Make it more intense',
  ];
  const addPrompt = (p) => setMessage((m) => (m ? m.replace(/\s*$/, '') + ' · ' + p : p));

  const typeChanged = kind !== s.kind;

  // ---- Confirmation view ----
  if (phase === 'sent') {
    return (
      <div style={{ padding: '4px 0 0' }}>
        <div style={{ borderRadius: 16, padding: 18, marginBottom: 16, background: `linear-gradient(135deg, ${TT.ink}, #1a1a1a)`, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -16, top: -12, opacity: 0.12 }}>
            <StrideIcon name="sparkles" size={108} color={TT.volt}/>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 19, background: TT.volt, display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <StrideIcon name="check" size={20} color={TT.ink} strokeWidth={3}/>
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, lineHeight: 1.15 }}>Sent to {trainerName}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, opacity: 0.8, marginTop: 6, lineHeight: 1.5 }}>
            Your session is now a <b style={{ color: TT.volt }}>{kind}</b> day with {rows.length} {rows.length === 1 ? 'lift' : 'lifts'}. {trainerName} will fine-tune loads around your recent fatigue.
          </div>
        </div>

        <SectionHeader title="Summary"/>
        <div style={{ marginTop: 10, marginBottom: 16, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <StrideIcon name="sliders" size={15} color={TT.ink2}/>
            </div>
            <div style={{ flex: 1, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink }}>
              {typeChanged ? `${s.kind} → ${kind}` : `${kind} session kept`}
            </div>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: `1px solid ${TT.lineSoft}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 12, color: TT.ink2 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, marginTop: 2 }}>{r.sets} × {r.reps}</div>
              </div>
            </div>
          ))}
        </div>

        {message.trim() && (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader title={`Note to ${trainerName}`}/>
            <div style={{ marginTop: 10, background: TT.lineSoft, borderRadius: 14, padding: '13px 15px', fontFamily: 'Inter', fontSize: 13, color: TT.ink2, lineHeight: 1.5 }}>
              “{message.trim()}”
            </div>
          </div>
        )}

        <StrideButton variant="volt" block icon="check" onClick={onClose}>Done</StrideButton>
        <div style={{ height: 8 }}/>
      </div>
    );
  }

  // ---- Edit view ----
  return (
    <div style={{ padding: '4px 0 0' }}>
      <div onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 14, color: TT.ink2 }}>
        <StrideIcon name="arrowLeft" size={18} color={TT.ink2}/>
        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 700 }}>Back to session</span>
      </div>

      {/* Regenerate — rebuild the whole session from scratch */}
      <div style={{ background: TT.ink, borderRadius: 16, padding: 16, marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -16, top: -14, opacity: 0.12 }}>
          <StrideIcon name="sparkles" size={92} color={TT.volt}/>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff' }}>Regenerate session</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#ffffffb0', marginTop: 3, lineHeight: 1.45 }}>
            {spot ? <>Fresh {kind} build for <b style={{ color: TT.volt }}>{spot.name}</b> · {window.scheduleLabel(spot.schedule)}</> : `Fresh ${kind} build`}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <StrideButton variant="volt" icon="sparkles" style={{ flex: 1 }} onClick={regenerate}>Regenerate</StrideButton>
            <button onClick={() => { window.__strideLibTab = 'spots'; onClose(); go('library'); }} style={{
              padding: '0 14px', borderRadius: 12, cursor: 'pointer', border: '1px solid #ffffff33', background: '#ffffff14',
              color: '#fff', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5,
            }}>Change spot</button>
          </div>
          {regenNote && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, fontFamily: 'Inter', fontSize: 11.5, color: TT.volt }}>
              <StrideIcon name="check" size={13} color={TT.volt} strokeWidth={3}/> Rebuilt — review and tweak below.
            </div>
          )}
        </div>
      </div>

      {/* Training type */}
      <SectionHeader title="Training type"/>
      <div style={{ marginTop: 10, marginBottom: 8 }}>
        <EditSelect value={kind} onChange={changeType} options={TYPES.map((t) => ({ value: t, label: t }))}/>
      </div>
      {typeChanged && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'Inter', fontSize: 11.5, color: TT.ink3, marginBottom: 18 }}>
          <StrideIcon name="info" size={14} color={TT.ink3}/>
          Switched from {s.kind} — exercise list rebuilt below.
        </div>
      )}
      {!typeChanged && <div style={{ height: 10 }}/>}

      {/* Exercises */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionHeader title={isRest ? 'Recovery flow' : 'Exercises'}/>
        {!isRest && (
          <button onClick={surpriseAll} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: TT.accent,
          }}>
            <StrideIcon name="sparkles" size={14} color={TT.accent}/> Surprise me
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {rows.map((r, i) => {
          const options = [
            { value: RANDOM_OPT, label: '🎲  Random pick' },
            ...pool.map((n) => ({ value: n, label: n })),
            ...(pool.includes(r.name) ? [] : [{ value: r.name, label: r.name }]),
          ];
          return (
            <div key={i} style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 12, color: TT.ink2 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <EditSelect value={pool.includes(r.name) ? r.name : r.name} onChange={(v) => swapRow(i, v)} options={options}/>
                </div>
                <button onClick={() => shuffleRow(i)} title="Random swap" style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${TT.line}`, background: TT.surface, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <StrideIcon name="sparkles" size={16} color={TT.accent}/>
                </button>
                <button onClick={() => removeRow(i)} title="Remove" style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${TT.line}`, background: TT.surface, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <StrideIcon name="trash" size={16} color={TT.ink3}/>
                </button>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, marginTop: 8, paddingLeft: 36 }}>
                {r.sets} × {r.reps}{r.load && r.load !== '—' ? ` · ${r.load}` : ''}
              </div>
            </div>
          );
        })}
      </div>

      <StrideButton variant="ghost" block icon="plus" onClick={addRow}>Add exercise</StrideButton>

      {/* Message to trainer */}
      <div style={{ marginTop: 22 }}>
        <SectionHeader title={`Message to ${trainerName}`}/>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '12px 0' }}>
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => addPrompt(p)} style={{
              border: `1px solid ${TT.line}`, background: TT.surface, borderRadius: 999, padding: '7px 12px', cursor: 'pointer',
              fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: TT.ink2,
            }}>+ {p}</button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Tell ${trainerName} anything — “swap accessories for dumbbells, keep the big lifts heavy…”`}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '12px 14px',
            borderRadius: 12, border: `1px solid ${TT.line}`, background: TT.surface, color: TT.ink,
            fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, outline: 'none',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <StrideButton variant="ghost" style={{ flex: 1 }} onClick={onBack}>Cancel</StrideButton>
        <StrideButton variant="volt" icon="send" style={{ flex: 1.5 }} onClick={() => setPhase('sent')}>Save & send</StrideButton>
      </div>
      <div style={{ height: 10 }}/>
    </div>
  );
}

function SessionChat({ session: s, persona, onBack }) {
  const trainerName = (persona && persona.name) || 'Coach';
  const [spots] = window.useStrideSpots();
  const spot = spots.find((sp) => sp.isDefault) || spots[0];
  const listRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const [messages, setMessages] = React.useState(() => ([
    { who: 'ai', text: `This is your ${s.kind} session${spot ? ` at ${spot.name}` : ''}. Want me to change anything, or have a question about why it's built this way?` },
  ]));
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);

  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing]);

  const PROMPTS = [
    'Make it shorter',
    'Go easier today',
    'Swap the squats',
    'Why this exercise?',
    'Add more arms',
    'No barbell available',
  ];

  // Lightweight canned-coach reply engine — keyword matched.
  const buildReply = (text) => {
    const t = text.toLowerCase();
    if (/short|less time|quick|45|30 min|hurry/.test(t))
      return { text: `Done — I trimmed it to 45 minutes by cutting rest and dropping one accessory. The main lifts stay.`, change: 'Duration · 60 → 45 min' };
    if (/easy|easier|tired|low energy|sore|fatigue|drained/.test(t))
      return { text: `No problem. I pulled intensity back ~10% and swapped the heavy top sets for steadier working sets. Listen to your body today.`, change: 'Intensity · RPE 8 → RPE 6.5' };
    if (/squat/.test(t))
      return { text: `Swapped Back Squat for a Leg Press — same quad focus, easier on the lower back. Want a hack squat instead?`, change: 'Back Squat → Leg Press' };
    if (/barbell|no bar|dumbbell only|db only|home|no rack/.test(t))
      return { text: `Got it — I rebuilt the session with dumbbells and machines only, so it works without a barbell.`, change: 'Equipment · barbell-free variant' };
    if (/arm|bicep|tricep|curl/.test(t))
      return { text: `Added two arm finishers — EZ-bar curls and rope pushdowns, 3×12 each at the end.`, change: '+2 arm accessories' };
    if (/why|explain|reason|how come/.test(t))
      return { text: `The big compound goes first while you're fresh, then accessories target the muscles it under-hits. It lines up with your current strength block and recent volume.` };
    if (/knee|shoulder|back|injur|hurt|pain/.test(t))
      return { text: `Thanks for flagging that — I'll keep loading conservative and avoid aggravating positions. I've noted it for your coach too.`, change: 'Flagged to coach · load capped' };
    return { text: `Got it. I'll factor that in and tune the session around it — anything else you want me to adjust?` };
  };

  const send = (text) => {
    const msg = (text != null ? text : input).trim();
    if (!msg) return;
    setMessages((m) => [...m, { who: 'me', text: msg }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const r = buildReply(msg);
      setTyping(false);
      setMessages((m) => [...m, { who: 'ai', text: r.text, change: r.change }]);
    }, 950);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'min(70vh, 560px)', padding: '4px 0 0' }}>
      <div onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 12, color: TT.ink2 }}>
        <StrideIcon name="arrowLeft" size={18} color={TT.ink2}/>
        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 700 }}>Back to session</span>
      </div>

      {/* Thread */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 2 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.who === 'me' ? 'flex-end' : 'flex-start', gap: 6 }}>
            <div style={{
              maxWidth: '85%', padding: '10px 13px', borderRadius: 16,
              borderTopRightRadius: m.who === 'me' ? 4 : 16,
              borderTopLeftRadius: m.who === 'me' ? 16 : 4,
              background: m.who === 'me' ? TT.ink : TT.surface,
              color: m.who === 'me' ? '#fff' : TT.ink,
              border: m.who === 'me' ? 'none' : `1px solid ${TT.line}`,
              fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.45,
            }}>{m.who === 'me' ? m.text : window.renderCoachMarkdown(m.text)}</div>
            {m.change && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TT.volt, borderRadius: 10, padding: '7px 11px' }}>
                <StrideIcon name="check" size={13} color={TT.ink} strokeWidth={3}/>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, fontWeight: 700, color: TT.ink }}>{m.change}</span>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ alignSelf: 'flex-start', background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 16, borderTopLeftRadius: 4, padding: '12px 14px' }}>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {[0, 0.15, 0.3].map((d, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: TT.ink3, animation: `bob 1s ease-in-out ${d}s infinite` }}/>
              ))}
            </span>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '12px 0 10px', marginLeft: -2 }}>
        {PROMPTS.map((p) => (
          <button key={p} onClick={() => send(p)} style={{
            flexShrink: 0, border: `1px solid ${TT.line}`, background: TT.surface, borderRadius: 999,
            padding: '7px 12px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: TT.ink2, whiteSpace: 'nowrap',
          }}>{p}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, padding: '4px 4px 4px 14px' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Message ${trainerName}…`}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 14, color: TT.ink, padding: '10px 0' }}
        />
        <button onClick={() => send()} aria-label="Send" style={{
          width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: input.trim() ? TT.ink : TT.lineSoft, display: 'grid', placeItems: 'center',
        }}>
          <StrideIcon name="send" size={18} color={input.trim() ? '#fff' : TT.ink3}/>
        </button>
      </div>
      <div style={{ height: 6 }}/>
    </div>
  );
}

function SkipCell({ label, value }) {
  return (
    <div style={{ flex: 1, padding: '12px 14px' }}>
      <div style={{ fontFamily: 'Inter', fontSize: 10, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TT.ink, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function SessionStat({ label, value, dim }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 10, opacity: dim ? 0.55 : 0.65, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 17, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function PlanMonthView({ go, persona }) {
  // REAL calendar: every session across all blocks, placed by scheduled date.
  const now = new Date();
  const [monthStart, setMonthStart] = React.useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [openSession, setOpenSession] = React.useState(null);

  const byDate = {};
  (window.STRIDE_BLOCKS || []).forEach((b) => (b.sessions || []).forEach((s) => {
    if (s.scheduledDate) byDate[s.scheduledDate] = s;
  }));
  (window.STRIDE_WEEK_PLAN || []).forEach((s) => {
    if (s.scheduledDate && !byDate[s.scheduledDate]) byDate[s.scheduledDate] = s;
  });

  const y = monthStart.getFullYear(), m = monthStart.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstCol = (monthStart.getDay() + 6) % 7; // Monday-first column of the 1st
  const rows = Math.ceil((firstCol + daysInMonth) / 7);
  const isoOf = (d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Month stats — computed, never fabricated.
  const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const monthSessions = Object.keys(byDate).filter((k) => k.indexOf(monthPrefix) === 0).map((k) => byDate[k]);
  const trainable = monthSessions.filter((s) => s.kind !== 'Rest');
  const doneSessions = trainable.filter((s) => s.status === 'done');
  const volumeKg = doneSessions.reduce((sum, s) => sum + (s.volume || 0), 0);
  const avgDuration = doneSessions.length
    ? Math.round(doneSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / doneSessions.length)
    : null;

  // Directional page-turn: the incoming month slides in from the swipe side.
  const [dir, setDir] = React.useState(0);
  const page = (d) => { setDir(d); setMonthStart(new Date(y, m + d, 1)); };
  const swipe = useSwipeNav(() => page(-1), () => page(1));
  const monthLabel = monthStart.toLocaleDateString(window.strideLocale(), { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '0 20px' }} {...swipe}>
      {/* ‹ Month › header — chevrons + swipe both page */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <IconBtn icon="chevL" size={32} onClick={() => page(-1)}/>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TT.ink, textTransform: 'capitalize' }}>{monthLabel}</div>
        <IconBtn icon="chevR" size={32} onClick={() => page(1)}/>
      </div>

      <div key={`${y}-${m}`} style={{ animation: dir ? `${dir > 0 ? 'stridePageNext' : 'stridePagePrev'} .3s cubic-bezier(.22,.61,.36,1) both` : 'none' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: TT.ink3, textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {Array.from({ length: rows * 7 }, (_, i) => {
          const date = i - firstCol + 1;
          const inMonth = date >= 1 && date <= daysInMonth;
          const s = inMonth ? byDate[isoOf(date)] : null;
          const isToday = inMonth && isoOf(date) === todayIso;
          const done = !!s && s.status === 'done';
          const skipped = !!s && s.status === 'skipped';
          const planned = !!s && !done && !skipped && s.kind !== 'Rest';
          return (
            <div key={i} onClick={s ? () => setOpenSession(s) : undefined} style={{
              aspectRatio: '1 / 1.05',
              background: isToday ? TT.ink : (done ? TT.accent : (skipped ? TT.lineSoft : TT.surface)),
              border: planned && !isToday ? `1px dashed ${TT.line}` : (done || isToday ? 'none' : `1px solid ${TT.lineSoft}`),
              borderRadius: 10,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: '6px 7px',
              opacity: inMonth ? 1 : 0.3,
              cursor: s ? 'pointer' : 'default',
              color: isToday ? '#fff' : (done ? '#fff' : (skipped ? TT.ink3 : TT.ink2)),
            }}>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12 }}>{inMonth ? date : ''}</span>
              {done && <StrideIcon name="check" size={11} color="#fff" strokeWidth={3}/>}
              {skipped && <StrideIcon name="x" size={10} color={TT.ink3} strokeWidth={2.5}/>}
              {isToday && !done && <div style={{ width: 5, height: 5, borderRadius: 5, background: TT.volt, alignSelf: 'flex-end' }}/>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontFamily: 'Inter', fontSize: 11, color: TT.ink3, flexWrap: 'wrap' }}>
        <Legend color={TT.accent} label="Completed"/>
        <Legend color={TT.ink} label="Today"/>
        <Legend color={TT.surface} bordered label="Planned"/>
        <Legend color={TT.lineSoft} label="Skipped"/>
      </div>
      <div style={{ marginTop: 22 }}>
        <SectionHeader title="Month summary"/>
        {trainable.length === 0 ? (
          <Card style={{ marginTop: 10, padding: 18 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink3 }}>No sessions this month.</div>
          </Card>
        ) : (
          <Card style={{ marginTop: 10, padding: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14 }}>
              <BigStat label="Sessions" value={`${doneSessions.length} / ${trainable.length}`}/>
              <BigStat label="Total volume" value={volumeKg >= 1000 ? `${(volumeKg / 1000).toFixed(1)}t` : `${Math.round(volumeKg)} kg`}/>
              {avgDuration != null && <BigStat label="Avg duration" value={`${avgDuration} min`}/>}
            </div>
          </Card>
        )}
      </div>
      </div>

      {openSession && (
        <Sheet title={openSession.title} onClose={() => setOpenSession(null)}>
          <SessionDetail session={openSession} go={go} persona={persona} onClose={() => setOpenSession(null)}/>
        </Sheet>
      )}
    </div>
  );
}

function PlanBlockView({ go, persona }) {
  const blocks = window.STRIDE_BLOCKS || [];
  // Open a block's standalone detail page (the coach chat lives there, as a slide-over).
  const open = (b) => { window.__strideOpenBlockId = b.rawId; go('block-detail'); };

  const active = blocks.filter(b => b.status === 'active');
  const upcoming = blocks.filter(b => b.status === 'upcoming');
  const past = blocks.filter(b => b.status === 'done');

  return (
    <div style={{ padding: '0 20px' }}>
      {active.map(b => <ActiveBlockCard key={b.id} block={b} onOpen={() => open(b)}/>)}

      {upcoming.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <SectionHeader title="Upcoming"/>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(b => <BlockRow key={b.id} block={b} onOpen={() => open(b)}/>)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <SectionHeader title="Completed" right={<Chip bg={TT.lineSoft}>{past.length}</Chip>}/>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.slice().reverse().map(b => <BlockRow key={b.id} block={b} onOpen={() => open(b)} past/>)}
          </div>
        </div>
      )}

      <div style={{ paddingTop: 18 }}>
        <StrideButton variant="ghost" block icon="plus">Plan a new block</StrideButton>
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function blockStatusMeta(status) {
  if (status === 'active') return { label: 'Active', color: TT.accent };
  if (status === 'upcoming') return { label: 'Upcoming', color: TT.ink3 };
  return { label: 'Completed', color: TT.green };
}

function ActiveBlockCard({ block: b, onOpen }) {
  const pct = b.weekOf ? Math.round((b.weekOf / b.weeks) * 100) : 0;
  return (
    <Card onClick={onOpen} style={{ cursor: 'pointer', marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip bg={TT.accent + '18'} ink={TT.accent} dot color={TT.accent}>Active Block</Chip>
        <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TT.ink3, letterSpacing: 0.6 }}>{b.phase}</span>
      </div>
      <h2 style={{ margin: '10px 0 4px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: -0.5 }}>{b.name}</h2>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink3 }}>{window.t('{n} weeks', { n: b.weeks })} · {b.dates}{b.weekOf ? ' · ' + window.t('Week {w} of {total}', { w: b.weekOf, total: b.weeks }) : ''}</div>
      <div style={{ marginTop: 16, height: 8, borderRadius: 8, background: TT.lineSoft, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: TT.accent }}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
        {b.stats.map((s, i) => <BigStat key={i} label={s.label} value={s.value}/>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTop: `1px solid ${TT.lineSoft}` }}>
        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13, color: TT.ink }}>Open block</span>
        <StrideIcon name="chevR" size={20} color={TT.ink3}/>
      </div>
    </Card>
  );
}

function BlockRow({ block: b, onOpen, past }) {
  const meta = blockStatusMeta(b.status);
  return (
    <Card onClick={onOpen} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: (b.accent || TT.ink) + (past ? '22' : ''),
        backgroundColor: past ? undefined : b.accent || TT.ink,
        display: 'grid', placeItems: 'center',
      }}>
        <StrideIcon name={b.status === 'upcoming' ? 'cal' : past ? 'check' : 'flame'} size={20} color={past ? (b.accent || TT.ink) : '#fff'} strokeWidth={past ? 3 : 2}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TT.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{b.weeks} {b.weeks === 1 ? 'week' : 'weeks'} · {b.dates}</div>
      </div>
      <Chip bg={meta.color + '18'} ink={meta.color}>{meta.label}</Chip>
      <StrideIcon name="chevR" size={18} color={TT.ink3}/>
    </Card>
  );
}

// Standalone block-detail PAGE. The coach conversation isn't inline here — it's a
// slide-over opened from the "Edit this block with {coach}" CTA (or the header
// chat icon). The page itself shows the block overview, sessions and the applied
// change history.
function BlockDetailScreen({ go, persona }) {
  const [openSession, setOpenSession] = React.useState(null);
  const [chatOpen, setChatOpen] = React.useState(false);
  const trainer = (persona && persona.name) || 'Coach';
  // Derive from live globals each render so applied coach edits show immediately.
  const block = (window.STRIDE_BLOCKS || []).find((x) => x.rawId != null && x.rawId === window.__strideOpenBlockId);

  React.useEffect(() => { if (!block) go('plan'); }, []);
  if (!block) return null;

  const kicker = `${block.phase || ''}${block.weekOf ? ' · ' + window.t('Week {w} of {total}', { w: block.weekOf, total: block.weeks }) : ''}`;

  return (
    <Screen padded={false} style={{ display: 'flex', flexDirection: 'column' }}>
      <StrideHeader title={block.name} kicker={kicker} back onBack={() => go('plan')}
        right={<IconBtn icon="chat" onClick={() => setChatOpen(true)}/>}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 100px' }}>
        <BlockDetailBody block={block} trainer={trainer}
          onOpenSession={setOpenSession} onEditCoach={() => setChatOpen(true)}/>
      </div>

      {openSession && (
        <Sheet title={openSession.title} onClose={() => setOpenSession(null)}>
          <SessionDetail session={openSession} go={go} persona={persona} onClose={() => setOpenSession(null)}/>
        </Sheet>
      )}
      {chatOpen && (
        <Sheet title={window.t('Edit this block with {name}', { name: trainer })} onClose={() => setChatOpen(false)}>
          <BlockCoachChat block={block} trainer={trainer}/>
        </Sheet>
      )}
    </Screen>
  );
}

// Inner content of the block page: overview, sessions, the coach CTA, change history.
function BlockDetailBody({ block, trainer, onOpenSession, onEditCoach }) {
  // Re-derive (the parent may hold a ref from before a coach edit was applied).
  const b = (window.STRIDE_BLOCKS || []).find((x) => x.rawId != null && x.rawId === block.rawId) || block;
  const meta = blockStatusMeta(b.status);
  const pct = b.weekOf ? Math.round((b.weekOf / b.weeks) * 100) : (b.status === 'done' ? 100 : 0);
  const pending = (b.pending || []).length;

  return (
    <div>
      {/* Overview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Chip bg={meta.color + '18'} ink={meta.color} dot color={meta.color}>{meta.label}</Chip>
        <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: TT.ink3 }}>{b.phase}</span>
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink2, lineHeight: 1.5, marginBottom: 10 }}>{b.summary}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: TT.ink3 }}>{window.t('{n} weeks', { n: b.weeks })} · {b.dates}{b.weekOf ? ' · ' + window.t('Week {w} of {total}', { w: b.weekOf, total: b.weeks }) : ''}</div>
      {(b.status !== 'upcoming') && (
        <div style={{ marginTop: 12, height: 8, borderRadius: 8, background: TT.lineSoft, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: b.accent || TT.accent }}/>
        </div>
      )}
      {/* A finished block's stats ARE its results — give them their heading. */}
      {b.status === 'done' && (b.stats || []).length > 0 && (
        <div style={{ marginTop: 20 }}><SectionHeader title="Block results"/></div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
        {b.stats.map((s, i) => <BigStat key={i} label={s.label} value={s.value}/>)}
      </div>

      {/* What you asked for — the saved brief this plan was generated from */}
      {b.brief && (
        <div style={{ marginTop: 20 }}>
          <SectionHeader title="What you asked for"/>
          <div style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 16, padding: 14, marginTop: 8 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: TT.ink2 }}>
              {[b.brief.option && b.brief.option.split, (b.brief.option && b.brief.option.days_per_week) ? window.t('{d}× / week', { d: b.brief.option.days_per_week }) : null, (b.brief.option && b.brief.option.weeks) ? window.t('{n} weeks', { n: b.brief.option.weeks }) : null].filter(Boolean).join(' · ')}
            </div>
            {b.brief.goals && b.brief.goals.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {b.brief.goals.map((g, i) => <Chip key={i} bg={TT.lineSoft}>{g}</Chip>)}
              </div>
            )}
            {b.brief.note && (
              <div style={{ marginTop: 10, fontFamily: 'Inter', fontSize: 12.5, color: TT.ink2, fontStyle: 'italic', lineHeight: 1.5 }}>“{b.brief.note}”</div>
            )}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter', fontSize: 11, color: TT.ink3 }}>
              <span>{b.createdOn}</span>
              {b.brief.cost_eur != null && <span>{window.t('Generated for')} €{Number(b.brief.cost_eur).toFixed(4)}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Sessions */}
      <div style={{ marginTop: 20 }}>
        <SectionHeader title="Sessions" right={<Chip bg={TT.lineSoft}>{b.sessions.length}</Chip>}/>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {b.sessions.map((s, i) => <BlockSessionRow key={i} s={s} onOpen={() => onOpenSession(s)}/>)}
        </div>
      </div>

      {/* Edit the whole block with the coach — opens the conversation as a slide-over */}
      {b.rawId != null && (
        <button onClick={onEditCoach} style={{
          marginTop: 18, width: '100%', padding: '13px 16px', borderRadius: 14, background: TT.ink, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: '#fff',
        }}>
          <StrideIcon name="chat" size={17} color="#fff"/>
          {window.t('Edit this block with {name}', { name: trainer })}
          {pending > 0 && (
            <span style={{ background: TT.accent, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '1px 7px' }}>
              {window.t('{n} pending', { n: pending })}
            </span>
          )}
        </button>
      )}

      {/* Applied changes (history) */}
      <div style={{ marginTop: 22 }}>
        <SectionHeader title={window.t("{name}'s changes", { name: trainer })} right={<Chip bg={TT.lineSoft}>{b.changes.length}</Chip>}/>
        {b.changes.length === 0 ? (
          <div style={{ marginTop: 10, padding: '20px 16px', textAlign: 'center', background: TT.surface, border: `1px dashed ${TT.line}`, borderRadius: 14, fontFamily: 'Inter', fontSize: 12.5, color: TT.ink3 }}>
            No changes yet — this block hasn’t started.
          </div>
        ) : (
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {b.changes.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 14px', borderTop: i ? `1px solid ${TT.lineSoft}` : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <StrideIcon name={c.icon} size={15} color={TT.ink2}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink, lineHeight: 1.25 }}>{c.text}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginTop: 5 }}>{c.kind} · {c.target}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink2, lineHeight: 1.45, marginTop: 5 }}>{c.why}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: TT.ink3, marginTop: 6 }}>{c.when}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// A coach chat scoped to ONE block: prompts bulk-edit every session in it, each
// change staged as a proposal (Apply/Dismiss). Modelled on the main ChatScreen.
function BlockCoachChat({ block, trainer }) {
  const rawId = block.rawId;
  const greeting = { who: 'ai', text: window.t('Tell me how to change this block — I’ll apply it to every session. e.g. “always start with calisthenics first.”') };
  // Seed pending proposals (from /blocks) only as a fallback; once the real
  // conversation loads, its messages carry the same proposals inline (no dupes).
  const pendingMsgs = (block.pending || []).map((p) => ({ who: 'ai', text: '', proposals: [p] }));
  const [messages, setMessages] = React.useState(() => (pendingMsgs.length ? [greeting, ...pendingMsgs] : [greeting]));
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef(null);

  // Pull any prior conversation for this block once — it already includes the
  // pending proposals inline, so it REPLACES the fallback seed (avoids duplicates).
  React.useEffect(() => {
    if (!rawId || !(window.__strideCoach && window.__strideCoach.loadBlockChat)) return;
    window.__strideCoach.loadBlockChat(rawId)
      .then((res) => { if (res.messages && res.messages.length) setMessages(res.messages); })
      .catch(() => {});
  }, [rawId]);

  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typing]);

  const send = (text) => {
    const t = (text || input).trim();
    if (!t || !rawId || !window.__strideCoach) return;
    setMessages((m) => [...m, { who: 'me', text: t }]);
    setInput('');
    setTyping(true);
    window.__strideCoach.sendToBlock(rawId, t)
      .then((reply) => { setTyping(false); setMessages((m) => [...m, reply]); })
      .catch(() => { setTyping(false); setMessages((m) => [...m, { who: 'ai', text: window.t('Sorry — I couldn’t reach your coach just now.') }]); });
  };

  return (
    <div style={{ marginTop: 22 }}>
      <SectionHeader title={window.t('Edit this block with {name}', { name: trainer })}/>
      <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 16, padding: 12 }}>
        <div ref={scrollRef} style={{ maxHeight: '46vh', minHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          {messages.map((m, i) => <ChatBubble key={i} m={m} onCard={() => {}}/>)}
          {typing && <ChatBubble m={{ who: 'ai', text: '…', typing: true }}/>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TT.bg, border: `1px solid ${TT.line}`, borderRadius: 999, padding: '5px 6px 5px 14px' }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={window.t('Ask {name} to change this block…', { name: trainer })}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 13.5, color: TT.ink, padding: '7px 0' }}/>
          <button onClick={() => send()} aria-label="Send" style={{ width: 36, height: 36, borderRadius: 999, background: TT.ink, border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <StrideIcon name="send" size={16} color="#fff"/>
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockSessionRow({ s, onOpen }) {
  const statusColor = s.status === 'done' ? TT.green : s.status === 'skipped' ? TT.amber : s.status === 'today' ? TT.accent : TT.ink3;
  const statusLabel = s.status === 'today' ? 'Today' : s.status.charAt(0).toUpperCase() + s.status.slice(1);
  const rest = s.kind === 'Rest';
  return (
    <button onClick={onOpen} style={{
      textAlign: 'left', cursor: 'pointer', border: `1px solid ${TT.line}`,
      background: TT.surface, borderRadius: 14, padding: '11px 13px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 46, padding: '6px 0', borderRadius: 11, flexShrink: 0,
        border: rest ? `1px dashed ${TT.line}` : `1px solid ${TT.line}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>{s.day}</span>
        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 18, color: TT.ink }}>{s.date}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TT.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TT.ink3, marginTop: 2 }}>
          {s.status === 'done' && !rest ? `${(s.volume/1000).toFixed(1)}k kg · ${s.duration} min` : rest ? `${s.duration} min` : `${s.kind} · ~${s.duration} min`}
        </div>
      </div>
      <Chip bg={statusColor + '18'} ink={statusColor}>{statusLabel}</Chip>
    </button>
  );
}

function Legend({ color, label, bordered }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: color, border: bordered ? `1px dashed ${TT.line}` : 'none' }}/>
      {label}
    </div>
  );
}
function BigStat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 24, color: TT.ink, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, fontWeight: 600, marginTop: 2, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// WEIGHT
// ────────────────────────────────────────────────────────────────────
function WeightScreen({ go }) {
  const u = window.STRIDE_USER || {};
  // Guard EVERYTHING against an empty history — a fresh account must render the
  // empty state, not crash the tree (black screen).
  const h = window.STRIDE_WEIGHT_HISTORY || [];
  const hasData = h.length > 0;
  const last = hasData ? h[h.length - 1].kg : null;
  const first = hasData ? h[0].kg : null;
  const change = hasData ? (last - first).toFixed(1) : null;
  const goalKg = u.goalWeightKg || null;
  const [showLog, setShowLog] = React.useState(() => {
    // Deep-linked from the morning weigh-in notification tap → open the log sheet
    // straight away (bridge.js sets the flag, routes here via window.__strideGo).
    if (window.__strideOpenWeightLog) { window.__strideOpenWeightLog = false; return true; }
    return false;
  });
  const [val, setVal] = React.useState(() => (hasData ? String(last) : ''));
  const [saving, setSaving] = React.useState(false);
  // Morning weigh-in reminder — daily local notification at 6:00, toggleable.
  const [remindOn, setRemindOn] = React.useState(() => {
    try { return localStorage.getItem('stride_weigh_reminder') === '1'; } catch (e) { return false; }
  });
  const nativeLN = !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications);
  const toggleReminder = (on) => {
    setRemindOn(on);
    if (window.__strideWeighReminder) {
      window.__strideWeighReminder(on).then((r) => { if (on && r && !r.ok) setRemindOn(false); });
    }
  };
  const save = () => {
    const kg = parseFloat(String(val).replace(',', '.'));
    if (!kg || kg < 20 || kg > 400) return;
    if (!window.__strideLogWeight) { setShowLog(false); return; }
    setSaving(true);
    window.__strideLogWeight(kg)
      .then(() => { setSaving(false); setShowLog(false); })
      .catch(() => setSaving(false));
  };
  const todayLabel = new Date().toLocaleDateString(window.strideLocale(), { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <Screen>
      <StrideHeader title="Weight" kicker={goalKg ? `${window.t('Goal:')} ${goalKg} kg` : undefined} back onBack={() => go('profile')} right={<IconBtn icon="plus" onClick={() => setShowLog(true)}/>}/>
      <div style={{ padding: '0 20px' }}>
        {!hasData && (
          <Card style={{ padding: 22, textAlign: 'center' }}>
            <div style={{ fontSize: 34 }}>⚖️</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 18, color: TT.ink, marginTop: 8 }}>No weight logged yet</div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink3, marginTop: 6, lineHeight: 1.5 }}>Log your first weigh-in and the trend chart starts here.</div>
            <div style={{ marginTop: 16 }}>
              <StrideButton variant="primary" block icon="plus" onClick={() => setShowLog(true)}>Log weight</StrideButton>
            </div>
          </Card>
        )}
        {hasData && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 56, lineHeight: 0.9, letterSpacing: -2, color: TT.ink }}>{last}<span style={{ fontSize: 22, color: TT.ink3, marginLeft: 4 }}>kg</span></div>
              {h.length > 1 && (
                <div style={{ fontFamily: 'Inter', fontSize: 13, color: parseFloat(change) <= 0 ? TT.green : TT.rose, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <StrideIcon name={parseFloat(change) <= 0 ? 'arrowDown' : 'arrowUp'} size={14} color={parseFloat(change) <= 0 ? TT.green : TT.rose}/>
                  {change} kg {window.t('since first entry')}
                </div>
              )}
            </div>
            {goalKg != null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>To goal</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: TT.ink }}>{(last - goalKg) > 0 ? '−' : '+'}{Math.abs(last - goalKg).toFixed(1)} kg</div>
              </div>
            )}
          </div>
          {h.length > 1 && <StrideLineChart data={h} w={340} h={150} accent={TT.ink}/>}
          {h.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'Inter', fontSize: 10, color: TT.ink3 }}>
              <span>{h[0].d}</span>
              <span>{h[Math.floor(h.length/2)].d}</span>
              <span>Today</span>
            </div>
          )}
        </Card>
        )}

        {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TT.ink3, letterSpacing: 0.6, textTransform: 'uppercase' }}>Entries</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{h.length}</div>
          </Card>
          {u.bodyFat != null && (
            <Card style={{ padding: 14 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TT.ink3, letterSpacing: 0.6, textTransform: 'uppercase' }}>Body fat</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{u.bodyFat}%</div>
            </Card>
          )}
          {u.height > 0 && (
            <Card style={{ padding: 14 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TT.ink3, letterSpacing: 0.6, textTransform: 'uppercase' }}>BMI</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{(last / ((u.height/100) ** 2)).toFixed(1)}</div>
            </Card>
          )}
        </div>
        )}

        {/* Morning weigh-in reminder */}
        <div style={{ marginTop: 12 }}>
          <Card style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <StrideIcon name="bolt" size={18} color={TT.ink2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14.5, color: TT.ink }}>Morning weigh-in reminder</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{nativeLN ? 'Every day at 6:00' : 'Available on your phone'}</div>
            </div>
            <StrideToggle on={remindOn} onChange={toggleReminder}/>
          </Card>
        </div>

        {hasData && (
        <div style={{ marginTop: 20 }}>
          <SectionHeader title="Log"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, overflow: 'hidden' }}>
            {h.slice().reverse().slice(0, 6).map((row, i) => {
              const prev = h[h.length - 1 - i - 1];
              const delta = prev ? (row.kg - prev.kg).toFixed(1) : null;
              const isUp = delta && parseFloat(delta) > 0;
              return (
                <div key={i} style={{
                  padding: '13px 16px',
                  borderTop: i ? `1px solid ${TT.lineSoft}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, color: TT.ink2 }}>{row.d}</div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 16 }}>{row.kg} kg</div>
                  {delta && (
                    <div style={{ width: 56, textAlign: 'right', fontFamily: 'Inter', fontWeight: 700, fontSize: 11, color: isUp ? TT.rose : TT.green }}>
                      {isUp ? '+' : ''}{delta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        <div style={{ height: 24 }}/>
      </div>

      {/* Log weight sheet */}
      {showLog && (
        <Sheet onClose={() => setShowLog(false)} title="Log weight">
          <div style={{ padding: '8px 4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>{window.t('Today')} · {todayLabel}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
              <input value={val} onChange={e => setVal(e.target.value)} inputMode="decimal" placeholder="0.0" style={{
                width: 210, textAlign: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 900,
                fontSize: 64, color: TT.ink, border: 'none', outline: 'none', background: 'transparent',
                letterSpacing: -2,
              }}/>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: TT.ink3 }}>kg</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Chip bg={TT.lineSoft}>Morning</Chip>
              <Chip bg={TT.lineSoft}>Fasted</Chip>
              <Chip bg={TT.lineSoft}>Post-workout</Chip>
            </div>
            <div style={{ width: '100%', marginTop: 20 }}>
              <StrideButton variant="primary" block onClick={save}>{saving ? 'Saving…' : 'Save'}</StrideButton>
            </div>
          </div>
        </Sheet>
      )}
    </Screen>
  );
}

// Notification settings sheet — the single place both notification types live.
function NotificationsBody() {
  const nativeLN = !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications);
  const read = (k) => { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } };
  const [weighOn, setWeighOn] = React.useState(() => read('stride_weigh_reminder'));
  const [pokesOn, setPokesOn] = React.useState(() => read('stride_coach_pokes'));

  const toggleWeigh = (on) => {
    setWeighOn(on);
    if (window.__strideWeighReminder) {
      window.__strideWeighReminder(on).then((r) => { if (on && r && !r.ok) setWeighOn(false); });
    }
  };
  const togglePokes = (on) => {
    setPokesOn(on);
    try { localStorage.setItem('stride_coach_pokes', on ? '1' : '0'); } catch (e) {}
    if (window.__strideSchedulePokes) {
      window.__strideSchedulePokes().then((r) => { if (on && r && !r.ok && r.reason === 'denied') setPokesOn(false); });
    }
  };

  const RowT = ({ icon, label, sub, on, onChange }) => (
    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${TT.lineSoft}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <StrideIcon name={icon} size={18} color={TT.ink2}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14.5, color: TT.ink }}>{label}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{sub}</div>
      </div>
      <StrideToggle on={on} onChange={onChange}/>
    </div>
  );

  return (
    <div style={{ padding: '4px 0 8px' }}>
      <div style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 16, overflow: 'hidden' }}>
        <RowT icon="scale" label="Morning weigh-in reminder" sub="Every day at 6:00" on={weighOn} onChange={toggleWeigh}/>
        <RowT icon="sparkles" label="Coach pokes" sub="1–4 a day · based on your day, from your coach" on={pokesOn} onChange={togglePokes}/>
      </div>
      {!nativeLN && (
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 12, lineHeight: 1.5 }}>
          Notifications are delivered on your phone — toggles here only save the preference.
        </div>
      )}
    </div>
  );
}

// Reusable bottom sheet
function Sheet({ title, children, onClose }) {
  const overlayRef = React.useRef(null);
  const panelRef = React.useRef(null);
  // Scroll containment: the page behind must NOT scroll while the sheet is open.
  // Touches on the dark backdrop, or overscroll past the panel's own bounds, would
  // otherwise chain through to the screen underneath (looks like the sheet floats
  // over scrolling content). `overscroll-behavior: contain` stops the in-panel
  // chaining; a non-passive touchmove guard blocks any scroll that starts on the
  // backdrop (React's onTouchMove is passive, so preventDefault there is a no-op).
  React.useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return undefined;
    const block = (e) => {
      const panel = panelRef.current;
      if (!panel || !panel.contains(e.target)) e.preventDefault();
    };
    overlay.addEventListener('touchmove', block, { passive: false });
    return () => overlay.removeEventListener('touchmove', block);
  }, []);
  return (
    <div ref={overlayRef} style={{
      position: window.STRIDE_NATIVE ? 'fixed' : 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.45)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      touchAction: 'none', // no scroll gestures on the backdrop
    }} onClick={onClose}>
      <div ref={panelRef} onClick={e => e.stopPropagation()} style={{
        background: TT.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        // Scroll INSIDE the sheet so its background always covers the content, and
        // clear the home-indicator with the real safe-area inset on native.
        padding: window.STRIDE_NATIVE ? '14px 22px calc(28px + env(safe-area-inset-bottom))' : '14px 22px 32px',
        maxHeight: '85%', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain', touchAction: 'pan-y', // scroll stays inside the panel
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 4, background: TT.line, margin: '0 auto 12px' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 18 }}>{title}</h3>
          <IconBtn icon="close" size={32} onClick={onClose}/>
        </div>
        {children}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// PROFILE / SETTINGS (combined)
// ────────────────────────────────────────────────────────────────────
function ProfileScreen({ go, persona, setPersona }) {
  const u = window.STRIDE_USER;
  const personas = window.STRIDE_AI_PERSONAS;
  const prefs = window.useStridePrefs();
  const [spots] = window.useStrideSpots();
  const defaultSpot = spots.find((s) => s.isDefault) || spots[0];
  // Training preferences (setup) — surfaced + editable, persisted to the server.
  const setup = window.STRIDE_SETUP || {};
  const [setupOpen, setSetupOpen] = React.useState(false);
  const saveSetup = (patch) => Promise.resolve(window.__stridePatchProfile && window.__stridePatchProfile(patch))
    .then(() => { if (window.__strideRefresh) window.__strideRefresh(); setSetupOpen(false); });
  const setupCount = (setup.trainingStyle || []).length;
  const [notesOpen, setNotesOpen] = React.useState(() => {
    if (window.__strideOpenNotes) { window.__strideOpenNotes = false; return true; }
    return false;
  });
  // Personal notes ARE the coach's standing instructions, so they live on the
  // profile (preferences.notes) — the coach reads them when writing plans, chat
  // replies and pokes. localStorage is only an offline mirror; a note left there
  // by an older build gets pushed up on the next save.
  const [notes, setNotes] = React.useState(() => {
    if (setup.notes) return setup.notes;
    try { return localStorage.getItem('stride_coach_notes') || ''; } catch (e) { return ''; }
  });
  const saveNotes = (val) => {
    setNotes(val);
    try { localStorage.setItem('stride_coach_notes', val); } catch (e) {}
    return Promise.resolve(window.__stridePatchProfile && window.__stridePatchProfile({ notes: val }))
      .then(() => { if (window.__strideRefresh) window.__strideRefresh(); });
  };
  const notesPreview = notes.trim() ? notes.trim().replace(/\s+/g, ' ').slice(0, 38) + (notes.trim().length > 38 ? '…' : '') : 'Tell your coach what to keep in mind';
  const trainer = (persona && persona.name) || 'Coach';
  const { lang } = window.useStrideI18n(); // 'en' | 'sk' — backed by the profile
  // Live counts for the tracking rows (were hardcoded demo values).
  const goalsCount = (window.STRIDE_GOALS || []).length;
  const injuriesList = window.STRIDE_INJURIES || [];
  // Personal records sheet
  const [prsOpen, setPrsOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [prs, setPrs] = React.useState(() => window.STRIDE_PRS || []);
  const [prAdding, setPrAdding] = React.useState(false);
  const savePr = (pr) => window.__strideSavePr(pr).then(() => { setPrs(window.STRIDE_PRS || []); setPrAdding(false); });
  const deletePr = (id) => window.__strideDeletePr(id).then(() => setPrs(window.STRIDE_PRS || []));
  const injActive = injuriesList.filter(i => /active/i.test(i.status || '')).length;
  const injMonitor = injuriesList.filter(i => /monitor/i.test(i.status || '')).length;
  return (
    <Screen>
      <StrideHeader title="You" right={<div style={{ display: 'flex', gap: 8 }}><IconBtn icon="edit"/><IconBtn icon="settings" onClick={() => {}}/></div>}/>
      <div style={{ padding: '0 20px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${TT.accent}, #FFA88A)`, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 26 }}>{u.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22 }}>{u.name}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3 }}>{u.handle} · Member since {u.joined}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${TT.lineSoft}` }}>
            <BigStat label="Sessions" value={u.totalSessions}/>
            <BigStat label="Hours" value={u.totalHours}/>
            <BigStat label="Streak" value={`${u.streakDays}d`}/>
          </div>
        </Card>

        {/* AI personality */}
        <div style={{ marginTop: 22 }}>
          <SectionHeader title="AI coach"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, overflow: 'hidden' }}>
            <div onClick={() => go('ai-coach')} style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: TT.ink, display: 'grid', placeItems: 'center', fontSize: 19 }}>
                {persona.key === 'nerd' ? '📊' : persona.key === 'coach' ? '🔥' : '🌿'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TT.ink }}>AI coach settings</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{persona.name} · {persona.blurb}</div>
              </div>
              <StrideIcon name="chevR" size={18} color={TT.ink3}/>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 22 }}>
          <SectionHeader title="Setup"/>
          <div style={{ marginTop: 10, marginBottom: 18, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, overflow: 'hidden' }}>
            <Row icon="sliders" label={window.t('Training preferences')} sub={setupCount ? window.t('{n} styles', { n: setupCount }) + (setup.daysPerWeek ? ' · ' + window.t('{d}× / week', { d: setup.daysPerWeek }) : '') : window.t('Styles, days, experience, notes')} onClick={() => setSetupOpen(true)}/>
          </div>

          <SectionHeader title="Tracking"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, overflow: 'hidden' }}>
            <Row icon="scale" label="Weight" sub={u.weightKg ? `${u.weightKg} kg` : window.t('Log your weight')} onClick={() => go('weight')}/>
            <Row icon="target" label="Goals" sub={goalsCount ? window.t('{n} active', { n: goalsCount }) : window.t('Set your first goal')} onClick={() => go('goals')}/>
            <Row icon="pin" label="Workout spots" sub={defaultSpot ? `${spots.length} saved · ${defaultSpot.name} (default)` : 'Add your training locations'} onClick={() => { window.__strideLibTab = 'spots'; go('library'); }}/>
            <Row icon="bandage" label="Injury log" sub={(injActive + injMonitor) ? window.t('{a} active · {m} monitoring', { a: injActive, m: injMonitor }) : window.t('Nothing flagged')} onClick={() => go('injuries')}/>
            <Row icon="trend" label="Personal records" sub={prs.length ? window.t('{n} logged', { n: prs.length }) : window.t('Log your current bests')} onClick={() => setPrsOpen(true)}/>
            <Row icon="edit" label="Personal notes" sub={notesPreview} onClick={() => setNotesOpen(true)}/>
          </div>
          <div style={{ height: 14 }}/>
          <SectionHeader title="Display"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, overflow: 'hidden' }}>
            <ToggleRow icon="bolt" label="Show RPE" sub="Rate of perceived exertion on sessions"
              on={prefs.showRpe} onChange={(v) => window.setStridePref('showRpe', v)}/>
            <ToggleRow icon="dumbbell" label="Show training volume" sub="Total tonnage lifted per session" last
              on={prefs.showVolume} onChange={(v) => window.setStridePref('showVolume', v)}/>
          </div>
          <div style={{ height: 14 }}/>
          <SectionHeader title="App"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${TT.lineSoft}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: TT.lineSoft, display: 'grid', placeItems: 'center' }}>
                <StrideIcon name="chat" size={18} color={TT.ink2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TT.ink }}>Language</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{lang === 'sk' ? 'Slovenčina' : 'English'}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: TT.lineSoft }}>
                {['en', 'sk'].map((v) => (
                  <button key={v} onClick={() => window.setStrideLanguage(v)} style={{
                    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: lang === v ? TT.ink : 'transparent',
                    color: lang === v ? '#fff' : TT.ink2,
                    fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
                  }}>{v.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <Row icon="sparkles" label={window.t('AI model')} sub={(() => {
              const c = (window.STRIDE_AI && window.STRIDE_AI.connection) || {};
              if (!c.provider || c.provider === 'free') return window.t('Free built-in');
              return c.provider + (c.model ? ' · ' + c.model : '');
            })()} onClick={() => go('ai-connect')}/>
            <Row icon="settings" label="Units & equipment" sub="Kg · Metric"/>
            <Row icon="bolt" label="Notifications" onClick={() => setNotifOpen(true)}/>
            <Row icon="heart" label="Health & Apple Watch" sub="Connected"/>
            <Row icon="info" label="About Stride"/>
          </div>

          <button
            onClick={() => { if (window.confirm(window.t('Log out of Stride?'))) window.__strideLogout && window.__strideLogout(); }}
            style={{
              width: '100%', marginTop: 18, padding: '14px', borderRadius: 14,
              border: `1px solid ${TT.line}`, background: TT.surface, cursor: 'pointer',
              fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: '#e11d48',
            }}>
            {window.t('Log out')}
          </button>

          {/* TEMP/TEST: reset the account to the empty setup state, then log out. */}
          <button
            onClick={() => { if (window.confirm(window.t('Reset app to setup? This erases all your data.'))) window.__strideResetApp && window.__strideResetApp(); }}
            style={{
              width: '100%', marginTop: 10, padding: '12px', borderRadius: 14,
              border: `1px dashed ${TT.line}`, background: 'transparent', cursor: 'pointer',
              fontFamily: 'Inter', fontWeight: 700, fontSize: 12.5, color: TT.ink3,
            }}>
            {window.t('Reset app (test)')}
          </button>
        </div>

        <div style={{ height: 24 }}/>
      </div>

      {notesOpen && (
        <Sheet title="Personal notes" onClose={() => setNotesOpen(false)}>
          <CoachNotesBody notes={notes} onSave={saveNotes} onClose={() => setNotesOpen(false)} trainer={trainer}/>
        </Sheet>
      )}

      {notifOpen && (
        <Sheet title="Notifications" onClose={() => setNotifOpen(false)}>
          <NotificationsBody/>
        </Sheet>
      )}

      {setupOpen && (
        <Sheet title={window.t('Training preferences')} onClose={() => setSetupOpen(false)}>
          <SetupBody setup={setup} onSave={saveSetup} onClose={() => setSetupOpen(false)}/>
        </Sheet>
      )}

      {prsOpen && (
        <Sheet title="Personal records" onClose={() => { setPrsOpen(false); setPrAdding(false); }}>
          {prAdding ? (
            <PrEditor onSave={savePr} onCancel={() => setPrAdding(false)}/>
          ) : (
            <div>
              {prs.length > 0 ? (
                <div style={{ background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                  {prs.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: i ? `1px solid ${TT.lineSoft}` : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TT.ink }}>{p.label}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{p.display}{p.achieved_on ? ' · ' + p.achieved_on : ''}{p.form_quality ? ' · form ' + p.form_quality + '/5' : ''}</div>
                      </div>
                      <button onClick={() => deletePr(p.id)} aria-label="Delete record" style={{ border: 'none', background: 'none', cursor: 'pointer', color: TT.ink3, padding: 4 }}>
                        <StrideIcon name="trash" size={16} color={TT.ink3}/>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: TT.lineSoft, borderRadius: 12, padding: 16, marginBottom: 14, fontFamily: 'Inter', fontSize: 13, color: TT.ink3, textAlign: 'center' }}>
                  No records yet. Log your current bests so your coach programs the right loads.
                </div>
              )}
              <StrideButton variant="primary" icon="plus" block onClick={() => setPrAdding(true)}>Add a record</StrideButton>
            </div>
          )}
        </Sheet>
      )}
    </Screen>
  );
}

// Edit the training preferences captured at onboarding — persists to the server.
function SetupBody({ setup, onSave, onClose }) {
  const STYLES = [
    { key: 'heavy', label: 'Heavy weights' }, { key: 'hypertrophy', label: 'Muscle building' },
    { key: 'calisthenics', label: 'Calisthenics' }, { key: 'street', label: 'Street lifting' },
    { key: 'sprints', label: 'Sprints' }, { key: 'running', label: 'Running' },
    { key: 'hiit', label: 'HIIT' }, { key: 'conditioning', label: 'Conditioning' },
    { key: 'mobility', label: 'Mobility' }, { key: 'flexibility', label: 'Flexibility' },
  ];
  const EXP = [{ y: 0, label: 'Just starting' }, { y: 2, label: '1–3 yr' }, { y: 4, label: '3–5 yr' }, { y: 7, label: '5+ yr' }];
  const DAYS = [2, 3, 4, 5, 6];
  const [styles, setStyles] = React.useState(setup.trainingStyle || []);
  const [days, setDays] = React.useState(setup.daysPerWeek != null ? setup.daysPerWeek : null);
  const [years, setYears] = React.useState(setup.yearsTraining != null ? setup.yearsTraining : null);
  const [warmup, setWarmup] = React.useState(setup.warmupStyle || 'per_exercise');
  const [bio, setBio] = React.useState(setup.bio || '');
  const [notes, setNotes] = React.useState(setup.notes || '');
  const [saving, setSaving] = React.useState(false);
  const toggle = (k) => setStyles((s) => s.includes(k) ? s.filter((x) => x !== k) : [...s, k]);
  const save = () => {
    setSaving(true);
    // Warm-up style drives how sessions are BUILT; offer to restructure today's session in place.
    const changed = warmup !== (setup.warmupStyle || 'per_exercise');
    const applyToday = changed && window.STRIDE_TODAYS_WORKOUT && window.STRIDE_TODAYS_WORKOUT.id
      && window.__strideApplyWarmupStyle && window.confirm(window.t('Apply the new warm-up style to today’s session?'));
    Promise.resolve(applyToday ? window.__strideApplyWarmupStyle(warmup) : null)
      .then(() => onSave({ training_style: styles, days_per_week: days, years_training: years, warmup_style: warmup, bio: bio.trim(), notes: notes.trim() }))
      .catch(() => setSaving(false));
  };
  const lbl = { fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10.5, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px' };
  const chip = (active) => ({ padding: '8px 12px', borderRadius: 999, cursor: 'pointer', border: `1.5px solid ${active ? TT.ink : TT.line}`, background: active ? TT.ink : TT.surface, color: active ? '#fff' : TT.ink2, fontFamily: 'Inter', fontWeight: 700, fontSize: 12.5 });
  const ta = { width: '100%', boxSizing: 'border-box', resize: 'vertical', marginTop: 2, padding: '12px 13px', borderRadius: 12, border: `1px solid ${TT.line}`, background: TT.surface, color: TT.ink, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, outline: 'none' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ ...lbl, marginTop: 4 }}>{window.t('What you like to train')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {STYLES.map((s) => <button key={s.key} onClick={() => toggle(s.key)} style={chip(styles.includes(s.key))}>{s.label}</button>)}
      </div>
      <div style={lbl}>{window.t('Days per week')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        <button onClick={() => setDays(null)} style={chip(days == null)}>{window.t('Any')}</button>
        {DAYS.map((d) => <button key={d} onClick={() => setDays(d)} style={chip(days === d)}>{d}</button>)}
      </div>
      <div style={lbl}>{window.t('Training experience')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {EXP.map((e) => <button key={e.y} onClick={() => setYears(e.y)} style={chip(years === e.y)}>{e.label}</button>)}
      </div>
      <div style={lbl}>{window.t('Warm-up style')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        <button onClick={() => setWarmup('per_exercise')} style={chip(warmup === 'per_exercise')}>{window.t('Per exercise')}</button>
        <button onClick={() => setWarmup('grouped')} style={chip(warmup === 'grouped')}>{window.t('Grouped')}</button>
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TT.ink3, marginTop: 6, lineHeight: 1.4 }}>
        {warmup === 'grouped' ? window.t('One warm-up block up front; working exercises skip their warm-up set.') : window.t('Each exercise starts with its own warm-up set.')}
      </div>
      <div style={lbl}>{window.t('About you')}</div>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="e.g. Desk job, train before work." style={ta}/>
      <div style={lbl}>{window.t('Notes for your coach')}</div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. Keep sessions under 1:30h." style={ta}/>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <StrideButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>{window.t('Cancel')}</StrideButton>
        <StrideButton variant="volt" icon="check" style={{ flex: 1.4, opacity: saving ? 0.6 : 1 }} onClick={save}>{saving ? window.t('Saving…') : window.t('Save')}</StrideButton>
      </div>
      <div style={{ height: 8 }}/>
    </div>
  );
}

function CoachNotesBody({ notes, onSave, onClose, trainer }) {
  const [draft, setDraft] = React.useState(notes);
  const SUGGESTIONS = [
    'Bad right shoulder — no heavy overhead',
    'Prefer dumbells over barbell',
    'Keep sessions under 60 min',
    'I train early mornings, low energy',
    'Love supersets, hate long rests',
    'Vegetarian — pace the volume',
    'No box jumps — bad knees',
    'Push me on squats',
    'Poke me to train even on rest days',
  ];
  const addChip = (s) => setDraft((d) => (d.trim() ? d.replace(/\s*$/, '') + '\n• ' + s : '• ' + s));
  return (
    <div style={{ padding: '4px 0 8px' }}>
      <div style={{ display: 'flex', gap: 11, alignItems: 'center', background: TT.ink, color: '#fff', borderRadius: 14, padding: 14, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: TT.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="sparkles" size={18} color={TT.ink}/>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontFamily: 'Inter', fontSize: 12.5, lineHeight: 1.45, opacity: 0.85 }}>
          Standing instructions {trainer} applies every time it builds or tunes a session.
        </div>
      </div>

      <SectionHeader title="Quick add"/>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '12px 0 18px' }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => addChip(s)} style={{
            border: `1px solid ${TT.line}`, background: TT.surface, borderRadius: 999, padding: '7px 12px', cursor: 'pointer',
            fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: TT.ink2, textAlign: 'left',
          }}>+ {s}</button>
        ))}
      </div>

      <SectionHeader title="Your notes"/>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={`e.g. “Right shoulder is cranky on heavy overhead — sub in landmine presses. Keep weekday sessions under 50 minutes.”`}
        rows={6}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical', marginTop: 10, padding: '13px 14px',
          borderRadius: 12, border: `1px solid ${TT.line}`, background: TT.surface, color: TT.ink,
          fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.55, outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <StrideButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</StrideButton>
        <StrideButton variant="volt" icon="check" style={{ flex: 1.4 }} onClick={() => { onSave(draft); onClose(); }}>Save notes</StrideButton>
      </div>
      <div style={{ height: 8 }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AI COACH SETTINGS — standalone page
// ─────────────────────────────────────────────────────────────────
const PERSONA_EMOJI = { coach: '🔥', calm: '🌿', nerd: '📊' };

// Lightweight guard so the personality stays a safe, on-topic coaching brief.
function validatePersonality(text) {
  const t = (text || '').trim();
  if (!t) return { ok: false, level: 'idle', msg: 'Describe how your coach should talk to you.' };
  if (t.length < 15) return { ok: false, level: 'error', msg: 'A little more detail — at least a sentence.' };
  if (t.length > 400) return { ok: false, level: 'error', msg: `Keep it under 400 characters (currently ${t.length}).` };

  const lower = t.toLowerCase();
  const unsafe = ['ignore pain', 'ignore injury', 'train through pain', 'push through injury', 'skip meals', 'stop eating', 'starve', 'don\'t rest', 'no rest ever', 'never rest', 'no days off ever', 'hurt myself', 'self-harm', 'punish me', 'worthless', 'hate myself', 'purge', 'vomit'];
  const hit = unsafe.find((p) => lower.includes(p));
  if (hit) return { ok: false, level: 'error', msg: `Can’t use that — coaching must stay safe (flagged: “${hit}”). No ignoring pain, skipping recovery, or self-destructive tone.` };

  const fitnessWords = ['workout', 'work out', 'train', 'training', 'lift', 'gym', 'rep', 'set', 'cardio', 'run', 'mobility', 'recovery', 'rest', 'strength', 'session', 'form', 'rpe', 'progress', 'muscle', 'exercise', 'warm', 'pace', 'goal', 'motivat', 'effort', 'coach', 'fitness', 'squat', 'press', 'pull'];
  const onTopic = fitnessWords.some((w) => lower.includes(w));
  if (!onTopic) return { ok: false, level: 'error', msg: 'Keep it workout-related — mention training, recovery, motivation, form, etc.' };

  return { ok: true, level: 'ok', msg: 'Looks good — safe and on-topic.' };
}

function AICoachScreen({ go, persona, setPersona }) {
  const personas = window.STRIDE_AI_PERSONAS;
  const [personality, setPersonality] = React.useState(() => {
    try { return localStorage.getItem('stride_coach_personality') || ''; } catch (e) { return ''; }
  });
  const [saved, setSaved] = React.useState(false);
  const v = validatePersonality(personality);

  const EXAMPLES = [
    'Calm and encouraging. Explain the “why” behind each session, never shame me for a missed day, and always remind me to warm up.',
    'Direct and no-nonsense about effort, but protective of my joints — back off loads the moment I flag pain.',
    'Data-driven. Reference my RPE, tonnage and trends, and keep motivation tied to measurable progress.',
  ];

  const save = () => {
    if (!v.ok) return;
    try { localStorage.setItem('stride_coach_personality', personality.trim()); } catch (e) {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <Screen>
      <StrideHeader title="AI Coach Settings" back onBack={() => go('profile')}/>
      <div style={{ padding: '0 20px' }}>
        {/* Persona presets */}
        <SectionHeader title="Personality preset"/>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(personas).map(([key, p]) => {
            const active = persona.key === key;
            return (
              <button key={key} onClick={() => setPersona({ key, ...p })} style={{
                textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                padding: 14, borderRadius: 16,
                background: active ? TT.ink : TT.surface,
                border: `1.5px solid ${active ? TT.ink : TT.line}`,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? TT.volt : TT.lineSoft, display: 'grid', placeItems: 'center', fontSize: 19, flexShrink: 0 }}>
                  {PERSONA_EMOJI[key] || '🤖'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: active ? '#fff' : TT.ink }}>{p.name}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: active ? '#ffffffb0' : TT.ink3, marginTop: 2 }}>{p.blurb}</div>
                </div>
                {active && <StrideIcon name="check" size={20} color={TT.volt} strokeWidth={3}/>}
              </button>
            );
          })}
        </div>

        {/* Sample line */}
        <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: TT.lineSoft }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 800, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>How {persona.name} sounds</div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink2, lineHeight: 1.5, fontStyle: 'italic' }}>“{persona.sample}”</div>
        </div>

        {/* Custom personality */}
        <div style={{ marginTop: 24 }}>
          <SectionHeader title="Personality" right={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: personality.length > 400 ? TT.rose : TT.ink3 }}>{personality.length}/400</span>}/>
          <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: TT.ink3, lineHeight: 1.5, margin: '6px 0 10px' }}>
            Describe how your coach should talk to you. Must stay workout-related and safe — no ignoring pain, skipping recovery, or self-destructive tone.
          </div>
          <textarea
            value={personality}
            onChange={(e) => { setPersonality(e.target.value); setSaved(false); }}
            placeholder="e.g. Supportive but firm. Explain why each session matters, push my effort, but always back off the moment I flag an injury."
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '13px 14px',
              borderRadius: 12, background: TT.surface, color: TT.ink,
              border: `1.5px solid ${v.level === 'error' ? TT.rose : v.level === 'ok' ? TT.green : TT.line}`,
              fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.55, outline: 'none',
            }}
          />

          {/* Validation line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, minHeight: 18 }}>
            {v.level !== 'idle' && (
              <StrideIcon name={v.ok ? 'check' : 'info'} size={14} color={v.level === 'error' ? TT.rose : v.level === 'ok' ? TT.green : TT.ink3} strokeWidth={v.ok ? 3 : 2}/>
            )}
            <span style={{ fontFamily: 'Inter', fontSize: 12, color: v.level === 'error' ? TT.rose : v.level === 'ok' ? TT.green : TT.ink3, lineHeight: 1.4 }}>{v.msg}</span>
          </div>

          {/* Examples */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 800, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Need a starting point?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => { setPersonality(ex); setSaved(false); }} style={{
                  textAlign: 'left', cursor: 'pointer', padding: '10px 12px', borderRadius: 12,
                  background: TT.surface, border: `1px solid ${TT.line}`,
                  fontFamily: 'Inter', fontSize: 12.5, color: TT.ink2, lineHeight: 1.45,
                }}>{ex}</button>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={!v.ok} style={{
            marginTop: 18, width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
            background: saved ? TT.green : v.ok ? TT.ink : TT.lineSoft,
            color: v.ok || saved ? '#fff' : TT.ink3,
            cursor: v.ok ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14,
          }}>
            <StrideIcon name="check" size={17} color={v.ok || saved ? '#fff' : TT.ink3} strokeWidth={2.6}/>
            {saved ? 'Saved' : 'Save personality'}
          </button>
        </div>

        <div style={{ height: 30 }}/>
      </div>
    </Screen>
  );
}

function Row({ icon, label, sub, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderTop: 'none', cursor: onClick ? 'pointer' : 'default',
      borderBottom: `1px solid ${TT.lineSoft}`,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: TT.lineSoft, display: 'grid', placeItems: 'center' }}>
        <StrideIcon name={icon} size={18} color={TT.ink2}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TT.ink }}>{label}</div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{sub}</div>}
      </div>
      <StrideIcon name="chevR" size={18} color={TT.ink3}/>
    </div>
  );
}

function ToggleRow({ icon, label, sub, on, onChange, last }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      borderBottom: last ? 'none' : `1px solid ${TT.lineSoft}`,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: TT.lineSoft, display: 'grid', placeItems: 'center' }}>
        <StrideIcon name={icon} size={18} color={TT.ink2}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TT.ink }}>{label}</div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, marginTop: 2 }}>{sub}</div>}
      </div>
      <StrideToggle on={on} onChange={onChange}/>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, PlanScreen, WeightScreen, ProfileScreen, AICoachScreen, BlockDetailScreen,
  Sheet, SectionHeader, BigStat, ToggleSeg, Row, SessionDetail, AILogBody, strideFindSession,
});
