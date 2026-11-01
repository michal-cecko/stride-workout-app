// ROUTINES — timed classes (yoga, pilates, cardio, strength) built from work,
// rest and loop steps, then run hands-free like an interval timer.
//
// A routine is a step tree; the runner flattens it into a timeline of timed
// segments and derives the position from the clock, so the timer stays right
// after the phone sleeps or the page reloads.

const TR = window.STRIDE_THEME;

const ROUTINE_KINDS = [
  { v: 'yoga', label: 'Yoga' },
  { v: 'pilates', label: 'Pilates' },
  { v: 'cardio', label: 'Cardio' },
  { v: 'strength', label: 'Strength' },
  { v: 'other', label: 'Other' },
];
const ROUTINE_MAX_LOOP_DEPTH = 2;
const ROUTINE_PREP_SECONDS = 5;
const ROUTINE_RUN_KEY = 'stride_routine_run';
const ROUTINE_SOUND_KEY = 'stride_routine_sound';

let routineIdSeq = 0;
function routineStepId() {
  routineIdSeq += 1;
  return 's' + Date.now().toString(36) + routineIdSeq;
}

function routineNewStep(type) {
  if (type === 'loop') return { id: routineStepId(), type: 'loop', times: 3, rest_between: 0, steps: [routineNewStep('work'), routineNewStep('rest')] };
  if (type === 'rest') return { id: routineStepId(), type: 'rest', seconds: 15, label: '' };
  return { id: routineStepId(), type: 'work', seconds: 40, label: '', exercise_id: null, note: '', both_sides: false };
}

// A copy with fresh step ids (duplicating a step or applying a template).
function routineCloneStep(step) {
  const copy = { ...step, id: routineStepId() };
  if (step.steps) copy.steps = step.steps.map(routineCloneStep);
  return copy;
}

const ROUTINE_TEMPLATES = [
  {
    title: 'Tabata', kind: 'cardio',
    steps: () => [{ id: routineStepId(), type: 'loop', times: 8, rest_between: 0, steps: [
      { ...routineNewStep('work'), seconds: 20 }, { ...routineNewStep('rest'), seconds: 10 },
    ] }],
  },
  {
    title: 'Intervals 40/20', kind: 'strength',
    steps: () => [{ id: routineStepId(), type: 'loop', times: 3, rest_between: 60, steps: [
      { ...routineNewStep('work'), seconds: 40 }, { ...routineNewStep('rest'), seconds: 20 },
      { ...routineNewStep('work'), seconds: 40 }, { ...routineNewStep('rest'), seconds: 20 },
      { ...routineNewStep('work'), seconds: 40 }, { ...routineNewStep('rest'), seconds: 20 },
    ] }],
  },
  {
    title: 'Flow, both sides', kind: 'yoga',
    steps: () => [
      { ...routineNewStep('work'), seconds: 60, label: window.t('Breathing') },
      { ...routineNewStep('work'), seconds: 45, both_sides: true },
      { ...routineNewStep('work'), seconds: 45, both_sides: true },
      { ...routineNewStep('work'), seconds: 45, both_sides: true },
      { ...routineNewStep('work'), seconds: 120, label: window.t('Relaxation') },
    ],
  },
];

// ---- timeline -------------------------------------------------------------------

// One segment per timed interval: loops are unrolled, "both sides" becomes a left
// and a right segment, and a loop's rest between rounds is skipped after the last.
function routineTimeline(steps) {
  const out = [];
  const walk = (list, rounds) => list.forEach((step) => {
    if (step.type === 'loop') {
      for (let r = 1; r <= step.times; r++) {
        const here = [...rounds, { i: r, n: step.times }];
        walk(step.steps || [], here);
        if (step.rest_between > 0 && r < step.times) out.push({ type: 'rest', seconds: step.rest_between, label: '', rounds: here, stepId: step.id });
      }
      return;
    }
    const seg = { type: step.type, seconds: step.seconds, label: step.label || '', exerciseId: step.exercise_id || null, note: step.note || '', rounds, stepId: step.id };
    if (step.type === 'work' && step.both_sides) out.push({ ...seg, side: 'left' }, { ...seg, side: 'right' });
    else out.push(seg);
  });
  walk(steps || [], []);
  return out;
}

function routineTotalSeconds(steps) {
  return routineTimeline(steps).reduce((n, s) => n + s.seconds, 0);
}

// Start offset of every segment, plus the end of the last one.
function routineStarts(durations) {
  const starts = [0];
  durations.forEach((d, i) => starts.push(starts[i] + d));
  return starts;
}

function routineIndexAt(starts, elapsed) {
  for (let i = 0; i < starts.length - 1; i++) if (elapsed < starts[i + 1]) return i;
  return starts.length - 1; // past the end: finished
}

function routineClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function routineCountSteps(steps) {
  return (steps || []).reduce((n, s) => n + 1 + (s.type === 'loop' ? routineCountSteps(s.steps) : 0), 0);
}

// ---- exercises + media -----------------------------------------------------------

// The routine's own exercise list (from the API) wins; the library covers exercises
// picked in the editor before the routine is saved.
function routineExercise(routine, id) {
  if (id == null) return null;
  const own = ((routine && routine.exercises) || []).find((e) => e.id === id);
  if (own) {
    return { id, name: own.name, video: own.video_url || '', image: own.image_url || own.thumbnail_url || '', cues: own.cues || [] };
  }
  const lib = findLibraryExercise(null, id);
  return lib ? { id, name: lib.name, video: lib.video || '', image: lib.image || '', cues: [] } : null;
}

function routineSegmentTitle(seg, ex) {
  if (seg.type === 'prep') return window.t('Get ready');
  if (ex) return ex.name;
  if (seg.label) return seg.label;
  return seg.type === 'rest' ? window.t('Rest') : window.t('Work');
}

// Only direct video files play inline; other links (e.g. YouTube pages) can't.
const ROUTINE_VIDEO_FILE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

