// New-user onboarding wizard. Collects the setup (experience, body, training
// style, goals, injuries, a spot, bio, start date) then drives the AI plan flow:
// persist → recommend options (user picks the length/split) → generate → reload.
// Reuses StepWrap/ChoiceCard (screens-train), Field/Seg/ChipEditor (screens-meta),
// StrideButton/Header/Screen/Card (ui). Unique theme alias to avoid redeclaration.
const TO = window.STRIDE_THEME;

const ONB_INPUT = {
  width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12,
  border: `1px solid ${TO.line}`, background: TO.surface, color: TO.ink,
  fontFamily: 'Inter', fontSize: 15, outline: 'none',
};

const ONB_STYLES = [
  { key: 'heavy', label: 'Heavy weights', icon: 'dumbbell' },
  { key: 'hypertrophy', label: 'Muscle building', icon: 'flame' },
  { key: 'calisthenics', label: 'Calisthenics', icon: 'sparkles' },
  { key: 'street', label: 'Street lifting', icon: 'trend' },
  { key: 'sprints', label: 'Sprints', icon: 'bolt' },
  { key: 'running', label: 'Running', icon: 'heart' },
  { key: 'hiit', label: 'HIIT', icon: 'flame' },
  { key: 'emom', label: 'EMOM', icon: 'timer' },
  { key: 'conditioning', label: 'Conditioning', icon: 'heart' },
  { key: 'mobility', label: 'Mobility', icon: 'target' },
  { key: 'flexibility', label: 'Flexibility', icon: 'target' },
];

const ONB_EXPERIENCE = [
  { label: 'Just starting', years: 0 },
  { label: '1–3 yr', years: 2 },
  { label: '3–5 yr', years: 4 },
  { label: '5+ yr', years: 7 },
];

