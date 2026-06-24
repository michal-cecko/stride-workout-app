// Mock data + theme tokens for Stride workout app.

const STRIDE_THEME = {
  bg: '#F4F1EA',
  surface: '#FFFFFF',
  ink: '#0A0A0A',
  ink2: '#3A3A3A',
  ink3: '#8A8478',
  line: '#E5E1D6',
  lineSoft: '#EFEBE0',
  accent: '#FF4D1F',       // Strava-ish coral/orange
  accentInk: '#FFFFFF',
  volt: '#D8FF3A',         // limey highlighter for "today/active"
  voltInk: '#0A0A0A',
  blue: '#2563EB',
  green: '#16A34A',
  amber: '#F59E0B',
  rose: '#E11D48',
};

// ── User profile ──────────────────────────────────────────────
const STRIDE_USER = {
  name: 'Alex',
  handle: '@alex.r',
  joined: 'Jan 2024',
  height: 178, // cm
  weightKg: 78.4,
  goalWeightKg: 75,
  bodyFat: 14.8,
  streakDays: 23,
  thisWeekSessions: 4,
  thisWeekTarget: 5,
  totalSessions: 312,
  totalHours: 268,
};

// ── Weight history (last 12 weeks, weekly avg) ────────────────
const STRIDE_WEIGHT_HISTORY = [
  { d: 'Mar 04', kg: 82.1 },
  { d: 'Mar 11', kg: 81.6 },
  { d: 'Mar 18', kg: 81.3 },
  { d: 'Mar 25', kg: 80.7 },
  { d: 'Apr 01', kg: 80.4 },
  { d: 'Apr 08', kg: 80.0 },
  { d: 'Apr 15', kg: 79.5 },
  { d: 'Apr 22', kg: 79.4 },
  { d: 'Apr 29', kg: 79.0 },
  { d: 'May 06', kg: 78.7 },
  { d: 'May 13', kg: 78.5 },
  { d: 'May 20', kg: 78.4 },
];

// ── Today's workout ───────────────────────────────────────────
const STRIDE_TODAYS_WORKOUT = {
  title: 'Push — Strength A',
  block: 'Hypertrophy block · Week 3 of 6',
  durationMin: 62,
  volumeKg: 6420,
  rpe: 7.5,
  exercises: [
    {
      id: 'ex-bench',
      name: 'Barbell Bench Press',
      tag: 'Compound',
      sets: [
        { kind: 'Warm-up', reps: 10, kg: 40, rest: 60 },
        { kind: 'Warm-up', reps: 6,  kg: 60, rest: 90 },
        { kind: 'Working', reps: 6,  kg: 82.5, rest: 150 },
        { kind: 'Working', reps: 6,  kg: 82.5, rest: 150 },
        { kind: 'Working', reps: 5,  kg: 82.5, rest: 180 },
      ],
      note: 'Pause 1s on chest. Elbows ~60°.',
      videoCue: '4-1-1 tempo',
    },
    {
      id: 'ex-ohp',
      name: 'Seated DB Shoulder Press',
      tag: 'Compound',
      sets: [
        { kind: 'Working', reps: 10, kg: 22, rest: 90 },
        { kind: 'Working', reps: 10, kg: 22, rest: 90 },
        { kind: 'Working', reps: 8,  kg: 24, rest: 120 },
      ],
      note: 'Neutral grip. Full ROM.',
    },
    {
      id: 'ex-dip',
      name: 'Weighted Dips',
      tag: 'Compound',
      sets: [
        { kind: 'Working', reps: 8, kg: 15, rest: 120 },
        { kind: 'Working', reps: 8, kg: 15, rest: 120 },
        { kind: 'AMRAP',   reps: 0, kg: 0,  rest: 0   },
      ],
      note: 'Lean forward 15°. Stop at parallel.',
    },
    {
      id: 'ex-fly',
      name: 'Cable Fly — High to Low',
      tag: 'Isolation',
      sets: [
        { kind: 'Working', reps: 12, kg: 14, rest: 60 },
        { kind: 'Working', reps: 12, kg: 14, rest: 60 },
        { kind: 'Working', reps: 12, kg: 14, rest: 60 },
      ],
      note: '2s squeeze at bottom.',
    },
    {
      id: 'ex-tri',
      name: 'Tricep Rope Pushdown',
      tag: 'Isolation',
      sets: [
        { kind: 'Working', reps: 12, kg: 22, rest: 45 },
        { kind: 'Working', reps: 12, kg: 22, rest: 45 },
        { kind: 'Drop',    reps: 20, kg: 22, rest: 60 },
      ],
      note: 'Spread the rope at the bottom.',
    },
  ],
};

// ── Weekly plan ───────────────────────────────────────────────
const STRIDE_WEEK_PLAN = [
  { day: 'Mon', date: 18, kind: 'Pull',  title: 'Pull — Strength A',   status: 'done',   volume: 5840, duration: 58, result: 'good' },
  { day: 'Tue', date: 19, kind: 'Legs',  title: 'Lower — Squat focus', status: 'skipped', volume: 0, duration: 0, skipReason: 'Knee felt tight', mood: 'Cautious', skipNote: 'Right knee was achy warming up after Monday’s pulls. Called it before the first working set rather than grind through it. Bit frustrated to break the streak, but it was the smart call — felt fine by evening.' },
  { day: 'Wed', date: 20, kind: 'Rest',  title: 'Mobility · 20 min',   status: 'done',   volume: 0,    duration: 22 },
  { day: 'Thu', date: 21, kind: 'Push',  title: 'Push — Strength A',   status: 'today',  volume: 0,    duration: 62, adjustments: [
    { text: 'Bench press', note: '85 kg × 5  →  82.5 kg × 6' },
    { text: 'Barbell dips', note: 'removed → neutral-grip DB press' },
    { text: 'Warm-up', note: 'added band pull-apart' },
  ] },
  { day: 'Fri', date: 22, kind: 'Pull',  title: 'Pull — Hypertrophy',  status: 'planned',volume: 0,    duration: 65, adjustments: [
    { text: 'Volume', note: 'trimmed 5 lifts → 4' },
  ] },
  { day: 'Sat', date: 23, kind: 'Legs',  title: 'Lower — Deadlift',    status: 'planned',volume: 0,    duration: 75 },
  { day: 'Sun', date: 24, kind: 'Rest',  title: 'Active recovery',     status: 'planned',volume: 0,    duration: 30 },
];

