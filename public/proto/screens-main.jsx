// Main screens: Home, Plan, Weight, Profile/Settings, Goals
// Depends on data.jsx + ui.jsx (loaded earlier).

const TT = window.STRIDE_THEME;

// Recent-feed icon tints — give each activity type its own colorway
const RECENT_ICON_TINT = {
  dumbbell: { bg: '#2563EB18', fg: '#2563EB' },  // strength — blue
  flame:    { bg: '#FF4D1F18', fg: '#FF4D1F' },  // hard session — coral
  heart:    { bg: '#16A34A18', fg: '#16A34A' },  // cardio/run — green
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
  // Daily check-in (energy)
  const checkInKey = 'stride_checkin_2026-06-01';
  const checkInNoteKey = 'stride_checkin_note_2026-06-01';
  const [energy, setEnergy] = React.useState(() => {
    try { const v = localStorage.getItem(checkInKey); return v ? Number(v) : null; } catch (e) { return null; }
  });
  const [energyNote, setEnergyNote] = React.useState(() => {
    try { return localStorage.getItem(checkInNoteKey) || ''; } catch (e) { return ''; }
  });
  const [checkInOpen, setCheckInOpen] = React.useState(false);
  // Whether today's training has been completed (set when a session finishes).
  const [doneToday, setDoneToday] = React.useState(() => {
    try { return localStorage.getItem('stride_today_done') === '1'; } catch (e) { return false; }
  });
  const startAnotherSession = () => {
    try { localStorage.removeItem('stride_today_done'); } catch (e) {}
    setDoneToday(false);
    go('generate');
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
          <AILogButton scopes={['today']} scopeLabel="today's training" persona={persona}/>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: TT.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <StrideIcon name="check" size={18} color={TT.ink} strokeWidth={3}/>
                </div>
                <Chip bg="#ffffff14" ink="#fff" dot color={TT.volt}>All done today</Chip>
              </div>
              <h2 style={{ margin: '0 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 34, lineHeight: 0.98, letterSpacing: -1.4, color: '#fff' }}>
                CRUSHED IT, {u.name.toUpperCase()}.
              </h2>
              <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, color: '#bbb' }}>
                Today's training is in the books — every set logged. Rest up and recover, or stack on a bonus session if you've still got it in you.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <StrideButton variant="volt" size="md" icon="plus" onClick={startAnotherSession} style={{ flex: 1 }}>Add another session</StrideButton>
                <StrideButton variant="ghost" size="md" onClick={() => go('summary')} style={{ flex: 'none', color: '#fff', borderColor: '#ffffff33' }}>Recap</StrideButton>
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
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <StrideButton variant="volt" size="md" iconRight="arrowRight" onClick={() => go('plan')} style={{ flex: 1 }}>View plan</StrideButton>
                <StrideButton variant="ghost" size="md" icon="sparkles" onClick={() => go('generate')} style={{ flex: 'none', color: '#fff', borderColor: '#ffffff33' }}>Add a session</StrideButton>
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
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }} onClick={(e) => e.stopPropagation()}>
              <StrideButton variant="volt" size="md" iconRight="arrowRight" onClick={() => { window.STRIDE_ACTIVE_WORKOUT = null; go('active-config'); }} style={{ flex: 1 }}>Start</StrideButton>
              <IconBtn icon="edit" onClick={() => setSessionSheet('edit')} bg="#ffffff14" color="#fff" border="#ffffff22"/>
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
            <QuickTile icon="sparkles" label="Generate today's session" sub={window.t('with {name}', { name: persona.name })} onClick={() => go('generate')} bgColor={TT.volt} inkColor={TT.ink}/>
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
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: TT.bg, display: 'flex', flexDirection: 'column', animation: 'sheetUp 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
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

