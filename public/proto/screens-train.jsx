// Training-flow screens: Generate, Active config, Active workout, Summary, Chat.

const TX = window.STRIDE_THEME;

// ────────────────────────────────────────────────────────────────────
// AI GENERATE — wizard-style flow
// ────────────────────────────────────────────────────────────────────
function GenerateScreen({ go, persona }) {
  const [step, setStep] = React.useState(0);
  const [focus, setFocus] = React.useState('Push');
  const [duration, setDuration] = React.useState(60);
  const [intensity, setIntensity] = React.useState('Moderate');
  const [equipment, setEquipment] = React.useState(['Barbell', 'Dumbbells', 'Cable']);
  const [feeling, setFeeling] = React.useState(3);
  const [context, setContext] = React.useState('');
  const [generating, setGenerating] = React.useState(false);

  // Training spots drive the location step + equipment available.
  const [spots] = window.useStrideSpots();
  const [equipPrefs] = window.useEquipmentPrefs();
  // When the session should happen — defaults to tomorrow once today is done.
  const [schedDate, setSchedDate] = React.useState(() => {
    const d = new Date();
    const w = window.STRIDE_TODAYS_WORKOUT;
    if (w && w.status === 'done') d.setDate(d.getDate() + 1);
    return d;
  });
  const genDate = schedDate;
  const autoSpot = window.resolveScheduledSpot(spots, genDate);
  const [spotMode, setSpotMode] = React.useState('auto'); // 'auto' | spotId
  const activeSpot = spotMode === 'auto' ? autoSpot : (spots.find((s) => s.id === spotMode) || autoSpot);
  const [prompt, setPrompt] = React.useState(activeSpot ? activeSpot.prompt || '' : '');
  React.useEffect(() => {
    if (activeSpot) { setPrompt(activeSpot.prompt || ''); setEquipment(activeSpot.equipment); }
  }, [spotMode]);

  const handleGen = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setStep(4);
    }, 1800);
  };

  return (
    <>
    <Screen>
      <StrideHeader title={step < 4 ? "Generate" : "Ready to roll"} kicker={step < 4 ? window.t('Step {n} of 4 · with {name}', { n: step+1, name: persona.name }) : window.t('Generated · 5 exercises')} back onBack={() => step === 0 ? go('home') : setStep(Math.max(0, step - 1))}/>

      <div style={{ padding: '0 20px' }}>
        <div style={{ height: 4, borderRadius: 4, background: TX.lineSoft, overflow: 'hidden', marginBottom: 22 }}>
          <div style={{ width: `${((step+1)/5)*100}%`, height: '100%', background: TX.accent, transition: 'width .4s' }}/>
        </div>

        {step === 0 && (
          <StepWrap title="What are we hitting today?" sub="I'll factor in your plan + recent volume.">
            {/* When to schedule it — today / tomorrow / any date */}
            <div style={{ marginBottom: 14 }}>
              <SectionHeader title="Scheduled for"/>
              <Card style={{ marginTop: 8, padding: 12 }}>
                {(() => {
                  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const now = new Date();
                  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                  const sel = iso(schedDate);
                  const chip = (label, d) => (
                    <button key={label} onClick={() => setSchedDate(d)} style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                      background: sel === iso(d) ? TX.ink : TX.lineSoft,
                      color: sel === iso(d) ? '#fff' : TX.ink,
                      border: 'none', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
                    }}>{label}</button>
                  );
                  return (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {chip('Today', now)}
                      {chip('Tomorrow', tomorrow)}
                      <input type="date" value={sel} min={iso(now)}
                        onChange={(e) => { if (e.target.value) setSchedDate(new Date(e.target.value + 'T00:00:00')); }}
                        style={{
                          flex: 1.2, padding: '7px 8px', borderRadius: 10, border: `1px solid ${TX.line}`,
                          background: TX.surface, color: TX.ink, fontFamily: 'Inter', fontSize: 12.5, outline: 'none', minWidth: 0,
                        }}/>
                    </div>
                  );
                })()}
              </Card>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { id: 'Push',  icon: 'dumbbell', sub: 'Chest · Shoulders · Tris' },
                { id: 'Pull',  icon: 'dumbbell', sub: 'Back · Biceps' },
                { id: 'Legs',  icon: 'dumbbell', sub: 'Quads · Hams · Glutes' },
                { id: 'Upper body', icon: 'dumbbell', sub: 'Chest · Back · Arms' },
                { id: 'Lower body', icon: 'dumbbell', sub: 'Quads · Glutes · Calves' },
                { id: 'Posterior chain', icon: 'flame', sub: 'Glutes · Hams · Back' },
                { id: 'Anterior chain', icon: 'bolt', sub: 'Quads · Core · Chest' },
                { id: 'Full body', icon: 'bolt', sub: 'Compound circuit' },
                { id: 'Conditioning', icon: 'flame', sub: 'Metcon / HIIT' },
                { id: 'Mobility', icon: 'leaf', sub: 'Recovery focus' },
              ].map(o => (
                <ChoiceCard key={o.id} active={focus === o.id} onClick={() => setFocus(o.id)} icon={o.icon} title={o.id} sub={o.sub}/>
              ))}
            </div>
          </StepWrap>
        )}

        {step === 1 && (
          <StepWrap title="How long do you have?" sub="Slide to set a duration — or leave it open.">
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 72, letterSpacing: -3, color: TX.ink, lineHeight: 1 }}>{duration != null ? duration : '~60'}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 13, color: TX.ink3, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{duration != null ? 'minutes' : 'flexible · about an hour'}</div>
                <input type="range" min="20" max="120" step="5" value={duration != null ? duration : 60} onChange={e => setDuration(parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: 22, accentColor: TX.accent, opacity: duration != null ? 1 : 0.35 }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 11, color: TX.ink3, marginTop: 4 }}>
                  <span>20 min</span><span>120 min</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                {[30, 45, 60, 75, 90].map(m => (
                  <button key={m} onClick={() => setDuration(m)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10,
                    background: duration === m ? TX.ink : TX.lineSoft,
                    color: duration === m ? '#fff' : TX.ink,
                    border: 'none', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  }}>{m}</button>
                ))}
              </div>
              <button onClick={() => setDuration(null)} style={{
                width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10,
                background: duration == null ? TX.ink : 'transparent',
                color: duration == null ? '#fff' : TX.ink3,
                border: `1.5px ${duration == null ? 'solid' : 'dashed'} ${duration == null ? TX.ink : TX.line}`,
                fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer',
              }}>No strict limit — aim for about an hour</button>
            </Card>
          </StepWrap>
        )}

        {step === 2 && (
          <StepWrap title="Where are you training?" sub="I'll only program what's available there.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Auto — follow schedule */}
              <button onClick={() => setSpotMode('auto')} style={{
                textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
                background: spotMode === 'auto' ? TX.ink : TX.surface, border: `1.5px solid ${spotMode === 'auto' ? TX.ink : TX.line}`,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: spotMode === 'auto' ? TX.volt : TX.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <StrideIcon name="cal" size={20} color={spotMode === 'auto' ? TX.ink : TX.ink2}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: spotMode === 'auto' ? '#fff' : TX.ink }}>Auto — follow my schedule</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: spotMode === 'auto' ? '#ffffffb0' : TX.ink3, marginTop: 2 }}>
                    {autoSpot ? `Today → ${autoSpot.name} · ${window.scheduleLabel(autoSpot.schedule)}` : 'No spots saved yet'}
                  </div>
                </div>
                {spotMode === 'auto' && <StrideIcon name="check" size={20} color={TX.volt} strokeWidth={3}/>}
              </button>

              {spots.map((sp) => {
                const meta = window.spotTypeMeta(sp.type);
                const sel = spotMode === sp.id;
                return (
                  <button key={sp.id} onClick={() => setSpotMode(sp.id)} style={{
                    textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
                    background: sel ? TX.ink : TX.surface, border: `1.5px solid ${sel ? TX.ink : TX.line}`,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: sel ? '#ffffff1a' : meta.color + '18', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <StrideIcon name={meta.icon} size={20} color={sel ? '#fff' : meta.color}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: sel ? '#fff' : TX.ink }}>{sp.name}</div>
                      <div style={{ fontFamily: 'Inter', fontSize: 12, color: sel ? '#ffffffb0' : TX.ink3, marginTop: 2 }}>{meta.label} · {sp.size} · {sp.equipment.length} items</div>
                    </div>
                    {sel && <StrideIcon name="check" size={20} color={TX.volt} strokeWidth={3}/>}
                  </button>
                );
              })}

              <button onClick={() => { window.__strideLibTab = 'spots'; go('library'); }} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, cursor: 'pointer',
                background: 'transparent', border: `1.5px dashed ${TX.line}`, color: TX.ink3, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
              }}>
                <StrideIcon name="plus" size={16} color={TX.ink3}/> Manage spots in Library
              </button>
            </div>

          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap title="What do you want from this session?" sub="Honest input → better session.">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
              placeholder="e.g. Heavy compound focus, keep it under 60 min"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '12px 14px', borderRadius: 12, border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, outline: 'none' }}/>
            {activeSpot && activeSpot.prompt && (
              <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TX.ink3, marginTop: 8 }}>Prefilled from {activeSpot.name}'s standing prompt — tweak it just for today if you like.</div>
            )}

            <div style={{ marginTop: 18 }}><SectionHeader title="How are you feeling?"/></div>
            <Card style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {[
                  { v: 1, emoji: '😵', label: 'Wrecked' },
                  { v: 2, emoji: '😣', label: 'Tired' },
                  { v: 3, emoji: '😐', label: 'OK' },
                  { v: 4, emoji: '💪', label: 'Good' },
                  { v: 5, emoji: '🔥', label: 'Primed' },
                ].map(f => (
                  <button key={f.v} onClick={() => setFeeling(f.v)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '4px 2px',
                    opacity: feeling === f.v ? 1 : 0.4,
                    transform: feeling === f.v ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all .2s',
                  }}>
                    <span style={{ fontSize: 36 }}>{f.emoji}</span>
                    <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TX.ink2, letterSpacing: 0.4, textTransform: 'uppercase' }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </Card>
            <div style={{ marginTop: 14 }}>
              <SectionHeader title="Anything I should know?"/>
              <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2}
                placeholder="e.g. Right shoulder slightly tight · pressed PR Monday · slept 6.5h"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', marginTop: 8, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink, fontFamily: 'Inter', fontSize: 13, lineHeight: 1.5, outline: 'none' }}/>
            </div>
          </StepWrap>
        )}

        {step === 4 && (
          <div>
            <Card dark style={{ marginBottom: 14, padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 160, background: TX.volt, opacity: 0.25, filter: 'blur(40px)' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Chip bg="#ffffff14" ink={TX.volt} color={TX.volt} dot>AI Generated</Chip>
                  <Chip bg="#ffffff14" ink="#fff">{schedDate.toLocaleDateString(window.strideLocale(), { weekday: 'short', day: 'numeric', month: 'numeric' })}</Chip>
                  {activeSpot && <Chip bg="#ffffff14" ink="#fff">{activeSpot.name}</Chip>}
                </div>
                <h2 style={{ margin: '8px 0 4px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: -1, color: '#fff' }}>{focus.toUpperCase()} — {duration != null ? `${duration} MIN` : '~60 MIN'}</h2>
                <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 13, color: '#bbb', lineHeight: 1.4 }}>
                  Built around {activeSpot ? `${activeSpot.name}'s kit` : 'your equipment'}. Bench dialled back to 75 kg × 8 to protect your right shoulder. Substituted neutral-grip DB press for dips. 5 exercises, RPE target 7.
                </p>
              </div>
            </Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Barbell Bench Press', sets: '3 × 8', kg: '75 kg', adj: 'Adjusted –7.5 kg' },
                { name: 'Neutral-Grip DB Press', sets: '3 × 10', kg: '22 kg', adj: 'Replaces dips' },
                { name: 'Seated Cable Row', sets: '3 × 12', kg: '40 kg', adj: 'Antagonist superset' },
                { name: 'Cable Fly — Low to High', sets: '3 × 12', kg: '14 kg', adj: '' },
                { name: 'Overhead Tricep Ext.', sets: '3 × 12', kg: '22 kg', adj: 'Wrist-friendly' },
              ].map((ex, i) => (
                <Card key={i} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: TX.ink, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 13 }}>{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TX.ink }}>{ex.name}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: TX.ink3, marginTop: 2 }}>{ex.sets} · {ex.kg}{ex.adj ? ` · ${ex.adj}` : ''}</div>
                  </div>
                  <IconBtn icon="more" size={32}/>
                </Card>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <StrideButton variant="ghost" icon="sparkles" style={{ flex: 1 }} onClick={handleGen}>Regenerate</StrideButton>
              <StrideButton variant="accent" iconRight="arrowRight" style={{ flex: 1.4 }} onClick={() => { window.STRIDE_ACTIVE_WORKOUT = null; go('active-config'); }}>Start session</StrideButton>
            </div>
          </div>
        )}

        {/* Clearance below the sticky Continue button on wizard steps */}
        <div style={{ height: step < 4 ? 16 : 30 }}/>
      </div>

      {/* generating overlay */}
      {generating && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 40, background: TX.volt,
              display: 'grid', placeItems: 'center', margin: '0 auto 18px',
              animation: 'pulse 1.4s ease infinite',
            }}>
              <StrideIcon name="sparkles" size={36} color={TX.ink} strokeWidth={2.5}/>
            </div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20 }}>Building your session</div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: '#bbb', marginTop: 6 }}>Crunching volume · injuries · recent RPE</div>
          </div>
        </div>
      )}
    </Screen>

      {step < 4 && !generating && (
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: window.STRIDE_NATIVE ? 'calc(env(safe-area-inset-bottom) + 20px)' : 30, zIndex: 20 }}>
          <StrideButton variant={step === 3 ? 'accent' : 'primary'} block
            iconRight={step === 3 ? 'sparkles' : 'arrowRight'}
            onClick={() => step === 3 ? handleGen() : setStep(step + 1)}>
            {step === 3 ? 'Generate workout' : 'Continue'}
          </StrideButton>
        </div>
      )}
    </>
  );
}

