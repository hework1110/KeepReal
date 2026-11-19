/* ============================================================
   9. 渲染 / 面板 / 事件 / 启动
   ============================================================ */

function toast(msg, ms){
  const root = $('#toast-root');
  if(!root) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s,transform .25s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 260);
  }, ms || 2400);
}

/* 我的页：点击称呼就地改名 */
function startNameEdit(){
  const el = document.querySelector('.me-name');
  if(!el || el.querySelector('input')) return;
  const old = S.profile.name;
  const input = document.createElement('input');
  input.className = 'me-name-input';
  input.type = 'text';
  input.maxLength = 12;
  input.value = old;
  input.setAttribute('aria-label', '训练者名称');
  el.textContent = '';
  el.appendChild(input);
  input.focus();
  input.select();
  let done = false;
  const commit = () => {
    if(done) return;
    done = true;
    const v = input.value.trim();
    if(v && v !== old){ S.profile.name = v; save(); }
    el.textContent = S.profile.name;
  };
  const cancel = () => {
    if(done) return;
    done = true;
    el.textContent = old;
  };
  input.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); input.blur(); }
    else if(e.key === 'Escape'){ e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', () => { if(!done) commit(); });
}

function openConfirm(o){
  MODAL = o;
  const root = $('#modal-root');
  if(!root) return;
  root.classList.add('is-open');
  root.innerHTML = '<div class="modal-backdrop" data-action="modal-close"></div>' +
    '<div class="modal">' +
      '<h3>' + esc(o.title) + '</h3>' +
      '<p>' + (o.desc || '') + '</p>' +
      '<div class="modal-actions">' +
        '<button class="btn btn--ghost" data-action="modal-close">' + esc(o.cancelText || '取消') + '</button>' +
        '<button class="btn ' + (o.danger ? 'btn--danger' : 'btn--primary') + '" data-action="modal-ok">' + esc(o.okText || '确定') + '</button>' +
      '</div>' +
    '</div>';
}
function closeModal(){
  MODAL = null;
  const root = $('#modal-root');
  if(root){ root.classList.remove('is-open'); root.innerHTML = ''; }
}

/* ---------- 底部面板 ---------- */
function openSheet(kind, ctx){
  SHEET = {kind, ctx:ctx || {}, data:{}};
  if(kind === 'add-cardio') SHEET.data.type = CARDIO_TYPES[0];
  renderSheet();
}
function closeSheet(){
  SHEET = null;
  renderSheet();
}
function sheetStep(label, hint, field, value, unit, min, max){
  return '<div class="stepper">' +
    '<div><div class="stepper__label">' + label + '</div>' + (hint ? '<span class="stepper__hint">' + hint + '</span>' : '') + '</div>' +
    '<div class="stepper__ctrl">' +
      '<button class="stepper__btn" data-action="sheet-step" data-field="' + field + '" data-dir="-1" ' + (+value <= +min ? 'disabled' : '') + ' aria-label="减少">−</button>' +
      '<span class="stepper__val">' + value + '<small>' + unit + '</small></span>' +
      '<button class="stepper__btn" data-action="sheet-step" data-field="' + field + '" data-dir="1" ' + (+value >= +max ? 'disabled' : '') + ' aria-label="增加">+</button>' +
    '</div>' +
  '</div>';
}