function AILogButton({ scopes, scopeLabel, persona, dark = false }) {
  const [open, setOpen] = React.useState(false);
  const entries = (window.STRIDE_AI_LOG || []).filter((e) => scopes.includes(e.scope));
  const trainer = (persona && persona.name) || 'Coach';
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Coach activity log" style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
        background: dark ? '#ffffff14' : TT.surface,
        border: `1px solid ${dark ? '#ffffff22' : TT.line}`,
      }}>
        <StrideIcon name="sparkles" size={19} color={dark ? '#fff' : TT.ink}/>
        {entries.length > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 8, background: TT.accent, color: '#fff',
            fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10,
            display: 'grid', placeItems: 'center', border: `2px solid ${dark ? TT.ink : TT.bg}`,
          }}>{entries.length}</span>
        )}
      </button>
      {open && (
        <Sheet title="Coach activity" onClose={() => setOpen(false)}>
          <AILogBody entries={entries} scopes={scopes} scopeLabel={scopeLabel} trainer={trainer}/>
        </Sheet>
      )}
    </>
  );
}

function AILogBody({ entries, scopes, scopeLabel, trainer }) {
  return (
    <div style={{ padding: '4px 0 8px' }}>
      {/* Scope banner */}
      <div style={{ display: 'flex', gap: 11, alignItems: 'center', background: TT.ink, color: '#fff', borderRadius: 14, padding: 14, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: TT.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="sparkles" size={18} color={TT.ink}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 14, lineHeight: 1.15 }}>What {trainer} changed</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11.5, opacity: 0.7, marginTop: 2 }}>Scoped to {scopeLabel} · {entries.length} {entries.length === 1 ? 'change' : 'changes'}</div>
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
            {entries.filter((e) => e.scope === sc).map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 14px', borderTop: i ? `1px solid ${TT.lineSoft}` : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <StrideIcon name={e.icon} size={15} color={TT.ink2}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink, lineHeight: 1.25 }}>{e.text}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginTop: 5 }}>{e.kind} · {e.target}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink2, lineHeight: 1.45, marginTop: 5 }}>{e.why}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: TT.ink3, marginTop: 6 }}>{e.when}</div>
                </div>
              </div>
            ))}
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
        <AILogButton scopes={['today', 'week', 'block']} scopeLabel="your full plan" persona={persona}/>
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

  return (
    <div style={{ padding: '0 20px' }}>
      {week.map((d, i) => {
        if (d.status === 'today') return <TodayRow key={i} d={d} go={go} onOpen={() => setOpenSession(d)}/>;
        return <WeekRow key={i} d={d} last={i === week.length - 1} onOpen={() => setOpenSession(d)}/>;
      })}
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
            {d.duration ? `${d.duration} min planned` : '—'}
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
            Skipped · {d.skipReason}
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

function aiSessionNote(personaKey, s) {
  const k = ['coach','calm','nerd'].includes(personaKey) ? personaKey : 'calm';
  const rest = s.kind === 'Rest';
  const vol = (s.volume / 1000).toFixed(1);
  const reason = (s.skipReason || '').toLowerCase();
  let bucket;
  if (s.status === 'skipped') bucket = 'skipped';
  else if (s.status === 'today') bucket = 'today';
  else if (s.status === 'planned') bucket = 'planned';
  else if (rest) bucket = 'recovery';
  else bucket = s.result === 'bad' ? 'bad' : 'good';

  const lines = {
    good: {
      coach: `${vol} tonnes moved and bar speed held to the last rep. That's the standard now — match it next ${s.kind}.`,
      calm: `Really clean work, Alex. Volume and effort landed right where we planned, and your top sets looked controlled. Recover well and we'll build from here.`,
      nerd: `${s.volume.toLocaleString()} kg tonnage @ RPE 7.4 — within 3% of target. Velocity steady across working sets, so you're cleared for +2.5 kg next cycle.`,
      buddy: `Yesss that's the one 🙌 ${vol} tonnes and your top sets flew. Go refuel — you earned it.`,
    },
    bad: {
      coach: `Rough one — but you showed up and logged it, and that counts. We trim 5% off ${s.kind} next time and rebuild bar speed. No quitting.`,
      calm: `That felt heavier than usual, and that's okay — sleep, stress and fuel all read into a session. Let's deload slightly next ${s.kind} and reset.`,
      nerd: `Bar velocity down ~12% vs baseline, RPE overshot target by ~1.5 — reads like recovery debt. Recommend −5% load and an extra rest day before next ${s.kind}.`,
      buddy: `Hey, not every day's a PR and that is totally fine 💪 You still got the work in. Next ${s.kind} we run it back lighter and snappier.`,
    },
    skipped: {
      coach: `You called it on the ${reason} — smart, not soft. Protecting a joint beats grinding through it. We reschedule and hit it fresh.`,
      calm: `Skipping for ${reason} was the right call — listening to your body is training too. I've kept the volume; let's slot it later this week.`,
      nerd: `Missed session logged. ${s.skipReason} flagged — pausing was the lower-risk option (injury cost far exceeds one session). Weekly target auto-adjusts.`,
      buddy: `No guilt, okay? ${reason} is a real reason and you made the grown-up call 🙌 We'll catch this one up when you're good.`,
    },
    recovery: {
      coach: `Recovery logged. Good — you can't grind every day. Mobility is part of the plan, not a day off. Back to work tomorrow.`,
      calm: `Lovely — recovery days are where the adaptation actually happens. Mobility and an easy walk is exactly right for today.`,
      nerd: `Active recovery complete. Z2 + mobility supports parasympathetic recovery between hard sessions — expect HRV to read higher tomorrow.`,
      buddy: `Rest day done right 🧘 This is the secret sauce — you'll feel it on your next lift.`,
    },
    today: {
      coach: `Push day. ${s.duration} minutes, no wasted sets. You're 12 sessions from a 100 kg bench — today's a brick in that wall. Get under the bar.`,
      calm: `Your ${s.kind} session is ready when you are — about ${s.duration} minutes. We dropped bench to 82.5×6 off last week's RPE. Warm up well and we'll go.`,
      nerd: `Today: ${s.kind}, ~${s.duration} min, target RPE 7.5. Bench 82.5×6×3 projects a +1.2% 1RM nudge this block. Volume's primed — execute.`,
      buddy: `Push day baby 👋 ~${s.duration} mins of good stuff. That bench is gonna feel great today — let's gooo.`,
    },
    planned: {
      coach: `On the board for ${s.day}. Come in ready — glance at the openers tonight so tomorrow there's no thinking, just lifting.`,
      calm: `This one's coming up ${s.day}. Nothing to do yet — keep eating and sleeping well and it'll be ready when you are.`,
      nerd: `Scheduled ${s.day}. Load/volume set from current block periodization; I'll finalize working weights from your prior session's RPE.`,
      buddy: `${s.day}'s gonna be fun 😎 Nothing to stress about now — just show up fresh and we'll handle the rest.`,
    },
  };
  return lines[bucket][k];
}

function AITrainerNote({ persona, s }) {
  const note = aiSessionNote(persona && persona.key, s);
  return (
    <div style={{ marginBottom: 16 }}>
      <SectionHeader title={`${(persona && persona.name) || 'Trainer'} says`}/>
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

  if (mode === 'edit') {
    return <SessionEditor session={s} persona={persona} go={go} onBack={() => setMode('view')} onClose={onClose}/>;
  }
  if (mode === 'chat') {
    return <SessionChat session={s} persona={persona} onBack={() => setMode('view')}/>;
  }

  const exercises = SESSION_SAMPLES[s.kind] || [];

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
          {s.day} · May {s.date}
        </div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1.15 }}>{s.title}</div>
        {!skipped && (
          <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${(done || today) ? '#ffffff22' : TT.lineSoft}` }}>
            <SessionStat label="Duration" value={`${s.duration} min`} dim={!done && !today}/>
            {!isRest && <SessionStat label={done ? 'Volume' : 'Target'} value={done ? `${(s.volume/1000).toFixed(1)}t` : `${exercises.length} lifts`} dim={!done && !today}/>}
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
            Ask {persona.name} to change something…
          </div>
          <StrideIcon name="chevR" size={18} color={TT.ink3}/>
        </button>
      )}

      {/* Skip reflection */}
      {skipped && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="Why I skipped"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex' }}>
              <SkipCell label="Reason" value={s.skipReason}/>
              <div style={{ width: 1, background: TT.lineSoft }}/>
              <SkipCell label="How I felt" value={s.mood}/>
            </div>
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${TT.lineSoft}`, fontFamily: 'Inter', fontSize: 13, lineHeight: 1.55, color: TT.ink2 }}>
              {s.skipNote}
            </div>
          </div>
        </div>
      )}

      {/* AI Trainer response — varies by outcome */}
      <AITrainerNote persona={persona} s={s}/>

      {/* What the trainer changed for this session */}
      {s.adjustments && s.adjustments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title="What I changed"/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {s.adjustments.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? `1px solid ${TT.lineSoft}` : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: TT.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <StrideIcon name="sliders" size={14} color={TT.ink2}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink }}>{a.text}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: TT.ink3, marginTop: 3 }}>{a.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise list */}
      {exercises.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionHeader title={isRest ? 'Recovery flow' : (skipped ? 'What you missed' : (done ? 'What you did' : "What's planned"))}/>
          <div style={{ marginTop: 10, background: TT.surface, border: `1px solid ${TT.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {exercises.map((ex, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderTop: i ? `1px solid ${TT.lineSoft}` : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, background: TT.lineSoft,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 12, color: TT.ink2,
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TT.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, marginTop: 2 }}>
                    {ex.sets} × {ex.reps}{ex.load && ex.load !== '—' ? ` · ${ex.load}` : ''}
                  </div>
                </div>
                {done && <StrideIcon name="check" size={14} color={TT.green} strokeWidth={3}/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {today && (
          <>
            <StrideButton variant="ghost" icon="edit" style={{ flex: 1 }} onClick={() => setMode('edit')}>Edit</StrideButton>
            <StrideButton variant="volt" icon="play" iconRight="arrowRight" style={{ flex: 1.4 }} onClick={startSession}>Start</StrideButton>
          </>
        )}
        {planned && (
          <>
            <StrideButton variant="ghost" icon="edit" style={{ flex: 1 }} onClick={() => setMode('edit')}>Edit</StrideButton>
            <StrideButton variant="ghost" style={{ flex: 1 }}>Move</StrideButton>
            <StrideButton variant="primary" icon="play" style={{ flex: 1.2 }} onClick={startSession}>Start early</StrideButton>
          </>
        )}
        {done && (
          <>
            <StrideButton variant="ghost" style={{ flex: 1 }}>View summary</StrideButton>
            <StrideButton variant="primary" icon="plus" style={{ flex: 1 }}>Repeat</StrideButton>
          </>
        )}
        {skipped && (
          <>
            <StrideButton variant="ghost" icon="cal" style={{ flex: 1 }}>Reschedule</StrideButton>
            <StrideButton variant="primary" icon="play" style={{ flex: 1 }} onClick={startSession}>Do it now</StrideButton>
          </>
        )}
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
            }}>{m.text}</div>
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
  // Build a 5-week calendar with mixed statuses
  const weeks = 5;
  const today = 21;
  const completedSet = new Set([1,2,4,5,7,8,9,11,12,14,15,17,18,19]);
  const plannedSet = new Set([22,23,25,26,28,29,30]);
  const [openSession, setOpenSession] = React.useState(null);

  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const kindByCol = ['Pull','Legs','Rest','Push','Pull','Legs','Rest'];
  const titleByKind = {
    Push: 'Push — Strength A', Pull: 'Pull — Hypertrophy',
    Legs: 'Lower — Squat focus', Rest: 'Mobility · 20 min',
  };
  const buildSession = (date, status) => {
    const col = (date + 3) % 7; // 0 = Mon … 6 = Sun
    const kind = kindByCol[col];
    const isRest = kind === 'Rest';
    return {
      day: dayNames[col], date, kind, title: isRest ? 'Active recovery' : titleByKind[kind], status,
      volume: status === 'done' && !isRest ? 4600 + (date % 5) * 460 : 0,
      duration: isRest ? 22 : 56 + (date % 4) * 5,
    };
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: TT.ink3, textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const date = i - 3; // offset so May 1 starts on Friday-ish
          const isMay = date >= 1 && date <= 31;
          const isToday = date === today;
          const done = completedSet.has(date);
          const planned = plannedSet.has(date);
          const clickable = isMay && (done || planned || isToday);
          const status = isToday ? 'today' : (done ? 'done' : 'planned');
          return (
            <div key={i} onClick={clickable ? () => setOpenSession(buildSession(date, status)) : undefined} style={{
              aspectRatio: '1 / 1.05',
              background: isToday ? TT.ink : (done ? TT.accent : (planned ? TT.surface : TT.surface)),
              border: planned ? `1px dashed ${TT.line}` : (done ? 'none' : (isToday ? 'none' : `1px solid ${TT.lineSoft}`)),
              borderRadius: 10,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: '6px 7px',
              opacity: isMay ? 1 : 0.3,
              cursor: clickable ? 'pointer' : 'default',
              color: isToday ? '#fff' : (done ? '#fff' : TT.ink2),
            }}>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12 }}>{isMay ? date : ''}</span>
              {done && <StrideIcon name="check" size={11} color="#fff" strokeWidth={3}/>}
              {isToday && <div style={{ width: 5, height: 5, borderRadius: 5, background: TT.volt, alignSelf: 'flex-end' }}/>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontFamily: 'Inter', fontSize: 11, color: TT.ink3 }}>
        <Legend color={TT.accent} label="Completed"/>
        <Legend color={TT.ink} label="Today"/>
        <Legend color={TT.surface} bordered label="Planned"/>
      </div>
      <div style={{ marginTop: 22 }}>
        <SectionHeader title="May Summary"/>
        <Card style={{ marginTop: 10, padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14 }}>
            <BigStat label="Sessions" value="14 / 20"/>
            <BigStat label="Total volume" value="89.4t"/>
            <BigStat label="Avg RPE" value="7.4"/>
            <BigStat label="Avg duration" value="64 min"/>
          </div>
        </Card>
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
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.ink3 }}>{window.t('{n} weeks', { n: b.weeks })} · {b.dates}{b.weekOf ? window.t(' · Week {w} of {total}', { w: b.weekOf, total: b.weeks }) : ''}</div>
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
      <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: TT.ink3 }}>{window.t('{n} weeks', { n: b.weeks })} · {b.dates}{b.weekOf ? window.t(' · Week {w} of {total}', { w: b.weekOf, total: b.weeks }) : ''}</div>
      {(b.status !== 'upcoming') && (
        <div style={{ marginTop: 12, height: 8, borderRadius: 8, background: TT.lineSoft, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: b.accent || TT.accent }}/>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
        {b.stats.map((s, i) => <BigStat key={i} label={s.label} value={s.value}/>)}
      </div>

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
        <SectionHeader title={`${trainer}'s changes`} right={<Chip bg={TT.lineSoft}>{b.changes.length}</Chip>}/>
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
  const u = window.STRIDE_USER;
  const h = window.STRIDE_WEIGHT_HISTORY;
  const last = h[h.length - 1].kg;
  const first = h[0].kg;
  const change = (last - first).toFixed(1);
  const [showLog, setShowLog] = React.useState(false);
  const [val, setVal] = React.useState('78.4');

  return (
    <Screen>
      <StrideHeader title="Weight" kicker={`Goal: ${u.goalWeightKg} kg`} back onBack={() => go('profile')} right={<IconBtn icon="plus" onClick={() => setShowLog(true)}/>}/>
      <div style={{ padding: '0 20px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 56, lineHeight: 0.9, letterSpacing: -2, color: TT.ink }}>{last}<span style={{ fontSize: 22, color: TT.ink3, marginLeft: 4 }}>kg</span></div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: TT.green, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <StrideIcon name="arrowDown" size={14} color={TT.green}/>
                {change} kg in 12 weeks
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>To goal</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: TT.ink }}>−{(last - u.goalWeightKg).toFixed(1)} kg</div>
            </div>
          </div>
          <StrideLineChart data={h} w={340} h={150} accent={TT.ink}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'Inter', fontSize: 10, color: TT.ink3 }}>
            <span>{h[0].d}</span>
            <span>{h[Math.floor(h.length/2)].d}</span>
            <span>Today</span>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TT.ink3, letterSpacing: 0.6, textTransform: 'uppercase' }}>Body fat</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{u.bodyFat}%</div>
          </Card>
          <Card style={{ padding: 14 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TT.ink3, letterSpacing: 0.6, textTransform: 'uppercase' }}>BMI</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{(last / ((u.height/100) ** 2)).toFixed(1)}</div>
          </Card>
          <Card style={{ padding: 14 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TT.ink3, letterSpacing: 0.6, textTransform: 'uppercase' }}>Trend</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, marginTop: 4, color: TT.green }}>−0.32/wk</div>
          </Card>
        </div>

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

        <div style={{ height: 24 }}/>
      </div>

      {/* Log weight sheet */}
      {showLog && (
        <Sheet onClose={() => setShowLog(false)} title="Log weight">
          <div style={{ padding: '8px 4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: TT.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Today · May 21</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 14 }}>
              <input value={val} onChange={e => setVal(e.target.value)} inputMode="decimal" style={{
                width: 180, textAlign: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 900,
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
              <StrideButton variant="primary" block onClick={() => setShowLog(false)}>Save</StrideButton>
            </div>
          </div>
        </Sheet>
      )}
    </Screen>
  );
}

// Reusable bottom sheet
function Sheet({ title, children, onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.45)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: TT.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '14px 22px 32px', maxHeight: '80%',
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
  const [notesOpen, setNotesOpen] = React.useState(() => {
    if (window.__strideOpenNotes) { window.__strideOpenNotes = false; return true; }
    return false;
  });
  const [notes, setNotes] = React.useState(() => {
    try { return localStorage.getItem('stride_coach_notes') || ''; } catch (e) { return ''; }
  });
  const saveNotes = (val) => {
    setNotes(val);
    try { localStorage.setItem('stride_coach_notes', val); } catch (e) {}
  };
  const notesPreview = notes.trim() ? notes.trim().replace(/\s+/g, ' ').slice(0, 38) + (notes.trim().length > 38 ? '…' : '') : 'Tell your coach what to keep in mind';
  const trainer = (persona && persona.name) || 'Coach';
  const { lang } = window.useStrideI18n(); // 'en' | 'sk' — backed by the profile
  // Live counts for the tracking rows (were hardcoded demo values).
  const goalsCount = (window.STRIDE_GOALS || []).length;
  const injuriesList = window.STRIDE_INJURIES || [];
  // Personal records sheet
  const [prsOpen, setPrsOpen] = React.useState(false);
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
            <Row icon="settings" label="Units & equipment" sub="Kg · Metric"/>
            <Row icon="bolt" label="Notifications"/>
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

function CoachNotesBody({ notes, onSave, onClose, trainer }) {
  const [draft, setDraft] = React.useState(notes);
  const SUGGESTIONS = [
    'Bad right shoulder — no heavy overhead',
    'Prefer dumbbells over barbell',
    'Keep sessions under 60 min',
    'I train early mornings, low energy',
    'Love supersets, hate long rests',
    'Vegetarian — pace the volume',
    'No box jumps — bad knees',
    'Push me on squats',
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
  Sheet, SectionHeader, BigStat, ToggleSeg, Row, SessionDetail,
});
