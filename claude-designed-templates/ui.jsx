// Shared UI primitives for Stride workout app.
// Uses STRIDE_THEME tokens from data.jsx.

const T = window.STRIDE_THEME;

// ── Icon set ──────────────────────────────────────────────────
// Stroke-based, athletic, 24×24 viewBox.
function StrideIcon({ name, size = 22, color = 'currentColor', strokeWidth = 2, style }) {
  const s = strokeWidth;
  const p = { stroke: color, strokeWidth: s, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const f = { fill: color, stroke: 'none' };
  const paths = {
    home: <><path {...p} d="M3 11 12 3l9 8"/><path {...p} d="M5 10v10h14V10"/><path {...p} d="M10 20v-6h4v6"/></>,
    cal: <><rect {...p} x="3" y="5" width="18" height="16" rx="2"/><path {...p} d="M3 9h18"/><path {...p} d="M8 3v4M16 3v4"/></>,
    target: <><circle {...p} cx="12" cy="12" r="9"/><circle {...p} cx="12" cy="12" r="5"/><circle {...f} cx="12" cy="12" r="1.8"/></>,
    book: <><path {...p} d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path {...p} d="M4 17a3 3 0 0 1 3-3h11"/></>,
    user: <><circle {...p} cx="12" cy="8" r="4"/><path {...p} d="M4 21a8 8 0 0 1 16 0"/></>,
    chat: <><path {...p} d="M21 12a8 8 0 1 1-3.2-6.4L21 5l-1 4.4A8 8 0 0 1 21 12Z"/><circle {...f} cx="9" cy="12" r="1"/><circle {...f} cx="13" cy="12" r="1"/><circle {...f} cx="17" cy="12" r="1"/></>,
    sparkles: <><path {...p} d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path {...p} d="M5.6 5.6 9 9M15 15l3.4 3.4M5.6 18.4 9 15M15 9l3.4-3.4"/></>,
    bolt: <><path {...p} d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></>,
    bandage: <><rect {...p} x="2" y="9" width="20" height="6" rx="3" transform="rotate(-30 12 12)"/><circle {...f} cx="10" cy="12" r=".9"/><circle {...f} cx="14" cy="12" r=".9"/><circle {...f} cx="12" cy="10.2" r=".9"/><circle {...f} cx="12" cy="13.8" r=".9"/></>,
    scale: <><rect {...p} x="3" y="4" width="18" height="16" rx="3"/><circle {...p} cx="12" cy="12" r="4"/><path {...p} d="M12 9v3l2 1"/></>,
    settings: <><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
    arrowLeft: <><path {...p} d="M19 12H5M12 19l-7-7 7-7"/></>,
    arrowRight: <><path {...p} d="M5 12h14M12 5l7 7-7 7"/></>,
    arrowUp: <><path {...p} d="M12 19V5M5 12l7-7 7 7"/></>,
    arrowDown: <><path {...p} d="M12 5v14M19 12l-7 7-7-7"/></>,
    chevR: <><path {...p} d="M9 6l6 6-6 6"/></>,
    chevL: <><path {...p} d="M15 6l-6 6 6 6"/></>,
    chevD: <><path {...p} d="M6 9l6 6 6-6"/></>,
    plus: <><path {...p} d="M12 5v14M5 12h14"/></>,
    minus: <><path {...p} d="M5 12h14"/></>,
    check: <><path {...p} d="M5 12.5 10 18l9-12"/></>,
    x: <><path {...p} d="M6 6l12 12M18 6L6 18"/></>,
    close: <><path {...p} d="M6 6l12 12M18 6L6 18"/></>,
    play: <><path {...f} d="M7 4.5v15l13-7.5L7 4.5Z"/></>,
    pause: <><rect {...f} x="6" y="5" width="4" height="14" rx="1"/><rect {...f} x="14" y="5" width="4" height="14" rx="1"/></>,
    timer: <><circle {...p} cx="12" cy="13" r="8"/><path {...p} d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/></>,
    skip: <><path {...f} d="M5 5v14l10-7L5 5Z"/><rect {...f} x="16" y="5" width="3" height="14" rx="1"/></>,
    skipBack: <><path {...f} d="M19 5v14L9 12l10-7Z"/><rect {...f} x="5" y="5" width="3" height="14" rx="1"/></>,
    flame: <><path {...p} d="M12 21c4 0 7-2.7 7-7 0-3-2-5-3-7-1 2-2 3-4 3-1-3 1-5 1-8-4 1-7 5-7 10 0 5 3 9 6 9Z"/></>,
    trend: <><path {...p} d="M3 17l6-6 4 4 8-8"/><path {...p} d="M14 7h7v7"/></>,
    dumbbell: <><rect {...p} x="2" y="9" width="3" height="6" rx="1"/><rect {...p} x="19" y="9" width="3" height="6" rx="1"/><rect {...p} x="5" y="7" width="3" height="10" rx="1"/><rect {...p} x="16" y="7" width="3" height="10" rx="1"/><path {...p} d="M8 12h8"/></>,
    folder: <><path {...p} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
    filter: <><path {...p} d="M3 5h18M6 12h12M10 19h4"/></>,
    search: <><circle {...p} cx="11" cy="11" r="7"/><path {...p} d="m20 20-3.5-3.5"/></>,
    send: <><path {...p} d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/></>,
    mic: <><rect {...p} x="9" y="3" width="6" height="12" rx="3"/><path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>,
    edit: <><path {...p} d="M4 20h4l11-11-4-4L4 16zM14 5l4 4"/></>,
    trash: <><path {...p} d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></>,
    more: <><circle {...f} cx="5" cy="12" r="1.7"/><circle {...f} cx="12" cy="12" r="1.7"/><circle {...f} cx="19" cy="12" r="1.7"/></>,
    info: <><circle {...p} cx="12" cy="12" r="9"/><path {...p} d="M12 11v6"/><circle {...f} cx="12" cy="7.5" r="1"/></>,
    sliders: <><path {...p} d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle {...p} cx="16" cy="7" r="2"/><circle {...p} cx="8" cy="17" r="2"/></>,
    heart: <><path {...p} d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/></>,
    leaf: <><path {...p} d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14ZM5 19l8-8"/></>,
    eye: <><path {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle {...p} cx="12" cy="12" r="3"/></>,
    eyeOff: <><path {...p} d="M3 3l18 18"/><path {...p} d="M10.6 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a16.3 16.3 0 0 1-3.3 4.1M6.6 6.6A16.4 16.4 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.2-1"/><path {...p} d="M9.5 9.6a3 3 0 0 0 4.2 4.2"/></>,
    pin: <><path {...p} d="M12 21s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12Z"/><circle {...p} cx="12" cy="9" r="2.5"/></>,
    ruler: <><rect {...p} x="3" y="8" width="18" height="8" rx="2" transform="rotate(-45 12 12)"/><path {...p} d="M8.5 7.5l1.5 1.5M11 10l1.5 1.5M13.5 12.5l1.5 1.5"/></>,
    ban: <><circle {...p} cx="12" cy="12" r="9"/><path {...p} d="M5.6 5.6l12.8 12.8"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, ...style }}>
      {paths[name] || null}
    </svg>
  );
}

