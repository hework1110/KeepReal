/* ============================================================
   4. 计划 / 模板库 / 动作库
   ============================================================ */

let CUSTOM_DRAFT = {name:'', group:'胸', equip:'哑铃', unilateral:false};
let TPL_DRAFT = null;

function emptyTplDay(n){
  return {id:uid('td'), name:'Day ' + (n || 1), exercises:[]};
}
function tplDraftDay(id){
  return TPL_DRAFT ? TPL_DRAFT.days.find(d => d.id === id) : null;
}

function allExNames(){
  return Object.keys(EX_LIB).concat((S.customEx || []).map(c => c.name));
}
function bestWeightOf(name){
  if(typeof S.prs[name] === 'number') return S.prs[name];
  const info = exInfo(name);
  return info.pr || 0;
}
function libRow(name, mode, dayId){
  const info = exInfo(name);
  const pr = bestWeightOf(name);
  const last = lastLift(name);
  const pick = mode === 'pick' || mode === 'tplpick';
  const host = mode === 'pick' ? getDayById(S.plan, dayId) : (mode === 'tplpick' ? tplDraftDay(dayId) : null);
  const already = pick && host && host.exercises.some(e => e.ex === name);
  const right = pick ?
    '<button class="lib-add ' + (already ? 'is-added' : '') + '" data-action="' + (mode === 'pick' ? 'picker-add' : 'tpl-picker-add') + '" data-ex="' + esc(name) + '" data-day-id="' + dayId + '" aria-label="' + (already ? '已添加' : '添加 ' + name) + '">' +
      icon(already ? 'check' : 'plus') + '</button>' :
    '<div class="lib-row__pr">' + (info.bw ? '自重' : (pr ? fmtNum(pr) + ' kg' : '—')) + '<s>' + (info.bw ? (info.hold ? '计时' : '次数') : 'PR') + '</s></div>' + icon('chevron-right');
  return '<div class="lib-row">' +
    '<div class="lib-row__main" ' + (pick ? '' : 'data-action="lib-info" data-ex="' + esc(name) + '" style="cursor:pointer"') + '>' +
      '<div class="lib-row__name">' + esc(name) +
        (info.unilateral ? '<span class="mini-tag">单侧</span>' : '') +
        (info.custom ? '<span class="mini-tag mini-tag--acid">自定义</span>' : '') +
      '</div>' +
      '<div class="lib-row__sub">' + esc(info.muscle) + ' · ' + esc(info.equip) + (last ? ' · 上次 ' + fmtNum(last.weight) + '×' + last.reps : '') + '</div>' +
    '</div>' +
    '<div class="lib-row__right">' + right + '</div>' +
  '</div>';
}

function filteredExNames(){
  const q = libQuery.trim().toLowerCase();
  return allExNames().filter(name => {
    const info = exInfo(name);
    if(S.ui.libGroup !== '全部' && info.group !== S.ui.libGroup) return false;
    if(S.ui.libEquip !== '全部' && info.equip !== S.ui.libEquip) return false;
    if(!q) return true;
    return (name + ' ' + info.muscle + ' ' + info.group + ' ' + info.equip + ' ' + info.pattern).toLowerCase().indexOf(q) >= 0;
  });
}

function libResultsHtml(mode, dayId){
  const names = filteredExNames();
  if(!names.length){
    return '<div class="empty" style="margin-top:14px"><b>没有匹配的动作</b>换个关键词，或清空筛选试试。</div>';
  }
  if(mode === 'pick' || mode === 'tplpick'){
    const groups = {};
    names.forEach(n => {
      const p = exInfo(n).pattern;
      (groups[p] = groups[p] || []).push(n);
    });
    const order = PATTERNS.concat(['自定义']);
    return order.filter(p => groups[p]).map(p =>
      '<div class="lib-group">' +
        '<div class="lib-group__head"><h3>' + p + '</h3><span>' + groups[p].length + ' 个</span></div>' +
        groups[p].map(n => libRow(n, mode, dayId)).join('') +
      '</div>'
    ).join('');
  }
  const groups = {};
  names.forEach(n => {
    const p = exInfo(n).pattern;
    (groups[p] = groups[p] || []).push(n);
  });
  const order = PATTERNS.concat(['自定义']);
  return order.filter(p => groups[p]).map(p =>
    '<div class="lib-group">' +
      '<div class="lib-group__head"><h3>' + p + '</h3><span>' + groups[p].length + ' 个</span></div>' +
      groups[p].map(n => libRow(n, 'browse')).join('') +
    '</div>'
  ).join('');
}

