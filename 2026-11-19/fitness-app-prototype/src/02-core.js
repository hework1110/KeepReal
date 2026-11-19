/* ============================================================
   2. 工具 / 状态 / 持久化 / 计划模型
   ============================================================ */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

function icon(name, cls){
  return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
}
function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function pad(n){ return String(n).padStart(2,'0'); }
function fmtNum(n){
  const r = Math.round((+n || 0) * 100) / 100;
  return String(r);
}
function fmtVol(n){ return Math.round(n || 0).toLocaleString('en-US'); }
function fmtK(n){
  if(n >= 10000) return (n/1000).toFixed(n >= 100000 ? 0 : 1) + 'k';
  return fmtVol(n);
}
function fmtClock(sec){
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  return pad(h) + ':' + pad(m) + ':' + pad(s);
}
function fmtMs(ms){
  ms = Math.max(0, ms || 0);
  const total = Math.ceil(ms/1000);
  return pad(Math.floor(total/60)) + ':' + pad(total%60);
}
function isoOf(d){
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
}
function addDays(d, n){
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}
function parseISO(iso){
  const p = String(iso).split('-');
  return new Date(+p[0], +p[1]-1, +p[2]);
}
function daysBetween(a, b){
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}
function shortDate(iso){
  const d = parseISO(iso);
  return (d.getMonth()+1) + '/' + d.getDate();
}
function todayISO(){ return isoOf(new Date()); }
function goalName(id){ const g = GOALS.find(x => x.id === id); return g ? g.name : ''; }
function templateById(id){ return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]; }
function roundStep(w, step){
  step = step || 1;
  return Math.round(w / step) * step;
}
function e1rm(w, reps){
  w = +w || 0; reps = +reps || 0;
  if(!(w > 0) || !(reps > 0)) return 0;
  return Math.round(w * (1 + reps/30) * 10) / 10;
}
function uid(prefix){ return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

/* ---------- 动作信息 ---------- */
function customInfo(c){
  return {
    pattern:'自定义', group:c.group, muscle:c.muscle, equip:c.equip,
    type: c.equip === '杠铃' ? 'barbell' : (c.equip === '绳索' ? 'cable' : (c.equip === '器械' ? 'machine' : (c.equip === '自重' ? 'bodyweight' : 'dumbbell'))),
    unilateral: !!c.unilateral, bw: c.equip === '自重', base: 20, step: c.equip === '杠铃' ? 2.5 : 1,
    pr: 0, cue:'自定义动作 · 保持动作控制，做满全程幅度。', custom:true
  };
}
function exInfo(name){
  if(EX_LIB[name]) return EX_LIB[name];
  const c = (S.customEx || []).find(x => x.name === name);
  if(c) return customInfo(c);
  return {pattern:'自定义', group:'核心', muscle:'未标注', equip:'自重', type:'bodyweight', bw:true, base:0, step:0, pr:0, cue:'', custom:true};
}
function isBW(name){ return !!exInfo(name).bw; }
function isHold(name){ return !!exInfo(name).hold; }

/* ---------- 默认状态 ---------- */
function defaultState(){
  return {
    version: 2,
    plan: null,
    onboard: {step:1, goal:null, freq:null, template:null},
    session: null,
    prs: {},
    history: [],
    lastSummary: null,
    body: {weights:[], measures:[], cardio:[]},
    customEx: [],
    demo: false,
    view: 'onboarding',
    selectedDay: 0,
    ui: {
      tab: 'today', planDay: null, progressRange: '4w', progressEx: null,
      prAll: false, libGroup: '全部', libEquip: '全部'
    }
  };
}

let S = defaultState();
let SHEET = null;
let MODAL = null;
let NAV = {tab:'today', stack:[]};
let calcFor = -1;
let calcFlat = null;
let renderedView = null;
let lastScroll = 0;
let saveTimer = null;
let libQuery = '';

function normalizeState(p){
  const d = defaultState();
  const st = Object.assign(d, p || {});
  st.onboard = Object.assign({step:1, goal:null, freq:null, template:null}, p && p.onboard || {});
  st.body = Object.assign({weights:[], measures:[], cardio:[]}, p && p.body || {});
  st.ui = Object.assign(d.ui, p && p.ui || {});
  if(!st.plan || !Array.isArray(st.plan.days) || !st.plan.days.length) st.plan = null;
  if(!Array.isArray(st.history)) st.history = [];
  if(!Array.isArray(st.customEx)) st.customEx = [];
  if(!st.body.weights) st.body.weights = [];
  if(!st.body.measures) st.body.measures = [];
  if(!st.body.cardio) st.body.cardio = [];
  st.version = 2;
  return st;
}

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && parsed.version === 2) return normalizeState(parsed);
    }
  }catch(e){ /* 忽略损坏数据，走迁移或重置 */ }
  try{
    const legacy = localStorage.getItem(LEGACY_KEY);
    if(legacy){
      const v1 = JSON.parse(legacy);
      if(v1 && v1.plan){
        const st = migrateV1(v1);
        try{
          localStorage.setItem(KEY, JSON.stringify(st));
          localStorage.removeItem(LEGACY_KEY);
        }catch(e){}
        return st;
      }
    }
  }catch(e){}
  return defaultState();
}