// ── Trainer adjustments to this week's plan ───────────────────
const STRIDE_PLAN_CHANGES = [
  { icon: 'arrowDown', kind: 'Lowered intensity', day: 'Thu', text: 'Dropped bench to 82.5 kg × 6', why: 'Last week’s top set hit RPE 9 — backing off to protect bar speed.' },
  { icon: 'sliders',   kind: 'Swapped',           day: 'Thu', text: 'Barbell dips → neutral-grip DB press', why: 'Protecting the right shoulder you flagged on Apr 12.' },
  { icon: 'leaf',      kind: 'Added rest',        day: 'Sun', text: 'Kept Sunday as active recovery', why: 'Weekly fatigue is trending high — banking a deload day after the missed Tuesday.' },
  { icon: 'minus',     kind: 'Trimmed volume',    day: 'Fri', text: 'Cut Friday Pull from 5 lifts to 4', why: 'Keeping total weekly volume inside your target range.' },
];

// ── AI activity log — scoped by context (today / week / block) ─
// `scope` controls which view surfaces the entry:
//   today  → Home (today's training)
//   week   → Plan (this week)
//   block  → Plan (this training block)
const STRIDE_AI_LOG = [
  { scope: 'today', icon: 'arrowDown', kind: 'Lowered intensity', target: 'Today · Push', text: 'Dropped bench to 82.5 kg × 6', why: 'Last week’s top set hit RPE 9 — backing off to protect bar speed.', when: 'Today · 6:40 AM' },
  { scope: 'today', icon: 'sliders',   kind: 'Swapped',           target: 'Today · Push', text: 'Barbell dips → neutral-grip DB press', why: 'Protecting the right shoulder you flagged on Apr 12.', when: 'Today · 6:40 AM' },
  { scope: 'today', icon: 'plus',      kind: 'Added',             target: 'Today · Push', text: 'Added band pull-apart to the warm-up', why: 'Priming the shoulder before you press.', when: 'Today · 6:40 AM' },
  { scope: 'week',  icon: 'leaf',      kind: 'Added rest',        target: 'Sun', text: 'Kept Sunday as active recovery', why: 'Weekly fatigue is trending high — banking a deload day after the missed Tuesday.', when: 'Mon · 7:10 AM' },
  { scope: 'week',  icon: 'minus',     kind: 'Trimmed volume',    target: 'Fri · Pull', text: 'Cut Friday Pull from 5 lifts to 4', why: 'Keeping total weekly volume inside your target range.', when: 'Mon · 7:10 AM' },
  { scope: 'week',  icon: 'cal',       kind: 'Rescheduled',       target: 'Tue → Wed', text: 'Moved the missed squat session to Wednesday', why: 'You logged knee tightness on Tuesday.', when: 'Tue · 9:02 PM' },
  { scope: 'block', icon: 'trend',     kind: 'Progression',       target: 'Block · Week 3', text: 'Raised top-set targets +2.5 kg across compounds', why: 'Bar speed held above threshold two weeks running.', when: 'Apr 28' },
  { scope: 'block', icon: 'target',    kind: 'Goal alignment',    target: 'Block · Bench 100 kg', text: 'Shifted emphasis toward heavy triples', why: 'You’re 72% to your 100 kg × 5 goal — time to bias strength.', when: 'Apr 28' },
];

