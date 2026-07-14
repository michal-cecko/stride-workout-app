// Goals, Injuries, Library screens.

const TM = window.STRIDE_THEME;

// ────────────────────────────────────────────────────────────────────
// GOALS
// ────────────────────────────────────────────────────────────────────
function GoalsScreen({ go }) {
  const goals = window.STRIDE_GOALS;
  return (
    <Screen>
      <StrideHeader title="Goals" kicker="4 active · 12 completed" back onBack={() => go('profile')} right={<IconBtn icon="plus"/>}/>
      <div style={{ padding: '0 20px' }}>
        {/* hero progress */}
        <Card dark style={{ padding: 22, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 180, background: TM.volt, opacity: 0.18, filter: 'blur(30px)' }}/>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
            <ProgressRing value={0.60} size={88} stroke={9} color={TM.volt} track="#222">
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>60%</div>
              </div>
            </ProgressRing>
            <div style={{ color: '#fff' }}>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Q2 Progress</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, marginTop: 4, lineHeight: 1.1, letterSpacing: -0.5 }}>You're on pace.</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#aaa', marginTop: 4 }}>3 of 4 goals tracking ahead of schedule</div>
            </div>
          </div>
        </Card>

        {goals.map(g => (
          <Card key={g.id} style={{ marginBottom: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <Chip bg={g.color + '18'} ink={g.color} color={g.color} dot>{g.cat}</Chip>
                <h3 style={{ margin: '8px 0 4px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 19, lineHeight: 1.1, letterSpacing: -0.4 }}>{g.title}</h3>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink3 }}>{g.deadline} · {g.weeks}</div>
              </div>
              <ProgressRing value={g.progress} size={56} stroke={5} color={g.color}>
                <span style={{ fontSize: 13, color: TM.ink, fontFamily: 'Archivo, sans-serif', fontWeight: 900 }}>{Math.round(g.progress*100)}</span>
              </ProgressRing>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: TM.lineSoft, borderRadius: 12, marginTop: 8 }}>
              <div>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Current</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, marginTop: 2 }}>{g.current}</div>
              </div>
              <StrideIcon name="arrowRight" size={18} color={TM.ink3}/>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Target</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, marginTop: 2 }}>{g.target}</div>
              </div>
            </div>
          </Card>
        ))}
        <div style={{ height: 30 }}/>
      </div>
    </Screen>
  );
}

// ────────────────────────────────────────────────────────────────────
// INJURIES
// ────────────────────────────────────────────────────────────────────
// Shared injury persistence (used by list + detail page)
function loadInjuries() {
  try {
    const stored = localStorage.getItem('stride-injuries');
    if (stored) return JSON.parse(stored);
  } catch {}
  return window.STRIDE_INJURIES;
}
function saveInjuries(list) {
  try { localStorage.setItem('stride-injuries', JSON.stringify(list)); } catch {}
}

function InjuriesScreen({ go }) {
  const [injuries, setInjuries] = React.useState(loadInjuries);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => { saveInjuries(injuries); }, [injuries]);

  const active = injuries.filter(i => i.status === 'active');
  const monitoring = injuries.filter(i => i.status === 'monitoring');
  const resolved = injuries.filter(i => i.status === 'resolved');
  const flagged = injuries.filter(i => i.status !== 'resolved');

  const addInjury = (inj) => {
    const id = 'inj-' + Math.random().toString(36).slice(2, 8);
    const today = new Date().toLocaleString(window.strideLocale(), { month: 'short', day: '2-digit' });
    setInjuries(prev => [{ id, since: today, avoid: [], safe: [], journal: [], aiChanges: [], ...inj }, ...prev]);
  };

  const openInjury = (i) => { window.__strideOpenInjuryId = i.id; go('injury-detail'); };

  const groups = [
    { key: 'active', label: 'Active', color: TM.accent, items: active },
    { key: 'monitoring', label: 'Monitoring', color: TM.amber, items: monitoring },
    { key: 'resolved', label: 'Resolved', color: TM.green, items: resolved },
  ];

  return (
    <Screen>
      <StrideHeader title="Injury Log" back onBack={() => go('profile')} right={<IconBtn icon="plus" onClick={() => setAdding(true)}/>}/>

      {/* Body silhouette + active list */}
      <div style={{ padding: '0 20px' }}>
        <Card style={{ display: 'flex', gap: 10, padding: 18 }}>
          <BodySilhouette size={88} highlights={flagged.map(i => bodyPartToHighlight(i.bodyPart)).filter(Boolean)}/>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Flagged areas</div>
            {flagged.length === 0 && (
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink3 }}>Nothing flagged — keep moving 💪</div>
            )}
            {flagged.map(i => (
              <div key={i.id} onClick={() => openInjury(i)} style={{
                padding: '8px 10px', borderRadius: 10, background: TM.lineSoft,
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 8, background: i.status === 'active' ? TM.accent : TM.amber }}/>
                <span style={{ flex: 1, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12 }}>{i.bodyPart}</span>
                <span style={{ fontFamily: 'Inter', fontSize: 10, color: TM.ink3, fontWeight: 600 }}>{i.severity}</span>
              </div>
            ))}
          </div>
        </Card>

        {groups.filter(g => g.items.length > 0).map(g => (
          <div key={g.key} style={{ marginTop: 18 }}>
            <SectionHeader title={g.label} right={<Chip bg={g.color + '18'} ink={g.color}>{g.items.length}</Chip>}/>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {g.items.map(i => <InjuryCard key={i.id} inj={i} onOpen={() => openInjury(i)}/>)}
            </div>
          </div>
        ))}

        <div style={{ height: 30 }}/>
      </div>

      {adding && (
        <Sheet title="Log new" onClose={() => setAdding(false)}>
          <NewInjurySheet
            onCreate={(inj) => { addInjury(inj); setAdding(false); }}
            onClose={() => setAdding(false)}
          />
        </Sheet>
      )}
    </Screen>
  );
}

function nextStatus(s) {
  return s === 'active' ? 'monitoring' : s === 'monitoring' ? 'resolved' : 'active';
}

function bodyPartToHighlight(bp = '') {
  const s = bp.toLowerCase();
  if (s.includes('shoulder')) return s.includes('l.') ? 'lshoulder' : 'rshoulder';
  if (s.includes('knee')) return s.includes('r.') ? 'rknee' : 'lknee';
  if (s.includes('wrist')) return s.includes('r.') ? 'rwrist' : 'lwrist';
  if (s.includes('elbow')) return s.includes('r.') ? 'relbow' : 'lelbow';
  if (s.includes('hip')) return s.includes('r.') ? 'rhip' : 'lhip';
  if (s.includes('back') || s.includes('lumbar')) return 'back';
  if (s.includes('neck')) return 'neck';
  if (s.includes('ankle')) return s.includes('r.') ? 'rankle' : 'lankle';
  return null;
}

function InjuryCard({ inj, onOpen }) {
  const color = inj.status === 'active' ? TM.accent : inj.status === 'monitoring' ? TM.amber : TM.green;
  const statusLabel = inj.status === 'active' ? 'Active' : inj.status === 'monitoring' ? 'Monitoring' : 'Resolved';
  const noteCount = (inj.journal || []).length;
  const aiCount = (inj.aiChanges || []).length;
  return (
    <Card onClick={onOpen} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: color + '18', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <StrideIcon name="bandage" size={21} color={color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16, color: TM.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inj.bodyPart}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink2, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inj.label} · {inj.severity}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, fontFamily: 'Inter', fontSize: 11, color: TM.ink3 }}>
          <span>Since {inj.since}</span>
          {noteCount > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><StrideIcon name="edit" size={12} color={TM.ink3}/>{noteCount}</span>}
          {aiCount > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><StrideIcon name="sparkles" size={12} color={TM.ink3}/>{aiCount}</span>}
        </div>
      </div>
      <StrideIcon name="chevR" size={18} color={TM.ink3}/>
    </Card>
  );
}

