// Workout Spots & Equipment — managed inside the Library.
// Spots are your fixed training grounds (gym / park / home / etc.): each records
// its type, size, available equipment, a standing prompt for the generator, and a
// schedule rule so the generator knows where you are on a given day.
// Equipment is the shared catalog spots draw from.
// Depends on data.jsx + ui.jsx + screens-main.jsx (Sheet, SectionHeader, EditSelect).

const TS = window.STRIDE_THEME;

// Visual meta for equipment categories (drill-down cards, like exercises).
const EQUIP_CAT_META = {
  'Free weights':       { icon: 'dumbbell', color: '#FF4D1F' },
  'Machines':           { icon: 'sliders',  color: '#2563EB' },
  'Bodyweight & rigs':  { icon: 'target',   color: '#9333EA' },
  'Cardio':             { icon: 'heart',    color: '#16A34A' },
  'Functional / space': { icon: 'flame',    color: '#F59E0B' },
};
function equipCatMeta(name) { return EQUIP_CAT_META[name] || { icon: 'dumbbell', color: TS.ink3 }; }

// ── Full-screen wrapper (used by the home/profile shortcut route) ──
function SpotsScreen({ go }) {
  return (
    <Screen>
      <StrideHeader title="Workout spots" back onBack={() => go('profile')}/>
      <SpotsManager go={go}/>
    </Screen>
  );
}

// ── Spots manager body (embedded in Library) ──────────────────
function SpotsManager({ go, addSignal }) {
  const [spots, setSpots] = window.useStrideSpots();
  const [picker, setPicker] = React.useState(false);   // choose-source sheet
  const [editor, setEditor] = React.useState(null);    // { spot } | { prefill, official }

  // Header "+" increments addSignal → open the source picker.
  React.useEffect(() => { if (addSignal) setPicker(true); }, [addSignal]);

  const removeSpot = (id) => {
    const next = spots.filter((s) => s.id !== id);
    if (next.length && !next.some((s) => s.isDefault)) next[0].isDefault = true;
    setSpots(next);
    setEditor(null);
  };

  const saveSpot = (spot) => {
    let next;
    if (spots.some((s) => s.id === spot.id)) next = spots.map((s) => (s.id === spot.id ? spot : s));
    else next = [...spots, spot];
    if (spot.isDefault) next = next.map((s) => (s.id === spot.id ? s : { ...s, isDefault: false }));
    else if (!next.some((s) => s.isDefault) && next.length) next[0].isDefault = true;
    setSpots(next);
    setEditor(null);
  };

  const editing = editor && editor.spot;
  const sheetTitle = editing ? 'Edit spot' : (editor && editor.official ? 'Add official spot' : 'New custom spot');

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: TS.ink3, lineHeight: 1.5, marginBottom: 16 }}>
        Your training grounds. The generator builds sessions from a spot's equipment, its standing prompt, and the day's schedule.
      </div>

      {spots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: TS.surface, border: `1px dashed ${TS.line}`, borderRadius: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: TS.lineSoft, display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <StrideIcon name="pin" size={26} color={TS.ink3}/>
          </div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TS.ink }}>No spots yet</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: TS.ink3, margin: '6px 0 16px' }}>Add where you train so sessions fit the room.</div>
          <StrideButton variant="volt" icon="plus" onClick={() => setPicker(true)}>Add a spot</StrideButton>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {spots.map((s) => <SpotCard key={s.id} spot={s} onClick={() => setEditor({ spot: s })}/>)}
        </div>
      )}
      <div style={{ height: 24 }}/>

      {/* Source picker */}
      {picker && (
        <Sheet title="Add a spot" onClose={() => setPicker(false)}>
          <SpotAddPicker
            existingNames={spots.map((s) => s.name.toLowerCase())}
            onCustom={() => { setPicker(false); setEditor({ prefill: null, official: false }); }}
            onOfficial={(off) => { setPicker(false); setEditor({ prefill: off, official: true }); }}
          />
        </Sheet>
      )}

      {/* Editor */}
      {editor && (
        <Sheet title={sheetTitle} onClose={() => setEditor(null)}>
          <SpotEditorBody
            spot={editor.spot || null}
            prefill={editor.prefill || null}
            official={!!editor.official}
            existingCount={spots.length}
            onSave={saveSpot}
            onDelete={editor.spot ? () => removeSpot(editor.spot.id) : null}
            onClose={() => setEditor(null)}
          />
        </Sheet>
      )}
    </div>
  );
}