// Local date helpers (browser) → YYYY-MM-DD without timezone drift.
function onbISO(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function onbAddDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function onbNextMonday() {
  const d = new Date();
  const diff = ((1 - d.getDay() + 7) % 7) || 7; // upcoming Monday (never today)
  d.setDate(d.getDate() + diff);
  return d;
}

function OnboardingScreen({ go }) {
  const last = 9; // step 9 = recommend/generate; steps 0–8 are the form
  // The profile wizard is MANDATORY for new users (no skip). An already-onboarded
  // athlete who taps "Build a plan" from home jumps straight to the start-date +
  // plan steps — their profile is kept, never re-collected.
  const alreadyOnboarded = !window.__strideNeedsOnboarding;
  const { lang } = window.useStrideI18n ? window.useStrideI18n() : { lang: 'en' };
  const [step, setStep] = React.useState(alreadyOnboarded ? 8 : 0);

  // collected data
  const [expIdx, setExpIdx] = React.useState(1);
  // NOTE: pre-filled TEST defaults so plan generation can be tried quickly.
  // Reset these to empty ('' / null / []) before any real launch.
  const [gender, setGender] = React.useState('male');
  const [birthYear, setBirthYear] = React.useState('2001');
  const [height, setHeight] = React.useState('180');
  const [weight, setWeight] = React.useState('90');
  const [goalWeight, setGoalWeight] = React.useState('85');
  const [days, setDays] = React.useState(6); // null = "Any" (let the coach decide)
  const [styles, setStyles] = React.useState(['calisthenics', 'hypertrophy', 'conditioning', 'mobility', 'street']);
  const [customStyles, setCustomStyles] = React.useState([]);
  const [goals, setGoals] = React.useState([
    'Front lever hold 10s clean',
    '90 degree handstand pushups clean 5x',
    'One arm pullup 3x each arm',
    '150kg barbell squat',
    '120kg weighted dip',
    '80kg weighted pullup',
  ]);
  const [injuries, setInjuries] = React.useState([]);
  const [spotName, setSpotName] = React.useState('');
  const [spotType, setSpotType] = React.useState('gym');
  const [spotEquip, setSpotEquip] = React.useState([]);
  const [bio, setBio] = React.useState('');
  const [notes, setNotes] = React.useState('Office job, like to train rather everyday, not longer than 1:30h.');
  const [startKey, setStartKey] = React.useState('today');
  const [startDate, setStartDate] = React.useState(onbISO(new Date()));
  const [prs, setPrs] = React.useState([
    { exercise_id: null, label: 'Front lever hold', metric_type: 'hold', metrics: { seconds: 5 }, achieved_on: null, form_quality: null },
    { exercise_id: null, label: 'One-arm pull-up (left arm)', metric_type: 'reps', metrics: { reps: 1 }, achieved_on: null, form_quality: null },
    { exercise_id: null, label: '90 degree handstand push-up', metric_type: 'reps', metrics: { reps: 1 }, achieved_on: null, form_quality: null },
    { exercise_id: null, label: 'Barbell squat', metric_type: 'load', metrics: { weight: 140, reps: 2 }, achieved_on: null, form_quality: null },
  ]);
  const [prAdding, setPrAdding] = React.useState(false);

  // plan phase (final step): 'idle' | 'recommending' | 'choose' | 'loadingQuestions'
  //                          | 'questions' | 'generating' | 'error'
  const [phase, setPhase] = React.useState('idle');
  const [options, setOptions] = React.useState([]);
  const [picked, setPicked] = React.useState(null);
  const [questions, setQuestions] = React.useState([]);

  const toggleStyle = (k) => setStyles(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
  const applyPreset = (key) => {
    setStartKey(key);
    setStartDate(onbISO(key === 'tomorrow' ? onbAddDays(1) : key === 'monday' ? onbNextMonday() : onbAddDays(0)));
  };

  // Persist the collected setup exactly once. The profile payload carries
  // onboarded:true, so finishing EITHER path (create a plan, or "start later")
  // records completion on the backend → the wizard never re-shows on next open.
  // Already-onboarded athletes keep their profile, so there's nothing to resubmit.
  const submittedRef = React.useRef(alreadyOnboarded);
  const submitOnce = () => {
    if (submittedRef.current) return Promise.resolve();
    submittedRef.current = true;
    return window.__strideSubmitOnboarding(payload());
  };

  const showBack = alreadyOnboarded || step > 0; // new users can't dismiss step 0
  const back = () => {
    if (alreadyOnboarded) { step > 8 ? setStep(s => s - 1) : go('home'); return; }
    setStep(s => Math.max(0, s - 1));
  };

  const payload = () => ({
    profile: {
      ...(height ? { height_cm: parseInt(height, 10) } : {}),
      ...(weight ? { weight_kg: parseFloat(weight) } : {}),
      ...(goalWeight ? { goal_weight_kg: parseFloat(goalWeight) } : {}),
      years_training: ONB_EXPERIENCE[expIdx].years,
      ...(gender ? { gender } : {}),
      ...(birthYear ? { birth_year: parseInt(birthYear, 10) } : {}),
      training_style: [...styles, ...customStyles],
      ...(days != null ? { days_per_week: days } : {}),
      ...(bio.trim() ? { bio: bio.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      units: 'metric',
      onboarded: true,
    },
    goals: goals.map(t => ({ title: t })),
    injuries: injuries.map(p => ({ body_part: p, severity: 'Mild', status: 'monitoring' })),
    spots: spotName.trim() ? [{ name: spotName.trim(), type: spotType, equipment: spotEquip }] : [],
    prs: prs,
  });

  // Shared: fetch options (optionally adjusting a selected `base` plan with a note).
  const fetchOptions = (note, base) => {
    setPhase('recommending');
    return window.__stridePlanRecommend(note, base)
      .then(opts => {
        setOptions(opts || []);
        setPicked((opts && opts[0]) || null);
        setPhase('choose');
      })
      .catch(() => setPhase('error'));
  };

  // Final step: persist the setup once, then ask the coach for plan options.
  const startRecommend = () => {
    setStep(last);
    setPhase('recommending');
    submitOnce()
      .then(() => fetchOptions())
      .catch(() => setPhase('error'));
  };

  // "I'll start later": finish onboarding (profile saved, marked complete) but skip
  // the plan — land in the app with an empty plan you can build anytime.
  const skipPlan = () => {
    setStep(last);
    setPhase('saving');
    submitOnce()
      .then(() => location.reload())
      .catch(() => setPhase('error'));
  };

  // Adjust the SELECTED plan: keep it as the base, apply the note on top.
  const adjustPlan = (note) => fetchOptions(note, picked);

  // "Generate this plan" → first ask the coach for a couple of clarifying questions
  // (missing PRs the goals imply + general context). Empty/failed → straight to build.
  // The pre-generation free-text is passed to /plan/generate as `note` (stored in
  // the plan's brief + used as context) rather than permanently editing profile
  // notes. A ref so doGenerate always reads the latest synchronously.
  const genNoteRef = React.useRef('');
  const startQuestions = (extra) => {
    if (!picked) return;
    genNoteRef.current = (extra || '').trim();
    setPhase('loadingQuestions');
    window.__stridePlanQuestions(picked)
      .then(qs => {
        if (qs && qs.length) { setQuestions(qs); setPhase('questions'); }
        else doGenerate();
      })
      .catch(() => doGenerate());
  };

  // Persist any answers (PRs + facts), then build the plan. Answers are optional —
  // skipping passes nothing and goes straight to generation.
  const doGenerate = (answers) => {
    if (!picked) return;
    setPhase('generating');
    const build = () => window.__stridePlanGenerate(picked, startDate, genNoteRef.current)
      .then((res) => {
        try {
          localStorage.setItem('stride_just_onboarded', '1');
          // The AI couldn't fully build the plan → a deterministic starter. Flag
          // it so Home can tell the user (survives the reload below).
          if (res && res.ai_degraded) localStorage.setItem('stride_plan_degraded', '1');
        } catch (e) {}
        location.reload();
      })
      .catch(() => setPhase('error'));
    if (answers && answers.length) window.__stridePlanAnswers(answers).then(build).catch(build);
    else build();
  };

  // Step 1 (basics) gates on the two required fields: gender + a plausible birth year.
  const yr = parseInt(birthYear, 10);
  const birthYearOk = birthYear !== '' && yr >= 1920 && yr <= new Date().getFullYear();
  const canAdvance = step !== 1 || (!!gender && birthYearOk);
  const advance = () => {
    if (!canAdvance) return;
    step === last - 1 ? startRecommend() : setStep(s => s + 1);
  };

  return (
    <Screen>
      <StrideHeader
        title={alreadyOnboarded ? 'Build a plan' : 'Set up Stride'}
        kicker={(alreadyOnboarded || step === last) ? null : window.t('Step {n} of {total}', { n: step + 1, total: last })}
        back={showBack} onBack={back}/>

      {/* progress — only during the mandatory profile wizard (steps 0–7) */}
      {!alreadyOnboarded && step < last && (
        <div style={{ padding: '0 20px 4px' }}>
          <div style={{ height: 4, background: TO.lineSoft, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${((step + 1) / last) * 100}%`, height: '100%', background: TO.accent, transition: 'width .4s' }}/>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 20px 40px' }}>
        {step === 0 && (
          <StepWrap title={window.t('Choose your language')} sub={window.t('You can change this anytime in settings.')}>
            <Seg value={lang} options={['en', 'sk']} labels={['English', 'Slovenčina']} onChange={(v) => window.setStrideLanguage && window.setStrideLanguage(v)}/>
          </StepWrap>
        )}

        {step === 1 && (
          <StepWrap title="The basics" sub="Gender and birth year shape your plan and loads — height and weight are optional.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={window.t('Training experience')}><Seg value={expIdx} options={ONB_EXPERIENCE.map((_, i) => i)} labels={ONB_EXPERIENCE.map(e => e.label)} onChange={setExpIdx}/></Field>
              <Field label="Gender" hint="Required"><Seg value={gender} options={['male', 'female']} labels={['Male', 'Female']} onChange={setGender}/></Field>
              <Field label="Year of birth" hint="Required"><input type="number" inputMode="numeric" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="e.g. 1995" style={ONB_INPUT}/></Field>
              <Field label="Height (cm)" hint="Optional"><input type="number" inputMode="numeric" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 180" style={ONB_INPUT}/></Field>
              <Field label="Weight (kg)" hint="Optional"><input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 78" style={ONB_INPUT}/></Field>
              <Field label="Goal weight (kg)" hint="Optional"><input type="number" inputMode="decimal" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} placeholder="Only if you have one" style={ONB_INPUT}/></Field>
            </div>
          </StepWrap>
        )}

        {step === 2 && (
          <StepWrap title="What do you like to train?" sub="Pick all that apply — your coach leans into these.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {ONB_STYLES.map(s => (
                <ChoiceCard key={s.key} active={styles.includes(s.key)} onClick={() => toggleStyle(s.key)} icon={s.icon} title={s.label} sub=""/>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Something else?" hint={window.t('{n} listed', { n: customStyles.length })}>
                <ChipEditor values={customStyles} onChange={setCustomStyles} color={TO.ink} placeholder="e.g. Olympic lifting"/>
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Days per week" hint="Optional">
                <Seg value={days == null ? 'any' : days} options={['any', 2, 3, 4, 5, 6]} labels={['Any', '2', '3', '4', '5', '6']} onChange={v => setDays(v === 'any' ? null : v)}/>
              </Field>
            </div>
          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap title="Your goals" sub="What are you chasing? Add a few — or skip.">
            <ChipEditor values={goals} onChange={setGoals} color={TO.accent} placeholder="e.g. Bench 100 kg"/>
          </StepWrap>
        )}

        {step === 4 && (
          <StepWrap title="Any injuries to program around?" sub="Your coach will avoid aggravating these.">
            <ChipEditor values={injuries} onChange={setInjuries} color={TO.rose || '#e11d48'} placeholder="e.g. Right shoulder"/>
          </StepWrap>
        )}

        {step === 5 && (
          <StepWrap title="Where will you train?" sub="Add your main spot so sessions fit your gear.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Spot name"><input value={spotName} onChange={e => setSpotName(e.target.value)} placeholder="e.g. Home garage" style={ONB_INPUT}/></Field>
              <Field label="Type"><Seg value={spotType} options={['gym', 'home', 'park']} labels={['Gym', 'Home', 'Park']} onChange={setSpotType}/></Field>
              <Field label="Equipment" hint={window.t('{n} listed', { n: spotEquip.length })}><ChipEditor values={spotEquip} onChange={setSpotEquip} color={TO.ink} placeholder="e.g. Barbell"/></Field>
            </div>
          </StepWrap>
        )}

        {step === 6 && (
          <StepWrap title="Anything else?" sub="A line about you and notes for your coach. Optional.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="About you"><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="e.g. Desk job, training before work, love compound lifts." style={{ ...ONB_INPUT, resize: 'vertical', fontSize: 13.5 }}/></Field>
              <Field label="Notes for your coach"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="e.g. Keep sessions under 60 min." style={{ ...ONB_INPUT, resize: 'vertical', fontSize: 13.5 }}/></Field>
            </div>
          </StepWrap>
        )}

        {step === 7 && (
          <StepWrap title="Your current bests" sub="Add a few personal records so your coach sets the right loads. Optional.">
            {prAdding ? (
              <PrEditor onSave={(pr) => { setPrs(p => [...p, pr]); setPrAdding(false); }} onCancel={() => setPrAdding(false)}/>
            ) : (
              <div>
                {prs.length > 0 && (
                  <div style={{ background: TO.surface, border: `1px solid ${TO.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
                    {prs.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: i ? `1px solid ${TO.lineSoft}` : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TO.ink }}>{p.label}</div>
                          <div style={{ fontFamily: 'Inter', fontSize: 12, color: TO.ink3, marginTop: 2 }}>{window.strideFormatPr ? window.strideFormatPr(p) : ''}{p.achieved_on ? ' · ' + p.achieved_on : ''}{p.form_quality ? ' · form ' + p.form_quality + '/5' : ''}</div>
                        </div>
                        <button onClick={() => setPrs(list => list.filter((_, j) => j !== i))} aria-label="Remove" style={{ border: 'none', background: 'none', cursor: 'pointer', color: TO.ink3, padding: 4 }}>
                          <StrideIcon name="trash" size={16} color={TO.ink3}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <StrideButton variant="ghost" icon="plus" block onClick={() => setPrAdding(true)}>Add a record</StrideButton>
              </div>
            )}
          </StepWrap>
        )}

        {step === 8 && (
          <StepWrap title="When do you want to start?" sub="Your plan begins on this day — ask your coach to shift it anytime.">
            <Seg value={startKey} options={['today', 'tomorrow', 'monday']} labels={['Today', 'Tomorrow', 'Next Monday']} onChange={applyPreset}/>
            <div style={{ marginTop: 14 }}>
              <Field label="Or pick a date">
                <input type="date" value={startDate} min={onbISO(new Date())}
                  onChange={e => { setStartDate(e.target.value); setStartKey('custom'); }}
                  style={{ ...ONB_INPUT, WebkitAppearance: 'none', minWidth: 0 }}/>
              </Field>
            </div>
          </StepWrap>
        )}

        {step === last && (
          <PlanStep phase={phase} options={options} picked={picked} setPicked={setPicked} questions={questions} onGenerate={startQuestions} onAnswers={doGenerate} onRetry={startRecommend} onAdjust={adjustPlan}/>
        )}
      </div>

      {step < last && (
        <div style={{ padding: '0 20px 28px' }}>
          <StrideButton variant="accent" block size="lg" iconRight="arrowRight" onClick={advance}
            style={{ opacity: canAdvance ? 1 : 0.5, pointerEvents: canAdvance ? 'auto' : 'none' }}>
            {step === last - 1 ? 'Create my plan' : 'Continue'}
          </StrideButton>
          {/* The plan is optional — finish setup and head into the app without one. */}
          {step === last - 1 && (
            <button onClick={skipPlan} style={{
              marginTop: 12, width: '100%', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'Inter', fontSize: 13.5, fontWeight: 700, color: TO.ink3,
            }}>I'll start later — skip the plan for now</button>
          )}
        </div>
      )}
    </Screen>
  );
}

// Final step — recommend, pick, (clarify), generate.
function PlanStep({ phase, options, picked, setPicked, questions, onGenerate, onAnswers, onRetry, onAdjust }) {
  const [adjusting, setAdjusting] = React.useState(false);
  const [note, setNote] = React.useState('');
  // Free-text context added to the coach right before generation.
  const [extra, setExtra] = React.useState('');

  if (phase === 'saving') {
    return <OnbBusy title="Saving your setup…" sub="Getting your profile ready."/>;
  }
  if (phase === 'recommending') {
    return <OnbBusy title="Designing your options…" sub="Your coach is matching a plan to your setup."/>;
  }
  if (phase === 'loadingQuestions') {
    return <OnbBusy title="A couple quick questions…" sub="Your coach is checking what else it needs to nail your loads."/>;
  }
  if (phase === 'questions') {
    return <QuestionsStep questions={questions} onSubmit={onAnswers} onSkip={() => onAnswers()}/>;
  }
  if (phase === 'generating') {
    return <OnbBusy title="Building your plan…" sub="Laying out your first week of sessions."/>;
  }
  if (phase === 'error') {
    return (
      <StepWrap title="That didn't go through" sub="Check your connection and try again.">
        <StrideButton variant="primary" block icon="sparkles" onClick={onRetry}>Try again</StrideButton>
      </StepWrap>
    );
  }
  // choose
  const submitAdjust = () => { if (!note.trim()) return; setAdjusting(false); onAdjust(note.trim()); setNote(''); };
  return (
    <StepWrap title="Pick your plan" sub="Recommended for you — you can change it later.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(options || []).map((o, i) => {
          const active = picked && picked.key === o.key;
          return (
            <button key={o.key || i} onClick={() => setPicked(o)} style={{
              textAlign: 'left', cursor: 'pointer', borderRadius: 16, padding: 16,
              border: `1.5px solid ${active ? TO.ink : TO.line}`,
              background: active ? TO.ink : TO.surface, color: active ? '#fff' : TO.ink,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16 }}>{o.name}</div>
                <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{window.t('{w} wk · {d}×', { w: o.weeks, d: o.days_per_week })}</span>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12.5, lineHeight: 1.45, marginTop: 6, opacity: active ? 0.85 : 0.65 }}>{o.summary}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, marginTop: 8, color: active ? TO.volt : TO.ink3 }}>{o.split}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10.5, color: TO.ink3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{window.t('Anything to add before we build it?')}</div>
        <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={3}
          placeholder={window.t('e.g. Calisthenics-skill focused; weighted pull-ups/dips for strength; accessories can be gym machines.')}
          style={{ ...ONB_INPUT, resize: 'vertical', fontSize: 13.5 }}/>
      </div>

      <div style={{ marginTop: 14 }}>
        <StrideButton variant="accent" block size="lg" icon="sparkles" onClick={() => onGenerate(extra)} style={{ opacity: picked ? 1 : 0.5 }}>Generate this plan</StrideButton>
      </div>

      {/* Tweak the SELECTED plan: keep it as the base, apply a change on top. */}
      {!adjusting ? (
        <button onClick={() => setAdjusting(true)} disabled={!picked} style={{
          marginTop: 14, width: '100%', border: 'none', background: 'none', cursor: picked ? 'pointer' : 'default',
          fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: TO.ink3, opacity: picked ? 1 : 0.5,
        }}>Tweak this plan instead</button>
      ) : (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: TO.surface, border: `1px solid ${TO.line}` }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10.5, color: TO.ink3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>What should change about “{picked && picked.name}”?</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: TO.ink3, marginBottom: 8 }}>Your coach keeps this plan and applies your change.</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} autoFocus
            placeholder="e.g. Make it 4 days, add more calisthenics, keep sessions short."
            style={{ ...ONB_INPUT, resize: 'vertical', fontSize: 13.5 }}/>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <StrideButton variant="ghost" size="md" onClick={() => { setAdjusting(false); setNote(''); }} style={{ flex: 'none' }}>Cancel</StrideButton>
            <StrideButton variant="primary" size="md" icon="sparkles" onClick={submitAdjust} style={{ flex: 1, opacity: note.trim() ? 1 : 0.5 }}>Apply change</StrideButton>
          </div>
        </div>
      )}
    </StepWrap>
  );
}