function RoutineMedia({ ex, height, dim }) {
  if (!ex) return null;
  const media = ex.video && ROUTINE_VIDEO_FILE.test(ex.video)
    ? <video key={ex.video} src={ex.video} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
    : ex.image ? <img src={ex.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : null;
  if (!media) return null;
  return (
    <div style={{ height, borderRadius: 18, overflow: 'hidden', background: '#111', opacity: dim ? 0.55 : 1, flexShrink: 0 }}>
      {media}
    </div>
  );
}

// ---- list -----------------------------------------------------------------------

function readRoutineRun() {
  try {
    const run = JSON.parse(localStorage.getItem(ROUTINE_RUN_KEY) || 'null');
    // A run left open for hours is not one anybody means to continue.
    return run && Date.now() - run.startedAt < 6 * 3600 * 1000 ? run : null;
  } catch (e) { return null; }
}

function RoutinesScreen({ go }) {
  const [routines, setRoutines] = React.useState(null);
  const [error, setError] = React.useState('');
  const [open, setOpen] = React.useState(null);
  const [templatesOpen, setTemplatesOpen] = React.useState(false);
  const saved = readRoutineRun();

  const load = () => {
    setError('');
    window.__strideRoutines.list().then(setRoutines).catch(() => setError('Could not load your routines.'));
  };
  React.useEffect(load, []);

  const edit = (routine) => {
    window.STRIDE_ROUTINE = routine;
    go('routine-edit');
  };
  const fromTemplate = (tpl) => edit({ id: null, title: window.t(tpl.title), kind: tpl.kind, steps: tpl.steps() });

  return (
    <Screen>
      <StrideHeader title="Routines" kicker={window.t('Timed classes')} back onBack={() => go('workouts')}/>
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {saved && (
          <Card dark onClick={() => { window.STRIDE_ROUTINE = saved.routine; go('routine-run'); }} style={{ padding: 16 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: TR.volt }}>Unfinished</div>
            <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 17, marginTop: 4 }}>{window.t('Continue {title}', { title: saved.routine.title })}</div>
          </Card>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <StrideButton variant="primary" icon="plus" style={{ flex: 1 }} onClick={() => edit({ id: null, title: '', kind: 'yoga', steps: [routineNewStep('work')] })}>New routine</StrideButton>
          <StrideButton variant="ghost" onClick={() => setTemplatesOpen(true)}>Templates</StrideButton>
        </div>
        {error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.rose }}>{window.t(error)} <button onClick={load} style={{ border: 0, background: 'none', color: TR.ink, textDecoration: 'underline', font: 'inherit' }}>{window.t('Try again')}</button></div>}
        {!routines && !error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.ink3, padding: 8 }}>Loading…</div>}
        {routines && routines.length === 0 && (
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.ink3, lineHeight: 1.6, padding: '8px 2px' }}>
            Build a class from work, rest and loop steps. Add an exercise to see its video or picture while the timer runs.
          </div>
        )}
        {(routines || []).map((r) => (
          <Card key={r.id} onClick={() => setOpen(r)} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TR.ink3, marginTop: 3 }}>
                {window.t((ROUTINE_KINDS.find((k) => k.v === r.kind) || ROUTINE_KINDS[4]).label)} · {routineClock(r.total_seconds)} · {window.t('{n} steps', { n: r.step_count })}
              </div>
            </div>
            <StrideIcon name="chevR" size={18} color={TR.ink3}/>
          </Card>
        ))}
      </div>

      {templatesOpen && (
        <Sheet title={window.t('Start from a template')} onClose={() => setTemplatesOpen(false)}>
          {ROUTINE_TEMPLATES.map((tpl) => (
            <Card key={tpl.title} onClick={() => fromTemplate(tpl)} style={{ padding: 14, marginBottom: 8 }}>
              <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 15 }}>{tpl.title}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TR.ink3, marginTop: 3 }}>{routineClock(routineTotalSeconds(tpl.steps()))}</div>
            </Card>
          ))}
        </Sheet>
      )}
      {open && <RoutineSheet summary={open} go={go} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); load(); }}/>}
    </Screen>
  );
}

function RoutineSheet({ summary, go, onClose, onChanged }) {
  const [routine, setRoutine] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    window.__strideRoutines.get(summary.id).then(setRoutine).catch(() => setError('Could not load this routine.'));
  }, [summary.id]);

  const act = (action) => {
    setBusy(true);
    setError('');
    action().then(onChanged).catch(() => { setBusy(false); setError('Something went wrong. Try again.'); });
  };
  const remove = () => {
    if (window.confirm(window.t('Delete {title}?', { title: summary.title }))) act(() => window.__strideRoutines.remove(summary.id));
  };
  const timeline = routine ? routineTimeline(routine.steps) : [];

  return (
    <Sheet title={summary.title} onClose={onClose}>
      {error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.rose, marginBottom: 10 }}>{window.t(error)}</div>}
      {!routine && !error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.ink3 }}>Loading…</div>}
      {routine && <>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.ink2, marginBottom: 12 }}>
          {routineClock(routineTotalSeconds(routine.steps))} · {window.t('{n} intervals', { n: timeline.length })}
        </div>
        <StrideButton block variant="volt" size="lg" icon="play" disabled={!timeline.length} onClick={() => { window.STRIDE_ROUTINE = routine; go('routine-run'); }}>Start</StrideButton>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <StrideButton variant="ghost" icon="edit" style={{ flex: 1 }} disabled={busy} onClick={() => { window.STRIDE_ROUTINE = routine; go('routine-edit'); }}>Edit</StrideButton>
          <StrideButton variant="ghost" style={{ flex: 1 }} disabled={busy} onClick={() => act(() => window.__strideRoutines.duplicate(summary.id))}>Duplicate</StrideButton>
          <button disabled={busy} onClick={remove} aria-label="Delete" style={{ width: 48, flexShrink: 0, borderRadius: 14, border: `1.5px solid ${TR.line}`, background: TR.surface, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <StrideIcon name="trash" size={18} color={TR.rose}/>
          </button>
        </div>
        <div style={{ marginTop: 16, border: `1px solid ${TR.line}`, borderRadius: 14, overflow: 'hidden' }}>
          {timeline.map((seg, i) => {
            const ex = routineExercise(routine, seg.exerciseId);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderTop: i ? `1px solid ${TR.lineSoft}` : 'none', background: seg.type === 'rest' ? TR.bg : TR.surface }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: seg.type === 'rest' ? TR.ink3 : TR.accent, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0, fontFamily: 'Inter', fontSize: 13, fontWeight: seg.type === 'rest' ? 500 : 700, color: seg.type === 'rest' ? TR.ink3 : TR.ink }}>
                  {routineSegmentTitle(seg, ex)}{seg.side ? ` · ${window.t(seg.side === 'left' ? 'Left' : 'Right')}` : ''}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: TR.ink3 }}>{routineClock(seg.seconds)}</div>
              </div>
            );
          })}
        </div>
      </>}
    </Sheet>
  );
}

// ---- editor ---------------------------------------------------------------------

function routineValid(draft) {
  const ok = (steps, depth) => steps.length > 0 && steps.every((s) => s.type === 'loop'
    ? depth < ROUTINE_MAX_LOOP_DEPTH && s.times >= 1 && ok(s.steps || [], depth + 1)
    : s.seconds >= 1);
  return draft.title.trim() !== '' && ok(draft.steps, 0);
}

function RoutineEditScreen({ go }) {
  const initial = window.STRIDE_ROUTINE;
  const [draft, setDraft] = React.useState(() => JSON.parse(JSON.stringify(initial || { id: null, title: '', kind: 'yoga', steps: [] })));
  const [dirty, setDirty] = React.useState(!initial || initial.id == null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [picking, setPicking] = React.useState(null); // (exerciseId) => void

  const update = (patch) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const leave = () => {
    if (!dirty || window.confirm(window.t('Leave without saving?'))) go('routines');
  };
  const save = () => {
    setSaving(true);
    setError('');
    window.__strideRoutines.save(draft).then(() => go('routines')).catch((e) => {
      setSaving(false);
      setError((e && e.message) || 'Could not save the routine.');
    });
  };
  const total = routineTotalSeconds(draft.steps);

  return (
    <div style={{ background: TR.bg, height: '100%', paddingTop: window.STRIDE_SAFE_TOP, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <StrideHeader title={draft.id ? 'Edit routine' : 'New routine'} back onBack={leave}/>
      <div style={{ padding: '0 20px 24px' }}>
        <RoutineEditorFields draft={draft} update={update} onPick={(apply) => setPicking(() => apply)}/>
        {error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.rose, marginTop: 12 }}>{window.t(error)}</div>}
      </div>
      </div>

      <div style={{
        padding: window.STRIDE_NATIVE ? '12px 20px calc(12px + env(safe-area-inset-bottom))' : '12px 20px 20px',
        background: TR.bg, borderTop: `1px solid ${TR.line}`, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TR.ink3 }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Total</div>
          <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 18, color: TR.ink }}>{routineClock(total)}</div>
        </div>
        <StrideButton variant="primary" size="lg" style={{ flex: 1 }} disabled={saving || !routineValid(draft)} onClick={save}>
          {saving ? window.t('Saving…') : window.t('Save routine')}
        </StrideButton>
      </div>

      {picking && <RoutineExercisePicker onClose={() => setPicking(null)} onPick={(id) => { picking(id); setPicking(null); }}/>}
    </div>
  );
}

