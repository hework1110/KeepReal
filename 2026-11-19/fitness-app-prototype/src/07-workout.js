/* ============================================================
   7. 训练执行（含热身 / 腹部收尾）/ 汇总
   ============================================================ */

function workoutPager(s){
  const warmDone = s.warmup.length && s.warmupDone.length >= s.warmup.length;
  return '<div class="ex-pager">' +
    '<button class="ex-chip ' + (s.phase === 'warmup' ? 'is-on' : '') + ' ' + (warmDone ? 'is-complete' : '') + '" data-action="goto-warmup"><span class="ex-chip__dot"></span>热身</button>' +
    s.exercises.map((e, i) => {
      const rows = s.sets.filter(x => x.exIdx === i);
      const done = rows.length && rows.every(x => x.done);
      return '<button class="ex-chip ' + (s.phase !== 'warmup' && s.currentEx === i ? 'is-on' : '') + ' ' + (done ? 'is-complete' : '') + '" data-action="goto-ex" data-idx="' + i + '"><span class="ex-chip__dot"></span>' + pad(i + 1) + '</button>';
    }).join('') +
  '</div>';
}

function workoutHead(s, isWarm){
  const total = s.sets.length;
  const done = s.sets.filter(x => x.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const meta = isWarm ? '热身 · 不计容量' : 'EX ' + pad(s.currentEx + 1) + ' / ' + pad(s.exercises.length) + ' · ' + fmtClock(s.elapsed);
  return '<header class="wk-head">' +
      '<button class="icon-btn" data-action="exit-workout" aria-label="退出训练">' + icon('x') + '</button>' +
      '<div class="wk-head__mid"><div class="wk-head__name">' + s.dayName + '</div><div class="wk-head__meta">' + meta + '</div></div>' +
      '<button class="text-btn" data-action="finish-workout">完成</button>' +
    '</header>' +
    '<div class="progress"><i style="width:' + pct + '%"></i></div>';
}

function plateStack(weight){
  const perSide = Math.max(0, (weight - 20) / 2);
  let left = perSide;
  const used = [];
  PLATES.forEach(p => {
    while(left >= p - 0.001){
      used.push(p);
      left -= p;
    }
  });
  const vis = (arr) => '<div class="plate-stack">' + arr.map(p => '<i class="plate" style="height:' + PLATE_H[p] + 'px"></i>').join('') + '</div>';
  return {used, left, html:
    '<div class="plate-vis">' + vis(used.slice().reverse()) + '<i class="collar"></i><i class="bar-rod"></i><i class="collar"></i>' + vis(used) + '</div>'};
}

function calcHtml(s, exIdx){
  const info = exInfo(s.exercises[exIdx].ex);
  if(info.type !== 'barbell') return '';
  const open = calcFor === exIdx;
  const rows = s.sets.filter(x => x.exIdx === exIdx);
  const w = +((rows.find(r => !r.done) || rows[0] || {}).weight) || 20;
  const stack = plateStack(w);
  return '<div class="calc">' +
    '<button class="calc__toggle" data-action="toggle-calc" data-idx="' + exIdx + '"><span>' + icon('calculator') + '杠铃片计算</span>' +
      icon('chevron-down', 'calc__chev ' + (open ? 'is-open' : '')) + '</button>' +
    (open ? '<div class="calc__panel">' + stack.html +
      '<div class="calc__rows">' +
        '<div class="calc__row"><span>杠铃 + 卡扣</span><b>20 kg</b></div>' +
        '<div class="calc__row"><span>每侧加载</span><b>' + fmtNum((w - 20) / 2) + ' kg</b></div>' +
        '<div class="calc__row"><span>片组合</span><b>' + (stack.used.length ? stack.used.join(' + ') : '空杆') + '</b></div>' +
        (stack.left > 0.01 ? '<div class="calc__row is-warn"><span>无法配平</span><b>差 ' + fmtNum(stack.left) + ' kg</b></div>' : '') +
      '</div><div class="calc__note">按当前重量 ' + fmtNum(w) + ' kg 计算，两侧对称</div></div>' : '') +
  '</div>';
}

function viewWarmup(s){
  const tags = [];
  s.warmup.forEach(w => { if(tags.indexOf(w.tag) < 0) tags.push(w.tag); });
  const checked = s.warmupDone.length;
  const all = checked >= s.warmup.length;
  return '<div class="screen view-anim">' +
    workoutHead(s, true) +
    '<div class="screen__body">' +
      workoutPager(s) +
      '<div class="warm-hero">' +
        '<div class="warm-hero__kicker">WARM UP / 不计入容量</div>' +
        '<div class="warm-hero__title">开练前<br>把身体叫醒</div>' +
        '<div class="warm-hero__sub">今天以' + (tags.indexOf('髋膝踝') >= 0 && tags.indexOf('肩肘') >= 0 ? '全身' : (tags.indexOf('髋膝踝') >= 0 ? '髋 · 膝 · 踝' : (tags.indexOf('肩肘') >= 0 ? '肩 · 肘' : '脊柱'))) + '为主，花 5 分钟活动关节、激活目标肌群。</div>' +
        '<div class="warm-hero__tags">' + tags.map(t => '<span class="tag ' + (t === '全身' ? '' : 'tag--acid') + '">' + t + '</span>').join('') + '</div>' +
      '</div>' +
      '<div class="section-head"><h2>热身清单</h2><span>' + checked + ' / ' + s.warmup.length + ' 已完成</span></div>' +
      '<div class="panel" style="padding:2px 14px">' +
        s.warmup.map((w, i) => {
          const done = s.warmupDone.indexOf(i) >= 0;
          return '<button class="warm-item ' + (done ? 'is-done' : '') + '" data-action="warm-toggle" data-idx="' + i + '">' +
            '<span class="warm-item__num">' + pad(i + 1) + '</span>' +
            '<span class="warm-item__main"><span class="warm-item__name">' + w.name + '<span class="mini-tag">' + w.tag + '</span></span><span class="warm-item__sub">' + w.detail + '</span></span>' +
            '<span class="warm-item__check">' + icon('check') + '</span>' +
          '</button>';
        }).join('') +
      '</div>' +
      '<p class="warm-note">热身的勾选只是打卡，不会写入训练容量或 PR。勾选完可直接开始第一组。</p>' +
    '</div>' +
    '<div class="wk-foot">' +
      '<button class="btn btn--ghost" data-action="skip-warm">跳过</button>' +
      '<button class="btn btn--primary" data-action="start-training">' + (all ? '开始第一组' : '热身完成 · 开始') + icon('arrow-right') + '</button>' +
    '</div>' +
  '</div>';
}

function viewExercise(s){
  const idx = s.currentEx;
  const ex = s.exercises[idx];
  if(!ex) return viewWarmup(s);
  const info = exInfo(ex.ex);
  const rows = s.sets.map((r, i) => ({r, i})).filter(x => x.r.exIdx === idx);
  const doneCount = rows.filter(x => x.r.done).length;
  const last = lastLift(ex.ex);
  const hold = isHold(ex.ex);
  const isLast = idx === s.exercises.length - 1;
  const nextLabel = isLast ? '完成训练' : '下一个';
  const prevText = last ? (last.weight > 0 ? fmtNum(last.weight) + ' × ' + last.reps : '自重 × ' + last.reps) : '首次训练';
  const facts = hold ?
    ['组数', ex.sets, '保持', (ex.repsMax || 45) + 's', '休息', ex.rest + 's'] :
    ['组数', ex.sets, '次数', repsText(ex, ex.ex), '休息', ex.rest + 's'];

  return '<div class="screen view-anim">' +
    workoutHead(s, false) +
    '<div class="screen__body">' +
      workoutPager(s) +
      '<div class="ex-head">' +
        '<div class="ex-kicker">' + (ex.abs ? 'ABS FINISHER / 腹部收尾' : 'WORKING SET / 主训练') + ' · ' + pad(idx + 1) + '</div>' +
        '<h1 class="ex-name">' + esc(ex.ex) + '</h1>' +
        '<div class="ex-sub">' + esc(info.muscle) + '<span class="sep"></span>' + esc(info.equip) + (info.unilateral ? '<span class="sep"></span>单侧' : '') + '</div>' +
      '</div>' +
      '<div class="ex-facts">' +
        '<div class="ex-fact"><b>' + facts[1] + '</b>' + facts[0] + '</div>' +
        '<div class="ex-fact"><b>' + facts[3] + '</b>' + facts[2] + '</div>' +
        '<div class="ex-fact"><b>' + facts[5] + '</b>' + facts[4] + '</div>' +
      '</div>' +
      '<p class="cue">' + esc(info.cue || '保持动作控制，做满全程幅度。') + '</p>' +
      '<div class="prev-bar"><span>上次</span><b>' + prevText + '</b><span style="margin-left:auto">已完成 ' + doneCount + ' / ' + rows.length + '</span></div>' +
      calcHtml(s, idx) +
      '<div class="set-table">' +
        '<div class="set-table__head"><span>组</span><span>重量 KG</span><span>' + (hold ? '秒' : '次数') + '</span><span>上次</span><span></span></div>' +
        rows.map(({r, i}) =>
          '<div class="set-row ' + (r.done ? 'is-done' : '') + '">' +
            '<span class="set-idx">' + (r.setIdx + 1) + '</span>' +
            '<input class="set-input" type="number" inputmode="decimal" step="' + (info.step || 1) + '" min="0" value="' + esc(r.weight) + '" data-set="' + i + '" data-field="weight" aria-label="重量">' +
            '<input class="set-input" type="number" inputmode="numeric" step="1" min="1" value="' + esc(r.reps) + '" data-set="' + i + '" data-field="reps" aria-label="' + (hold ? '秒' : '次数') + '">' +
            '<span class="set-prev">' + (info.bw ? '自重' : (last ? fmtNum(last.weight) : '—')) + '<br>' + (last ? last.reps : '') + '</span>' +
            '<button class="set-check" data-action="toggle-set" data-row="' + i + '" aria-label="完成第 ' + (r.setIdx + 1) + ' 组">' + icon('check') + '</button>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div class="set-tools">' +
        '<button class="mini-btn" data-action="copy-first" data-idx="' + idx + '">' + icon('copy') + '复制首组到未完成组</button>' +
        '<span class="tool-hint">勾选后自动计时<br>' + ex.rest + ' 秒休息</span>' +
      '</div>' +
    '</div>' +
    '<div class="wk-foot">' +
      '<button class="btn btn--ghost" data-action="prev-ex" ' + (idx === 0 ? 'disabled style="opacity:.35"' : '') + '>上一项</button>' +
      '<button class="btn btn--primary" data-action="next-ex">' + nextLabel + icon('arrow-right') + '</button>' +
    '</div>' +
    restOverlay(s) +
  '</div>';
}

function restOverlay(s){
  if(!s.rest) return '';
  const left = Math.max(0, s.rest.until - Date.now());
  const pct = Math.min(100, Math.max(0, left / s.rest.total * 100));
  return '<div class="rest" id="rest-panel">' +
    '<div class="rest__top"><span class="rest__label">' + icon('timer') + '组间休息</span><span class="rest__next">下一组 · ' + esc(s.rest.next || '') + '</span></div>' +
    '<div class="rest__mid"><span class="rest__time" id="rest-time">' + fmtMs(left) + '</span><span class="rest__unit">剩余</span></div>' +
    '<div class="rest__bar"><i id="rest-bar" style="width:' + pct + '%"></i></div>' +
    '<div class="rest__actions">' +
      '<button class="mini-btn" data-action="rest-minus">-15 秒</button>' +
      '<button class="mini-btn" data-action="rest-plus">+15 秒</button>' +
      '<button class="rest__skip" data-action="rest-skip">跳过休息</button>' +
    '</div>' +
  '</div>';
}

function viewWorkout(){
  const s = S.session;
  if(!s){ S.view = 'main'; return viewToday(); }
  if(s.phase === 'warmup') return viewWarmup(s);
  return viewExercise(s);
}

/* ---------- 汇总 ---------- */
function viewSummary(){
  const h = S.lastSummary;
  if(!h){ S.view = 'main'; return viewToday(); }
  const doneRows = h.breakdown.filter(b => b.sets > 0);
  return '<div class="screen view-anim">' +
    '<div class="screen__body">' +
      '<div class="sum-hero">' +
        '<div class="sum-check">' + icon('check') + '</div>' +
        '<div class="sum-date">' + h.date.replace(/-/g, ' / ') + ' · ' + h.workoutName + '</div>' +
        '<h1 class="sum-title">训练完成<br>记录已落地</h1>' +
        '<div class="volume-card">' +
          '<div class="volume-label">TOTAL VOLUME / 训练容量</div>' +
          '<div class="volume-num">' + fmtVol(h.volume) + '<small>KG</small></div>' +
          '<div class="volume-sub">重量 × 次数累计 · 热身不计入 · 自重动作不计容量</div>' +
        '</div>' +
        '<div class="stat2">' +
          '<div><span>完成组数</span><b>' + h.sets + ' / ' + h.totalSets + '</b></div>' +
          '<div><span>训练用时</span><b>' + fmtClock(h.duration) + '</b></div>' +
        '</div>' +
        ((h.prs && h.prs.length) ?
          '<div class="section-head"><h2>本次 PR</h2><span>' + h.prs.length + ' 项</span></div>' +
          h.prs.map(p =>
            '<div class="pr-card"><div class="pr-card__icon">' + icon('trophy') + '</div>' +
              '<div><div class="pr-name">' + esc(p.name) + '</div><div class="pr-val">' + fmtNum(p.from) + ' kg <s>→</s> ' + fmtNum(p.to) + ' kg</div></div>' +
              '<span class="pr-delta">+' + fmtNum(p.delta) + '</span>' +
            '</div>'
          ).join('') : '') +
        '<div class="section-head"><h2>动作明细</h2><span>' + doneRows.length + ' 个动作</span></div>' +
        '<div class="panel" style="padding:2px 14px">' +
          h.breakdown.map(b =>
            '<div class="bd-row ' + (b.sets ? '' : 'is-zero') + '">' +
              '<div><div class="bd-name">' + esc(b.name) + '</div><div class="bd-sub">' + b.sets + ' / ' + b.planSets + ' 组' + (b.best ? ' · ' + fmtNum(b.best.weight) + ' kg × ' + b.best.reps : (b.bw ? ' · 自重' : '')) + '</div></div>' +
              '<div class="bd-vol">' + (b.volume ? fmtVol(b.volume) + ' kg' : '—') + '</div>' +
            '</div>'
          ).join('') +
        '</div>' +
        '<div class="note-box" style="margin-top:14px">训练日志已保存在本机。「进步」里能看到周容量、PR 和单动作趋势；「身体」里可以补记体重与有氧。</div>' +
      '</div>' +
    '</div>' +
    '<div class="sum-foot"><button class="btn btn--primary" data-action="go-home">' + icon('check') + '返回今日</button></div>' +
  '</div>';
}