function libFilters(){
  return '<div class="filter-row">' +
    '<div class="chips">' +
      ['全部'].concat(GROUPS).map(g => '<button class="chip ' + (S.ui.libGroup === g ? 'is-on' : '') + '" data-action="lib-group" data-value="' + g + '">' + g + '</button>').join('') +
    '</div>' +
    '<div class="chips">' +
      ['全部'].concat(EQUIPS).map(e => '<button class="chip ' + (S.ui.libEquip === e ? 'is-on' : '') + '" data-action="lib-equip" data-value="' + e + '">' + e + '</button>').join('') +
    '</div>' +
  '</div>';
}

/* ---------- 计划首页 ---------- */
function viewPlan(){
  const plan = S.plan;
  if(!plan) return viewOnboarding();
  const tpl = templateById(plan.templateId);
  const days = rotationDays(plan);
  const weekSets = totalWeeklySets();
  const totalEx = days.reduce((a, d) => a + dayStats(d).total, 0);

  return shellTab('plan',
    '<div class="pg">' +
      '<div class="pg-head">' +
        '<div><div class="pg-eyebrow">PLAN / 训练日</div><h1 class="pg-title">计划</h1></div>' +
        '<div class="pg-tools"><button class="pg-tool" data-action="open-templates">' + icon('copy') + '模板库</button></div>' +
      '</div>' +
      '<div class="plan-hero">' +
        '<div class="plan-hero__top"><span class="tag tag--acid">' + goalName(plan.goal) + '</span><span class="hero__day">每周 ' + plan.freq + ' 练</span></div>' +
        '<div class="plan-hero__name">' + esc(plan.name || tpl.name) + '</div>' +
        '<div class="plan-hero__meta">' + plan.days.length + ' 个训练日 · ' + totalEx + ' 个动作 · 由模板复制后可自由编辑</div>' +
        '<div class="plan-hero__stats">' +
          '<div class="plan-hero__stat"><b>' + plan.days.length + '</b><span>训练日</span></div>' +
          '<div class="plan-hero__stat"><b>' + weekSets + '</b><span>每周组数</span></div>' +
          '<div class="plan-hero__stat"><b>' + totalEx + '</b><span>动作总数</span></div>' +
        '</div>' +
        '<div class="plan-hero__actions">' +
          '<button class="mini-btn" data-action="edit-day" data-day-id="' + days[0].id + '">' + icon('sliders') + '编辑训练日</button>' +
          '<button class="mini-btn" data-action="open-templates">' + icon('copy') + '更换模板</button>' +
        '</div>' +
      '</div>' +
      '<div class="section-head"><h2>训练日</h2><span>点开查看动作与热身</span></div>' +
      '<div class="panel" style="padding:0 14px">' + days.map((d, i) => {
        const st = dayStats(d);
        return '<button class="day-row" data-action="open-plan-day" data-day-id="' + d.id + '">' +
          '<span class="day-row__idx">' + pad(i + 1) + '</span>' +
          '<span class="day-row__main"><span class="day-row__name">' + d.name + '</span><span class="day-row__sub">' + d.focus + '</span></span>' +
          '<span class="day-row__meta">' + st.main + ' + ' + st.abs + ' 动作<br>' + st.sets + ' 组</span>' +
          icon('chevron-right') +
        '</button>';
      }).join('') + '</div>' +
      '<div class="section-head"><h2>工具</h2><span>动作与模板</span></div>' +
      '<div class="tool-row">' +
        '<button class="tool-card" data-action="open-library">' + icon('dumbbell') + '<span><b>动作库</b><span>25 个核心动作 + 自定义</span></span></button>' +
        '<button class="tool-card" data-action="open-templates">' + icon('copy') + '<span><b>模板库</b><span>内置 + 我的模板 · 可预览复制</span></span></button>' +
      '</div>' +
      '<div class="notice">' + icon('info') + '<span>复制模板会替换当前训练日安排，训练历史与身体数据不受影响。</span></div>' +
    '</div>'
  );
}

