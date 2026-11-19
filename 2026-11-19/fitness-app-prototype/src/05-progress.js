/* ============================================================
   5. 进步 · 图表与统计
   ============================================================ */

const PROGRESS_RANGES = [
  {id:'all', label:'全部', days:Infinity},
  {id:'1y', label:'近一年', days:365},
  {id:'6m', label:'近半年', days:183},
  {id:'3m', label:'近三个月', days:90},
  {id:'1w', label:'近一周', days:7}
];

function mondayOf(d){
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const w = (x.getDay() + 6) % 7;
  return addDays(x, -w);
}
function niceMax(v){
  if(!(v > 0)) return 100;
  const raw = v * 1.08;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 1.2 ? 1.2 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 3 ? 3 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 6 ? 6 : f <= 8 ? 8 : 10;
  return nice * exp;
}

function svgBars(bars, opts){
  const o = opts || {};
  const W = 326, H = 170, L = 32, R = 6, T = 20, B = 25;
  const pw = W - L - R, ph = H - T - B;
  const max = niceMax(Math.max.apply(null, bars.map(b => b.value).concat([1])));
  const n = Math.max(1, bars.length);
  const slot = pw / n;
  const bw = Math.min(28, slot * 0.56);
  const y = v => T + ph - (v / max) * ph;
  let g = '';
  [0, 0.5, 1].forEach(k => {
    const v = max * k, yy = y(v);
    g += '<line class="grid" x1="' + L + '" y1="' + yy.toFixed(1) + '" x2="' + (W-R) + '" y2="' + yy.toFixed(1) + '"/>';
    g += '<text class="axis" x="' + (L-5) + '" y="' + (yy+3).toFixed(1) + '" text-anchor="end">' + (v ? fmtK(v) : '0') + '</text>';
  });
  let body = '';
  /* 长途数据按月份标注横轴，避免每个柱都挤一个日期 */
  let monthIdx = null;
  if(o.monthAxis){
    monthIdx = [];
    for(let i=1;i<bars.length;i++){
      if(parseISO(bars[i].start).getMonth() !== parseISO(bars[i-1].start).getMonth()) monthIdx.push(i);
    }
    if(monthIdx.length > 6){
      const step = Math.ceil(monthIdx.length / 6);
      monthIdx = monthIdx.filter((v, k) => k % step === 0 || k === monthIdx.length - 1);
    }
  }
  bars.forEach((b, i) => {
    const x = L + slot * i + (slot - bw) / 2;
    const top = y(b.value);
    const h = Math.max(b.value > 0 ? 2 : 1, y(0) - top);
    const hot = i === n - 1;
    body += '<rect class="bar ' + (hot ? 'is-hot' : '') + (b.value <= 0 ? ' is-empty' : '') + '" x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2"/>';
    if(hot && b.value > 0){
      body += '<text class="axis axis--strong" x="' + (x + bw/2).toFixed(1) + '" y="' + (top - 5).toFixed(1) + '" text-anchor="middle">' + fmtK(b.value) + '</text>';
    }
    const show = monthIdx ? monthIdx.indexOf(i) >= 0 : (n <= 5 ? true : (i % 3 === 0 || i === n - 1));
    if(show){
      const label = monthIdx ? (parseISO(b.start).getMonth() + 1) + '月' : b.label;
      body += '<text class="axis" x="' + (L + slot * i + slot/2).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + label + '</text>';
    }
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.label || '柱状图') + '">' + g + body + '</svg>';
}

function svgSeries(series, labels, opts){
  const o = opts || {};
  const W = 326, H = 170, L = 34, R = 8, T = 18, B = 26;
  const pw = W - L - R, ph = H - T - B;
  const all = [];
  series.forEach(s => s.values.forEach(v => { if(typeof v === 'number' && isFinite(v)) all.push(v); }));
  let lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
  if(!all.length){ lo = 0; hi = 1; }
  const span = (hi - lo) || Math.abs(hi) * 0.15 || 1;
  lo -= span * 0.2; hi += span * 0.2;
  if(o.baseZero) lo = 0;
  const n = Math.max.apply(null, series.map(s => s.values.length).concat([1]));
  const x = i => n <= 1 ? L + pw/2 : L + (i / (n - 1)) * pw;
  const y = v => T + ph - ((v - lo) / (hi - lo)) * ph;
  const baseY = T + ph;
  let g = '';
  [0, 0.5, 1].forEach(k => {
    const v = lo + (hi - lo) * k, yy = y(v);
    g += '<line class="grid" x1="' + L + '" y1="' + yy.toFixed(1) + '" x2="' + (W-R) + '" y2="' + yy.toFixed(1) + '"/>';
    g += '<text class="axis" x="' + (L-5) + '" y="' + (yy+3).toFixed(1) + '" text-anchor="end">' + (o.fmt ? o.fmt(v) : Math.round(v)) + '</text>';
  });
  let body = '';
  series.forEach((s, si) => {
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    if(!pts.length) return;
    if(s.area && pts.length > 1){
      body += '<path class="area" d="M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') +
        ' L' + pts[pts.length-1][0].toFixed(1) + ' ' + baseY + ' L' + pts[0][0].toFixed(1) + ' ' + baseY + ' Z"/>';
    }
    body += '<polyline class="line ' + (s.cls || '') + '" points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>';
    if(s.dots !== false){
      pts.forEach(p => {
        body += '<circle class="dot ' + (s.dotCls || '') + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (s.dotR || 2.6) + '"/>';
      });
    }
  });
  if(labels && labels.length){
    const idx = n <= 1 ? [0] : (n <= 5 ? [0, n-1] : [0, Math.floor((n-1)/2), n-1]);
    idx.forEach((i, k) => {
      const yi = n <= 1 ? x(0) : x(i);
      body += '<text class="axis" x="' + yi.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' + (k === 0 ? 'start' : (k === idx.length - 1 ? 'end' : 'middle')) + '">' + labels[i] + '</text>';
    });
  }
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.label || '趋势图') + '">' + g + body + '</svg>';
}