// ── Injury Detail / Edit Sheet ────────────────────────────────
// ── Injury Detail — standalone page ───────────────────────────
function InjuryDetailScreen({ go }) {
  const id = window.__strideOpenInjuryId;
  const [list, setList] = React.useState(loadInjuries);
  const original = list.find(i => i.id === id);
  const [draft, setDraft] = React.useState(original || null);
  const persona = window.STRIDE_CURRENT_PERSONA;
  const trainer = (persona && persona.name) || 'Coach';

  if (!draft) {
    return (
      <Screen>
        <StrideHeader title="Injury" back onBack={() => go('injuries')}/>
        <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'Inter', fontSize: 13, color: TM.ink3 }}>
          This entry is no longer available.
        </div>
      </Screen>
    );
  }

  const dirty = JSON.stringify({ ...draft, journal: 0 }) !== JSON.stringify({ ...original, journal: 0 });
  const update = (patch) => setDraft(d => ({ ...d, ...patch }));

  const persist = (next) => {
    const updated = list.map(i => i.id === id ? next : i);
    setList(updated);
    saveInjuries(updated);
  };

  const addNote = (text, trend) => {
    const t = text.trim();
    if (!t) return;
    const today = new Date().toLocaleString(window.strideLocale(), { month: 'short', day: '2-digit' });
    const journal = [{ date: today, trend, text: t }, ...(draft.journal || [])];
    const next = { ...draft, journal };
    setDraft(next);
    persist(next);
  };

  const saveChanges = () => { persist(draft); go('injuries'); };
  const remove = () => {
    if (!confirm('Delete this injury log?')) return;
    const updated = list.filter(i => i.id !== id);
    saveInjuries(updated);
    go('injuries');
  };
  const askCoach = () => {
    window.__stridePrefillChat = `About my ${draft.bodyPart.toLowerCase()} (${draft.label}) — `;
    go('chat');
  };

  const statusColor = draft.status === 'active' ? TM.accent : draft.status === 'monitoring' ? TM.amber : TM.green;
  const statusLabel = draft.status === 'active' ? 'Active' : draft.status === 'monitoring' ? 'Monitoring' : 'Resolved';

  return (
    <Screen>
      <StrideHeader title={draft.bodyPart || 'Injury'} kicker={`${draft.label} · ${statusLabel}`} back onBack={() => go('injuries')}
        right={<IconBtn icon="trash" onClick={remove}/>}/>
      <div style={{ padding: '0 20px' }}>
        {/* Status banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, background: statusColor + '14', border: `1px solid ${statusColor}33`, marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: statusColor + '22', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <StrideIcon name="bandage" size={21} color={statusColor}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: TM.ink }}>{statusLabel} · {draft.severity}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink3, marginTop: 2 }}>Since {draft.since}</div>
          </div>
        </div>

        <InjuryForm draft={draft} update={update}/>

        <InjuryAIChanges changes={draft.aiChanges || []} trainer={trainer} onAsk={askCoach}/>

        <InjuryJournal journal={draft.journal || []} onAdd={addNote}/>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={() => go('injuries')} style={{
            flex: 1, padding: '13px 16px', borderRadius: 12,
            background: TM.surface, border: `1px solid ${TM.line}`, color: TM.ink,
            cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
          }}>Back</button>
          <button disabled={!dirty} onClick={saveChanges} style={{
            flex: 1.5, padding: '13px 16px', borderRadius: 12,
            background: dirty ? TM.ink : TM.lineSoft,
            color: dirty ? '#fff' : TM.ink3,
            border: 'none', cursor: dirty ? 'pointer' : 'default',
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
          }}>Save changes</button>
        </div>

        <div style={{ height: 30 }}/>
      </div>
    </Screen>
  );
}

// ── Injury-scoped coach changes + ask-coach link ──────────────
function InjuryAIChanges({ changes, trainer, onAsk }) {
  return (
    <div style={{ marginTop: 22 }}>
      <SectionHeader title={`${trainer}'s changes for this`} right={<Chip bg={TM.lineSoft}>{changes.length}</Chip>}/>
      {changes.length === 0 ? (
        <div style={{ marginTop: 10, padding: '16px', textAlign: 'center', background: TM.surface, border: `1px dashed ${TM.line}`, borderRadius: 14, fontFamily: 'Inter', fontSize: 12.5, color: TM.ink3 }}>
          No training changes tied to this yet.
        </div>
      ) : (
        <div style={{ marginTop: 10, background: TM.surface, border: `1px solid ${TM.line}`, borderRadius: 14, overflow: 'hidden' }}>
          {changes.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 14px', borderTop: i ? `1px solid ${TM.lineSoft}` : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: TM.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <StrideIcon name={c.icon} size={15} color={TM.ink2}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TM.ink, lineHeight: 1.25 }}>{c.text}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginTop: 5 }}>{c.kind}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink2, lineHeight: 1.45, marginTop: 5 }}>{c.why}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: TM.ink3, marginTop: 6 }}>{c.when}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onAsk} style={{
        marginTop: 10, width: '100%', padding: '12px 14px', borderRadius: 12,
        background: TM.ink, border: 'none', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
      }}>
        <StrideIcon name="chat" size={16} color="#fff"/> Ask {trainer} about this
      </button>
    </div>
  );
}

// ── Injury progress journal (timeline of notes) ───────────────
const INJURY_TRENDS = {
  better: { label: 'Improving', color: '#0A8A6A', icon: 'trend' },
  same:   { label: 'No change', color: '#7A8AA0', icon: 'minus' },
  worse:  { label: 'Flared up', color: '#C0392B', icon: 'arrowDown' },
};

function InjuryJournal({ journal, onAdd }) {
  const [text, setText] = React.useState('');
  const [trend, setTrend] = React.useState('better');
  const QUICK = [
    { t: 'Less pain today', trend: 'better' },
    { t: 'Healing slowly but surely', trend: 'better' },
    { t: 'Full range of motion back', trend: 'better' },
    { t: 'Flared up again', trend: 'worse' },
    { t: 'About the same', trend: 'same' },
  ];

  const submit = () => { onAdd(text, trend); setText(''); };

  return (
    <div style={{ marginTop: 22 }}>
      <SectionHeader title="Progress notes" right={<Chip bg={TM.lineSoft}>{journal.length}</Chip>}/>

      {/* Composer */}
      <div style={{ marginTop: 10, background: TM.surface, border: `1px solid ${TM.line}`, borderRadius: 14, padding: 12 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="How does it feel today? e.g. “Less pain, pressed pain-free up to 65 kg.”"
          rows={2}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical',
            padding: '10px 12px', borderRadius: 10, border: `1px solid ${TM.line}`,
            background: TM.bg, color: TM.ink,
            fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.45, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
          {QUICK.map(q => (
            <button key={q.t} onClick={() => { setText(q.t); setTrend(q.trend); }} style={{
              padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
              background: TM.lineSoft, border: 'none',
              fontFamily: 'Inter', fontSize: 11, color: TM.ink2,
            }}>{q.t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: TM.lineSoft }}>
            {Object.entries(INJURY_TRENDS).map(([k, v]) => (
              <button key={k} onClick={() => setTrend(k)} title={v.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 9px', borderRadius: 8, cursor: 'pointer', border: 'none',
                background: trend === k ? TM.surface : 'transparent',
                color: trend === k ? v.color : TM.ink3,
                fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 11,
                boxShadow: trend === k ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}>
                <StrideIcon name={v.icon} size={13} color={trend === k ? v.color : TM.ink3}/>
                {v.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <button disabled={!text.trim()} onClick={submit} style={{
            padding: '9px 16px', borderRadius: 10, border: 'none',
            background: text.trim() ? TM.ink : TM.lineSoft,
            color: text.trim() ? '#fff' : TM.ink3,
            cursor: text.trim() ? 'pointer' : 'default',
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
          }}>Add note</button>
        </div>
      </div>

      {/* Timeline */}
      {journal.length > 0 && (
        <div style={{ marginTop: 14, position: 'relative', paddingLeft: 26 }}>
          <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: TM.lineSoft }}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {journal.map((e, i) => {
              const tr = INJURY_TRENDS[e.trend] || INJURY_TRENDS.same;
              return (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -26, top: 1, width: 20, height: 20, borderRadius: 10,
                    background: tr.color + '1c', border: `2px solid ${TM.bg}`,
                    display: 'grid', placeItems: 'center',
                  }}>
                    <StrideIcon name={tr.icon} size={11} color={tr.color}/>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 12, color: TM.ink }}>{e.date}</span>
                    <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: tr.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tr.label}</span>
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: TM.ink2, lineHeight: 1.45, marginTop: 3 }}>{e.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Injury Sheet (AI / Manual tabs) ─────────────────────
function NewInjurySheet({ onCreate, onClose }) {
  const [mode, setMode] = React.useState('ai'); // 'ai' | 'manual'
  const [aiInput, setAiInput] = React.useState('');
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiError, setAiError] = React.useState(null);
  const [draft, setDraft] = React.useState({
    bodyPart: '', label: '', severity: 'Mild', status: 'monitoring',
    note: '', avoid: [], safe: [],
  });
  const [drafted, setDrafted] = React.useState(false); // AI has filled the form

  const update = (patch) => setDraft(d => ({ ...d, ...patch }));

  const runAI = async () => {
    if (!aiInput.trim()) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const prompt = `You are a strength-coach assistant logging an injury or stiffness from a user's free-text description. Output STRICT JSON, no markdown, with these fields:
{
  "bodyPart": short label like "R. Shoulder" or "Low back",
  "label": short condition name (3-6 words) e.g. "Anterior impingement",
  "severity": one of "Mild" | "Moderate" | "Severe",
  "status": one of "active" | "monitoring",
  "note": one to two sentences with the key facts and when/how it shows up,
  "avoid": array of 2-4 specific lifts to avoid (short names),
  "safe": array of 2-4 specific lifts that are safer subs (short names)
}

User said: """${aiInput.trim()}"""

Respond with ONLY the JSON object.`;
      const out = await window.claude.complete(prompt);
      // Robust JSON extraction
      const match = out.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found in response');
      const parsed = JSON.parse(match[0]);
      setDraft(d => ({ ...d, ...parsed }));
      setDrafted(true);
    } catch (e) {
      setAiError('Could not parse AI response. Try rephrasing, or fill it in manually.');
      console.error(e);
    } finally {
      setAiBusy(false);
    }
  };

  const canSave = draft.bodyPart.trim() && draft.label.trim();

  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, padding: 3, borderRadius: 12, background: TM.lineSoft, marginBottom: 14 }}>
        {[
          { v: 'ai', label: '✨ Describe to AI' },
          { v: 'manual', label: 'Fill it in' },
        ].map(o => (
          <button key={o.v} onClick={() => setMode(o.v)} style={{
            flex: 1, padding: '10px 12px', borderRadius: 9,
            background: mode === o.v ? TM.surface : 'transparent',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
            color: mode === o.v ? TM.ink : TM.ink2, letterSpacing: 0.4,
            boxShadow: mode === o.v ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}>{o.label}</button>
        ))}
      </div>

      {mode === 'ai' && (
        <div style={{ marginBottom: 14 }}>
          <textarea
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            placeholder="e.g. My right shoulder pinches when I bench heavy, started about a week ago. Doesn't hurt with pull-ups."
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              padding: 12, borderRadius: 12, border: `1px solid ${TM.line}`,
              background: TM.surface, color: TM.ink,
              fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.45, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {[
              'Right knee aches after squats',
              'Low back stiff in the morning',
              'Wrist sore when pressing',
            ].map(s => (
              <button key={s} onClick={() => setAiInput(s)} style={{
                padding: '6px 10px', borderRadius: 999,
                background: TM.lineSoft, border: 'none', cursor: 'pointer',
                fontFamily: 'Inter', fontSize: 11, color: TM.ink2,
              }}>{s}</button>
            ))}
          </div>
          {aiError && (
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: TM.rose + '12', color: TM.rose, fontFamily: 'Inter', fontSize: 12 }}>{aiError}</div>
          )}
          <button onClick={runAI} disabled={!aiInput.trim() || aiBusy} style={{
            marginTop: 10, width: '100%', padding: '12px 16px', borderRadius: 12,
            background: aiInput.trim() && !aiBusy ? TM.ink : TM.lineSoft,
            color: aiInput.trim() && !aiBusy ? '#fff' : TM.ink3,
            border: 'none', cursor: aiInput.trim() && !aiBusy ? 'pointer' : 'default',
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {aiBusy ? 'Thinking…' : (drafted ? 'Regenerate' : '✨ Generate entry')}
          </button>
          {drafted && (
            <div style={{
              marginTop: 14, padding: 12, borderRadius: 12,
              background: TM.volt + '22', border: `1px dashed ${TM.volt}`,
              fontFamily: 'Inter', fontSize: 12, color: TM.ink,
            }}>
              AI drafted the entry below — review and tweak before saving.
            </div>
          )}
        </div>
      )}

      {(mode === 'manual' || drafted) && (
        <InjuryForm draft={draft} update={update}/>
      )}

      {!drafted && mode === 'ai' && (
        <div style={{
          padding: 16, borderRadius: 14, background: TM.surface, border: `1px dashed ${TM.line}`,
          textAlign: 'center', fontFamily: 'Inter', fontSize: 12, color: TM.ink3,
        }}>
          Type what's bothering you above and tap <strong style={{ color: TM.ink2 }}>Generate</strong>.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '12px 16px', borderRadius: 12,
          background: TM.surface, border: `1px solid ${TM.line}`, color: TM.ink,
          cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
        }}>Cancel</button>
        <button disabled={!canSave} onClick={() => onCreate(draft)} style={{
          flex: 1.4, padding: '12px 16px', borderRadius: 12,
          background: canSave ? TM.ink : TM.lineSoft,
          color: canSave ? '#fff' : TM.ink3,
          border: 'none', cursor: canSave ? 'pointer' : 'default',
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
        }}>Save to log</button>
      </div>
    </div>
  );
}

// ── Shared form for injury fields ────────────────────────────
function InjuryForm({ draft, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Body part">
        <input value={draft.bodyPart} onChange={e => update({ bodyPart: e.target.value })} placeholder="e.g. R. Shoulder, Low back" style={inputStyle}/>
      </Field>

      <Field label="Condition / what it feels like">
        <input value={draft.label} onChange={e => update({ label: e.target.value })} placeholder="e.g. Anterior impingement" style={inputStyle}/>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Severity">
          <Seg value={draft.severity} options={['Mild', 'Moderate', 'Severe']} onChange={v => update({ severity: v })}/>
        </Field>
        <Field label="Status">
          <Seg value={draft.status} options={['active', 'monitoring', 'resolved']} labels={['Active', 'Monitor', 'Resolved']} onChange={v => update({ status: v })}/>
        </Field>
      </div>

      <Field label="Notes">
        <textarea value={draft.note || ''} onChange={e => update({ note: e.target.value })} placeholder="When does it show up? What aggravates / helps?" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }}/>
      </Field>

      <Field label="Lifts to avoid" hint={`${(draft.avoid || []).length} listed`}>
        <ChipEditor values={draft.avoid || []} onChange={(v) => update({ avoid: v })} color={TM.rose} placeholder="Add lift…"/>
      </Field>

      <Field label="Safer substitutions" hint={`${(draft.safe || []).length} listed`}>
        <ChipEditor values={draft.safe || []} onChange={(v) => update({ safe: v })} color={TM.green} placeholder="Add lift…"/>
      </Field>
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 12px', borderRadius: 11,
  border: `1px solid ${TM.line}`, background: TM.surface, color: TM.ink,
  fontFamily: 'Inter', fontSize: 13.5, outline: 'none',
};

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10.5, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        {hint && <div style={{ fontFamily: 'Inter', fontSize: 10.5, color: TM.ink3 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Seg({ value, options, labels, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 11, background: TM.lineSoft }}>
      {options.map((o, i) => (
        <button key={o} onClick={() => onChange(o)} style={{
          flex: 1, padding: '7px 4px', borderRadius: 8,
          border: 'none', cursor: 'pointer',
          background: value === o ? TM.surface : 'transparent',
          color: value === o ? TM.ink : TM.ink2,
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 11.5,
          boxShadow: value === o ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
        }}>{labels?.[i] || o}</button>
      ))}
    </div>
  );
}

function ChipEditor({ values, onChange, color, placeholder }) {
  const [v, setV] = React.useState('');
  const add = () => {
    const t = v.trim();
    if (!t) return;
    if (values.includes(t)) { setV(''); return; }
    onChange([...values, t]);
    setV('');
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: values.length ? 8 : 0 }}>
        {values.map(val => (
          <div key={val} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 4px 5px 10px', borderRadius: 999,
            background: color + '14', border: `1px solid ${color}33`,
          }}>
            <span style={{ fontFamily: 'Inter', fontSize: 11.5, fontWeight: 700, color: TM.ink }}>{val}</span>
            <button onClick={() => onChange(values.filter(x => x !== val))} aria-label="Remove" style={{
              width: 18, height: 18, borderRadius: 9, border: 'none',
              background: 'rgba(0,0,0,0.08)', color: TM.ink2, cursor: 'pointer', padding: 0,
              fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, lineHeight: 1,
            }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={v}
          onChange={e => setV(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 12.5 }}
        />
        <button onClick={add} disabled={!v.trim()} style={{
          padding: '0 14px', borderRadius: 11,
          background: v.trim() ? color : TM.lineSoft,
          color: v.trim() ? '#fff' : TM.ink3,
          border: 'none', cursor: v.trim() ? 'pointer' : 'default',
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
        }}>Add</button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// LIBRARY — nested categories
// ────────────────────────────────────────────────────────────────────
function LibraryScreen({ go }) {
  const [path, setPath] = React.useState([]); // array of category ids
  const [search, setSearch] = React.useState('');
  const [exerciseOpen, setExerciseOpen] = React.useState(null);
  const [videoEx, setVideoEx] = React.useState(null);
  const [favorites, setFavorites] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('stride-favs') || '[]')); }
    catch { return new Set(); }
  });
  const [hidden, setHidden] = React.useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('stride-hidden') || '[]')); }
    catch { return new Set(); }
  });
  const [view, setView] = React.useState('all'); // 'all' | 'fav' | 'hidden'
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({ diff: new Set(), equip: new Set() });
  const [tab, setTab] = React.useState(() => {
    const t = window.__strideLibTab; window.__strideLibTab = null;
    return t || 'exercises';
  });
  const [addSpotSignal, setAddSpotSignal] = React.useState(0);
  const [addEquipSignal, setAddEquipSignal] = React.useState(0);
  const [equipView, setEquipView] = React.useState('all'); // 'all' | 'pref' | 'avoid'
  const [requestSheet, setRequestSheet] = React.useState(null); // null | { kind, name }

  React.useEffect(() => {
    try { localStorage.setItem('stride-favs', JSON.stringify([...favorites])); } catch {}
  }, [favorites]);

  React.useEffect(() => {
    try { localStorage.setItem('stride-hidden', JSON.stringify([...hidden])); } catch {}
  }, [hidden]);

  const toggleFav = (name) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleHide = (name) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // Resolve current node
  let node = window.STRIDE_LIBRARY;
  for (const id of path) {
    node = node.children.find(c => c.id === id) || node;
  }
  const breadcrumbs = ['All', ...path.map(id => {
    let n = window.STRIDE_LIBRARY;
    let label = '';
    for (const seg of path) {
      n = n.children.find(c => c.id === seg);
      if (seg === id) { label = n.name; break; }
    }
    return label;
  })];

  // Filter search / favorites / hidden
  const allExercises = collectExercises(node);
  const allLibrary = collectExercises(window.STRIDE_LIBRARY);
  const favList = allLibrary.filter(e => favorites.has(e.name) && !hidden.has(e.name));
  const hiddenList = allLibrary.filter(e => hidden.has(e.name));

  // Apply diff/equip filters
  const matchesFilters = (e) => {
    if (filters.diff.size && !filters.diff.has(e.diff)) return false;
    if (filters.equip.size && !filters.equip.has(equipBucket(e.equip))) return false;
    return true;
  };
  const notHidden = (e) => !hidden.has(e.name);
  const activeFilterCount = filters.diff.size + filters.equip.size;
  const filtered = search
    ? allExercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).filter(notHidden).filter(matchesFilters)
    : null;
  // View modes ignore category navigation and show a flat list.
  const showingFavList = view === 'fav' && !search;
  const showingHiddenList = view === 'hidden' && !search;
  const favListFiltered = favList.filter(matchesFilters);
  const hiddenListFiltered = hiddenList.filter(matchesFilters);

  const removeFilter = (group, val) => {
    setFilters(f => {
      const next = { diff: new Set(f.diff), equip: new Set(f.equip) };
      next[group].delete(val);
      return next;
    });
  };
  const clearAllFilters = () => setFilters({ diff: new Set(), equip: new Set() });

  return (
    <Screen>
      <StrideHeader title="Library" right={
        tab === 'spots' ? (
          <IconBtn icon="plus" size={36} onClick={() => setAddSpotSignal(n => n + 1)}/>
        ) : tab === 'equipment' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEquipView(v => v === 'pref' ? 'all' : 'pref')} aria-label="Preferred only" style={{
              width: 36, height: 36, borderRadius: 11, cursor: 'pointer',
              border: `1px solid ${equipView === 'pref' ? TM.green : TM.line}`,
              background: equipView === 'pref' ? TM.green : TM.surface,
              display: 'grid', placeItems: 'center', padding: 0,
            }}>
              <StrideIcon name="heart" size={18} color={equipView === 'pref' ? '#fff' : TM.ink2}/>
            </button>
            <button onClick={() => setEquipView(v => v === 'avoid' ? 'all' : 'avoid')} aria-label="Avoided only" style={{
              width: 36, height: 36, borderRadius: 11, cursor: 'pointer',
              border: `1px solid ${equipView === 'avoid' ? TM.rose : TM.line}`,
              background: equipView === 'avoid' ? TM.rose : TM.surface,
              display: 'grid', placeItems: 'center', padding: 0,
            }}>
              <StrideIcon name="ban" size={18} color={equipView === 'avoid' ? '#fff' : TM.ink2}/>
            </button>
            <IconBtn icon="plus" size={36} onClick={() => setAddEquipSignal(n => n + 1)}/>
          </div>
        ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView(v => v === 'fav' ? 'all' : 'fav')} aria-label="Favorites only" style={{
            width: 36, height: 36, borderRadius: 11, cursor: 'pointer',
            border: `1px solid ${view === 'fav' ? TM.accent : TM.line}`,
            background: view === 'fav' ? TM.accent : TM.surface,
            display: 'grid', placeItems: 'center', padding: 0,
          }}>
            <HeartGlyph filled={view === 'fav'} size={18} color={view === 'fav' ? '#fff' : TM.ink2}/>
          </button>
          <button onClick={() => setView(v => v === 'hidden' ? 'all' : 'hidden')} aria-label="Hidden exercises" style={{
            width: 36, height: 36, borderRadius: 11, cursor: 'pointer',
            border: `1px solid ${view === 'hidden' ? TM.ink : TM.line}`,
            background: view === 'hidden' ? TM.ink : TM.surface,
            display: 'grid', placeItems: 'center', padding: 0, position: 'relative',
          }}>
            <StrideIcon name="eyeOff" size={18} color={view === 'hidden' ? '#fff' : TM.ink2}/>
            {hidden.size > 0 && view !== 'hidden' && (
              <div style={{
                position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
                borderRadius: 8, background: TM.ink, color: '#fff',
                fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10,
                display: 'grid', placeItems: 'center', border: `2px solid ${TM.bg}`,
              }}>{hidden.size}</div>
            )}
          </button>
          <button onClick={() => setFilterOpen(true)} style={{
            width: 36, height: 36, borderRadius: 11, cursor: 'pointer',
            border: `1px solid ${activeFilterCount ? TM.ink : TM.line}`,
            background: activeFilterCount ? TM.ink : TM.surface,
            display: 'grid', placeItems: 'center', padding: 0, position: 'relative',
          }}>
            <StrideIcon name="filter" size={18} color={activeFilterCount ? '#fff' : TM.ink2}/>
            {activeFilterCount > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
                borderRadius: 8, background: TM.volt, color: TM.ink,
                fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 10,
                display: 'grid', placeItems: 'center', border: `2px solid ${TM.bg}`,
              }}>{activeFilterCount}</div>
            )}
          </button>
        </div>
      )}/>

      <LibrarySegment tab={tab} setTab={setTab}/>

      {tab === 'spots' ? <SpotsManager go={go} addSignal={addSpotSignal}/>
        : tab === 'equipment' ? <EquipmentManager addSignal={addEquipSignal} view={equipView} setView={setEquipView}/>
        : (<>

      {/* search */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
          background: TM.surface, border: `1px solid ${TM.line}`, borderRadius: 14,
        }}>
          <StrideIcon name="search" size={18} color={TM.ink3}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises, muscles, equipment"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 14, color: TM.ink }}/>
        </div>
      </div>

      {/* breadcrumbs */}
      {path.length > 0 && !search && view === 'all' && (
        <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setPath([])} style={{ border: 'none', background: 'none', fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: TM.ink3, cursor: 'pointer' }}>All</button>
          {path.map((id, i) => (
            <React.Fragment key={id}>
              <StrideIcon name="chevR" size={12} color={TM.ink3}/>
              <button onClick={() => setPath(path.slice(0, i + 1))} style={{ border: 'none', background: 'none', fontFamily: 'Inter', fontSize: 12, fontWeight: i === path.length - 1 ? 800 : 700, color: i === path.length - 1 ? TM.ink : TM.ink3, cursor: 'pointer' }}>{breadcrumbs[i + 1]}</button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* active filter chips */}
      {activeFilterCount > 0 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[...filters.diff].map(d => (
            <FilterChip key={'d-' + d} label={d} color={difficultyColor(d)} onRemove={() => removeFilter('diff', d)}/>
          ))}
          {[...filters.equip].map(e => (
            <FilterChip key={'e-' + e} label={e} color={TM.ink} onRemove={() => removeFilter('equip', e)}/>
          ))}
          <button onClick={clearAllFilters} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'Inter', fontSize: 11, fontWeight: 800,
            color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.6,
            padding: '4px 6px',
          }}>Clear all</button>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        {showingHiddenList ? (
          hiddenList.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              background: TM.surface, border: `1px dashed ${TM.line}`, borderRadius: 16,
            }}>
              <div style={{ display: 'inline-grid', placeItems: 'center', width: 48, height: 48, borderRadius: 24, background: TM.lineSoft, marginBottom: 10 }}>
                <StrideIcon name="eyeOff" size={22} color={TM.ink3}/>
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TM.ink }}>Nothing hidden</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink3, marginTop: 4 }}>Open any exercise and tap “Hide” to tuck it away — your coach won’t program it.</div>
            </div>
          ) : hiddenListFiltered.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              background: TM.surface, border: `1px dashed ${TM.line}`, borderRadius: 16,
            }}>
              <div style={{ display: 'inline-grid', placeItems: 'center', width: 48, height: 48, borderRadius: 24, background: TM.lineSoft, marginBottom: 10 }}>
                <StrideIcon name="filter" size={22} color={TM.ink3}/>
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TM.ink }}>No hidden exercises match those filters</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink3, marginTop: 4 }}>Try clearing a filter chip above.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: -2 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>{hiddenListFiltered.length} hidden</div>
                <button onClick={() => { if (confirm('Unhide all exercises?')) setHidden(new Set()); }} style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'Inter', fontSize: 11, fontWeight: 800, color: TM.accent,
                  textTransform: 'uppercase', letterSpacing: 0.6, padding: '2px 0',
                }}>Unhide all</button>
              </div>
              {hiddenListFiltered.map((ex, i) => <ExerciseCard key={i} ex={ex} hiddenMode onUnhide={() => toggleHide(ex.name)} onClick={() => setExerciseOpen(ex)}/>)}
            </div>
          )
        ) : showingFavList ? (
          favList.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              background: TM.surface, border: `1px dashed ${TM.line}`, borderRadius: 16,
            }}>
              <div style={{ display: 'inline-grid', placeItems: 'center', width: 48, height: 48, borderRadius: 24, background: TM.lineSoft, marginBottom: 10 }}>
                <StrideIcon name="heart" size={22} color={TM.ink3}/>
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TM.ink }}>No favorites yet</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink3, marginTop: 4 }}>Tap the heart on any exercise to save it here.</div>
            </div>
          ) : favListFiltered.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              background: TM.surface, border: `1px dashed ${TM.line}`, borderRadius: 16,
            }}>
              <div style={{ display: 'inline-grid', placeItems: 'center', width: 48, height: 48, borderRadius: 24, background: TM.lineSoft, marginBottom: 10 }}>
                <StrideIcon name="filter" size={22} color={TM.ink3}/>
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TM.ink }}>No favorites match those filters</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TM.ink3, marginTop: 4 }}>Try clearing a filter chip above.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1', fontFamily: 'Inter', fontSize: 11, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: -2 }}>{favListFiltered.length} favorites</div>
              {favListFiltered.map((ex, i) => <ExerciseCard key={i} ex={ex} isFav={favorites.has(ex.name)} onToggleFav={() => toggleFav(ex.name)} onClick={() => setExerciseOpen(ex)}/>)}
            </div>
          )
        ) : search ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1', fontFamily: 'Inter', fontSize: 11, color: TM.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: -2 }}>{filtered.length} results</div>
              {filtered.map((ex, i) => <ExerciseCard key={i} ex={ex} isFav={favorites.has(ex.name)} onToggleFav={() => toggleFav(ex.name)} onClick={() => setExerciseOpen(ex)}/>)}
            </div>
            {/* Request a missing exercise */}
            <button onClick={() => setRequestSheet({ kind: 'exercise', name: search.trim() })} style={{
              width: '100%', marginTop: 14, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              background: TM.surface, border: `1px dashed ${TM.line}`, borderRadius: 14, padding: '13px 14px',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: TM.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <StrideIcon name="plus" size={18} color={TM.ink2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TM.ink }}>
                  {filtered.length === 0 ? `Can't find “${search.trim()}”?` : 'Missing one?'}
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TM.ink3, marginTop: 2 }}>Request it be added to the official library</div>
              </div>
              <StrideIcon name="chevR" size={18} color={TM.ink3}/>
            </button>
          </>
        ) : (
          <>
            {/* Children categories */}
            {node.children && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {node.children.map(c => {
                  const isLeaf = c.exercises && c.exercises.length > 0 && !c.children;
                  const color = categoryColor(path[0] || c.id);
                  const total = c.children ? c.count : c.exercises.length;
                  return (
                    <button key={c.id} onClick={() => setPath([...path, c.id])} style={{
                      textAlign: 'left', cursor: 'pointer', border: `1px solid ${TM.line}`,
                      background: TM.surface, borderRadius: 16, padding: 0, overflow: 'hidden',
                      display: 'flex', flexDirection: 'column',
                    }}>
                      <div style={{
                        height: 78, position: 'relative', overflow: 'hidden',
                        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      }}>
                        <div style={{ position: 'absolute', right: -10, bottom: -14, opacity: 0.22 }}>
                          <StrideIcon name={isLeaf ? 'dumbbell' : 'folder'} size={92} color="#fff"/>
                        </div>
                        <div style={{ position: 'absolute', left: 10, top: 10, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9 }}>
                          {isLeaf ? 'Exercises' : 'Group'}
                        </div>
                        <div style={{ position: 'absolute', left: 10, bottom: 8, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1 }}>
                          {total}
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px 12px' }}>
                        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TM.ink, lineHeight: 1.2 }}>{c.name}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 11, color: TM.ink3, marginTop: 3 }}>
                          {c.children ? window.t('{n} subcategories', { n: c.children.length }) : window.t('Tap to explore')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Leaf-level exercises */}
            {node.exercises && (() => {
              const list = node.exercises.filter(notHidden).filter(matchesFilters);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: node.children ? 14 : 0 }}>
                  {list.map((ex, i) => <ExerciseCard key={i} ex={ex} isFav={favorites.has(ex.name)} onToggleFav={() => toggleFav(ex.name)} onClick={() => setExerciseOpen(ex)}/>)}
                </div>
              );
            })()}
          </>
        )}

        {/* Request a new exercise for the catalog */}
        {!showingHiddenList && !showingFavList && (
          <>
            <div style={{ height: 16 }}/>
            <button onClick={() => setRequestSheet({ kind: 'exercise', name: search.trim() })} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11,
              background: 'transparent', border: `1px dashed ${TM.line}`, borderRadius: 14, padding: '12px 13px',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 11, background: TM.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <StrideIcon name="send" size={16} color={TM.ink2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TM.ink }}>Request an exercise for the library</div>
                <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TM.ink3, marginTop: 2 }}>Ask the team to add it for all users</div>
              </div>
              <StrideIcon name="chevR" size={18} color={TM.ink3}/>
            </button>
          </>
        )}
        <div style={{ height: 30 }}/>
      </div>

      {exerciseOpen && (
        <Sheet title={exerciseOpen.name} onClose={() => setExerciseOpen(null)}>
          <ExerciseSheet
            ex={exerciseOpen}
            onClose={() => setExerciseOpen(null)}
            isFav={favorites.has(exerciseOpen.name)}
            isHidden={hidden.has(exerciseOpen.name)}
            onToggleFav={() => toggleFav(exerciseOpen.name)}
            onToggleHide={() => toggleHide(exerciseOpen.name)}
            onOpenExercise={(e) => setExerciseOpen(e)}
            onPlayVideo={() => setVideoEx(exerciseOpen)}
          />
        </Sheet>
      )}

      {videoEx && <FormVideoOverlay ex={videoEx} onClose={() => setVideoEx(null)}/>}

      {filterOpen && (
        <Sheet title="Filters" onClose={() => setFilterOpen(false)}>
          <FilterSheetBody
            filters={filters}
            setFilters={setFilters}
            allLibrary={allLibrary}
            onClose={() => setFilterOpen(false)}
            onClearAll={clearAllFilters}
          />
        </Sheet>
      )}
      </>)}

      {requestSheet && (
        <Sheet title={`Request ${requestSheet.kind}`} onClose={() => setRequestSheet(null)}>
          <RequestSheet kind={requestSheet.kind} defaultName={requestSheet.name} onClose={() => setRequestSheet(null)}/>
        </Sheet>
      )}
    </Screen>
  );
}