function RoutineEditorFields({ draft, update, onPick }) {
  return <>
    <input value={draft.title} onChange={(e) => update({ title: e.target.value })} placeholder="Routine name" aria-label="Routine name"
      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: `1px solid ${TR.line}`, borderRadius: 12, background: TR.surface, font: '800 16px Archivo, sans-serif', color: TR.ink }}/>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0 16px' }}>
      {ROUTINE_KINDS.map((k) => (
        <button key={k.v} onClick={() => update({ kind: k.v })} style={{
          border: `1px solid ${draft.kind === k.v ? TR.ink : TR.line}`, background: draft.kind === k.v ? TR.ink : TR.surface,
          color: draft.kind === k.v ? '#fff' : TR.ink2, borderRadius: 999, padding: '7px 12px', font: '700 12px Inter, sans-serif', cursor: 'pointer',
        }}>{k.label}</button>
      ))}
    </div>
    <RoutineStepList steps={draft.steps} depth={0} routine={draft} onPick={onPick} onChange={(steps) => update({ steps })}/>
  </>;
}

function RoutineStepList({ steps, depth, routine, onChange, onPick }) {
  const [openId, setOpenId] = React.useState(null);
  const set = (i, step) => onChange(steps.map((s, j) => (j === i ? step : s)));
  const move = (i, by) => {
    const next = steps.slice();
    const [step] = next.splice(i, 1);
    next.splice(i + by, 0, step);
    onChange(next);
  };
  const add = (type) => {
    const step = routineNewStep(type);
    onChange([...steps, step]);
    setOpenId(step.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((step, i) => (
        <RoutineStepRow key={step.id} step={step} depth={depth} routine={routine} onPick={onPick}
          open={openId === step.id} onToggle={() => setOpenId(openId === step.id ? null : step.id)}
          onChange={(s) => set(i, s)}
          onUp={i > 0 ? () => move(i, -1) : null}
          onDown={i < steps.length - 1 ? () => move(i, 1) : null}
          onDuplicate={() => onChange([...steps.slice(0, i + 1), routineCloneStep(step), ...steps.slice(i + 1)])}
          onDelete={() => onChange(steps.filter((_, j) => j !== i))}/>
      ))}
      <div style={{ display: 'flex', gap: 6 }}>
        <RoutineAddButton label="Work" onClick={() => add('work')}/>
        <RoutineAddButton label="Rest" onClick={() => add('rest')}/>
        {depth < ROUTINE_MAX_LOOP_DEPTH && <RoutineAddButton label="Loop" onClick={() => add('loop')}/>}
      </div>
    </div>
  );
}

function RoutineAddButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '9px 6px', border: `1.5px dashed ${TR.line}`, borderRadius: 12, background: 'transparent',
      font: '700 12px Inter, sans-serif', color: TR.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    }}>
      <StrideIcon name="plus" size={14} color={TR.ink2}/>{window.t(label)}
    </button>
  );
}

function RoutineStepRow({ step, depth, routine, open, onToggle, onChange, onUp, onDown, onDuplicate, onDelete, onPick }) {
  const patch = (p) => onChange({ ...step, ...p });
  const ex = routineExercise(routine, step.exercise_id);
  const isLoop = step.type === 'loop';
  const title = isLoop ? window.t('Repeat {n}×', { n: step.times }) : routineSegmentTitle(step, ex);
  const duration = isLoop ? routineTotalSeconds([step]) : step.seconds * (step.both_sides ? 2 : 1);
  const accent = step.type === 'rest' ? TR.ink3 : isLoop ? TR.blue : TR.accent;
  const small = { width: 30, height: 30, borderRadius: 8, border: `1px solid ${TR.line}`, background: TR.surface, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 };

  return (
    <div style={{ border: `1px solid ${TR.line}`, borderLeft: `4px solid ${accent}`, borderRadius: 14, background: step.type === 'rest' ? TR.bg : TR.surface }}>
      <div onClick={onToggle} role="button" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 12px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Archivo', fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TR.ink3, marginTop: 2 }}>
            {routineClock(duration)}{step.both_sides ? ` · ${window.t('both sides')}` : ''}{isLoop && step.rest_between ? ` · ${window.t('{s} rest between rounds', { s: routineClock(step.rest_between) })}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button style={{ ...small, opacity: onUp ? 1 : 0.3 }} disabled={!onUp} onClick={onUp} aria-label="Move up"><StrideIcon name="arrowUp" size={14}/></button>
          <button style={{ ...small, opacity: onDown ? 1 : 0.3 }} disabled={!onDown} onClick={onDown} aria-label="Move down"><StrideIcon name="arrowDown" size={14}/></button>
        </div>
      </div>

      {open && (
        <div style={{ padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {step.type === 'work' && <>
            <button onClick={() => onPick((id) => patch({ exercise_id: id }))} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: `1px solid ${TR.line}`,
              background: TR.bg, font: '600 13px Inter, sans-serif', color: TR.ink, cursor: 'pointer', textAlign: 'left',
            }}>
              <StrideIcon name="dumbbell" size={16}/>
              <span style={{ flex: 1 }}>{ex ? ex.name : window.t('Choose an exercise')}</span>
              {ex && <span onClick={(e) => { e.stopPropagation(); patch({ exercise_id: null }); }} role="button" aria-label="Remove exercise"><StrideIcon name="x" size={14} color={TR.ink3}/></span>}
            </button>
            {ex && <RoutineMedia ex={ex} height={140}/>}
          </>}
          {!isLoop && (
            <RoutineTextField value={step.label} onChange={(label) => patch({ label })}
              placeholder={step.type === 'rest' ? 'Label (optional)' : ex ? 'Own name (optional)' : 'Name, e.g. Plank'}/>
          )}
          {!isLoop && <RoutineSeconds label={step.type === 'rest' ? 'Rest' : step.both_sides ? 'Each side' : 'Duration'} value={step.seconds} onChange={(seconds) => patch({ seconds })}/>}
          {step.type === 'work' && <>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: '700 13px Inter, sans-serif' }}>
              {window.t('Both sides (left, then right)')}
              <StrideToggle on={!!step.both_sides} onChange={(v) => patch({ both_sides: v })}/>
            </label>
            <RoutineTextField value={step.note} onChange={(note) => patch({ note })} placeholder="Cue for you, e.g. keep hips square" multiline/>
          </>}
          {isLoop && <>
            <RoutineNumber label="Rounds" value={step.times} min={1} max={50} onChange={(times) => patch({ times })}/>
            <RoutineSeconds label="Rest between rounds" value={step.rest_between} min={0} onChange={(rest_between) => patch({ rest_between })}/>
            <div style={{ paddingLeft: 8, borderLeft: `2px solid ${TR.lineSoft}` }}>
              <RoutineStepList steps={step.steps} depth={depth + 1} routine={routine} onPick={onPick} onChange={(steps) => patch({ steps })}/>
            </div>
          </>}
          <div style={{ display: 'flex', gap: 8 }}>
            <StrideButton variant="ghost" size="sm" style={{ flex: 1 }} onClick={onDuplicate}>Duplicate</StrideButton>
            <StrideButton variant="ghost" size="sm" icon="trash" style={{ flex: 1 }} onClick={onDelete}>Remove</StrideButton>
          </div>
        </div>
      )}
    </div>
  );
}

function RoutineTextField({ value, onChange, placeholder, multiline }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <Tag value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} rows={multiline ? 2 : undefined}
      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${TR.line}`, borderRadius: 10, background: TR.surface, font: '14px Inter, sans-serif', color: TR.ink, resize: 'vertical' }}/>
  );
}