function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){ /* 隐私模式仅内存运行 */ }
}
function saveSoon(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 240);
}

/* ---------- 第一批数据迁移 ---------- */
function migrateV1(v1){
  const st = defaultState();
  st.prs = v1.prs || {};
  st.onboard = v1.onboard || st.onboard;
  st.demo = false;
  const p = v1.plan;
  if(p && TEMPLATES.some(t => t.id === p.templateId)){
    const plan = buildPlan(p.templateId, p.goal, p.freq, p.startDate);
    plan.createdAt = p.createdAt || Date.now();
    if(Array.isArray(p.schedule)){
      plan.schedule = p.schedule.map((e, i) => {
        const base = {date:e.date, dow:e.dow, dayNum:e.dayNum, month:e.month};
        if(e.type !== 'train') return Object.assign(base, {type:'rest'});
        const day = plan.days.find(d => d.srcId === e.workoutId) ||
          getDayById(plan, plan.rotation[(e.indexInRotation || i) % plan.rotation.length]);
        return Object.assign(base, {type:'train', dayId:day.id, indexInRotation:e.indexInRotation || 0});
      });
    }
    st.plan = plan;
    st.history = (v1.history || []).map((h, i) => ({
      id: h.id || ('legacy_' + i),
      date: h.date,
      dayId: (plan.days.find(d => d.srcId === h.workoutId) || {}).id || null,
      workoutName: h.workoutName || '训练',
      volume: +h.volume || 0,
      sets: +h.sets || 0,
      totalSets: +h.totalSets || 0,
      duration: +h.duration || 0,
      prs: h.prs || [],
      breakdown: h.breakdown || [],
      lifts: (h.breakdown || []).filter(b => b.best).map(b => ({
        ex: b.name, weight: +b.best.weight || 0, reps: +b.best.reps || 0,
        volume: +b.volume || 0, sets: +b.sets || 0, e1rm: e1rm(b.best.weight, b.best.reps)
      }))
    }));
    if(v1.session && v1.session.date){
      const old = v1.session;
      const day = plan.days.find(d => d.srcId === old.workoutId) || plan.days[0];
      /* makeSession 依赖全局 S 读取计划与历史，临时切换后恢复 */
      const prevS = S;
      let s;
      try{
        S = st;
        s = makeSession({dayId:day.id, date:old.date});
      }finally{
        S = prevS;
      }
      s.elapsed = +old.elapsed || 0;
      s.currentEx = Math.min(+old.currentEx || 0, s.exercises.length - 1);
      (old.sets || []).forEach(os => {
        const row = s.sets.find(x => x.ex === os.ex && x.setIdx === os.setIdx && !x.done);
        if(row){ row.weight = os.weight; row.reps = os.reps; row.done = !!os.done; }
      });
      if(old.rest) s.rest = null;
      if(s.sets.some(x => x.done)){ s.phase = 'train'; s.warmupDone = s.warmup.map((w, i) => i); }
      st.session = s;
    }
    if(v1.lastSummary){
      const h = st.history.find(x => x.date === v1.lastSummary.date);
      st.lastSummary = h || null;
    }
    st.selectedDay = Math.min(Math.max(+v1.selectedDay || 0, 0), 6);
    if(st.session && st.session.date === todayISO()) st.view = 'workout';
    else if(st.lastSummary) st.view = 'summary';
    else st.view = 'main';
  }else{
    st.view = 'onboarding';
  }
  if(st.view === 'workout' && !st.session) st.view = 'main';
  if(st.view === 'summary' && !st.lastSummary) st.view = 'main';
  st.ui.tab = 'today';
  return st;
}