// ── Training blocks (mesocycles) — past / active / upcoming ────
// Each block carries its own session list + scoped AI change log.
const STRIDE_BLOCKS = [
  {
    id: 'blk-found',
    name: 'Foundations',
    phase: 'Anatomical adaptation',
    status: 'done',
    weeks: 5,
    dates: 'Feb 10 – Mar 16',
    summary: 'Re-grooved technique and built work capacity after time off.',
    accent: '#7A8AA0',
    stats: [
      { label: 'Adherence', value: '92%' },
      { label: 'Sessions', value: '23' },
      { label: 'Volume Δ', value: '+18%' },
      { label: 'Focus', value: 'Form' },
    ],
    sessions: [
      { day: 'Mon', date: 10, kind: 'Push', title: 'Push — Foundations', status: 'done', volume: 4120, duration: 52 },
      { day: 'Wed', date: 12, kind: 'Pull', title: 'Pull — Foundations', status: 'done', volume: 4360, duration: 54 },
      { day: 'Fri', date: 14, kind: 'Legs', title: 'Lower — Technique', status: 'done', volume: 5210, duration: 58 },
    ],
    changes: [
      { icon: 'sliders', kind: 'Swapped', target: 'Wk 2 · Legs', text: 'Goblet squat → back squat once depth was clean', why: 'Your mobility check cleared full depth.', when: 'Feb 24' },
      { icon: 'trend',   kind: 'Progression', target: 'Wk 4', text: 'Bumped all main lifts +5%', why: 'RPE held below 7 for two weeks straight.', when: 'Mar 03' },
    ],
  },
  {
    id: 'blk-base',
    name: 'Base Hypertrophy',
    phase: 'Accumulation',
    status: 'done',
    weeks: 5,
    dates: 'Mar 17 – Apr 27',
    summary: 'High-volume accumulation to drive muscle growth before strength work.',
    accent: '#5B8A72',
    stats: [
      { label: 'Adherence', value: '88%' },
      { label: 'Sessions', value: '24' },
      { label: 'Volume Δ', value: '+22%' },
      { label: 'Top sets', value: 'RPE 8' },
    ],
    sessions: [
      { day: 'Mon', date: 21, kind: 'Push', title: 'Push — Hypertrophy', status: 'done', volume: 5880, duration: 64 },
      { day: 'Tue', date: 22, kind: 'Pull', title: 'Pull — Hypertrophy', status: 'done', volume: 6010, duration: 66 },
      { day: 'Thu', date: 24, kind: 'Legs', title: 'Lower — Volume', status: 'done', volume: 7220, duration: 72 },
      { day: 'Fri', date: 25, kind: 'Push', title: 'Push — Pump', status: 'skipped', volume: 0, duration: 0, skipReason: 'Work travel' },
    ],
    changes: [
      { icon: 'plus',  kind: 'Added',           target: 'Wk 2', text: 'Added a 4th weekly session', why: 'Recovery markers said you could absorb more volume.', when: 'Mar 24' },
      { icon: 'leaf',  kind: 'Added rest',      target: 'Wk 5', text: 'Inserted a mid-block deload', why: 'Joint achiness was creeping up across pressing days.', when: 'Apr 14' },
      { icon: 'minus', kind: 'Trimmed volume',  target: 'Wk 4 · Pull', text: 'Cut one row variation', why: 'Lower-back fatigue from deadlift carryover.', when: 'Apr 07' },
    ],
  },
  {
    id: 'blk-current',
    name: 'Hypertrophy → Strength',
    phase: 'Transmutation',
    status: 'active',
    weeks: 6,
    weekOf: 3,
    dates: 'Apr 28 – Jun 09',
    summary: 'Converting the volume base into heavier, lower-rep strength work.',
    accent: '#FF4D1F',
    stats: [
      { label: 'Weekly volume', value: '+8.4%' },
      { label: 'Top sets RPE', value: '7→9' },
      { label: 'Frequency', value: '5 / wk' },
      { label: 'Deload', value: 'Wk 6' },
    ],
    sessions: [
      { day: 'Mon', date: 18, kind: 'Pull',  title: 'Pull — Strength A',   status: 'done',    volume: 5840, duration: 58 },
      { day: 'Tue', date: 19, kind: 'Legs',  title: 'Lower — Squat focus', status: 'skipped', volume: 0, duration: 0, skipReason: 'Knee felt tight' },
      { day: 'Wed', date: 20, kind: 'Rest',  title: 'Mobility · 20 min',   status: 'done',    volume: 0, duration: 22 },
      { day: 'Thu', date: 21, kind: 'Push',  title: 'Push — Strength A',   status: 'today',   volume: 0, duration: 62 },
      { day: 'Fri', date: 22, kind: 'Pull',  title: 'Pull — Hypertrophy',  status: 'planned', volume: 0, duration: 65 },
      { day: 'Sat', date: 23, kind: 'Legs',  title: 'Lower — Deadlift',    status: 'planned', volume: 0, duration: 75 },
    ],
    changes: [
      { icon: 'trend',  kind: 'Progression',   target: 'Wk 3', text: 'Raised top-set targets +2.5 kg across compounds', why: 'Bar speed held above threshold two weeks running.', when: 'May 12' },
      { icon: 'target', kind: 'Goal alignment', target: 'Bench 100 kg', text: 'Shifted emphasis toward heavy triples', why: 'You’re 72% to your 100 kg × 5 goal — time to bias strength.', when: 'Apr 28' },
      { icon: 'arrowDown', kind: 'Lowered intensity', target: 'Thu · Push', text: 'Dropped bench to 82.5 kg × 6', why: 'Last week’s top set hit RPE 9 — protecting bar speed.', when: 'May 19' },
    ],
  },
  {
    id: 'blk-peak',
    name: 'Peak Strength',
    phase: 'Intensification',
    status: 'upcoming',
    weeks: 4,
    dates: 'Jun 10 – Jul 07',
    summary: 'Low volume, high intensity — sharpening for max attempts.',
    accent: '#C0922A',
    stats: [
      { label: 'Intensity', value: '90%+' },
      { label: 'Frequency', value: '4 / wk' },
      { label: 'Volume', value: 'Low' },
      { label: 'Goal', value: 'Bench PR' },
    ],
    sessions: [
      { day: 'Mon', date: 10, kind: 'Push', title: 'Heavy Bench', status: 'planned', volume: 0, duration: 55 },
      { day: 'Wed', date: 12, kind: 'Legs', title: 'Heavy Squat', status: 'planned', volume: 0, duration: 60 },
      { day: 'Fri', date: 14, kind: 'Pull', title: 'Heavy Pulls', status: 'planned', volume: 0, duration: 55 },
    ],
    changes: [],
  },
  {
    id: 'blk-test',
    name: 'Test Week',
    phase: 'Realization',
    status: 'upcoming',
    weeks: 1,
    dates: 'Jul 08 – Jul 14',
    summary: 'Fresh after a taper — attempt new 1-rep maxes.',
    accent: '#3A6FB0',
    stats: [
      { label: 'Format', value: 'Singles' },
      { label: 'Sessions', value: '3' },
      { label: 'Taper', value: 'Yes' },
      { label: 'Goal', value: 'PRs' },
    ],
    sessions: [
      { day: 'Mon', date: 8,  kind: 'Push', title: 'Bench 1RM test', status: 'planned', volume: 0, duration: 45 },
      { day: 'Thu', date: 11, kind: 'Legs', title: 'Squat 1RM test', status: 'planned', volume: 0, duration: 50 },
    ],
    changes: [],
  },
];

// ── Goals ─────────────────────────────────────────────────────
const STRIDE_GOALS = [
  {
    id: 'g-bench',
    title: 'Bench press 100 kg × 5',
    cat: 'Strength',
    progress: 0.72,
    current: '82.5 kg × 6',
    target: '100 kg × 5',
    deadline: 'Aug 15',
    weeks: 'in 12 weeks',
    color: '#FF4D1F',
  },
  {
    id: 'g-weight',
    title: 'Cut to 75 kg',
    cat: 'Body comp',
    progress: 0.51,
    current: '78.4 kg',
    target: '75 kg',
    deadline: 'Jul 01',
    weeks: 'in 6 weeks',
    color: '#2563EB',
  },
  {
    id: 'g-pull',
    title: 'Pull-ups: 15 strict',
    cat: 'Calisthenics',
    progress: 0.80,
    current: '12 reps',
    target: '15 reps',
    deadline: 'Jun 30',
    weeks: 'in 5 weeks',
    color: '#16A34A',
  },
  {
    id: 'g-5k',
    title: 'Run 5K under 22:00',
    cat: 'Cardio',
    progress: 0.38,
    current: '23:48',
    target: '21:59',
    deadline: 'Sep 01',
    weeks: 'in 14 weeks',
    color: '#F59E0B',
  },
];