function StepWrap({ title, sub, children }) {
  return (
    <div>
      <h2 style={{ margin: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: -0.8, color: TX.ink }}>{title}</h2>
      {sub && <p style={{ margin: '6px 0 18px', fontFamily: 'Inter', fontSize: 14, color: TX.ink3, lineHeight: 1.4 }}>{sub}</p>}
      {children}
    </div>
  );
}

function ChoiceCard({ active, onClick, icon, title, sub }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', border: `1.5px solid ${active ? TX.ink : TX.line}`,
      background: active ? TX.ink : TX.surface, color: active ? '#fff' : TX.ink,
      borderRadius: 16, padding: 14, minHeight: 100,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <StrideIcon name={icon} size={22} color={active ? TX.volt : TX.ink} strokeWidth={2.2}/>
      <div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15 }}>{title}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, opacity: active ? 0.7 : 0.6, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// ACTIVE CONFIG — session intro (stats + exercise queue)
// ────────────────────────────────────────────────────────────────────
function ActiveConfigScreen({ go }) {
  // The session being run: one loaded from the plan, else today's. Never deref null.
  const w = window.STRIDE_ACTIVE_WORKOUT || window.STRIDE_TODAYS_WORKOUT;
  React.useEffect(() => { if (!w) go('home'); }, []);
  if (!w) return null;

  return (
    <>
    <Screen>
      <StrideHeader title="Get ready" kicker={w.title || w.block || ''} back onBack={() => go('home')}/>
      <div style={{ padding: '0 20px' }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <BigStat label="Exercises" value={w.exercises.filter(e => e.section !== 'warmup').length}/>
            <BigStat label="Sets" value={w.exercises.filter(e => e.section !== 'warmup').reduce((s,e) => s + e.sets.length, 0)}/>
            <BigStat label="Est. time" value={`${w.durationMin}m`}/>
          </div>
        </Card>

        <div style={{ marginTop: 18 }}>
          <SectionHeader title="Exercise queue"/>
          {(() => {
            const warm = w.exercises.filter(e => e.section === 'warmup');
            const work = w.exercises.filter(e => e.section !== 'warmup');
            const lastChip = (ex) => {
              const s = ex.sets[ex.sets.length - 1];
              return `${s.reps ? `${s.reps}${strideIsHold(ex) ? 's' : ''}` : 'AMRAP'} × ${s.kg || '—'}${s.kg ? 'kg' : ''}`;
            };
            const Row = (ex, badge, first) => (
              <div key={ex.id} style={{
                padding: '14px 16px', borderTop: first ? 'none' : `1px solid ${TX.lineSoft}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: ex.section === 'warmup' ? TX.volt : TX.lineSoft, display: 'grid', placeItems: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 12, color: TX.ink }}>{badge}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14 }}>{ex.name}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: TX.ink3, marginTop: 2 }}>
                    {ex.sets.length} sets · {ex.tag}
                  </div>
                </div>
                <Chip bg={TX.lineSoft} style={{ fontSize: 9 }}>{lastChip(ex)}</Chip>
              </div>
            );
            const card = (rows) => <div style={{ background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 18, overflow: 'hidden' }}>{rows}</div>;
            const subhead = (t) => <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: TX.ink3, margin: '0 2px 6px' }}>{t}</div>;
            return (
              <React.Fragment>
                {warm.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {subhead(window.t('Warm-up'))}
                    {card(warm.map((ex, i) => Row(ex, '~', i === 0)))}
                  </div>
                )}
                <div style={{ marginTop: warm.length ? 14 : 10 }}>
                  {warm.length > 0 && subhead(window.t('Workout'))}
                  {card(work.map((ex, i) => Row(ex, i + 1, i === 0)))}
                </div>
              </React.Fragment>
            );
          })()}
        </div>

        <div style={{ height: 16 }}/>
      </div>
    </Screen>

      <div style={{ position: 'absolute', left: 20, right: 20, bottom: window.STRIDE_NATIVE ? 'calc(env(safe-area-inset-bottom) + 20px)' : 30, zIndex: 20 }}>
        <StrideButton variant="accent" block size="lg" icon="play" onClick={() => go('active')}>
          Start session
        </StrideButton>
      </div>
    </>
  );
}


// ────────────────────────────────────────────────────────────────────
// ACTIVE WORKOUT — step through, with an optional automatic rest timer
// ────────────────────────────────────────────────────────────────────
function ActiveWorkoutScreen({ go, auto, setAuto }) {
  // Guard BEFORE any hooks (the body derefs w.exercises between hooks). w is a
  // stable module global per instance, so the hook count stays consistent.
  const w = window.STRIDE_ACTIVE_WORKOUT || window.STRIDE_TODAYS_WORKOUT;
  if (!w) { setTimeout(function () { go('home'); }, 0); return null; }
  // Persist in-progress state so closing the app mid-workout never discards it.
  // Keyed to the session so a different session won't restore stale progress.
  const PROGRESS_KEY = 'stride_active_progress';
  const saved = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (s && w.id != null && s.sessionId === w.id) return s;
    } catch (e) {}
    return null;
  })();
  const [exIdx, setExIdx] = React.useState(saved ? (saved.exIdx || 0) : 0);
  const [setIdx, setSetIdx] = React.useState(saved ? (saved.setIdx || 0) : 0);
  // Rest countdown. `restEndsAt` is a wall-clock timestamp so a backgrounded
  // webview (locked phone) keeps losing real seconds instead of stalling; while
  // the timer is disarmed `restLeft` holds the frozen remainder.
  const [resting, setResting] = React.useState(saved ? !!saved.resting : false);
  const [restLeft, setRestLeft] = React.useState(saved && saved.restLeft != null ? saved.restLeft : 0);
  const [restTotal, setRestTotal] = React.useState(saved && saved.restTotal != null ? saved.restTotal : 0);
  const [restEndsAt, setRestEndsAt] = React.useState(saved && saved.restEndsAt != null ? saved.restEndsAt : null);
  const [completedSets, setCompletedSets] = React.useState(saved ? (saved.completedSets || {}) : {}); // {exId-setIdx: {reps, kg}}
  const [formRatings, setFormRatings] = React.useState(saved ? (saved.formRatings || {}) : {}); // {exId: 1–5 form score}
  const [paused, setPaused] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(saved && saved.elapsed != null ? saved.elapsed : 0);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [coachOpen, setCoachOpen] = React.useState(false);
  const [exitOpen, setExitOpen] = React.useState(false);   // leaving mid-session

  // In-workout personal records: detect a new best right after a set is logged,
  // auto-save it (linked to the library exercise), and celebrate it.
  const [earnedPrs, setEarnedPrs] = React.useState([]); // [{exId,name,display,prev,isFirst,savedId}]
  const [activePr, setActivePr] = React.useState(null); // the one currently celebrated
  const prFired = React.useRef(new Set());              // set keys already checked (double-tap guard)
  const sessionBest = React.useRef({});                 // exId → { score, earned } best THIS session
  const earnedRef = React.useRef([]);                   // sync mirror for STRIDE_LAST_PRS
  React.useEffect(() => { earnedRef.current = []; window.STRIDE_LAST_PRS = []; }, []);

  // A resumed session restores its own auto setting (the app-level value is just
  // the last one used, which may have come from a different workout).
  React.useEffect(() => {
    if (saved && typeof saved.auto === 'boolean' && saved.auto !== auto) setAuto(saved.auto);
  }, []);

  // Tell the backend the session has started, so progress is tracked server-side
  // (mirrors the local app). Idempotent + fire-and-forget; also runs on resume.
  React.useEffect(() => { if (w.id != null && window.__strideStartSession) window.__strideStartSession(w.id); }, []);

  // Save progress (position, logged sets, form scores) on every meaningful change,
  // so quitting mid-workout resumes exactly where you left off. Real sessions only.
  const finishedRef = React.useRef(false);
  React.useEffect(() => {
    if (w.id == null || finishedRef.current) return; // mock/demo, or already finished
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        sessionId: w.id, exIdx, setIdx, completedSets, formRatings, elapsed,
        auto, resting, restLeft, restTotal, restEndsAt, ts: Date.now(),
      }));
    } catch (e) {}
  }, [exIdx, setIdx, completedSets, formRatings, auto, resting, restEndsAt]);

  // Live coach edits can shrink the session mid-workout (remove_set /
  // remove_exercise) — clamp the pointers before dereferencing, then sync state.
  const exIdxC = Math.min(exIdx, w.exercises.length - 1);
  const ex = w.exercises[exIdxC];
  const setIdxC = Math.min(setIdx, ex.sets.length - 1);
  React.useEffect(() => {
    if (exIdxC !== exIdx) setExIdx(exIdxC);
    if (setIdxC !== setIdx) setSetIdx(setIdxC);
  }, [exIdxC, setIdxC, exIdx, setIdx]);
  const curSet = ex.sets[setIdxC];
  const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0);
  const completedSoFar = w.exercises.slice(0, exIdxC).reduce((s, e) => s + e.sets.length, 0) + setIdxC;
  const progress = completedSoFar / totalSets;

  // Rest countdown — ticks off the wall clock while the timer is armed and the
  // session isn't paused. At zero it just closes: the set pointer already moved
  // forward when the set was logged, so the next set is waiting underneath.
  React.useEffect(() => {
    if (!resting || !auto || paused || restEndsAt == null) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.round((restEndsAt - Date.now()) / 1000));
      setRestLeft(left);
      if (left <= 0) setResting(false);
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [resting, auto, paused, restEndsAt]);

  // Arm / disarm the automatic timer. Disarming freezes an open countdown where
  // it stands (the remaining seconds stay on screen); arming resumes from there.
  const toggleAuto = () => {
    if (auto) {
      if (resting && restEndsAt != null) setRestLeft(Math.max(0, Math.round((restEndsAt - Date.now()) / 1000)));
      setRestEndsAt(null);
      setAuto(false);
    } else {
      if (resting) setRestEndsAt(Date.now() + Math.max(0, restLeft) * 1000);
      setPaused(false);   // arming while the session clock is paused would leave it frozen
      setAuto(true);
    }
  };

  // Start this set's rest (only ever called while armed).
  const startRest = (seconds) => {
    setRestTotal(seconds);
    setRestLeft(seconds);
    setRestEndsAt(Date.now() + seconds * 1000);
    setResting(true);
  };

  // ±15s moves both the end time and the ring's full-circle reference, so the
  // arc can never overshoot.
  const nudgeRest = (delta) => {
    setRestTotal(t => Math.max(1, t + delta));
    if (auto && restEndsAt != null) {
      setRestEndsAt(e => Math.max(Date.now(), e + delta * 1000));
    } else {
      setRestLeft(l => Math.max(0, l + delta));
    }
  };

  // Skipping the rest is taking over — the timer disarms until you arm it again.
  const skipRest = () => {
    setResting(false);
    setRestEndsAt(null);
    setAuto(false);
  };

  // Session elapsed
  React.useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setElapsed(e => e + 1), 1000);
    return () => clearTimeout(t);
  }, [elapsed, paused]);

  const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Detect + auto-save a personal record from the set just logged. No-op unless the
  // exercise links to the catalogue (live sessions) and the set beats the prior best.
  const detectPr = (curEx, setPrescription, entry, setKey) => {
    if (!curEx) return;
    // Warm-up sets count too: if the numbers beat the record on file, it's a PR
    // whatever the set is labelled.
    if (!Array.isArray(window.STRIDE_PRS)) return;               // PRs not loaded → avoid false "firsts"
    if (prFired.current.has(setKey)) return;                     // this SET already fired (double-tap guard)
    const cand = window.strideDetectPr && window.strideDetectPr(curEx, entry, window.STRIDE_PRS);
    if (!cand) return;
    // Beat this session's own best too: /personal-records refreshes asynchronously,
    // so STRIDE_PRS may not carry the record earned two sets ago yet.
    const bestHere = sessionBest.current[curEx.id];
    if (bestHere != null && cand.score <= bestHere.score) return;
    prFired.current.add(setKey);                                 // optimistic — blocks double-tap re-fire
    const pr = {
      exercise_id: cand.exercise_id, label: curEx.name, metric_type: cand.metric_type,
      metrics: cand.metrics, achieved_on: todayIso(), source: 'workout',
      form_quality: formRatings[curEx.id] != null ? formRatings[curEx.id] : null,
    };
    const earned = {
      exId: curEx.id, name: curEx.name, display: window.strideFormatPr(pr),
      // A better set later in the same session beats THIS session's record, not
      // the one it already replaced.
      prev: bestHere ? bestHere.earned.display : cand.beats.old,
      isFirst: cand.isFirst && !bestHere, savedId: null, _pr: pr,
    };
    // One record per exercise per session: a better set supersedes the earlier
    // one (both in the recap and on the server) instead of stacking up.
    if (bestHere) {
      const old = bestHere.earned;
      if (old.savedId != null && window.__strideDeletePr) window.__strideDeletePr(old.savedId).catch(() => {});
      old.superseded = true;
      earnedRef.current = earnedRef.current.filter(e => e !== old);
    }
    sessionBest.current[curEx.id] = { score: cand.score, earned };
    earnedRef.current = [...earnedRef.current, earned];
    window.STRIDE_LAST_PRS = earnedRef.current;
    setEarnedPrs(earnedRef.current);
    setActivePr(earned);
    if (window.__strideSavePr) window.__strideSavePr(pr).then(rec => {
      if (rec && rec.id != null) {
        earned.savedId = rec.id;
        // Superseded before the save came back — drop the row we just created.
        if (earned.superseded && window.__strideDeletePr) window.__strideDeletePr(rec.id).catch(() => {});
        setEarnedPrs([...earnedRef.current]);
      }
    }).catch(() => {});
  };

  const undoPr = (earned) => {
    if (earned.savedId != null && window.__strideDeletePr) window.__strideDeletePr(earned.savedId).catch(() => {});
    earned.superseded = true;                                    // in case the save is still in flight
    earnedRef.current = earnedRef.current.filter(e => e !== earned);
    window.STRIDE_LAST_PRS = earnedRef.current;
    setEarnedPrs(earnedRef.current);
    if (sessionBest.current[earned.exId] && sessionBest.current[earned.exId].earned === earned) {
      delete sessionBest.current[earned.exId];                   // let a later set re-earn
    }
    setActivePr(a => (a === earned ? null : a));
  };

  // vals = the panel's edited { reps, kg } — log what the user actually did,
  // not the prescription (falls back to it when nothing was edited).
  const completeSet = (vals) => {
    const key = `${ex.id}-${setIdxC}`;
    const entry = {
      reps: vals && vals.reps != null ? vals.reps : curSet.reps,
      kg: vals && vals.kg != null ? vals.kg : curSet.kg,
      band: vals && vals.band != null ? vals.band : (curSet.band != null ? curSet.band : null),
      ts: Date.now(),
    };
    const nextLog = { ...completedSets, [key]: entry };
    setCompletedSets(nextLog);
    // Save this set to the backend on the fly (metric-keyed), so progress mirrors
    // the local app and survives across devices. Fire-and-forget.
    if (window.__strideLogSet && w.id != null && curSet && curSet.id != null) {
      const metrics = strideIsHold(ex) ? { seconds: entry.reps } : { reps: entry.reps };
      if (!strideIsHold(ex) && entry.kg) metrics.weight_kg = entry.kg;
      if (entry.band) metrics.band_kg = entry.band;
      window.__strideLogSet(w.id, curSet.id, { is_done: true, metrics });
    }
    detectPr(ex, curSet, entry, key); // celebrate a PR before advancing
    // Advance
    if (setIdxC < ex.sets.length - 1) {
      if (auto && curSet.rest) startRest(curSet.rest);
      setSetIdx(setIdxC + 1);
    } else if (exIdxC < w.exercises.length - 1) {
      if (auto && curSet.rest) startRest(curSet.rest);
      setExIdx(exIdxC + 1);
      setSetIdx(0);
    } else {
      // done — mark today's training complete, then show the summary
      // Date-stamped so Home's done card self-expires tomorrow.
      const iso = todayIso();
      try { localStorage.setItem('stride_today_done', iso); } catch (e) {}
      window.STRIDE_LAST_WORKOUT = w;               // the summary reads THIS session
      window.STRIDE_LAST_FORM_RATINGS = formRatings; // summary reads per-exercise form scores
      window.STRIDE_LAST_SET_LOG = nextLog; // summary reads actual logged reps/kg
      // Persist the log so Recap works after leaving/reopening the app.
      try { localStorage.setItem('stride_last_log', JSON.stringify({ sessionId: w.id || null, log: nextLog, ratings: formRatings, ts: iso })); } catch (e) {}
      finishedRef.current = true;
      try { localStorage.removeItem(PROGRESS_KEY); } catch (e) {} // session finished — clear resume state
      // Tell the backend it's done so Plan/Home stop showing the "start" card (even
      // if the athlete closes the summary without saving RPE/notes).
      if (window.__strideCompleteSession) window.__strideCompleteSession(w.id, {});
      go('summary');
    }
  };

  // Finish the session where it stands — the sets you logged count, the rest simply
  // don't. Same bookkeeping as reaching the end naturally (backend complete, Recap
  // log persisted, resume state cleared), so the summary and Home agree.
  const finishEarly = () => {
    finishedRef.current = true;
    const iso = todayIso();
    window.STRIDE_LAST_WORKOUT = w;              // the summary reads THIS session
    window.STRIDE_LAST_SET_LOG = completedSets;
    window.STRIDE_LAST_FORM_RATINGS = formRatings;
    try {
      localStorage.setItem('stride_today_done', iso);
      localStorage.setItem('stride_last_log', JSON.stringify({ sessionId: w.id || null, log: completedSets, ratings: formRatings, ts: iso }));
    } catch (e) {}
    window.strideClearProgress();
    if (w.id != null && window.__strideCompleteSession) window.__strideCompleteSession(w.id, {});
    go('summary');
  };

  const goNext = () => {
    if (setIdxC < ex.sets.length - 1) setSetIdx(setIdxC + 1);
    else if (exIdxC < w.exercises.length - 1) { setExIdx(exIdxC + 1); setSetIdx(0); }
  };

  // Undo / step back — returns to the previous set and clears its logged result,
  // so an accidental "Set complete" can be reversed.
  const canGoBack = exIdxC > 0 || setIdxC > 0;
  const goBack = () => {
    if (!canGoBack) return;
    setResting(false);
    setRestEndsAt(null);
    let pExIdx = exIdxC, pSetIdx = setIdxC;
    if (setIdxC > 0) pSetIdx = setIdxC - 1;
    else { pExIdx = exIdxC - 1; pSetIdx = w.exercises[exIdxC - 1].sets.length - 1; }
    // Step back to REVIEW or redo a set — the logged reps/kg stay (the panel
    // prefills them, and logging again overwrites). Deleting them here is how a
    // whole set's work used to vanish on a mis-tap of the back arrow.
    const key = `${w.exercises[pExIdx].id}-${pSetIdx}`;
    prFired.current.delete(key);                                 // redoing the set may earn a PR again
    setExIdx(pExIdx);
    setSetIdx(pSetIdx);
  };

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{
      background: TX.ink, color: '#fff', width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      paddingTop: window.STRIDE_SAFE_TOP, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{ padding: '14px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconBtn icon="close" onClick={() => setExitOpen(true)} bg="#222" color="#fff" border="#333" size={36}/>
        <div style={{ textAlign: 'center' }}>
          {/* Arms the automatic rest timer: on = logging a set starts its rest. */}
          <button
            onClick={toggleAuto}
            aria-label="Automatic rest timer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
              background: auto ? TX.volt : '#ffffff12', border: `1px solid ${auto ? TX.volt : '#333'}`,
              borderRadius: 999, padding: '3px 9px',
              fontFamily: 'Inter', fontSize: 10, color: auto ? TX.ink : '#bbb',
              textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700,
            }}>
            <StrideIcon name={auto ? 'timer' : 'pause'} size={11} color={auto ? TX.ink : '#bbb'}/>
            {auto ? window.t('Auto rest') : window.t('Auto off')}
          </button>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16, marginTop: 2 }}>{fmt(elapsed)}{w.kind ? ` · ${w.kind}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCoachOpen(true)} aria-label="Chat with coach" style={{
            position: 'relative', width: 36, height: 36, borderRadius: 18, cursor: 'pointer',
            background: TX.volt, border: 'none', display: 'grid', placeItems: 'center',
          }}>
            <StrideIcon name="chat" size={18} color={TX.ink}/>
          </button>
          <IconBtn icon={paused ? 'play' : 'pause'} onClick={() => setPaused(p => !p)} bg="#222" color="#fff" border="#333" size={36}/>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 18px' }}>
        <div style={{ height: 4, borderRadius: 4, background: '#222', overflow: 'hidden', display: 'flex' }}>
          {w.exercises.map((e, i) => (
            <div key={i} style={{ flex: e.sets.length, marginRight: i < w.exercises.length - 1 ? 2 : 0, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: i < exIdxC ? '100%' : (i === exIdxC ? `${(setIdxC / e.sets.length) * 100}%` : '0%'),
                height: '100%', background: TX.volt, transition: 'width .4s',
              }}/>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 11, color: '#888', fontWeight: 600 }}>
          <span>Exercise {exIdxC+1} / {w.exercises.length}</span>
          <span>Set {setIdxC+1} / {ex.sets.length}</span>
        </div>
      </div>

      {/* Resting screen */}
      {resting && (
        <RestPanel
          left={restLeft}
          total={restTotal}
          paused={!auto}
          onTogglePause={toggleAuto}
          next={ex.sets[setIdxC]}
          nextEx={ex.name}
          nextHold={strideIsHold(ex)}
          onSkip={skipRest}
          onAdd={() => nudgeRest(15)}
          onSub={() => nudgeRest(-15)}
          onUndo={canGoBack ? goBack : null}
          pr={activePr}
          onUndoPr={undoPr}
          onDismissPr={() => setActivePr(null)}
        />
      )}

      {/* No-rest celebration (timer disarmed, or a set with no prescribed rest) */}
      {!resting && activePr && (
        <PrCelebration variant="toast" earned={activePr} onUndo={undoPr} onDismiss={() => setActivePr(null)}/>
      )}

      {!resting && (
        <ActiveExercisePanel
          ex={ex}
          setIdx={setIdxC}
          completedSets={completedSets}
          formScore={formRatings[ex.id]}
          onRateForm={(v) => setFormRatings((prev) => ({ ...prev, [ex.id]: v }))}
          onComplete={completeSet}
          onNext={goNext}
          onBack={goBack}
          canGoBack={canGoBack}
          canGoNext={exIdxC < w.exercises.length - 1 || setIdxC < ex.sets.length - 1}
          onOpenDetails={() => setDetailOpen(true)}
          onFinish={() => setExitOpen(true)}
        />
      )}

      {/* Leaving mid-session: keep going, pause it for later, or finish it here. */}
      {exitOpen && window.Sheet && (
        <window.Sheet title={window.t('Leave or finish?')} onClose={() => setExitOpen(false)}>
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.55, color: TX.ink2, marginBottom: 16 }}>
              {window.t('{done} of {total} sets logged. Leave it open and pick up from the Today card, or finish now — what you logged counts, the rest is simply not counted.', {
                done: Object.keys(completedSets).length,
                total: w.exercises.reduce((n, e) => n + e.sets.length, 0),
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StrideButton variant="volt" icon="play" block onClick={() => setExitOpen(false)}>Keep training</StrideButton>
              <StrideButton variant="ghost" icon="pause" block onClick={() => { setExitOpen(false); go('home'); }}>Leave — resume later</StrideButton>
              <StrideButton variant="primary" icon="check" block onClick={() => { setExitOpen(false); finishEarly(); }}>Finish early</StrideButton>
            </div>
          </div>
        </window.Sheet>
      )}

      {detailOpen && window.Sheet && (
        <window.Sheet title={ex.name} onClose={() => setDetailOpen(false)}>
          <ActiveExerciseDetail ex={ex} />
        </window.Sheet>
      )}

      {coachOpen && window.Sheet && (
        <window.Sheet title="Coach" onClose={() => setCoachOpen(false)}>
          <SessionCoachChat workout={w} ex={ex} exIdx={exIdxC} setIdx={setIdxC} onClose={() => setCoachOpen(false)}/>
        </window.Sheet>
      )}
    </div>
  );
}

// A just-earned personal record. `variant='banner'` sits inside the rest screen;
// `variant='toast'` floats over the exercise panel when no rest runs. Auto-dismisses.
function PrCelebration({ earned, variant, onUndo, onDismiss }) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [earned]);
  if (!earned) return null;
  const title = earned.isFirst ? window.t('First record') : window.t('New PR!');
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: TX.volt, color: TX.ink, borderRadius: 16, padding: '12px 14px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.14)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <StrideIcon name="flame" size={22} color={TX.ink}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{earned.name} · {earned.display}</div>
        {!earned.isFirst && earned.prev && (
          <div style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, opacity: 0.75, marginTop: 1 }}>{window.t('Beat {old}', { old: earned.prev })}</div>
        )}
      </div>
      <button onClick={() => onUndo(earned)} style={{
        border: 'none', background: 'rgba(0,0,0,0.14)', color: TX.ink, cursor: 'pointer',
        fontFamily: 'Inter', fontWeight: 800, fontSize: 12.5, padding: '8px 12px', borderRadius: 10, flexShrink: 0,
      }}>{window.t('Undo')}</button>
    </div>
  );
  if (variant === 'toast') {
    return (
      <div style={{ position: 'absolute', left: 14, right: 14, top: 'calc(70px + ' + (window.STRIDE_SAFE_TOP || 0) + 'px)', zIndex: 50 }}>
        {inner}
      </div>
    );
  }
  return <div style={{ width: '100%' }}>{inner}</div>;
}

function RestPanel({ left, total, paused, onTogglePause, next, nextEx, nextHold, onSkip, onAdd, onSub, onUndo, pr, onUndoPr, onDismissPr }) {
  const pct = total ? Math.max(0, Math.min(1, left / total)) : 0;
  const stepBtn = { width: 60, height: 60, borderRadius: 14, background: '#222', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 };
  return (
    <div style={{ padding: '12px 18px 24px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Middle — timer + up next */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: paused ? '#888' : TX.volt, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Rest</div>
        {/* The whole ring is the pause/resume control — no extra button to hunt for. */}
        <button
          onClick={onTogglePause}
          aria-label={paused ? 'Resume the rest timer' : 'Pause the rest timer'}
          style={{ position: 'relative', width: 230, height: 230, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <svg width="230" height="230" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="115" cy="115" r="104" stroke="#222" strokeWidth="6" fill="none"/>
            <circle cx="115" cy="115" r="104" stroke={paused ? '#555' : TX.volt} strokeWidth="6" fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 104}
              strokeDashoffset={2 * Math.PI * 104 * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 80, color: paused ? '#888' : '#fff', letterSpacing: -3, lineHeight: 1 }}>
                {Math.floor(left/60)}:{String(left % 60).padStart(2, '0')}
              </div>
              {paused ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <StrideIcon name="play" size={14} color={TX.volt}/>
                  <span style={{ fontFamily: 'Inter', fontSize: 12, color: TX.volt, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Paused · tap to resume</span>
                </div>
              ) : (
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginTop: 6 }}>of {Math.floor(total/60)}:{String(total % 60).padStart(2,'0')}</div>
              )}
            </div>
          </div>
        </button>

        {pr && <PrCelebration variant="banner" earned={pr} onUndo={onUndoPr} onDismiss={onDismissPr}/>}

        <div style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: '#1a1a1a', borderRadius: 14, textAlign: 'left' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Up next</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 16, marginTop: 4 }}>{nextEx}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#bbb', marginTop: 2 }}>
            {next.kind} · {next.reps} {nextHold ? 's hold' : 'reps'} · {next.kg || '—'}{next.kg ? ' kg' : ''}
          </div>
        </div>
      </div>

      {/* Bottom — ±15s rest steppers + skip + undo, all in one row, matching radii */}
      <div style={{ display: 'flex', gap: 8 }}>
        {onUndo && (
          <button onClick={onUndo} aria-label="Undo last set" style={stepBtn}>
            <StrideIcon name="arrowLeft" size={22} color="#fff"/>
          </button>
        )}
        <button onClick={onSub} aria-label="Subtract 15 seconds" style={stepBtn}>
          <div style={{ textAlign: 'center' }}>
            <StrideIcon name="minus" size={20} color="#fff" style={{ margin: '0 auto' }}/>
            <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, color: '#888', marginTop: 1 }}>15s</div>
          </div>
        </button>
        <StrideButton variant="volt" size="lg" style={{ flex: 1 }} onClick={onSkip}>Skip rest</StrideButton>
        <button onClick={onAdd} aria-label="Add 15 seconds" style={stepBtn}>
          <div style={{ textAlign: 'center' }}>
            <StrideIcon name="plus" size={20} color="#fff" style={{ margin: '0 auto' }}/>
            <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, color: '#888', marginTop: 1 }}>15s</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// True when the exercise logs a timed hold (seconds), not repetitions. Prefers