/* ---------- 计划模型 ---------- */
/* 与第一批 WORKOUTS 的 id 对齐，保证旧数据迁移时能匹配到同一训练日 */
const LEGACY_DAY_IDS = {
  fb:['fb-a','fb-b'],
  ul:['ul-upper','ul-lower'],
  ppl:['ppl-push','ppl-pull','ppl-legs'],
  fb3:['fb-a','fb-b','fb-c']
};

function planDaysFromTemplate(tpl){
  const legacy = LEGACY_DAY_IDS[tpl.id] || [];
  return tpl.days.map((d, i) => ({
    id: 'd' + (i + 1),
    srcId: legacy[i] || (tpl.id + '-' + (i + 1)),
    name: d.name,
    focus: d.focus,
    exercises: d.exercises.map(e => ({ex:e.ex, sets:e.sets, repsMin:e.repsMin, repsMax:e.repsMax, rest:e.rest})),
    abs: ABS_PAIRS[i % ABS_PAIRS.length].slice()
  }));
}

function buildSchedule(days, freq){
  const offsetsMap = {2:[0,3], 3:[0,2,4], 4:[0,2,4,5], 5:[0,1,3,4,6]};
  const offsets = offsetsMap[freq] || offsetsMap[3];
  const today = new Date();
  let ti = 0;
  const out = [];
  for(let i=0;i<7;i++){
    const d = addDays(today, i);
    const base = {date:isoOf(d), dow:DAY_CN[d.getDay()], dayNum:d.getDate(), month:d.getMonth()+1};
    if(offsets.indexOf(i) >= 0){
      const day = days[ti % days.length];
      out.push(Object.assign(base, {type:'train', dayId:day.id, indexInRotation:ti}));
      ti++;
    }else{
      out.push(Object.assign(base, {type:'rest'}));
    }
  }
  return out;
}

function buildPlan(templateId, goal, freq, startDate){
  const tpl = templateById(templateId);
  const days = planDaysFromTemplate(tpl);
  return {
    templateId, goal, freq,
    name: tpl.name,
    createdAt: Date.now(),
    startDate: startDate || todayISO(),
    days,
    rotation: days.map(d => d.id),
    schedule: buildSchedule(days, freq)
  };
}

function getDayById(plan, id){
  return (plan || S.plan || {days:[]}).days.find(d => d.id === id) || null;
}
function rotationDays(plan){
  const p = plan || S.plan;
  return p ? p.rotation.map(id => getDayById(p, id)).filter(Boolean) : [];
}
function ensurePlanFresh(){
  if(!S.plan) return;
  const today = todayISO();
  if(S.plan.schedule && S.plan.schedule[0] && S.plan.schedule[0].date === today) return;
  S.plan.schedule = buildSchedule(S.plan.days, S.plan.freq);
  if(S.session && S.session.date !== today) S.session = null;
  S.selectedDay = 0;
  save();
}

function dayStats(day){
  const all = day.exercises.concat((day.abs || []).map(a => Object.assign({ex:a, abs:true}, ABS_POOL[a])));
  const sets = all.reduce((a, e) => a + (+e.sets || 0), 0);
  const sec = all.reduce((a, e) => a + e.sets * (45 + e.rest), 0);
  return {
    main: day.exercises.length,
    abs: (day.abs || []).length,
    total: all.length,
    sets,
    minutes: Math.max(20, Math.round((sec + 360) / 60 / 5) * 5)
  };
}
function totalWeeklySets(){
  const plan = S.plan;
  if(!plan) return 0;
  const sched = plan.schedule || [];
  const trainDays = sched.filter(e => e.type === 'train' && getDayById(plan, e.dayId));
  if(!trainDays.length) return rotationDays().reduce((a, d) => a + dayStats(d).sets, 0);
  return trainDays.reduce((a, e) => a + dayStats(getDayById(plan, e.dayId)).sets, 0);
}
function repsText(cfg, name){
  if(isHold(name)) return (cfg.repsMax || cfg.repsMin) + ' 秒';
  return cfg.repsMin === cfg.repsMax ? String(cfg.repsMin) : cfg.repsMin + '-' + cfg.repsMax;
}