// ── Body-part SVG (used in injury cards) ──────────────────────
function BodySilhouette({ size = 120, highlights = [] }) {
  // highlights: array of part keys to glow
  const hi = (key) => highlights.includes(key);
  const fill = (key) => hi(key) ? T.accent : '#E0DCD0';
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 80 112">
      {/* head */}
      <circle cx="40" cy="11" r="7" fill="#D8D2C2"/>
      {/* neck */}
      <rect x="36" y="18" width="8" height="4" fill="#D8D2C2"/>
      {/* torso */}
      <path d="M22 24 Q40 20 58 24 L60 50 Q40 56 20 50 Z" fill="#D8D2C2"/>
      {/* l shoulder */}
      <circle cx="22" cy="26" r="6" fill={fill('lshoulder')}/>
      {/* r shoulder */}
      <circle cx="58" cy="26" r="6" fill={fill('rshoulder')}/>
      {/* l arm */}
      <path d="M16 30 L13 56 L16 56 L20 32 Z" fill="#D8D2C2"/>
      {/* r arm */}
      <path d="M64 30 L67 56 L64 56 L60 32 Z" fill="#D8D2C2"/>
      {/* l wrist */}
      <circle cx="14" cy="58" r="3.5" fill={fill('lwrist')}/>
      {/* r wrist */}
      <circle cx="66" cy="58" r="3.5" fill={fill('rwrist')}/>
      {/* hands */}
      <ellipse cx="14" cy="63" rx="3" ry="4" fill="#D8D2C2"/>
      <ellipse cx="66" cy="63" rx="3" ry="4" fill="#D8D2C2"/>
      {/* hips */}
      <path d="M22 52 L24 60 L56 60 L58 52 Z" fill="#D8D2C2"/>
      {/* l thigh */}
      <path d="M26 60 L24 82 L32 82 L34 60 Z" fill="#D8D2C2"/>
      {/* r thigh */}
      <path d="M54 60 L56 82 L48 82 L46 60 Z" fill="#D8D2C2"/>
      {/* l knee */}
      <circle cx="28" cy="84" r="4" fill={fill('lknee')}/>
      {/* r knee */}
      <circle cx="52" cy="84" r="4" fill={fill('rknee')}/>
      {/* l shin */}
      <path d="M26 88 L25 106 L31 106 L32 88 Z" fill="#D8D2C2"/>
      {/* r shin */}
      <path d="M54 88 L55 106 L49 106 L48 88 Z" fill="#D8D2C2"/>
    </svg>
  );
}