// ── Injuries ──────────────────────────────────────────────────
const STRIDE_INJURIES = [
  {
    id: 'inj-shoulder',
    bodyPart: 'R. Shoulder',
    label: 'Anterior impingement',
    severity: 'Mild',
    status: 'monitoring',
    since: 'Apr 12',
    note: 'Pain on incline press > 70 kg. Avoid wide-grip bench.',
    avoid: ['Wide-grip bench', 'Behind-the-neck press', 'Snatch'],
    safe: ['Neutral DB press', 'Landmine press', 'Cable rows'],
    aiChanges: [
      { icon: 'sliders',   kind: 'Swapped',          text: 'Barbell dips → neutral-grip DB press', why: 'Protecting the flagged right shoulder on pressing days.', when: 'May 19' },
      { icon: 'plus',      kind: 'Added',            text: 'Band pull-aparts to every push warm-up', why: 'Priming the shoulder before loaded pressing.', when: 'May 12' },
      { icon: 'arrowDown', kind: 'Lowered intensity', text: 'Capped incline press at 65 kg', why: 'Pain reported above 70 kg on Apr 12.', when: 'Apr 13' },
    ],
    journal: [
      { date: 'May 24', trend: 'better', text: 'Healing slowly but surely — pressed 65 kg with zero pinch today.' },
      { date: 'May 16', trend: 'better', text: 'Band pull-aparts before pressing really help. Less ache afterward.' },
      { date: 'Apr 12', trend: 'same',   text: 'First flagged it — sharp pinch at the bottom of incline bench.' },
    ],
  },
  {
    id: 'inj-knee',
    bodyPart: 'L. Knee',
    label: 'Patellar tendonitis',
    severity: 'Mild',
    status: 'resolved',
    since: 'Feb 02',
    note: 'Cleared by PT on May 03. Continue eccentric squats 2×/wk.',
    avoid: [],
    safe: ['Box squat', 'Leg press', 'Hamstring curl'],
    aiChanges: [
      { icon: 'check',     kind: 'Cleared',     text: 'Returned back squat to full programming', why: 'PT clearance logged May 03 with pain-free depth.', when: 'May 03' },
      { icon: 'sliders',   kind: 'Swapped',     text: 'Back squat → box squat during rehab', why: 'Limiting knee flexion under load while tendon settled.', when: 'Feb 03' },
    ],
    journal: [
      { date: 'May 03', trend: 'better', text: 'PT cleared me. Pain-free through full squat depth.' },
      { date: 'Mar 20', trend: 'better', text: 'Eccentric work paying off — stairs no longer hurt.' },
      { date: 'Feb 02', trend: 'worse',  text: 'Dull ache below the kneecap after every squat session.' },
    ],
  },
  {
    id: 'inj-wrist',
    bodyPart: 'L. Wrist',
    label: 'Tendon flare',
    severity: 'Moderate',
    status: 'active',
    since: 'May 10',
    note: 'Use wrist wraps on pressing days. Skip front squat this week.',
    avoid: ['Front squat', 'Wrist-loaded burpees'],
    safe: ['SSB squat', 'Goblet squat (light)', 'Hack squat'],
    aiChanges: [
      { icon: 'sliders', kind: 'Swapped', text: 'Front squat → SSB squat this week', why: 'Keeps load off the flared wrist.', when: 'May 10' },
    ],
    journal: [
      { date: 'May 10', trend: 'same', text: 'Tendon flared up — tender when the wrist bends back under load.' },
    ],
  },
];