// the exercise's declared metrics list, then the API's metric_type, then the
// library catalogue, then name keywords (oldest payloads).
function strideIsHold(ex) {
  if (ex && Array.isArray(ex.metrics)) return ex.metrics.indexOf('seconds') !== -1;
  if (ex && ex.metricType) return ex.metricType === 'hold';
  const n = String((ex && ex.name) || ex || '').trim().toLowerCase();
  const hit = (window.STRIDE_EXERCISES || []).find((e) => String(e.name || '').toLowerCase() === n);
  if (hit) return hit.metricType === 'hold';
  return /(hold|lever|planche|l-sit|plank|handstand|flag|hang)/.test(n);
}

// Band-assisted / band-resisted work (band front lever, banded planche, band
// rotations…) additionally logs the band's pull (kg) in the stretched position.
function strideIsBanded(ex) {
  if (ex && Array.isArray(ex.metrics)) return ex.metrics.indexOf('band_kg') !== -1;
  return /band/i.test(String((ex && ex.name) || ex || ''));
}

// A single, always-positive "volume" for a session that works for lifting AND
// calisthenics. Reps-equivalent, over completed working sets only (from `log`):
//   hold  → seconds / 3   (a ~3s isometric ≈ one rep of work; seconds live in log.reps)
//   else  → reps × (1 + kg / bodyweight)  (bodyweight reps = reps; weighted counts more)
function strideSessionVolume(w, log, bw) {
  const bodyweight = bw && bw > 0 ? bw : 75;
  let vol = 0;
  (w.exercises || []).forEach((ex) => {
    if (ex.section === 'warmup') return; // warm-up group doesn't count toward volume
    const hold = strideIsHold(ex);
    ex.sets.forEach((st, i) => {
      if (st.kind === 'Warm-up') return;
      const l = log[`${ex.id}-${i}`];
      if (!l) return;
      if (hold) vol += (l.reps || 0) / 3; // reps field carries seconds for holds
      else vol += (l.reps || 0) * (1 + (l.kg || 0) / bodyweight);
    });
  });
  return Math.round(vol);
}