function LibrarySegment({ tab, setTab }) {
  const TABS = [
    { id: 'exercises', label: 'Exercises' },
    { id: 'spots', label: 'Spots' },
    { id: 'equipment', label: 'Equipment' },
  ];
  return (
    <div style={{ padding: '0 20px 14px' }}>
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 13, background: TM.lineSoft }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: active ? TM.surface : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
              color: active ? TM.ink : TM.ink3,
              fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
            }}>{t.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseCard({ ex, onClick, isFav, onToggleFav, hiddenMode, onUnhide }) {
  // Deterministic preview tint per exercise
  const hash = [...ex.name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const tints = [
    ['#1a1a1a', '#3a3a3a'],
    ['#1a1a1a', '#2a2a3a'],
    ['#1f1a1a', '#3a2a2a'],
    ['#1a1f1a', '#2a3a2a'],
  ];
  const [a, b] = tints[hash % tints.length];
  const iconName = 'dumbbell';

  return (
    <div role="button" tabIndex={0} onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', border: `1px solid ${TM.line}`,
      background: TM.surface, borderRadius: 16, padding: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Preview area */}
      <div style={{
        position: 'relative', height: 110, overflow: 'hidden',
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}>
        {/* placeholder figure */}
        <div style={{ position: 'absolute', right: -14, bottom: -18, opacity: 0.16 }}>
          <StrideIcon name={iconName} size={130} color={TM.volt}/>
        </div>
        {/* striped placeholder hint */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 14px)',
          pointerEvents: 'none',
        }}/>
        {/* difficulty dot */}
        <div style={{
          position: 'absolute', left: 10, top: 10, display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 7px 3px 5px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 6, background: difficultyColor(ex.diff) }}/>
          <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 }}>{ex.diff}</div>
        </div>
        {/* favorite button */}
        {onToggleFav && !hiddenMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              position: 'absolute', right: 8, top: 8,
              width: 30, height: 30, borderRadius: 15,
              background: isFav ? TM.accent : 'rgba(0,0,0,0.55)',
              border: 'none', cursor: 'pointer', padding: 0,
              display: 'grid', placeItems: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ display: 'inline-flex', transform: isFav ? 'scale(1.05)' : 'scale(1)', transition: 'transform 120ms' }}>
              <HeartGlyph filled={isFav} size={15} color="#fff"/>
            </span>
          </button>
        )}
        {/* unhide button (hidden browse mode) */}
        {hiddenMode && onUnhide && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnhide(); }}
            aria-label="Unhide exercise"
            style={{
              position: 'absolute', right: 8, top: 8,
              width: 30, height: 30, borderRadius: 15,
              background: TM.volt, color: TM.ink,
              border: 'none', cursor: 'pointer', padding: 0,
              display: 'grid', placeItems: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <StrideIcon name="eye" size={15} color={TM.ink}/>
          </button>
        )}
      </div>
      {/* Meta */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13, color: TM.ink, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ex.name}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, color: TM.ink3, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ex.primary}
        </div>
      </div>
    </div>
  );
}