function RoutineStepper({ label, display, onSub, onAdd }) {
  const btn = { width: 38, height: 38, borderRadius: 10, border: `1px solid ${TR.line}`, background: TR.surface, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, font: '700 13px Inter, sans-serif', color: TR.ink2 }}>{window.t(label)}</div>
      <button style={btn} onClick={onSub} aria-label={window.t('Less')}><StrideIcon name="minus" size={16}/></button>
      <div style={{ minWidth: 56, textAlign: 'center', fontFamily: 'Archivo', fontWeight: 900, fontSize: 18 }}>{display}</div>
      <button style={btn} onClick={onAdd} aria-label={window.t('More')}><StrideIcon name="plus" size={16}/></button>
    </div>
  );
}

// 5 s steps under a minute, 15 s above: fine control for short intervals without
// tapping forever for long holds.
function RoutineSeconds({ label, value, onChange, min = 5 }) {
  const step = (dir) => (dir > 0 ? (value < 60 ? 5 : 15) : (value <= 60 ? 5 : 15));
  return <RoutineStepper label={label} display={routineClock(value)}
    onSub={() => onChange(Math.max(min, value - step(-1)))} onAdd={() => onChange(Math.min(3600, value + step(1)))}/>;
}

function RoutineNumber({ label, value, onChange, min, max }) {
  return <RoutineStepper label={label} display={`${value}×`}
    onSub={() => onChange(Math.max(min, value - 1))} onAdd={() => onChange(Math.min(max, value + 1))}/>;
}

function routineFold(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function RoutineExercisePicker({ onPick, onClose }) {
  const [query, setQuery] = React.useState('');
  const all = React.useMemo(() => {
    const out = [];
    const walk = (node, category) => {
      (node.exercises || []).forEach((e) => out.push({ ...e, category }));
      (node.children || []).forEach((c) => walk(c, node.id === 'root' ? c.name : `${category} · ${c.name}`));
    };
    if (window.STRIDE_LIBRARY) walk(window.STRIDE_LIBRARY, '');
    return out;
  }, []);
  const q = routineFold(query.trim());
  const hits = (q ? all.filter((e) => routineFold(e.name).includes(q) || routineFold(e.nameEn).includes(q)) : all).slice(0, 60);

  return (
    <Sheet title={window.t('Choose an exercise')} onClose={onClose}>
      <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises" aria-label="Search exercises"
        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: `1px solid ${TR.line}`, borderRadius: 12, background: TR.bg, font: '14px Inter, sans-serif', marginBottom: 10 }}/>
      {hits.map((e) => (
        <button key={e.id} onClick={() => onPick(e.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 4px', border: 0, borderBottom: `1px solid ${TR.lineSoft}`,
          background: 'none', textAlign: 'left', cursor: 'pointer',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '700 14px Inter, sans-serif', color: TR.ink }}>{e.name}</div>
            <div style={{ font: '12px Inter, sans-serif', color: TR.ink3, marginTop: 2 }}>{e.category}</div>
          </div>
          {(e.video || e.image) && <StrideIcon name={e.video ? 'play' : 'eye'} size={14} color={TR.ink3}/>}
        </button>
      ))}
      {!hits.length && <div style={{ font: '13px Inter, sans-serif', color: TR.ink3, padding: 8 }}>No exercise found.</div>}
    </Sheet>
  );
}

// ---- runner ---------------------------------------------------------------------

