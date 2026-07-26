/*
 * Stride bootstrap bridge.
 *
 * Reuses the Claude-designed prototype components 1:1. This script:
 *   1. gates on a login (Bearer UserApiToken from the Laravel Stride API),
 *   2. fetches live data and maps it onto the prototype's window.STRIDE_* shapes,
 *   3. wires the AI coach (ChatScreen) to the real backend,
 *   4. compiles + boots the prototype jsx in order (data-live overrides the mock).
 */
(function () {
  var API = window.STRIDE_API_BASE || 'http://localhost:8100/api/stride';
  // The prototype now loads as one precompiled bundle (/proto/bundle.js); the
  // build order lives in vite.config.ts (PROTO_FILES). See bootProto() below.
  var token = localStorage.getItem('stride_token');
  // Display locale for dates/numbers; updated from the user's language at load.
  var LOCALE = (localStorage.getItem('stride_lang') === 'sk') ? 'sk-SK' : 'en-US';

  function api(path, opts) {
    opts = opts || {};
    var headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    Object.assign(headers, opts.headers || {});
    return fetch(API + path, Object.assign({}, opts, { headers: headers })).then(function (r) {
      return (r.status === 204 ? Promise.resolve(null) : r.json().catch(function () { return null; }))
        .then(function (body) {
          if (!r.ok) {
            var err = new Error((body && (body.error || body.message)) || ('HTTP ' + r.status));
            err.status = r.status; throw err;
          }
          return body;
        });
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
  }

  // Persist a profile preference change (e.g. language) to the backend. Exposed
  // for i18n.jsx's setStrideLanguage(); failures are non-fatal (logged only — the
  // next boot re-seeds from /auth/me).
  window.__stridePatchProfile = function (patch) {
    return api('/profile', { method: 'PATCH', body: JSON.stringify(patch) })
      .catch(function (e) { console.error('Stride: profile update failed.', e); });
  };

  // ---- per-user AI connection (BYOK wizard) ----------------------------------
  // Keep window.STRIDE_AI in sync so the settings row, wizard, and chat model
  // switcher all read one place; re-render screens after a change.
  function syncAi(res) {
    if (res && res.ai) {
      window.STRIDE_AI = res.ai;
      if (window.__STRIDE_LIVE) window.__STRIDE_LIVE.STRIDE_AI = res.ai;
      if (window.__strideRerender) window.__strideRerender();
    }
    return res;
  }
  window.__strideGetAIConnection = function () {
    return api('/ai/connection').then(syncAi);
  };
  window.__strideSaveAIConnection = function (payload) {
    // A failed validation returns HTTP 422 with { ok:false, ... }; surface it as
    // data (not a throw) so the wizard can show the provider's error message.
    return api('/ai/connection', { method: 'POST', body: JSON.stringify(payload) })
      .then(syncAi)
      .catch(function (e) { return { ok: false, error: (e && e.message) || 'Validation failed.' }; });
  };
  window.__strideTestAIConnection = function () {
    return api('/ai/connection/test', { method: 'POST' }).then(syncAi)
      .catch(function (e) { return { ok: false, error: (e && e.message) || 'Test failed.' }; });
  };
  window.__strideDisconnectAI = function () {
    return api('/ai/connection', { method: 'DELETE' }).then(syncAi);
  };
  window.__strideSetAIModel = function (model) {
    return api('/ai/connection/model', { method: 'PATCH', body: JSON.stringify({ model: model || null }) }).then(syncAi);
  };

  // Sign out: revoke the token server-side (best-effort), clear local session +
  // per-account UI flags, then reload back to the login gate.
  window.__strideLogout = function () {
    return api('/auth/logout', { method: 'POST' }).catch(function () {}).then(function () {
      try {
        ['stride_token', 'stride_lang', 'stride_just_onboarded', 'stride_plan_degraded', 'stride_today_done']
          .forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      token = null;
      location.reload();
    });
  };

  // TEST: reset the account to a blank pre-onboarding state on the server, then
  // log out — so the next sign-in starts the setup wizard from scratch.
  window.__strideResetApp = function () {
    return api('/profile/reset', { method: 'POST' })
      .then(function () { return window.__strideLogout(); })
      .catch(function (e) { console.error('Stride: reset failed.', e); alert('Reset failed — please try again.'); });
  };

  // ---- onboarding wizard helpers --------------------------------------------
  // Persist the collected setup (profile + goals + injuries + spots), then drive
  // the two-step AI plan flow (recommend options → generate the chosen one).
  window.__strideSubmitOnboarding = function (data) {
    data = data || {};
    var seq = data.profile
      ? api('/profile', { method: 'PATCH', body: JSON.stringify(data.profile) })
      : Promise.resolve();
    function post(path, items) {
      (items || []).forEach(function (body) {
        seq = seq.then(function () {
          return api(path, { method: 'POST', body: JSON.stringify(body) }).catch(function () {});
        });
      });
    }
    post('/goals', data.goals);
    post('/injuries', data.injuries);
    post('/spots', data.spots);
    post('/personal-records', data.prs);
    return seq;
  };
  window.__stridePlanRecommend = function (note, base, weeksRange) {
    return api('/plan/recommend', { method: 'POST', body: JSON.stringify({
      note: note || null,
      base: base || null,
      weeks_min: (weeksRange && weeksRange[0]) || null,
      weeks_max: (weeksRange && weeksRange[1]) || null,
    }) }).then(function (r) { return (r && r.options) || []; });
  };
  window.__stridePlanGenerate = function (option, startDate, note) {
    return api('/plan/generate', { method: 'POST', body: JSON.stringify({ option: option, start_date: startDate || null, note: note || null }) });
  };
  // Optional clarifying questions the coach asks before generating (missing PRs
  // the goals imply + general context). Returns [] on any failure so the step is
  // skippable and never blocks plan generation.
  window.__stridePlanQuestions = function (option, answered) {
    return api('/plan/questions', { method: 'POST', body: JSON.stringify({ option: option, answered: answered || [] }) })
      .then(function (r) { return (r && r.questions) || []; })
      .catch(function () { return []; });
  };
  window.__stridePlanAnswers = function (answers) {
    if (!answers || !answers.length) return Promise.resolve(null);
    return api('/plan/answers', { method: 'POST', body: JSON.stringify({ answers: answers }) })
      .catch(function () { return null; });
  };
  // Load a specific session (from the plan) into the workout player. Maps to the
  // same shape as STRIDE_TODAYS_WORKOUT and parks it on STRIDE_ACTIVE_WORKOUT so
  // the player runs the session you actually tapped (not just "today").
  // ---- personal records ------------------------------------------------------
  window.__strideLoadPrs = function () {
    return api('/personal-records').then(function (r) {
      window.STRIDE_PRS = (r && r.records) || [];
      return window.STRIDE_PRS;
    });
  };
  window.__strideSavePr = function (pr) {
    return api('/personal-records', { method: 'POST', body: JSON.stringify(pr) })
      .then(function (r) { return window.__strideLoadPrs().then(function () { return r && r.record; }); });
  };
  window.__strideDeletePr = function (id) {
    return api('/personal-records/' + id, { method: 'DELETE' }).then(function () { return window.__strideLoadPrs(); });
  };

  // ---- weight -----------------------------------------------------------------
  // Log a weigh-in (backend upserts one entry per day) and refresh the history
  // global in place so the chart updates without a full reload.
  window.__strideLogWeight = function (kg) {
    return api('/weight', { method: 'POST', body: JSON.stringify({ kg: kg }) })
      .then(function () { return api('/weight'); })
      .then(function (w) {
        var hist = (w.entries || []).map(function (e) { return { d: fmtDate(e.date), kg: e.kg }; });
        window.STRIDE_WEIGHT_HISTORY = hist;
        if (window.__STRIDE_LIVE) window.__STRIDE_LIVE.STRIDE_WEIGHT_HISTORY = hist;
        if (window.__strideRerender) window.__strideRerender();
        return hist;
      });
  };

  // ---- morning weigh-in reminder ----------------------------------------------
  // Daily local notification at 06:00 (id 601), toggleable from the Weight
  // screen. No-ops gracefully in a browser (plugin only exists on device).
  window.__strideWeighReminder = function (on) {
    try { localStorage.setItem('stride_weigh_reminder', on ? '1' : '0'); } catch (e) {}
    var LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
    if (!LN) return Promise.resolve({ ok: !on ? true : false, reason: 'unsupported' });
    if (!on) {
      return LN.cancel({ notifications: [{ id: 601 }] }).then(function () { return { ok: true }; });
    }
    return LN.requestPermissions().then(function (perm) {
      if (perm.display !== 'granted') return { ok: false, reason: 'denied' };
      return LN.schedule({
        notifications: [{
          id: 601,
          title: window.t ? window.t('Morning weigh-in') : 'Morning weigh-in',
          body: window.t ? window.t('Step on the scale and log it — it takes 10 seconds.') : 'Step on the scale and log it — it takes 10 seconds.',
          schedule: { on: { hour: 6, minute: 0 }, allowWhileIdle: true },
          // Tapping it deep-links straight to the Weight screen with the log sheet
          // open (see the localNotificationActionPerformed listener below).
          extra: { action: 'log-weight' },
        }],
      }).then(function () { return { ok: true }; });
    });
  };

  // ---- notification taps ------------------------------------------------------
  // Route a tapped notification into the app. The morning weigh-in reminder jumps
  // straight to the Weight screen with the "log weight" sheet already open. The
  // id 601 fallback keeps reminders scheduled before this payload existed working.
  // Handles both cold launch (the tap is buffered until this listener attaches, so
  // we stash a pending screen for app.jsx to consume on mount) and a running app.
  function strideHandleNotifTap(notification) {
    var n = notification || {};
    var extra = n.extra || {};
    if (extra.action === 'log-weight' || n.id === 601) {
      window.__strideOpenWeightLog = true;
      if (window.__strideGo) window.__strideGo('weight');
      else window.__stridePendingScreen = 'weight';
    }
  }
  (function registerNotifTaps() {
    var LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
    if (!LN || !LN.addListener) return;
    LN.addListener('localNotificationActionPerformed', function (event) {
      strideHandleNotifTap(event && event.notification);
    });
  })();

  // ---- coach pokes --------------------------------------------------------------
  // Context-aware motivational notifications: the backend writes 1-4 short texts
  // in the coach's persona voice (grounded in today's state / energy / streak);
  // we schedule them as LOCAL notifications (ids 611-614) at the returned times.
  // Refreshed on every app open + when the toggle flips. Browser: no-op.
  window.__strideSchedulePokes = function () {
    var LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
    var enabled = false;
    try { enabled = localStorage.getItem('stride_coach_pokes') === '1'; } catch (e) {}
    var cancelAll = function () {
      return LN ? LN.cancel({ notifications: [{ id: 611 }, { id: 612 }, { id: 613 }, { id: 614 }] }).catch(function () {}) : Promise.resolve();
    };
    if (!LN || !enabled) return cancelAll().then(function () { return { ok: !enabled, reason: LN ? undefined : 'unsupported' }; });

    var energy = null, done = null;
    try {
      var w = window.STRIDE_TODAYS_WORKOUT;
      done = (w && w.status === 'done') ? 1 : 0;
      var d = new Date();
      var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (localStorage.getItem('stride_today_done') === iso) done = 1;
      var en = localStorage.getItem('stride_checkin_' + iso);
      if (en) energy = parseInt(en, 10) || null;
    } catch (e) {}

    var q = [];
    if (energy != null) q.push('energy=' + energy);
    if (done != null) q.push('done=' + done);
    return LN.requestPermissions().then(function (perm) {
      if (perm.display !== 'granted') return { ok: false, reason: 'denied' };
      return api('/coach/pokes' + (q.length ? '?' + q.join('&') : '')).then(function (r) {
        var items = (r && r.items) || [];
        return cancelAll().then(function () {
          if (!items.length) return { ok: true, scheduled: 0 };
          var now = new Date();
          var notifications = items.slice(0, 4).map(function (item, i) {
            var hm = String(item.at || '12:00').split(':');
            var at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hm[0], 10) || 12, parseInt(hm[1], 10) || 0);
            if (at <= now) at.setDate(at.getDate() + 1); // past slot → same time tomorrow
            return { id: 611 + i, title: item.title, body: item.body, schedule: { at: at, allowWhileIdle: true } };
          });
          return LN.schedule({ notifications: notifications }).then(function () { return { ok: true, scheduled: notifications.length }; });
        });
      });
    }).catch(function (e) { console.error('Stride: poke scheduling failed.', e); return { ok: false, reason: 'error' }; });
  };

  window.__strideLoadSession = function (id) {
    return api('/sessions/' + id).then(function (r) {
      var s = r && r.session;
      if (!s) return null;
      window.STRIDE_ACTIVE_WORKOUT = {
        id: s.id, title: s.title, block: s.kind || '', kind: s.kind || '', durationMin: s.duration,
        volumeKg: s.volume || 0, rpe: s.rpe || 0, startedAt: s.started_at || null,
        exercises: (s.exercises || []).map(function (ex) {
          return {
            id: 'ex-' + ex.id, exerciseId: ex.id, name: ex.name, tag: ex.tag || '', note: ex.note || '',
            section: ex.section || 'working',
            metricType: ex.metric_type || 'load',
            metrics: ex.metrics || null,
            sets: (ex.sets || []).map(function (st) { return { id: st.id, kind: st.kind, reps: st.reps, kg: st.kg, band: st.band, rest: st.rest, done: !!st.is_done }; }),
          };
        }),
      };
      return window.STRIDE_ACTIVE_WORKOUT;
    });
  };

  // Record that a session started (status stays 'today', sets started_at). Idempotent
  // server-side. Fire-and-forget: never blocks or disrupts the workout on a hiccup.
  window.__strideStartSession = function (id) {
    if (id == null) return Promise.resolve(null);
    return api('/sessions/' + id + '/start', { method: 'POST', body: '{}' }).catch(function () { return null; });
  };

  // Save one set's result to the backend as it's completed (metric-keyed: reps /
  // seconds / weight_kg / band_kg). Fire-and-forget, NO global refresh — we don't
  // want to reload the plan mid-workout; the final 'complete' call refreshes.
  window.__strideLogSet = function (sessionId, setId, body) {
    if (sessionId == null || setId == null) return Promise.resolve(null);
    return api('/sessions/' + sessionId + '/sets/' + setId, { method: 'PATCH', body: JSON.stringify(body || {}) })
      .catch(function () { return null; });
  };

  // Mark a session complete on the backend (status → done, + optional rpe/notes) and
  // refresh the globals so Home / Plan stop showing the "start" card. Fire-and-forget
  // safe: resolves null when there's no real (backend) session id.
  window.__strideCompleteSession = function (id, body) {
    if (id == null) return Promise.resolve(null);
    return api('/sessions/' + id + '/complete', { method: 'POST', body: JSON.stringify(body || {}) })
      .then(function (res) {
        var refresh = window.__strideRefresh ? window.__strideRefresh() : Promise.resolve();
        return refresh.then(function () { return res && res.session; });
      })
      .catch(function () { return null; });
  };

  // Save the warm-up preference and restructure today's + upcoming sessions in place
  // (grouped ↔ per_exercise), then refresh the globals so Home / the plan / the active
  // player reflect the new structure immediately.
  window.__strideApplyWarmupStyle = function (style) {
    return api('/plan/warmup-style', { method: 'POST', body: JSON.stringify({ style: style }) })
      .then(function (res) {
        var refresh = window.__strideRefresh ? window.__strideRefresh() : Promise.resolve();
        return refresh.then(function () { return res; });
      });
  };

  // Manual session actions from the detail sheet: 'skip' (mark skipped now, with
  // an optional reason) and 'postpone' (push to tomorrow / revive a skipped one).
  // Refreshes the STRIDE_* globals afterwards so Home/Plan update everywhere.
  window.__strideSessionAction = function (id, action, body) {
    return api('/sessions/' + id + '/' + action, { method: 'POST', body: JSON.stringify(body || {}) })
      .then(function (res) {
        var refresh = window.__strideRefresh ? window.__strideRefresh() : Promise.resolve();
        return refresh.then(function () { return res; });
      });
  };

  // ---- map live API → prototype globals --------------------------------------
  function loadLive() {
    return Promise.all([
      api('/auth/me'), api('/home'), api('/goals'), api('/plan'),
      api('/injuries'), api('/weight'), api('/library'), api('/spots'),
      api('/coach/adjustments'),
    ]).then(function (res) {
      var me = res[0], home = res[1], goals = res[2], plan = res[3],
        injuries = res[4], weight = res[5], library = res[6], spots = res[7],
        adjustments = res[8];

      var activeBlock = (plan.blocks || []).find(function (b) { return b.status === 'active'; });
      var blockLabel = activeBlock
        ? activeBlock.name + ' · Week ' + activeBlock.week_of + ' of ' + activeBlock.weeks
        : '';

      var today = home.today;
      var STRIDE_TODAYS_WORKOUT = today ? {
        id: today.id, title: today.title, block: blockLabel, kind: today.kind || '', durationMin: today.duration,
        status: today.status, // 'done' = trained already; Home shows the done card
        startedAt: today.started_at || null, // set = the athlete already began it
        volumeKg: today.volume, rpe: today.rpe || 0,
        exercises: (today.exercises || []).map(function (ex) {
          return {
            id: 'ex-' + ex.id, exerciseId: ex.id, name: ex.name, tag: ex.tag || '', note: ex.note || '',
            section: ex.section || 'working',
            metricType: ex.metric_type || 'load',
            metrics: ex.metrics || null,
            sets: (ex.sets || []).map(function (s) {
              return { id: s.id, kind: s.kind, reps: s.reps, kg: s.kg, band: s.band, rest: s.rest, done: !!s.is_done };
            }),
          };
        }),
      } : null; // null = nothing scheduled today; HomeScreen shows its empty state

      var ICONS = { Push: 'dumbbell', Pull: 'dumbbell', Legs: 'flame', Rest: 'heart', Cardio: 'heart' };
      var STRIDE_WEEK_PLAN = (home.week || []).map(function (d) {
        return { id: d.id, day: d.day, date: d.date, scheduledDate: d.scheduled_date, kind: d.kind, title: d.title, status: d.status, volume: d.volume, duration: d.duration, rpe: d.rpe || null, skipReason: d.skip_reason || null };
      });
      // Whether a plan exists + the next upcoming session, so Home can show a
      // "rest day · next training in X days" state instead of "nothing planned".
      window.STRIDE_HAS_PLAN = !!home.has_plan;
      window.STRIDE_NEXT_SESSION = home.next_session ? {
        title: home.next_session.title, kind: home.next_session.kind,
        date: home.next_session.scheduled_date, inDays: home.next_session.in_days,
      } : null;
      var STRIDE_RECENT = (home.recent || []).map(function (r) {
        return {
          d: r.day, title: r.title, icon: ICONS[r.kind] || 'dumbbell',
          dur: (r.duration || 0) + ' min',
          vol: r.volume ? (Number(r.volume).toLocaleString(LOCALE) + ' kg') : null,
          rpe: r.rpe ? ('RPE ' + r.rpe) : null,
        };
      });
      // Coach activity log (Home/Plan ✦ button). Live, scoped adjustments — empty
      // for a fresh user (the prototype's STRIDE_AI_LOG was hardcoded demo data).
      function adjIcon(kind) {
        var k = (kind || '').toLowerCase();
        if (/lower|trim|cut|drop|reduce|back ?off/.test(k)) return 'arrowDown';
        if (/swap/.test(k)) return 'sliders';
        if (/add/.test(k)) return 'plus';
        if (/rest|recovery|deload/.test(k)) return 'leaf';
        if (/reschedul|move/.test(k)) return 'cal';
        if (/progress|raise|increase/.test(k)) return 'trend';
        if (/goal/.test(k)) return 'target';
        return 'sparkles';
      }
      var STRIDE_AI_LOG = (adjustments.adjustments || []).map(function (a) {
        return {
          scope: a.scope, icon: adjIcon(a.kind), kind: a.kind, target: a.target, text: a.text, why: a.why, when: a.when,
          // The thing that changed — the log row opens it (session sheet / block page).
          sessionId: a.session_id || null, blockId: a.block_id || null,
        };
      });
      var STRIDE_GOALS = (goals.goals || []).map(function (g) {
        return {
          id: 'g-' + g.id, title: g.title, cat: g.category || 'Goal', progress: g.progress,
          current: g.current || '', target: g.target || '', color: g.color || '#FF4D1F',
        };
      });
      var STRIDE_WEIGHT_HISTORY = (weight.entries || []).map(function (e) { return { d: fmtDate(e.date), kg: e.kg }; });
      var prof = (me.user && me.user.profile) || {};
      // Seed the UI/coach language from the profile BEFORE the proto boots, so the
      // first paint is already in the right language (no English flash).
      var lang = String(prof.language || 'en').toLowerCase();
      window.STRIDE_LANG = lang;
      LOCALE = lang === 'sk' ? 'sk-SK' : 'en-US';
      try { localStorage.setItem('stride_lang', lang); } catch (e) {}

      // New users (no completed setup) get the onboarding wizard on first paint.
      window.__strideNeedsOnboarding = !(me.user && me.user.onboarded);

      // Per-user AI connection + provider/model catalog (BYOK). Seeded here so the
      // settings row, wizard and in-chat model switcher render without a round-trip.
      window.STRIDE_AI = me.ai || { connection: { provider: 'free', auth_type: 'none', model: null, status: 'active' }, catalog: { providers: [] } };

      // Personal records (type-aware bests), surfaced for the Library + profile.
      window.STRIDE_PRS = prof.personal_records || [];

      // Setup / training preferences — surfaced so the You tab can show & edit them.
      window.__STRIDE_PROFILE = prof;   // raw profile bag, for the one-time device sync
      window.STRIDE_SETUP = {
        trainingStyle: prof.training_style || [],
        daysPerWeek: (prof.days_per_week != null ? prof.days_per_week : null),
        yearsTraining: (prof.years_training != null ? prof.years_training : null),
        warmupStyle: prof.warmup_style || 'per_exercise',
        bio: prof.bio || '',
        notes: prof.notes || '',
      };

      var u = me.user || {};
      var first = u.name ? u.name.split(' ')[0] : 'Athlete';
      var STRIDE_USER = {
        name: first,
        handle: '@' + ((u.email || 'you').split('@')[0]),
        joined: u.joined || '',
        height: prof.height_cm || 178,
        weightKg: (weight.current_kg != null ? weight.current_kg : prof.weight_kg) || 0,
        goalWeightKg: prof.goal_weight_kg || 0,
        bodyFat: prof.body_fat_pct || 0,
        streakDays: home.streak_days || 0,
        thisWeekSessions: (home.this_week && home.this_week.done) || 0,
        thisWeekTarget: (home.this_week && home.this_week.target) || 0,
        totalSessions: u.total_sessions || 0,
        totalHours: u.total_hours || 0,
      };

      var STRIDE_SPOTS_SEED = (spots.spots || []).map(function (s) {
        return {
          id: s.id, name: s.name, type: s.type, size: s.size, isDefault: s.isDefault,
          equipment: s.equipment || [], prompt: s.prompt || '', schedule: s.schedule || { type: 'default' }, notes: s.notes || '',
        };
      });

      window.__STRIDE_LIVE = {
        STRIDE_USER: STRIDE_USER,
        STRIDE_TODAYS_WORKOUT: STRIDE_TODAYS_WORKOUT,
        STRIDE_WEEK_PLAN: STRIDE_WEEK_PLAN,
        STRIDE_RECENT: STRIDE_RECENT,
        STRIDE_GOALS: STRIDE_GOALS,
        STRIDE_WEIGHT_HISTORY: STRIDE_WEIGHT_HISTORY,
        STRIDE_LIBRARY: buildLibrary((library.exercises) || []),
        // Flat, searchable catalogue for the PR picker (name → metric_type + id).
        STRIDE_EXERCISES: ((library.exercises) || []).map(function (e) {
          return { id: e.id, name: e.name, metricType: e.metric_type || 'load', equipment: e.equipment || '', category: e.category || '' };
        }),
        STRIDE_SPOTS_SEED: STRIDE_SPOTS_SEED,
        STRIDE_AI_LOG: STRIDE_AI_LOG,
        STRIDE_AI: window.STRIDE_AI,
      };

      // Fetch per-block detail (sessions/stats) and per-injury detail in parallel.
      var blockReqs = Promise.all((plan.blocks || []).map(function (b) { return api('/blocks/' + b.id); }));
      var injuryReqs = Promise.all((injuries.injuries || []).map(function (i) { return api('/injuries/' + i.id); }));

      return Promise.all([blockReqs, injuryReqs]).then(function (r) {
        window.__STRIDE_LIVE.STRIDE_BLOCKS = r[0].map(function (d) {
          var b = d.block;
          return {
            id: 'blk-' + b.id, rawId: b.id, name: b.name, phase: b.phase, status: b.status, weeks: b.weeks, weekOf: b.week_of,
            dates: fmtDate(b.starts_on) + ' – ' + fmtDate(b.ends_on), summary: b.summary || '', accent: b.accent || '#FF4D1F',
            stats: b.stats || [],
            createdAt: b.created_at || null,
            brief: b.brief || null, // what was asked for when this plan was generated
            createdOn: b.created_at ? fmtDate(b.created_at) : '',
            sessions: (b.sessions || []).map(function (s) {
              return { id: s.id, day: s.day, date: s.date, scheduledDate: s.scheduled_date, kind: s.kind, title: s.title, status: s.status, volume: s.volume, duration: s.duration, rpe: s.rpe || null, skipReason: s.skip_reason || null };
            }),
            // Applied coach edits (block change history) + still-pending proposals.
            changes: (b.changes || []).map(function (c) {
              return { id: c.id, icon: adjIcon(c.kind), kind: c.kind, target: c.target, text: c.text, why: c.why, when: c.when };
            }),
            pending: b.pending || [],
          };
        });
        window.__STRIDE_LIVE.STRIDE_INJURIES = r[1].map(function (d) {
          var i = d.injury;
          return {
            id: 'inj-' + i.id, bodyPart: i.body_part, label: i.label || '', severity: i.severity || 'Mild',
            status: i.status, since: fmtDate(i.since), note: i.note || '',
            avoid: i.avoid || [], safe: i.safe || [], aiChanges: [],
            journal: (i.journal || []).map(function (j) { return { date: fmtDate(j.date), trend: j.trend, text: j.text }; }),
          };
        });
      }).then(setupCoach);
    });
  }

  // Build the prototype's nested STRIDE_LIBRARY (root → category → group → exercises)
  // from the flat /library list.
  function buildLibrary(exercises) {
    function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
    function title(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
    // Display-only renames — the API keeps the raw category value (plan
    // generation, catalog gating and seeders all still key on it).
    var CATEGORY_LABELS = { strength: 'Gym' };
    var cats = {};
    exercises.forEach(function (e) {
      var cat = e.category || 'other', grp = e.group || 'General';
      cats[cat] = cats[cat] || {};
      cats[cat][grp] = cats[cat][grp] || [];
      cats[cat][grp].push({
        // `name` is localised for display; `nameEn` is the catalogue's canonical
        // English — use it whenever something is stored or sent to the coach.
        id: e.id, name: e.name, nameEn: e.name_en || e.name, diff: e.difficulty || '', equip: e.equipment || '',
        primary: (e.primary && e.primary[0]) || '', secondary: (e.secondary || []).join(' · '),
        metricType: e.metric_type || 'load',
        video: e.video_url || '', description: e.description || '', source: e.source_url || '',
      });
    });
    return {
      id: 'root', name: 'Library',
      children: Object.keys(cats).map(function (cat) {
        var children = Object.keys(cats[cat]).map(function (grp) {
          return { id: cat + '-' + slug(grp), name: grp, count: cats[cat][grp].length, exercises: cats[cat][grp] };
        });
        return {
          id: cat, name: CATEGORY_LABELS[cat] || title(cat),
          count: children.reduce(function (a, c) { return a + c.count; }, 0),
          children: children,
        };
      }),
    };
  }

  // ---- coach bridge (ChatScreen → real API) ----------------------------------
  function setupCoach() {
    var convId = null;
    var activeModel = null; // the active thread's per-conversation model override
    var blockConvIds = {}; // rawBlockId → conversation id (block-scoped chats)
    function ensureConv() {
      if (convId) return Promise.resolve(convId);
      return api('/coach/conversations').then(function (list) {
        // The AI tab's default thread is the most recent GENERAL conversation —
        // block-scoped ones belong to their block chat (openable via history).
        var general = (list.conversations || []).filter(function (c) { return !c.block_id; });
        if (general[0]) { convId = general[0].id; return convId; }
        return api('/coach/conversations', { method: 'POST', body: JSON.stringify({ persona_key: 'calm' }) })
          .then(function (r) { convId = r.conversation.id; return convId; });
      });
    }
    function adjToCards(adjs) {
      return (adjs || []).map(function (a) {
        return { kind: /injur/i.test(a.kind) ? 'injury' : 'session', title: a.text, subtitle: a.why || a.target || '' };
      });
    }
    // Coach edits are proposed → confirmed: a plan-edit (it has an `operation`)
    // renders as a ProposalCard (Apply/Dismiss when proposed, "Applied" once done);
    // everything else (e.g. an injury log) becomes a navigation card.
    function splitAdjustments(adjs) {
      var proposals = [], other = [];
      (adjs || []).forEach(function (a) { (a.operation ? proposals : other).push(a); });
      return { proposals: proposals, cards: adjToCards(other) };
    }
    function toMessage(role, content, adjustments) {
      var split = splitAdjustments(adjustments);
      return { who: role === 'user' ? 'me' : 'ai', text: content, proposals: split.proposals, cards: split.cards };
    }
    window.__strideCoach = {
      send: function (text) {
        return ensureConv().then(function (id) {
          var body = { message: text };
          if (activeModel) body.model = activeModel; // honour the in-chat model switcher
          return api('/coach/conversations/' + id + '/messages', { method: 'POST', body: JSON.stringify(body) });
        }).then(function (res) {
          var m = res.message;
          return toMessage('assistant', m.content, m.adjustments);
        });
      },
      // In-chat model switcher: the current thread's model (null = connection default).
      getModel: function () { return activeModel; },
      setModel: function (model) {
        activeModel = model || null;
        return ensureConv().then(function (id) {
          return api('/coach/conversations/' + id + '/model', { method: 'PATCH', body: JSON.stringify({ model: model || null }) });
        }).then(function (res) { return res.conversation; });
      },
      applyProposal: function (id) {
        return api('/coach/proposals/' + id + '/apply', { method: 'POST' }).then(function (res) {
          if (window.__strideRefresh) window.__strideRefresh(); // refresh affected screens in the background
          // Mid-workout apply: if the change hit the session being played, pull
          // its fresh copy so the player updates in place (no restart).
          window.__strideRefreshActiveWorkout(res && res.session_ids);
          return res;
        });
      },
      dismissProposal: function (id) {
        return api('/coach/proposals/' + id + '/dismiss', { method: 'POST' });
      },
      // Bulk confirm/dismiss: sequential (each apply mutates the plan), one
      // screen refresh at the end. Returns per-id outcomes so cards can settle.
      applyProposals: function (ids) {
        var outcome = { applied: [], failed: [] };
        return ids.reduce(function (chain, id) {
          return chain.then(function () {
            return api('/coach/proposals/' + id + '/apply', { method: 'POST' })
              .then(function () { outcome.applied.push(id); })
              .catch(function (e) { outcome.failed.push({ id: id, status: e.status }); });
          });
        }, Promise.resolve()).then(function () {
          if (outcome.applied.length && window.__strideRefresh) window.__strideRefresh();
          if (outcome.applied.length) window.__strideRefreshActiveWorkout(null);
          return outcome;
        });
      },
      dismissProposals: function (ids) {
        var outcome = { dismissed: [], failed: [] };
        return ids.reduce(function (chain, id) {
          return chain.then(function () {
            return api('/coach/proposals/' + id + '/dismiss', { method: 'POST' })
              .then(function () { outcome.dismissed.push(id); })
              .catch(function (e) { outcome.failed.push({ id: id, status: e.status }); });
          });
        }, Promise.resolve()).then(function () { return outcome; });
      },
      // Conversation history for the AI tab: list every thread (general + per
      // block), open one (it becomes the active thread send() posts into),
      // start a fresh one, or delete one.
      listConversations: function () {
        return api('/coach/conversations').then(function (r) { return r.conversations || []; });
      },
      activeConversationId: function () { return convId; },
      openConversation: function (id) {
        return api('/coach/conversations/' + id).then(function (res) {
          convId = res.conversation.id;
          activeModel = res.conversation.model || null;
          if (res.conversation.block_id) blockConvIds[res.conversation.block_id] = res.conversation.id;
          return {
            conversation: res.conversation,
            messages: (res.conversation.messages || []).map(function (m) { return toMessage(m.role, m.content, m.adjustments); }),
          };
        });
      },
      newConversation: function () {
        return api('/coach/conversations', { method: 'POST', body: JSON.stringify({}) })
          .then(function (r) { convId = r.conversation.id; activeModel = null; return r.conversation; });
      },
      deleteConversation: function (id) {
        return api('/coach/conversations/' + id, { method: 'DELETE' }).then(function () {
          if (convId === id) convId = null;
          Object.keys(blockConvIds).forEach(function (k) { if (blockConvIds[k] === id) delete blockConvIds[k]; });
        });
      },
      // Block-scoped chat: a conversation per block that edits the WHOLE block.
      loadBlockChat: function (blockId) {
        return api('/coach/blocks/' + blockId + '/conversation').then(function (res) {
          blockConvIds[blockId] = res.conversation.id;
          var msgs = (res.conversation.messages || []).map(function (m) { return toMessage(m.role, m.content, m.adjustments); });
          return { convId: res.conversation.id, messages: msgs };
        });
      },
      sendToBlock: function (blockId, text) {
        var idP = blockConvIds[blockId]
          ? Promise.resolve(blockConvIds[blockId])
          : api('/coach/blocks/' + blockId + '/conversation').then(function (res) { blockConvIds[blockId] = res.conversation.id; return res.conversation.id; });
        return idP.then(function (id) {
          return api('/coach/conversations/' + id + '/messages', { method: 'POST', body: JSON.stringify({ message: text }) });
        }).then(function (res) { return toMessage('assistant', res.message.content, res.message.adjustments); });
      },
    };
    // Seed the chat with existing history (or a greeting). Pending proposals in the
    // history come back actionable, so they survive a reload.
    return ensureConv()
      .then(function (id) { return api('/coach/conversations/' + id); })
      .then(function (res) {
        activeModel = res.conversation.model || null;
        var msgs = (res.conversation.messages || []).map(function (m) { return toMessage(m.role, m.content, m.adjustments); });
        window.__STRIDE_LIVE.STRIDE_CHAT_SEED = msgs.length ? msgs
          : [{ who: 'ai', text: "Morning. I'm your coach — ask me to adjust today's session (go lighter, swap a lift, add a set) or flag a niggle and I'll program around it." }];
      })
      .catch(function () { /* keep mock chat seed on failure */ });
  }


  // ---- one-time sync of device-only data --------------------------------------
  // Several things used to be written to localStorage and never sent anywhere:
  // injuries and spots edited after onboarding, library favourites/hidden,
  // equipment prefs, requests, daily check-ins and the notification toggles. This
  // pushes whatever is on THIS device up to the account, once, so a reinstall or a
  // second phone can't lose it. Merges only — nothing on the server is deleted.
  function readLocal(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function localCheckins() {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var m = k && k.match(/^stride_checkin_(\d{4}-\d{2}-\d{2})$/);
        if (!m) continue;
        var energy = parseInt(localStorage.getItem(k), 10);
        out.push({
          date: m[1],
          energy: isNaN(energy) ? null : energy,
          note: localStorage.getItem('stride_checkin_note_' + m[1]) || null,
        });
      }
    } catch (e) {}
    return out;
  }

  window.__strideSyncLocalData = function () {
    if (!token) return Promise.resolve({ skipped: 'no session' });
    try { if (localStorage.getItem('stride_synced_v1') === '1') return Promise.resolve({ skipped: 'already synced' }); } catch (e) {}

    var summary = { injuries: 0, spots: 0, checkins: 0, prefs: false };

    return Promise.all([
      api('/injuries').catch(function () { return null; }),
      api('/spots').catch(function () { return null; }),
    ]).then(function (server) {
      // A missing list means we could not verify what's already there — skip that
      // collection rather than risk duplicating it.
      var pushes = [];

    // --- injuries: create the ones the server doesn't have (local ids are
    // client-generated, so match on body part + label instead).
    var localInjuries = server[0] ? (readLocal('stride-injuries', []) || []) : [];
    var serverInjuries = ((server[0] && server[0].injuries) || []).map(function (i) {
      return String((i.body_part || '') + '|' + (i.label || '')).toLowerCase();
    });
    localInjuries.forEach(function (inj) {
      var key = String((inj.bodyPart || '') + '|' + (inj.label || '')).toLowerCase();
      if (key === '|' || serverInjuries.indexOf(key) !== -1) return;
      var body = {
        body_part: inj.bodyPart, label: inj.label || null, severity: inj.severity || null,
        status: inj.status || null, note: inj.note || null,
        avoid: inj.avoid || [], safe: inj.safe || [],
      };
      // `since` is usually a localised display string ("12. máj"); only an
      // already-ISO value is trustworthy (Date.parse turns "May 12" into 2001).
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(inj.since || ''))) body.since = inj.since;
      pushes.push(api('/injuries', { method: 'POST', body: JSON.stringify(body) }).then(function (res) {
        summary.injuries++;
        var id = res && res.injury && String(res.injury.id).replace('inj-', '');
        var journal = (inj.journal || []).slice().reverse();   // oldest first
        return journal.reduce(function (chain, entry) {
          return chain.then(function () {
            return api('/injuries/' + id + '/journal', {
              method: 'POST',
              body: JSON.stringify({ text: entry.text, trend: entry.trend || 'same' }),
            }).catch(function () {});
          });
        }, Promise.resolve());
      }));
    });

    // --- spots: same idea, matched on name. Photos are inline data URLs with no
    // upload endpoint, so they stay on the device.
    var localSpots = server[1] ? readLocal('stride_spots', null) : null;
    var serverSpots = ((server[1] && server[1].spots) || []).map(function (s) { return String(s.name || '').toLowerCase(); });
    (localSpots || []).forEach(function (spot) {
      var name = String(spot.name || '').toLowerCase();
      if (!name || serverSpots.indexOf(name) !== -1) return;
      pushes.push(api('/spots', { method: 'POST', body: JSON.stringify({
        name: spot.name, type: spot.type || 'gym', size: spot.size || null,
        prompt: spot.prompt || null, notes: spot.notes || null, equipment: spot.equipment || [],
      }) }).then(function () { summary.spots++; }));
    });

    // --- daily check-ins: the endpoint upserts per day, so repeats are harmless.
    localCheckins().forEach(function (c) {
      pushes.push(api('/checkins', { method: 'POST', body: JSON.stringify(c) })
        .then(function () { summary.checkins++; }));
    });

    // --- the preference-shaped state, in one patch. Union with what the server
    // already has so a second device can't wipe the first one's list.
    var prof = (window.__STRIDE_PROFILE || {});
    var union = function (a, b) {
      var seen = {}, out = [];
      (a || []).concat(b || []).forEach(function (v) { if (v != null && !seen[v]) { seen[v] = 1; out.push(v); } });
      return out;
    };
    var patch = {
      favorites: union(prof.favorites, readLocal('stride-favs', [])),
      hidden_exercises: union(prof.hidden_exercises, readLocal('stride-hidden', [])),
      equipment_prefs: Object.assign({}, prof.equipment_prefs || {}, readLocal('stride_equipment_prefs', {}) || {}),
      requests: (readLocal('stride_requests', []) || []).concat(prof.requests || []),
      display_prefs: Object.assign({}, prof.display_prefs || {}, readLocal('stride_display_prefs', {}) || {}),
    };
    try {
      if (localStorage.getItem('stride_weigh_reminder') !== null) patch.weigh_reminder = localStorage.getItem('stride_weigh_reminder') === '1';
      if (localStorage.getItem('stride_coach_pokes') !== null) patch.coach_pokes = localStorage.getItem('stride_coach_pokes') === '1';
      if (localStorage.getItem('stride_auto_rest') !== null) patch.auto_rest = localStorage.getItem('stride_auto_rest') === '1';
      var personality = localStorage.getItem('stride_coach_personality');
      if (personality) patch.notes = (prof.notes ? prof.notes + '\n' : '') + personality;
    } catch (e) {}
    pushes.push(api('/profile', { method: 'PATCH', body: JSON.stringify(patch) })
      .then(function () { summary.prefs = true; }));

      return Promise.all(pushes).then(function () {
        // Only mark it done once everything landed — a failure retries next launch.
        try { localStorage.setItem('stride_synced_v1', '1'); } catch (e) {}
        console.info('Stride: synced device data to the account.', summary);
        return summary;
      });
    }).catch(function (e) {
      console.error('Stride: device sync failed, will retry on next launch.', e);
      return { failed: true };
    });
  };

  // Re-pull live data into the STRIDE_* globals and re-render — used after a coach
  // change is applied so Home/Plan/blocks reflect it without a full page reload.
  window.__strideRefresh = function () {
    return loadLive().then(function () {
      if (window.__STRIDE_LIVE) Object.assign(window, window.__STRIDE_LIVE);
      if (window.__strideRerender) window.__strideRerender();
    }).catch(function () {});
  };

  // ---- refresh on foreground --------------------------------------------------
  // Capacitor keeps the WebView alive across backgrounding, so the STRIDE_* globals
  // loaded at boot can go stale — most visibly, yesterday's finished session lingers
  // as "today" and Home keeps cheering "CRUSHED IT" on what is now a rest day. Re-pull
  // /home whenever the app returns to the foreground so the day rolls over. Throttled
  // so rapid sheet/tab visibility flips don't hammer the API; no-ops on the login gate.
  var strideLastForegroundRefresh = 0;
  document.addEventListener('visibilitychange', function () {
    if (!token || document.visibilityState !== 'visible') return;
    var now = Date.now();
    if (now - strideLastForegroundRefresh < 30000) return;
    strideLastForegroundRefresh = now;
    if (window.__strideRefresh) window.__strideRefresh();
  });

  // Refetch ONLY the session currently in the workout player and swap it into
  // STRIDE_ACTIVE_WORKOUT in place, so mid-workout coach edits show up on the
  // next render without restarting the session. `sessionIds` (from an apply
  // response) limits the refetch to when the played session was actually touched;
  // pass null to refresh unconditionally.
  window.__strideRefreshActiveWorkout = function (sessionIds) {
    var w = window.STRIDE_ACTIVE_WORKOUT || window.STRIDE_TODAYS_WORKOUT;
    if (!w || !w.id) return Promise.resolve(null);
    if (sessionIds && sessionIds.length && sessionIds.indexOf(w.id) === -1) return Promise.resolve(null);
    return window.__strideLoadSession(w.id).then(function (fresh) {
      if (fresh && window.STRIDE_TODAYS_WORKOUT && window.STRIDE_TODAYS_WORKOUT.id === fresh.id) {
        window.STRIDE_TODAYS_WORKOUT = fresh; // keep Home consistent too
      }
      if (window.__strideRerender) window.__strideRerender();
      return fresh;
    }).catch(function () { return null; });
  };

  // ---- boot the prototype -----------------------------------------------------
  // Load the single precompiled bundle (all proto/*.jsx concatenated in order and
  // JSX-transformed at build time — see vite.config.ts's strideProto plugin). It's
  // one classic script, so cross-file globals + execution order behave 1:1 with the
  // old runtime-Babel path, minus the on-device transpile + CDN.
  function bootProto() {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = '/proto/bundle.js';
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load /proto/bundle.js')); };
      document.body.appendChild(s);
    });
  }

  function boot() {
    return loadLive().catch(function (e) {
      if (e && (e.status === 401 || e.status === 403)) {
        localStorage.removeItem('stride_token'); token = null;
        showLoginGate(e.status === 403 ? (e.message || 'Stride access is not enabled for this account.') : 'Your session expired — please sign in again.');
        throw e;
      }
      console.error('Stride: live data failed, booting with mock data.', e);
    }).then(function () {
      // Push anything that only exists on this device before the UI can write
      // over it (best-effort: never blocks the app from starting).
      return window.__strideSyncLocalData ? window.__strideSyncLocalData().catch(function () {}) : null;
    }).then(function () {
      var login = document.getElementById('stride-login');
      if (login) login.remove();
      return bootProto();
    }).then(function () {
      // Refresh today's coach pokes with current context (no-op if disabled/browser).
      if (window.__strideSchedulePokes) window.__strideSchedulePokes();
    }).catch(function () { /* 401 handled in showLogin */ });
  }

  // ---- login screen ----------------------------------------------------------
  // The login gate renders before /auth/me (so no profile language yet). Guess the
  // language from the last session (localStorage mirror) or the browser, default EN.
  function loginLang() {
    try { var s = localStorage.getItem('stride_lang'); if (s) return s.toLowerCase(); } catch (e) {}
    return (navigator.language || 'en').toLowerCase().indexOf('sk') === 0 ? 'sk' : 'en';
  }
  var LOGIN_SK = {
    'Your AI training companion.': 'Tvoj AI tréningový spoločník.',
    'Email': 'E-mail',
    'Password': 'Heslo',
    'Sign in': 'Prihlásiť sa',
    'Signing in…': 'Prihlasujem…',
    'Could not sign in.': 'Nepodarilo sa prihlásiť.',
    'Your session expired — please sign in again.': 'Tvoja relácia vypršala — prihlás sa znova.',
    'The provided credentials are incorrect.': 'Zadané údaje sú nesprávne.',
    'Stride access is not enabled for this account.': 'Stride prístup nie je pre tento účet povolený.',
    'Sign in to Stride': 'Prihlásenie do Stride',
    'Unlock with Face ID': 'Odomknúť cez Face ID',
    'Sign in with Face ID next time': 'Nabudúce sa prihlásiť cez Face ID',
  };
  function lt(s) { return (loginLang() === 'sk' && LOGIN_SK[s]) || s; }

  // ---- Face ID / biometric unlock -------------------------------------------
  // @aparajita/capacitor-biometric-auth, called through the raw plugin bridge
  // (this file is not bundled, so window.Capacitor.Plugins is the API surface).
  // The Bearer token stays the session credential — biometrics only gate the
  // app unlocking it, so the backend needs nothing new. LABiometryType: 1 =
  // Touch ID, 2 = Face ID.
  var Bio = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BiometricAuthNative) || null;

  function bioEnabled() { try { return localStorage.getItem('stride_bio') === '1'; } catch (e) { return false; } }
  function bioTypeLabel(b) { return (b && b.biometryType === 1) ? 'Touch ID' : 'Face ID'; }
  function checkBiometry() {
    if (!Bio) return Promise.resolve(null);
    return Bio.checkBiometry().then(function (b) { return (b && b.isAvailable) ? b : null; })
      .catch(function () { return null; });
  }
  function bioAuthenticate(label) {
    return Bio.internalAuthenticate({
      reason: lt('Sign in to Stride').replace('Face ID', label),
      allowDeviceCredential: true,
    });
  }

  function showLogin(message, bio) {
    var label = bioTypeLabel(bio);
    var canUnlock = !!(bio && token && bioEnabled());
    var root = document.getElementById('stride-login') || document.createElement('div');
    root.id = 'stride-login';
    root.innerHTML = ''
      + '<div class="lg-wrap"><form class="lg-card" id="lg-form">'
      + '<div class="lg-brand">Stride</div>'
      + '<div class="lg-sub">' + lt('Your AI training companion.') + '</div>'
      + (message ? '<div class="lg-msg">' + lt(message) + '</div>' : '')
      + (canUnlock ? '<button class="lg-btn" id="lg-bio" type="button" style="margin-bottom:14px">' + lt('Unlock with Face ID').replace('Face ID', label) + '</button>' : '')
      + '<label class="lg-label">' + lt('Email') + '</label>'
      + '<input class="lg-input" id="lg-email" type="email" autocapitalize="none" value="michal.cecko@gmail.com"/>'
      + '<label class="lg-label">' + lt('Password') + '</label>'
      + '<input class="lg-input" id="lg-pass" type="password" value=""/>'
      + (bio ? '<label style="display:flex;gap:8px;align-items:center;margin:10px 0 2px;font-size:13px;opacity:.85"><input type="checkbox" id="lg-bio-enable"' + (localStorage.getItem('stride_bio') === '0' ? '' : ' checked') + '/>' + lt('Sign in with Face ID next time').replace('Face ID', label) + '</label>' : '')
      + '<div class="lg-err" id="lg-err"></div>'
      + '<button class="lg-btn" id="lg-go" type="submit">' + lt('Sign in') + '</button>'
      + '</form></div>';
    if (!root.parentNode) document.body.appendChild(root);

    if (canUnlock) {
      document.getElementById('lg-bio').addEventListener('click', function () {
        bioAuthenticate(label).then(boot).catch(function () { /* stay on the login gate */ });
      });
    }

    document.getElementById('lg-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('lg-go');
      var err = document.getElementById('lg-err');
      btn.disabled = true; btn.textContent = lt('Signing in…'); err.textContent = '';
      api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('lg-email').value,
          password: document.getElementById('lg-pass').value,
          device_name: 'Stride Web',
        }),
      }).then(function (res) {
        token = res.token; localStorage.setItem('stride_token', token);
        var enable = document.getElementById('lg-bio-enable');
        if (enable) { try { localStorage.setItem('stride_bio', enable.checked ? '1' : '0'); } catch (e2) {} }
        boot();
      }).catch(function (ex) {
        btn.disabled = false; btn.textContent = lt('Sign in');
        err.textContent = lt(ex.message || 'Could not sign in.');
      });
    });
  }

  function showLoginGate(message) {
    checkBiometry().then(function (bio) { showLogin(message, bio); });
  }

  // ---- entry -----------------------------------------------------------------
  // With Face ID enabled, a stored session boots only after the owner verifies;
  // cancelling lands on the login gate, which still offers the unlock button.
  if (token && bioEnabled() && Bio) {
    checkBiometry().then(function (bio) {
      if (!bio) { boot(); return; }
      bioAuthenticate(bioTypeLabel(bio)).then(boot).catch(function () { showLogin(null, bio); });
    });
  } else if (token) {
    boot();
  } else {
    showLoginGate();
  }
})();