function HeartGlyph({ filled, size = 16, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </svg>
  );
}

function ExerciseRow({ ex, onClick }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', border: `1px solid ${TM.line}`,
      background: TM.surface, borderRadius: 14, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: `linear-gradient(135deg, ${TM.lineSoft}, #fff)`,
        border: `1px solid ${TM.line}`,
        display: 'grid', placeItems: 'center',
      }}>
        <StrideIcon name="dumbbell" size={20} color={TM.ink2}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TM.ink }}>{ex.name}</div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, color: TM.ink3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ex.primary}{ex.secondary ? ` · ${ex.secondary}` : ''}
        </div>
      </div>
      <Chip bg={difficultyColor(ex.diff) + '18'} ink={difficultyColor(ex.diff)} style={{ fontSize: 9 }}>{ex.diff}</Chip>
    </button>
  );
}

function ExerciseSheet({ ex, onClose, isFav, isHidden, onToggleFav, onToggleHide, onOpenExercise, onPlayVideo }) {
  const dColor = difficultyColor(ex.diff);
  // Split compound fields into individual tokens for the spec block
  const secondaryList = (ex.secondary || '').split(/[·,]/).map(s => s.trim()).filter(Boolean);
  const equipList = (ex.equip || '').split(/[+·,]/).map(s => s.trim()).filter(Boolean);
  // Real related exercises pulled from the library (same/overlapping primary muscle)
  const related = relatedExercises(ex, 5);
  // Personal records for THIS exercise (type-aware), logged + listed inline.
  const metricType = ex.metricType || 'load';
  const myPrs = () => (window.STRIDE_PRS || []).filter(p => p.exercise_id === ex.id);
  const [prs, setPrs] = React.useState(myPrs);
  const [logging, setLogging] = React.useState(false);
  const [draft, setDraft] = React.useState({});
  const [draftDate, setDraftDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [draftForm, setDraftForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const savePr = () => {
    if (!ex.id) return;
    setSaving(true);
    window.__strideSavePr({ exercise_id: ex.id, label: ex.name, metric_type: metricType, metrics: draft, achieved_on: draftDate || null, form_quality: draftForm })
      .then(() => { setPrs(myPrs()); setLogging(false); setDraft({}); setDraftForm(null); setSaving(false); })
      .catch(() => setSaving(false));
  };
  const deletePr = (id) => window.__strideDeletePr(id).then(() => setPrs(myPrs()));

  // Derived rich content (placeholders, exercise-aware where possible)
  const primary = ex.primary;
  // Prefer a real catalog description (e.g. freestyle tricks carry their own); fall back to the generic template.
  const description = ex.description
    || `${ex.name} is a ${ex.diff.toLowerCase()}-level ${primary.toLowerCase()} movement. Performed correctly it loads the working muscles through a full range while keeping the rest of the body braced and quiet. Build it slowly — the cleanest reps you can produce will always beat ego-loaded ones.`;
  const setup = [
    `Set up with ${ex.equip.toLowerCase()}. Feet planted, weight balanced through the mid-foot.`,
    `Brace your core — think 360° of pressure, not just abs squeezed in.`,
    `Take a breath, lock your shoulder blades down and back before the first rep.`,
  ];
  const cues = [
    'Control the lowering phase — 2-second eccentric, no bouncing.',
    'Lead with the working muscle, not momentum.',
    'Finish each rep with a full contraction at the top.',
    'Keep the bar/handle path stacked over the working joint.',
  ];
  const mistakes = [
    'Cutting range of motion short to chase weight.',
    'Letting the lower back round under load.',
    'Flaring elbows or letting wrists collapse.',
  ];

  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Hero preview — tap to play form video fullscreen */}
      <button onClick={onPlayVideo} aria-label="Play form video" style={{
        display: 'block', width: '100%', textAlign: 'left', padding: 0, cursor: 'pointer', border: 'none',
        height: 180, borderRadius: 16, background: `linear-gradient(135deg, ${TM.ink}, #2a2a2a)`,
        marginBottom: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, bottom: -20, opacity: 0.18 }}>
          <StrideIcon name="dumbbell" size={170} color={TM.volt}/>
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 14px)',
          pointerEvents: 'none',
        }}/>
        {/* Play button */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 58, height: 58, borderRadius: 29, background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          border: '1.5px solid rgba(255,255,255,0.55)', display: 'grid', placeItems: 'center',
        }}>
          <div style={{ marginLeft: 3 }}><StrideIcon name="play" size={26} color="#fff"/></div>
        </div>
        <div style={{ position: 'absolute', left: 14, bottom: 12, right: 14 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#fff', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Tap to watch · Form video</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', marginTop: 4, lineHeight: 1.1 }}>{ex.name}</div>
        </div>
      </button>

      {/* At a glance — structured spec, not a flat tag dump */}
      <div style={{
        marginBottom: 16, borderRadius: 14, overflow: 'hidden',
        background: TM.surface, border: `1px solid ${TM.line}`,
      }}>
        <SpecRow label="Muscles involved" first>
          <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: TM.ink, textAlign: 'right' }}>
            {[ex.primary, ...secondaryList].filter(Boolean).join(', ')}
          </span>
        </SpecRow>
        <SpecRow label="Equipment">
          {equipList.length ? equipList.map((m, i) => (
            <Chip key={i} bg={TM.lineSoft}>{m}</Chip>
          )) : <Chip bg={TM.lineSoft}>Bodyweight</Chip>}
        </SpecRow>
        <SpecRow label="Difficulty">
          <Chip bg={dColor + '18'} ink={dColor} dot color={dColor}>{ex.diff}</Chip>
        </SpecRow>
      </div>

      {/* WYSIWYG body */}
      <article style={{ fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.55, color: TM.ink2 }}>
        <p style={{ margin: '0 0 14px', color: TM.ink2 }}>{description}</p>

        <H>Setup</H>
        <ol style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', counterReset: 'step' }}>
          {setup.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${TM.lineSoft}` : 'none' }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, background: TM.ink, color: '#fff', flexShrink: 0,
                display: 'grid', placeItems: 'center',
                fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11,
              }}>{i + 1}</div>
              <div style={{ flex: 1, paddingTop: 1 }}>{s}</div>
            </li>
          ))}
        </ol>

        <H>Form cues</H>
        <div style={{
          background: TM.lineSoft, borderLeft: `3px solid ${TM.volt}`, borderRadius: 10,
          padding: '12px 14px', margin: '0 0 14px',
        }}>
          {cues.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: i ? 8 : 0 }}>
              <div style={{ width: 5, height: 5, borderRadius: 5, background: TM.ink, marginTop: 8, flexShrink: 0 }}/>
              <div style={{ color: TM.ink }}>{c}</div>
            </div>
          ))}
        </div>

        <H>Common mistakes</H>
        <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none' }}>
          {mistakes.map((m, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', alignItems: 'flex-start' }}>
              <div style={{
                width: 16, height: 16, borderRadius: 8, background: dColor + '22', color: dColor,
                display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2,
                fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, lineHeight: 1,
              }}>!</div>
              <div>{m}</div>
            </li>
          ))}
        </ul>

        {related.length > 0 && (
          <>
            <H>Variations &amp; related</H>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {related.map((v, i) => (
                <button key={i} onClick={() => onOpenExercise && onOpenExercise(v)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer',
                  padding: '10px 12px', borderRadius: 10,
                  background: TM.surface, border: `1px solid ${TM.line}`,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: difficultyColor(v.diff) + '18', display: 'grid', placeItems: 'center',
                  }}>
                    <StrideIcon name="dumbbell" size={17} color={difficultyColor(v.diff)}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13, color: TM.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                    <div style={{ fontSize: 11.5, color: TM.ink3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.primary} · {v.equip}</div>
                  </div>
                  <StrideIcon name="chevR" size={16} color={TM.ink3}/>
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <H>Your records</H>
          {!logging && ex.id && (
            <button onClick={() => setLogging(true)} style={{
              border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: TM.accent,
            }}><StrideIcon name="plus" size={15} color={TM.accent}/> Log PR</button>
          )}
        </div>

        {logging && (
          <div style={{ background: TM.surface, border: `1px solid ${TM.line}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <PrInput metricType={metricType} value={draft} onChange={setDraft}/>
            <div style={{ marginTop: 12 }}>
              <PrField label="When did you hit it?">
                <input type="date" value={draftDate} max={new Date().toISOString().slice(0, 10)} onChange={e => setDraftDate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 11, border: `1px solid ${TM.line}`, background: TM.surface, color: TM.ink, fontFamily: 'Inter', fontSize: 14, outline: 'none' }}/>
              </PrField>
            </div>
            <div style={{ marginTop: 12 }}>
              <PrField label="Form quality"><FormQuality value={draftForm} onChange={setDraftForm}/></PrField>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <StrideButton variant="ghost" size="md" onClick={() => { setLogging(false); setDraft({}); setDraftForm(null); }} style={{ flex: 'none' }}>Cancel</StrideButton>
              <StrideButton variant="primary" size="md" onClick={savePr} style={{ flex: 1, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save PR'}</StrideButton>
            </div>
          </div>
        )}

        {prs.length > 0 ? (
          <div style={{ background: TM.surface, border: `1px solid ${TM.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            {prs.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: i ? `1px solid ${TM.lineSoft}` : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16, color: TM.ink }}>{p.display}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: TM.ink3, marginTop: 2 }}>{p.achieved_on || 'no date'}{p.form_quality ? ` · form ${p.form_quality}/5` : ''}</div>
                </div>
                <button onClick={() => deletePr(p.id)} aria-label="Delete record" style={{ border: 'none', background: 'none', cursor: 'pointer', color: TM.ink3, padding: 4 }}>
                  <StrideIcon name="trash" size={16} color={TM.ink3}/>
                </button>
              </div>
            ))}
          </div>
        ) : !logging && (
          <div style={{ background: TM.lineSoft, borderRadius: 12, padding: '14px', marginBottom: 16, fontFamily: 'Inter', fontSize: 13, color: TM.ink3, textAlign: 'center' }}>
            {ex.id ? 'No records yet — log your current best.' : 'Records aren\'t available for this item.'}
          </div>
        )}
      </article>

      {/* Sticky-ish action row */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        {onToggleFav && (
          <button onClick={onToggleFav} aria-label={isFav ? 'Remove favorite' : 'Add favorite'} style={{
            width: 46, borderRadius: 12, cursor: 'pointer',
            border: `1px solid ${isFav ? TM.accent : TM.line}`,
            background: isFav ? TM.accent : TM.surface,
            display: 'grid', placeItems: 'center',
          }}>
            <HeartGlyph filled={isFav} size={18} color={isFav ? '#fff' : TM.ink2}/>
          </button>
        )}
        {onToggleHide && (
          <button onClick={() => { onToggleHide(); if (!isHidden) onClose(); }} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '0 14px', borderRadius: 12, cursor: 'pointer',
            border: `1px solid ${isHidden ? TM.ink : TM.line}`,
            background: isHidden ? TM.ink : TM.surface,
            color: isHidden ? '#fff' : TM.ink2,
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13,
          }}>
            <StrideIcon name={isHidden ? 'eye' : 'eyeOff'} size={16} color={isHidden ? '#fff' : TM.ink2}/>
            {isHidden ? 'Unhide' : 'Hide'}
          </button>
        )}
        <StrideButton variant="primary" icon="play" style={{ flex: 1 }} onClick={onPlayVideo}>Watch form</StrideButton>
      </div>
      {!isHidden && (
        <div style={{ marginTop: 10 }}>
          <StrideButton variant="ghost" icon="plus" block>Add to plan</StrideButton>
        </div>
      )}
    </div>
  );
}

function H({ children }) {
  return (
    <h3 style={{
      margin: '0 0 8px',
      fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11,
      color: TM.ink3, textTransform: 'uppercase', letterSpacing: 1.2,
    }}>{children}</h3>
  );
}

// One labeled row inside the "At a glance" spec block
function SpecRow({ label, children, first }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
      borderTop: first ? 'none' : `1px solid ${TM.lineSoft}`,
    }}>
      <div style={{
        width: 110, flexShrink: 0,
        fontFamily: 'Inter', fontSize: 10.5, fontWeight: 700, color: TM.ink3,
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
        {children}
      </div>
    </div>
  );
}

// Find real library exercises related to `ex` (same / overlapping primary muscle),
// so the "Variations & related" list can navigate to actual exercises.
function relatedExercises(ex, limit = 5) {
  const all = collectExercises(window.STRIDE_LIBRARY);
  const tokens = (s) => (s || '').toLowerCase().split(/[^a-z]+/).filter(t => t.length > 2);
  const myTokens = new Set(tokens(ex.primary));
  const myEquip = equipBucket(ex.equip);
  return all
    .filter(e => e.name !== ex.name)
    .map(e => {
      const overlap = tokens(e.primary).filter(t => myTokens.has(t)).length;
      const exact = (e.primary || '').toLowerCase() === (ex.primary || '').toLowerCase() ? 3 : 0;
      const equipMatch = equipBucket(e.equip) === myEquip ? 0.5 : 0;
      return { e, score: overlap + exact + (overlap || exact ? equipMatch : 0) };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.e);
}

// Fullscreen form-video player, opened by tapping the exercise thumbnail.
function FormVideoOverlay({ ex, onClose }) {
  const [playing, setPlaying] = React.useState(true);
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 80, background: '#000',
      display: 'flex', flexDirection: 'column',
      animation: 'sheetUp 0.24s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
        padding: '52px 18px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)',
      }}>
        <button onClick={onClose} aria-label="Close video" style={{
          width: 38, height: 38, borderRadius: 19, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center',
        }}>
          <StrideIcon name="x" size={20} color="#fff"/>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#fff', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Form video</div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
        </div>
      </div>

      {/* Real self-hosted clip when we have one; cosmetic placeholder otherwise. */}
      {ex.video ? (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
          <video
            src={ex.video}
            controls autoPlay playsInline loop preload="auto"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
          {ex.source && (
            <a href={ex.source} target="_blank" rel="noreferrer" style={{
              position: 'absolute', left: 14, bottom: 20, zIndex: 3, textDecoration: 'none',
              fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
              background: 'rgba(0,0,0,0.45)', padding: '5px 10px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <StrideIcon name="instagram" size={13} color="rgba(255,255,255,0.85)"/>
              @freestyle_tricklist
            </a>
          )}
        </div>
      ) : (
        <>
          <button onClick={() => setPlaying(p => !p)} style={{
            flex: 1, border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${TM.ink}, #1a1a1a)`,
          }}>
            <div style={{ position: 'absolute', right: -40, top: '40%', opacity: 0.12 }}>
              <StrideIcon name="dumbbell" size={260} color={TM.volt}/>
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 8px, transparent 8px 18px)',
            }}/>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{
                width: 76, height: 76, borderRadius: 38, margin: '0 auto',
                background: 'rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.5)',
                display: 'grid', placeItems: 'center',
              }}>
                <div style={{ marginLeft: playing ? 0 : 4 }}>
                  <StrideIcon name={playing ? 'pause' : 'play'} size={34} color="#fff"/>
                </div>
              </div>
              <div style={{ marginTop: 14, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 }}>
                [ form demo · {ex.name} ]
              </div>
            </div>
          </button>

          {/* Bottom scrubber (cosmetic) */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
            padding: '20px 18px 34px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.65), transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace', fontSize: 11, color: '#fff' }}>
              <span>0:0{playing ? 7 : 0}</span>
              <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
                <div style={{ width: playing ? '32%' : '0%', height: '100%', background: TM.volt, transition: 'width 0.4s ease' }}/>
              </div>
              <span style={{ opacity: 0.6 }}>0:22</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function categoryColor(id) {
  return ({
    strength: TM.accent,
    calisthenics: TM.blue,
    'freestyle calisthenics': TM.volt,
    conditioning: TM.amber,
    cardio: TM.green,
    mobility: TM.ink3,
  })[id] || TM.ink;
}
function difficultyColor(diff) {
  return ({ Beginner: TM.green, Intermediate: TM.amber, Advanced: TM.rose })[diff] || TM.ink3;
}
function collectExercises(node, acc = []) {
  if (node.exercises) acc.push(...node.exercises);
  if (node.children) node.children.forEach(c => collectExercises(c, acc));
  return acc;
}
function countAll(node) { return collectExercises(node).length; }