function ActiveExercisePanel({ ex, setIdx, completedSets, formScore, onRateForm, onComplete, onNext, onBack, canGoBack, canGoNext, onOpenDetails, onFinish }) {
  const curSet = ex.sets[setIdx];
  const isHold = strideIsHold(ex);
  const isBanded = strideIsBanded(ex);
  // Pure-bodyweight exercises (metrics === ['reps']) don't log weight at all.
  const hasWeight = Array.isArray(ex.metrics) ? ex.metrics.indexOf('weight_kg') !== -1 : true;
  const [reps, setReps] = React.useState(curSet.reps);
  const [kg, setKg] = React.useState(curSet.kg);
  const [band, setBand] = React.useState(curSet.band || 0);

  React.useEffect(() => {
    // Re-visiting an already-logged set (undo / step back) restores what was
    // logged, so the steppers don't silently reset to the prescription.
    const logged = completedSets[`${ex.id}-${setIdx}`];
    setReps(logged && logged.reps != null ? logged.reps : curSet.reps);
    setKg(logged && logged.kg != null ? logged.kg : curSet.kg);
    setBand(logged && logged.band != null ? logged.band : (curSet.band || 0));
  }, [setIdx, ex.id]);

  return (
    <div style={{ padding: '20px 18px 24px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Exercise header — tap to open details */}
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <Chip bg="#ffffff14" ink={TX.volt} color={TX.volt} dot style={{ textTransform: 'uppercase' }}>{ex.section === 'warmup' ? window.t('Warm-up') : curSet.kind}</Chip>
        <button onClick={onOpenDetails} style={{
          display: 'block', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <h1 style={{ margin: '12px 0 6px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 30, letterSpacing: -1, color: '#fff', lineHeight: 1 }}>{ex.name.toUpperCase()}</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#ffffff14', borderRadius: 999, padding: '5px 11px' }}>
            <StrideIcon name="info" size={13} color="#bbb"/>
            <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700, color: '#bbb' }}>Exercise details</span>
          </span>
        </button>
      </div>

      {/* Middle — reps & kg steppers, centered */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <NumberStepper label={isHold ? 'Seconds' : 'Reps'} value={reps} unit={curSet.kind === 'AMRAP' ? (isHold ? 'MAX' : 'AMRAP') : ''} onChange={setReps}/>
        {(hasWeight || isBanded) && <div style={{ width: 120, height: 1, background: '#222' }}/>}
        {isBanded && hasWeight ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <NumberStepper label="kg" value={kg} step={0.1} onChange={setKg} size={40}/>
            <div style={{ width: 1, height: 56, background: '#222' }}/>
            <NumberStepper label="Band kg" value={band} step={0.1} onChange={setBand} size={40}/>
          </div>
        ) : isBanded ? (
          <NumberStepper label="Band kg" value={band} step={0.1} onChange={setBand}/>
        ) : hasWeight ? (
          <NumberStepper label="kg" value={kg} step={0.1} onChange={setKg}/>
        ) : null}
      </div>

      {/* Coach note */}
      {ex.note && (
        <div style={{ padding: '10px 14px', background: '#1a1a1a', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <StrideIcon name="info" size={16} color={TX.volt}/>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#ddd', flex: 1 }}>{ex.note}</div>
        </div>
      )}

      {/* Form score 1–5 — rate this exercise's technique, tap again to clear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#1a1a1a', borderRadius: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Form</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11, color: formScore ? TX.volt : '#666', fontWeight: 600, marginTop: 1 }}>
            {formScore ? `${formScore}/5` : 'Rate 1–5'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((v) => {
            const sel = formScore === v;
            const lit = formScore != null && v <= formScore;
            return (
              <button key={v} onClick={() => onRateForm(sel ? null : v)} aria-label={`Form score ${v}`} style={{
                width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: sel ? TX.volt : '#222',
                color: sel ? TX.ink : (lit ? TX.volt : '#888'),
                fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 14,
              }}>{v}</button>
            );
          })}
        </div>
      </div>

      {/* Sets timeline — directly above the controls */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ width: 92, flexShrink: 0 }}/>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{isHold ? 'Sets · secs × kg' : 'Sets · reps × kg'}</div>
          {/* Stop here and keep what's logged — no need to walk the rest of the plan. */}
          <button onClick={onFinish} style={{
            width: 92, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4,
          }}>Finish early</button>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {ex.sets.map((s, i) => {
            const done = completedSets[`${ex.id}-${i}`];
            const cur = i === setIdx;
            const isAmrap = s.kind === 'AMRAP' || !s.reps;
            return (
              <div key={i} style={{
                flex: 1, minWidth: 0, height: 44, borderRadius: 12,
                background: cur ? TX.volt : (done ? '#16A34A' : '#222'),
                color: cur ? TX.ink : '#fff',
                display: 'grid', placeItems: 'center', lineHeight: 1.05,
                fontFamily: 'Archivo, sans-serif', fontWeight: 800,
              }}>
                {done ? (
                  <span style={{ fontSize: 16 }}>✓</span>
                ) : cur ? (
                  <span style={{ fontSize: 12, letterSpacing: 0.5 }}>NOW</span>
                ) : s.kind === 'Warm-up' ? (
                  <span style={{ fontSize: 11, letterSpacing: 0.3 }}>WARM</span>
                ) : isAmrap ? (
                  <span style={{ fontSize: 10.5, letterSpacing: 0.2 }}>AMRAP</span>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14 }}>{s.reps}{isHold ? 's' : ''}</div>
                    {s.kg ? <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.65, marginTop: 1 }}>{s.kg}kg</div> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA row — one flow: step back, log, step forward. The arrows only move
          the pointer; a set is never counted until "Log set". */}
      <div style={{ display: 'flex', gap: 8 }}>
        {canGoBack && (
          <button onClick={onBack} aria-label="Back a set" style={{
            width: 60, height: 60, borderRadius: 14, background: '#222', border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <StrideIcon name="arrowLeft" size={26} color="#fff"/>
          </button>
        )}
        <StrideButton variant="volt" size="lg" icon="check" style={{ flex: 1 }} onClick={() => onComplete({ reps, kg, band: isBanded ? band : null })}>
          Log set
        </StrideButton>
        {canGoNext && (
          <button onClick={onNext} aria-label="Next set" style={{
            width: 60, height: 60, borderRadius: 14, background: '#222', border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <StrideIcon name="arrowRight" size={26} color="#fff"/>
          </button>
        )}
      </div>
    </div>
  );
}

// Number field with ± buttons AND a typeable value: tapping the number opens the
// numeric keyboard so an odd weight (37.4 kg) doesn't need 74 taps of the stepper.
// While typing, the raw text is kept as-is (so "12." and "" stay editable) and only
// committed on blur/Enter; the steppers always work off the numeric value.
function NumberStepper({ label, value, onChange, step = 1, unit, size = 64 }) {
  const [draft, setDraft] = React.useState(null);          // null = not editing
  const decimals = step < 1 ? 1 : 0;
  // Weights land on 0.1 kg; reps/seconds stay whole numbers.
  const clean = (n) => Math.max(0, decimals ? Math.round(n * 10) / 10 : Math.round(n));
  const shown = value % 1 === 0 ? value : value.toFixed(decimals);

  const commit = (raw) => {
    setDraft(null);
    const n = parseFloat(String(raw).replace(',', '.'));   // SK keyboards type a comma
    if (!isNaN(n)) onChange(clean(n));
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onChange(clean(value - step))} style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid #333', background: '#1a1a1a', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <StrideIcon name="minus" size={16} color="#fff"/>
        </button>
        {unit ? (
          <div style={{ minWidth: size >= 64 ? 72 : 52, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: size, color: '#fff', letterSpacing: size >= 64 ? -2 : -1, lineHeight: 1 }}>
            {unit}
          </div>
        ) : (
          <input
            type="text" inputMode="decimal" enterKeyHint="done"
            aria-label={label}
            value={draft != null ? draft : String(shown)}
            onFocus={(e) => { setDraft(String(shown)); e.target.select(); }}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9.,]/g, ''))}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            style={{
              width: size >= 64 ? 96 : 64, padding: 0, textAlign: 'center',
              background: 'transparent', border: 'none', borderBottom: '1px dashed #3a3a3a', outline: 'none',
              fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: size, color: '#fff',
              letterSpacing: size >= 64 ? -2 : -1, lineHeight: 1.1, WebkitAppearance: 'none',
            }}
          />
        )}
        <button onClick={() => onChange(clean(value + step))} style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid #333', background: '#1a1a1a', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <StrideIcon name="plus" size={16} color="#fff"/>
        </button>
      </div>
    </div>
  );
}

// Read-only target value (the coach prescribes these).
function TargetReadout({ value, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginTop: 8 }}>{unit}</div>}
    </div>
  );
}

// Look up an exercise in the library tree (enriches with muscles/equipment/video).
// Session exercises carry the catalog id (`exerciseId`) — match on that first and
// only fall back to the name, which can drift (renames, AI-worded variants).
function findLibraryExercise(name, id) {
  const walk = (node) => {
    if (node.exercises) {
      const hit = node.exercises.find((e) => (id != null && e.id === id) || e.name === name);
      if (hit) return hit;
    }
    if (node.children) {
      for (const c of node.children) { const r = walk(c); if (r) return r; }
    }
    return null;
  };
  try { return walk(window.STRIDE_LIBRARY) || null; } catch (e) { return null; }
}

// Exercise details slideover. Used during an active session AND from the session
// detail sheet (planned/done sessions), so everything below tolerates a session
// exercise with no set list — then it degrades to "what is this movement".
function ActiveExerciseDetail({ ex, setsLabel }) {
  const lib = findLibraryExercise(ex.name, ex.exerciseId) || {};
  const [videoOpen, setVideoOpen] = React.useState(false);
  const sets = ex.sets || [];
  const muscles = [lib.primary, ...((lib.secondary || '').split(/[·,]/).map((s) => s.trim()).filter(Boolean))].filter(Boolean);
  const Label = ({ children }) => (
    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, color: TX.ink3, textTransform: 'uppercase', letterSpacing: 1.2, margin: '0 0 8px' }}>{children}</div>
  );
  const SpecRow = ({ label, children, first }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: first ? 'none' : `1px solid ${TX.lineSoft}` }}>
      <div style={{ width: 120, flexShrink: 0, fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, color: TX.ink3, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ flex: 1, textAlign: 'right', fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: TX.ink }}>{children}</div>
    </div>
  );
  const hasVideo = !!lib.video;
  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Hero — tap to watch the form clip when the catalog has one */}
      <div
        onClick={hasVideo ? () => setVideoOpen(true) : undefined}
        role={hasVideo ? 'button' : undefined}
        style={{
          height: 150, borderRadius: 16, background: `linear-gradient(135deg, ${TX.ink}, #2a2a2a)`, marginBottom: 14,
          position: 'relative', overflow: 'hidden', cursor: hasVideo ? 'pointer' : 'default',
        }}>
        <div style={{ position: 'absolute', right: -28, bottom: -18, opacity: 0.18 }}>
          <StrideIcon name="dumbbell" size={150} color={TX.volt}/>
        </div>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 14px)' }}/>
        {hasVideo && (
          <div style={{
            position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 54, height: 54, borderRadius: 27, background: 'rgba(0,0,0,0.35)',
            border: '1.5px solid rgba(255,255,255,0.55)', display: 'grid', placeItems: 'center',
          }}>
            <div style={{ marginLeft: 3 }}><StrideIcon name="play" size={24} color="#fff"/></div>
          </div>
        )}
        <div style={{ position: 'absolute', left: 14, bottom: 12, right: 14 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#fff', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            {hasVideo ? window.t('Tap to watch · Form video') : (ex.tag || 'Exercise')}
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', marginTop: 4, lineHeight: 1.1 }}>{ex.name}</div>
        </div>
      </div>

      {/* At a glance */}
      <div style={{ marginBottom: 16, borderRadius: 14, overflow: 'hidden', background: TX.surface, border: `1px solid ${TX.line}` }}>
        {muscles.length > 0 && <SpecRow label="Muscles involved" first>{muscles.join(', ')}</SpecRow>}
        {lib.equip && <SpecRow label="Equipment" first={muscles.length === 0}>{lib.equip}</SpecRow>}
        {ex.tag && <SpecRow label="Type">{ex.tag}</SpecRow>}
        {lib.diff && <SpecRow label="Difficulty">{lib.diff}</SpecRow>}
        {/* Sessions we couldn't load set-by-set still show their prescription. */}
        {!sets.length && ex.plannedSummary && <SpecRow label="Planned">{ex.plannedSummary}</SpecRow>}
      </div>

      {/* What the movement is (catalog description — freestyle tricks carry their own) */}
      {lib.description && (
        <div style={{ fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.55, color: TX.ink2, marginBottom: 16 }}>
          {lib.description}
        </div>
      )}

      {/* Coach note */}
      {ex.note && (
        <>
          <Label>Coach note</Label>
          <div style={{ background: TX.lineSoft, borderLeft: `3px solid ${TX.volt}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, color: TX.ink }}>
            {ex.note}{ex.videoCue ? <span style={{ color: TX.ink3 }}> · Tempo {ex.videoCue}</span> : null}
          </div>
        </>
      )}

      {/* Prescription — "Today's sets" in the player, "Planned sets" when previewing */}
      {sets.length > 0 && (<>
      <Label>{setsLabel || window.t("Today's sets")}</Label>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: TX.surface, border: `1px solid ${TX.line}`, marginBottom: 8 }}>
        {sets.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: i ? `1px solid ${TX.lineSoft}` : 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: TX.ink, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 700, color: s.kind === 'Working' ? TX.ink : TX.ink3 }}>{s.kind}</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13, color: TX.ink }}>
              {s.kind === 'AMRAP' ? (strideIsHold(ex) ? 'MAX hold' : 'AMRAP') : `${s.reps} ${strideIsHold(ex) ? 's hold' : 'reps'}${s.kg ? ` · ${s.kg} kg` : ''}${s.band ? ` · ${s.band} kg band` : ''}`}
            </div>
            {s.rest ? <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TX.ink3, width: 44, textAlign: 'right' }}>{Math.floor(s.rest / 60)}:{String(s.rest % 60).padStart(2, '0')}</div> : <div style={{ width: 44 }}/>}
          </div>
        ))}
      </div>
      </>)}

      {videoOpen && <FormVideoOverlay ex={lib} onClose={() => setVideoOpen(false)}/>}
    </div>
  );
}

// In-session coach chat slideover — LIVE adjustments to the running session.
// The real coach stages proposals (set_load/add_set/remove_set/remove_exercise/
// swap_exercise); Apply refreshes the active workout in place via the bridge.
function SessionCoachChat({ workout, ex, exIdx, setIdx, onClose }) {
  const persona = window.STRIDE_CURRENT_PERSONA || { name: 'Coach' };
  const live = !!window.__strideCoach;
  const [msgs, setMsgs] = React.useState([
    { who: 'ai', text: window.t('You’re mid-session — tell me what to adjust and I’ll stage it for your confirmation. e.g. “go lighter here”, “add a set”, “cut it short”.') },
  ]);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  const QUICK = ['Go lighter here', 'Add a set here', 'Swap this exercise', 'Cut it short'];

  const send = (text) => {
    const t = (text || input).trim();
    if (!t) return;
    setMsgs((m) => [...m, { who: 'me', text: t }]);
    setInput('');
    setTyping(true);
    if (!live) {
      // Browser demo without the API — canned acknowledgement only.
      setTimeout(() => {
        setTyping(false);
        setMsgs((m) => [...m, { who: 'ai', text: "Got it — I've updated today's session. You'll see the change on your next set." }]);
      }, 550);
      return;
    }
    // Anchor "here"/"this exercise" to where the athlete actually is.
    const prefix = window.t('[Mid-workout: {title} — on {ex}, exercise {i}/{n}, set {j}/{m}] ', {
      title: workout.title || workout.block || '', ex: ex.name,
      i: exIdx + 1, n: workout.exercises.length, j: setIdx + 1, m: ex.sets.length,
    });
    window.__strideCoach.send(prefix + t)
      .then((reply) => { setTyping(false); setMsgs((m) => [...m, reply]); })
      .catch(() => { setTyping(false); setMsgs((m) => [...m, { who: 'ai', text: window.t('Sorry — I couldn’t reach your coach just now.') }]); });
  };

  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Quick actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {QUICK.map((q) => (
          <button key={q} onClick={() => send(q)} style={{
            border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink, cursor: 'pointer',
            borderRadius: 999, padding: '8px 13px', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600,
          }}>{q}</button>
        ))}
      </div>

      {/* Thread — ChatBubble renders proposal cards with Apply/Dismiss */}
      <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
        {msgs.map((m, i) => <ChatBubble key={i} m={m} onCard={() => {}}/>)}
        {typing && <ChatBubble m={{ who: 'ai', text: '…', typing: true }}/>}
      </div>

      {/* Composer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 14, padding: '4px 4px 4px 14px' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
          placeholder={window.t('Ask {name}…', { name: persona.name })}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 14, color: TX.ink, padding: '10px 0' }}/>
        <button onClick={() => send(input)} aria-label="Send" style={{
          width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: input.trim() ? TX.ink : TX.lineSoft, display: 'grid', placeItems: 'center',
        }}>
          <StrideIcon name="send" size={17} color={input.trim() ? '#fff' : TX.ink3}/>
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// SUMMARY — post-workout
// ────────────────────────────────────────────────────────────────────
// Header copy scaled to what was logged — "Nice work." on two of seventeen sets
// reads as the app not paying attention.
const SUMMARY_TITLE = {
  full: 'Nice work.',
  most: 'Good session.',
  half: 'Half done.',
  short: 'Short one.',
};

function SummaryScreen({ go }) {
  // The session that was actually PLAYED — not today's scheduled one. Running a
  // different session (e.g. yesterday's Pull) must summarise that session.
  // Captured ONCE: finishing refreshes the STRIDE_* globals (the session is now
  // 'done', and one whose scheduled_date lags leaves STRIDE_TODAYS_WORKOUT null),
  // and re-reading them mid-summary blanked the screen.
  const [w] = React.useState(() =>
    window.STRIDE_LAST_WORKOUT || window.STRIDE_ACTIVE_WORKOUT || window.STRIDE_TODAYS_WORKOUT || null);
  const [feel, setFeel] = React.useState(4);
  const [rpe, setRpe] = React.useState(7);
  const [notes, setNotes] = React.useState('');
  React.useEffect(() => { if (!w) go('home'); }, [w]);
  if (!w) return null;

  // The in-memory log dies with the JS context — Recap from Home after
  // reopening the app restores it from the persisted copy (same session only).
  if (!window.STRIDE_LAST_SET_LOG) {
    try {
      const saved = JSON.parse(localStorage.getItem('stride_last_log') || 'null');
      if (saved && saved.sessionId != null && saved.sessionId === w.id) {
        window.STRIDE_LAST_SET_LOG = saved.log || {};
        window.STRIDE_LAST_FORM_RATINGS = saved.ratings || {};
      }
    } catch (e) {}
  }

  // Real numbers from what was logged during the session.
  const log = window.STRIDE_LAST_SET_LOG || {};
  const lastPrs = window.STRIDE_LAST_PRS || []; // records earned this session (read-only recap)
  const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets = Object.keys(log).length;
  // Unified session "volume" (reps-equivalent) — meaningful for calisthenics + lifting,
  // never a dead "0 kg" for a bodyweight/holds day.
  const volume = strideSessionVolume(w, log, (window.STRIDE_USER || {}).weightKg);

  return (
    <>
    <Screen>
      <StrideHeader title={SUMMARY_TITLE[window.strideCompletion(w, log).tier]} kicker={`${w.title || w.block || ''}${w.durationMin ? ` · ${w.durationMin} min` : ''}`} right={<IconBtn icon="close" onClick={() => go('home')}/>}/>
      <div style={{ padding: '0 20px' }}>
        <Card dark style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -50, top: -40, width: 180, height: 180, borderRadius: 180, background: TX.volt, opacity: 0.18, filter: 'blur(40px)' }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 72, color: '#fff', letterSpacing: -3, lineHeight: 1 }}>{volume.toLocaleString('en-US')}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#aaa', fontWeight: 700 }}>{window.t('volume')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #222' }}>
              <Stat label="Sets done" value={`${doneSets}/${totalSets}`}/>
              <Stat label="Exercises" value={w.exercises.length}/>
            </div>
          </div>
        </Card>

        {/* How did it feel */}
        <div style={{ marginTop: 22 }}>
          <SectionHeader title="How did it feel?"/>
          <Card style={{ padding: 14, marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[
                { v: 1, emoji: '😵', label: 'Wrecked' },
                { v: 2, emoji: '😣', label: 'Hard' },
                { v: 3, emoji: '😐', label: 'OK' },
                { v: 4, emoji: '💪', label: 'Solid' },
                { v: 5, emoji: '🔥', label: 'Crushed' },
              ].map(f => (
                <button key={f.v} onClick={() => setFeel(f.v)} style={{
                  background: feel === f.v ? TX.volt : TX.lineSoft, border: 'none', borderRadius: 14,
                  padding: '10px 0', flex: 1, margin: '0 3px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'background .15s',
                }}>
                  <span style={{ fontSize: 24 }}>{f.emoji}</span>
                  <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, color: TX.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>{f.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Records earned this session */}
        {lastPrs.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <SectionHeader title="Records set today"/>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lastPrs.map((pr, i) => (
                <Card key={i} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: TX.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <StrideIcon name="flame" size={22} color={TX.ink}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TX.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.name}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: 12, color: TX.ink3, marginTop: 1 }}>{pr.display}</div>
                  </div>
                  <Chip bg={TX.volt} style={{ fontSize: 9 }}>{pr.isFirst ? window.t('First record') : window.t('New PR!')}</Chip>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Per-exercise summary */}
        <div style={{ marginTop: 22 }}>
          <SectionHeader title="Set log"/>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {w.exercises.map(ex => <ExerciseSummaryRow key={ex.id} ex={ex}/>)}
          </div>
        </div>

        {/* RPE */}
        <div style={{ marginTop: 22 }}>
          <SectionHeader title={`Overall RPE: ${rpe}`}/>
          <Card style={{ padding: 16, marginTop: 10 }}>
            <input type="range" min="5" max="10" step="0.5" value={rpe} onChange={e => setRpe(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: TX.accent }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 10, color: TX.ink3, marginTop: 4 }}>
              <span>5 · Easy</span><span>7 · Hard</span><span>10 · Max</span>
            </div>
          </Card>
        </div>

        {/* Notes */}
        <div style={{ marginTop: 22 }}>
          <SectionHeader title="Notes for Coach"/>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{
            width: '100%', marginTop: 10, padding: 14, borderRadius: 14,
            border: `1px solid ${TX.line}`, background: TX.surface,
            fontFamily: 'Inter', fontSize: 13, color: TX.ink, resize: 'none', outline: 'none',
          }}/>
        </div>

        <div style={{ height: 16 }}/>
      </div>
    </Screen>

      <div style={{ position: 'absolute', left: 20, right: 20, bottom: window.STRIDE_NATIVE ? 'calc(env(safe-area-inset-bottom) + 20px)' : 30, zIndex: 20 }}>
        <StrideButton variant="primary" block size="lg" icon="check" onClick={() => {
          const done = window.__strideCompleteSession
            ? window.__strideCompleteSession(w.id, { rpe, notes: notes.trim() || null })
            : Promise.resolve();
          Promise.resolve(done).then(() => go('home')).catch(() => go('home'));
        }}>
          Save session
        </StrideButton>
      </div>
    </>
  );
}

function ExerciseSummaryRow({ ex }) {
  const form = (window.STRIDE_LAST_FORM_RATINGS || {})[ex.id];
  const isHold = strideIsHold(ex);
  const log = window.STRIDE_LAST_SET_LOG || {};
  const anyLogged = ex.sets.some((s, i) => log[`${ex.id}-${i}`]);
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14 }}>{ex.name}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {form ? <Chip bg={TX.ink} ink={TX.volt}>{window.t('Form {n}/5', { n: form })}</Chip> : null}
          {anyLogged
            ? <Chip bg={TX.green + '18'} ink={TX.green} dot color={TX.green}>Logged</Chip>
            : <Chip bg={TX.lineSoft} ink={TX.ink3}>Not logged</Chip>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ex.sets.map((s, i) => {
          // actual logged values from the session (falls back to prescription)
          const logged = (window.STRIDE_LAST_SET_LOG || {})[`${ex.id}-${i}`];
          const actualReps = logged && logged.reps != null ? logged.reps : s.reps;
          const actualKg = logged && logged.kg != null ? logged.kg : s.kg;
          const matched = s.kind === 'AMRAP' || !s.reps || actualReps >= s.reps;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '20px 1fr 1fr 56px', gap: 8, alignItems: 'center',
              padding: '6px 8px', borderRadius: 8,
              background: i % 2 === 0 ? TX.lineSoft : 'transparent',
            }}>
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: TX.ink3, fontWeight: 700 }}>{i+1}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: TX.ink3 }}>{s.kind}</span>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13 }}>
                {actualReps}{isHold ? 's' : ''} × {actualKg || '—'}{actualKg ? ' kg' : ''}{logged && logged.band ? ` · ${logged.band % 1 === 0 ? logged.band : logged.band.toFixed(1)} kg band` : ''}
              </span>
              {!logged
                ? <Chip bg={TX.lineSoft} ink={TX.ink3} style={{ fontSize: 9 }}>Skipped</Chip>
                : matched
                  ? <Chip bg={TX.green + '18'} ink={TX.green} style={{ fontSize: 9 }}>On target</Chip>
                  : <Chip bg={TX.amber + '18'} ink={TX.amber} style={{ fontSize: 9 }}>-{s.reps - actualReps}{isHold ? 's' : ' rep'}</Chip>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────
// AI CHAT
// ────────────────────────────────────────────────────────────────────
// Case- and accent-insensitive matching for the chat search — "trening" must
// find "tréning". Fold for comparisons; the pattern builder keeps <mark>
// highlighting working on the accented original text.
function strideFoldText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
const STRIDE_ACCENT_VARIANTS = { a: 'aáä', c: 'cč', d: 'dď', e: 'eé', i: 'ií', l: 'lĺľ', n: 'nň', o: 'oóô', r: 'rŕ', s: 'sš', t: 'tť', u: 'uú', y: 'yý', z: 'zž' };
function strideAccentPattern(q) {
  return String(q).split('').map((ch) => {
    const base = strideFoldText(ch);
    if (/^[a-z]$/.test(base)) return '[' + (STRIDE_ACCENT_VARIANTS[base] || base) + ']';
    return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
}

function strideChatGreeting() {
  return { who: 'ai', text: window.t("Morning. I'm your coach — ask me to adjust today's session (go lighter, swap a lift, add a set) or flag a niggle and I'll program around it.") };
}

// In-chat model switcher — only for BYOK users whose provider has >1 model.
// Switching persists on the conversation (bridge → PATCH .../model), so the
// choice sticks for later turns.
function StrideChatModelBar() {
  const ai = window.STRIDE_AI || {};
  const conn = ai.connection || {};
  const catalog = ai.catalog || { providers: [] };
  const coach = window.__strideCoach;
  const [open, setOpen] = React.useState(false);

  const cfg = (catalog.providers || []).find((p) => p.key === conn.provider);
  const models = (cfg && cfg.models) || [];
  const initial = (coach && coach.getModel && coach.getModel()) || conn.model || (cfg && cfg.default) || (models[0] && models[0].id) || null;
  const [model, setModel] = React.useState(initial);

  if (!conn.provider || conn.provider === 'free' || models.length < 2) return null;

  const current = models.find((m) => m.id === model);
  const pick = (id) => {
    setModel(id);
    setOpen(false);
    if (coach && coach.setModel) coach.setModel(id);
  };

  return (
    <div style={{ padding: '0 20px 10px', position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 999, padding: '6px 12px',
        fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12, color: TX.ink,
      }}>
        <StrideIcon name="sparkles" size={13} color={TX.ink2}/>
        <span>{current ? current.label : model}</span>
        <span style={{ color: TX.ink3, fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 20, zIndex: 20, minWidth: 200,
          background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 12,
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}>
          {models.map((m) => (
            <button key={m.id} onClick={() => pick(m.id)} style={{
              display: 'flex', width: '100%', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: m.id === model ? TX.lineSoft : 'transparent', border: 'none',
              padding: '11px 14px', textAlign: 'left',
              borderBottom: `1px solid ${TX.lineSoft}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TX.ink }}>{m.label}</div>
                {m.tier && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: TX.ink3, textTransform: 'capitalize' }}>{window.t(m.tier)}</div>}
              </div>
              {m.id === model && <StrideIcon name="check" size={15} color={TX.ink}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatScreen({ go, persona }) {
  // Desktop has no bottom nav to clear, and the sidebar replaces the Back link.
  const wide = useStrideWide();
  const [messages, setMessages] = React.useState(window.STRIDE_CHAT_SEED);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [changesOpen, setChangesOpen] = React.useState(false);   // "what I changed"
  const [changeSession, setChangeSession] = React.useState(null);
  const [input, setInput] = React.useState(() => {
    const pre = window.__stridePrefillChat;
    window.__stridePrefillChat = null;
    return pre || '';
  });
  const [typing, setTyping] = React.useState(false);
  const [sheetSession, setSheetSession] = React.useState(null);
  const [searching, setSearching] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const searchRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  const [showDown, setShowDown] = React.useState(false);

  React.useEffect(() => {
    if (searching && searchRef.current) searchRef.current.focus();
  }, [searching]);

  // Scroll-to-latest: track distance from the bottom, follow new messages when
  // already near the bottom, and open the chat at the latest message.
  const scrollToBottom = (smooth) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };
  const onChatScroll = () => {
    const el = scrollRef.current;
    if (el) setShowDown(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };
  React.useEffect(() => { scrollToBottom(false); }, []);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 320) scrollToBottom(false);
    onChatScroll();
  }, [messages, typing]);

  const q = strideFoldText(query.trim());
  const filtered = q
    ? messages.filter((m) => strideFoldText(m.text).includes(q)
        || (m.cards || []).some((c) => strideFoldText(`${c.title} ${c.subtitle || ''}`).includes(q))
        || (m.proposals || []).some((p) => strideFoldText(`${p.text} ${p.why || ''}`).includes(q)))
    : messages;
  const matchCount = q ? filtered.length : 0;

  // Fire (or re-fire) the coach call for one user message, keyed by its id so a
  // failure can be pinned to — and retried from — that exact bubble. The id goes
  // to the server too, so a retry of a message it already saved is not saved twice.
  const attempt = (t, id) => {
    setTyping(true);
    // The answer goes right under its message, even when a retry comes later.
    const answer = (reply) => setMessages(m => {
      const i = m.findIndex(x => x.id === id);
      const list = m.map(x => x.id === id ? { ...x, failed: false } : x);
      if (i < 0) return [...list, reply];
      return [...list.slice(0, i + 1), reply, ...list.slice(i + 1)];
    });
    // Live coach (real API) when bridged; otherwise fall back to the canned demo reply.
    if (window.__strideCoach) {
      window.__strideCoach.send(t, id)
        .then(reply => { setTyping(false); answer(reply); })
        .catch((e) => {
          setTyping(false);
          // A 4xx (daily limit, model not available) fails the same way again:
          // show the server's reason instead of a Retry button. A 409 means the
          // server is still answering this message, so Retry stays.
          if (e && e.status >= 400 && e.status < 500 && e.status !== 409) { answer({ who: 'ai', text: e.message }); return; }
          setMessages(m => m.map(x => x.id === id ? { ...x, failed: true } : x));
        });
      return;
    }
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { who: 'ai', ...personaReply(persona.key, t) }]);
    }, 1200);
  };

  const send = (text) => {
    const t = (text || input).trim();
    if (!t) return;
    const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages(m => [...m, { who: 'me', text: t, id }]);
    setInput('');
    attempt(t, id);
  };

  const retry = (m) => {
    if (!m || !m.text) return;
    setMessages(list => list.map(x => x.id === m.id ? { ...x, failed: false } : x));
    attempt(m.text, m.id);
  };

  const openCard = (card) => {
    if (card.kind === 'session') { setSheetSession(card.session); return; }
    if (card.kind === 'library') { window.__stridePlanView = null; go('library'); return; }
    if (card.kind === 'block')   { window.__stridePlanView = 'block'; go('plan'); return; }
    if (card.kind === 'note')    { window.__strideOpenNotes = true; go('profile'); return; }
    if (card.kind === 'injury')  { go('injuries'); return; }
    if (card.kind === 'weight')  { go('weight'); return; }
    if (card.kind === 'goal')    { go('goals'); return; }
  };

  return (
    <Screen padded={false} style={{ paddingBottom: 0, display: 'flex', flexDirection: 'column' }}>
      <StrideHeader title={persona.name} back={!wide} onBack={() => go('home')} right={
        <>
          <IconBtn icon="sparkles" onClick={() => setChangesOpen(true)}/>
          <IconBtn icon="search" onClick={() => setSearching(s => !s)}
            bg={searching ? TX.ink : TX.surface} color={searching ? '#fff' : TX.ink} border={searching ? TX.ink : TX.line}/>
          <IconBtn icon="history" onClick={() => setHistoryOpen(true)}/>
        </>
      }/>

      {/* In-chat model switcher (BYOK only) */}
      <StrideChatModelBar/>

      {/* Search bar */}
      {searching && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 12, padding: '0 8px 0 12px',
          }}>
            <StrideIcon name="search" size={16} color={TX.ink3}/>
            <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && (setSearching(false), setQuery(''))}
              placeholder="Search this conversation…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 14, color: TX.ink, padding: '10px 0' }}/>
            {query && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TX.ink3, whiteSpace: 'nowrap' }}>
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            )}
            <button onClick={() => { setSearching(false); setQuery(''); }} aria-label="Close search" style={{
              border: 'none', background: 'none', display: 'grid', placeItems: 'center',
              width: 32, height: 32, cursor: 'pointer', color: TX.ink3, flexShrink: 0,
            }}>
              <StrideIcon name="x" size={16}/>
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} onScroll={onChatScroll} style={{ flex: 1, overflowY: 'auto', padding: wide ? '0 20px 100px' : '0 20px 176px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((m, i) => <ChatBubble key={i} m={m} onCard={openCard} onRetry={retry} highlight={q}/>)}
          {typing && !q && <ChatBubble m={{ who: 'ai', text: '…', typing: true }}/>}
        </div>

        {q && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Inter', fontSize: 13, color: TX.ink3 }}>
            No messages match “{query.trim()}”.
          </div>
        )}

        {/* Suggestion chips */}
        {!q && messages.length < 8 && !typing && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10, color: TX.ink3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Try asking</div>
            {[
              'Build me a 45-min upper body session',
              'My shoulder is acting up — what should I do today?',
              'Project my bench at the end of this block',
              'How\'s my bodyweight trending?',
              'What\'s the best exercise for tight hips?',
            ].map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{
                textAlign: 'left', padding: '10px 12px', borderRadius: 12,
                background: TX.surface, border: `1px solid ${TX.line}`,
                fontFamily: 'Inter', fontSize: 13, color: TX.ink2, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Scroll to latest — shown only when scrolled up from the bottom */}
      {showDown && !searching && (
        <button onClick={() => scrollToBottom(true)} aria-label={window.t('Scroll to latest')} style={{
          position: 'absolute', right: 18, bottom: wide ? 98 : 162, zIndex: 30,
          width: 40, height: 40, borderRadius: 999, cursor: 'pointer', border: `1px solid ${TX.line}`,
          background: TX.ink, display: 'grid', placeItems: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
        }}>
          <StrideIcon name="arrowDown" size={19} color="#fff"/>
        </button>
      )}

      {/* Composer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: wide ? 0 : 84,
        background: TX.bg, padding: wide ? '10px 20px 20px' : '10px 20px 12px',
        borderTop: `1px solid ${TX.lineSoft}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 999, padding: '6px 6px 6px 16px',
        }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={window.t('Ask {name} anything…', { name: persona.name })}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 14, color: TX.ink, padding: '8px 0' }}/>
          <IconBtn icon="mic" size={36}/>
          <button onClick={() => send()} style={{
            width: 40, height: 40, borderRadius: 999, background: TX.ink, border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <StrideIcon name="send" size={18} color="#fff"/>
          </button>
        </div>
      </div>

      {sheetSession && window.Sheet && (
        <window.Sheet title={sheetSession.title} onClose={() => setSheetSession(null)}>
          <window.SessionDetail session={sheetSession} go={go} persona={persona} onClose={() => setSheetSession(null)}/>
        </window.Sheet>
      )}

      {/* "What the coach changed" — used to be the only thing the corner button
          did; it lives here now that the corner opens the coach itself. */}
      {changesOpen && window.Sheet && (
        <window.Sheet title={window.t('What {name} changed', { name: persona.name })} onClose={() => setChangesOpen(false)}>
          <AILogBody
            entries={window.STRIDE_AI_LOG || []}
            scopes={['today', 'week', 'block']}
            scopeLabel="your full plan"
            trainer={persona.name}
            onOpenEntry={(e) => {
              const session = window.strideFindSession && window.strideFindSession(e.sessionId);
              if (session) { setChangeSession(session); return; }
              if (e.blockId != null) { window.__strideOpenBlockId = e.blockId; setChangesOpen(false); go('block-detail'); }
            }}/>
        </window.Sheet>
      )}

      {changeSession && window.Sheet && (
        <window.Sheet title={changeSession.title} onClose={() => setChangeSession(null)}>
          <SessionDetail session={changeSession} go={go} persona={persona} onClose={() => setChangeSession(null)}/>
        </window.Sheet>
      )}

      {historyOpen && window.Sheet && (
        <window.Sheet title={window.t('Conversations')} onClose={() => setHistoryOpen(false)}>
          <ConversationHistory
            onOpen={(msgs) => { setMessages(msgs.length ? msgs : [strideChatGreeting()]); setQuery(''); setHistoryOpen(false); }}
            onNew={() => { setMessages([strideChatGreeting()]); setQuery(''); setHistoryOpen(false); }}
            onDeletedActive={() => setMessages([strideChatGreeting()])}/>
        </window.Sheet>
      )}
    </Screen>
  );
}

// The AI tab's thread switcher: every coach conversation (general + per-block),
// open one, start a fresh one, or delete old ones (two-tap confirm on the trash).
function ConversationHistory({ onOpen, onNew, onDeletedActive }) {
  const [convs, setConvs] = React.useState(null); // null = loading
  const [busyId, setBusyId] = React.useState(null);
  const [confirmId, setConfirmId] = React.useState(null);
  const coach = window.__strideCoach;

  React.useEffect(() => {
    if (!coach) { setConvs([]); return; }
    coach.listConversations().then(setConvs).catch(() => setConvs([]));
  }, []);

  const openConv = (c) => {
    if (busyId || !coach) return;
    setBusyId(c.id);
    coach.openConversation(c.id)
      .then((res) => onOpen(res.messages))
      .catch(() => setBusyId(null));
  };
  const createConv = () => {
    if (busyId || !coach) return;
    setBusyId('new');
    coach.newConversation().then(() => onNew()).catch(() => setBusyId(null));
  };
  const deleteConv = (c) => {
    if (busyId || !coach) return;
    if (confirmId !== c.id) { setConfirmId(c.id); return; }
    const wasActive = coach.activeConversationId && coach.activeConversationId() === c.id;
    setBusyId(c.id);
    coach.deleteConversation(c.id)
      .then(() => {
        setConvs((list) => (list || []).filter((x) => x.id !== c.id));
        setConfirmId(null); setBusyId(null);
        if (wasActive) onDeletedActive();
      })
      .catch(() => setBusyId(null));
  };

  const fmtWhen = (iso) => {
    if (!iso) return '';
    const locale = (localStorage.getItem('stride_lang') === 'sk') ? 'sk-SK' : 'en-US';
    return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
      <button onClick={createConv} disabled={!!busyId} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px 14px', borderRadius: 14, border: 'none', background: TX.ink, color: '#fff',
        fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', opacity: busyId === 'new' ? 0.6 : 1,
      }}>
        <StrideIcon name="plus" size={16} color="#fff"/>{window.t('New conversation')}
      </button>

      {convs === null && (
        <div style={{ textAlign: 'center', padding: '18px 0', fontFamily: 'Inter', fontSize: 13, color: TX.ink3 }}>…</div>
      )}
      {convs !== null && convs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '18px 0', fontFamily: 'Inter', fontSize: 13, color: TX.ink3 }}>
          {window.t('No conversations yet.')}
        </div>
      )}

      {(convs || []).map((c) => (
        <div key={c.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 14, padding: '11px 12px',
          opacity: busyId === c.id ? 0.6 : 1,
        }}>
          <div onClick={() => openConv(c)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 800, color: TX.ink3, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              {c.block_id ? window.t('Training block') : window.t('General')}{c.last_message_at ? ' · ' + fmtWhen(c.last_message_at) : ''}
            </div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TX.ink, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.block_name || c.title || window.t('Conversation')}
            </div>
          </div>
          {confirmId === c.id ? (
            <button onClick={() => deleteConv(c)} disabled={!!busyId} style={{
              flexShrink: 0, padding: '8px 12px', borderRadius: 10, border: 'none', background: '#C0392B', color: '#fff',
              fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer',
            }}>{window.t('Delete?')}</button>
          ) : (
            <button onClick={() => deleteConv(c)} aria-label="Delete conversation" disabled={!!busyId} style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: `1px solid ${TX.line}`, background: TX.surface,
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}><StrideIcon name="trash" size={15} color={TX.ink3}/></button>
          )}
        </div>
      ))}
    </div>
  );
}

