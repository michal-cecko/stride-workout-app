// App root — routing, persona state, screen orchestration.

function StrideApp({ frame }) {
  // Set safe-area top padding based on device frame
  window.STRIDE_SAFE_TOP = frame === 'android' ? 40 : 56;

  // Read tweaks from URL or use defaults
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "initialScreen": "home",
    "personaKey": "calm"
  }/*EDITMODE-END*/;

  const t = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : { tweaks: TWEAK_DEFAULTS, setTweak: () => {} };

  const [screen, setScreen] = React.useState(t.tweaks.initialScreen || 'home');
  const [activeMode, setActiveMode] = React.useState('timer');
  const [persona, setPersona] = React.useState({
    key: t.tweaks.personaKey,
    ...window.STRIDE_AI_PERSONAS[t.tweaks.personaKey],
  });

  // Persist persona to tweaks
  const handlePersona = (p) => {
    setPersona(p);
    t.setTweak && t.setTweak('personaKey', p.key);
  };
  const go = (s) => {
    setScreen(s);
    t.setTweak && t.setTweak('initialScreen', s);
  };

  window.STRIDE_CURRENT_PERSONA = persona;

  // Map "profile" tab to actual profile-stack root
  const activeTab = ['home','plan','library','chat','profile'].includes(screen) ? screen
    : screen === 'weight' || screen === 'goals' || screen === 'injuries' || screen === 'injury-detail' || screen === 'ai-coach' || screen === 'spots' ? 'profile'
    : null;

  const showBottomNav = ['home','plan','library','chat','profile','weight','goals','injuries','injury-detail','ai-coach','spots'].includes(screen);

  let content = null;
  switch (screen) {
    case 'home':      content = <HomeScreen go={go} persona={persona}/>; break;
    case 'plan':      content = <PlanScreen go={go} persona={persona}/>; break;
    case 'library':   content = <LibraryScreen go={go}/>; break;
    case 'chat':      content = <ChatScreen go={go} persona={persona}/>; break;
    case 'profile':   content = <ProfileScreen go={go} persona={persona} setPersona={handlePersona}/>; break;
    case 'weight':    content = <WeightScreen go={go}/>; break;
    case 'goals':     content = <GoalsScreen go={go}/>; break;
    case 'injuries':  content = <InjuriesScreen go={go}/>; break;
    case 'injury-detail': content = <InjuryDetailScreen go={go}/>; break;
    case 'ai-coach':  content = <AICoachScreen go={go} persona={persona} setPersona={handlePersona}/>; break;
    case 'spots':     content = <SpotsScreen go={go}/>; break;
    case 'generate':  content = <GenerateScreen go={go} persona={persona}/>; break;
    case 'active-config': content = <ActiveConfigScreen go={go} setActiveMode={setActiveMode}/>; break;
    case 'active':    content = <ActiveWorkoutScreen go={go} mode={activeMode}/>; break;
    case 'summary':   content = <SummaryScreen go={go}/>; break;
    default:          content = <HomeScreen go={go} persona={persona}/>;
  }

  // Status bar darkness depends on screen
  const darkStatus = screen === 'active';

  // Device frame
  const isAndroid = frame === 'android';
  const Device = isAndroid ? window.AndroidDevice : window.IOSDevice;
  const width = isAndroid ? 412 : 402;
  const height = isAndroid ? 892 : 874;

  return (
    <Device width={width} height={height} dark={darkStatus}>
      <div style={{ width: '100%', height: '100%', position: 'relative', background: window.STRIDE_THEME.bg }}>
        {content}
        {showBottomNav && (
          <StrideBottomNav tab={activeTab} onTab={go}/>
        )}
      </div>
    </Device>
  );
}

// ── Main render ─────────────────────────────────────────────────
function StrideRoot() {
  // Frame tweak via host
  const [frame, setFrame] = React.useState('ios');
  const [accent, setAccent] = React.useState('#FF4D1F');
  const [showTweaks, setShowTweaks] = React.useState(false);

  // Custom tweaks panel (since we want frame switcher)
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // Apply accent override globally
  React.useEffect(() => {
    window.STRIDE_THEME.accent = accent;
  }, [accent]);

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 0',
      gap: 40, flexWrap: 'wrap',
    }}>
      <StrideApp frame={frame} key={`${frame}-${accent}`}/>

      {showTweaks && (
        <CustomTweaks
          frame={frame} setFrame={setFrame}
          accent={accent} setAccent={setAccent}
          onClose={() => {
            setShowTweaks(false);
            window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
          }}
        />
      )}
    </div>
  );
}

// Custom tweaks panel
function CustomTweaks({ frame, setFrame, accent, setAccent, onClose }) {
  const accents = [
    { v: '#FF4D1F', label: 'Strava' },
    { v: '#0A0A0A', label: 'Ink' },
    { v: '#D8FF3A', label: 'Volt' },
    { v: '#2563EB', label: 'Blue' },
  ];
  return (
    <div style={{
      position: 'fixed', right: 18, top: 18, width: 260, zIndex: 100,
      background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
      padding: 16, fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}>Tweaks</span>
        <button onClick={onClose} style={{ border: 'none', background: '#f4f1ea', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Device</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ios', 'android'].map(f => (
            <button key={f} onClick={() => setFrame(f)} style={{
              flex: 1, padding: '8px', borderRadius: 10,
              background: frame === f ? '#0a0a0a' : '#f4f1ea',
              color: frame === f ? '#fff' : '#0a0a0a',
              border: 'none', cursor: 'pointer',
              fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 12, textTransform: 'uppercase',
            }}>{f === 'ios' ? 'iOS' : 'Android'}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Accent</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {accents.map(a => (
            <button key={a.v} onClick={() => setAccent(a.v)} title={a.label} style={{
              flex: 1, height: 32, borderRadius: 10,
              background: a.v, border: accent === a.v ? '3px solid #fff' : '1px solid #e5e1d6',
              outline: accent === a.v ? '2px solid #0a0a0a' : 'none',
              cursor: 'pointer',
            }}/>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, padding: 10, background: '#f4f1ea', borderRadius: 10, fontSize: 11, color: '#666', lineHeight: 1.4 }}>
        Switch device frame and the brand accent color. Persona is in <strong>You → AI coach personality</strong>.
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<StrideRoot/>);