// Short tones from one AudioContext, created on the Start tap (iOS only lets a
// page start audio from a user gesture). "ambient" lets the class music keep
// playing under the beeps where the browser supports the Audio Session API.
function routineAudio() {
  if (!window.__strideRoutineAudio) {
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'ambient';
      const Ctx = window.AudioContext || window.webkitAudioContext;
      window.__strideRoutineAudio = Ctx ? new Ctx() : null;
    } catch (e) { window.__strideRoutineAudio = null; }
  }
  const ctx = window.__strideRoutineAudio;
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function routineBeep(freq, seconds) {
  const ctx = routineAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

function routineSay(text) {
  if (!window.speechSynthesis || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = window.readStrideLanguage() === 'sk' ? 'sk-SK' : 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function readRoutineSound() {
  try { return { beeps: true, voice: false, ...JSON.parse(localStorage.getItem(ROUTINE_SOUND_KEY) || '{}') }; } catch (e) { return { beeps: true, voice: false }; }
}

// Keep the screen on while the timer runs; the lock drops whenever the page is
// hidden, so take it again when the page comes back.
function useRoutineWakeLock(active) {
  React.useEffect(() => {
    if (!active || !navigator.wakeLock) return undefined;
    let lock = null;
    let alive = true;
    const take = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock.request('screen').then((l) => { if (alive) lock = l; else l.release(); }).catch(() => {});
    };
    take();
    document.addEventListener('visibilitychange', take);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', take);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}

function routineSegments(steps) {
  return [{ type: 'prep', seconds: ROUTINE_PREP_SECONDS, label: '', exerciseId: null, note: '', rounds: [] }, ...routineTimeline(steps)];
}

function routineRestoreRun(routine, segments) {
  const saved = readRoutineRun();
  return saved && routine.id != null && saved.routine.id === routine.id && saved.durations.length === segments.length ? saved : null;
}

function routineSideText(seg) {
  return seg && seg.side ? ` · ${window.t(seg.side === 'left' ? 'Left' : 'Right')}` : '';
}

const ROUTINE_SEGMENT_COLORS = { work: TR.volt, prep: TR.amber, rest: '#9BB7FF' };

// The timer itself, shared by the phone runner and the desktop studio. `run` is
// null until the routine starts; while it runs, its own copy of the routine is
// what plays, so edits to a draft never change a running timer.
function useRoutineRun(routine, { autoStart, onCancel }) {
  const newRun = (r, from) => {
    const durations = routineSegments(r.steps).map((s) => s.seconds);
    return { routine: r, durations, base: routineStarts(durations)[from], anchor: Date.now(), paused: false, startedAt: Date.now() };
  };
  const [run, setRun] = React.useState(() => routineRestoreRun(routine, routineSegments(routine.steps)) || (autoStart ? newRun(routine, 0) : null));
  const active = run ? run.routine : routine;
  const segments = React.useMemo(() => routineSegments(active.steps), [active]);
  const [now, setNow] = React.useState(Date.now());
  const [sound, setSound] = React.useState(readRoutineSound);
  const [result, setResult] = React.useState(null); // { saved, elapsed } once logged
  const cue = React.useRef('');

  // Another routine opened while idle: pick up its unfinished run, if any.
  React.useEffect(() => {
    if (!run) {
      const saved = routineRestoreRun(routine, segments);
      if (saved) setRun(saved);
    }
  }, [routine.id]);

  // The clock: elapsed = base + (now - anchor) while running, base while paused.
  // Skip/back/+15 s only move base or a segment's duration, so nothing drifts.
  const durations = run ? run.durations : segments.map((s) => s.seconds);
  const starts = routineStarts(durations);
  const total = starts[starts.length - 1];
  const elapsed = !run ? 0 : Math.min(total, run.paused ? run.base : run.base + (now - run.anchor) / 1000);
  const idx = routineIndexAt(starts, elapsed);
  const finished = !!run && idx >= segments.length;
  const seg = segments[Math.min(idx, segments.length - 1)];
  const left = finished ? 0 : starts[idx + 1] - elapsed;
  const nextIdx = segments.findIndex((s, i) => i > idx && s.type === 'work');
  const next = nextIdx >= 0 ? segments[nextIdx] : null;
  const ex = routineExercise(active, seg.exerciseId);
  const nextEx = next ? routineExercise(active, next.exerciseId) : null;
  const ticking = !!run && !run.paused && !result;

  React.useEffect(() => {
    if (!ticking) return undefined;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [ticking]);

  React.useEffect(() => {
    if (!run || result) return;
    try { localStorage.setItem(ROUTINE_RUN_KEY, JSON.stringify(run)); } catch (e) {}
  }, [run, result]);

  useRoutineWakeLock(ticking);

  // Beeps on the last 3 seconds and a longer tone when a segment starts; the voice
  // names what starts now. Keyed by segment + second so a re-render never repeats one.
  React.useEffect(() => {
    if (!ticking || finished) return;
    const sec = Math.ceil(left);
    const key = `${idx}:${sec}`;
    if (cue.current === key) return;
    const first = cue.current === '';
    cue.current = key;
    if (first && elapsed > 0.5) return; // resumed mid-segment: no stray cue
    if (sound.beeps && sec <= 3 && sec >= 1) routineBeep(660, 0.12);
    if (sec === Math.ceil(durations[idx])) {
      if (sound.beeps && seg.type !== 'prep') routineBeep(seg.type === 'rest' ? 440 : 990, 0.35);
      if (sound.voice) {
        if (seg.type === 'work') routineSay(routineSegmentTitle(seg, ex) + routineSideText(seg));
        else if (seg.type === 'rest' && next) routineSay(window.t('Rest. Next: {name}', { name: routineSegmentTitle(next, nextEx) + routineSideText(next) }));
      }
    }
  });

  const finish = (completed) => {
    const done = Math.round(elapsed);
    try { localStorage.removeItem(ROUTINE_RUN_KEY); } catch (e) {}
    if (!completed && done < 60) { setRun(null); onCancel(); return; } // a false start is not a workout
    setResult({ saved: null, elapsed: done });
    window.__strideRoutines.logRun(active.id, {
      started_at: new Date(run.startedAt).toISOString(),
      completed_at: new Date().toISOString(),
      elapsed_seconds: done,
      completed,
    }).then(() => setResult({ saved: true, elapsed: done })).catch(() => setResult({ saved: false, elapsed: done }));
  };
  React.useEffect(() => {
    if (finished && !result) {
      if (sound.beeps) routineBeep(990, 0.8);
      finish(true);
    }
  }, [finished]);

  // `from` is a segment index; a start past the first skips "get ready".
  const start = (from = 0, r = routine) => {
    routineAudio(); // a tap is the moment iOS lets audio start
    cue.current = from > 0 ? 'jump' : '';
    setResult(null);
    setRun(newRun(r, from));
    setNow(Date.now());
  };
  const jumpTo = (target) => {
    cue.current = 'jump'; // not '' — a jump should still sound the start of the segment
    setRun((r) => ({ ...r, base: Math.max(0, Math.min(total, target)), anchor: Date.now() }));
    setNow(Date.now());
  };
  const togglePause = () => {
    routineAudio();
    setRun((r) => (r.paused
      ? { ...r, paused: false, anchor: Date.now() }
      : { ...r, paused: true, base: Math.min(total, r.base + (Date.now() - r.anchor) / 1000) }));
    setNow(Date.now());
  };
  const toggleSound = (k) => setSound((s) => {
    const nextSound = { ...s, [k]: !s[k] };
    try { localStorage.setItem(ROUTINE_SOUND_KEY, JSON.stringify(nextSound)); } catch (e) {}
    return nextSound;
  });
  // Close the result: back to an idle timer for the same routine.
  const reset = () => {
    if (result && result.saved && window.__strideRefresh) window.__strideRefresh();
    setResult(null);
    setRun(null);
  };

  return {
    routine: active, segments, run, result, sound, durations, starts, total, elapsed, idx, seg, left, next, nextIdx, ex, nextEx,
    pct: durations[idx] ? left / durations[idx] : 0,
    color: ROUTINE_SEGMENT_COLORS[seg.type],
    rounds: seg.rounds.map((r) => window.t('Round {i}/{n}', { i: r.i, n: r.n })).join(' · '),
    start, jumpTo, togglePause, finish, toggleSound, reset,
    skip: () => jumpTo(starts[idx + 1]),
    back: () => jumpTo(elapsed - starts[idx] > 2 || idx === 0 ? starts[idx] : starts[idx - 1]),
    jumpToSegment: (i) => jumpTo(starts[i]),
    addTime: () => setRun((r) => ({ ...r, durations: r.durations.map((d, i) => (i === idx ? d + 15 : d)) })),
  };
}

function RoutineResult({ title, result, onDone }) {
  return (
    <div style={{ background: TR.ink, color: '#fff', height: '100%', padding: 24, paddingTop: window.STRIDE_SAFE_TOP, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      <StrideIcon name="check" size={48} color={TR.volt}/>
      <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 28, textAlign: 'center' }}>{title}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 15, color: '#bbb' }}>{routineClock(result.elapsed)}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: result.saved === false ? TR.rose : '#888', textAlign: 'center' }}>
        {result.saved === null ? window.t('Saving to your history…') : result.saved ? window.t('Saved to your workouts.') : window.t('Could not save it to your history.')}
      </div>
      <StrideButton variant="volt" size="lg" style={{ marginTop: 12, minWidth: 200 }} disabled={result.saved === null} onClick={onDone}>Done</StrideButton>
    </div>
  );
}

function RoutineEndSheet({ elapsed, onEnd, onClose }) {
  return (
    <Sheet title={window.t('End the routine?')} onClose={onClose}>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.ink2, lineHeight: 1.6, marginBottom: 14 }}>
        {elapsed >= 60 ? window.t('The time so far is saved to your workouts.') : window.t('Under a minute is not saved.')}
      </div>
      <StrideButton block variant="primary" onClick={() => { onClose(); onEnd(); }}>End now</StrideButton>
      <StrideButton block variant="ghost" style={{ marginTop: 8 }} onClick={onClose}>Keep going</StrideButton>
    </Sheet>
  );
}

function RoutineSoundPills({ sound, onToggle }) {
  const pill = (on) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 999, border: `1px solid ${on ? TR.volt : '#333'}`, background: on ? TR.volt : 'transparent', color: on ? TR.ink : '#888', font: '700 10px Inter, sans-serif', textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' });
  return <>
    <button style={pill(sound.beeps)} onClick={() => onToggle('beeps')} aria-label="Beeps">{window.t('Beeps')}</button>
    <button style={pill(sound.voice)} onClick={() => onToggle('voice')} aria-label="Voice">{window.t('Voice')}</button>
  </>;
}

function RoutineRunScreen({ go }) {
  const routine = window.STRIDE_ROUTINE;
  React.useEffect(() => { if (!routine) go('routines'); }, []);
  return routine ? <RoutineRunner routine={routine} go={go}/> : null;
}