function sheetHtml(){
  if(!SHEET) return '';
  const k = SHEET.kind;
  let title = '', sub = '', body = '', foot = '', danger = '';

  if(k === 'ex-config'){
    const day = SHEET.ctx.tpl ? tplDraftDay(SHEET.ctx.dayId) : getDayById(S.plan, SHEET.ctx.dayId);
    const e = day && day.exercises[SHEET.ctx.idx];
    if(!e){ SHEET = null; return ''; }
    const hold = isHold(e.ex);
    const info = exInfo(e.ex);
    title = e.ex;
    sub = info.muscle + ' · ' + info.equip;
    body = sheetStep('组数', '正式训练组，不含热身', 'sets', e.sets, '组', 1, 10) +
      (hold ?
        sheetStep('保持秒数', '平板支撑按秒计', 'repsMax', e.repsMax || 45, '秒', 15, 120) :
        sheetStep('次数下限', '区间的最小次数', 'repsMin', e.repsMin, '次', 1, 30) +
        sheetStep('次数上限', '区间的最大次数', 'repsMax', e.repsMax, '次', 1, 30)) +
      sheetStep('组间休息', '勾选完成组后自动开始', 'rest', e.rest, '秒', 15, 300);
    foot = '<div class="sheet__foot"><button class="btn btn--primary" data-action="sheet-close">完成</button></div>';
    danger = '<button class="sheet__danger" data-action="sheet-del-ex">' + icon('trash') + '从训练日移除</button>';
  }else if(k === 'ex-info'){
    const name = SHEET.ctx.name;
    const info = exInfo(name);
    const pr = bestWeightOf(name);
    const last = lastLift(name);
    title = name;
    sub = info.muscle + ' · ' + info.equip + (info.unilateral ? ' · 单侧' : '');
    body = '<div class="chips" style="margin-top:10px">' +
        '<span class="tag tag--acid">' + info.pattern + '</span>' +
        '<span class="tag">' + info.group + '</span>' +
        '<span class="tag">' + info.equip + '</span>' +
        (info.bw ? '<span class="tag">自重</span>' : '') +
        (info.custom ? '<span class="tag tag--acid">自定义</span>' : '') +
      '</div>' +
      '<div class="panel" style="margin-top:12px"><div class="panel__label">TECHNIQUE / 要点</div><div class="panel__sub" style="margin-top:7px;color:var(--sub)">' + esc(info.cue) + '</div></div>' +
      '<div class="stat-grid" style="margin-top:8px">' +
        '<div><span>最好重量</span><b>' + (info.bw ? '—' : fmtNum(pr)) + '<small>' + (info.bw ? '自重' : 'kg') + '</small></b></div>' +
        '<div><span>预估 1RM</span><b>' + (last && e1rm(last.weight, last.reps) ? fmtNum(e1rm(last.weight, last.reps)) : '—') + '<small>kg</small></b></div>' +
        '<div><span>上次</span><b>' + (last ? last.reps : '—') + '<small>' + (last ? '次' : '') + '</small></b></div>' +
      '</div>' +
      (last ? '<p class="form-tip">上次记录：' + (last.weight > 0 ? fmtNum(last.weight) + ' kg × ' : '自重 × ') + last.reps + '</p>' : '');
    foot = '<div class="sheet__foot"><button class="btn btn--primary" data-action="sheet-close">知道了</button></div>';
  }else if(k === 'add-weight'){
    const ws = weightsAsc();
    const last = ws.length ? ws[ws.length - 1] : null;
    title = '记录体重';
    sub = '建议固定在早晨、空腹、同一台秤上记录';
    body = '<div class="form-row"><label class="form-label">日期</label>' +
        '<input class="form-input" id="sheet-date" type="date" value="' + todayISO() + '" max="' + todayISO() + '"></div>' +
      '<div class="form-row"><label class="form-label">体重 <span>kg</span></label>' +
        '<input class="form-input" id="sheet-kg" type="number" step="0.1" min="20" max="300" inputmode="decimal" placeholder="例如 72.4" value="' + (last ? fmtNum(last.kg) : '') + '"></div>' +
      '<div class="form-row"><label class="form-label">体脂率 <span>% · 选填</span></label>' +
        '<input class="form-input" id="sheet-bf" type="number" step="0.1" min="3" max="60" inputmode="decimal" placeholder="例如 18.2，可留空"></div>' +
      '<p class="form-tip">体重和体脂至少填一项；同一天重复记录会覆盖当天数值，曲线里的绿色线是 7 日移动平均。</p>';
    foot = '<div class="sheet__foot"><button class="btn btn--ghost" data-action="sheet-close">取消</button><button class="btn btn--primary" data-action="sheet-save">保存记录</button></div>';
  }else if(k === 'add-measure'){
    const m = measuresAsc().length ? measuresAsc()[measuresAsc().length - 1] : {};
    title = '记录围度';
    sub = '同一部位保持相同测量位置，可只填其中几项';
    body = '<div class="form-row"><label class="form-label">日期</label>' +
        '<input class="form-input" id="sheet-date" type="date" value="' + todayISO() + '" max="' + todayISO() + '"></div>' +
      '<div class="form-split" style="margin-top:12px">' + MEASURES.map(x =>
        '<div class="form-row" style="margin-top:0"><label class="form-label">' + x.name + ' <span>cm</span></label>' +
          '<input class="form-input" id="sheet-' + x.key + '" type="number" step="0.1" min="10" max="200" inputmode="decimal" placeholder="—" value="' + (typeof m[x.key] === 'number' ? fmtNum(m[x.key]) : '') + '"></div>'
      ).join('') + '</div>' +
      '<p class="form-tip">围度变化会和上一次记录对比；同一天重复填写会合并到同一条记录。</p>';
    foot = '<div class="sheet__foot"><button class="btn btn--ghost" data-action="sheet-close">取消</button><button class="btn btn--primary" data-action="sheet-save">保存记录</button></div>';
  }else if(k === 'add-cardio'){
    const type = SHEET.data.type || CARDIO_TYPES[0];
    title = '记录有氧';
    sub = '项目、时长、坡度、速度四个字段';
    const optional = CARDIO_NO_INCLINE.indexOf(type) >= 0;
    body = '<div class="form-row"><label class="form-label">日期</label>' +
        '<input class="form-input" id="sheet-date" type="date" value="' + todayISO() + '" max="' + todayISO() + '"></div>' +
      '<div class="form-row"><label class="form-label">项目</label><div class="chip-group">' +
        CARDIO_TYPES.map(t => '<button class="chip ' + (t === type ? 'is-on' : '') + '" data-action="sheet-type" data-value="' + t + '">' + t + '</button>').join('') +
      '</div></div>' +
      '<div class="form-split" style="margin-top:12px">' +
        '<div class="form-row" style="margin-top:0"><label class="form-label">时长 <span>分钟</span></label>' +
          '<input class="form-input" id="sheet-minutes" type="number" step="1" min="1" max="300" inputmode="numeric" placeholder="30"></div>' +
        '<div class="form-row" style="margin-top:0"><label class="form-label">坡度 <span>%</span></label>' +
          '<input class="form-input" id="sheet-incline" type="number" step="0.5" min="0" max="40" inputmode="decimal" placeholder="' + (optional ? '可留空' : '6') + '"></div>' +
      '</div>' +
      '<div class="form-row"><label class="form-label">速度 <span>km/h</span></label>' +
        '<input class="form-input" id="sheet-speed" type="number" step="0.1" min="0" max="40" inputmode="decimal" placeholder="' + (type === '划船机' ? '可留空' : '5.5') + '"></div>' +
      '<p class="form-tip">跑步和单车的坡度可以留空；速度按器械显示填写，不填也能保存。</p>';
    foot = '<div class="sheet__foot"><button class="btn btn--ghost" data-action="sheet-close">取消</button><button class="btn btn--primary" data-action="sheet-save">保存记录</button></div>';
  }

  return '<div class="sheet-backdrop" data-action="sheet-close"></div>' +
    '<div class="sheet">' +
      '<div class="sheet__grip"></div>' +
      '<div class="sheet__head"><div><div class="sheet__title">' + esc(title) + '</div><div class="sheet__sub">' + esc(sub) + '</div></div>' +
        '<button class="sheet__close" data-action="sheet-close" aria-label="关闭">' + icon('x') + '</button></div>' +
      '<div class="sheet__body">' + body + '</div>' +
      foot + danger +
    '</div>';
}