function ChatBubble({ m, onCard, onRetry, highlight }) {
  const isMe = m.who === 'me';
  const hasCards = !isMe && m.cards && m.cards.length > 0;
  const renderText = (txt) => {
    // AI replies carry light markdown; the search-highlight path stays plain.
    if (!highlight && !isMe && txt) return window.renderCoachMarkdown(txt);
    if (!highlight || !txt) return txt;
    const parts = String(txt).split(new RegExp(`(${strideAccentPattern(highlight)})`, 'ig'));
    return parts.map((p, i) =>
      strideFoldText(p) === strideFoldText(highlight)
        ? <mark key={i} style={{ background: TX.accent, color: isMe ? TX.ink : TX.ink, borderRadius: 3, padding: '0 1px' }}>{p}</mark>
        : <React.Fragment key={i}>{p}</React.Fragment>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
      {(m.text || m.typing) && (
        <div style={{
          maxWidth: '82%',
          padding: '10px 14px',
          borderRadius: 18,
          borderTopLeftRadius: isMe ? 18 : 4,
          borderTopRightRadius: isMe ? 4 : 18,
          background: isMe ? TX.ink : TX.surface,
          color: isMe ? '#fff' : TX.ink,
          border: isMe ? 'none' : `1px solid ${TX.line}`,
          fontFamily: 'Inter', fontSize: 14, lineHeight: 1.45,
        }}>
          {m.typing ? (
            <span style={{ display: 'inline-flex', gap: 4 }}>
              <Dot/><Dot d="0.15s"/><Dot d="0.3s"/>
            </span>
          ) : renderText(m.text)}
        </div>
      )}
      {isMe && m.failed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#C0392B' }}>{window.t('Not delivered')}</span>
          <button onClick={() => onRetry && onRetry(m)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 9, border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink,
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 11.5, cursor: 'pointer',
          }}>
            <StrideIcon name="history" size={12} color={TX.ink}/>{window.t('Retry')}
          </button>
        </div>
      )}
      {hasCards && (
        <div style={{ marginTop: m.text ? 8 : 0, maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.cards.map((c, i) => <ChatCard key={i} card={c} onClick={() => onCard(c)}/>)}
        </div>
      )}
      {!isMe && m.proposals && m.proposals.length > 0 && (
        <div style={{ marginTop: (m.text || hasCards) ? 8 : 0, maxWidth: '92%', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ProposalGroup proposals={m.proposals}/>
        </div>
      )}
    </div>
  );
}

// A staged coach change awaiting the user's call — Apply (mutate the plan) or
// Dismiss. Propose→confirm applies to EVERY coach edit, today or block-wide.
const PROPOSAL_ICONS = {
  set_load: 'sliders', swap: 'sliders', add_set: 'plus',
  reorder: 'sliders', scale_load: 'trend', regenerate_session: 'sparkles', edit: 'edit',
};
function ProposalCard({ p, status, busy, error, onApply, onDismiss }) {
  const icon = PROPOSAL_ICONS[p.operation] || 'sparkles';
  const done = status === 'applied';
  const stale = status === 'stale';
  if (status === 'dismissed') return null;

  return (
    <div style={{ width: '100%', background: TX.surface, border: `1px solid ${done ? TX.accent : TX.line}`, borderRadius: 16, padding: 13, opacity: stale ? 0.65 : 1 }}>
      <div style={{ display: 'flex', gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: done ? TX.accent + '18' : TX.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name={done ? 'check' : (stale ? 'x' : icon)} size={16} color={done ? TX.accent : TX.ink2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 800, color: done ? TX.accent : TX.ink3, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            {done ? window.t('Applied') : (stale ? window.t('No longer available') : window.t('Proposed change'))}{p.target ? ' · ' + p.target : ''}
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TX.ink, lineHeight: 1.25, marginTop: 3 }}>{p.text}</div>
          {p.why && <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TX.ink3, marginTop: 4, lineHeight: 1.4 }}>{p.why}</div>}
        </div>
      </div>
      {!done && !stale && (
        <>
          <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
            <button onClick={onDismiss} disabled={busy} style={{
              flex: 'none', padding: '8px 16px', borderRadius: 11, border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink2,
              fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
            }}>{window.t('Dismiss')}</button>
            <button onClick={onApply} disabled={busy} style={{
              flex: 1, padding: '8px 16px', borderRadius: 11, border: 'none', background: TX.ink, color: '#fff',
              fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', opacity: busy ? 0.6 : 1,
            }}>{busy ? window.t('Applying…') : window.t('Apply')}</button>
          </div>
          {error && (
            <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: '#C0392B', marginTop: 7 }}>
              {window.t('That didn’t go through — check your connection and try again.')}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// One coach reply's staged changes as a unit: each card confirms individually,
// and once more than one is still pending, bulk "Apply all" / "Dismiss all"
// controls appear (dismiss a few, then apply the rest in one tap). Failed calls
// surface on the card — a 409 means the change was resolved elsewhere (stale).
function ProposalGroup({ proposals }) {
  // Legacy replies can carry the same staged edit many times (the tool loop
  // used to re-stage it) — collapse to one card per distinct edit, preferring
  // an instance that is already applied.
  const unique = React.useMemo(() => {
    const bySig = new Map();
    proposals.forEach((p) => {
      const sig = `${p.operation || ''}|${p.target || ''}|${p.text || ''}`;
      const prev = bySig.get(sig);
      if (!prev || (prev.status !== 'applied' && p.status === 'applied')) bySig.set(sig, p);
    });
    return [...bySig.values()];
  }, [proposals]);

  const [statuses, setStatuses] = React.useState(() => {
    const s = {};
    unique.forEach((p) => { s[p.id] = p.status || 'proposed'; });
    return s;
  });
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(null); // proposal id | '*' (bulk)

  const settle = (id, st) => setStatuses((s) => ({ ...s, [id]: st }));
  const fail = (id, err) => {
    if (err && err.status === 409) settle(id, 'stale');
    else setErrors((e) => ({ ...e, [id]: true }));
  };

  const act = (p, kind) => {
    const coach = window.__strideCoach;
    if (busy || !coach) return;
    setBusy(p.id);
    setErrors((e) => ({ ...e, [p.id]: false }));
    const call = kind === 'apply' ? coach.applyProposal : coach.dismissProposal;
    Promise.resolve(call(p.id))
      .then(() => settle(p.id, kind === 'apply' ? 'applied' : 'dismissed'))
      .catch((err) => fail(p.id, err))
      .then(() => setBusy(null));
  };

  const pending = unique.filter((p) => statuses[p.id] === 'proposed');
  const bulk = (kind) => {
    const coach = window.__strideCoach;
    if (busy || !coach || pending.length === 0) return;
    setBusy('*');
    setErrors({});
    const ids = pending.map((p) => p.id);
    const call = kind === 'apply' ? coach.applyProposals : coach.dismissProposals;
    Promise.resolve(call(ids))
      .then((out) => {
        ((kind === 'apply' ? out.applied : out.dismissed) || []).forEach((id) => settle(id, kind === 'apply' ? 'applied' : 'dismissed'));
        (out.failed || []).forEach((f) => fail(f.id, f));
      })
      .catch(() => {})
      .then(() => setBusy(null));
  };

  const visible = unique.filter((p) => statuses[p.id] !== 'dismissed');
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((p) => (
        <ProposalCard key={p.id} p={p} status={statuses[p.id]} busy={busy === p.id || busy === '*'} error={!!errors[p.id]}
          onApply={() => act(p, 'apply')} onDismiss={() => act(p, 'dismiss')}/>
      ))}
      {pending.length > 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => bulk('dismiss')} disabled={!!busy} style={{
            flex: 'none', padding: '9px 16px', borderRadius: 12, border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink2,
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
          }}>{window.t('Dismiss all')}</button>
          <button onClick={() => bulk('apply')} disabled={!!busy} style={{
            flex: 1, padding: '9px 16px', borderRadius: 12, border: 'none', background: TX.accent, color: '#fff',
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', opacity: busy === '*' ? 0.6 : 1,
          }}>{busy === '*' ? window.t('Applying…') : window.t('Apply all ({n})', { n: pending.length })}</button>
        </div>
      )}
    </>
  );
}

const CHAT_CARD_META = {
  session: { icon: 'dumbbell', tag: 'Workout',       color: '#FF4D1F' },
  library: { icon: 'book',     tag: 'Library',        color: '#2563EB' },
  block:   { icon: 'flame',    tag: 'Training block', color: '#7A3FF2' },
  note:    { icon: 'edit',     tag: 'Personal note',  color: '#0A8A6A' },
  injury:  { icon: 'bandage',  tag: 'Injury log',     color: '#E0922A' },
  weight:  { icon: 'scale',    tag: 'Weight',         color: '#3A6FB0' },
  goal:    { icon: 'target',   tag: 'Goal',           color: '#C0392B' },
};

function ChatCard({ card, onClick }) {
  const meta = CHAT_CARD_META[card.kind] || CHAT_CARD_META.session;
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', width: '100%',
      background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 16,
      padding: 12, display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.color + '18', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <StrideIcon name={meta.icon} size={20} color={meta.color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: 0.7 }}>{meta.tag}</div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TX.ink, lineHeight: 1.2, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</div>
        {card.subtitle && <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TX.ink3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.subtitle}</div>}
      </div>
      <div style={{
        width: 30, height: 30, borderRadius: 10, flexShrink: 0,
        background: TX.bg, border: `1px solid ${TX.line}`,
        display: 'grid', placeItems: 'center',
      }}>
        <StrideIcon name="chevR" size={16} color={TX.ink2}/>
      </div>
    </button>
  );
}
function Dot({ d = '0s' }) {
  return <span style={{ width: 6, height: 6, borderRadius: 6, background: TX.ink3, display: 'inline-block', animation: `bob 1s ${d} infinite ease-in-out` }}/>;
}

