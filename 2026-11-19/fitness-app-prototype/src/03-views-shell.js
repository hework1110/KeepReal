/* ============================================================
   3. 应用外壳 / 今天 / 我的
   ============================================================ */

const TABS = [
  {id:'today',    name:'今天', icon:'calendar'},
  {id:'plan',     name:'计划', icon:'layers'},
  {id:'progress', name:'进步', icon:'trending-up'},
  {id:'body',     name:'身体', icon:'activity'},
  {id:'me',       name:'我的', icon:'user'}
];

function tabbar(active){
  return '<nav class="tabbar">' + TABS.map(t =>
    '<button class="tabbar__item ' + (t.id === active ? 'is-on' : '') + '" data-action="go-tab" data-tab="' + t.id + '" aria-label="' + t.name + '">' +
      icon(t.icon) + '<span>' + t.name + '</span>' +
    '</button>'
  ).join('') + '</nav>';
}

function shellTab(active, inner, opts){
  const o = opts || {};
  return '<div class="screen screen--tab view-anim">' +
    '<div class="screen__body">' + inner + '</div>' +
    tabbar(active) +
  '</div>';
}

function subScreen(title, meta, inner, opts){
  const o = opts || {};
  return '<div class="screen view-anim">' +
    '<header class="sub-head">' +
      '<button class="icon-btn" data-action="back" aria-label="返回">' + icon('arrow-left') + '</button>' +
      '<div class="sub-head__mid"><div class="sub-head__name">' + esc(title) + '</div>' +
        (meta ? '<div class="sub-head__meta">' + meta + '</div>' : '') + '</div>' +
      (o.right || '<span class="text-btn"></span>') +
    '</header>' +
    '<div class="screen__body">' + inner + '</div>' +
    (o.foot || '') +
  '</div>';
}

/* ============================================================
   今天
   ============================================================ */

function weekStrip(plan, selected){
  return '<div class="week">' + plan.schedule.map((d, i) => {
    const done = S.history.some(h => h.date === d.date && (h.dayId === d.dayId || (!h.dayId && h.workoutName)));
    const label = i === 0 ? '今天' : d.dow.replace('周','');
    const dotCls = done ? 'is-done' : (d.type === 'rest' ? 'is-rest' : '');
    return '<button class="day ' + (i === selected ? 'is-sel' : '') + '" data-action="select-day" data-day="' + i + '" aria-label="' + d.dow + ' ' + d.month + '月' + d.dayNum + '日">' +
      '<span class="day__dow">' + label + '</span>' +
      '<span class="day__num">' + d.dayNum + '</span>' +
      '<span class="day__dot ' + dotCls + '"></span>' +
    '</button>';
  }).join('') + '</div>';
}

function heroStart(entry){
  const day = getDayById(S.plan, entry.dayId);
  const st = dayStats(day);
  return '<section class="hero">' +
    '<span class="hero__corner"></span><span class="hero__corner hero__corner--br"></span>' +
    '<div class="hero__top"><span class="tag tag--acid">今日训练</span><span class="hero__day">第 ' + (entry.indexInRotation + 1) + ' 练</span></div>' +
    '<div class="hero__name">' + day.name + '</div>' +
    '<div class="hero__focus">' + day.focus + '</div>' +
    '<div class="stat-row">' +
      '<div class="stat"><span class="stat__num">' + st.main + '<small>+' + st.abs + '</small></span><span class="stat__label">动作</span></div>' +
      '<div class="stat"><span class="stat__num">' + st.sets + '<small>组</small></span><span class="stat__label">总组数</span></div>' +
      '<div class="stat"><span class="stat__num">' + st.minutes + '<small>分</small></span><span class="stat__label">预计</span></div>' +
    '</div>' +
    '<button class="btn btn--primary" data-action="start">' + icon('play') + '开始训练</button>' +
    '<p class="hero__hint">先热身打卡 · 组间自动计时 · 退出保留草稿</p>' +
  '</section>';
}