function renderSheet(){
  const root = $('#sheet-root');
  if(!root) return;
  if(!SHEET){ root.classList.remove('is-open'); root.innerHTML = ''; return; }
  root.classList.add('is-open');
  root.innerHTML = sheetHtml();
}

/* ---------- 导航与渲染 ---------- */
function topOfStack(){ return NAV.stack.length ? NAV.stack[NAV.stack.length - 1] : null; }
function goTab(tab){
  S.view = 'main';
  S.ui.tab = tab;
  NAV = {tab, stack:[]};
  save();
  render();
}
function push(name, data){
  NAV.stack.push(Object.assign({name}, data || {}));
  render();
}
function pop(){
  NAV.stack.pop();
  render({keep:true});
}
function getScroll(){
  const b = $('.screen__body');
  return b ? b.scrollTop : 0;
}
function render(opts){
  const keep = !!(opts && opts.keep);
  const prev = keep ? getScroll() : 0;
  const app = $('#app');
  if(!app) return;
  let html;
  if(!S.plan) html = viewOnboarding();
  else if(S.view === 'onboarding') html = viewOnboarding();
  else if(S.view === 'workout') html = viewWorkout();
  else if(S.view === 'summary') html = viewSummary();
  else html = currentMain();
  app.innerHTML = html;
  if(keep){
    requestAnimationFrame(() => {
      const b = $('.screen__body');
      if(b) b.scrollTop = prev;
    });
  }
  renderSheet();
  const mr = $('#modal-root');
  if(mr && !MODAL){ mr.classList.remove('is-open'); mr.innerHTML = ''; }
}

function currentMain(){
  const sub = topOfStack();
  if(sub){
    if(sub.name === 'planDay') return viewPlanDay(sub.dayId);
    if(sub.name === 'planEdit') return viewPlanEdit(sub.dayId);
    if(sub.name === 'picker') return viewPicker(sub.dayId);
    if(sub.name === 'library') return viewLibrary();
    if(sub.name === 'customEx') return viewCustomEx();
    if(sub.name === 'templates') return viewTemplates();
    if(sub.name === 'template') return viewTemplateDetail(sub.id);
    if(sub.name === 'tplEdit') return viewTplEdit();
    if(sub.name === 'tplpicker') return viewTplPicker(sub.dayId);
  }
  if(S.ui.tab === 'plan') return viewPlan();
  if(S.ui.tab === 'progress') return viewProgress();
  if(S.ui.tab === 'body') return viewBody();
  if(S.ui.tab === 'me') return viewMe();
  return viewToday();
}

function finishNow(){
  if(!S.session) return;
  const sum = buildSummary();
  S.history.unshift(sum);
  S.lastSummary = sum;
  S.session = null;
  S.selectedDay = 0;
  S.view = 'summary';
  save();
  render();
}

function requestFinish(){
  if(!S.session) return;
  const done = S.session.sets.filter(x => x.done).length;
  if(!done){ toast('还没有勾选完成的组'); return; }
  openConfirm({
    title: '完成本次训练？',
    desc: '已勾选 <b style="color:var(--text)">' + done + '</b> 组，将写入本机训练历史并结算 PR。热身不计入容量。',
    okText: '完成训练',
    onOk: finishNow
  });
}

function startRest(row){
  const s = S.session;
  const idx = s.sets.indexOf(row);
  const next = s.sets.slice(idx + 1).find(x => !x.done);
  const ex = s.exercises[row.exIdx];
  s.rest = {
    until: Date.now() + ex.rest * 1000,
    total: ex.rest * 1000,
    next: next ? (next.ex === row.ex ? '第 ' + (next.setIdx + 1) + ' 组 · ' + next.ex : next.ex) : '最后一个动作完成'
  };
}

function refreshResults(){
  const box = $('#lib-results');
  const top = topOfStack();
  if(!box || !top) return;
  const mode = top.name === 'picker' ? 'pick' : (top.name === 'tplpicker' ? 'tplpick' : 'browse');
  box.innerHTML = libResultsHtml(mode, top.dayId);
}

function addExercise(dayId, name){
  const day = getDayById(S.plan, dayId);
  if(!day) return false;
  if(day.exercises.some(e => e.ex === name)){ toast('这个动作已经在训练日里'); return false; }
  const info = exInfo(name);
  let cfg;
  if(info.hold) cfg = {ex:name, sets:3, repsMin:45, repsMax:45, rest:60};
  else if(info.pattern === '核心') cfg = {ex:name, sets:3, repsMin:12, repsMax:15, rest:60};
  else cfg = {ex:name, sets:3, repsMin:8, repsMax:12, rest:90};
  day.exercises.push(cfg);
  save();
  return true;
}