function progressBuckets(range){
  /* 近一周按天分组，更长的区间按周分组 */
  if(range === '1w'){
    const buckets = [];
    for(let i=6;i>=0;i--){
      const iso = isoOf(addDays(new Date(), -i));
      buckets.push({label:shortDate(iso), value:0, start:iso});
    }
    S.history.forEach(h => {
      const idx = buckets.findIndex(b => b.start === h.date);
      if(idx >= 0) buckets[idx].value += (+h.volume || 0);
    });
    return {buckets, daily:true};
  }
  const thisMon = mondayOf(new Date());
  let n;
  if(range === 'all'){
    let earliest = null;
    S.history.forEach(h => {
      const d = parseISO(h.date);
      if(!earliest || d < earliest) earliest = d;
    });
    n = earliest ? Math.max(4, Math.round((thisMon - mondayOf(earliest)) / 604800000) + 1) : 4;
    n = Math.min(260, n);
  }else{
    n = range === '1y' ? 53 : range === '6m' ? 27 : 13;
  }
  const buckets = [];
  for(let i=n-1;i>=0;i--){
    const mon = addDays(thisMon, -7*i);
    buckets.push({label:shortDate(isoOf(mon)), value:0, start:isoOf(mon)});
  }
  S.history.forEach(h => {
    const diff = Math.round((thisMon - mondayOf(parseISO(h.date))) / 604800000);
    if(diff >= 0 && diff < n) buckets[n - 1 - diff].value += (+h.volume || 0);
  });
  return {buckets, daily:false};
}

function prRows(days){
  const map = {};
  const today = todayISO();
  S.history.forEach(h => {
    if(daysBetween(h.date, today) > days) return;
    (h.lifts || []).forEach(l => {
      if(!(l.weight > 0) || !(l.reps > 0)) return;
      const cur = map[l.ex] || (map[l.ex] = {ex:l.ex, weight:0, reps:0, e1rm:0, date:h.date});
      if(l.weight > cur.weight || (l.weight === cur.weight && l.reps > cur.reps)){
        cur.weight = l.weight; cur.reps = l.reps; cur.date = h.date;
      }
      const e = e1rm(l.weight, l.reps);
      if(e > cur.e1rm){ cur.e1rm = e; cur.e1rmDate = h.date; }
    });
  });
  return Object.keys(map).map(k => map[k]).filter(r => r.weight > 0)
    .sort((a, b) => b.e1rm - a.e1rm);
}

