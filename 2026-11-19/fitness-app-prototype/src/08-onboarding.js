/* ============================================================
   8. 初次引导
   ============================================================ */

function obHead(step){
  return '<header class="ob-head">' +
    '<div class="brand"><span class="brand__mark">K</span>KEEPREAL</div>' +
    '<div class="ob-progress">' + [1,2,3].map(i => '<i class="' + (i <= step ? 'on' : '') + '"></i>').join('') + '</div>' +
  '</header>';
}

function viewOnboarding(){
  const ob = S.onboard;
  const step = ob.step || 1;
  let body = '', foot = '';
  if(step === 1){
    body = '<div class="ob-body">' +
      '<div class="ob-step-num">STEP 01 / 03 · 目标</div>' +
      '<h1 class="ob-title">先定一个<br><em>说得清的目标</em></h1>' +
      '<p class="ob-sub">计划、动作和组次都围绕它来。之后可以在「计划」里随时更换模板。</p>' +
      '<div class="opt-list">' + GOALS.map(g =>
        '<button class="opt ' + (ob.goal === g.id ? 'is-on' : '') + '" data-action="ob-goal" data-value="' + g.id + '">' +
          '<span class="opt__icon">' + icon(g.icon) + '</span>' +
          '<span class="opt__text"><span class="opt__title">' + g.name + '</span><span class="opt__desc">' + g.desc + '</span></span>' +
          '<span class="opt__radio"></span>' +
        '</button>'
      ).join('') + '</div>' +
      '<p class="ob-privacy">' + icon('lock') + '无需账号 · 训练数据只存在这台设备</p>' +
    '</div>';
    foot = '<div class="ob-foot"><button class="btn btn--primary" data-action="ob-next" ' + (!ob.goal ? 'disabled' : '') + '>下一步' + icon('arrow-right') + '</button></div>';
  }else if(step === 2){
    body = '<div class="ob-body">' +
      '<div class="ob-step-num">STEP 02 / 03 · 频率</div>' +
      '<h1 class="ob-title">一周能练<br><em>几次</em></h1>' +
      '<p class="ob-sub">按真实可执行的频率选。少练一次但坚持半年，比计划表排满更重要。</p>' +
      '<div class="freq-grid">' + FREQS.map(f =>
        '<button class="freq ' + (ob.freq === f.n ? 'is-on' : '') + '" data-action="ob-freq" data-value="' + f.n + '">' +
          '<span class="freq__n">' + f.n + '<span>次</span></span>' +
          '<span class="freq__label">' + f.label + '</span>' +
          '<span class="freq__hint">' + f.hint + '</span>' +
        '</button>'
      ).join('') + '</div>' +
    '</div>';
    foot = '<div class="ob-foot"><button class="btn btn--ghost" data-action="ob-back" style="width:96px;flex:none">上一步</button>' +
      '<button class="btn btn--primary" data-action="ob-next" ' + (!ob.freq ? 'disabled' : '') + '>下一步' + icon('arrow-right') + '</button></div>';
  }else{
    body = '<div class="ob-body">' +
      '<div class="ob-step-num">STEP 03 / 03 · 模板</div>' +
      '<h1 class="ob-title">选一套<br><em>训练模板</em></h1>' +
      '<p class="ob-sub">四套都能复制进你的计划再改。热身与腹部收尾会自动排进每个训练日。</p>' +
      '<div class="opt-list" style="gap:8px">' + TEMPLATES.map(t => {
        const m = templateMeta(t);
        return '<button class="tpl ' + (ob.template === t.id ? 'is-on' : '') + '" data-action="ob-template" data-value="' + t.id + '">' +
          '<span class="tpl__row"><span class="tpl__name">' + t.name + '</span>' +
            (ob.freq && t.recFor.indexOf(ob.freq) >= 0 ? '<span class="tpl__badge">适合 ' + ob.freq + ' 练</span>' : '') +
            '<span class="opt__radio"></span></span>' +
          '<span class="tpl__sub">' + t.sub + '</span>' +
          '<span class="tpl__meta"><span>' + t.days.length + ' 个训练日</span><span>' + m.exCount + ' 个动作</span><span>' + m.sets + ' 组</span></span>' +
          '<span class="tpl__tags">' + t.tags.map(x => '<span class="tag">' + x + '</span>').join('') + '</span>' +
        '</button>';
      }).join('') + '</div>' +
    '</div>';
    foot = '<div class="ob-foot"><button class="btn btn--ghost" data-action="ob-back" style="width:96px;flex:none">上一步</button>' +
      '<button class="btn btn--primary" data-action="ob-generate" ' + (!ob.template ? 'disabled' : '') + '>生成我的计划' + icon('arrow-right') + '</button></div>';
  }
  return '<div class="screen view-anim">' + obHead(step) +
    '<div class="screen__body"><div style="padding:0 16px">' + body + '</div></div>' +
    foot + '</div>';
}

function startGenerate(){
  const ob = S.onboard;
  if(!ob.goal || !ob.freq || !ob.template) return;
  const gen = $('#gen');
  const msg = $('#gen-msg');
  const steps = ['读取动作库…', '排入热身与腹部收尾…', '生成本周训练日…'];
  gen.hidden = false;
  let i = 0;
  if(msg) msg.textContent = steps[0];
  const timer = setInterval(() => {
    i++;
    if(msg && steps[i]) msg.textContent = steps[i];
  }, 360);
  setTimeout(() => {
    clearInterval(timer);
    S.plan = buildPlan(ob.template, ob.goal, ob.freq);
    S.prs = {};
    Object.keys(EX_LIB).forEach(n => { if(EX_LIB[n].pr) S.prs[n] = EX_LIB[n].pr; });
    seedDemo(S.plan);
    S.view = 'main';
    S.ui.tab = 'today';
    S.selectedDay = 0;
    NAV = {tab:'today', stack:[]};
    save();
    gen.hidden = true;
    render();
    toast('计划已生成 · 可在「计划」里调整动作与组次');
  }, 900);
}