// Optional sub-step: the coach's clarifying questions before generating. `pr`
// questions adapt to the metric type via PrInput (+ a date); `text` questions are
// a free input. Everything is optional — answer what you can, skip the rest.
function QuestionsStep({ questions, onSubmit, onSkip }) {
  const [answers, setAnswers] = React.useState({});
  const today = new Date().toISOString().slice(0, 10);
  // Functional updates throughout so two fields edited before a re-render don't
  // clobber each other (PrInput calls onChange with a metrics→metrics updater).
  const setMetrics = (i, updater) => setAnswers(prev => {
    const cur = prev[i] || {};
    return Object.assign({}, prev, { [i]: Object.assign({}, cur, { metrics: updater(cur.metrics || {}) }) });
  });
  const setField = (i, key, val) => setAnswers(prev =>
    Object.assign({}, prev, { [i]: Object.assign({}, prev[i] || {}, { [key]: val }) }));

  const collect = () => (questions || []).map((q, i) => {
    const a = answers[i] || {};
    if (q.type === 'pr') {
      // Store under the short record name when the coach supplied one (the question
      // itself is too verbose as a PR label). Default the date to what the field
      // shows (today) so the PR carries its achieved-on even when untouched —
      // staleness is the whole point of a dated PR.
      return { type: 'pr', label: q.pr_label || q.label, metric_type: q.metric_type || 'load', metrics: a.metrics || {}, achieved_on: a.achieved_on || today, form_quality: a.form_quality || null, exercise_id: q.exercise_id || null };
    }
    return { type: 'text', label: q.label, text: (a.text || '').trim() };
  }).filter(a => a.type === 'pr'
    ? Object.keys(a.metrics).some(k => a.metrics[k] != null && a.metrics[k] !== '')
    : !!a.text);

  return (
    <StepWrap title="A few quick questions" sub="Your coach wants these to dial in your plan. Answer what you can — skip the rest.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(questions || []).map((q, i) => (
          <div key={q.key || i} style={{ padding: 14, borderRadius: 14, background: TO.surface, border: `1px solid ${TO.line}` }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TO.ink, marginBottom: q.hint ? 2 : 12 }}>{q.label}</div>
            {q.hint && <div style={{ fontFamily: 'Inter', fontSize: 12, color: TO.ink3, marginBottom: 12 }}>{q.hint}</div>}
            {q.type === 'pr' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PrInput metricType={q.metric_type || 'load'} value={(answers[i] || {}).metrics || {}} onChange={(u) => setMetrics(i, u)}/>
                <PrField label="When did you hit it?">
                  <input type="date" value={(answers[i] || {}).achieved_on || today} max={today}
                    onChange={e => setField(i, 'achieved_on', e.target.value)} style={ONB_INPUT}/>
                </PrField>
                <PrField label="Form quality"><FormQuality value={(answers[i] || {}).form_quality || null} onChange={(n) => setField(i, 'form_quality', n)}/></PrField>
              </div>
            ) : (
              <input value={(answers[i] || {}).text || ''} onChange={e => setField(i, 'text', e.target.value)}
                placeholder="Your answer" style={ONB_INPUT}/>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <StrideButton variant="accent" block size="lg" icon="sparkles" onClick={() => onSubmit(collect())}>Save &amp; generate plan</StrideButton>
        <button onClick={onSkip} style={{
          marginTop: 12, width: '100%', border: 'none', background: 'none', cursor: 'pointer',
          fontFamily: 'Inter', fontSize: 13.5, fontWeight: 700, color: TO.ink3,
        }}>Skip — just generate my plan</button>
      </div>
    </StepWrap>
  );
}

function OnbBusy({ title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 10px' }}>
      <div style={{ width: 46, height: 46, margin: '0 auto 18px', borderRadius: 23, border: `3px solid ${TO.lineSoft}`, borderTopColor: TO.accent, animation: 'spin .8s linear infinite' }}/>
      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, color: TO.ink }}>{title}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: TO.ink3, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { OnboardingScreen });