function RoutineRunner({ routine, go }) {
  const p = useRoutineRun(routine, { autoStart: true, onCancel: () => go('routines') });
  const [ending, setEnding] = React.useState(false);

  if (p.result) return <RoutineResult title={p.routine.title} result={p.result} onDone={() => { p.reset(); go('routines'); }}/>;

  const { run, seg, ex, next, nextEx } = p;
  const isRest = seg.type !== 'work';
  const ctrl = { width: 60, height: 60, borderRadius: 16, background: '#222', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' };

  return (
    <div style={{ background: TR.ink, color: '#fff', width: '100%', height: '100%', position: 'relative', overflow: 'hidden', paddingTop: window.STRIDE_SAFE_TOP, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBtn icon="close" onClick={() => setEnding(true)} bg="#222" color="#fff" border="#333" size={36}/>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.routine.title}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#888', marginTop: 2 }}>{routineClock(p.elapsed)} / {routineClock(p.total)}</div>
        </div>
        <RoutineSoundPills sound={p.sound} onToggle={p.toggleSound}/>
      </div>
      <div style={{ padding: '0 18px' }}>
        <div style={{ height: 4, borderRadius: 4, background: '#222', overflow: 'hidden' }}>
          <div style={{ width: `${(p.elapsed / p.total) * 100}%`, height: '100%', background: TR.volt }}/>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '14px 18px 0', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: 'Inter', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          <span style={{ color: p.color }}>{window.t(seg.type === 'work' ? 'Work' : seg.type === 'prep' ? 'Get ready' : 'Rest')}</span>
          <span style={{ color: '#888' }}>{p.rounds}</span>
        </div>

        {seg.type === 'work'
          ? <RoutineMedia ex={ex} height="30%"/>
          : <RoutineMedia ex={nextEx} height="24%" dim/>}

        <div>
          {isRest && next && <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Up next</div>}
          <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>
            {isRest && next ? routineSegmentTitle(next, nextEx) + routineSideText(next) : routineSegmentTitle(seg, ex) + routineSideText(seg)}
          </div>
        </div>

        <button onClick={p.togglePause} aria-label={run.paused ? 'Resume' : 'Pause'} style={{ position: 'relative', alignSelf: 'center', width: 200, height: 200, background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="100" cy="100" r="90" stroke="#222" strokeWidth="7" fill="none"/>
            <circle cx="100" cy="100" r="90" stroke={run.paused ? '#555' : p.color} strokeWidth="7" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90} strokeDashoffset={2 * Math.PI * 90 * (1 - p.pct)}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 64, color: run.paused ? '#888' : '#fff', letterSpacing: -2, lineHeight: 1 }}>{routineClock(p.left)}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: run.paused ? TR.volt : '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginTop: 6 }}>
                {run.paused ? window.t('Paused · tap to resume') : window.t('Tap to pause')}
              </div>
            </div>
          </div>
        </button>

        {seg.type === 'work' && (seg.note || (ex && ex.cues.length > 0)) && (
          <div style={{ padding: '10px 14px', background: '#1a1a1a', borderRadius: 12, fontFamily: 'Inter', fontSize: 13, color: '#ddd', lineHeight: 1.5 }}>
            {seg.note || ex.cues.join(' · ')}
          </div>
        )}
        {!isRest && next && (
          <div style={{ padding: '10px 14px', background: '#1a1a1a', borderRadius: 12, display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: 'Inter', fontSize: 13 }}>
            <span style={{ color: '#888' }}>{window.t('Next')}</span>
            <span style={{ flex: 1, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{routineSegmentTitle(next, nextEx) + routineSideText(next)}</span>
            <span style={{ color: '#888' }}>{routineClock(p.durations[p.nextIdx])}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: window.STRIDE_NATIVE ? '14px 18px calc(14px + env(safe-area-inset-bottom))' : '14px 18px 24px' }}>
        <button style={ctrl} onClick={p.back} aria-label="Back"><StrideIcon name="skipBack" size={22} color="#fff"/></button>
        <StrideButton variant="volt" size="lg" icon={run.paused ? 'play' : 'pause'} style={{ flex: 1 }} onClick={p.togglePause}>{run.paused ? 'Resume' : 'Pause'}</StrideButton>
        <button style={ctrl} onClick={p.addTime} aria-label="Add 15 seconds">
          <div style={{ textAlign: 'center' }}><StrideIcon name="plus" size={18} color="#fff" style={{ margin: '0 auto' }}/><div style={{ font: '700 9px Inter, sans-serif', color: '#888' }}>15s</div></div>
        </button>
        <button style={ctrl} onClick={p.skip} aria-label="Skip"><StrideIcon name="skip" size={22} color="#fff"/></button>
      </div>

      {ending && <RoutineEndSheet elapsed={p.elapsed} onEnd={() => p.finish(false)} onClose={() => setEnding(false)}/>}
    </div>
  );
}

// ---- desktop studio -------------------------------------------------------------

// Desktop: one screen with the editor on the left, the timer stage in the middle
// and every interval on the right, like a web interval timer.
const ROUTINE_ROOMY_QUERY = '(min-width: 1280px)';
const ROUTINE_EMPTY = { id: null, title: '', kind: 'yoga', steps: [] };

function useRoutineRoomy() {
  const [roomy, setRoomy] = React.useState(() => window.matchMedia(ROUTINE_ROOMY_QUERY).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(ROUTINE_ROOMY_QUERY);
    const on = () => setRoomy(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return roomy;
}

function RoutineStudio({ screen }) {
  const [routines, setRoutines] = React.useState(null);
  const [listError, setListError] = React.useState('');
  // The open routine as an editable copy; null shows the list.
  const [draft, setDraft] = React.useState(() => (screen !== 'routines' && window.STRIDE_ROUTINE ? JSON.parse(JSON.stringify(window.STRIDE_ROUTINE)) : null));
  const [dirty, setDirty] = React.useState(() => !!draft && draft.id == null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [picking, setPicking] = React.useState(null);
  const [ending, setEnding] = React.useState(false);
  const roomy = useRoutineRoomy();
  const p = useRoutineRun(draft || ROUTINE_EMPTY, { autoStart: screen === 'routine-run' && !!draft, onCancel: () => {} });
  const running = !!p.run && !p.result;
  const saved = readRoutineRun();

  const load = () => {
    setListError('');
    window.__strideRoutines.list().then(setRoutines).catch(() => setListError('Could not load your routines.'));
  };
  React.useEffect(load, []);

  const leaveOk = () => !dirty || window.confirm(window.t('Leave without saving?'));
  const openDraft = (routine) => { setDraft(routine); setDirty(routine.id == null); setError(''); };
  const open = (id) => {
    if (!leaveOk()) return;
    setBusy(true);
    window.__strideRoutines.get(id).then((r) => { setBusy(false); openDraft(r); })
      .catch(() => { setBusy(false); setListError('Could not load this routine.'); });
  };
  const update = (patch) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };

  // Saving keeps the exercise details the editor already has (the save response
  // may not carry them).
  const save = () => {
    setBusy(true);
    setError('');
    return window.__strideRoutines.save(draft).then((r) => {
      const next = { ...draft, ...r, exercises: r.exercises || draft.exercises };
      setDraft(next);
      setDirty(false);
      setBusy(false);
      load();
      return next;
    }).catch((e) => {
      setBusy(false);
      setError((e && e.message) || 'Could not save the routine.');
      throw e;
    });
  };
  const act = (action, then) => {
    setBusy(true);
    setError('');
    action().then((r) => { setBusy(false); load(); then(r); }).catch(() => { setBusy(false); setError('Something went wrong. Try again.'); });
  };
  const remove = () => {
    if (window.confirm(window.t('Delete {title}?', { title: draft.title }))) act(() => window.__strideRoutines.remove(draft.id), () => setDraft(null));
  };
  const duplicate = () => act(() => window.__strideRoutines.duplicate(draft.id), (copy) => (copy && copy.id ? open(copy.id) : null));

  // Start (or jump to) segment `from`. A new or changed routine is saved first, so
  // the run is logged against what was actually played.
  const play = (from = 0) => {
    if (p.result) return;
    if (p.run) { p.jumpToSegment(from); return; }
    routineAudio();
    if (!dirty && draft.id != null) { p.start(from, draft); return; }
    if (!routineValid(draft)) { setError('Give the routine a name and at least one step.'); return; }
    save().then((r) => p.start(from, r)).catch(() => {});
  };

  React.useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (!draft || p.result || e.repeat || ['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable) return;
      // preventDefault also stops Space from pressing the focused button.
      if (e.key === ' ') { e.preventDefault(); if (p.run) p.togglePause(); else play(0); }
      else if (p.run && e.key === 'ArrowRight') p.skip();
      else if (p.run && e.key === 'ArrowLeft') p.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div style={{ display: 'flex', height: '100%', background: TR.bg }}>
      <aside style={{ width: 360, flexShrink: 0, height: '100%', background: TR.surface, borderRight: `1px solid ${TR.line}`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {draft
          ? <RoutineStudioEditor draft={draft} dirty={dirty} busy={busy} error={error} total={routineTotalSeconds(draft.steps)}
              onBack={() => { if (leaveOk()) setDraft(null); }} update={update} onPick={(apply) => setPicking(() => apply)}
              onSave={() => save().catch(() => {})} onDuplicate={duplicate} onDelete={remove}/>
          : <RoutineStudioList routines={routines} error={listError} saved={saved} onRetry={load} onOpen={open}
              onResume={() => openDraft(saved.routine)}
              onNew={() => openDraft({ id: null, title: '', kind: 'yoga', steps: [routineNewStep('work')] })}
              onTemplate={(tpl) => openDraft({ id: null, title: window.t(tpl.title), kind: tpl.kind, steps: tpl.steps() })}/>}
        {running && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
            <div style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: TR.ink, color: '#fff', font: '600 13px Inter, sans-serif', lineHeight: 1.5 }}>
              Editing is locked while the timer runs.
            </div>
          </div>
        )}
      </aside>

      <main style={{ flex: 1, minWidth: 0, height: '100%', background: TR.ink, color: '#fff', containerType: 'inline-size' }}>
        {!draft ? <RoutineStudioEmpty/>
          : p.result ? <RoutineResult title={p.routine.title} result={p.result} onDone={p.reset}/>
          : <RoutineStudioStage p={p} draft={draft} canStart={routineTimeline(draft.steps).length > 0}
              onPlay={play} onEnd={() => setEnding(true)} showStrip={!roomy}/>}
      </main>

      {draft && roomy && <RoutineStudioIntervals p={p} onPick={play}/>}

      {picking && <RoutineExercisePicker onClose={() => setPicking(null)} onPick={(id) => { picking(id); setPicking(null); }}/>}
      {ending && <RoutineEndSheet elapsed={p.elapsed} onEnd={() => p.finish(false)} onClose={() => setEnding(false)}/>}
    </div>
  );
}

function RoutineStudioList({ routines, error, saved, onRetry, onOpen, onResume, onNew, onTemplate }) {
  const label = { font: '800 11px Inter, sans-serif', letterSpacing: 1.2, textTransform: 'uppercase', color: TR.ink3, margin: '18px 2px 8px' };
  const row = { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: `1px solid ${TR.line}`, borderRadius: 14, background: TR.surface, textAlign: 'left', cursor: 'pointer', marginBottom: 8 };
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 20px 20px' }}>
      <div style={{ font: '700 11px Inter, sans-serif', letterSpacing: 1.2, textTransform: 'uppercase', color: TR.ink3 }}>Timed classes</div>
      <h1 style={{ margin: '4px 0 16px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 30, letterSpacing: -0.5 }}>Routines</h1>
      {saved && (
        <Card dark onClick={onResume} style={{ padding: 14, marginBottom: 10 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: TR.volt }}>Unfinished</div>
          <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 16, marginTop: 4 }}>{window.t('Continue {title}', { title: saved.routine.title })}</div>
        </Card>
      )}
      <StrideButton block variant="primary" icon="plus" onClick={onNew}>New routine</StrideButton>

      <div style={label}>Your routines</div>
      {error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.rose }}>{window.t(error)} <button onClick={onRetry} style={{ border: 0, background: 'none', color: TR.ink, textDecoration: 'underline', font: 'inherit' }}>{window.t('Try again')}</button></div>}
      {!routines && !error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.ink3, padding: 4 }}>Loading…</div>}
      {routines && routines.length === 0 && (
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.ink3, lineHeight: 1.6, padding: '0 2px' }}>
          Build a class from work, rest and loop steps. Add an exercise to see its video or picture while the timer runs.
        </div>
      )}
      {(routines || []).map((r) => (
        <button key={r.id} onClick={() => onOpen(r.id)} style={row}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 15, color: TR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: TR.ink3, marginTop: 3 }}>
              {window.t((ROUTINE_KINDS.find((k) => k.v === r.kind) || ROUTINE_KINDS[4]).label)} · {routineClock(r.total_seconds)} · {window.t('{n} steps', { n: r.step_count })}
            </div>
          </div>
          <StrideIcon name="chevR" size={16} color={TR.ink3}/>
        </button>
      ))}

      <div style={label}>Start from a template</div>
      {ROUTINE_TEMPLATES.map((tpl) => (
        <button key={tpl.title} onClick={() => onTemplate(tpl)} style={{ ...row, background: TR.bg }}>
          <div style={{ flex: 1, fontFamily: 'Archivo', fontWeight: 800, fontSize: 14, color: TR.ink }}>{tpl.title}</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: TR.ink3 }}>{routineClock(routineTotalSeconds(tpl.steps()))}</div>
        </button>
      ))}
    </div>
  );
}

