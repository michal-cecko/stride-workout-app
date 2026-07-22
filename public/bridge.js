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
  window.__stridePlanRecommend = function (note, base) {
    return api('/plan/recommend', { method: 'POST', body: JSON.stringify({ note: note || null, base: base || null }) })
      .then(function (r) { return (r && r.options) || []; });
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

  window.__strideLoadSession = function (id) {
    return api('/sessions/' + id).then(function (r) {
      var s = r && r.session;
      if (!s) return null;
      window.STRIDE_ACTIVE_WORKOUT = {
        title: s.title, block: s.kind || '', durationMin: s.duration,
        volumeKg: s.volume || 0, rpe: s.rpe || 0,
        exercises: (s.exercises || []).map(function (ex) {
          return {
            id: 'ex-' + ex.id, name: ex.name, tag: ex.tag || '', note: ex.note || '',
            sets: (ex.sets || []).map(function (st) { return { kind: st.kind, reps: st.reps, kg: st.kg, rest: st.rest }; }),
          };
        }),
      };
      return window.STRIDE_ACTIVE_WORKOUT;
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
        title: today.title, block: blockLabel, durationMin: today.duration,
        volumeKg: today.volume, rpe: today.rpe || 0,
        exercises: (today.exercises || []).map(function (ex) {
          return {
            id: 'ex-' + ex.id, name: ex.name, tag: ex.tag || '', note: ex.note || '',
            sets: (ex.sets || []).map(function (s) {
              return { kind: s.kind, reps: s.reps, kg: s.kg, rest: s.rest };
            }),
          };
        }),
      } : null; // null = nothing scheduled today; HomeScreen shows its empty state

      var ICONS = { Push: 'dumbbell', Pull: 'dumbbell', Legs: 'flame', Rest: 'heart', Cardio: 'heart' };
      var STRIDE_WEEK_PLAN = (home.week || []).map(function (d) {
        return { id: d.id, day: d.day, date: d.date, kind: d.kind, title: d.title, status: d.status, volume: d.volume, duration: d.duration };
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
        return { scope: a.scope, icon: adjIcon(a.kind), kind: a.kind, target: a.target, text: a.text, why: a.why, when: a.when };
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

      // Personal records (type-aware bests), surfaced for the Library + profile.
      window.STRIDE_PRS = prof.personal_records || [];

      // Setup / training preferences — surfaced so the You tab can show & edit them.
      window.STRIDE_SETUP = {
        trainingStyle: prof.training_style || [],
        daysPerWeek: (prof.days_per_week != null ? prof.days_per_week : null),
        yearsTraining: (prof.years_training != null ? prof.years_training : null),
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
              return { id: s.id, day: s.day, date: s.date, kind: s.kind, title: s.title, status: s.status, volume: s.volume, duration: s.duration };
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
    var cats = {};
    exercises.forEach(function (e) {
      var cat = e.category || 'other', grp = e.group || 'General';
      cats[cat] = cats[cat] || {};
      cats[cat][grp] = cats[cat][grp] || [];
      cats[cat][grp].push({
        id: e.id, name: e.name, diff: e.difficulty || '', equip: e.equipment || '',
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
          id: cat, name: title(cat),
          count: children.reduce(function (a, c) { return a + c.count; }, 0),
          children: children,
        };
      }),
    };
  }

  // ---- coach bridge (ChatScreen → real API) ----------------------------------
  function setupCoach() {
    var convId = null;
    var blockConvIds = {}; // rawBlockId → conversation id (block-scoped chats)
    function ensureConv() {
      if (convId) return Promise.resolve(convId);
      return api('/coach/conversations').then(function (list) {
        if (list.conversations && list.conversations[0]) { convId = list.conversations[0].id; return convId; }
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
          return api('/coach/conversations/' + id + '/messages', { method: 'POST', body: JSON.stringify({ message: text }) });
        }).then(function (res) {
          var m = res.message;
          return toMessage('assistant', m.content, m.adjustments);
        });
      },
      applyProposal: function (id) {
        return api('/coach/proposals/' + id + '/apply', { method: 'POST' }).then(function (res) {
          if (window.__strideRefresh) window.__strideRefresh(); // refresh affected screens in the background
          return res;
        });
      },
      dismissProposal: function (id) {
        return api('/coach/proposals/' + id + '/dismiss', { method: 'POST' });
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
        var msgs = (res.conversation.messages || []).map(function (m) { return toMessage(m.role, m.content, m.adjustments); });
        window.__STRIDE_LIVE.STRIDE_CHAT_SEED = msgs.length ? msgs
          : [{ who: 'ai', text: "Morning. I'm your coach — ask me to adjust today's session (go lighter, swap a lift, add a set) or flag a niggle and I'll program around it." }];
      })
      .catch(function () { /* keep mock chat seed on failure */ });
  }

  // Re-pull live data into the STRIDE_* globals and re-render — used after a coach
  // change is applied so Home/Plan/blocks reflect it without a full page reload.
  window.__strideRefresh = function () {
    return loadLive().then(function () {
      if (window.__STRIDE_LIVE) Object.assign(window, window.__STRIDE_LIVE);
      if (window.__strideRerender) window.__strideRerender();
    }).catch(function () {});
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
      if (e && e.status === 401) { localStorage.removeItem('stride_token'); token = null; showLogin('Your session expired — please sign in again.'); throw e; }
      console.error('Stride: live data failed, booting with mock data.', e);
    }).then(function () {
      var login = document.getElementById('stride-login');
      if (login) login.remove();
      return bootProto();
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
  };
  function lt(s) { return (loginLang() === 'sk' && LOGIN_SK[s]) || s; }

  function showLogin(message) {
    var root = document.getElementById('stride-login') || document.createElement('div');
    root.id = 'stride-login';
    root.innerHTML = ''
      + '<div class="lg-wrap"><form class="lg-card" id="lg-form">'
      + '<div class="lg-brand">Stride</div>'
      + '<div class="lg-sub">' + lt('Your AI training companion.') + '</div>'
      + (message ? '<div class="lg-msg">' + lt(message) + '</div>' : '')
      + '<label class="lg-label">' + lt('Email') + '</label>'
      + '<input class="lg-input" id="lg-email" type="email" autocapitalize="none" value="michal.cecko@gmail.com"/>'
      + '<label class="lg-label">' + lt('Password') + '</label>'
      + '<input class="lg-input" id="lg-pass" type="password" value=""/>'
      + '<div class="lg-err" id="lg-err"></div>'
      + '<button class="lg-btn" id="lg-go" type="submit">' + lt('Sign in') + '</button>'
      + '</form></div>';
    if (!root.parentNode) document.body.appendChild(root);

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
        boot();
      }).catch(function (ex) {
        btn.disabled = false; btn.textContent = lt('Sign in');
        err.textContent = lt(ex.message || 'Could not sign in.');
      });
    });
  }

  // ---- entry -----------------------------------------------------------------
  if (token) boot(); else showLogin();
})();