function doCopyTemplate(id){
  const tpl = customTemplateById(id) || TEMPLATES.find(t => t.id === id);
  if(!tpl) return;
  const goal = S.plan ? S.plan.goal : (S.onboard.goal || 'muscle');
  const freq = S.plan ? S.plan.freq : (S.onboard.freq || 3);
  const start = S.plan ? S.plan.startDate : todayISO();
  S.plan = buildPlan(tpl, goal, freq, start);
  S.session = null;
  S.selectedDay = 0;
  S.view = 'main';
  S.ui.tab = 'plan';
  NAV = {tab:'plan', stack:[{name:'planDay', dayId:S.plan.days[0].id}]};
  save();
  render();
  toast('已复制「' + tpl.name + '」，可以开始调整');
}

/* ---------- 自定义模板 ---------- */
function startNewTemplate(){
  TPL_DRAFT = {id:uid('tpl'), name:'', days:[emptyTplDay(1)]};
  libQuery = '';
  NAV.stack.push({name:'tplEdit'});
  render();
}
function startEditTemplate(id){
  const t = customTemplateById(id);
  if(!t) return;
  TPL_DRAFT = JSON.parse(JSON.stringify(t));
  libQuery = '';
  NAV.stack.push({name:'tplEdit'});
  render();
}
function syncTplDraft(){
  if(!TPL_DRAFT) return;
  const nameEl = $('#tpl-name');
  if(nameEl) TPL_DRAFT.name = nameEl.value;
  $$('.tpl-day-name').forEach(el => {
    const day = tplDraftDay(el.dataset.dayId);
    if(day) day.name = el.value;
  });
}
function addTplExercise(dayId, name){
  const day = tplDraftDay(dayId);
  if(!day) return false;
  if(day.exercises.some(e => e.ex === name)){ toast('这个动作已经在训练日里'); return false; }
  const info = exInfo(name);
  let cfg;
  if(info.hold) cfg = {ex:name, sets:3, repsMin:45, repsMax:45, rest:60};
  else if(info.pattern === '核心') cfg = {ex:name, sets:3, repsMin:12, repsMax:15, rest:60};
  else cfg = {ex:name, sets:3, repsMin:8, repsMax:12, rest:90};
  day.exercises.push(cfg);
  return true;
}
function saveTplDraft(){
  if(!TPL_DRAFT) return;
  syncTplDraft();
  const name = (TPL_DRAFT.name || '').trim();
  if(!name){ toast('请填写模板名称'); return; }
  if(!TPL_DRAFT.days.length){ toast('至少添加一个训练日'); return; }
  for(let i=0;i<TPL_DRAFT.days.length;i++){
    const day = TPL_DRAFT.days[i];
    day.name = (day.name || '').trim() || ('Day ' + (i + 1));
    if(!day.exercises.length){ toast('「' + day.name + '」至少添加一个动作'); return; }
  }
  TPL_DRAFT.name = name;
  const clean = JSON.parse(JSON.stringify(TPL_DRAFT));
  const idx = S.templates.findIndex(t => t.id === clean.id);
  if(idx >= 0) S.templates[idx] = clean;
  else S.templates.push(clean);
  save();
  TPL_DRAFT = null;
  NAV.stack = [{name:'templates'}];
  render();
  toast('模板已保存');
}

function syncCustomDraft(){
  const el = $('#custom-name');
  if(el) CUSTOM_DRAFT.name = el.value;
}