/* ---------- 热身 ---------- */
function warmupFor(day){
  const pats = day.exercises.map(e => exInfo(e.ex).pattern);
  const lower = pats.some(p => p === '蹲' || p === '髋铰链' || p === '腿后与小腿');
  const upper = pats.some(p => p === '水平推' || p === '垂直推' || p === '水平拉' || p === '垂直拉' || p === '手臂');
  let keys;
  if(lower && upper) keys = ['cardio','hip','squat','bridge','shoulder','scap'];
  else if(lower) keys = ['cardio','hip','squat','bridge','ankle'];
  else if(upper) keys = ['cardio','shoulder','band','scap','catcow'];
  else keys = ['cardio','catcow'];
  return keys.map((k, i) => Object.assign({id:i}, WARM_POOL[k]));
}

/* ---------- 训练会话 ---------- */
function lastLift(name){
  for(let i=0;i<S.history.length;i++){
    const hit = (S.history[i].lifts || []).find(l => l.ex === name);
    if(hit) return hit;
  }
  return null;
}
function prefillRow(name, cfg, setIdx){
  const info = exInfo(name);
  const last = lastLift(name);
  let weight = 0;
  if(!info.bw || (last && last.weight > 0)) weight = last ? last.weight : (info.base || 0);
  if(info.bw && !(last && last.weight > 0)) weight = 0;
  const reps = info.hold ? (cfg.repsMax || 45) : (last && last.reps ? last.reps : (cfg.repsMax || 10));
  return {weight:String(fmtNum(weight)), reps:String(reps)};
}

function exercisesOfDay(day){
  return day.exercises.map(e => ({ex:e.ex, sets:e.sets, repsMin:e.repsMin, repsMax:e.repsMax, rest:e.rest}))
    .concat((day.abs || []).map(a => Object.assign({ex:a, abs:true}, ABS_POOL[a])));
}

function makeSession(entry){
  const day = getDayById(S.plan, entry.dayId) || rotationDays()[0];
  const exs = exercisesOfDay(day);
  const sets = [];
  exs.forEach((e, ei) => {
    for(let i=0;i<e.sets;i++){
      const pf = prefillRow(e.ex, e, i);
      sets.push({ex:e.ex, exIdx:ei, setIdx:i, weight:pf.weight, reps:pf.reps, done:false});
    }
  });
  return {
    dayId: day.id,
    dayName: day.name,
    templateName: templateById(S.plan.templateId).name,
    date: entry.date || todayISO(),
    elapsed: 0,
    phase: 'warmup',
    currentEx: 0,
    warmup: warmupFor(day),
    warmupDone: [],
    exercises: exs,
    sets,
    rest: null
  };
}

/* ---------- 汇总与记录 ---------- */
function buildSummary(){
  const s = S.session;
  /* 完成组：勾选且次数/秒数有值；容量只算有重量的组（自重动作组数照常算） */
  const doneRows = s.sets.filter(x => x.done && (+x.reps) > 0);
  const weightedRows = doneRows.filter(x => (+x.weight) > 0);
  const names = [];
  s.sets.forEach(x => { if(names.indexOf(x.ex) < 0) names.push(x.ex); });
  const breakdown = names.map(name => {
    const allRows = s.sets.filter(x => x.ex === name);
    const rows = doneRows.filter(x => x.ex === name);
    const wRows = weightedRows.filter(x => x.ex === name);
    let best = null;
    wRows.forEach(r => {
      if(!best || (+r.weight) > best.weight || ((+r.weight) === best.weight && (+r.reps) > best.reps)){
        best = {weight:+r.weight, reps:+r.reps};
      }
    });
    return {name, sets:rows.length, planSets:allRows.length, best, volume:wRows.reduce((a, r) => a + (+r.weight)*(+r.reps), 0), bw:isBW(name)};
  });
  const prs = [];
  breakdown.forEach(b => {
    if(!b.best || b.bw) return;
    const old = S.prs[b.name];
    if(typeof old === 'number' && b.best.weight > old + 0.0001){
      prs.push({name:b.name, from:old, to:b.best.weight, delta:b.best.weight - old});
      S.prs[b.name] = b.best.weight;
    }else if(typeof old !== 'number'){
      S.prs[b.name] = b.best.weight;
    }
  });
  const lifts = breakdown.filter(b => b.best).map(b => ({
    ex:b.name, weight:b.best.weight, reps:b.best.reps,
    e1rm:e1rm(b.best.weight, b.best.reps), volume:b.volume, sets:b.sets
  }));
  return {
    id: uid('h'),
    date: s.date,
    dayId: s.dayId,
    workoutName: s.dayName,
    volume: weightedRows.reduce((a, r) => a + (+r.weight)*(+r.reps), 0),
    sets: doneRows.length,
    totalSets: s.sets.length,
    duration: s.elapsed,
    prs,
    breakdown,
    lifts
  };
}