function heroDraft(){
  const s = S.session;
  const total = s.sets.length;
  const done = s.sets.filter(x => x.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const next = s.sets.find(x => !x.done);
  return '<section class="hero">' +
    '<span class="hero__corner"></span><span class="hero__corner hero__corner--br"></span>' +
    '<div class="hero__top"><span class="tag tag--acid">训练未完成</span><span class="hero__day">' + fmtClock(s.elapsed) + '</span></div>' +
    '<div class="hero__name">' + s.dayName + '</div>' +
    '<div class="hero__focus">草稿已保存在本机 · 随时接着上次继续</div>' +
    '<div class="live-bar"><i style="width:' + pct + '%"></i></div>' +
    '<div class="live-meta"><span>已完成 <b>' + done + '</b> / ' + total + ' 组</span><span>' + pct + '%</span></div>' +
    '<button class="btn btn--primary" data-action="resume">' + icon('play') + '继续训练</button>' +
    '<p class="hero__hint">接下来练「' + (next ? next.ex : '最后一个动作') + '」</p>' +
  '</section>';
}

function heroDone(h){
  const next = nextTrainAfter(0);
  return '<section class="hero hero--done">' +
    '<span class="hero__corner"></span>' +
    '<div class="hero__top"><span class="tag tag--acid">今日已完成</span><span class="hero__day">' + fmtClock(h.duration) + '</span></div>' +
    '<div class="hero__name">' + h.workoutName + '</div>' +
    '<div class="hero__focus">训练记录已写入本机，今天的计划完成。</div>' +
    '<div class="stat-row">' +
      '<div class="stat"><span class="stat__num">' + fmtVol(h.volume) + '</span><span class="stat__label">总容量 KG</span></div>' +
      '<div class="stat"><span class="stat__num">' + h.sets + '<small>/ ' + h.totalSets + '</small></span><span class="stat__label">完成组数</span></div>' +
      '<div class="stat"><span class="stat__num">' + ((h.prs || []).length) + '<small>PR</small></span><span class="stat__label">个人纪录</span></div>' +
    '</div>' +
    '<button class="btn btn--ghost" data-action="view-summary">查看训练汇总' + icon('arrow-right') + '</button>' +
    (next ? '<div class="next-box"><div class="next-box__label">下次训练</div><div class="next-box__row"><span>' + next.dow + ' · ' + next.month + '/' + next.dayNum + '</span><b>' + getDayById(S.plan, next.dayId).name + '</b></div><div class="next-box__meta">' + dayStats(getDayById(S.plan, next.dayId)).total + ' 个动作 · 约 ' + dayStats(getDayById(S.plan, next.dayId)).minutes + ' 分钟</div></div>' : '') +
  '</section>';
}

function heroRest(day){
  const next = nextTrainAfter(S.selectedDay);
  let nextHtml;
  if(next){
    const nd = getDayById(S.plan, next.dayId);
    const st = dayStats(nd);
    nextHtml = '<div class="next-box">' +
      '<div class="next-box__label">下次训练</div>' +
      '<div class="next-box__row"><span>' + next.dow + ' · ' + next.month + '月' + next.dayNum + '日</span><b>' + nd.name + '</b></div>' +
      '<div class="next-box__meta">' + st.total + ' 个动作 · 约 ' + st.minutes + ' 分钟</div>' +
    '</div>';
  }else{
    nextHtml = '<div class="next-box"><div class="next-box__label">下次训练</div><div class="next-box__row"><span>本周训练已排完</span><b>下周继续</b></div><div class="next-box__meta">恢复好，下周同一时间见</div></div>';
  }
  return '<section class="hero hero--rest">' +
    '<span class="hero__corner"></span>' +
    '<div class="hero__top"><span class="tag">休息日</span><span class="hero__day">' + day.month + '月' + day.dayNum + '日</span></div>' +
    '<div class="rest-icon">' + icon('moon') + '</div>' +
    '<div class="hero__name">恢复日</div>' +
    '<div class="hero__focus">今天不安排训练。睡够 7 小时，蛋白质吃够，比多练一组更有用。</div>' +
    nextHtml +
  '</section>';
}

function heroPlanned(day){
  const w = getDayById(S.plan, day.dayId);
  const st = dayStats(w);
  return '<section class="hero">' +
    '<span class="hero__corner"></span>' +
    '<div class="hero__top"><span class="tag">计划训练</span><span class="hero__day">' + day.dow + ' · ' + day.month + '/' + day.dayNum + '</span></div>' +
    '<div class="hero__name">' + w.name + '</div>' +
    '<div class="hero__focus">' + w.focus + '</div>' +
    '<div class="stat-row">' +
      '<div class="stat"><span class="stat__num">' + st.main + '<small>+' + st.abs + '</small></span><span class="stat__label">动作</span></div>' +
      '<div class="stat"><span class="stat__num">' + st.sets + '<small>组</small></span><span class="stat__label">总组数</span></div>' +
      '<div class="stat"><span class="stat__num">' + st.minutes + '<small>分</small></span><span class="stat__label">预计</span></div>' +
    '</div>' +
    '<p class="hero__hint">已排进本周计划 · 到当天即可开始</p>' +
  '</section>';
}

function nextTrainAfter(index){
  const p = S.plan;
  if(!p) return null;
  for(let i=index+1;i<p.schedule.length;i++){
    if(p.schedule[i].type === 'train') return p.schedule[i];
  }
  return null;
}

function viewToday(){
  const plan = S.plan;
  if(!plan) return viewOnboarding();
  const sel = Math.min(S.selectedDay, 6);
  const days = plan.schedule;
  const day = days[sel];
  const draft = S.session && S.session.date === todayISO();
  const doneToday = days[0].type === 'train' ? S.history.find(h => h.date === days[0].date && h.dayId === days[0].dayId) : null;

  let card;
  if(sel === 0 && draft) card = heroDraft();
  else if(sel === 0 && doneToday) card = heroDone(doneToday);
  else if(day.type === 'train') card = sel === 0 ? heroStart(day) : heroPlanned(day);
  else card = heroRest(day);

  const tpl = templateById(plan.templateId);
  const rotation = rotationDays(plan);
  const todayDayId = days[0].type === 'train' ? days[0].dayId : null;

  return shellTab('today',
    '<header class="home-head">' +
      '<div class="topbar">' +
        '<div class="brand"><span class="brand__mark">K</span>KEEPREAL</div>' +
        '<span class="plan-pill"><i></i>' + goalName(plan.goal) + ' · 每周 ' + plan.freq + ' 练</span>' +
      '</div>' +
      '<div class="home-date"><span class="eyebrow">' + day.month + '月' + day.dayNum + '日</span><span>' + day.dow + ' · ' + tpl.name + '</span></div>' +
      '<div class="home-title-row"><h1 class="home-title">' + (sel === 0 ? '今天' : day.dow) + '</h1><span class="home-day-idx">DAY ' + pad(sel + 1) + ' / 07</span></div>' +
      weekStrip(plan, sel) +
    '</header>' +
    card +
    '<div class="section-head"><h2>本计划</h2><span>' + plan.freq + ' 练 / 周 · ' + rotation.length + ' 套轮换</span></div>' +
    '<div class="plan-list">' + rotation.map((d, i) => {
      const isToday = d.id === todayDayId;
      const st = dayStats(d);
      return '<button class="plan-row ' + (isToday ? 'is-today' : '') + '" data-action="open-plan-day" data-day-id="' + d.id + '" style="width:100%;text-align:left;background:none;border-left:0;border-right:0;border-top:0;color:inherit;font-family:inherit;cursor:pointer">' +
        '<span class="plan-row__idx">' + pad(i + 1) + '</span>' +
        '<span><span class="plan-row__name">' + d.name + '</span><span class="plan-row__sub">' + d.focus + '</span></span>' +
        '<span class="plan-row__meta">' + st.total + ' 动作<br>' + st.minutes + ' 分钟</span>' +
      '</button>';
    }).join('') + '</div>' +
    '<footer class="home-foot"><span>' + icon('lock') + '本地训练日志 · 不联网</span><button class="link-btn" data-action="go-tab" data-tab="me">设置</button></footer>'
  );
}

/* ============================================================
   我的
   ============================================================ */

function viewMe(){
  const plan = S.plan;
  const tpl = plan ? templateById(plan.templateId) : null;
  const totalVol = S.history.reduce((a, h) => a + (+h.volume || 0), 0);
  const trainCount = S.history.length;
  const bodyCount = S.body.weights.length + S.body.measures.length + S.body.cardio.length;
  const customCount = S.customEx.length;

  return shellTab('me',
    '<div class="pg">' +
      '<div class="pg-head"><div><div class="pg-eyebrow">PROFILE / 本机</div><h1 class="pg-title">我的</h1></div></div>' +
      '<div class="me-hero">' +
        '<div class="me-avatar">K</div>' +
        '<div><div class="me-name" data-action="edit-name" title="点击改名">' + esc(S.profile.name) + '</div><div class="me-sub">' + (plan ? goalName(plan.goal) + ' · 每周 ' + plan.freq + ' 练 · ' + tpl.name : '还没有训练计划') + '</div></div>' +
      '</div>' +
      '<div class="stat-grid" style="margin-top:18px">' +
        '<div><span>累计训练</span><b>' + trainCount + '<small>次</small></b></div>' +
        '<div><span>累计容量</span><b>' + fmtK(totalVol) + '<small>kg</small></b></div>' +
        '<div><span>身体记录</span><b>' + bodyCount + '<small>条</small></b></div>' +
      '</div>' +
      '<div class="section-head"><h2>训练配置</h2><span>' + (plan ? plan.days.length + ' 个训练日' : '未生成') + '</span></div>' +
      '<div class="menu">' +
        '<button class="menu-row" data-action="go-tab" data-tab="plan">' +
          '<span class="menu-row__icon">' + icon('layers') + '</span>' +
          '<span class="menu-row__main"><span class="menu-row__title">我的计划</span><span class="menu-row__sub">训练日、动作、组次与休息</span></span>' +
          '<span class="menu-row__right">' + icon('chevron-right') + '</span>' +
        '</button>' +
        '<button class="menu-row" data-action="open-templates">' +
          '<span class="menu-row__icon">' + icon('copy') + '</span>' +
          '<span class="menu-row__main"><span class="menu-row__title">模板库</span><span class="menu-row__sub">四套内置模板 · 可复制再改</span></span>' +
          '<span class="menu-row__right">' + templateById(plan ? plan.templateId : 'fb').name + icon('chevron-right') + '</span>' +
        '</button>' +
        '<button class="menu-row" data-action="open-library">' +
          '<span class="menu-row__icon">' + icon('dumbbell') + '</span>' +
          '<span class="menu-row__main"><span class="menu-row__title">动作库</span><span class="menu-row__sub">25 个核心动作' + (customCount ? ' · 自定义 ' + customCount : '') + '</span></span>' +
          '<span class="menu-row__right">' + icon('chevron-right') + '</span>' +
        '</button>' +
      '</div>' +
      '<div class="section-head"><h2>数据</h2><span>仅存本机</span></div>' +
      '<div class="menu">' +
        (S.demo ? '<button class="menu-row" data-action="clear-demo">' +
          '<span class="menu-row__icon">' + icon('rotate') + '</span>' +
          '<span class="menu-row__main"><span class="menu-row__title">清空示例数据</span><span class="menu-row__sub">移除生成的训练历史与身体记录，保留计划</span></span>' +
          '<span class="menu-row__right">' + icon('chevron-right') + '</span>' +
        '</button>' : '') +
        '<button class="menu-row danger" data-action="reset">' +
          '<span class="menu-row__icon">' + icon('trash') + '</span>' +
          '<span class="menu-row__main"><span class="menu-row__title">重置全部数据</span><span class="menu-row__sub">计划、训练记录、身体数据一起清除</span></span>' +
          '<span class="menu-row__right">' + icon('chevron-right') + '</span>' +
        '</button>' +
      '</div>' +
      '<div class="notice">' + icon('lock') + '<span>无账号、无云端、无网络请求。所有数据保存在这台设备的 localStorage 中，清除浏览器数据会一并删除。</span></div>' +
      (S.demo ? '<div class="notice" style="border-style:solid">' + icon('info') + '<span>统计与图表里包含一份生成的示例记录，便于首次查看。可在上方「清空示例数据」移除。</span></div>' : '') +
      '<div class="ver">KEEPREAL · PROTOTYPE v0.2 · LOCAL ONLY</div>' +
    '</div>'
  );
}