/* ---------- 动作分发 ---------- */
function handleAction(a, el){
  const ds = el.dataset;
  switch(a){
    case 'go-tab': goTab(ds.tab); break;
    case 'back': pop(); break;

    /* 引导 */
    case 'ob-goal': S.onboard.goal = ds.value; save(); render({keep:true}); break;
    case 'ob-freq': S.onboard.freq = +ds.value; save(); render({keep:true}); break;
    case 'ob-template': S.onboard.template = ds.value; save(); render({keep:true}); break;
    case 'ob-back': S.onboard.step = Math.max(1, (S.onboard.step || 1) - 1); save(); render(); break;
    case 'ob-next': S.onboard.step = Math.min(3, (S.onboard.step || 1) + 1); save(); render(); break;
    case 'ob-generate': startGenerate(); break;

    /* 今天 / 训练 */
    case 'select-day': S.selectedDay = Math.min(6, +ds.day || 0); save(); render({keep:true}); break;
    case 'start': {
      const entry = S.plan.schedule[0];
      if(!entry || entry.type !== 'train') return;
      S.session = makeSession(entry);
      S.view = 'workout';
      calcFor = -1;
      save();
      render();
      break;
    }
    case 'resume':
      if(!S.session) return;
      S.view = 'workout';
      save();
      render();
      break;
    case 'exit-workout':
      openConfirm({
        title: '退出训练？',
        desc: '已勾选的组会保留为草稿，回到「今天」可以继续。',
        okText: '保存并退出',
        onOk: () => {
          S.view = 'main'; S.ui.tab = 'today'; NAV = {tab:'today', stack:[]};
          save(); render();
        }
      });
      break;
    case 'finish-workout': requestFinish(); break;
    case 'warm-toggle': {
      const i = +ds.idx;
      if(!S.session) return;
      const at = S.session.warmupDone.indexOf(i);
      if(at >= 0) S.session.warmupDone.splice(at, 1);
      else S.session.warmupDone.push(i);
      save();
      render({keep:true});
      break;
    }
    case 'start-training':
    case 'skip-warm':
      if(!S.session) return;
      S.session.phase = 'train';
      S.session.currentEx = 0;
      S.session.rest = null;
      calcFor = -1;
      save();
      render();
      break;
    case 'goto-warmup':
      if(!S.session) return;
      S.session.phase = 'warmup';
      S.session.rest = null;
      save();
      render();
      break;
    case 'goto-ex':
      if(!S.session) return;
      S.session.phase = 'train';
      S.session.currentEx = +ds.idx;
      S.session.rest = null;
      calcFor = -1;
      save();
      render();
      break;
    case 'toggle-calc': calcFor = calcFor === +ds.idx ? -1 : +ds.idx; render({keep:true}); break;
    case 'toggle-set': {
      const s = S.session;
      if(!s) return;
      const row = s.sets[+ds.row];
      if(!row) return;
      const info = exInfo(row.ex);
      const w = parseFloat(row.weight), reps = parseFloat(row.reps);
      if(!(reps > 0)){ toast(info.hold ? '请填写保持秒数' : '请填写次数'); return; }
      if(!info.bw && !(w > 0)){ toast('请填写重量'); return; }
      row.done = !row.done;
      row.weight = String(w > 0 ? w : 0);
      row.reps = String(reps);
      if(row.done) startRest(row);
      save();
      render({keep:true});
      break;
    }
    case 'copy-first': {
      const s = S.session;
      if(!s) return;
      const rows = s.sets.filter(x => x.exIdx === +ds.idx);
      if(!rows.length) return;
      rows.filter(x => !x.done).forEach(x => { x.weight = rows[0].weight; x.reps = rows[0].reps; });
      save();
      render({keep:true});
      toast('已复制首组的重量与次数');
      break;
    }
    case 'prev-ex':
      if(!S.session) return;
      S.session.currentEx = Math.max(0, S.session.currentEx - 1);
      S.session.rest = null;
      calcFor = -1;
      save();
      render();
      break;
    case 'next-ex': {
      const s = S.session;
      if(!s) return;
      if(s.currentEx >= s.exercises.length - 1){ requestFinish(); return; }
      s.currentEx++;
      s.rest = null;
      calcFor = -1;
      save();
      render();
      break;
    }
    case 'rest-skip':
      if(S.session){ S.session.rest = null; save(); render({keep:true}); }
      break;
    case 'rest-minus':
    case 'rest-plus': {
      const s = S.session;
      if(!s || !s.rest) return;
      const delta = a === 'rest-plus' ? 15000 : -15000;
      s.rest.until += delta;
      s.rest.total = Math.max(5000, s.rest.total + delta);
      if(s.rest.until <= Date.now()) s.rest = null;
      save();
      render({keep:true});
      break;
    }
    case 'view-summary': {
      const h = S.history.find(x => x.date === todayISO()) || S.history[0];
      if(!h) return;
      S.lastSummary = h;
      S.view = 'summary';
      save();
      render();
      break;
    }
    case 'go-home':
      S.view = 'main';
      S.ui.tab = 'today';
      NAV = {tab:'today', stack:[]};
      S.selectedDay = 0;
      save();
      render();
      break;

    /* 计划 */
    case 'open-plan-day': push('planDay', {dayId:ds.dayId}); break;
    case 'select-plan-day': {
      const top = topOfStack();
      if(top) top.dayId = ds.dayId;
      render({keep:true});
      break;
    }
    case 'edit-day': push('planEdit', {dayId:ds.dayId}); break;
    case 'plan-edit-done': {
      const top = topOfStack();
      if(top && (top.name === 'picker' || top.name === 'planEdit')) NAV.stack.pop();
      else { NAV.stack = []; S.ui.tab = 'plan'; }
      render({keep:true});
      break;
    }
    case 'open-picker': libQuery = ''; push('picker', {dayId:ds.dayId}); break;
    case 'config-ex': {
      const top = topOfStack();
      if(top) openSheet('ex-config', {dayId:top.dayId, idx:+ds.idx});
      break;
    }
    case 'picker-add':
      if(addExercise(ds.dayId, ds.ex)){ refreshResults(); toast('已加入训练日'); }
      break;

    /* 动作库 / 自定义 */
    case 'open-library': libQuery = ''; push('library'); break;
    case 'lib-group': S.ui.libGroup = ds.value; save(); render({keep:true}); break;
    case 'lib-equip': S.ui.libEquip = ds.value; save(); render({keep:true}); break;
    case 'lib-info': openSheet('ex-info', {name:ds.ex}); break;
    case 'new-custom':
      CUSTOM_DRAFT = {name:'', group:'胸', equip:'哑铃', unilateral:false};
      push('customEx');
      break;
    case 'custom-group': syncCustomDraft(); CUSTOM_DRAFT.group = ds.value; save(); render({keep:true}); break;
    case 'custom-equip': syncCustomDraft(); CUSTOM_DRAFT.equip = ds.value; save(); render({keep:true}); break;
    case 'custom-unilateral':
      syncCustomDraft();
      CUSTOM_DRAFT.unilateral = !CUSTOM_DRAFT.unilateral;
      save();
      render({keep:true});
      break;
    case 'custom-save': {
      syncCustomDraft();
      const name = (CUSTOM_DRAFT.name || '').trim();
      if(!name){ toast('请填写动作名称'); return; }
      if(name.length > 20){ toast('动作名称最多 20 个字'); return; }
      if(allExNames().some(n => n.toLowerCase() === name.toLowerCase())){ toast('动作库里已经有同名动作'); return; }
      S.customEx.push({name, group:CUSTOM_DRAFT.group, equip:CUSTOM_DRAFT.equip, unilateral:CUSTOM_DRAFT.unilateral});
      save();
      NAV.stack.pop();
      CUSTOM_DRAFT = {name:'', group:'胸', equip:'哑铃', unilateral:false};
      toast('自定义动作已保存');
      render({keep:true});
      break;
    }

    /* 模板 */
    case 'open-templates': push('templates'); break;
    case 'open-template': push('template', {id:ds.id}); break;
    case 'open-my-template': push('template', {id:ds.id}); break;
    case 'new-template': startNewTemplate(); break;
    case 'tpl-edit': startEditTemplate(ds.id); break;
    case 'tpl-delete': {
      const t = customTemplateById(ds.id);
      if(!t) return;
      openConfirm({
        title: '删除「' + t.name + '」？',
        desc: '只会删除这套自定义模板，已复制出的计划和训练历史不受影响。',
        okText: '删除模板',
        danger: true,
        onOk: () => {
          S.templates = S.templates.filter(x => x.id !== ds.id);
          save();
          NAV.stack = [{name:'templates'}];
          render();
          toast('模板已删除');
        }
      });
      break;
    }
    case 'tpl-add-day':
      if(!TPL_DRAFT) return;
      TPL_DRAFT.days.push(emptyTplDay(TPL_DRAFT.days.length + 1));
      render({keep:true});
      break;
    case 'tpl-del-day': {
      if(!TPL_DRAFT) return;
      if(TPL_DRAFT.days.length <= 1){ toast('至少保留一个训练日'); return; }
      TPL_DRAFT.days = TPL_DRAFT.days.filter(d => d.id !== ds.dayId);
      render({keep:true});
      break;
    }
    case 'tpl-open-picker': libQuery = ''; push('tplpicker', {dayId:ds.dayId}); break;
    case 'tpl-picker-add':
      if(addTplExercise(ds.dayId, ds.ex)){ refreshResults(); toast('已加入训练日'); }
      break;
    case 'tpl-picker-done': NAV.stack.pop(); render({keep:true}); break;
    case 'tpl-config-ex': openSheet('ex-config', {tpl:true, dayId:ds.dayId, idx:+ds.idx}); break;
    case 'tpl-del-ex': {
      const day = tplDraftDay(ds.dayId);
      if(!day) return;
      day.exercises.splice(+ds.idx, 1);
      render({keep:true});
      toast('动作已删除');
      break;
    }
    case 'tpl-save': saveTplDraft(); break;
    case 'copy-template': {
      const t = customTemplateById(ds.id) || TEMPLATES.find(x => x.id === ds.id);
      if(!t) return;
      openConfirm({
        title: '复制「' + t.name + '」？',
        desc: '当前训练日安排会被模板替换，训练历史、PR 和身体数据都会保留。' + (S.session ? '<br><b style="color:#FFB18F">未完成的训练草稿会被放弃。</b>' : ''),
        okText: '复制模板',
        onOk: () => doCopyTemplate(ds.id)
      });
      break;
    }

    /* 进步 */
    case 'range': S.ui.progressRange = ds.value; save(); render({keep:true}); break;
    case 'progress-ex': S.ui.progressEx = ds.ex; save(); render({keep:true}); break;
    case 'pr-all': S.ui.prAll = !S.ui.prAll; save(); render({keep:true}); break;

    /* 身体 */
    case 'edit-name': startNameEdit(); break;
    case 'add-weight': openSheet('add-weight'); break;
    case 'add-measure': openSheet('add-measure'); break;
    case 'add-cardio': openSheet('add-cardio'); break;
    case 'del-weight':
      S.body.weights = S.body.weights.filter(w => w.id !== ds.id);
      save();
      render({keep:true});
      toast('体重记录已删除');
      break;
    case 'del-cardio':
      S.body.cardio = S.body.cardio.filter(c => c.id !== ds.id);
      save();
      render({keep:true});
      toast('有氧记录已删除');
      break;

    /* 我的 */
    case 'clear-demo':
      openConfirm({
        title: '清空示例数据？',
        desc: '会移除生成的训练历史、体重、围度和有氧记录，保留你的计划与自定义动作。',
        okText: '清空示例',
        onOk: () => { clearDemo(); toast('示例数据已清空'); render({keep:true}); }
      });
      break;
    case 'reset':
      openConfirm({
        title: '重置全部数据？',
        desc: '计划、训练历史、PR、身体记录和自定义动作都会被清除，回到初次引导。该操作不可撤销。',
        okText: '确认重置',
        danger: true,
        onOk: () => {
          try{ localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); }catch(e){}
          S = defaultState();
          NAV = {tab:'today', stack:[]};
          SHEET = null;
          closeModal();
          render();
          toast('已恢复初始状态');
        }
      });
      break;

    /* 面板与弹窗 */
    case 'sheet-close':
      closeSheet();
      render({keep:true});
      break;
    case 'sheet-step': {
      if(!SHEET || SHEET.kind !== 'ex-config') return;
      const day = SHEET.ctx.tpl ? tplDraftDay(SHEET.ctx.dayId) : getDayById(S.plan, SHEET.ctx.dayId);
      const e = day && day.exercises[SHEET.ctx.idx];
      if(!e) return;
      const f = ds.field, d = +ds.dir;
      const hold = isHold(e.ex);
      if(f === 'sets') e.sets = Math.max(1, Math.min(10, e.sets + d));
      else if(f === 'repsMin') e.repsMin = Math.max(1, Math.min(e.repsMax, e.repsMin + d));
      else if(f === 'repsMax'){
        if(hold){
          const v = Math.max(15, Math.min(120, (e.repsMax || 45) + d * 5));
          e.repsMin = v; e.repsMax = v;
        }else{
          e.repsMax = Math.max(e.repsMin, Math.min(30, e.repsMax + d));
        }
      }else if(f === 'rest') e.rest = Math.max(15, Math.min(300, e.rest + d * 15));
      if(!SHEET.ctx.tpl) save();
      renderSheet();
      break;
    }
    case 'sheet-del-ex': {
      if(!SHEET) return;
      const day = SHEET.ctx.tpl ? tplDraftDay(SHEET.ctx.dayId) : getDayById(S.plan, SHEET.ctx.dayId);
      if(!day) return;
      if(!SHEET.ctx.tpl && day.exercises.length <= 1){ toast('每个训练日至少保留一个动作'); return; }
      day.exercises.splice(SHEET.ctx.idx, 1);
      if(!SHEET.ctx.tpl) save();
      closeSheet();
      render({keep:true});
      toast('动作已从训练日移除');
      break;
    }
    case 'sheet-type': {
      if(!SHEET) return;
      SHEET.data.type = ds.value;
      $$('[data-action="sheet-type"]').forEach(b => b.classList.toggle('is-on', b.dataset.value === ds.value));
      const inc = $('#sheet-incline');
      if(inc) inc.placeholder = CARDIO_NO_INCLINE.indexOf(ds.value) >= 0 ? '可留空' : '6';
      break;
    }
    case 'sheet-save': {
      if(!SHEET) return;
      const kind = SHEET.kind;
      if(kind === 'add-weight'){
        const date = ($('#sheet-date') || {}).value || todayISO();
        const kgRaw = (($('#sheet-kg') || {}).value || '').trim();
        const bfRaw = (($('#sheet-bf') || {}).value || '').trim();
        if(!kgRaw && !bfRaw){ toast('请至少填写体重或体脂率'); return; }
        const kg = parseFloat(kgRaw);
        const bf = parseFloat(bfRaw);
        if(kgRaw && !(kg >= 20 && kg <= 300)){ toast('请输入 20-300 kg 之间的体重'); return; }
        if(bfRaw && !(bf >= 3 && bf <= 60)){ toast('请输入 3-60% 之间的体脂率'); return; }
        const patch = {};
        if(kgRaw) patch.kg = Math.round(kg * 10) / 10;
        if(bfRaw) patch.bf = Math.round(bf * 10) / 10;
        const same = S.body.weights.find(w => w.date === date);
        if(same) Object.assign(same, patch);
        else S.body.weights.push(Object.assign({id:uid('w'), date, kg:0}, patch));
        save();
        closeSheet();
        render({keep:true});
        toast(same ? '当天记录已更新' : '记录已保存');
      }else if(kind === 'add-measure'){
        const date = ($('#sheet-date') || {}).value || todayISO();
        const vals = {};
        let any = false;
        MEASURES.forEach(m => {
          const v = parseFloat(($('#sheet-' + m.key) || {}).value);
          if(v >= 10 && v <= 200){ vals[m.key] = Math.round(v * 10) / 10; any = true; }
        });
        if(!any){ toast('至少填写一项围度'); return; }
        const same = S.body.measures.find(m => m.date === date);
        if(same) Object.assign(same, vals);
        else S.body.measures.push(Object.assign({id:uid('m'), date}, vals));
        save();
        closeSheet();
        render({keep:true});
        toast(same ? '当天围度已合并' : '围度已记录');
      }else if(kind === 'add-cardio'){
        const date = ($('#sheet-date') || {}).value || todayISO();
        const minutes = parseFloat(($('#sheet-minutes') || {}).value);
        if(!(minutes > 0)){ toast('请填写有氧时长'); return; }
        if(minutes > 300){ toast('单次时长请不超过 300 分钟'); return; }
        const inclineRaw = ($('#sheet-incline') || {}).value;
        const speedRaw = ($('#sheet-speed') || {}).value;
        const type = SHEET.data.type || CARDIO_TYPES[0];
        const incline = inclineRaw === '' ? null : Math.max(0, Math.min(40, parseFloat(inclineRaw)));
        const speed = speedRaw === '' ? null : Math.max(0, Math.min(40, parseFloat(speedRaw)));
        S.body.cardio.push({id:uid('c'), date, type, minutes, incline, speed});
        save();
        closeSheet();
        render({keep:true});
        toast('有氧已记录');
      }
      break;
    }
    case 'modal-close': closeModal(); break;
    case 'modal-ok': {
      const fn = MODAL && MODAL.onOk;
      closeModal();
      if(typeof fn === 'function') fn();
      break;
    }
  }
}

