/* ============================================================
   6. 身体 · 体重 / 围度 / 有氧
   ============================================================ */

function signed(v, unit, digits){
  const r = Math.round((+v || 0) * Math.pow(10, digits == null ? 1 : digits)) / Math.pow(10, digits == null ? 1 : digits);
  if(Math.abs(r) < 0.0001) return '0' + (unit || '');
  return (r > 0 ? '+' : '') + r + (unit || '');
}
function weightsAsc(){
  return S.body.weights.slice().sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : 0));
}
function measuresAsc(){
  return S.body.measures.slice().sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : 0));
}
function latestMeasure(key){
  const arr = measuresAsc().filter(m => typeof m[key] === 'number' && m[key] > 0);
  return arr.length ? arr[arr.length - 1] : null;
}
function cardioWeekMinutes(){
  const mon = isoOf(mondayOf(new Date()));
  return S.body.cardio.filter(c => c.date >= mon && c.date <= todayISO()).reduce((a, c) => a + (+c.minutes || 0), 0);
}

function viewBody(){
  if(!S.plan) return viewOnboarding();
  const ws = weightsAsc();
  const latest = ws.length ? ws[ws.length - 1] : null;
  const base = latest ? ws.filter(w => w.date <= isoOf(addDays(parseISO(latest.date), -7))).pop() : null;
  const weekDelta = latest && base ? latest.kg - base.kg : 0;
  const ma = ws.map((w, i) => {
    const from = isoOf(addDays(parseISO(w.date), -6));
    const slice = ws.filter(x => x.date >= from && x.date <= w.date);
    return slice.reduce((a, x) => a + (+x.kg || 0), 0) / slice.length;
  });
  const latestMA = ma.length ? ma[ma.length - 1] : 0;
  const recent = ws.slice(-3).reverse();
  const cardio = S.body.cardio.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  const measures = measuresAsc();

  const metrics = MEASURES.map((m, i) => {
    const arr = measures.filter(x => typeof x[m.key] === 'number' && x[m.key] > 0);
    const cur = arr.length ? arr[arr.length - 1] : null;
    const prev = arr.length > 1 ? arr[arr.length - 2] : null;
    return {key:m.key, name:m.name, cur, prev, delta: cur && prev ? cur[m.key] - prev[m.key] : null};
  });

  return shellTab('body',
    '<div class="pg">' +
      '<div class="pg-head"><div><div class="pg-eyebrow">BODY / 身体</div><h1 class="pg-title">身体</h1>' +
        '<p class="pg-sub">体重、围度和有氧记录。趋势比单次数字更重要。</p></div></div>' +

      '<div class="section-head"><h2>体重</h2><div class="section-head__action"><span>7 日移动平均</span><button class="add-btn" data-action="add-weight">' + icon('plus') + '记录</button></div></div>' +
      '<div class="hero-metric" style="margin-top:4px">' +
        '<div class="hero-metric__label">当前体重</div>' +
        '<div class="hero-metric__num">' + (latest ? fmtNum(latest.kg) : '—') + '<small>KG</small></div>' +
        '<div class="hero-metric__meta">' +
          '<span>较 7 日前 <b>' + (latest ? signed(weekDelta, ' kg') : '—') + '</b></span>' +
          '<span>7 日均 <b>' + (latestMA ? fmtNum(latestMA) + ' kg' : '—') + '</b></span>' +
          '<span>' + ws.length + ' 条记录</span>' +
        '</div>' +
      '</div>' +
      (ws.length > 1 ?
        '<div class="chart-card">' +
          '<div class="chart-card__head"><h3>体重曲线</h3><span>近 12 周 · KG</span></div>' +
          '<div class="chart">' + svgSeries(
            [{values:ma, area:true, dots:false, cls:'line--ma'}, {values:ws.map(w => +w.kg), cls:'line--sub', dotCls:'dot--sub', dotR:2.1}],
            ws.map(w => shortDate(w.date)),
            {fmt:v => v.toFixed(1), label:'体重曲线'}
          ) + '</div>' +
          '<div class="chart-legend"><span><i></i>7 日均线</span><span><i class="muted"></i>单次记录</span></div>' +
        '</div>' :
        '<div class="empty" style="margin-top:8px"><b>还没有体重曲线</b>至少记录两次体重，就能看到 7 日移动平均。</div>') +
      (recent.length ?
        '<div class="panel" style="margin-top:8px;padding:2px 14px">' + recent.map(w =>
          '<div class="log-row">' +
            '<div class="log-row__main"><div class="log-row__title">' + fmtNum(w.kg) + ' kg</div><div class="log-row__sub">' + w.date.replace(/-/g, '.') + '</div></div>' +
            '<div class="log-row__val">' + (w.note ? esc(w.note) : '') + '</div>' +
            '<button class="del-btn" data-action="del-weight" data-id="' + w.id + '" aria-label="删除体重记录">' + icon('trash') + '</button>' +
          '</div>'
        ).join('') + '</div>' : '') +

      '<div class="section-head"><h2>围度</h2><div class="section-head__action"><span>单位 cm</span><button class="add-btn" data-action="add-measure">' + icon('plus') + '记录</button></div></div>' +
      (measures.length ?
        '<div class="metric-grid">' + metrics.map((m, i) =>
          '<div class="metric ' + (i === metrics.length - 1 ? 'metric--wide' : '') + '">' +
            '<div class="metric__label">' + m.name + '</div>' +
            '<div class="metric__val"><b>' + (m.cur ? fmtNum(m.cur[m.key]) : '—') + '</b><small>cm</small></div>' +
            '<div class="metric__delta ' + (m.delta == null ? 'is-flat' : '') + '">' + (m.delta == null ? '首次记录' : '较上次 ' + signed(m.delta, ' cm')) + '</div>' +
            '<div class="metric__date">' + (m.cur ? m.cur.date.replace(/-/g, '.') : '') + '</div>' +
          '</div>'
        ).join('') + '</div>' :
        '<div class="empty"><b>还没有围度记录</b>记下胸腰臀臂腿，和之后的自己对比。</div>') +

      '<div class="section-head"><h2>有氧</h2><div class="section-head__action"><span>本周 ' + cardioWeekMinutes() + ' 分钟</span><button class="add-btn" data-action="add-cardio">' + icon('plus') + '记录</button></div></div>' +
      (cardio.length ?
        '<div class="panel" style="padding:2px 14px">' + cardio.map(c => {
          const bits = [];
          if(c.incline) bits.push('坡度 ' + c.incline + '%');
          if(c.speed) bits.push(c.speed + ' km/h');
          return '<div class="log-row">' +
            '<div class="log-row__main"><div class="log-row__title">' + esc(c.type) + '<span class="mini-tag">有氧</span></div>' +
              '<div class="log-row__sub">' + c.date.replace(/-/g, '.') + (bits.length ? ' · ' + bits.join(' · ') : '') + '</div></div>' +
            '<div class="log-row__val">' + (c.minutes || 0) + ' 分</div>' +
            '<button class="del-btn" data-action="del-cardio" data-id="' + c.id + '" aria-label="删除有氧记录">' + icon('trash') + '</button>' +
          '</div>';
        }).join('') + '</div>' :
        '<div class="empty"><b>还没有有氧记录</b>爬坡走、快走、跑步、单车、椭圆机、划船机都能记。</div>') +

      (S.demo ? '<div class="notice">' + icon('info') + '<span>身体数据里包含生成的示例记录，可在「我的」中清空示例数据。</span></div>' : '') +
    '</div>'
  );
}