// Choose-source sheet — custom vs official directory.
function SpotAddPicker({ existingNames, onCustom, onOfficial }) {
  const OFFICIAL = window.STRIDE_OFFICIAL_SPOTS || [];
  const [q, setQ] = React.useState('');
  const ql = q.trim().toLowerCase();
  const filtered = ql ? OFFICIAL.filter((o) => `${o.name} ${o.blurb}`.toLowerCase().includes(ql)) : OFFICIAL;

  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Custom */}
      <button onClick={onCustom} style={{
        width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13,
        background: TS.ink, border: 'none', borderRadius: 16, padding: 16, marginBottom: 20,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: TS.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="plus" size={22} color={TS.ink}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15, color: '#fff' }}>Create a custom spot</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#ffffffb0', marginTop: 3 }}>Home gym, garage, your local park…</div>
        </div>
        <StrideIcon name="chevR" size={18} color="#ffffff88"/>
      </button>

      {/* Official directory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <SectionHeader title="Add from official spots"/>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: TS.green + '1f', borderRadius: 7, padding: '3px 7px' }}>
          <StrideIcon name="check" size={11} color={TS.green} strokeWidth={3}/>
          <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 800, color: TS.green, textTransform: 'uppercase', letterSpacing: 0.4 }}>Verified</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TS.surface, border: `1px solid ${TS.line}`, borderRadius: 12, padding: '0 8px 0 12px', marginBottom: 12 }}>
        <StrideIcon name="search" size={16} color={TS.ink3}/>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gyms, parks, halls…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 14, color: TS.ink, padding: '10px 0' }}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((o) => {
          const meta = window.spotTypeMeta(o.type);
          const added = existingNames.includes(o.name.toLowerCase());
          return (
            <button key={o.id} onClick={() => onOfficial(o)} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              background: TS.surface, border: `1px solid ${TS.line}`, borderRadius: 14, padding: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: meta.color + '18', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <StrideIcon name={meta.icon} size={20} color={meta.color}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TS.ink }}>{o.name}</span>
                  {added && <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, color: TS.ink3 }}>· added</span>}
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TS.ink3, marginTop: 2 }}>{o.blurb} · {o.equipment.length} items</div>
              </div>
              <StrideIcon name="plus" size={18} color={TS.ink3}/>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: TS.ink3, textAlign: 'center', padding: '20px 0' }}>
            No match. <button onClick={onCustom} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TS.ink, fontFamily: 'Inter', fontSize: 13, fontWeight: 700, textDecoration: 'underline' }}>Create it as a custom spot.</button>
          </div>
        )}
      </div>
      <div style={{ height: 8 }}/>
    </div>
  );
}

// Spot photo thumbnail — shows the user's photo, or a subtle placeholder.
function SpotPhoto({ photo, tint = TS.ink, size = 56, width, height, radius = 14 }) {
  const w = width || size;
  const h = height || size;
  const iconSize = Math.round(Math.min(w, h) * 0.34);
  return (
    <div style={{
      width: w, height: h, borderRadius: radius, overflow: 'hidden', flexShrink: 0,
      background: TS.lineSoft, position: 'relative',
    }}>
      {photo ? (
        <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(135deg, ${tint}1f 0 5px, transparent 5px 11px)` }}/>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <StrideIcon name="pin" size={iconSize} color={tint} style={{ opacity: 0.45 }}/>
          </div>
        </>
      )}
    </div>
  );
}

// Green scalloped "verified" seal with a white check.
function VerifiedSeal({ size = 19, color = TS.blue }) {
  const N = 11, R0 = 18, amp = 2.6, c = 24, steps = 132;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = R0 + amp * Math.cos(N * a);
    d += (i === 0 ? 'M' : 'L') + (c + r * Math.cos(a)).toFixed(2) + ' ' + (c + r * Math.sin(a)).toFixed(2) + ' ';
  }
  d += 'Z';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block', flexShrink: 0 }} aria-label="Official">
      <path d={d} fill={color}/>
      <path d="M15.5 24.5 L21.5 30.5 L32.5 18.5" fill="none" stroke="#fff" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// "Official" badge for verified spots.
function OfficialBadge() {
  return <VerifiedSeal size={19}/>;
}

function SpotCard({ spot, onClick }) {
  const meta = window.spotTypeMeta(spot.type);
  const sched = window.scheduleLabel(spot.schedule);
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', width: '100%',
      background: TS.surface, border: `1px solid ${TS.line}`, borderRadius: 18, padding: 16,
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <SpotPhoto photo={spot.photo} tint={meta.color} size={56}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 16, color: TS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.name}</span>
          {spot.reviewStatus === 'official' && <OfficialBadge/>}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: TS.ink3, marginTop: 3 }}>
          {meta.label} · {spot.size} · {spot.equipment.length} item{spot.equipment.length === 1 ? '' : 's'}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: TS.lineSoft, borderRadius: 8, padding: '4px 9px' }}>
          <StrideIcon name="cal" size={12} color={TS.ink2}/>
          <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TS.ink2 }}>{sched}</span>
        </div>
      </div>
      <StrideIcon name="chevR" size={18} color={TS.ink3} style={{ marginTop: 14 }}/>
    </button>
  );
}

function SpotEditorBody({ spot, prefill, official, existingCount, onSave, onDelete, onClose }) {
  const TYPES = window.SPOT_TYPES;
  const SIZES = window.SPOT_SIZES;
  const PRESETS = window.SCHEDULE_PRESETS;
  const [groups] = window.useStrideEquipment();
  const src = spot || prefill; // existing spot, or prefill from official directory

  const [name, setName] = React.useState(src ? src.name : '');
  const [type, setType] = React.useState(src ? src.type : 'gym');
  const [size, setSize] = React.useState(src ? src.size : 'Medium');
  const [equipment, setEquipment] = React.useState(() => new Set(src ? src.equipment : []));
  const [prompt, setPrompt] = React.useState(src ? src.prompt || '' : '');
  const [schedLabel, setSchedLabel] = React.useState(() => window.scheduleLabel(spot ? spot.schedule : { type: 'default' }));
  const [notes, setNotes] = React.useState(spot ? spot.notes || '' : '');
  const [isDefault, setIsDefault] = React.useState(spot ? !!spot.isDefault : existingCount === 0);
  const [photo, setPhoto] = React.useState(src ? src.photo || null : null);
  // Read a chosen image, downscale it, and store as a compact data URL.
  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 640;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setPhoto(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  // Verified state: official-directory adds are verified; custom spots can be submitted.
  const [reviewStatus, setReviewStatus] = React.useState(
    official ? 'official' : (spot ? spot.reviewStatus || 'private' : 'private')
  );

  const toggleEquip = (item) => setEquipment((prev) => {
    const next = new Set(prev);
    next.has(item) ? next.delete(item) : next.add(item);
    return next;
  });

  const canSave = name.trim().length > 0;
  const handleSave = () => {
    if (!canSave) return;
    const preset = PRESETS.find((p) => p.label === schedLabel) || PRESETS[0];
    // Newly submitted for review → log a request for the admin dashboard.
    const wasPending = spot && spot.reviewStatus === 'pending';
    if (reviewStatus === 'pending' && !wasPending) {
      const meta = `${(TYPES.find((t) => t.id === type) || {}).label || 'Spot'} · ${size}`;
      window.addStrideRequest({ kind: 'spot', name: name.trim(), meta, note: notes.trim() || prompt.trim() });
    }
    onSave({
      id: spot ? spot.id : `spot-${Date.now()}`,
      name: name.trim(), type, size,
      equipment: [...equipment],
      prompt: prompt.trim(),
      schedule: preset.value,
      notes: notes.trim(),
      isDefault,
      reviewStatus,
      photo,
    });
  };

  return (
    <div style={{ padding: '4px 0 0' }}>
      {/* Status banner */}
      {reviewStatus === 'official' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: TS.green + '14', border: `1px solid ${TS.green}33`, borderRadius: 12, padding: '10px 12px', marginBottom: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: TS.green, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <StrideIcon name="check" size={15} color="#fff" strokeWidth={3}/>
          </div>
          <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, color: TS.ink2, lineHeight: 1.4 }}>
            <b style={{ color: TS.ink }}>Verified spot.</b> Prefilled from the official directory — tweak anything to fit your visits.
          </div>
        </div>
      )}
      {reviewStatus === 'pending' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: TS.volt + '22', border: `1px solid ${TS.volt}`, borderRadius: 12, padding: '10px 12px', marginBottom: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: TS.ink, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <StrideIcon name="cal" size={14} color={TS.volt}/>
          </div>
          <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, color: TS.ink2, lineHeight: 1.4 }}>
            <b style={{ color: TS.ink }}>Submitted for review.</b> We'll let you know if it's published to the official directory.
          </div>
        </div>
      )}

      <SectionHeader title="Name"/>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PowerHaus Gym, Garage, Riverside park"
        style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, marginBottom: 18, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TS.line}`, background: TS.surface, color: TS.ink, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, outline: 'none' }}/>

      <SectionHeader title="Photo"/>
      <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TS.ink3, margin: '6px 0 10px' }}>Optional — helps you recognise the spot at a glance.</div>
      <label style={{ display: 'block', position: 'relative', cursor: 'pointer', marginBottom: 10 }}>
        <SpotPhoto photo={photo} tint={(TYPES.find((t) => t.id === type) || {}).color || TS.ink} width="100%" height={180} radius={16}/>
        <div style={{
          position: 'absolute', right: 12, bottom: 12,
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(10,10,10,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          borderRadius: 11, padding: '8px 13px',
          fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13, color: '#fff',
        }}>
          <StrideIcon name={photo ? 'edit' : 'plus'} size={16} color="#fff"/>
          {photo ? 'Replace' : 'Add photo'}
        </div>
        <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }}/>
      </label>
      {photo && (
        <button onClick={() => setPhoto(null)} style={{
          border: 'none', background: 'none', cursor: 'pointer', marginBottom: 18, padding: '0 2px',
          fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: TS.ink3,
        }}>Remove photo</button>
      )}
      {!photo && <div style={{ marginBottom: 18 }}/>}

      <SectionHeader title="Type"/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, margin: '10px 0 18px' }}>
        {TYPES.map((t) => {
          const active = type === t.id;
          return (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 13,
              background: active ? t.color + '14' : TS.surface, border: `1.5px solid ${active ? t.color : TS.line}`,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? t.color + '22' : TS.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <StrideIcon name={t.icon} size={18} color={active ? t.color : TS.ink2}/>
              </div>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12.5, color: active ? TS.ink : TS.ink2, lineHeight: 1.1 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <SectionHeader title="Space"/>
      <div style={{ display: 'flex', gap: 6, padding: 3, borderRadius: 12, background: TS.lineSoft, margin: '10px 0 18px' }}>
        {SIZES.map((sz) => (
          <button key={sz} onClick={() => setSize(sz)} style={{
            flex: 1, padding: '9px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: size === sz ? TS.ink : 'transparent', color: size === sz ? '#fff' : TS.ink2,
            fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12,
          }}>{sz}</button>
        ))}
      </div>

      {/* Equipment */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <SectionHeader title="Available equipment"/>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TS.ink3 }}>{equipment.size} selected</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '12px 0 18px' }}>
        {groups.map((g) => (
          <div key={g.group}>
            <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TS.ink3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{g.group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {g.items.map((item) => {
                const on = equipment.has(item);
                return (
                  <button key={item} onClick={() => toggleEquip(item)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    border: `1px solid ${on ? TS.ink : TS.line}`, background: on ? TS.ink : TS.surface, color: on ? '#fff' : TS.ink2,
                    borderRadius: 999, padding: '7px 12px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
                  }}>
                    {on && <StrideIcon name="check" size={13} color="#fff" strokeWidth={3}/>}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TS.ink3 }}>
          Missing something? Add it in <b style={{ color: TS.ink2 }}>Library → Equipment</b>.
        </div>
      </div>

      {/* Notes */}
      <SectionHeader title="Notes for your coach"/>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Low ceiling — no standing overhead. Racks busy after 5pm." rows={2}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', marginTop: 10, marginBottom: 16, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TS.line}`, background: TS.surface, color: TS.ink, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, outline: 'none' }}/>

      {/* Make it official — custom spots only */}
      {reviewStatus !== 'official' && (
        reviewStatus === 'pending' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: TS.volt + '22', border: `1px solid ${TS.volt}`, borderRadius: 14, padding: '12px 13px', marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: TS.ink, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <StrideIcon name="check" size={16} color={TS.volt} strokeWidth={3}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TS.ink }}>Queued for review</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TS.ink3, marginTop: 2 }}>We'll publish it to the directory if approved</div>
            </div>
            <button onClick={() => setReviewStatus('private')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12, color: TS.ink3, padding: '6px 4px' }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setReviewStatus('pending')} style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11,
            background: TS.surface, border: `1.5px solid ${TS.ink}`, borderRadius: 14, padding: '12px 13px', marginBottom: 18,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: TS.volt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <StrideIcon name="send" size={16} color={TS.ink}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TS.ink }}>Make it official</div>
              <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TS.ink3, marginTop: 2 }}>Submit this spot so anyone can add it</div>
            </div>
            <StrideIcon name="chevR" size={18} color={TS.ink3}/>
          </button>
        )
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {onDelete ? (
          <button onClick={onDelete} aria-label="Delete spot" style={{ width: 48, borderRadius: 12, cursor: 'pointer', border: `1px solid ${TS.line}`, background: TS.surface, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <StrideIcon name="trash" size={18} color={TS.rose}/>
          </button>
        ) : (
          <StrideButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</StrideButton>
        )}
        <StrideButton variant="volt" icon="check" style={{ flex: 1.6 }} onClick={handleSave}>{spot ? 'Save spot' : 'Add spot'}</StrideButton>
      </div>
      <div style={{ height: 8 }}/>
    </div>
  );
}