/* ---------- 输入 ---------- */
function onInput(e){
  const t = e.target;
  if(t.classList && t.classList.contains('set-input')){
    if(!S.session) return;
    const row = S.session.sets[+t.dataset.set];
    if(row){ row[t.dataset.field] = t.value; saveSoon(); }
    return;
  }
  if(t.id === 'lib-search'){
    libQuery = t.value;
    refreshResults();
    return;
  }
  if(t.id === 'custom-name'){ CUSTOM_DRAFT.name = t.value; }
  if(t.id === 'tpl-name' && TPL_DRAFT){ TPL_DRAFT.name = t.value; }
  if(t.classList && t.classList.contains('tpl-day-name')){
    const day = tplDraftDay(t.dataset.dayId);
    if(day) day.name = t.value;
  }
}

/* ---------- 定时器 ---------- */
let lastTick = Date.now();
let saveTick = 0;
function tick(){
  const now = Date.now();
  const dt = Math.min(2, (now - lastTick) / 1000);
  lastTick = now;
  if(S.view === 'workout' && S.session){
    S.session.elapsed = (S.session.elapsed || 0) + dt;
    saveTick += dt;
    const meta = $('.wk-head__meta');
    if(meta && S.session.phase !== 'warmup'){
      meta.textContent = 'EX ' + pad(S.session.currentEx + 1) + ' / ' + pad(S.session.exercises.length) + ' · ' + fmtClock(S.session.elapsed);
    }
    if(S.session.rest){
      const left = S.session.rest.until - now;
      if(left <= 0){
        S.session.rest = null;
        save();
        render({keep:true});
      }else{
        const t = $('#rest-time'), bar = $('#rest-bar');
        if(t) t.textContent = fmtMs(left);
        if(bar) bar.style.width = Math.min(100, left / S.session.rest.total * 100) + '%';
      }
    }
    if(saveTick > 4){ saveTick = 0; save(); }
  }
}