// ── Exercise library (nested tree, multi-level) ───────────────
// Leaves contain `exercises` array, branches have `children`.
const STRIDE_LIBRARY = {
  id: 'root',
  children: [
    {
      id: 'strength', name: 'Strength', count: 142,
      children: [
        {
          id: 'push', name: 'Push (Chest / Shoulders / Triceps)', count: 38,
          children: [
            {
              id: 'chest', name: 'Chest', count: 16,
              children: [
                { id: 'chest-barbell', name: 'Barbell', count: 5, exercises: [
                  { name: 'Barbell Bench Press', diff: 'Intermediate', equip: 'Barbell + bench', primary: 'Chest', secondary: 'Triceps · Front delts' },
                  { name: 'Incline Bench Press', diff: 'Intermediate', equip: 'Barbell + incline bench', primary: 'Upper chest', secondary: 'Front delts' },
                  { name: 'Close-Grip Bench Press', diff: 'Intermediate', equip: 'Barbell + bench', primary: 'Triceps', secondary: 'Chest' },
                  { name: 'Floor Press', diff: 'Beginner', equip: 'Barbell', primary: 'Chest', secondary: 'Triceps' },
                  { name: 'Decline Bench Press', diff: 'Intermediate', equip: 'Barbell + decline bench', primary: 'Lower chest', secondary: 'Triceps' },
                ]},
                { id: 'chest-db', name: 'Dumbbell', count: 6, exercises: [
                  { name: 'Flat DB Press', diff: 'Beginner', equip: 'Dumbbells + bench', primary: 'Chest', secondary: 'Triceps' },
                  { name: 'Incline DB Press', diff: 'Beginner', equip: 'Dumbbells + incline bench', primary: 'Upper chest' },
                  { name: 'DB Fly', diff: 'Beginner', equip: 'Dumbbells + bench', primary: 'Chest' },
                  { name: 'Squeeze Press', diff: 'Beginner', equip: 'Dumbbells', primary: 'Inner chest' },
                  { name: 'DB Pullover', diff: 'Intermediate', equip: 'Dumbbell + bench', primary: 'Chest', secondary: 'Lats' },
                  { name: 'Single-Arm DB Press', diff: 'Intermediate', equip: 'Dumbbell + bench', primary: 'Chest', secondary: 'Core' },
                ]},
                { id: 'chest-cable', name: 'Cable & Machine', count: 5, exercises: [
                  { name: 'Cable Fly — High to Low', diff: 'Beginner', equip: 'Cables', primary: 'Lower chest' },
                  { name: 'Cable Fly — Low to High', diff: 'Beginner', equip: 'Cables', primary: 'Upper chest' },
                  { name: 'Pec Deck', diff: 'Beginner', equip: 'Machine', primary: 'Chest' },
                  { name: 'Machine Chest Press', diff: 'Beginner', equip: 'Machine', primary: 'Chest' },
                  { name: 'Cable Crossover', diff: 'Intermediate', equip: 'Cables', primary: 'Chest' },
                ]},
              ],
            },
            {
              id: 'shoulders', name: 'Shoulders', count: 12,
              children: [
                { id: 'sh-press', name: 'Pressing', count: 4, exercises: [
                  { name: 'Overhead Press (Standing)', diff: 'Intermediate', equip: 'Barbell', primary: 'Front delts', secondary: 'Triceps · Core' },
                  { name: 'Seated DB Shoulder Press', diff: 'Beginner', equip: 'Dumbbells + bench', primary: 'Delts' },
                  { name: 'Arnold Press', diff: 'Intermediate', equip: 'Dumbbells', primary: 'All three delts' },
                  { name: 'Landmine Press', diff: 'Beginner', equip: 'Barbell + landmine', primary: 'Front delts' },
                ]},
                { id: 'sh-raise', name: 'Raises', count: 4, exercises: [
                  { name: 'DB Lateral Raise', diff: 'Beginner', equip: 'Dumbbells', primary: 'Side delts' },
                  { name: 'Cable Lateral Raise', diff: 'Beginner', equip: 'Cable', primary: 'Side delts' },
                  { name: 'Rear Delt Fly', diff: 'Beginner', equip: 'Dumbbells', primary: 'Rear delts' },
                  { name: 'Face Pull', diff: 'Beginner', equip: 'Cable + rope', primary: 'Rear delts', secondary: 'Upper traps' },
                ]},
                { id: 'sh-traps', name: 'Traps', count: 4, exercises: [
                  { name: 'Barbell Shrug', diff: 'Beginner', equip: 'Barbell', primary: 'Upper traps' },
                  { name: 'DB Shrug', diff: 'Beginner', equip: 'Dumbbells', primary: 'Upper traps' },
                  { name: 'Y-Raise', diff: 'Beginner', equip: 'Dumbbells', primary: 'Lower traps' },
                  { name: 'Farmer Carry', diff: 'Beginner', equip: 'Dumbbells', primary: 'Traps · Grip' },
                ]},
              ],
            },
            {
              id: 'triceps', name: 'Triceps', count: 10, exercises: [
                { name: 'Tricep Rope Pushdown', diff: 'Beginner', equip: 'Cable + rope', primary: 'Triceps' },
                { name: 'Skullcrusher', diff: 'Intermediate', equip: 'EZ-bar + bench', primary: 'Long head' },
                { name: 'Overhead Cable Extension', diff: 'Beginner', equip: 'Cable', primary: 'Long head' },
                { name: 'Diamond Push-up', diff: 'Beginner', equip: 'Bodyweight', primary: 'Triceps' },
                { name: 'Weighted Dips', diff: 'Intermediate', equip: 'Dip bar + belt', primary: 'Triceps', secondary: 'Chest' },
                { name: 'JM Press', diff: 'Advanced', equip: 'Barbell + bench', primary: 'Triceps' },
              ],
            },
          ],
        },
        {
          id: 'pull', name: 'Pull (Back / Biceps)', count: 42,
          children: [
            {
              id: 'back', name: 'Back', count: 22,
              children: [
                { id: 'back-vert', name: 'Vertical', count: 5, exercises: [
                  { name: 'Pull-up (Strict)', diff: 'Intermediate', equip: 'Bar', primary: 'Lats' },
                  { name: 'Chin-up', diff: 'Beginner', equip: 'Bar', primary: 'Lats', secondary: 'Biceps' },
                  { name: 'Lat Pulldown', diff: 'Beginner', equip: 'Cable', primary: 'Lats' },
                  { name: 'Neutral-Grip Pull-up', diff: 'Intermediate', equip: 'Bar', primary: 'Lats' },
                  { name: 'Straight-Arm Pulldown', diff: 'Beginner', equip: 'Cable', primary: 'Lats' },
                ]},
                { id: 'back-horiz', name: 'Horizontal', count: 6, exercises: [
                  { name: 'Barbell Row', diff: 'Intermediate', equip: 'Barbell', primary: 'Mid back' },
                  { name: 'Pendlay Row', diff: 'Advanced', equip: 'Barbell', primary: 'Mid back' },
                  { name: 'Chest-Supported Row', diff: 'Beginner', equip: 'Bench + DBs', primary: 'Mid back' },
                  { name: 'Seated Cable Row', diff: 'Beginner', equip: 'Cable + V-handle', primary: 'Mid back' },
                  { name: 'Single-Arm DB Row', diff: 'Beginner', equip: 'Dumbbell + bench', primary: 'Lats' },
                  { name: 'Inverted Row', diff: 'Beginner', equip: 'Bar', primary: 'Mid back' },
                ]},
              ],
            },
            {
              id: 'biceps', name: 'Biceps', count: 8, exercises: [
                { name: 'Barbell Curl', diff: 'Beginner', equip: 'Barbell', primary: 'Biceps' },
                { name: 'Incline DB Curl', diff: 'Beginner', equip: 'Dumbbells + incline bench', primary: 'Long head' },
                { name: 'Hammer Curl', diff: 'Beginner', equip: 'Dumbbells', primary: 'Brachialis' },
                { name: 'Preacher Curl', diff: 'Beginner', equip: 'EZ bar + preacher bench', primary: 'Short head' },
                { name: 'Cable Curl', diff: 'Beginner', equip: 'Cable', primary: 'Biceps' },
                { name: 'Concentration Curl', diff: 'Beginner', equip: 'Dumbbell', primary: 'Biceps' },
              ],
            },
          ],
        },
        {
          id: 'legs', name: 'Legs', count: 38,
          children: [
            {
              id: 'quads', name: 'Quad-dominant', count: 8, exercises: [
                { name: 'Back Squat', diff: 'Intermediate', equip: 'Barbell + rack', primary: 'Quads', secondary: 'Glutes · Core' },
                { name: 'Front Squat', diff: 'Advanced', equip: 'Barbell', primary: 'Quads' },
                { name: 'Hack Squat', diff: 'Beginner', equip: 'Machine', primary: 'Quads' },
                { name: 'Bulgarian Split Squat', diff: 'Intermediate', equip: 'DBs + bench', primary: 'Quads · Glutes' },
                { name: 'Leg Press', diff: 'Beginner', equip: 'Machine', primary: 'Quads' },
                { name: 'Leg Extension', diff: 'Beginner', equip: 'Machine', primary: 'Quads' },
              ],
            },
            {
              id: 'hammies', name: 'Posterior chain', count: 8, exercises: [
                { name: 'Conventional Deadlift', diff: 'Advanced', equip: 'Barbell', primary: 'Posterior chain' },
                { name: 'Romanian Deadlift', diff: 'Intermediate', equip: 'Barbell', primary: 'Hamstrings · Glutes' },
                { name: 'Hip Thrust', diff: 'Beginner', equip: 'Barbell + bench', primary: 'Glutes' },
                { name: 'Hamstring Curl', diff: 'Beginner', equip: 'Machine', primary: 'Hamstrings' },
                { name: 'Good Morning', diff: 'Intermediate', equip: 'Barbell', primary: 'Hamstrings · Erectors' },
                { name: 'Single-Leg RDL', diff: 'Intermediate', equip: 'Dumbbell', primary: 'Hamstrings · Glutes' },
              ],
            },
            {
              id: 'calves', name: 'Calves', count: 4, exercises: [
                { name: 'Standing Calf Raise', diff: 'Beginner', equip: 'Machine', primary: 'Gastrocnemius' },
                { name: 'Seated Calf Raise', diff: 'Beginner', equip: 'Machine', primary: 'Soleus' },
                { name: 'Donkey Calf Raise', diff: 'Beginner', equip: 'Machine', primary: 'Gastrocnemius' },
                { name: 'Single-Leg Calf Raise', diff: 'Beginner', equip: 'Bodyweight', primary: 'Calves' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'calisthenics', name: 'Calisthenics', count: 48,
      children: [
        { id: 'cal-skills', name: 'Skills', count: 10, exercises: [
          { name: 'Muscle-up (Bar)', diff: 'Advanced', equip: 'Bar', primary: 'Full upper' },
          { name: 'Front Lever Tuck', diff: 'Intermediate', equip: 'Bar', primary: 'Lats · Core' },
          { name: 'Back Lever Tuck', diff: 'Intermediate', equip: 'Bar', primary: 'Back · Core' },
          { name: 'Handstand Hold', diff: 'Intermediate', equip: 'Wall', primary: 'Shoulders · Core' },
          { name: 'Pistol Squat', diff: 'Advanced', equip: 'Bodyweight', primary: 'Quads · Balance' },
          { name: 'L-Sit', diff: 'Intermediate', equip: 'Parallettes', primary: 'Core' },
        ]},
        { id: 'cal-push', name: 'Push patterns', count: 12, exercises: [
          { name: 'Push-up', diff: 'Beginner', equip: 'Bodyweight', primary: 'Chest' },
          { name: 'Archer Push-up', diff: 'Intermediate', equip: 'Bodyweight', primary: 'Chest' },
          { name: 'Pike Push-up', diff: 'Intermediate', equip: 'Bodyweight', primary: 'Shoulders' },
          { name: 'Pseudo-Planche Push-up', diff: 'Advanced', equip: 'Bodyweight', primary: 'Shoulders · Chest' },
          { name: 'Ring Dip', diff: 'Advanced', equip: 'Rings', primary: 'Chest · Triceps' },
        ]},
        { id: 'cal-pull', name: 'Pull patterns', count: 10, exercises: [
          { name: 'Pull-up', diff: 'Intermediate', equip: 'Bar', primary: 'Back' },
          { name: 'Australian Row', diff: 'Beginner', equip: 'Low bar', primary: 'Back' },
          { name: 'Archer Pull-up', diff: 'Advanced', equip: 'Bar', primary: 'Back' },
          { name: 'Typewriter Pull-up', diff: 'Advanced', equip: 'Bar', primary: 'Back' },
        ]},
      ],
    },
    {
      id: 'conditioning', name: 'Conditioning & CrossFit', count: 36,
      children: [
        { id: 'wod', name: 'Benchmark WODs', count: 8, exercises: [
          { name: 'Fran', diff: 'Advanced', equip: 'Barbell + bar', primary: '21-15-9 thruster + pull-up' },
          { name: 'Cindy', diff: 'Intermediate', equip: 'Bar', primary: '20 min AMRAP — 5/10/15' },
          { name: 'Helen', diff: 'Intermediate', equip: 'Mixed', primary: '3 rounds: 400m / 21 KB / 12 pull-ups' },
          { name: 'Murph', diff: 'Advanced', equip: 'Mixed', primary: '1mi / 100/200/300 / 1mi' },
        ]},
        { id: 'metcon', name: 'Metcons', count: 10, exercises: [
          { name: 'EMOM Row + Burpees', diff: 'Intermediate', equip: 'Rower', primary: 'Conditioning' },
          { name: 'Death by Burpees', diff: 'Intermediate', equip: 'None', primary: 'Conditioning' },
          { name: 'Ladder: KB Swing + Box Jump', diff: 'Intermediate', equip: 'KB + box', primary: 'Conditioning' },
        ]},
      ],
    },
    {
      id: 'cardio', name: 'Cardio', count: 22,
      children: [
        { id: 'cardio-run', name: 'Running', count: 6, exercises: [
          { name: 'Easy Z2 Run', diff: 'Beginner', equip: 'Shoes', primary: 'Aerobic' },
          { name: 'Tempo Run', diff: 'Intermediate', equip: 'Shoes', primary: 'Threshold' },
          { name: '5×800m Intervals', diff: 'Advanced', equip: 'Track', primary: 'VO2 max' },
        ]},
        { id: 'cardio-bike', name: 'Cycling', count: 5, exercises: [
          { name: 'Z2 Bike — 60 min', diff: 'Beginner', equip: 'Bike', primary: 'Aerobic' },
          { name: '4×4 Norwegian', diff: 'Advanced', equip: 'Bike', primary: 'VO2 max' },
        ]},
      ],
    },
    {
      id: 'mobility', name: 'Mobility & Recovery', count: 18,
      children: [
        { id: 'mob-hip', name: 'Hips', count: 6, exercises: [
          { name: '90/90 Hip Switch', diff: 'Beginner', equip: 'None', primary: 'Hip mobility' },
          { name: 'Couch Stretch', diff: 'Beginner', equip: 'Wall', primary: 'Hip flexors' },
          { name: 'Cossack Squat', diff: 'Intermediate', equip: 'None', primary: 'Adductors · Hips' },
        ]},
        { id: 'mob-shoulder', name: 'Shoulders', count: 5, exercises: [
          { name: 'Band Pull-Apart', diff: 'Beginner', equip: 'Band', primary: 'Rear delts' },
          { name: 'Wall Slide', diff: 'Beginner', equip: 'Wall', primary: 'Upper back · Shoulders' },
          { name: 'Shoulder CARs', diff: 'Beginner', equip: 'None', primary: 'Shoulder mobility' },
        ]},
      ],
    },
  ],
};

// ── AI chat seed messages by personality ──────────────────────
// The selectable AI coaches are real people; "Coach" stays the generic product
// term. Keys are stable ids — 'calm' is the default; the old 'buddy' (hype) was
// merged into 'coach', now a hype + no-excuses persona.
const STRIDE_AI_PERSONAS = {
  calm: {
    name: 'Jožo',
    blurb: 'Steady, supportive, evidence-based.',
    sample: "Hey — your push session is ready when you are. We adjusted bench to 82.5×6 based on last week's RPE. Sound good?",
  },
  coach: {
    name: 'Jano',
    blurb: 'Hype energy, no excuses.',
    sample: "Push day — let's GO. You're 12 sessions from a 100 kg bench, so don't waste today. 62 minutes, queued up. Get under the bar. 🔥",
  },
  nerd: {
    name: 'Peter',
    blurb: 'Stats-first. Volume, RPE, tonnage.',
    sample: "Weekly volume +8.4% vs 4-week baseline. Push tonnage trending toward 1RM uplift in ~3 weeks. Recommend today: 82.5kg × 6 × 3 (RPE 7.5).",
  },
};

const STRIDE_CHAT_SEED = [
  { who: 'ai', text: "Morning. Your push session is queued — bench, OHP, dips, fly, pushdown. 62 min, RPE target 7.5.", cards: [
    { kind: 'session', title: 'Push — Strength A', subtitle: 'Today · 62 min · RPE 7.5', session: { day: 'Thu', date: 21, kind: 'Push', title: 'Push — Strength A', status: 'today', volume: 0, duration: 62 } },
  ] },
  { who: 'me', text: 'My right shoulder still feels a bit tight. Should I swap bench?' },
  { who: 'ai', text: "Noted — flagged it on Apr 12. I'd keep flat bench but drop to 75 kg × 8 today and add a band pull-apart warm-up. Skip dips, sub neutral-grip DB press.", cards: [
    { kind: 'injury', title: 'Right shoulder — monitoring', subtitle: 'Flagged Apr 12 · impingement' },
  ] },
];

// ── Recent activity feed ──────────────────────────────────────
const STRIDE_RECENT = [
  { d: 'Yesterday', title: 'Pull — Strength A',   icon: 'dumbbell', dur: '58 min', vol: '5,840 kg', rpe: 'RPE 7.8' },
  { d: 'Mon',       title: 'Lower — Squat focus', icon: 'flame',    dur: '71 min', vol: '7,210 kg', rpe: 'RPE 8.2' },
  { d: 'Sun',       title: 'Easy Z2 Run',          icon: 'heart',    dur: '42 min', extra: ['6.8 km', '165 bpm avg'] },
  { d: 'Sat',       title: 'Push — Hypertrophy',   icon: 'dumbbell', dur: '64 min', vol: '5,120 kg', rpe: 'RPE 7.0' },
];

// ── Workout spots ─────────────────────────────────────────────
// Master equipment list, grouped — used by the spot editor's pickers.
const STRIDE_EQUIPMENT_GROUPS = [
  { group: 'Free weights', items: ['Barbell', 'Dumbbells', 'Kettlebells', 'EZ-bar', 'Weight plates', 'Bench', 'Squat rack'] },
  { group: 'Machines', items: ['Cable machine', 'Pin-loaded machines', 'Smith machine', 'Leg press', 'Lat pulldown'] },
  { group: 'Bodyweight & rigs', items: ['Pull-up bar', 'Dip bars', 'Gymnastic rings', 'Parallettes', 'Resistance bands', 'TRX / suspension'] },
  { group: 'Cardio', items: ['Treadmill', 'Rowing machine', 'Assault bike', 'Open running area', 'Track'] },
  { group: 'Functional / space', items: ['Plyo boxes', 'Medicine balls', 'Battle ropes', 'Sled', 'Turf strip', 'Climbing wall', 'Crash mats', 'Spring floor'] },
];
const STRIDE_EQUIPMENT = STRIDE_EQUIPMENT_GROUPS.flatMap((g) => g.items);

// Official spot directory — curated, verified locations a user can add in one tap.
const STRIDE_OFFICIAL_SPOTS = [
  { id: 'off-commercial', name: 'Commercial gym (full)', type: 'gym', size: 'Large', blurb: 'Racks, full machine floor, cardio',
    equipment: ['Barbell', 'Dumbbells', 'Kettlebells', 'EZ-bar', 'Weight plates', 'Bench', 'Squat rack', 'Cable machine', 'Pin-loaded machines', 'Smith machine', 'Leg press', 'Lat pulldown', 'Pull-up bar', 'Dip bars', 'Treadmill', 'Rowing machine', 'Assault bike'] },
  { id: 'off-boutique', name: 'Boutique strength gym', type: 'gym', size: 'Medium', blurb: 'Barbells, dumbbells, a couple of racks',
    equipment: ['Barbell', 'Dumbbells', 'Kettlebells', 'Weight plates', 'Bench', 'Squat rack', 'Cable machine', 'Pull-up bar', 'Rowing machine'] },
  { id: 'off-crossfit', name: 'CrossFit / functional box', type: 'gym', size: 'Large', blurb: 'Rigs, bumpers, conditioning kit',
    equipment: ['Barbell', 'Dumbbells', 'Kettlebells', 'Weight plates', 'Squat rack', 'Pull-up bar', 'Gymnastic rings', 'Rowing machine', 'Assault bike', 'Plyo boxes', 'Medicine balls', 'Sled', 'Battle ropes'] },
  { id: 'off-calisthenics', name: 'Calisthenics park', type: 'park', size: 'Open-air', blurb: 'Bars, dip stations, open ground',
    equipment: ['Pull-up bar', 'Dip bars', 'Parallettes', 'Open running area'] },
  { id: 'off-hotel', name: 'Hotel gym', type: 'gym', size: 'Compact', blurb: 'Light dumbbells, a machine or two, cardio',
    equipment: ['Dumbbells', 'Bench', 'Cable machine', 'Treadmill'] },
  { id: 'off-university', name: 'University gym', type: 'gym', size: 'Large', blurb: 'Well-equipped student facility',
    equipment: ['Barbell', 'Dumbbells', 'Kettlebells', 'Weight plates', 'Bench', 'Squat rack', 'Smith machine', 'Cable machine', 'Pin-loaded machines', 'Leg press', 'Lat pulldown', 'Pull-up bar', 'Treadmill', 'Rowing machine'] },
  { id: 'off-gymnastics', name: 'Gymnastics hall', type: 'gymnastics', size: 'Large', blurb: 'Rings, bars, sprung floor, mats',
    equipment: ['Gymnastic rings', 'Parallettes', 'Pull-up bar', 'Climbing wall', 'Crash mats', 'Spring floor'] },
  { id: 'off-track', name: 'Athletics track', type: 'outdoor', size: 'Open-air', blurb: 'Running track + open field',
    equipment: ['Track', 'Open running area', 'Plyo boxes'] },
];

// Spot types — drive the icon + accent on each spot card.
const SPOT_TYPES = [
  { id: 'gym',        label: 'Commercial Gym',   icon: 'dumbbell', color: '#2563EB' },
  { id: 'home',       label: 'Home Gym',         icon: 'home',     color: '#FF4D1F' },
  { id: 'park',       label: 'Park / Calisthenics', icon: 'leaf',  color: '#16A34A' },
  { id: 'gymnastics', label: 'Gymnastics Hall',  icon: 'sparkles', color: '#9333EA' },
  { id: 'outdoor',    label: 'Outdoor / Track',  icon: 'pin',      color: '#F59E0B' },
  { id: 'studio',     label: 'Studio',           icon: 'heart',    color: '#E11D48' },
];

const SPOT_SIZES = ['Compact', 'Medium', 'Large', 'Open-air'];

// Seed spots — the user can edit/add/remove these (persisted to localStorage).
// Each spot has a standing `prompt` (what you want from sessions there) and a
// `schedule` rule the generator uses to auto-pick a spot for a given day.
const STRIDE_SPOTS_SEED = [
  {
    id: 'spot-commercial', name: 'PowerHaus Gym', type: 'gym', size: 'Large', isDefault: true,
    equipment: ['Barbell', 'Dumbbells', 'Kettlebells', 'Bench', 'Squat rack', 'Cable machine', 'Pin-loaded machines', 'Smith machine', 'Leg press', 'Lat pulldown', 'Pull-up bar', 'Dip bars', 'Treadmill', 'Rowing machine', 'Assault bike'],
    prompt: 'Heavy compound focus — make the most of the racks and full machine setup.',
    schedule: { type: 'default' },
    notes: 'Main gym. Busy 5–7pm — squat racks get taken.',
  },
  {
    id: 'spot-home', name: 'Garage setup', type: 'home', size: 'Compact', isDefault: false,
    equipment: ['Barbell', 'Dumbbells', 'Weight plates', 'Bench', 'Squat rack', 'Pull-up bar', 'Resistance bands'],
    prompt: 'Time-efficient — supersets, keep it under 45 minutes.',
    schedule: { type: 'days', days: ['Tue', 'Thu'] },
    notes: 'Low ceiling — no standing overhead press with the bar.',
  },
  {
    id: 'spot-park', name: 'Riverside calisthenics park', type: 'park', size: 'Open-air', isDefault: false,
    equipment: ['Pull-up bar', 'Dip bars', 'Parallettes', 'Open running area'],
    prompt: 'Calisthenics + conditioning. Skills work, then a finisher.',
    schedule: { type: 'weekParity', parity: 'odd', days: ['Sun'] },
    notes: 'Great for pull/push days when the weather is good.',
  },
];

// Schedule presets — map a friendly label to a structured rule.
const SCHEDULE_PRESETS = [
  { label: 'Main spot (default)', value: { type: 'default' } },
  { label: 'Weekdays', value: { type: 'days', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] } },
  { label: 'Weekends', value: { type: 'days', days: ['Sat', 'Sun'] } },
  { label: 'Tuesdays & Thursdays', value: { type: 'days', days: ['Tue', 'Thu'] } },
  { label: 'Sundays', value: { type: 'days', days: ['Sun'] } },
  { label: 'Odd weeks · Sunday', value: { type: 'weekParity', parity: 'odd', days: ['Sun'] } },
  { label: 'Even weeks · Sunday', value: { type: 'weekParity', parity: 'even', days: ['Sun'] } },
  { label: 'Only when I choose it', value: { type: 'manual' } },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Catalog requests ──────────────────────────────────────────
// User-submitted requests to add an exercise / equipment / spot to the
// official catalog. Admins triage these in the management dashboard.
// Seeded with a few so the dashboard isn't empty on first run.
const STRIDE_REQUESTS_SEED = [
  { id: 'req-1', kind: 'exercise',  name: 'Jefferson Deadlift', meta: 'Legs · Compound', note: 'Great unilateral-ish pull, not in the library yet.', by: 'Alex R.', handle: '@alex.r', date: '2026-05-30T09:12:00Z', status: 'pending' },
  { id: 'req-2', kind: 'equipment', name: 'Belt squat machine', meta: 'Machines', note: 'My gym just got one — would love sessions to use it.', by: 'Priya N.', handle: '@priya.lifts', date: '2026-05-29T17:40:00Z', status: 'pending' },
  { id: 'req-3', kind: 'spot',      name: 'Iron Forge Barbell Club', meta: 'Commercial Gym · Large', note: 'Dedicated powerlifting gym, calibrated plates + 4 mono-lifts.', by: 'Marcus T.', handle: '@marcuslifts', date: '2026-05-28T08:05:00Z', status: 'pending' },
  { id: 'req-4', kind: 'exercise',  name: 'Copenhagen Plank', meta: 'Core · Adductors', note: 'Adductor strength for runners, would be a useful add.', by: 'Sara L.', handle: '@sara.runs', date: '2026-05-27T14:22:00Z', status: 'approved' },
  { id: 'req-5', kind: 'equipment', name: 'Reverse hyper', meta: 'Functional / space', note: 'Posterior chain + decompression, common in strength gyms.', by: 'Alex R.', handle: '@alex.r', date: '2026-05-25T11:00:00Z', status: 'rejected' },
];

function isoWeekParity(date) {
  // ISO week number → odd/even
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return week % 2 === 1 ? 'odd' : 'even';
}

function scheduleLabel(schedule) {
  if (!schedule) return 'Main spot';
  const preset = SCHEDULE_PRESETS.find((p) => JSON.stringify(p.value) === JSON.stringify(schedule));
  if (preset) return preset.label;
  if (schedule.type === 'days') return schedule.days.join(' · ');
  if (schedule.type === 'weekParity') return `${schedule.parity} weeks · ${schedule.days.join(' · ')}`;
  if (schedule.type === 'manual') return 'Manual';
  return 'Main spot';
}

function scheduleMatches(schedule, date) {
  if (!schedule || schedule.type === 'default' || schedule.type === 'manual') return false;
  const day = DAY_NAMES[date.getDay()];
  if (schedule.type === 'days') return (schedule.days || []).includes(day);
  if (schedule.type === 'weekParity') return (schedule.days || []).includes(day) && isoWeekParity(date) === schedule.parity;
  return false;
}

// Pick the spot that applies on a given date: a matching rule wins, else the default, else the first.
function resolveScheduledSpot(spots, date) {
  if (!spots || !spots.length) return null;
  // week-parity rules are most specific, then day rules
  const parityHit = spots.find((s) => s.schedule && s.schedule.type === 'weekParity' && scheduleMatches(s.schedule, date));
  if (parityHit) return parityHit;
  const dayHit = spots.find((s) => s.schedule && s.schedule.type === 'days' && scheduleMatches(s.schedule, date));
  if (dayHit) return dayHit;
  return spots.find((s) => s.isDefault) || spots.find((s) => s.schedule && s.schedule.type === 'default') || spots[0];
}

Object.assign(window, {
  STRIDE_THEME, STRIDE_USER, STRIDE_WEIGHT_HISTORY, STRIDE_TODAYS_WORKOUT,
  STRIDE_WEEK_PLAN, STRIDE_PLAN_CHANGES, STRIDE_AI_LOG, STRIDE_BLOCKS, STRIDE_GOALS, STRIDE_INJURIES, STRIDE_LIBRARY,
  STRIDE_AI_PERSONAS, STRIDE_CHAT_SEED, STRIDE_RECENT,
  STRIDE_EQUIPMENT, STRIDE_EQUIPMENT_GROUPS, STRIDE_OFFICIAL_SPOTS, SPOT_TYPES, SPOT_SIZES, STRIDE_SPOTS_SEED,
  SCHEDULE_PRESETS, DAY_NAMES, scheduleLabel, scheduleMatches, resolveScheduledSpot, isoWeekParity,
  STRIDE_REQUESTS_SEED,
});