function RoutineStudioEditor({ draft, dirty, busy, error, total, onBack, update, onPick, onSave, onDuplicate, onDelete }) {
  const small = { width: 36, height: 36, borderRadius: 10, border: `1px solid ${TR.line}`, background: TR.surface, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 };
  return <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 16px 12px', borderBottom: `1px solid ${TR.lineSoft}` }}>
      <button onClick={onBack} style={{ flex: 1, border: 'none', background: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 4, color: TR.ink2, cursor: 'pointer', font: '600 13px Inter, sans-serif' }}>
        <StrideIcon name="chevL" size={16}/> All routines
      </button>
      {draft.id != null && <>
        <button style={small} disabled={busy} onClick={onDuplicate} aria-label="Duplicate" title={window.t('Duplicate')}><StrideIcon name="plus" size={16}/></button>
        <button style={small} disabled={busy} onClick={onDelete} aria-label="Delete" title={window.t('Delete')}><StrideIcon name="trash" size={16} color={TR.rose}/></button>
      </>}
    </div>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 24px' }}>
      <RoutineEditorFields draft={draft} update={update} onPick={onPick}/>
      {error && <div style={{ fontFamily: 'Inter', fontSize: 13, color: TR.rose, marginTop: 12 }}>{window.t(error)}</div>}
    </div>
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${TR.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: TR.ink3 }}>
        <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Total</div>
        <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 18, color: TR.ink }}>{routineClock(total)}</div>
      </div>
      <StrideButton variant="primary" style={{ flex: 1 }} disabled={busy || !dirty || !routineValid(draft)} onClick={onSave}>
        {busy ? window.t('Saving…') : dirty ? window.t('Save routine') : window.t('Saved')}
      </StrideButton>
    </div>
  </>;
}

function RoutineStudioEmpty() {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 32, textAlign: 'center' }}>
      <div>
        <StrideIcon name="timer" size={48} color="#444" style={{ margin: '0 auto' }}/>
        <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 22, marginTop: 14 }}>Pick a routine or make a new one.</div>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: '#888', marginTop: 8 }}>Space starts and pauses. The arrow keys go back and skip.</div>
      </div>
    </div>
  );
}