// ── Spark / line chart ────────────────────────────────────────
function StrideLineChart({ data, w = 340, h = 140, accent = T.ink, fill = true, valueKey = 'kg' }) {
  if (!data || data.length === 0) return null;
  const vals = data.map(d => d[valueKey]);
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const pad = 12;
  const W = w - pad * 2;
  const H = h - pad * 2;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * W;
    const y = pad + (1 - (d[valueKey] - min) / (max - min)) * H;
    return [x, y];
  });
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const area = `${path} L${pts[pts.length-1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* horizontal grid */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={i} x1={pad} y1={pad + p * H} x2={w - pad} y2={pad + p * H} stroke={T.line} strokeDasharray="2 4"/>
      ))}
      {fill && (
        <path d={area} fill={accent} fillOpacity="0.08"/>
      )}
      <path d={path} stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2} fill={i === pts.length - 1 ? accent : T.surface} stroke={accent} strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

// ── Progress ring ─────────────────────────────────────────────
function ProgressRing({ value = 0, size = 64, stroke = 6, color = T.accent, track = T.lineSoft, children }) {
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .6s ease' }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 800 }}>{children}</div>
    </div>
  );
}

// ── Bottom nav (5 tabs) ───────────────────────────────────────
function StrideBottomNav({ tab, onTab, onMore }) {
  const items = [
    { id: 'home',     icon: 'home',   label: 'Today'   },
    { id: 'plan',     icon: 'cal',    label: 'Plan'    },
    { id: 'library',  icon: 'book',   label: 'Library' },
    { id: 'chat',     icon: 'chat',   label: 'AI'      },
    { id: 'profile',  icon: 'user',   label: 'You'     },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: T.surface,
      borderTop: `1px solid ${T.line}`,
      paddingTop: 8, paddingBottom: 24,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 30,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => onTab(it.id)}
            style={{
              border: 'none', background: 'none', padding: '6px 4px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: active ? T.ink : T.ink3, cursor: 'pointer',
              minWidth: 56,
            }}>
            <StrideIcon name={it.icon} size={24} strokeWidth={active ? 2.4 : 1.8} color={active ? T.ink : T.ink3}/>
            <span style={{
              fontSize: 10.5, fontWeight: active ? 800 : 600,
              letterSpacing: 0.4, textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif',
            }}>{it.label}</span>
            {active && <div style={{ position:'absolute', bottom: 18, width: 4, height: 4, borderRadius: 4, background: T.accent }}/>}
          </button>
        );
      })}
    </div>
  );
}

// ── Header with title + optional back / right action ──────────
function StrideHeader({ title, kicker, back, onBack, right, sticky = false }) {
  return (
    <div style={{
      padding: '8px 20px 14px',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
      background: T.bg,
      ...(sticky ? { position: 'sticky', top: 0, zIndex: 5 } : {}),
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {back && (
          <button onClick={onBack} style={{
            border: 'none', background: 'none', padding: 0, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 4, color: T.ink2, cursor: 'pointer',
            fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
          }}>
            <StrideIcon name="chevL" size={16}/> Back
          </button>
        )}
        {kicker && (
          <div style={{
            fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
            color: T.ink3, textTransform: 'uppercase', marginBottom: 4,
          }}>{kicker}</div>
        )}
        <h1 style={{
          margin: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 900,
          fontSize: 32, lineHeight: 1.0, letterSpacing: -1.2, color: T.ink,
        }}>{title}</h1>
      </div>
      {right && <div style={{ display: 'flex', gap: 8 }}>{right}</div>}
    </div>
  );
}

// ── Pill / chip ───────────────────────────────────────────────
function Chip({ children, color = T.ink, bg = T.lineSoft, ink = T.ink, dot, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px', borderRadius: 999,
      background: bg, color: ink,
      fontFamily: 'Inter', fontSize: 11, fontWeight: 700,
      letterSpacing: 0.4, textTransform: 'uppercase',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 6, background: color, display: 'inline-block' }}/>}
      {children}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────
function StrideButton({ children, onClick, variant = 'primary', size = 'md', icon, iconRight, block, style }) {
  const sizes = {
    sm: { padding: '8px 14px', font: 13, h: 36 },
    md: { padding: '14px 20px', font: 15, h: 52 },
    lg: { padding: '18px 24px', font: 17, h: 60 },
  };
  const variants = {
    primary: { background: T.ink, color: '#fff', border: 'none' },
    accent:  { background: T.accent, color: '#fff', border: 'none' },
    volt:    { background: T.volt, color: T.ink, border: 'none' },
    ghost:   { background: 'transparent', color: T.ink, border: `1.5px solid ${T.line}` },
    outline: { background: T.surface, color: T.ink, border: `1.5px solid ${T.ink}` },
  };
  const sz = sizes[size];
  return (
    <button onClick={onClick} style={{
      ...variants[variant], ...sz,
      width: block ? '100%' : 'auto',
      borderRadius: 14,
      fontFamily: 'Archivo, sans-serif', fontWeight: 800,
      fontSize: sz.font, letterSpacing: 0.3,
      textTransform: 'uppercase', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...style,
    }}>
      {icon && <StrideIcon name={icon} size={sz.font + 3}/>}
      {children}
      {iconRight && <StrideIcon name={iconRight} size={sz.font + 3}/>}
    </button>
  );
}

// ── Icon button ───────────────────────────────────────────────
function IconBtn({ icon, onClick, size = 40, bg = T.surface, color = T.ink, border = T.line }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: 12,
      background: bg, color, border: `1px solid ${border}`,
      display: 'grid', placeItems: 'center', cursor: 'pointer',
    }}>
      <StrideIcon name={icon} size={size * 0.5} color={color}/>
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────
function Card({ children, style, onClick, dark }) {
  return (
    <div onClick={onClick} style={{
      background: dark ? T.ink : T.surface,
      color: dark ? '#fff' : T.ink,
      borderRadius: 22,
      border: `1px solid ${dark ? '#1a1a1a' : T.line}`,
      padding: 18,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      {children}
    </div>
  );
}

// Safe-area top padding for status bars (iOS ~58px, Android ~40px).
// Set globally by StrideApp before mount.
window.STRIDE_SAFE_TOP = window.STRIDE_SAFE_TOP || 56;

// ── Screen container ──────────────────────────────────────────
function Screen({ children, padded = true, style }) {
  return (
    <div style={{
      background: T.bg,
      width: '100%', height: '100%',
      overflowY: 'auto', overflowX: 'hidden',
      position: 'relative',
      paddingTop: window.STRIDE_SAFE_TOP,
      paddingBottom: 100, // room for bottom nav
      ...(padded ? {} : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Format helpers ────────────────────────────────────────────
function formatRest(seconds) {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}:${String(s).padStart(2, '0')}` : `${m} min`;
}

