// AI CONNECT — the "bring your own model" wizard (You → AI model).
//
// Lets the user connect their own provider + model (Anthropic / Gemini / OpenAI)
// via an API key. No connection = the app's free tier. Reads window.STRIDE_AI
// (connection + catalog, seeded by bridge.js) and drives the backend through the
// __stride*AIConnection helpers. (Anthropic banned subscription-OAuth for
// third-party apps, so BYOK is API-key only.)

function AIProviderIcon(key) {
  return key === 'free' ? 'bolt' : 'sparkles';
}

function AIKeyHelp(provider) {
  const t = window.t;
  switch (provider) {
    case 'anthropic': return t('Create a key at console.anthropic.com → API Keys.');
    case 'gemini': return t('Create a free key at aistudio.google.com → Get API key.');
    case 'openai': return t('Create a key at platform.openai.com → API keys.');
    default: return '';
  }
}

function AIModelPicker({ models, selected, onPick }) {
  const T = window.STRIDE_THEME;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(models || []).map(function (m) {
        const active = selected === m.id;
        return (
          <button key={m.id} onClick={() => onPick(m.id)} style={{
            textAlign: 'left', cursor: 'pointer', border: `1.5px solid ${active ? T.ink : T.line}`,
            background: active ? T.ink : T.surface, color: active ? '#fff' : T.ink,
            borderRadius: 14, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 15 }}>{m.label}</div>
              {m.tier && <div style={{ fontFamily: 'Inter', fontSize: 11, opacity: active ? 0.7 : 0.55, marginTop: 2, textTransform: 'capitalize' }}>{window.t(m.tier)}</div>}
            </div>
            {active && <StrideIcon name="check" size={18} color={T.volt}/>}
          </button>
        );
      })}
    </div>
  );
}

function AIConnectScreen({ go }) {
  const T = window.STRIDE_THEME;
  const t = window.t;
  const ai = window.STRIDE_AI || {};
  const catalog = ai.catalog || { providers: [] };
  const conn = ai.connection || { provider: 'free' };
  const providers = catalog.providers || [];

  const [phase, setPhase] = React.useState('provider'); // provider|credential|model|saving|done|error
  const [provider, setProvider] = React.useState(null);
  const [apiKey, setApiKey] = React.useState('');
  const [model, setModel] = React.useState(null);
  const [error, setError] = React.useState(null);

  const providerCfg = providers.find(function (p) { return p.key === provider; }) || null;

  function pickProvider(key) {
    setError(null);
    if (key === 'free') {
      setPhase('saving');
      window.__strideSaveAIConnection({ provider: 'free', auth_type: 'none' })
        .then(function () { setProvider('free'); setPhase('done'); });
      return;
    }
    setProvider(key);
    setModel(null);
    setApiKey('');
    setPhase('credential');
  }

  function saveConnection() {
    setPhase('saving');
    window.__strideSaveAIConnection({ provider: provider, auth_type: 'api_key', api_key: apiKey.trim(), model: model })
      .then(function (res) {
        if (res && res.ok === false) { setError(res.error || t('That key did not work.')); setPhase('error'); }
        else { setPhase('done'); }
      });
  }

  const header = (
    <StrideHeader title={t('AI model')} kicker={t('Bring your own')} back
      onBack={() => (phase === 'provider' ? go('profile') : setPhase('provider'))}/>
  );

  return (
    <Screen>
      {header}
      <div style={{ padding: '0 20px 40px' }}>

        {phase === 'provider' && (
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 14, color: T.ink3, lineHeight: 1.5, marginBottom: 16 }}>
              {t('Connect your own AI account so the coach runs on your model — or stay on the free built-in one.')}
            </div>
            {conn.provider && conn.provider !== 'free' && (
              <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: T.lineSoft, fontFamily: 'Inter', fontSize: 12.5, color: T.ink2 }}>
                {t('Connected')}: <strong>{conn.provider}</strong>{conn.model ? ' · ' + conn.model : ''} · {t(conn.status)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {providers.map(function (p) {
                return (
                  <ChoiceCard key={p.key} active={false} onClick={() => pickProvider(p.key)}
                    icon={AIProviderIcon(p.key)} title={p.label}
                    sub={p.key === 'free' ? t('No setup · limited daily use') : ((p.models || []).length + ' ' + t('models'))}/>
                );
              })}
            </div>
            {conn.provider && conn.provider !== 'free' && (
              <button onClick={() => { window.__strideDisconnectAI(); go('profile'); }} style={{
                marginTop: 16, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'Inter', fontSize: 13, color: T.ink3, textDecoration: 'underline',
              }}>{t('Disconnect and use the free model')}</button>
            )}
          </div>
        )}

        {phase === 'credential' && (
          <div>
            <h2 style={{ margin: '4px 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: T.ink }}>{t('Enter your API key')}</h2>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: T.ink3, lineHeight: 1.5, marginBottom: 16 }}>{AIKeyHelp(provider)}</div>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              placeholder={provider === 'gemini' ? 'AIza…' : 'sk-…'} style={{
                width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14,
                border: `1.5px solid ${T.line}`, background: T.surface, color: T.ink,
                fontFamily: 'Inter', fontSize: 15, outline: 'none',
              }}/>
            <div style={{ marginTop: 18 }}>
              <StrideButton variant="primary" block onClick={() => setPhase('model')} style={apiKey.trim() ? {} : { opacity: 0.5, pointerEvents: 'none' }}>
                {t('Continue')}
              </StrideButton>
            </div>
          </div>
        )}

        {phase === 'model' && (
          <div>
            <h2 style={{ margin: '4px 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: T.ink }}>{t('Pick a model')}</h2>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: T.ink3, lineHeight: 1.5, marginBottom: 16 }}>
              {t('Stronger models cost more per message but reason better.')}
            </div>
            <AIModelPicker models={providerCfg ? providerCfg.models : []} selected={model} onPick={setModel}/>
            <div style={{ marginTop: 18 }}>
              <StrideButton variant="primary" block onClick={saveConnection} style={model ? {} : { opacity: 0.5, pointerEvents: 'none' }}>
                {t('Connect & verify')}
              </StrideButton>
            </div>
          </div>
        )}

        {phase === 'saving' && (
          <div style={{ textAlign: 'center', paddingTop: 50 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 18, color: T.ink }}>{t('Checking your model…')}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: T.ink3, marginTop: 8 }}>{t('Sending a quick test message.')}</div>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <StrideIcon name="info" size={38} color="#dc2626"/>
            <h2 style={{ margin: '14px 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 20, color: T.ink }}>{t('That didn\'t work')}</h2>
            <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: T.ink3, lineHeight: 1.5, marginBottom: 22, wordBreak: 'break-word' }}>{error}</div>
            <StrideButton variant="primary" block onClick={() => setPhase('credential')}>{t('Try again')}</StrideButton>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <StrideIcon name="check" size={42} color="#16a34a"/>
            <h2 style={{ margin: '14px 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 22, color: T.ink }}>{t('All set')}</h2>
            <div style={{ fontFamily: 'Inter', fontSize: 14, color: T.ink3, lineHeight: 1.5, marginBottom: 24 }}>
              {provider === 'free'
                ? t('You\'re on the free built-in model.')
                : t('Your coach now runs on your {p} model.', { p: (providerCfg && providerCfg.label) || provider })}
            </div>
            <StrideButton variant="primary" block onClick={() => go('profile')}>{t('Done')}</StrideButton>
          </div>
        )}
      </div>
    </Screen>
  );
}
