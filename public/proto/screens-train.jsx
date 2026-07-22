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
  const genDate = new Date(2026, 4, 21);
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
    <Screen>
      <StrideHeader title={step < 4 ? "Generate" : "Ready to roll"} kicker={step < 4 ? window.t('Step {n} of 4 · with {name}', { n: step+1, name: persona.name }) : window.t('Generated · 5 exercises')} back onBack={() => step === 0 ? go('home') : setStep(Math.max(0, step - 1))}/>

      <div style={{ padding: '0 20px' }}>
        <div style={{ height: 4, borderRadius: 4, background: TX.lineSoft, overflow: 'hidden', marginBottom: 22 }}>
          <div style={{ width: `${((step+1)/5)*100}%`, height: '100%', background: TX.accent, transition: 'width .4s' }}/>
        </div>

        {step === 0 && (
          <StepWrap title="What are we hitting today?" sub="I'll factor in your plan + recent volume.">
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

        {/* Clearance for the floating Continue button on wizard steps */}
        <div style={{ height: step < 4 ? 150 : 30 }}/>
      </div>

      {/* Step nav at bottom */}
      {step < 4 && (
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 100 }}>
          <StrideButton variant={step === 3 ? 'accent' : 'primary'} block
            iconRight={step === 3 ? 'sparkles' : 'arrowRight'}
            onClick={() => step === 3 ? handleGen() : setStep(step + 1)}>
            {step === 3 ? 'Generate workout' : 'Continue'}
          </StrideButton>
        </div>
      )}

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
// ACTIVE CONFIG — pick mode + intro
// ────────────────────────────────────────────────────────────────────
function ActiveConfigScreen({ go, setActiveMode }) {
  // The session being run: one loaded from the plan, else today's. Never deref null.
  const w = window.STRIDE_ACTIVE_WORKOUT || window.STRIDE_TODAYS_WORKOUT;
  const [mode, setMode] = React.useState('timer');
  React.useEffect(() => { if (!w) go('home'); }, []);
  if (!w) return null;

  return (
    <Screen>
      <StrideHeader title="Get ready" kicker={w.title || w.block || ''} back onBack={() => go('home')}/>
      <div style={{ padding: '0 20px' }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <BigStat label="Exercises" value={w.exercises.length}/>
            <BigStat label="Sets" value={w.exercises.reduce((s,e) => s + e.sets.length, 0)}/>
            <BigStat label="Est. time" value={`${w.durationMin}m`}/>
          </div>
        </Card>

        <div style={{ marginTop: 22 }}>
          <SectionHeader title="How do you want to run it?"/>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ModeCard active={mode === 'timer'} onClick={() => setMode('timer')}
              icon="timer" title="Managed timer" sub="Auto-tracks rest & advances. Hands-free."/>
            <ModeCard active={mode === 'manual'} onClick={() => setMode('manual')}
              icon="skip" title="Step through" sub="Big arrows. You're in control."/>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <SectionHeader title="Exercise queue"/>
          <div style={{ marginTop: 10, background: TX.surface, border: `1px solid ${TX.line}`, borderRadius: 18, overflow: 'hidden' }}>
            {w.exercises.map((ex, i) => (
              <div key={ex.id} style={{
                padding: '14px 16px', borderTop: i ? `1px solid ${TX.lineSoft}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: TX.lineSoft, display: 'grid', placeItems: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 12, color: TX.ink }}>{i+1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14 }}>{ex.name}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: TX.ink3, marginTop: 2 }}>
                    {ex.sets.length} sets · {ex.tag}
                  </div>
                </div>
                <Chip bg={TX.lineSoft} style={{ fontSize: 9 }}>{ex.sets[ex.sets.length-1].reps || 'AMRAP'} × {ex.sets[ex.sets.length-1].kg || '—'}{ex.sets[ex.sets.length-1].kg ? 'kg' : ''}</Chip>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 110 }}/>
      </div>

      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 100 }}>
        <StrideButton variant="accent" block size="lg" icon="play" onClick={() => { setActiveMode(mode); go('active'); }}>
          {mode === 'timer' ? 'Start managed session' : 'Step through session'}
        </StrideButton>
      </div>
    </Screen>
  );
}

function ModeCard({ active, onClick, icon, title, sub }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer',
      background: active ? TX.ink : TX.surface, color: active ? '#fff' : TX.ink,
      border: `1.5px solid ${active ? TX.ink : TX.line}`,
      borderRadius: 16, padding: 16,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: active ? TX.volt : TX.lineSoft, display: 'grid', placeItems: 'center' }}>
        <StrideIcon name={icon} size={24} color={TX.ink} strokeWidth={2.2}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16 }}>{title}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, opacity: active ? 0.7 : 0.6, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ width: 22, height: 22, borderRadius: 22, border: `2px solid ${active ? TX.volt : TX.line}`, background: active ? TX.volt : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {active && <StrideIcon name="check" size={12} color={TX.ink} strokeWidth={3.5}/>}
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// ACTIVE WORKOUT — timer or manual
// ────────────────────────────────────────────────────────────────────
function ActiveWorkoutScreen({ go, mode }) {
  // Guard BEFORE any hooks (the body derefs w.exercises between hooks). w is a
  // stable module global per instance, so the hook count stays consistent.
  const w = window.STRIDE_ACTIVE_WORKOUT || window.STRIDE_TODAYS_WORKOUT;
  if (!w) { setTimeout(function () { go('home'); }, 0); return null; }
  const [exIdx, setExIdx] = React.useState(0);
  const [setIdx, setSetIdx] = React.useState(0);
  const [resting, setResting] = React.useState(false);
  const [restLeft, setRestLeft] = React.useState(0);
  const [completedSets, setCompletedSets] = React.useState({}); // {exId-setIdx: {reps, kg}}
  const [paused, setPaused] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(8 * 60 + 14); // 8:14 mock
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [coachOpen, setCoachOpen] = React.useState(false);

  const ex = w.exercises[exIdx];
  const curSet = ex.sets[setIdx];
  const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0);
  const completedSoFar = w.exercises.slice(0, exIdx).reduce((s, e) => s + e.sets.length, 0) + setIdx;
  const progress = completedSoFar / totalSets;

  // Rest timer countdown
  React.useEffect(() => {
    if (!resting || paused) return;
    if (restLeft <= 0) { setResting(false); return; }
    const t = setTimeout(() => setRestLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resting, restLeft, paused]);

  // Session elapsed
  React.useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setElapsed(e => e + 1), 1000);
    return () => clearTimeout(t);
  }, [elapsed, paused]);

  const completeSet = () => {
    const key = `${ex.id}-${setIdx}`;
    setCompletedSets(prev => ({ ...prev, [key]: { reps: curSet.reps, kg: curSet.kg, ts: Date.now() } }));
    // Advance
    if (setIdx < ex.sets.length - 1) {
      if (mode === 'timer' && curSet.rest) {
        setResting(true);
        setRestLeft(curSet.rest);
      }
      setSetIdx(setIdx + 1);
    } else if (exIdx < w.exercises.length - 1) {
      if (mode === 'timer' && curSet.rest) {
        setResting(true);
        setRestLeft(curSet.rest);
      }
      setExIdx(exIdx + 1);
      setSetIdx(0);
    } else {
      // done — mark today's training complete, then show the summary
      try { localStorage.setItem('stride_today_done', '1'); } catch (e) {}
      go('summary');
    }
  };

  const goPrev = () => {
    if (setIdx > 0) setSetIdx(setIdx - 1);
    else if (exIdx > 0) {
      setExIdx(exIdx - 1);
      setSetIdx(w.exercises[exIdx - 1].sets.length - 1);
    }
  };
  const goNext = () => {
    if (setIdx < ex.sets.length - 1) setSetIdx(setIdx + 1);
    else if (exIdx < w.exercises.length - 1) { setExIdx(exIdx + 1); setSetIdx(0); }
  };

  // Undo / step back — returns to the previous set and clears its logged result,
  // so an accidental "Set complete" can be reversed.
  const canGoBack = exIdx > 0 || setIdx > 0;
  const goBack = () => {
    if (!canGoBack) return;
    setResting(false);
    let pExIdx = exIdx, pSetIdx = setIdx;
    if (setIdx > 0) pSetIdx = setIdx - 1;
    else { pExIdx = exIdx - 1; pSetIdx = w.exercises[exIdx - 1].sets.length - 1; }
    const key = `${w.exercises[pExIdx].id}-${pSetIdx}`;
    setCompletedSets(prev => { const n = { ...prev }; delete n[key]; return n; });
    setExIdx(pExIdx);
    setSetIdx(pSetIdx);
  };

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ background: TX.ink, color: '#fff', width: '100%', height: '100%', position: 'relative', overflow: 'hidden', paddingTop: window.STRIDE_SAFE_TOP }}>
      {/* Top bar */}
      <div style={{ padding: '14px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconBtn icon="close" onClick={() => go('home')} bg="#222" color="#fff" border="#333" size={36}/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{mode === 'timer' ? 'Managed' : 'Step through'} · Push</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16, marginTop: 2 }}>{fmt(elapsed)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {mode === 'timer' && (
            <button onClick={() => setCoachOpen(true)} aria-label="Chat with coach" style={{
              position: 'relative', width: 36, height: 36, borderRadius: 18, cursor: 'pointer',
              background: TX.volt, border: 'none', display: 'grid', placeItems: 'center',
            }}>
              <StrideIcon name="chat" size={18} color={TX.ink}/>
            </button>
          )}
          <IconBtn icon={paused ? 'play' : 'pause'} onClick={() => setPaused(p => !p)} bg="#222" color="#fff" border="#333" size={36}/>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 18px' }}>
        <div style={{ height: 4, borderRadius: 4, background: '#222', overflow: 'hidden', display: 'flex' }}>
          {w.exercises.map((e, i) => (
            <div key={i} style={{ flex: e.sets.length, marginRight: i < w.exercises.length - 1 ? 2 : 0, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: i < exIdx ? '100%' : (i === exIdx ? `${(setIdx / e.sets.length) * 100}%` : '0%'),
                height: '100%', background: TX.volt, transition: 'width .4s',
              }}/>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 11, color: '#888', fontWeight: 600 }}>
          <span>Exercise {exIdx+1} / {w.exercises.length}</span>
          <span>Set {setIdx+1} / {ex.sets.length}</span>
        </div>
      </div>

      {/* Resting screen */}
      {resting && mode === 'timer' && (
        <RestPanel
          left={restLeft}
          total={curSet.rest}
          next={ex.sets[setIdx]}
          nextEx={ex.name}
          onSkip={() => { setResting(false); }}
          onAdd={() => setRestLeft(r => r + 15)}
          onSub={() => setRestLeft(r => Math.max(0, r - 15))}
          onUndo={canGoBack ? goBack : null}
        />
      )}

      {!resting && (
        <ActiveExercisePanel
          ex={ex}
          setIdx={setIdx}
          mode={mode}
          completedSets={completedSets}
          onComplete={completeSet}
          onPrev={goPrev}
          onNext={goNext}
          onBack={goBack}
          canGoBack={canGoBack}
          onOpenDetails={() => setDetailOpen(true)}
        />
      )}

      {detailOpen && window.Sheet && (
        <window.Sheet title={ex.name} onClose={() => setDetailOpen(false)}>
          <ActiveExerciseDetail ex={ex} />
        </window.Sheet>
      )}

      {coachOpen && window.Sheet && (
        <window.Sheet title="Coach" onClose={() => setCoachOpen(false)}>
          <SessionCoachChat workout={w} onClose={() => setCoachOpen(false)}/>
        </window.Sheet>
      )}
    </div>
  );
}

function RestPanel({ left, total, next, nextEx, onSkip, onAdd, onSub, onUndo }) {
  const pct = total ? left / total : 0;
  const stepBtn = { width: 60, height: 60, borderRadius: 14, background: '#222', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 };
  return (
    <div style={{ padding: '12px 18px 24px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 92px)' }}>
      {/* Middle — timer + up next */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TX.volt, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Rest</div>
        <div style={{ position: 'relative', width: 230, height: 230 }}>
          <svg width="230" height="230" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="115" cy="115" r="104" stroke="#222" strokeWidth="6" fill="none"/>
            <circle cx="115" cy="115" r="104" stroke={TX.volt} strokeWidth="6" fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 104}
              strokeDashoffset={2 * Math.PI * 104 * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 80, color: '#fff', letterSpacing: -3, lineHeight: 1 }}>
                {Math.floor(left/60)}:{String(left % 60).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginTop: 6 }}>of {Math.floor(total/60)}:{String(total % 60).padStart(2,'0')}</div>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: '#1a1a1a', borderRadius: 14, textAlign: 'left' }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Up next</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 16, marginTop: 4 }}>{nextEx}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#bbb', marginTop: 2 }}>
            {next.kind} · {next.reps} reps · {next.kg || '—'}{next.kg ? ' kg' : ''}
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

function ActiveExercisePanel({ ex, setIdx, mode, completedSets, onComplete, onPrev, onNext, onBack, canGoBack, onOpenDetails }) {
  const curSet = ex.sets[setIdx];
  const [reps, setReps] = React.useState(curSet.reps);
  const [kg, setKg] = React.useState(curSet.kg);

  React.useEffect(() => {
    setReps(curSet.reps);
    setKg(curSet.kg);
  }, [setIdx, ex.id]);

  return (
    <div style={{ padding: '20px 18px 24px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 92px)' }}>
      {/* Exercise header — tap to open details */}
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <Chip bg="#ffffff14" ink={TX.volt} color={TX.volt} dot style={{ textTransform: 'uppercase' }}>{curSet.kind}</Chip>
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
        <NumberStepper label="Reps" value={reps} unit={curSet.kind === 'AMRAP' ? 'AMRAP' : ''} onChange={setReps}/>
        <div style={{ width: 120, height: 1, background: '#222' }}/>
        <NumberStepper label="kg" value={kg} step={2.5} onChange={setKg}/>
      </div>

      {/* Coach note */}
      {ex.note && (
        <div style={{ padding: '10px 14px', background: '#1a1a1a', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <StrideIcon name="info" size={16} color={TX.volt}/>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#ddd', flex: 1 }}>{ex.note}</div>
        </div>
      )}

      {/* Sets timeline — directly above the controls */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Sets · reps × kg</div>
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
                    <div style={{ fontSize: 14 }}>{s.reps}</div>
                    {s.kg ? <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.65, marginTop: 1 }}>{s.kg}kg</div> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA row */}
      {mode === 'timer' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          {canGoBack && (
            <button onClick={onBack} aria-label="Back a set" style={{
              width: 60, height: 60, borderRadius: 14, background: '#222', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
            }}>
              <StrideIcon name="arrowLeft" size={26} color="#fff"/>
            </button>
          )}
          <StrideButton variant="volt" size="lg" icon="check" style={{ flex: 1 }} onClick={onComplete}>
            Set complete
          </StrideButton>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onPrev} style={{
            width: 60, height: 60, borderRadius: 14, background: '#222', border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <StrideIcon name="arrowLeft" size={26} color="#fff"/>
          </button>
          <StrideButton variant="volt" size="lg" icon="check" style={{ flex: 1 }} onClick={onComplete}>Log set</StrideButton>
          <button onClick={onNext} style={{
            width: 60, height: 60, borderRadius: 14, background: '#222', border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <StrideIcon name="arrowRight" size={26} color="#fff"/>
          </button>
        </div>
      )}
    </div>
  );
}

function NumberStepper({ label, value, onChange, step = 1, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onChange(Math.max(0, value - step))} style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid #333', background: '#1a1a1a', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <StrideIcon name="minus" size={16} color="#fff"/>
        </button>
        <div style={{ minWidth: 72, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>
          {unit || (value % 1 === 0 ? value : value.toFixed(1))}
        </div>
        <button onClick={() => onChange(value + step)} style={{
          width: 36, height: 36, borderRadius: 12, border: '1px solid #333', background: '#1a1a1a', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <StrideIcon name="plus" size={16} color="#fff"/>
        </button>
      </div>
    </div>
  );
}

// Read-only target value (managed mode — the coach prescribes these).
function TargetReadout({ value, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 64, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginTop: 8 }}>{unit}</div>}
    </div>
  );
}

// Look up an exercise in the library tree by name (enriches with muscles/equipment).
function findLibraryExercise(name) {
  const walk = (node) => {
    if (node.exercises) {
      const hit = node.exercises.find((e) => e.name === name);
      if (hit) return hit;
    }
    if (node.children) {
      for (const c of node.children) { const r = walk(c); if (r) return r; }
    }
    return null;
  };
  try { return walk(window.STRIDE_LIBRARY) || null; } catch (e) { return null; }
}

// Exercise details slideover, shown during an active session.
function ActiveExerciseDetail({ ex }) {
  const lib = findLibraryExercise(ex.name) || {};
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
  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Hero */}
      <div style={{ height: 150, borderRadius: 16, background: `linear-gradient(135deg, ${TX.ink}, #2a2a2a)`, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -28, bottom: -18, opacity: 0.18 }}>
          <StrideIcon name="dumbbell" size={150} color={TX.volt}/>
        </div>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 14px)' }}/>
        <div style={{ position: 'absolute', left: 14, bottom: 12, right: 14 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#fff', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{ex.tag || 'Exercise'}</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', marginTop: 4, lineHeight: 1.1 }}>{ex.name}</div>
        </div>
      </div>

      {/* At a glance */}
      <div style={{ marginBottom: 16, borderRadius: 14, overflow: 'hidden', background: TX.surface, border: `1px solid ${TX.line}` }}>
        {muscles.length > 0 && <SpecRow label="Muscles involved" first>{muscles.join(', ')}</SpecRow>}
        {lib.equip && <SpecRow label="Equipment" first={muscles.length === 0}>{lib.equip}</SpecRow>}
        {ex.tag && <SpecRow label="Type">{ex.tag}</SpecRow>}
        {lib.diff && <SpecRow label="Difficulty">{lib.diff}</SpecRow>}
      </div>

      {/* Coach note */}
      {ex.note && (
        <>
          <Label>Coach note</Label>
          <div style={{ background: TX.lineSoft, borderLeft: `3px solid ${TX.volt}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, color: TX.ink }}>
            {ex.note}{ex.videoCue ? <span style={{ color: TX.ink3 }}> · Tempo {ex.videoCue}</span> : null}
          </div>
        </>
      )}

      {/* Today's prescription */}
      <Label>Today's sets</Label>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: TX.surface, border: `1px solid ${TX.line}`, marginBottom: 8 }}>
        {ex.sets.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: i ? `1px solid ${TX.lineSoft}` : 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: TX.ink, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, fontWeight: 700, color: s.kind === 'Working' ? TX.ink : TX.ink3 }}>{s.kind}</div>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13, color: TX.ink }}>
              {s.kind === 'AMRAP' ? 'AMRAP' : `${s.reps} reps${s.kg ? ` · ${s.kg} kg` : ''}`}
            </div>
            {s.rest ? <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TX.ink3, width: 44, textAlign: 'right' }}>{Math.floor(s.rest / 60)}:{String(s.rest % 60).padStart(2, '0')}</div> : <div style={{ width: 44 }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

// In-session coach chat slideover — adjust the session on the fly.
function SessionCoachChat({ workout, onClose }) {
  const persona = window.STRIDE_CURRENT_PERSONA || { name: 'Coach' };
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const QUICK = [
    { label: 'Increase volume', reply: `Done — I added a 4th working set to your two main lifts. That's ${totalSets + 2} sets total now. Keep RPE under 8.` },
    { label: 'Go lighter today', reply: "No problem. I dropped the top sets by ~10% and bumped reps to keep the stimulus. Listen to your body." },
    { label: 'Add a set', reply: "Added one more working set to the current exercise. I'll watch your rest so the session doesn't run long." },
    { label: 'Cut it short', reply: "Trimming to the essentials — I'll drop the two isolation lifts at the end. You'll still hit the main movements." },
    { label: 'Swap an exercise', reply: "Sure — which one feels off? I can sub in a similar movement that fits your equipment." },
  ];
  const [msgs, setMsgs] = React.useState([
    { who: 'ai', text: `You're mid-session — ${workout.exercises.length} exercises, ${totalSets} sets. Want me to adjust anything? I can change volume, load, or swap a movement.` },
  ]);
  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = (text, reply) => {
    const t = (text || '').trim();
    if (!t) return;
    setMsgs((m) => [...m, { who: 'me', text: t }]);
    setInput('');
    setTimeout(() => {
      setMsgs((m) => [...m, { who: 'ai', text: reply || "Got it — I've updated today's session. You'll see the change on your next set." }]);
    }, 550);
  };

  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Quick actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {QUICK.map((q) => (
          <button key={q.label} onClick={() => send(q.label, q.reply)} style={{
            border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink, cursor: 'pointer',
            borderRadius: 999, padding: '8px 13px', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600,
          }}>{q.label}</button>
        ))}
      </div>

      {/* Thread */}
      <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%', padding: '10px 13px', borderRadius: 16,
              borderBottomRightRadius: m.who === 'me' ? 4 : 16,
              borderBottomLeftRadius: m.who === 'me' ? 16 : 4,
              background: m.who === 'me' ? TX.ink : TX.lineSoft,
              color: m.who === 'me' ? '#fff' : TX.ink,
              fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.45,
            }}>{m.who === 'me' ? m.text : window.renderCoachMarkdown(m.text)}</div>
          </div>
        ))}
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
function SummaryScreen({ go }) {
  const w = window.STRIDE_TODAYS_WORKOUT;
  const [feel, setFeel] = React.useState(4);
  const [rpe, setRpe] = React.useState(7);
  const [notes, setNotes] = React.useState('Bench felt smooth, no shoulder pain. Last set of dips was tough.');

  return (
    <Screen>
      <StrideHeader title="Nice work." kicker="Push · Strength A · 64 min" right={<IconBtn icon="close" onClick={() => go('home')}/>}/>
      <div style={{ padding: '0 20px' }}>
        <Card dark style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -50, top: -40, width: 180, height: 180, borderRadius: 180, background: TX.volt, opacity: 0.18, filter: 'blur(40px)' }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 72, color: '#fff', letterSpacing: -3, lineHeight: 1 }}>6,420</span>
              <span style={{ fontFamily: 'Inter', fontSize: 14, color: '#aaa', fontWeight: 700 }}>kg moved</span>
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#aaa', marginTop: 4 }}>+540 kg vs last push session</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #222' }}>
              <Stat label="Sets done" value="14/14"/>
              <Stat label="Avg RPE" value="7.5" muted/>
              <Stat label="PRs" value="1"/>
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

        <div style={{ height: 100 }}/>
      </div>

      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 100 }}>
        <StrideButton variant="primary" block size="lg" icon="check" onClick={() => go('home')}>
          Save session
        </StrideButton>
      </div>
    </Screen>
  );
}

function ExerciseSummaryRow({ ex }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14 }}>{ex.name}</div>
        <Chip bg={TX.green + '18'} ink={TX.green} dot color={TX.green}>Logged</Chip>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ex.sets.map((s, i) => {
          // mock actual reps: subtract 0-2 from target for working sets
          const actualReps = s.kind === 'AMRAP' ? 18 : Math.max(s.reps - (i === ex.sets.length - 1 ? 1 : 0), s.reps);
          const matched = actualReps === s.reps || s.kind === 'AMRAP';
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '20px 1fr 1fr 56px', gap: 8, alignItems: 'center',
              padding: '6px 8px', borderRadius: 8,
              background: i % 2 === 0 ? TX.lineSoft : 'transparent',
            }}>
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: TX.ink3, fontWeight: 700 }}>{i+1}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: TX.ink3 }}>{s.kind}</span>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13 }}>
                {s.kind === 'AMRAP' ? actualReps : s.reps} × {s.kg || '—'}{s.kg ? ' kg' : ''}
              </span>
              {matched
                ? <Chip bg={TX.green + '18'} ink={TX.green} style={{ fontSize: 9 }}>{s.kind === 'AMRAP' ? 'PR' : 'On target'}</Chip>
                : <Chip bg={TX.amber + '18'} ink={TX.amber} style={{ fontSize: 9 }}>-{s.reps - actualReps} rep</Chip>}
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
function ChatScreen({ go, persona }) {
  const [messages, setMessages] = React.useState(window.STRIDE_CHAT_SEED);
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

  React.useEffect(() => {
    if (searching && searchRef.current) searchRef.current.focus();
  }, [searching]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? messages.filter((m) => (m.text || '').toLowerCase().includes(q)
        || (m.cards || []).some((c) => `${c.title} ${c.subtitle || ''}`.toLowerCase().includes(q)))
    : messages;
  const matchCount = q ? filtered.length : 0;

  const send = (text) => {
    const t = (text || input).trim();
    if (!t) return;
    setMessages(m => [...m, { who: 'me', text: t }]);
    setInput('');
    setTyping(true);
    // Live coach (real API) when bridged; otherwise fall back to the canned demo reply.
    if (window.__strideCoach) {
      window.__strideCoach.send(t)
        .then(reply => { setTyping(false); setMessages(m => [...m, reply]); })
        .catch(() => { setTyping(false); setMessages(m => [...m, { who: 'ai', text: "Sorry — I couldn't reach your coach just now. Try again in a moment." }]); });
      return;
    }
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { who: 'ai', ...personaReply(persona.key, t) }]);
    }, 1200);
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
      <StrideHeader title={persona.name} right={
        <>
          <IconBtn icon="search" onClick={() => setSearching(s => !s)}
            bg={searching ? TX.ink : TX.surface} color={searching ? '#fff' : TX.ink} border={searching ? TX.ink : TX.line}/>
          <IconBtn icon="sliders"/>
        </>
      }/>

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

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((m, i) => <ChatBubble key={i} m={m} onCard={openCard} highlight={q}/>)}
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

      {/* Composer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 84,
        background: TX.bg, padding: '10px 20px 12px',
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
    </Screen>
  );
}

function ChatBubble({ m, onCard, highlight }) {
  const isMe = m.who === 'me';
  const hasCards = !isMe && m.cards && m.cards.length > 0;
  const renderText = (txt) => {
    // AI replies carry light markdown; the search-highlight path stays plain.
    if (!highlight && !isMe && txt) return window.renderCoachMarkdown(txt);
    if (!highlight || !txt) return txt;
    const parts = String(txt).split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
    return parts.map((p, i) =>
      p.toLowerCase() === highlight.toLowerCase()
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
      {hasCards && (
        <div style={{ marginTop: m.text ? 8 : 0, maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.cards.map((c, i) => <ChatCard key={i} card={c} onClick={() => onCard(c)}/>)}
        </div>
      )}
      {!isMe && m.proposals && m.proposals.length > 0 && (
        <div style={{ marginTop: (m.text || hasCards) ? 8 : 0, maxWidth: '92%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.proposals.map((p) => <ProposalCard key={p.id} p={p}/>)}
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
function ProposalCard({ p }) {
  const [status, setStatus] = React.useState(p.status || 'proposed');
  const [busy, setBusy] = React.useState(false);
  const icon = PROPOSAL_ICONS[p.operation] || 'sparkles';
  const done = status === 'applied';

  const act = (fn, next) => {
    if (busy || !window.__strideCoach || !fn) return;
    setBusy(true);
    Promise.resolve(fn(p.id))
      .then(() => { setStatus(next); setBusy(false); })
      .catch(() => setBusy(false));
  };
  if (status === 'dismissed') return null;

  return (
    <div style={{ width: '100%', background: TX.surface, border: `1px solid ${done ? TX.accent : TX.line}`, borderRadius: 16, padding: 13 }}>
      <div style={{ display: 'flex', gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: done ? TX.accent + '18' : TX.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name={done ? 'check' : icon} size={16} color={done ? TX.accent : TX.ink2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 800, color: done ? TX.accent : TX.ink3, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            {done ? window.t('Applied') : window.t('Proposed change')}{p.target ? ' · ' + p.target : ''}
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TX.ink, lineHeight: 1.25, marginTop: 3 }}>{p.text}</div>
          {p.why && <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TX.ink3, marginTop: 4, lineHeight: 1.4 }}>{p.why}</div>}
        </div>
      </div>
      {!done && (
        <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
          <button onClick={() => act(window.__strideCoach && window.__strideCoach.dismissProposal, 'dismissed')} disabled={busy} style={{
            flex: 'none', padding: '8px 16px', borderRadius: 11, border: `1px solid ${TX.line}`, background: TX.surface, color: TX.ink2,
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
          }}>{window.t('Dismiss')}</button>
          <button onClick={() => act(window.__strideCoach && window.__strideCoach.applyProposal, 'applied')} disabled={busy} style={{
            flex: 1, padding: '8px 16px', borderRadius: 11, border: 'none', background: TX.ink, color: '#fff',
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', opacity: busy ? 0.6 : 1,
          }}>{busy ? window.t('Applying…') : window.t('Apply')}</button>
        </div>
      )}
    </div>
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
