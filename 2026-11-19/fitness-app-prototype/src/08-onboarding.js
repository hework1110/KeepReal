/* ============================================================
   8. 初次引导
   ============================================================ */

function viewOnboarding(){
  return '<div class="screen view-anim">' +
    '<header class="ob-head">' +
      '<div class="brand"><span class="brand__mark">K</span>KEEPREAL</div>' +
    '</header>' +
    '<div class="screen__body"><div style="padding:0 16px">' +
      '<div class="ob-body">' +
        '<h1 class="ob-title">选一套<br><em>训练模板</em></h1>' +
        '<p class="ob-sub">点选即生成计划。四套都能稍后在「计划」里增删动作、调整顺序和组次；热身与腹部收尾会自动排进每个训练日。</p>' +
        '<div class="opt-list" style="gap:8px">' + TEMPLATES.map(t => {
          const m = templateMeta(t);
          return '<button class="tpl" data-action="ob-template" data-value="' + t.id + '">' +
            '<span class="tpl__row"><span class="tpl__name">' + t.name + '</span>' +
              '<span class="tpl__badge">适合 ' + t.recFor.join('-') + ' 练</span>' +
              '<span class="opt__radio"></span></span>' +
            '<span class="tpl__sub">' + t.sub + '</span>' +
            '<span class="tpl__meta"><span>' + t.days.length + ' 个训练日</span><span>' + m.exCount + ' 个动作</span><span>' + m.sets + ' 组</span></span>' +
            '<span class="tpl__tags">' + t.tags.map(x => '<span class="tag">' + x + '</span>').join('') + '</span>' +
          '</button>';
        }).join('') + '</div>' +
        '<p class="ob-privacy">' + icon('lock') + '无需账号 · 训练数据只存在这台设备</p>' +
      '</div>' +
    '</div></div>' +
  '</div>';
}

function startGenerate(templateId){
  const ob = S.onboard;
  const id = templateId || ob.template;
  if(!id) return;
  ob.template = id;
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
    S.plan = buildPlan(id, ob.goal || 'muscle', ob.freq || 3);
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