/* ---------- 训练日详情 ---------- */
function viewPlanDay(dayId){
  const plan = S.plan;
  if(!plan) return viewOnboarding();
  const day = getDayById(plan, dayId) || rotationDays(plan)[0];
  const days = rotationDays(plan);
  const st = dayStats(day);
  const warm = warmupFor(day);
  const abs = (day.abs || []).map(a => Object.assign({ex:a}, ABS_POOL[a]));

  return subScreen(day.name, esc(day.focus),
    '<div class="day-tabs">' + days.map((d, i) =>
      '<button class="day-tab ' + (d.id === day.id ? 'is-on' : '') + '" data-action="select-plan-day" data-day-id="' + d.id + '"><b>' + pad(i+1) + '</b>' + d.name + '</button>'
    ).join('') + '</div>' +
    '<div class="stat-grid" style="margin-top:12px">' +
      '<div><span>主训练</span><b>' + st.main + '<small>动作</small></b></div>' +
      '<div><span>总组数</span><b>' + st.sets + '<small>组</small></b></div>' +
      '<div><span>预计</span><b>' + st.minutes + '<small>分钟</small></b></div>' +
    '</div>' +
    '<div class="section-head"><h2>热身</h2><span>' + warm.length + ' 项 · 不计容量</span></div>' +
    '<div class="panel" style="padding:4px 14px">' +
      warm.map((w, i) =>
        '<div class="warm-item">' +
          '<span class="warm-item__num">' + pad(i + 1) + '</span>' +
          '<div class="warm-item__main"><div class="warm-item__name">' + w.name + '<span class="mini-tag">' + w.tag + '</span></div><div class="warm-item__sub">' + w.detail + '</div></div>' +
        '</div>'
      ).join('') +
    '</div>' +
    '<div class="section-head"><h2>训练动作</h2><span>' + day.exercises.length + ' 个</span></div>' +
    '<div class="panel" style="padding:2px 14px">' +
      day.exercises.map((e, i) => {
        const info = exInfo(e.ex);
        return '<div class="ex-line">' +
          '<span class="ex-line__idx">' + pad(i + 1) + '</span>' +
          '<div class="ex-line__main"><div class="ex-line__name">' + esc(e.ex) + (info.unilateral ? '<span class="mini-tag">单侧</span>' : '') + '</div><div class="ex-line__sub">' + esc(info.muscle) + ' · ' + esc(info.equip) + '</div></div>' +
          '<div class="ex-line__right">' + e.sets + ' 组<s>' + repsText(e, e.ex) + ' 次 · ' + e.rest + 's</s></div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="abs-block">' +
      '<div class="abs-block__head"><h2>腹部收尾</h2><span>固定 2 个动作</span></div>' +
      '<div class="panel" style="padding:2px 14px">' +
        abs.map((e, i) =>
          '<div class="ex-line">' +
            '<span class="ex-line__idx">' + pad(i + 1) + '</span>' +
            '<div class="ex-line__main"><div class="ex-line__name">' + e.ex + '<span class="mini-tag mini-tag--acid">收尾</span></div><div class="ex-line__sub">' + esc(exInfo(e.ex).muscle) + '</div></div>' +
            '<div class="ex-line__right">' + e.sets + ' 组<s>' + repsText(e, e.ex) + ' · ' + e.rest + 's</s></div>' +
          '</div>'
        ).join('') +
      '</div>' +
    '</div>' +
    '<p class="warm-note">热身与收尾都写在当天流程里：热身只打卡，不计入训练容量；收尾动作计入组数与容量。</p>',
    {right:'<button class="text-btn" data-action="edit-day" data-day-id="' + day.id + '">编辑</button>',
     foot:'<div class="sum-foot"><button class="btn btn--primary" data-action="edit-day" data-day-id="' + day.id + '">' + icon('sliders') + '编辑训练日</button></div>'}
  );
}

/* ---------- 编辑训练日 ---------- */
function viewPlanEdit(dayId){
  const day = getDayById(S.plan, dayId);
  if(!day) return viewPlan();
  const abs = (day.abs || []).map(a => Object.assign({ex:a}, ABS_POOL[a]));
  return subScreen('编辑 · ' + day.name, '调整顺序与组次 · 修改即时保存',
    '<div class="notice" style="margin-top:2px">' + icon('info') + '<span>按住左侧序号上下拖动调整顺序，点「调节」改组数、次数区间和休息；训练日的热身会根据动作自动更新。</span></div>' +
    '<div class="section-head"><h2>训练动作</h2><span>' + day.exercises.length + ' 个</span></div>' +
    '<div class="panel ex-edit-list" data-drag-list data-day-id="' + day.id + '" style="padding:2px 12px">' +
      day.exercises.map((e, i) => {
        const info = exInfo(e.ex);
        return '<div class="ex-line ex-line--edit" data-drag-row>' +
          '<span class="ex-line__idx ex-line__idx--handle" data-drag-handle aria-label="按住拖动排序">' + pad(i + 1) + '</span>' +
          '<div class="ex-line__main"><div class="ex-line__name">' + esc(e.ex) + '</div><div class="ex-line__sub">' + e.sets + ' 组 · ' + repsText(e, e.ex) + (isHold(e.ex) ? '' : ' 次') + ' · ' + e.rest + 's · ' + esc(info.equip) + '</div></div>' +
          '<div class="ex-line__tools">' +
            '<button class="lib-add" data-action="config-ex" data-idx="' + i + '" aria-label="调节">' + icon('sliders') + '</button>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="abs-block">' +
      '<div class="abs-block__head"><h2>腹部收尾</h2><span>固定 · 不参与编辑</span></div>' +
      '<div class="panel" style="padding:2px 14px">' +
        abs.map((e, i) =>
          '<div class="ex-line"><span class="ex-line__idx">' + pad(i + 1) + '</span><div class="ex-line__main"><div class="ex-line__name">' + e.ex + '<span class="mini-tag mini-tag--acid">收尾</span></div><div class="ex-line__sub">' + esc(exInfo(e.ex).muscle) + '</div></div><div class="ex-line__right">' + e.sets + ' 组<s>' + repsText(e, e.ex) + '</s></div></div>'
        ).join('') +
      '</div>' +
    '</div>' +
    '<p class="warm-note">腹部收尾由计划固定轮换，不在本页编辑。</p>',
    {right:'<button class="text-btn" data-action="plan-edit-done">完成</button>',
     foot:'<div class="sum-foot" style="display:flex;gap:8px">' +
       '<button class="btn btn--ghost" style="width:110px;flex:none" data-action="plan-edit-done">完成</button>' +
       '<button class="btn btn--primary" data-action="open-picker" data-day-id="' + day.id + '">' + icon('plus') + '添加动作</button>' +
     '</div>'}
  );
}

/* ---------- 从动作库添加 ---------- */
function viewPicker(dayId){
  const day = getDayById(S.plan, dayId);
  if(!day) return viewPlan();
  return subScreen('添加动作', '从动作库选择 · 已添加 ' + day.exercises.length + ' 个',
    '<div class="search">' + icon('search') + '<input id="lib-search" type="search" placeholder="搜索动作、肌群或器械" value="' + esc(libQuery) + '" autocomplete="off"></div>' +
    libFilters() +
    '<div id="lib-results">' + libResultsHtml('pick', dayId) + '</div>' +
    '<p class="form-tip">新动作默认 3 组 × 8-12 次，组间休息 90 秒；添加后可回到编辑页调整。</p>',
    {right:'<button class="text-btn" data-action="plan-edit-done">完成</button>',
     foot:'<div class="sum-foot" style="display:flex;gap:8px">' +
       '<button class="btn btn--ghost" style="width:130px;flex:none" data-action="new-custom">自定义</button>' +
       '<button class="btn btn--primary" data-action="plan-edit-done">完成添加</button>' +
     '</div>'}
  );
}

/* ---------- 动作库浏览 ---------- */
function viewLibrary(){
  return subScreen('动作库', '25 个核心动作 · 9 个动作模式' + (S.customEx.length ? ' · 自定义 ' + S.customEx.length : ''),
    '<div class="search" style="margin-top:4px">' + icon('search') + '<input id="lib-search" type="search" placeholder="搜索动作、肌群或器械" value="' + esc(libQuery) + '" autocomplete="off"></div>' +
    libFilters() +
    '<div id="lib-results">' + libResultsHtml('browse') + '</div>',
    {right:'<button class="text-btn" data-action="new-custom">新增</button>'}
  );
}

/* ---------- 自定义动作 ---------- */
function viewCustomEx(){
  const d = CUSTOM_DRAFT;
  return subScreen('新增动作', '只填四个字段',
    '<div class="form-row"><label class="form-label">动作名称</label>' +
      '<input class="form-input" id="custom-name" type="text" maxlength="20" placeholder="例如：史密斯上斜卧推" value="' + esc(d.name) + '" style="font-family:var(--font-cn);font-size:14px"></div>' +
    '<div class="form-row"><label class="form-label">主要肌群</label><div class="chip-group">' +
      GROUPS.map(g => '<button class="chip ' + (d.group === g ? 'is-on' : '') + '" data-action="custom-group" data-value="' + g + '">' + g + '</button>').join('') +
    '</div></div>' +
    '<div class="form-row"><label class="form-label">器械</label><div class="chip-group">' +
      EQUIPS.map(e => '<button class="chip ' + (d.equip === e ? 'is-on' : '') + '" data-action="custom-equip" data-value="' + e + '">' + e + '</button>').join('') +
    '</div></div>' +
    '<div class="switch-row"><div><div class="stepper__label">是否单侧</div><span class="stepper__hint">单侧动作会标记「单侧」，重量按单边记录</span></div>' +
      '<button class="switch ' + (d.unilateral ? 'is-on' : '') + '" data-action="custom-unilateral" aria-label="是否单侧"></button></div>' +
    '<p class="form-tip">自定义动作只保存名称、主要肌群、器械和是否单侧，生成在动作库里，可加入任意训练日。</p>',
    {foot:'<div class="sum-foot"><button class="btn btn--primary" data-action="custom-save">' + icon('check') + '保存动作</button></div>'}
  );
}

/* ---------- 模板库 ---------- */
function templateMeta(t){
  const exCount = t.days.reduce((a, d) => a + d.exercises.length, 0);
  const sets = t.days.reduce((a, d) => a + d.exercises.reduce((x, e) => x + e.sets, 0), 0);
  return {exCount, sets};
}
function viewTemplates(){
  const mine = S.templates || [];
  return subScreen('模板库', '内置模板 + 我的模板',
    '<p class="pg-sub" style="margin-top:2px">模板决定训练日的动作与组次。复制成自己的计划后，可以在「计划」里自由增删动作、调整顺序和休息。</p>' +
    '<div class="section-head"><h2>我的模板</h2><span>' + mine.length + ' 套</span></div>' +
    (mine.length ?
      '<div>' + mine.map(t => {
        const m = templateMeta(t);
        return '<button class="tpl-card" data-action="open-my-template" data-id="' + t.id + '">' +
          '<span class="tpl-card__row"><span class="tpl-card__name">' + esc(t.name) + '</span><span class="tpl-card__days">' + t.days.length + ' 天</span></span>' +
          '<span class="tpl-card__sub">' + esc(t.days.map(d => d.name).join(' / ') || '尚未添加训练日') + '</span>' +
          '<span class="tpl-card__meta"><span>' + m.exCount + ' 个动作</span><span>' + m.sets + ' 组 / 轮</span></span>' +
          '<span class="tpl-card__tags"><span class="tag tag--acid">我的模板</span></span>' +
        '</button>';
      }).join('') + '</div>' :
      '<div class="empty"><b>还没有自定义模板</b>点右上角「新建模板」，从空白开始搭一套自己的训练日。</div>') +
    '<div class="section-head"><h2>内置模板</h2><span>' + TEMPLATES.length + ' 套</span></div>' +
    '<div>' + TEMPLATES.map(t => {
      const m = templateMeta(t);
      return '<button class="tpl-card" data-action="open-template" data-id="' + t.id + '">' +
        '<span class="tpl-card__row"><span class="tpl-card__name">' + t.name + '</span><span class="tpl-card__days">' + t.days.length + ' 天</span></span>' +
        '<span class="tpl-card__sub">' + t.sub + '</span>' +
        '<span class="tpl-card__meta"><span>' + m.exCount + ' 个动作</span><span>' + m.sets + ' 组 / 轮</span><span>建议 ' + t.recFor.join('-') + ' 练</span></span>' +
        '<span class="tpl-card__tags">' + t.tags.map(x => '<span class="tag">' + x + '</span>').join('') + '</span>' +
      '</button>';
    }).join('') + '</div>' +
    '<div class="notice">' + icon('info') + '<span>复制模板只替换训练日安排，不清空训练历史、PR 和身体数据。</span></div>',
    {right:'<button class="text-btn" data-action="new-template">新建模板</button>'}
  );
}

function viewTemplateDetail(id){
  const custom = customTemplateById(id);
  const t = custom || TEMPLATES.find(x => x.id === id);
  if(!t) return viewTemplates();
  const m = templateMeta(t);
  return subScreen(t.name, '模板预览 · ' + m.exCount + ' 个动作',
    '<div class="panel">' +
      '<div class="panel__label">TEMPLATE / ' + (custom ? '我的模板' : t.id.toUpperCase()) + '</div>' +
      '<div class="panel__title">' + (custom ? '自定义训练日安排' : t.sub) + '</div>' +
      '<div class="panel__sub">' + (custom ? '复制成计划后可以继续在「计划」里调整动作与组次。' : t.desc) + '</div>' +
      '<div class="tpl-card__tags" style="margin-top:10px">' + (custom ? '<span class="tag tag--acid">我的模板</span>' : t.tags.map(x => '<span class="tag">' + x + '</span>').join('') + '<span class="tag">建议 ' + t.recFor.join('-') + ' 练</span>') + '</div>' +
    '</div>' +
    '<div class="section-head"><h2>训练日安排</h2><span>' + t.days.length + ' 天 / 轮</span></div>' +
    '<div class="panel" style="padding:2px 14px">' +
      t.days.map((d, i) => {
        const sets = d.exercises.reduce((a, e) => a + e.sets, 0);
        return '<div class="tpl-day">' +
          '<div class="tpl-day__head"><div><div class="tpl-day__name">' + pad(i+1) + ' · ' + esc(d.name) + '</div>' + (d.focus ? '<div class="tpl-day__focus">' + esc(d.focus) + '</div>' : '') + '</div><div class="tpl-day__meta">' + sets + ' 组</div></div>' +
          '<div style="margin-top:8px">' + d.exercises.map(e =>
            '<div class="tpl-ex"><span>' + esc(e.ex) + '</span><span>' + e.sets + ' × ' + (isHold(e.ex) ? e.repsMax + '秒' : (e.repsMin === e.repsMax ? e.repsMin : e.repsMin + '-' + e.repsMax)) + ' · ' + e.rest + 's</span></div>'
          ).join('') + '</div>' +
          '<div class="tpl-day__focus" style="margin-top:8px">腹部收尾：' + ABS_PAIRS[i % ABS_PAIRS.length].join(' + ') + '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="notice">' + icon('info') + '<span>复制后会按你当前的每周训练频率重新排入本周，已有训练历史保留。</span></div>',
    custom ?
      {right:'<div style="display:flex;gap:2px"><button class="text-btn" data-action="tpl-edit" data-id="' + t.id + '">编辑</button><button class="text-btn" data-action="tpl-delete" data-id="' + t.id + '">删除</button></div>',
       foot:'<div class="sum-foot"><button class="btn btn--primary" data-action="copy-template" data-id="' + t.id + '">' + icon('copy') + '复制为我的计划</button></div>'} :
      {right:'<button class="text-btn" data-action="copy-template" data-id="' + t.id + '">复制</button>',
       foot:'<div class="sum-foot"><button class="btn btn--primary" data-action="copy-template" data-id="' + t.id + '">' + icon('copy') + '复制为我的计划</button></div>'}
  );
}

/* ---------- 自定义模板编辑 ---------- */
function viewTplEdit(){
  const d = TPL_DRAFT;
  if(!d) return viewTemplates();
  return subScreen('编辑模板 · ' + (d.name || '未命名'), '拖动排序 · 调整组次 · 保存后进入模板库',
    '<div class="form-row" style="margin-top:2px"><label class="form-label">模板名称</label>' +
      '<input class="form-input tpl-name" id="tpl-name" type="text" maxlength="20" placeholder="例如：我的推拉腿" value="' + esc(d.name) + '"></div>' +
    d.days.map(day =>
      '<div class="tpl-edit-day">' +
        '<div class="tpl-edit-day__head">' +
          '<input class="form-input tpl-day-name" data-day-id="' + day.id + '" type="text" maxlength="16" placeholder="训练日名称" value="' + esc(day.name) + '" aria-label="训练日名称">' +
          '<button class="del-btn" data-action="tpl-del-day" data-day-id="' + day.id + '" aria-label="删除训练日">' + icon('trash') + '</button>' +
        '</div>' +
        '<div class="section-head" style="margin-top:2px"><h2>动作</h2><span>' + day.exercises.length + ' 个</span></div>' +
        (day.exercises.length ?
          '<div class="panel ex-edit-list" data-drag-list data-tpl-day-id="' + day.id + '" style="padding:2px 12px">' +
            day.exercises.map((e, i) => {
              const info = exInfo(e.ex);
              return '<div class="ex-line ex-line--edit" data-drag-row>' +
                '<span class="ex-line__idx ex-line__idx--handle" data-drag-handle aria-label="按住拖动排序">' + pad(i + 1) + '</span>' +
                '<div class="ex-line__main"><div class="ex-line__name">' + esc(e.ex) + '</div><div class="ex-line__sub">' + e.sets + ' 组 · ' + repsText(e, e.ex) + (isHold(e.ex) ? '' : ' 次') + ' · ' + e.rest + 's · ' + esc(info.equip) + '</div></div>' +
                '<div class="ex-line__tools">' +
                  '<button class="lib-add" data-action="tpl-config-ex" data-day-id="' + day.id + '" data-idx="' + i + '" aria-label="调节">' + icon('sliders') + '</button>' +
                  '<button class="del-btn" data-action="tpl-del-ex" data-day-id="' + day.id + '" data-idx="' + i + '" aria-label="删除动作">' + icon('trash') + '</button>' +
                '</div>' +
              '</div>';
            }).join('') + '</div>' :
          '<div class="empty" style="margin-top:4px"><b>这个训练日还没有动作</b>点下方按钮从动作库添加。</div>') +
        '<button class="mini-btn" style="margin-top:8px" data-action="tpl-open-picker" data-day-id="' + day.id + '">' + icon('plus') + '添加动作</button>' +
      '</div>'
    ).join('') +
    '<button class="btn btn--ghost" style="width:100%;margin-top:12px" data-action="tpl-add-day">' + icon('plus') + '添加训练日</button>' +
    '<p class="warm-note">模板名称必填；每个训练日至少一个动作。保存后可在模板库中预览、复制或再次编辑。</p>',
    {right:'<button class="text-btn" data-action="tpl-save">保存</button>',
     foot:'<div class="sum-foot"><button class="btn btn--primary" data-action="tpl-save">' + icon('check') + '保存模板</button></div>'}
  );
}

function viewTplPicker(dayId){
  const day = tplDraftDay(dayId);
  if(!day) return viewTplEdit();
  return subScreen('添加动作 · ' + day.name, '从动作库选择 · 已添加 ' + day.exercises.length + ' 个',
    '<div class="search">' + icon('search') + '<input id="lib-search" type="search" placeholder="搜索动作、肌群或器械" value="' + esc(libQuery) + '" autocomplete="off"></div>' +
    libFilters() +
    '<div id="lib-results">' + libResultsHtml('tplpick', dayId) + '</div>' +
    '<p class="form-tip">新动作默认 3 组 × 8-12 次，组间休息 90 秒；添加后回模板编辑页调整。</p>',
    {right:'<button class="text-btn" data-action="tpl-picker-done">完成</button>',
     foot:'<div class="sum-foot"><button class="btn btn--primary" data-action="tpl-picker-done">完成添加</button></div>'}
  );
}