// ── Equipment catalog manager (embedded in Library) ───────────
function EquipmentManager({ addSignal, view = 'all', setView }) {
  const [groups] = window.useStrideEquipment();
  const [prefs, setPref] = window.useEquipmentPrefs();
  const [adding, setAdding] = React.useState(false);
  const [requesting, setRequesting] = React.useState(null); // null | { name }
  const [cat, setCat] = React.useState(null); // null = category grid; else group name

  React.useEffect(() => { if (addSignal) setAdding(true); }, [addSignal]);

  const addItem = (groupName, item) => {
    const name = item.trim();
    if (!name) return;
    const next = groups.map((g) => g.group === groupName
      ? (g.items.some((i) => i.toLowerCase() === name.toLowerCase()) ? g : { ...g, items: [...g.items, name] })
      : g);
    window.saveStrideEquipment(next);
    setAdding(false);
  };

  const all = groups.flatMap((g) => g.items);
  const preferredCount = all.filter((i) => prefs[i] === 'preferred').length;
  const avoidCount = all.filter((i) => prefs[i] === 'avoid').length;

  const [q, setQ] = React.useState('');
  const ql = q.trim().toLowerCase();
  const matches = (i) => i.toLowerCase().includes(ql);
  const shownGroups = ql
    ? groups.map((g) => ({ ...g, items: g.items.filter(matches) })).filter((g) => g.items.length > 0)
    : groups;
  const matchCount = ql ? shownGroups.reduce((n, g) => n + g.items.length, 0) : all.length;

  const grpStats = (g) => ({
    pref: g.items.filter((i) => prefs[i] === 'preferred').length,
    avoid: g.items.filter((i) => prefs[i] === 'avoid').length,
  });
  const activeGroup = cat ? groups.find((g) => g.group === cat) : null;
  const rowFor = (item) => (
    <EquipPrefRow key={item} item={item} state={prefs[item] || 'neutral'} onSet={(st) => setPref(item, st === (prefs[item] || 'neutral') ? 'neutral' : st)}/>
  );

  // Prefer/Avoid header filter → flat grouped list (bypasses the drill-down).
  const viewActive = view !== 'all';
  const viewPrefState = view === 'pref' ? 'preferred' : 'avoid';
  const viewGroups = viewActive
    ? groups.map((g) => ({ ...g, items: g.items.filter((i) => (prefs[i] || 'neutral') === viewPrefState && (!ql || matches(i))) })).filter((g) => g.items.length > 0)
    : null;
  const viewCount = viewGroups ? viewGroups.reduce((n, g) => n + g.items.length, 0) : 0;

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: TS.ink3, lineHeight: 1.5, marginBottom: 14 }}>
        Your global equipment preferences. Mark what you like and what to avoid — it applies to every spot and every generated session, not just one.
      </div>

      {/* Search — matches the Exercises tab layout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: TS.surface, border: `1px solid ${TS.line}`, borderRadius: 14, marginBottom: 14 }}>
        <StrideIcon name="search" size={18} color={TS.ink3}/>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment, categories"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Inter', fontSize: 14, color: TS.ink }}/>
        {q && (
          <button onClick={() => setQ('')} aria-label="Clear search" style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <StrideIcon name="x" size={15} color={TS.ink3} strokeWidth={2.5}/>
          </button>
        )}
      </div>

      {/* Active filter chip (prefer/avoid) */}
      {viewActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: (view === 'pref' ? TS.green : TS.rose) + '18', borderRadius: 999, padding: '6px 12px' }}>
            <StrideIcon name={view === 'pref' ? 'heart' : 'ban'} size={13} color={view === 'pref' ? TS.green : TS.rose}/>
            <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12, color: view === 'pref' ? TS.green : TS.rose }}>{view === 'pref' ? 'Preferred' : 'Avoided'} · {viewCount}</span>
          </span>
          <button onClick={() => setView && setView('all')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 11, fontWeight: 800, color: TS.ink3, textTransform: 'uppercase', letterSpacing: 0.6, padding: '4px 6px' }}>Clear</button>
        </div>
      )}

      {/* Breadcrumb (when drilled into a category, no search/view filter) */}
      {!ql && !viewActive && cat && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <button onClick={() => setCat(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: TS.ink3, padding: 0 }}>All equipment</button>
          <StrideIcon name="chevR" size={12} color={TS.ink3}/>
          <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 800, color: TS.ink }}>{cat}</span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: TS.ink2 }}>
          <span style={{ width: 18, height: 18, borderRadius: 6, background: TS.green, display: 'grid', placeItems: 'center' }}><StrideIcon name="heart" size={11} color="#fff"/></span>
          Prefer {preferredCount ? `· ${preferredCount}` : ''}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: 11.5, fontWeight: 600, color: TS.ink2 }}>
          <span style={{ width: 18, height: 18, borderRadius: 6, background: TS.rose, display: 'grid', placeItems: 'center' }}><StrideIcon name="ban" size={11} color="#fff"/></span>
          Avoid {avoidCount ? `· ${avoidCount}` : ''}
        </span>
      </div>

      {viewActive ? (
        /* ── Prefer/Avoid filtered list ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {viewGroups.map((g) => (
            <div key={g.group}>
              <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TS.ink3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>{g.group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{g.items.map(rowFor)}</div>
            </div>
          ))}
          {viewGroups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 20px', background: TS.surface, border: `1px dashed ${TS.line}`, borderRadius: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: TS.lineSoft, display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
                <StrideIcon name={view === 'pref' ? 'heart' : 'ban'} size={22} color={TS.ink3}/>
              </div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, color: TS.ink }}>Nothing {view === 'pref' ? 'preferred' : 'avoided'} yet</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: TS.ink3, marginTop: 4 }}>Tap the {view === 'pref' ? 'heart' : 'ban'} icon on any item to mark it.</div>
            </div>
          )}
        </div>
      ) : ql ? (
        /* ── Flat search results across all categories ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {shownGroups.map((g) => (
            <div key={g.group}>
              <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: TS.ink3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>{g.group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{g.items.map(rowFor)}</div>
            </div>
          ))}
          {shownGroups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: TS.ink3, marginBottom: 12 }}>No equipment matches “{q.trim()}”.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <StrideButton variant="ghost" icon="plus" onClick={() => setAdding(true)}>Add “{q.trim()}” to my list</StrideButton>
                <StrideButton variant="volt" icon="send" onClick={() => setRequesting({ name: q.trim() })}>Request it for everyone</StrideButton>
              </div>
            </div>
          )}
        </div>
      ) : cat && activeGroup ? (
        /* ── Drilled into a category: equipment records (leaves) ── */
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {activeGroup.items.map(rowFor)}
            {activeGroup.items.length === 0 && (
              <span style={{ fontFamily: 'Inter', fontSize: 12, color: TS.ink3, fontStyle: 'italic', padding: '8px 0' }}>Nothing here yet.</span>
            )}
          </div>
          <div style={{ height: 16 }}/>
          <StrideButton variant="ghost" block icon="plus" onClick={() => setAdding(true)}>Add to {cat}</StrideButton>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TS.ink3, textAlign: 'center', marginTop: 12 }}>
            {activeGroup.items.length} item{activeGroup.items.length === 1 ? '' : 's'} · tap an icon to set, tap again to clear
          </div>
        </>
      ) : (
        /* ── Top level: category cards ── */
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {groups.map((g) => {
              const meta = equipCatMeta(g.group);
              const st = grpStats(g);
              return (
                <button key={g.group} onClick={() => setCat(g.group)} style={{
                  textAlign: 'left', cursor: 'pointer', border: `1px solid ${TS.line}`, background: TS.surface,
                  borderRadius: 16, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ height: 78, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` }}>
                    <div style={{ position: 'absolute', right: -10, bottom: -14, opacity: 0.24 }}>
                      <StrideIcon name={meta.icon} size={92} color="#fff"/>
                    </div>
                    <div style={{ position: 'absolute', left: 10, top: 10, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9 }}>Category</div>
                    <div style={{ position: 'absolute', left: 10, bottom: 8, fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1 }}>{g.items.length}</div>
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 14, color: TS.ink, lineHeight: 1.2 }}>{g.group}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, fontFamily: 'Inter', fontSize: 11, color: TS.ink3 }}>
                      {st.pref > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: TS.green, fontWeight: 700 }}><StrideIcon name="heart" size={11} color={TS.green}/>{st.pref}</span>}
                      {st.avoid > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: TS.rose, fontWeight: 700 }}><StrideIcon name="ban" size={11} color={TS.rose}/>{st.avoid}</span>}
                      {st.pref === 0 && st.avoid === 0 && <span>Tap to set preferences</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Footer: request (always available) */}
      <div style={{ height: 16 }}/>
      <button onClick={() => setRequesting({ name: '' })} style={{
        width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11,
        background: 'transparent', border: `1px dashed ${TS.line}`, borderRadius: 14, padding: '12px 13px',
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: TS.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name="send" size={16} color={TS.ink2}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: TS.ink }}>Request equipment for the catalog</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11.5, color: TS.ink3, marginTop: 2 }}>Ask the team to add it for all users</div>
        </div>
        <StrideIcon name="chevR" size={18} color={TS.ink3}/>
      </button>
      <div style={{ height: 24 }}/>

      {adding && (
        <Sheet title={cat ? `Add to ${cat}` : 'Add equipment'} onClose={() => setAdding(false)}>
          <EquipmentAddBody groups={groups} defaultGroup={cat} onAdd={addItem} onClose={() => setAdding(false)}/>
        </Sheet>
      )}

      {requesting && (
        <Sheet title="Request equipment" onClose={() => setRequesting(null)}>
          <RequestSheet kind="equipment" defaultName={requesting.name} onClose={() => setRequesting(null)}/>
        </Sheet>
      )}
    </div>
  );
}

function EquipPrefRow({ item, state, onSet }) {
  const avoid = state === 'avoid';
  const cells = [
    { key: 'preferred', icon: 'heart', bg: TS.green },
    { key: 'avoid', icon: 'ban', bg: TS.rose },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 8px 13px', borderRadius: 12, background: TS.surface, border: `1px solid ${avoid ? TS.rose + '55' : TS.line}` }}>
      <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: avoid ? TS.ink3 : TS.ink, textDecoration: avoid ? 'line-through' : 'none' }}>{item}</span>
      <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 10, background: TS.lineSoft }}>
        {cells.map((c) => {
          const active = state === c.key;
          return (
            <button key={c.key} onClick={() => onSet(c.key)} aria-label={c.key} style={{
              width: 34, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: active ? c.bg : 'transparent', display: 'grid', placeItems: 'center',
            }}>
              <StrideIcon name={c.icon} size={15} color={active ? '#fff' : TS.ink3} strokeWidth={2.2}/>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EquipmentAddBody({ groups, defaultGroup, onAdd, onClose }) {
  const [name, setName] = React.useState('');
  const [group, setGroup] = React.useState(defaultGroup || (groups[0] ? groups[0].group : ''));
  const canAdd = name.trim().length > 0 && group;

  return (
    <div style={{ padding: '4px 0 0' }}>
      <SectionHeader title="Equipment name"/>
      <input value={name} autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && canAdd) onAdd(group, name); }}
        placeholder="e.g. Hack squat, Glute-ham raise, Sandbag"
        style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, marginBottom: 18, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TS.line}`, background: TS.surface, color: TS.ink, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, outline: 'none' }}/>

      <SectionHeader title="Category"/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0 18px' }}>
        {groups.map((g) => {
          const active = group === g.group;
          return (
            <button key={g.group} onClick={() => setGroup(g.group)} style={{
              textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 13,
              background: active ? TS.ink : TS.surface, border: `1.5px solid ${active ? TS.ink : TS.line}`,
            }}>
              <span style={{ flex: 1, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 13.5, color: active ? '#fff' : TS.ink }}>{g.group}</span>
              {active && <StrideIcon name="check" size={18} color={TS.volt} strokeWidth={3}/>}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <StrideButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</StrideButton>
        <StrideButton variant="volt" icon="check" style={{ flex: 1.6 }} onClick={() => canAdd && onAdd(group, name)}>Add</StrideButton>
      </div>
      <div style={{ height: 8 }}/>
    </div>
  );
}

Object.assign(window, { SpotsScreen, SpotsManager, SpotAddPicker, SpotEditorBody, SpotCard, EquipmentManager, EquipPrefRow, EquipmentAddBody, RequestSheet });

// ── Request-to-add sheet (user → admin dashboard) ─────────────
// Used to request a new exercise / equipment / spot for the official catalog.
function RequestSheet({ kind, defaultName, onClose }) {
  const KIND_META = {
    exercise:  { label: 'exercise',  icon: 'dumbbell', hint: 'e.g. Legs · Compound, or which muscle it targets' },
    equipment: { label: 'equipment', icon: 'dumbbell', hint: 'e.g. which category it belongs to' },
    spot:      { label: 'spot',      icon: 'pin', hint: 'e.g. Commercial Gym · Large' },
  };
  const km = KIND_META[kind] || KIND_META.exercise;
  const [name, setName] = React.useState(defaultName || '');
  const [meta, setMeta] = React.useState('');
  const [note, setNote] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const canSend = name.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    window.addStrideRequest({ kind, name, meta, note });
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ padding: '8px 0 4px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: TS.green + '1a', display: 'grid', placeItems: 'center', margin: '8px auto 16px' }}>
          <StrideIcon name="check" size={30} color={TS.green} strokeWidth={3}/>
        </div>
        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 19, color: TS.ink }}>Request sent</div>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: TS.ink3, lineHeight: 1.5, margin: '8px 28px 22px' }}>
          Thanks! Our team will review “{name.trim()}” and let you know if it's added to the official {km.label} catalog.
        </div>
        <StrideButton variant="volt" block icon="check" onClick={onClose}>Done</StrideButton>
        <div style={{ height: 6 }}/>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: TS.surface, border: `1px solid ${TS.line}`, borderRadius: 14, padding: '12px 13px', marginBottom: 18 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: TS.lineSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <StrideIcon name={km.icon} size={19} color={TS.ink2}/>
        </div>
        <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 12.5, color: TS.ink3, lineHeight: 1.4 }}>
          Request a new <b style={{ color: TS.ink2 }}>{km.label}</b> for the official catalog. An admin reviews every submission.
        </div>
      </div>

      <SectionHeader title="Name"/>
      <input value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder={`Name of the ${km.label}`}
        style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, marginBottom: 16, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TS.line}`, background: TS.surface, color: TS.ink, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 15, outline: 'none' }}/>

      <SectionHeader title="Category / detail"/>
      <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={km.hint}
        style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, marginBottom: 16, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TS.line}`, background: TS.surface, color: TS.ink, fontFamily: 'Inter', fontSize: 13.5, outline: 'none' }}/>

      <SectionHeader title="Why add it?"/>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tell the team a bit about it — helps them review faster."
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', marginTop: 10, marginBottom: 18, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TS.line}`, background: TS.surface, color: TS.ink, fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.5, outline: 'none' }}/>

      <div style={{ display: 'flex', gap: 8 }}>
        <StrideButton variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</StrideButton>
        <StrideButton variant="volt" icon="send" style={{ flex: 1.6 }} onClick={submit}>Send request</StrideButton>
      </div>
      <div style={{ height: 8 }}/>
    </div>
  );
}