function RoutineStudioStage({ p, draft, canStart, onPlay, onEnd, showStrip }) {
  const { run, seg, ex, next, nextEx } = p;
  const idle = !run;
  const isRest = !idle && seg.type !== 'work';
  // Idle shows the routine itself with the first exercise's picture.
  const firstWork = p.segments.find((s) => s.type === 'work');
  const media = idle ? routineExercise(draft, firstWork && firstWork.exerciseId) : seg.type === 'work' ? ex : nextEx;
  const title = idle ? (draft.title || window.t('New routine'))
    : isRest && next ? routineSegmentTitle(next, nextEx) + routineSideText(next) : routineSegmentTitle(seg, ex) + routineSideText(seg);
  const phase = idle ? window.t('Ready') : window.t(seg.type === 'work' ? 'Work' : seg.type === 'prep' ? 'Get ready' : 'Rest');
  const color = idle ? '#888' : run.paused ? '#888' : p.color;
  const ctrl = (disabled) => ({ width: 52, height: 52, borderRadius: 26, background: '#1f1f1f', border: '1px solid #2c2c2c', display: 'grid', placeItems: 'center', cursor: disabled ? 'default' : 'pointer', color: '#fff', opacity: disabled ? 0.35 : 1, padding: 0 });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 24px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.title || window.t('New routine')}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#888', marginTop: 2 }}>
            {idle ? window.t('{n} intervals', { n: p.segments.length - 1 }) : `${routineClock(p.elapsed)} / ${routineClock(p.total)}`}
          </div>
        </div>
        <RoutineSoundPills sound={p.sound} onToggle={p.toggleSound}/>
      </div>
      <div style={{ padding: '0 24px' }}>
        <div style={{ height: 4, borderRadius: 4, background: '#222', overflow: 'hidden' }}>
          <div style={{ width: `${(p.elapsed / p.total) * 100}%`, height: '100%', background: TR.volt }}/>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '16px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 14, fontFamily: 'Inter', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>
          <span style={{ color: idle ? '#888' : p.color }}>{isRest && next ? `${phase} · ${window.t('Up next')}` : phase}</span>
          {!idle && p.rounds && <span style={{ color: '#888' }}>{p.rounds}</span>}
        </div>
        <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 'clamp(28px, 5.5cqw, 56px)', lineHeight: 1.05, maxWidth: '100%' }}>{title}</div>
        {media && (
          <div style={{ width: '100%', maxWidth: 640 }}>
            <RoutineMedia ex={media} height="clamp(140px, 30vh, 360px)" dim={isRest}/>
          </div>
        )}
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 'clamp(72px, 17cqw, 180px)', lineHeight: 0.95, letterSpacing: -4, color: idle || !run.paused ? '#fff' : '#777', fontVariantNumeric: 'tabular-nums' }}>
          {routineClock(idle ? p.total - ROUTINE_PREP_SECONDS : p.left)}
        </div>
        {!idle && (
          <div style={{ width: '100%', maxWidth: 640, height: 6, borderRadius: 6, background: '#222', overflow: 'hidden' }}>
            <div style={{ width: `${(1 - p.pct) * 100}%`, height: '100%', background: color }}/>
          </div>
        )}
        {!idle && run.paused && <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: TR.volt }}>Paused</div>}
        {!idle && seg.type === 'work' && (seg.note || (ex && ex.cues.length > 0)) && (
          <div style={{ maxWidth: 640, padding: '10px 16px', background: '#1a1a1a', borderRadius: 12, fontFamily: 'Inter', fontSize: 14, color: '#ddd', lineHeight: 1.5 }}>
            {seg.note || ex.cues.join(' · ')}
          </div>
        )}
        {!idle && !isRest && next && (
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: '#888' }}>
            {window.t('Next')}: <b style={{ color: '#ddd' }}>{routineSegmentTitle(next, nextEx) + routineSideText(next)}</b> · {routineClock(p.durations[p.nextIdx])}
          </div>
        )}
      </div>

      {showStrip && <RoutineStudioStrip p={p} onPick={onPlay}/>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px 24px 26px' }}>
        <button style={ctrl(idle)} disabled={idle} onClick={() => p.jumpTo(0)} aria-label="Restart" title={window.t('Restart')}><StrideIcon name="history" size={20} color="#fff"/></button>
        <button style={ctrl(idle)} disabled={idle} onClick={p.back} aria-label="Back" title={window.t('Back')}><StrideIcon name="skipBack" size={20} color="#fff"/></button>
        <button onClick={() => (idle ? onPlay(0) : p.togglePause())} disabled={idle && !canStart} aria-label={idle ? 'Start' : run.paused ? 'Resume' : 'Pause'} style={{
          width: 84, height: 84, borderRadius: 42, border: 'none', background: TR.volt, display: 'grid', placeItems: 'center',
          cursor: 'pointer', opacity: idle && !canStart ? 0.35 : 1, padding: 0,
        }}>
          <StrideIcon name={idle || run.paused ? 'play' : 'pause'} size={34} color={TR.ink}/>
        </button>
        <button style={ctrl(idle)} disabled={idle} onClick={p.skip} aria-label="Skip" title={window.t('Skip')}><StrideIcon name="skip" size={20} color="#fff"/></button>
        <button style={ctrl(idle)} disabled={idle} onClick={p.addTime} aria-label="Add 15 seconds" title={window.t('Add 15 seconds')}>
          <span style={{ font: '800 12px Inter, sans-serif' }}>+15</span>
        </button>
        <button style={{ ...ctrl(idle), borderRadius: 14, width: 'auto', padding: '0 16px', font: '800 12px Inter, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }} disabled={idle} onClick={onEnd}>End</button>
      </div>
    </div>
  );
}

// Every interval as a card in one row; the current one stays in view.
function RoutineStudioStrip({ p, onPick }) {
  const current = React.useRef(null);
  React.useEffect(() => {
    if (current.current) current.current.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [p.idx]);
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 24px 6px', flexShrink: 0 }}>
      {p.segments.map((s, i) => {
        if (i === 0) return null; // "get ready" is not an interval
        const on = p.run && i === p.idx;
        const past = p.run && i < p.idx;
        const ex = routineExercise(p.routine, s.exerciseId);
        return (
          <button key={i} ref={on ? current : null} onClick={() => onPick(i)} style={{
            flex: '0 0 128px', textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
            background: on ? '#262626' : '#161616', border: `1.5px solid ${on ? ROUTINE_SEGMENT_COLORS[s.type] : '#262626'}`, opacity: past ? 0.45 : 1, color: '#fff',
          }}>
            <div style={{ width: 18, height: 3, borderRadius: 2, background: ROUTINE_SEGMENT_COLORS[s.type], marginBottom: 8 }}/>
            <div style={{ font: '700 12px Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{routineSegmentTitle(s, ex)}{routineSideText(s)}</div>
            <div style={{ font: '12px JetBrains Mono, monospace', color: '#888', marginTop: 3 }}>{routineClock(p.durations[i])}</div>
          </button>
        );
      })}
    </div>
  );
}

function RoutineStudioIntervals({ p, onPick }) {
  const current = React.useRef(null);
  React.useEffect(() => {
    if (current.current) current.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [p.idx]);
  const dot = { work: TR.accent, rest: TR.blue };
  return (
    <aside style={{ width: 300, flexShrink: 0, height: '100%', background: TR.surface, borderLeft: `1px solid ${TR.line}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '22px 18px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Archivo', fontWeight: 900, fontSize: 18 }}>All intervals</div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TR.ink3 }}>{p.segments.length - 1}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 10px 16px' }}>
        {p.segments.map((s, i) => {
          if (i === 0) return null;
          const on = p.run && i === p.idx;
          const past = p.run && i < p.idx;
          const ex = routineExercise(p.routine, s.exerciseId);
          return (
            <button key={i} ref={on ? current : null} onClick={() => onPick(i)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              background: on ? TR.ink : 'transparent', color: on ? '#fff' : TR.ink, opacity: past ? 0.45 : 1,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: on ? TR.volt : dot[s.type] }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `${s.type === 'rest' ? 500 : 700} 13px Inter, sans-serif`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{routineSegmentTitle(s, ex)}{routineSideText(s)}</div>
                {s.rounds.length > 0 && <div style={{ font: '11px Inter, sans-serif', color: on ? '#aaa' : TR.ink3, marginTop: 1 }}>{s.rounds.map((r) => `${r.i}/${r.n}`).join(' · ')}</div>}
              </div>
              <div style={{ font: '12px JetBrains Mono, monospace', color: on ? '#ddd' : TR.ink3 }}>{routineClock(p.durations[i])}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

Object.assign(window, { routineTimeline, routineTotalSeconds, routineStarts, routineIndexAt, routineCountSteps, RoutineStudio });