function historyExNames(days){
  const seen = {};
  const out = [];
  const today = todayISO();
  S.history.forEach(h => {
    if(daysBetween(h.date, today) > days) return;
    (h.lifts || []).forEach(l => {
      if(l.weight > 0 && !seen[l.ex]){ seen[l.ex] = 1; out.push(l.ex); }
    });
  });
  return out;
}

function exSeries(name, days){
  const today = todayISO();
  const list = S.history
    .filter(h => daysBetween(h.date, today) <= days)
    .map(h => {
      const l = (h.lifts || []).find(x => x.ex === name);
      return l && l.e1rm > 0 ? {date:h.date, value:l.e1rm} : null;
    })
    .filter(Boolean);
  list.sort((a, b) => a.date < b.date ? -1 : 1);
  return list;
}

function viewProgress(){
  if(!S.plan) return viewOnboarding();
  const opt = PROGRESS_RANGES.find(o => o.id === S.ui.progressRange) || PROGRESS_RANGES.find(o => o.id === '1w');
  const range = opt.id;
  const days = opt.days;
  const rangeLabel = opt.label;
  const pack = progressBuckets(range);
  const buckets = pack.buckets;
  const daily = pack.daily;
  const total = buckets.reduce((a, b) => a + b.value, 0);
  const latest = buckets[buckets.length - 1].value;
  const prev = buckets[buckets.length - 2] ? buckets[buckets.length - 2].value : 0;
  const delta = prev ? Math.round((latest - prev) / prev * 100) : 0;
  const avg = total / Math.max(1, buckets.length);
  const sessions = S.history.filter(h => daysBetween(h.date, todayISO()) <= days).length;
  const rangeHasData = sessions > 0;
  const longAxis = range === 'all' || range === '1y' || range === '6m';
  const unit = daily ? '天' : '周';

  const prs = prRows(days);
  const shown = S.ui.prAll ? prs : prs.slice(0, 8);
  const names = historyExNames(days);
  let sel = S.ui.progressEx;
  if(names.indexOf(sel) < 0) sel = names.indexOf('杠铃深蹲') >= 0 ? '杠铃深蹲' : names[0];
  S.ui.progressEx = sel || null;
  const series = sel ? exSeries(sel, days) : [];
  const last = series.length ? series[series.length - 1].value : 0;
  const first = series.length ? series[0].value : 0;
  const exDelta = last && first ? Math.round((last - first) / first * 100) : 0;
  const hasHistory = S.history.length > 0;

  return shellTab('progress',
    '<div class="pg">' +
      '<div class="pg-head"><div><div class="pg-eyebrow">PROGRESS / 趋势</div><h1 class="pg-title">进步</h1>' +
        '<p class="pg-sub">训练容量、个人纪录和单动作趋势都来自本机日志。</p></div></div>' +
      '<div class="range-select">' +
        '<select id="progress-range" aria-label="时间范围">' +
          PROGRESS_RANGES.map(o => '<option value="' + o.id + '"' + (o.id === range ? ' selected' : '') + '>' + o.label + '</option>').join('') +
        '</select>' + icon('chevron-down') +
      '</div>' +
      '<div class="hero-metric">' +
        '<div class="hero-metric__label">训练容量 · ' + rangeLabel + '</div>' +
        '<div class="hero-metric__num">' + fmtVol(total) + '<small>KG</small></div>' +
        '<div class="hero-metric__meta">' +
          '<span>较上一' + (daily ? '日' : '周') + ' <b>' + (delta >= 0 ? '+' : '') + delta + '%</b></span>' +
          '<span>' + buckets.length + ' ' + unit + '均值 <b>' + fmtVol(avg) + '</b></span>' +
          '<span>训练 <b>' + sessions + '</b> 次</span>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card">' +
        '<div class="chart-card__head"><h3>' + (daily ? '每日训练容量' : '周训练容量') + '</h3><span>' + buckets.length + ' ' + unit + ' · KG</span></div>' +
        (rangeHasData ? '<div class="chart">' + svgBars(buckets, {label:(daily ? '每日训练容量' : '周训练容量'), monthAxis:longAxis}) + '</div>' :
          '<div class="chart-empty">所选时间范围内还没有训练记录。</div>') +
        '<div class="chart-legend"><span><i></i>' + (daily ? '每日总容量' : '每周总容量') + '</span><span>' + (daily ? '按自然日统计' : '按周一至周日统计') + '</span></div>' +
      '</div>' +
      '<div class="section-head"><h2>PR 榜</h2><span>区间最好重量 · 预估 1RM</span></div>' +
      (prs.length ?
        '<div class="panel" style="padding:2px 14px">' +
          shown.map((r, i) =>
            '<div class="pr-row">' +
              '<span class="pr-row__rank">' + pad(i + 1) + '</span>' +
              '<div class="pr-row__main"><div class="pr-row__name">' + esc(r.ex) + '</div><div class="pr-row__sub">' + fmtNum(r.weight) + ' kg × ' + r.reps + ' · ' + shortDate(r.date) + '</div></div>' +
              '<div class="pr-row__val"><b>' + fmtNum(r.e1rm) + '</b><span>e1RM kg</span></div>' +
            '</div>'
          ).join('') +
        '</div>' +
        (prs.length > 8 ? '<button class="text-btn" style="display:block;margin:10px auto 0" data-action="pr-all">' + (S.ui.prAll ? '收起' : '查看全部 ' + prs.length + ' 项') + '</button>' : '') :
        '<div class="empty"><b>当前时间范围没有 PR</b>换个更长的时间范围，或完成带重量的训练组。</div>') +
      '<div class="section-head"><h2>单动作趋势</h2><span>预估 1RM · ' + rangeLabel + '</span></div>' +
      (names.length ?
        '<div class="ex-scroll" data-ex-scroll>' +
          '<div class="chips ex-scroll__list" data-ex-scroll-list>' + names.map(n =>
            '<button class="chip ' + (n === sel ? 'is-on' : '') + '" data-action="progress-ex" data-ex="' + esc(n) + '">' + esc(n) + '</button>'
          ).join('') + '</div>' +
          '<div class="ex-scroll__mask" aria-hidden="true"></div>' +
          '<button class="ex-scroll__more" data-action="progress-more" aria-label="查看全部动作">…</button>' +
        '</div>' : '') +
      (sel ?
        '<div class="chart-card" style="margin-top:10px">' +
          '<div class="chart-card__head"><h3>' + esc(sel) + '</h3><span>' + (series.length ? series.length + ' 次训练' : '暂无数据') + '</span></div>' +
          (series.length > 1 ?
            '<div class="chart">' + svgSeries([{values:series.map(p => p.value), area:true, dotR:2.4}], series.map(p => shortDate(p.date)), {fmt:v => Math.round(v), label:sel + ' 预估 1RM'}) + '</div>' :
            '<div class="chart-empty">' + (series.length === 1 ? '再完成一次「' + esc(sel) + '」就能看到趋势。' : '当前时间范围里没有这个动作的数据。') + '</div>') +
          (series.length ?
            '<div class="chart-legend"><span><i></i>预估 1RM</span><span>最新 <b style="color:var(--acid)">' + fmtNum(last) + ' kg</b></span><span>' + (exDelta >= 0 ? '+' : '') + exDelta + '%</span></div>' : '') +
        '</div>' :
        (rangeHasData ?
          '<div class="empty"><b>还没有单动作数据</b>完成带重量的训练组后，这里会出现可选动作。</div>' :
          '<div class="empty"><b>当前时间范围没有训练数据</b>换个时间范围试试。</div>')) +
      (!hasHistory ? '<div class="notice">' + icon('info') + '<span>当前没有训练历史。去「今天」完成一次训练，进步页会自动更新；如果你的第一批数据还在，会自动迁移到这里。</span></div>' : '') +
    '</div>'
  );
}