// A session object matching SessionDetail's expected shape
const CHAT_PUSH_SESSION = { day: 'Thu', date: 21, kind: 'Push', title: 'Push — Strength A', status: 'today', volume: 0, duration: 62 };
const CHAT_UPPER_SESSION = { day: 'Thu', date: 21, kind: 'Push', title: 'Upper Body — 45 min', status: 'planned', volume: 0, duration: 45 };

function personaReply(key, t) {
  const lower = t.toLowerCase();
  if (lower.includes('shoulder') || lower.includes('injury') || lower.includes('hurt') || lower.includes('pain')) {
    return {
      text: ({
        coach: "Shoulder talking back? Don't ignore it. Today: skip overhead. Stick to neutral-grip DB press × 8 RPE 7. Move on.",
        calm: "Let's protect that shoulder today. I'd swap overhead pressing for a neutral-grip DB press and add band pull-aparts. Here's your updated session and the injury note I'm working from:",
        nerd: "Cross-referenced your Apr 12 flag. Recommend: skip OHP (loaded shoulder ext-rot peaks @ 90°). Sub: neutral DB press 3×10 @ 22kg, est. tonnage 660kg, lower delt strain vs. baseline.",
        buddy: "Bummer 😕 let's keep it chill on the shoulder today — neutral DB press instead of overhead, easy on the load. Here's the tweaked session:",
      })[key],
      cards: [
        { kind: 'injury', title: 'Right shoulder — monitoring', subtitle: 'Flagged Apr 12 · impingement' },
        { kind: 'session', title: 'Push — Strength A (adjusted)', subtitle: 'Neutral-grip press · 62 min', session: CHAT_PUSH_SESSION },
      ],
    };
  }
  if (lower.includes('build') || lower.includes('session') || lower.includes('upper') || lower.includes('workout')) {
    return {
      text: ({
        coach: "Done. 45 min, upper. Bench 75×8×3, neutral DB press, cable row, fly, OH ext. Get to work.",
        calm: "Sure — here's a balanced 45-min upper session, calibrated to RPE 7. Tap to review and start it:",
        nerd: "45-min upper template. 1 compound press (75kg×8×3), 1 secondary press, 1 horizontal pull, 2 iso. Total est. tonnage 4,200kg, RPE target 7.2.",
        buddy: "On it! 💪 45 min upper coming up — bench, DB press, row, fly, tri's. Tap in:",
      })[key],
      cards: [
        { kind: 'session', title: 'Upper Body — 45 min', subtitle: '5 exercises · RPE 7', session: CHAT_UPPER_SESSION },
        { kind: 'library', title: 'Browse pressing variations', subtitle: 'Chest · Shoulders · Triceps' },
      ],
    };
  }
  if (lower.includes('project') || lower.includes('bench') || lower.includes('goal') || lower.includes('progress')) {
    return {
      text: ({
        coach: "100 kg × 5 by end of block. Stick to plan. No skipped sessions.",
        calm: "You're tracking to hit 95–98 kg × 5 by week 6 of this block. Here's the goal and the block driving it:",
        nerd: "1RM est: 96.4kg (Epley, last set 82.5×6). +4.2% projected over 3 weeks → ~100.5kg 1RM. Goal + block below.",
        buddy: "You're SO close 🔥 95-ish by end of block, then 100×5 the week after. Check it:",
      })[key],
      cards: [
        { kind: 'goal', title: 'Bench Press 100 kg × 5', subtitle: '72% there · on track' },
        { kind: 'block', title: 'Hypertrophy → Strength', subtitle: 'Week 3 of 6 · active block' },
      ],
    };
  }
  if (lower.includes('weight') || lower.includes('bodyweight') || lower.includes('scale')) {
    return {
      text: ({
        coach: "Down 1.2 kg this month. Keep eating for the lifts. Don't crash it.",
        calm: "Your weight's been trending steadily — down 1.2 kg over the month while strength held. Here's the log:",
        nerd: "Bodyweight 7-day avg: 81.3kg, −1.2kg MoM. Lean-mass proxy (lift tonnage / kg) up 3.1%. Recomp trending positive.",
        buddy: "Looking good! 📉 down a bit but lifts are up — that's the dream. Peek at the trend:",
      })[key],
      cards: [
        { kind: 'weight', title: 'Weight trend', subtitle: '81.3 kg · −1.2 kg this month' },
      ],
    };
  }
  if (lower.includes('hip') || lower.includes('tight') || lower.includes('mobility') || lower.includes('stretch')) {
    return {
      text: ({
        coach: "Tight hips? Do the work. 90/90 switches and couch stretch, daily. No excuses.",
        calm: "For tight hips I'd start with 90/90 hip switches and the couch stretch. Here's the mobility section:",
        nerd: "Hip IR limitation likely. Protocol: 90/90 switch 2×8/side, couch stretch 2×30s/side, Cossack squat 2×6. Library link below.",
        buddy: "Tight hips are the worst 😩 try 90/90 switches + couch stretch. All in here:",
      })[key],
      cards: [
        { kind: 'library', title: 'Mobility › Hips', subtitle: '90/90 Switch · Couch Stretch · Cossack' },
      ],
    };
  }
  return {
    text: ({
      coach: "Got it. Tomorrow's plan is locked.",
      calm: "Noted — I'll factor that into your next session. Want me to save it to your notes?",
      nerd: "Logged. Will recalibrate volume targets for next 7 days.",
      buddy: "Aight cool, noted! 🙌",
    })[key],
    cards: [
      { kind: 'note', title: 'Add to personal notes', subtitle: 'Standing instructions for your coach' },
    ],
  };
}

Object.assign(window, {
  GenerateScreen, ActiveConfigScreen, ActiveWorkoutScreen, SummaryScreen, ChatScreen, ProposalCard, ChatBubble,
});