// ── Display preferences (RPE / volume visibility) ─────────────
const STRIDE_PREF_DEFAULTS = { showRpe: true, showVolume: true };

function readStridePrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem('stride_display_prefs') || '{}');
    return { ...STRIDE_PREF_DEFAULTS, ...raw };
  } catch (e) { return { ...STRIDE_PREF_DEFAULTS }; }
}

function setStridePref(key, value) {
  const next = { ...readStridePrefs(), [key]: value };
  try { localStorage.setItem('stride_display_prefs', JSON.stringify(next)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('stride-prefs', { detail: next }));
}

function useStridePrefs() {
  const [prefs, setPrefs] = React.useState(readStridePrefs);
  React.useEffect(() => {
    const handler = (e) => setPrefs(e.detail || readStridePrefs());
    window.addEventListener('stride-prefs', handler);
    return () => window.removeEventListener('stride-prefs', handler);
  }, []);
  return prefs;
}

// ── Toggle switch ─────────────────────────────────────────────
function StrideToggle({ on, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      style={{
        width: 46, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
        padding: 3, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        background: on ? T.ink : T.line, transition: 'background 0.18s ease',
      }}>
      <span style={{
        width: 22, height: 22, borderRadius: 999, background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'all 0.18s ease',
      }}/>
    </button>
  );
}

// ── Workout spots store ───────────────────────────────────────
function readStrideSpots() {
  try {
    const raw = localStorage.getItem('stride_spots');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return (window.STRIDE_SPOTS_SEED || []).map((s) => ({ ...s, equipment: [...s.equipment] }));
}

function saveStrideSpots(spots) {
  try { localStorage.setItem('stride_spots', JSON.stringify(spots)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('stride-spots', { detail: spots }));
}

function useStrideSpots() {
  const [spots, setSpots] = React.useState(readStrideSpots);
  React.useEffect(() => {
    const handler = (e) => setSpots(e.detail || readStrideSpots());
    window.addEventListener('stride-spots', handler);
    return () => window.removeEventListener('stride-spots', handler);
  }, []);
  const update = (next) => { saveStrideSpots(next); setSpots(next); };
  return [spots, update];
}

function spotTypeMeta(typeId) {
  return (window.SPOT_TYPES || []).find((t) => t.id === typeId) || { label: 'Spot', icon: 'pin', color: '#8A8478' };
}

// ── Equipment catalog store (grouped, user-editable) ──────────
function readStrideEquipment() {
  try {
    const raw = localStorage.getItem('stride_equipment');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return (window.STRIDE_EQUIPMENT_GROUPS || []).map((g) => ({ group: g.group, items: [...g.items] }));
}

function saveStrideEquipment(groups) {
  try { localStorage.setItem('stride_equipment', JSON.stringify(groups)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('stride-equipment', { detail: groups }));
}

function useStrideEquipment() {
  const [groups, setGroups] = React.useState(readStrideEquipment);
  React.useEffect(() => {
    const handler = (e) => setGroups(e.detail || readStrideEquipment());
    window.addEventListener('stride-equipment', handler);
    return () => window.removeEventListener('stride-equipment', handler);
  }, []);
  const update = (next) => { saveStrideEquipment(next); setGroups(next); };
  return [groups, update];
}

// ── Global equipment preferences (like / avoid, applies everywhere) ──
function readEquipmentPrefs() {
  try {
    const raw = localStorage.getItem('stride_equipment_prefs');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function writeEquipmentPrefs(prefs) {
  try { localStorage.setItem('stride_equipment_prefs', JSON.stringify(prefs)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('stride-equip-prefs', { detail: prefs }));
}

function useEquipmentPrefs() {
  const [prefs, setPrefs] = React.useState(readEquipmentPrefs);
  React.useEffect(() => {
    const handler = (e) => setPrefs(e.detail || readEquipmentPrefs());
    window.addEventListener('stride-equip-prefs', handler);
    return () => window.removeEventListener('stride-equip-prefs', handler);
  }, []);
  // state: 'preferred' | 'avoid' | 'neutral' (neutral removes the key)
  const setPref = (item, state) => {
    const next = { ...readEquipmentPrefs() };
    if (state === 'neutral') delete next[item];
    else next[item] = state;
    writeEquipmentPrefs(next);
    setPrefs(next);
  };
  return [prefs, setPref];
}

// ── Catalog requests store (user → admin dashboard) ───────────
function readStrideRequests() {
  try {
    const raw = localStorage.getItem('stride_requests');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return (window.STRIDE_REQUESTS_SEED || []).map((r) => ({ ...r }));
}

function saveStrideRequests(list) {
  try { localStorage.setItem('stride_requests', JSON.stringify(list)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('stride-requests', { detail: list }));
}

function addStrideRequest({ kind, name, meta, note }) {
  const u = window.STRIDE_USER || {};
  const req = {
    id: `req-${Date.now()}`,
    kind, name: (name || '').trim(), meta: meta || '', note: (note || '').trim(),
    by: u.name || 'You', handle: u.handle || '@you',
    date: new Date().toISOString(), status: 'pending',
  };
  const next = [req, ...readStrideRequests()];
  saveStrideRequests(next);
  return req;
}

function setRequestStatus(id, status) {
  const next = readStrideRequests().map((r) => (r.id === id ? { ...r, status } : r));
  saveStrideRequests(next);
}

function useStrideRequests() {
  const [list, setList] = React.useState(readStrideRequests);
  React.useEffect(() => {
    const handler = (e) => setList(e.detail || readStrideRequests());
    window.addEventListener('stride-requests', handler);
    const onStorage = (e) => { if (e.key === 'stride_requests') setList(readStrideRequests()); };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('stride-requests', handler); window.removeEventListener('storage', onStorage); };
  }, []);
  return list;
}

Object.assign(window, {
  StrideIcon, BodySilhouette, StrideLineChart, ProgressRing,
  StrideBottomNav, StrideHeader, Chip, StrideButton, IconBtn, Card, Screen,
  StrideToggle, useStridePrefs, setStridePref, readStridePrefs,
  readStrideSpots, saveStrideSpots, useStrideSpots, spotTypeMeta,
  readStrideEquipment, saveStrideEquipment, useStrideEquipment,
  readEquipmentPrefs, useEquipmentPrefs,
  readStrideRequests, saveStrideRequests, addStrideRequest, setRequestStatus, useStrideRequests,
  formatRest,
});