/* ---------- 示例数据（仅新用户） ---------- */
function seedDemo(plan){
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const hist = [];
  const weeks = 12;
  let counter = 0;
  for(let w=weeks-1; w>=0; w--){
    for(let s=0; s<plan.freq; s++){
      const d = addDays(todayStart, -(w*7 + 2) + s*2);
      if(d >= todayStart) continue;
      const day = rotationDays(plan)[counter % plan.rotation.length];
      counter++;
      if(!day) continue;
      const exs = exercisesOfDay(day);
      const factor = 0.80 + (weeks-1-w) * 0.012;
      const lifts = [];
      let volume = 0, setsDone = 0;
      const breakdown = [];
      exs.forEach(e => {
        const info = exInfo(e.ex);
        let best = null, mVol = 0, mSets = 0;
        for(let i=0;i<e.sets;i++){
          let weight = 0;
          if(!info.bw) weight = roundStep((info.base || 20) * factor * (1 + i*0.006), info.step || 1);
          const reps = info.hold ? 45 : Math.max(e.repsMin, Math.round((e.repsMin + e.repsMax)/2) + (i === 0 ? 2 : 0));
          if(!info.bw) mVol += weight * reps;
          mSets++;
          if(weight > 0 && (!best || weight > best.weight)) best = {weight, reps};
        }
        if(best) lifts.push({ex:e.ex, weight:best.weight, reps:best.reps, e1rm:e1rm(best.weight,best.reps), volume:mVol, sets:mSets});
        breakdown.push({name:e.ex, sets:mSets, planSets:e.sets, best, volume:mVol, bw:info.bw});
        volume += mVol; setsDone += mSets;
      });
      hist.push({
        id: uid('demo'),
        date: isoOf(d),
        dayId: day.id,
        workoutName: day.name,
        volume,
        sets: setsDone,
        totalSets: setsDone,
        duration: setsDone * 95 + 420,
        prs: [],
        breakdown,
        lifts
      });
    }
  }
  hist.sort((a, b) => a.date < b.date ? 1 : -1);

  const weights = [];
  for(let d=84; d>=0; d-=3){
    weights.push({
      id: uid('w'),
      date: isoOf(addDays(today, -d)),
      kg: Math.round((78.4 - (84-d)*0.033 + Math.sin(d/5)*0.22) * 10) / 10
    });
  }
  const measures = [
    {id:uid('m'), date:isoOf(addDays(today,-84)), chest:99, waist:84, hip:97, arm:35, leg:56},
    {id:uid('m'), date:isoOf(addDays(today,-7)), chest:100, waist:81.5, hip:96, arm:35.8, leg:56.5}
  ];
  const cardio = [];
  const cTypes = ['爬坡走','跑步','单车','椭圆机','划船机','快走'];
  for(let i=0;i<9;i++){
    const type = cTypes[i % cTypes.length];
    cardio.push({
      id: uid('c'),
      date: isoOf(addDays(today, -(i*8 + 2))),
      type,
      minutes: 25 + (i % 4) * 5,
      incline: CARDIO_NO_INCLINE.indexOf(type) >= 0 ? null : (6 + i % 5),
      speed: type === '单车' ? null : Math.round((5.2 + (i % 5) * 0.6) * 10) / 10
    });
  }
  hist.sort((a, b) => a.date < b.date ? 1 : -1);
  S.history = hist;
  S.body = {weights, measures, cardio};
  S.demo = true;
}

function clearDemo(){
  S.history = [];
  S.body = {weights:[], measures:[], cardio:[]};
  S.demo = false;
  S.lastSummary = null;
  save();
}