/* ---------- 拖动排序（计划编辑） ---------- */
let DRAG = null;

function startDrag(e, handle){
  if(DRAG) return;
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  const row = handle.closest('[data-drag-row]');
  const list = row && row.closest('[data-drag-list]');
  if(!row || !list) return;
  const rows = Array.prototype.slice.call(list.querySelectorAll('[data-drag-row]'));
  const idx = rows.indexOf(row);
  if(idx < 0) return;
  e.preventDefault();
  const rect = row.getBoundingClientRect();
  DRAG = {
    row, list, rows, idx, newIdx: idx, handle, pointerId: e.pointerId,
    startY: e.clientY, center: rect.top + rect.height / 2,
    rowH: rect.height,
    tops: rows.map(r => r.getBoundingClientRect().top),
    heights: rows.map(r => r.offsetHeight)
  };
  row.classList.add('is-dragging');
  list.classList.add('is-sorting');
  document.body.classList.add('is-drag-sorting');
  row.style.transform = 'translate3d(0,0,0) scale(1.01)';
  try{ handle.setPointerCapture(e.pointerId); }catch(_){}
  document.addEventListener('pointermove', onDragMove, {passive:false});
  document.addEventListener('pointerup', onDragEnd);
  document.addEventListener('pointercancel', onDragEnd);
  window.addEventListener('wheel', blockDragWheel, {passive:false});
}