function equipBucket(equip = '') {
  const s = equip.toLowerCase();
  if (s.includes('barbell') || s.includes('ez-bar')) return 'Barbell';
  if (s.includes('dumbbell')) return 'Dumbbell';
  if (s.includes('kettlebell')) return 'Kettlebell';
  if (s.includes('cable')) return 'Cable';
  if (s.includes('machine')) return 'Machine';
  if (s.includes('bodyweight') || s.includes('bar')) return 'Bodyweight';
  if (s.includes('band')) return 'Band';
  return 'Other';
}

function FilterChip({ label, color, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 4px 5px 10px', borderRadius: 999,
      background: color + '18',
      border: `1px solid ${color}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 6, background: color }}/>
      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11.5, color: TM.ink }}>{label}</span>
      <button onClick={onRemove} aria-label="Remove filter" style={{
        width: 18, height: 18, borderRadius: 9, border: 'none',
        background: 'rgba(0,0,0,0.08)', cursor: 'pointer', padding: 0,
        display: 'grid', placeItems: 'center', color: TM.ink2,
        fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, lineHeight: 1,
      }}>×</button>
    </div>
  );
}

function FilterSheetBody({ filters, setFilters, allLibrary, onClose, onClearAll }) {
  const diffOptions = ['Beginner', 'Intermediate', 'Advanced'];
  const equipOptions = [...new Set(allLibrary.map(e => equipBucket(e.equip)))].sort();

  const toggle = (group, val) => {
    setFilters(f => {
      const next = { diff: new Set(f.diff), equip: new Set(f.equip) };
      if (next[group].has(val)) next[group].delete(val); else next[group].add(val);
      return next;
    });
  };

  const count = (group, val) => {
    return allLibrary.filter(e => (group === 'diff' ? e.diff === val : equipBucket(e.equip) === val)).length;
  };

  const activeCount = filters.diff.size + filters.equip.size;
  const matchCount = allLibrary.filter(e =>
    (!filters.diff.size || filters.diff.has(e.diff)) &&
    (!filters.equip.size || filters.equip.has(equipBucket(e.equip)))
  ).length;

  return (
    <div style={{ padding: '4px 0 0' }}>
      <FSection title="Difficulty">
        {diffOptions.map(d => {
          const on = filters.diff.has(d);
          const c = difficultyColor(d);
          return (
            <FOption key={d} label={d} sub={`${count('diff', d)} exercises`} active={on} accent={c} onClick={() => toggle('diff', d)}/>
          );
        })}
      </FSection>

      <FSection title="Equipment">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {equipOptions.map(eq => {
            const on = filters.equip.has(eq);
            return (
              <button key={eq} onClick={() => toggle('equip', eq)} style={{
                padding: '8px 12px', borderRadius: 999,
                background: on ? TM.ink : TM.surface,
                color: on ? '#fff' : TM.ink,
                border: `1px solid ${on ? TM.ink : TM.line}`,
                cursor: 'pointer',
                fontFamily: 'Inter', fontWeight: 700, fontSize: 12.5,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {eq}
                <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 10.5, color: on ? '#ffffffaa' : TM.ink3 }}>
                  {count('equip', eq)}
                </span>
              </button>
            );
          })}
        </div>
      </FSection>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={onClearAll} disabled={!activeCount} style={{
          flex: 1, padding: '12px 16px', borderRadius: 12,
          background: TM.surface, border: `1px solid ${TM.line}`,
          color: activeCount ? TM.ink : TM.ink3,
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14,
          cursor: activeCount ? 'pointer' : 'default',
        }}>Clear all{activeCount ? ` (${activeCount})` : ''}</button>
        <button onClick={onClose} style={{
          flex: 1.4, padding: '12px 16px', borderRadius: 12,
          background: TM.ink, border: 'none', color: '#fff',
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer',
        }}>Show {matchCount} exercises</button>
      </div>
    </div>
  );
}

function FSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11,
        color: TM.ink3, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function FOption({ label, sub, active, accent, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 12,
      background: active ? accent + '18' : TM.surface,
      border: `1.5px solid ${active ? accent : TM.line}`,
      cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: active ? accent : 'transparent',
        border: `1.5px solid ${active ? accent : TM.line}`,
        display: 'grid', placeItems: 'center',
        flexShrink: 0,
      }}>
        {active && <StrideIcon name="check" size={12} color="#fff" strokeWidth={3}/>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TM.ink }}>{label}</div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 11, color: TM.ink3, marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ width: 8, height: 8, borderRadius: 8, background: accent }}/>
    </button>
  );
}

Object.assign(window, { GoalsScreen, InjuriesScreen, InjuryDetailScreen, LibraryScreen });