function blockDragWheel(e){ e.preventDefault(); }

function onDragMove(e){
  if(!DRAG || e.pointerId !== DRAG.pointerId) return;
  e.preventDefault();
  const dy = e.clientY - DRAG.startY;
  DRAG.row.style.transform = 'translate3d(0,' + dy + 'px,0) scale(1.01)';
  const center = DRAG.center + dy;
  let idx = 0;
  DRAG.rows.forEach((r, i) => {
    if(i === DRAG.idx) return;
    if(DRAG.tops[i] + DRAG.heights[i] / 2 < center) idx++;
  });
  DRAG.newIdx = idx;
  DRAG.rows.forEach((r, i) => {
    if(i === DRAG.idx) return;
    let shift = 0;
    if(idx < DRAG.idx && i >= idx && i < DRAG.idx) shift = DRAG.rowH;
    else if(idx > DRAG.idx && i > DRAG.idx && i <= idx) shift = -DRAG.rowH;
    r.style.transform = shift ? 'translate3d(0,' + shift + 'px,0)' : '';
  });
}

function onDragEnd(){
  if(!DRAG) return;
  const d = DRAG;
  DRAG = null;
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  document.removeEventListener('pointercancel', onDragEnd);
  window.removeEventListener('wheel', blockDragWheel);
  try{ d.handle.releasePointerCapture(d.pointerId); }catch(_){}
  d.row.classList.remove('is-dragging');
  d.list.classList.remove('is-sorting');
  document.body.classList.remove('is-drag-sorting');
  d.rows.forEach(r => { r.style.transform = ''; });
  if(d.newIdx === d.idx) return;
  const tplDayId = d.list.dataset.tplDayId;
  const day = tplDayId ? tplDraftDay(tplDayId) : getDayById(S.plan, d.list.dataset.dayId);
  if(!day) return;
  const moved = day.exercises.splice(d.idx, 1)[0];
  day.exercises.splice(d.newIdx, 0, moved);
  if(!tplDayId) save();
  render({keep:true});
}

/* ---------- 启动 ---------- */
function boot(){
  S = loadState();
  ensurePlanFresh();
  if(S.plan && S.view === 'onboarding') S.view = 'main';
  if(!S.plan) S.view = 'onboarding';
  if(S.view === 'workout' && !S.session) S.view = 'main';
  if(S.view === 'summary' && !S.lastSummary) S.view = 'main';
  const validTabs = TABS.map(t => t.id);
  if(validTabs.indexOf(S.ui.tab) < 0) S.ui.tab = 'today';
  if(S.session && S.session.date !== todayISO()) S.session = null;
  if(S.view === 'main' && !S.plan) S.view = 'onboarding';
  NAV = {tab:S.ui.tab, stack:[]};
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if(!el) return;
    if(el.tagName !== 'INPUT') e.preventDefault();
    handleAction(el.dataset.action, el);
  });
  document.addEventListener('input', onInput);
  document.addEventListener('pointerdown', e => {
    const handle = e.target.closest && e.target.closest('[data-drag-handle]');
    if(handle) startDrag(e, handle);
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      if(SHEET){ closeSheet(); render({keep:true}); }
      else if(MODAL) closeModal();
    }
  });
  render();
  setInterval(tick, 500);
}

boot();
