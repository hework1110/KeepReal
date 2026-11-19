/* ============================================================
   KeepReal — 训练主链路原型
   01. 动作库 / 模板 / 本地存储 / 工具函数
   ============================================================ */

(function () {
  'use strict';

  var STORE_KEY = 'keepreal.prototype.v1';

  /* ---------- 动作库（含"上次训练"数据） ---------- */

  var EX = {
    bench: { name: '杠铃卧推', muscle: '胸', equip: '杠铃', bar: true, rest: 150, target: 8, prev: [[60, 8], [60, 8], [60, 7]] },
    incline: { name: '上斜哑铃卧推', muscle: '胸', equip: '哑铃', bar: false, rest: 120, target: 10, prev: [[22.5, 10], [22.5, 10], [22.5, 9]], note: '重量为单只哑铃' },
    fly: { name: '绳索夹胸', muscle: '胸', equip: '绳索', bar: false, rest: 75, target: 12, prev: [[15, 12], [15, 12], [15, 12]] },
    squat: { name: '杠铃深蹲', muscle: '腿', equip: '杠铃', bar: true, rest: 180, target: 6, prev: [[80, 6], [80, 6], [80, 5]] },
    rdl: { name: '罗马尼亚硬拉', muscle: '后链', equip: '杠铃', bar: true, rest: 150, target: 8, prev: [[70, 8], [70, 8], [70, 8]] },
    legpress: { name: '腿举', muscle: '腿', equip: '器械', bar: false, rest: 120, target: 10, prev: [[140, 10], [140, 10], [140, 9]] },
    legcurl: { name: '坐姿腿弯举', muscle: '腿', equip: '器械', bar: false, rest: 90, target: 12, prev: [[40, 12], [40, 12], [40, 11]] },
    bulgarian: { name: '保加利亚分腿蹲', muscle: '腿', equip: '哑铃', bar: false, rest: 120, target: 10, prev: [[16, 10], [16, 10], [16, 9]], note: '重量为单只哑铃' },
    hipthrust: { name: '杠铃臀推', muscle: '臀', equip: '杠铃', bar: true, rest: 150, target: 10, prev: [[90, 10], [90, 10], [90, 8]] },
    calf: { name: '站姿提踵', muscle: '小腿', equip: '器械', bar: false, rest: 75, target: 15, prev: [[60, 15], [60, 15], [60, 14]] },
    pulldown: { name: '高位下拉', muscle: '背', equip: '器械', bar: false, rest: 120, target: 10, prev: [[50, 10], [50, 10], [50, 9]] },
    seatedrow: { name: '坐姿绳索划船', muscle: '背', equip: '绳索', bar: false, rest: 120, target: 12, prev: [[45, 12], [45, 12], [45, 10]] },
    dbrow: { name: '单臂哑铃划船', muscle: '背', equip: '哑铃', bar: false, rest: 100, target: 10, prev: [[26, 10], [26, 10], [26, 8]], note: '重量为单只哑铃' },
    ohp: { name: '站姿杠铃推举', muscle: '肩', equip: '杠铃', bar: true, rest: 150, target: 8, prev: [[40, 8], [40, 7], [40, 6]] },
    lateral: { name: '哑铃侧平举', muscle: '肩', equip: '哑铃', bar: false, rest: 75, target: 15, prev: [[8, 15], [8, 15], [8, 13]], note: '重量为单只哑铃' },
    facepull: { name: '绳索面拉', muscle: '肩', equip: '绳索', bar: false, rest: 75, target: 15, prev: [[20, 15], [20, 15], [20, 15]] },
    pushdown: { name: '绳索下压', muscle: '三头', equip: '绳索', bar: false, rest: 75, target: 12, prev: [[25, 12], [25, 12], [25, 10]] },
    curl: { name: '哑铃弯举', muscle: '二头', equip: '哑铃', bar: false, rest: 75, target: 12, prev: [[12, 12], [12, 12], [12, 10]], note: '重量为单只哑铃' },
    crunch: { name: '绳索卷腹', muscle: '核心', equip: '绳索', bar: false, rest: 75, target: 15, prev: [[25, 15], [25, 15], [25, 12]] }
  };

  /* ---------- 动作要点 ---------- */

  var CUES = {
    bench: '肩胛后收下沉，杠铃落到胸骨下沿，前臂始终垂直地面。',
    incline: '上斜约 30°，肘部略收，顶峰不锁死，下放控制在两秒。',
    fly: '手肘微屈固定角度，像抱住一棵树一样把重量合拢。',
    squat: '膝盖对准脚尖方向，蹲到髋低于膝，起身时脚掌踩实。',
    rdl: '髋部向后推，杠铃贴着腿走，感到大腿后侧拉长再起身。',
    legpress: '腰背贴紧靠垫，膝盖不要内扣，顶端保留一点弯曲。',
    legcurl: '髋部压住垫子，用大腿后侧把重量卷起来，别甩。',
    bulgarian: '前脚踩稳，后脚只做支撑，重心垂直向下沉。',
    hipthrust: '下巴微收，顶端夹紧臀部停一秒，避免用腰代偿。',
    calf: '底部停一秒再起，最高点主动挤压小腿。',
    pulldown: '先沉肩再发力，胸口迎向横杆，别用身体后仰借力。',
    seatedrow: '肘部贴身向后拉，末端肩胛骨主动后缩。',
    dbrow: '单手支撑保持躯干稳定，肘部沿身体向后拉。',
    ohp: '核心收紧，杠铃沿面部垂直上推，别过度后仰。',
    lateral: '小重量控制下放，肘部略高于手腕，不要耸肩。',
    facepull: '拉向眉毛高度，末端外旋打开，感受肩后束。',
    pushdown: '肘部固定在体侧，只让小臂完成动作。',
    curl: '手腕保持中立，下放时控制两秒，别靠惯性甩起。',
    crunch: '用腹肌把肋骨卷向骨盆，不要用手拽脖子。'
  };

  /* ---------- 内置训练日 ---------- */

  var WORKOUTS = {
    'full-a': { name: '全身 A', focus: '深蹲 / 卧推 / 下拉', items: [['squat', 3], ['bench', 3], ['pulldown', 3], ['lateral', 3], ['pushdown', 3]] },
    'full-b': { name: '全身 B', focus: '硬拉 / 推举 / 划船', items: [['rdl', 3], ['ohp', 3], ['seatedrow', 3], ['legpress', 3], ['curl', 3]] },
    'full-c': { name: '全身 C', focus: '深蹲 / 上斜推 / 面拉', items: [['squat', 3], ['incline', 3], ['pulldown', 3], ['facepull', 3], ['crunch', 3]] },
    'upper-a': { name: '上肢 A', focus: '水平推 / 水平拉', items: [['bench', 4], ['seatedrow', 4], ['ohp', 3], ['pulldown', 3], ['pushdown', 3], ['curl', 3]] },
    'lower-a': { name: '下肢 A', focus: '深蹲主导', items: [['squat', 4], ['rdl', 3], ['legpress', 3], ['legcurl', 3], ['calf', 3], ['crunch', 3]] },
    'upper-b': { name: '上肢 B', focus: '上斜推 / 垂直拉', items: [['incline', 4], ['dbrow', 4], ['lateral', 3], ['facepull', 3], ['pushdown', 3], ['curl', 3]] },
    'lower-b': { name: '下肢 B', focus: '臀腿后侧', items: [['hipthrust', 4], ['bulgarian', 3], ['legcurl', 3], ['legpress', 3], ['calf', 3], ['crunch', 3]] },
    'push': { name: '推 · 胸肩三头', focus: '卧推 / 推举 / 夹胸', items: [['bench', 4], ['incline', 3], ['ohp', 3], ['fly', 3], ['lateral', 3], ['pushdown', 3]] },
    'pull': { name: '拉 · 背二头', focus: '下拉 / 划船 / 面拉', items: [['pulldown', 4], ['dbrow', 4], ['seatedrow', 3], ['facepull', 3], ['curl', 3]] },
    'legs': { name: '腿 · 股四后链', focus: '深蹲 / 硬拉 / 腿举', items: [['squat', 4], ['rdl', 3], ['legpress', 3], ['legcurl', 3], ['calf', 3], ['crunch', 3]] }
  };

  /* ---------- 内置计划模板 ---------- */

  var TEMPLATES = {
    newbie: {
      name: '全身新手版',
      badge: '新手友好',
      desc: '每次覆盖全身大肌群，动作模式简单，恢复压力小。',
      hint: '全身 A / 全身 B 交替',
      workouts: ['full-a', 'full-b']
    },
    upperlower: {
      name: '上下肢分化',
      badge: '效率优先',
      desc: '上肢日与下肢日交替，单次训练更聚焦，适合稳定每周 4 练。',
      hint: '上肢 A · 下肢 A · 上肢 B · 下肢 B',
      workouts: ['upper-a', 'lower-a', 'upper-b', 'lower-b']
    },
    ppl: {
      name: '推拉腿分化',
      badge: '进阶',
      desc: '按推、拉、腿拆分，容量充足，适合动作基础扎实的训练者。',
      hint: '推 · 拉 · 腿 循环',
      workouts: ['push', 'pull', 'legs']
    },
    full3: {
      name: '三练全身',
      badge: '均衡',
      desc: '三个不同的全身日轮转，兼顾力量与肌肉，时间友好。',
      hint: '全身 A · 全身 B · 全身 C',
      workouts: ['full-a', 'full-b', 'full-c']
    }
  };

  /* 每周训练日相对今天的偏移 */
  var FREQ_OFFSETS = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 2, 4, 5]
  };

  var GOALS = {
    muscle: { label: '增肌', desc: '主项保持在 6–10 次，容量稳步加' },
    cut: { label: '减脂', desc: '保留力量，同时提高训练密度' },
    both: { label: '两者兼顾', desc: '力量与体型同步推进，节奏更均衡' }
  };

  var PLATE_COLORS = {
    25: '#E2513C',
    20: '#3F7CFF',
    15: '#EAC544',
    10: '#38A467',
    5: '#DEE2D8',
    2.5: '#FF7390',
    1.25: '#8C948A'
  };

  var PLATE_HEIGHTS = { 25: 56, 20: 49, 15: 41, 10: 33, 5: 24, 2.5: 19, 1.25: 15 };

  var DAY_CN = ['日', '一', '二', '三', '四', '五', '六'];

  /* ---------- 工具 ---------- */

  function el(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function icon(name, cls) {
    return '<svg class="' + (cls || 'ic') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function clock(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return pad2(m) + ':' + pad2(s);
  }

  function fmtInt(n) {
    return Math.round(n || 0).toLocaleString('en-US');
  }

  function fmtW(n) {
    if (n === '' || n === null || n === undefined) return '';
    var v = Math.round(Number(n) * 100) / 100;
    return String(v);
  }

  function durParts(sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return { v: sec, u: '秒' };
    if (sec < 3600) return { v: Math.round(sec / 60), u: '分钟' };
    return { v: (sec / 3600).toFixed(1), u: '小时' };
  }

  function e1rm(w, r) {
    if (!w || !r) return 0;
    return w * (1 + r / 30);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function addDays(base, n) {
    var d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
  }

  function dateKey(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function dateCN(d) {
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function weekCN(d) {
    return '周' + DAY_CN[d.getDay()];
  }

  function daysAgoText(dateStr) {
    var parts = dateStr.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var diff = Math.round((todayDate() - d) / 86400000);
    if (diff <= 0) return '今天';
    if (diff === 1) return '昨天';
    return diff + ' 天前';
  }

  function todayDate() {
    return addDays(new Date(), 0);
  }

  function dateForOffset(offset) {
    return addDays(new Date(), offset);
  }

  function buildWorkout(id) {
    var def = WORKOUTS[id];
    var totalSets = 0;
    var exercises = def.items.map(function (it) {
      totalSets += it[1];
      return { id: it[0], sets: it[1] };
    });
    return {
      id: id,
      name: def.name,
      focus: def.focus,
      exercises: exercises,
      totalSets: totalSets,
      minutes: Math.round((totalSets * 3.3 + 10) / 5) * 5
    };
  }

  function makePlan(goal, days, tplId) {
    var tpl = TEMPLATES[tplId];
    var workouts = tpl.workouts.map(buildWorkout);
    var schedule = FREQ_OFFSETS[days].map(function (offset, i) {
      return { offset: offset, workoutIndex: i % workouts.length };
    });
    return {
      goal: goal,
      daysPerWeek: days,
      templateId: tplId,
      templateName: tpl.name,
      workouts: workouts,
      schedule: schedule,
      startDate: dateKey(todayDate()),
      week: 1
    };
  }

  function computeBests() {
    var bests = {};
    Object.keys(EX).forEach(function (id) {
      bests[id] = Math.max.apply(null, EX[id].prev.map(function (p) {
        return e1rm(p[0], p[1]);
      }));
    });
    return bests;
  }

  function seedHistory(plan) {
    var w = plan.workouts[0];
    var volume = 0;
    var sets = 0;
    w.exercises.forEach(function (e) {
      var meta = EX[e.id];
      for (var i = 0; i < e.sets; i++) {
        var p = meta.prev[Math.min(i, meta.prev.length - 1)];
        volume += p[0] * p[1];
        sets++;
      }
    });
    return [{
      id: uid(),
      date: dateKey(addDays(new Date(), -2)),
      workoutId: w.id,
      workoutName: w.name,
      volume: volume,
      sets: sets,
      totalSets: sets,
      durationSec: (w.minutes - 3) * 60,
      prs: []
    }];
  }

  /* ---------- 状态 ---------- */

  var state = loadState();

  var ui = {
    route: 'onboarding',
    obStep: 1,
    obGoal: null,
    obFreq: null,
    obTemplate: null,
    genStep: 0,
    generating: false,
    dayIndex: 0,
    exIndex: 0,
    plateOpen: false,
    rest: null,
    modal: null,
    lastSummary: null,
    runningSince: null
  };

  var clockTimer = null;
  var restTimer = null;
  var saveTimer = null;
  var toastTimer = null;

  if (state) {
    if (!state.bests) state.bests = computeBests();
    ui.route = 'home';
  } else {
    ui.route = 'onboarding';
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.v !== 1 || !s.plan) return null;
      if (!Array.isArray(s.history)) s.history = [];
      return s;
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      if (!state) return;
      var copy = JSON.parse(JSON.stringify(state));
      copy.v = 1;
      localStorage.setItem(STORE_KEY, JSON.stringify(copy));
    } catch (e) {
      /* 本地存储不可用时，原型继续以内存状态运行 */
    }
  }

  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 260);
  }

  /* ============================================================
     02. 首次启动引导
     ============================================================ */

  function renderOnboarding() {
    var step = ui.obStep;
    var canNext = step === 1 ? !!ui.obGoal : step === 2 ? !!ui.obFreq : !!ui.obTemplate;
    var body = step === 1 ? stepGoal() : step === 2 ? stepFreq() : stepTemplate();
    var nextLabel = step === 3 ? '生成我的计划' : '继续';

    return '<div class="view ob">' +
      '<div class="ob-top">' +
        '<div class="brand-row">' +
          '<span class="brand"><i class="brand-mark"></i>KEEPREAL</span>' +
          '<span class="chip chip-mute">本地存储 · 无需联网</span>' +
        '</div>' +
        '<div class="ob-progress">' +
          [1, 2, 3].map(function (i) {
            return '<span class="pbar ' + (i <= step ? 'on' : '') + '"></span>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="ob-body">' + body + '</div>' +
      '<div class="ob-foot">' +
        '<button class="btn btn-primary" data-act="ob-next" ' + (canNext ? '' : 'disabled') + '>' +
          nextLabel + ' ' + icon('arrow-r', 'ic-sm') +
        '</button>' +
        (step > 1
          ? '<button class="link-back" data-act="ob-back">上一步</button>'
          : '<div class="link-back" style="visibility:hidden"></div>') +
      '</div>' +
      (ui.generating ? genOverlay() : '') +
    '</div>';
  }

  function stepGoal() {
    var items = [
      { key: 'muscle', ic: 'dumbbell', title: '增肌', desc: '以力量与围度为核心，主项 6–10 次' },
      { key: 'cut', ic: 'flame', title: '减脂', desc: '保留力量的同时提高训练密度' },
      { key: 'both', ic: 'target', title: '两者兼顾', desc: '力量与体型同步推进，节奏更均衡' }
    ];
    return '<div class="ob-step">STEP 01 / 03</div>' +
      '<h1 class="ob-title">这次，想把身体<br>练成什么样？</h1>' +
      '<p class="ob-desc">目标决定训练容量与休息节奏。先选最贴近当下状态的一项，之后随时可以调整。</p>' +
      '<div class="goal-list">' +
      items.map(function (it) {
        var on = ui.obGoal === it.key;
        return '<button class="option ' + (on ? 'is-on' : '') + '" data-act="pick-goal" data-value="' + it.key + '">' +
          '<span class="option-ico">' + icon(it.ic) + '</span>' +
          '<span class="option-main"><span class="option-t">' + it.title + '</span><span class="option-d">' + it.desc + '</span></span>' +
          '<span class="radio"></span>' +
        '</button>';
      }).join('') +
      '</div>';
  }

  function stepFreq() {
    var notes = {
      2: '一周两练适合刚恢复训练，或时间非常紧的阶段。每次都会覆盖全身。',
      3: '最稳妥的起点。训练日之间留有完整恢复，动作质量更容易保证。',
      4: '适合已有训练基础的人。上下肢分化能让单次训练更聚焦。',
      5: '容量较高，需要配合睡眠与饮食。建议至少有半年系统训练经验。'
    };
    var note = ui.obFreq ? notes[ui.obFreq] : '按最忙的一周来选。频率稳定，比偶尔练狠更重要。';
    return '<div class="ob-step">STEP 02 / 03</div>' +
      '<h1 class="ob-title">每周能稳定<br>练几天？</h1>' +
      '<p class="ob-desc">先按现实条件选，别按理想的自己选。计划会按这个频率安排训练与休息日。</p>' +
      '<div class="freq-grid">' +
      [2, 3, 4, 5].map(function (n) {
        var on = ui.obFreq === n;
        return '<button class="freq ' + (on ? 'is-on' : '') + '" data-act="pick-freq" data-value="' + n + '">' +
          (n === 3 ? '<span class="freq-badge">推荐</span>' : '') +
          '<span class="freq-n num">' + n + '<span>天 / 周</span></span>' +
          '<span class="freq-t">' + (n === 2 ? '轻量维持' : n === 3 ? '稳定起步' : n === 4 ? '进阶节奏' : '高容量') + '</span>' +
        '</button>';
      }).join('') +
      '</div>' +
      '<div class="freq-note">' + note + '</div>';
  }

  function stepTemplate() {
    var ids = ['newbie', 'upperlower', 'ppl', 'full3'];
    var lead = ui.obFreq ? '每周 ' + ui.obFreq + ' 练 · ' + GOALS[ui.obGoal].label + '。' : '';

    return '<div class="ob-step">STEP 03 / 03</div>' +
      '<h1 class="ob-title">选一套<br>起始模板</h1>' +
      '<p class="ob-desc">' + lead + '模板决定动作结构，训练时再按当天状态调整重量。</p>' +
      '<div class="tpl-list">' +
      ids.map(function (id) {
        var t = TEMPLATES[id];
        var on = ui.obTemplate === id;
        var minutes = buildWorkout(t.workouts[0]).minutes;
        return '<button class="tpl ' + (on ? 'is-on' : '') + '" data-act="pick-template" data-value="' + id + '">' +
          '<div class="tpl-top">' +
            '<span class="tpl-radio"></span>' +
            '<span class="tpl-name">' + t.name + '</span>' +
            '<span class="tpl-badge">' + t.badge + '</span>' +
          '</div>' +
          '<p class="tpl-desc">' + t.desc + '</p>' +
          '<div class="tpl-foot">' + icon('calendar', 'ic-sm') + t.hint +
            '<span class="tpl-min">~' + minutes + ' min</span>' +
          '</div>' +
        '</button>';
      }).join('') +
      '</div>';
  }

  function genOverlay() {
    var lines = ['匹配动作与组数', '安排训练与休息日', '载入上次训练数据'];
    return '<div class="gen-veil">' +
      '<div class="gen-card">' +
        '<div class="gen-spinner"></div>' +
        '<div class="gen-title">正在生成训练计划</div>' +
        '<div class="gen-desc">' + GOALS[ui.obGoal].label + ' · 每周 ' + ui.obFreq + ' 练 · ' + TEMPLATES[ui.obTemplate].name + '</div>' +
        '<div class="gen-steps">' +
        lines.map(function (t, i) {
          return '<div class="gen-step ' + (ui.genStep > i ? 'is-on' : '') + '" data-gstep="' + i + '"><i></i>' + t + '</div>';
        }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ============================================================
     03. 今天 / 首页
     ============================================================ */

  function findEntry(dateStr, workoutId) {
    if (!state || !state.history) return null;
    for (var i = 0; i < state.history.length; i++) {
      var h = state.history[i];
      if (h.date === dateStr && h.workoutId === workoutId) return h;
    }
    return null;
  }

  function trainingDays() {
    return state.plan.schedule.filter(function (s) {
      return s.workoutIndex !== null && s.workoutIndex !== undefined;
    });
  }

  function nextTraining(offset) {
    var days = trainingDays();
    for (var i = 0; i < days.length; i++) {
      if (days[i].offset > offset) {
        return { offset: days[i].offset, workoutIndex: days[i].workoutIndex };
      }
    }
    var last = days[days.length - 1];
    return {
      offset: 7 + days[0].offset,
      workoutIndex: (last.workoutIndex + 1) % state.plan.workouts.length
    };
  }

  function renderHome() {
    var plan = state.plan;
    var sel = plan.schedule.filter(function (s) {
      return s.offset === ui.dayIndex;
    })[0] || { offset: ui.dayIndex, workoutIndex: null };
    var date = dateForOffset(sel.offset);
    var isToday = ui.dayIndex === 0;
    var workout = sel.workoutIndex !== null && sel.workoutIndex !== undefined
      ? plan.workouts[sel.workoutIndex] : null;
    var entry = workout ? findEntry(dateKey(date), workout.id) : null;
    var draft = state.activeSession;
    var lastEntry = state.history.filter(function (h) {
      return h.date !== dateKey(todayDate());
    })[0];
    var today = todayDate();
    var trainingIndex = trainingDays().findIndex(function (s) {
      return s.offset === sel.offset;
    });

    var strip = '';
    for (var i = 0; i < 7; i++) {
      var d = dateForOffset(i);
      var sch = plan.schedule.filter(function (s) { return s.offset === i; })[0];
      var w = sch && sch.workoutIndex !== null && sch.workoutIndex !== undefined
        ? plan.workouts[sch.workoutIndex] : null;
      var done = w ? findEntry(dateKey(d), w.id) : null;
      var mark = done
        ? '<span class="mark done">' + icon('check') + '</span>'
        : w ? '<span class="mark train"></span>' : '<span class="mark rest"></span>';
      strip += '<button class="day ' + (i === ui.dayIndex ? 'is-sel' : '') + (i === 0 ? ' is-today' : '') +
        '" data-act="pick-day" data-value="' + i + '">' +
        '<span class="dw">' + (i === 0 ? '今天' : weekCN(d)) + '</span>' +
        '<span class="dn">' + d.getDate() + '</span>' +
        mark +
      '</button>';
    }

    var html = '<div class="view home">' +
      '<header class="home-head">' +
        '<div class="brand-row">' +
          '<span class="brand"><i class="brand-mark"></i>KEEPREAL</span>' +
          '<span class="streak">' + icon('calendar', 'ic-sm') + '计划第 ' + (plan.week || 1) + ' 周</span>' +
        '</div>' +
        '<div class="title-row">' +
          '<h1 class="display">今天<i class="title-dot"></i></h1>' +
          '<div class="date-line"><b>' + dateCN(today) + '</b>' + weekCN(today) + '</div>' +
        '</div>' +
      '</header>' +
      '<div class="scroll">' +
        '<div class="week">' + strip + '</div>' +
        (draft ? draftCard(draft) : '') +
        (workout
          ? (entry ? doneCard(workout, entry) : trainCard(workout, sel, trainingIndex, isToday))
          : restCard(sel)) +
        (workout && !entry ? exerciseList(workout) : '') +
        (lastEntry ? lastCard(lastEntry) : '') +
      '</div>' +
    '</div>';

    return html;
  }

  function draftCard(s) {
    var done = 0;
    var total = 0;
    s.exercises.forEach(function (e) {
      total += e.sets.length;
      done += e.sets.filter(function (x) { return x.done; }).length;
    });
    var pct = total ? Math.round((done / total) * 100) : 0;
    return '<section class="draft-card">' +
      '<div class="draft-top"><span class="pulse"></span>训练进行中</div>' +
      '<div class="draft-main">' +
        '<div>' +
          '<div class="draft-name">' + esc(s.name) + '</div>' +
          '<div class="draft-meta">已完成 ' + done + ' / ' + total + ' 组</div>' +
        '</div>' +
        '<div class="draft-time">' + clock(s.elapsedBase || 0) + '</div>' +
      '</div>' +
      '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
      '<button class="draft-go" data-act="continue">继续训练 ' + icon('arrow-r', 'ic-sm') + '</button>' +
    '</section>';
  }

  function trainCard(workout, sel, trainingIndex, isToday) {
    return '<section class="train-card">' +
      '<div class="tc-top">' +
        '<span class="chip chip-accent">' + (isToday ? '今日训练' : '提前训练') + '</span>' +
        '<span class="tiny">' + weekCN(dateForOffset(sel.offset)) + ' · 第 ' + (trainingIndex + 1) + ' 次</span>' +
      '</div>' +
      '<h2 class="tc-name">' + esc(workout.name) + '</h2>' +
      '<p class="tc-sub">' + esc(workout.focus) + '</p>' +
      '<div class="tc-metrics">' +
        '<div class="tc-metric"><b>' + workout.exercises.length + '</b><span>动作</span></div>' +
        '<div class="tc-metric"><b>' + workout.totalSets + '</b><span>组数</span></div>' +
        '<div class="tc-metric"><b>' + workout.minutes + '<i>min</i></b><span>预计时长</span></div>' +
      '</div>' +
      '<button class="btn btn-primary" data-act="start" data-value="' + sel.workoutIndex + '">' +
        (isToday ? '开始训练' : '开始这次训练') + ' ' + icon('arrow-r', 'ic-sm') +
      '</button>' +
    '</section>';
  }

  function doneCard(workout, entry) {
    var dur = durParts(entry.durationSec);
    return '<section class="train-card is-done">' +
      '<div class="tc-top">' +
        '<span class="chip chip-accent">已完成</span>' +
        '<span class="tiny">' + dateCN(dateForOffset(0)) + '</span>' +
      '</div>' +
      '<h2 class="tc-name">' + esc(workout.name) + '</h2>' +
      '<p class="tc-sub">今天已经收工，恢复同样是训练的一部分。</p>' +
      '<div class="tc-metrics">' +
        '<div class="tc-metric"><b>' + fmtInt(entry.volume) + '<i>kg</i></b><span>总容量</span></div>' +
        '<div class="tc-metric"><b>' + entry.sets + '<i>/' + entry.totalSets + '</i></b><span>完成组数</span></div>' +
        '<div class="tc-metric"><b>' + dur.v + '<i>' + dur.u + '</i></b><span>训练时长</span></div>' +
      '</div>' +
      '<div class="done-note">' + icon('check', 'ic-sm') + '已记录到本地，不联网也能查看</div>' +
    '</section>';
  }

  function restCard(sel) {
    var nx = nextTraining(sel.offset);
    var d = dateForOffset(nx.offset);
    var w = state.plan.workouts[nx.workoutIndex];
    return '<section class="rest-card">' +
      '<div class="rest-head-row">' +
        '<div class="rest-ico">' + icon('moon', 'ic-lg') + '</div>' +
        '<span class="tiny">' + dateCN(d) + ' · ' + weekCN(d) + '</span>' +
      '</div>' +
      '<h2 class="rest-name">恢复日</h2>' +
      '<p class="rest-copy">今天不安排力量训练。睡够 7–8 小时，蛋白质按体重补齐，让下一次训练有质量。</p>' +
      '<div class="next-box">' +
        '<div class="next-label">下一次训练</div>' +
        '<div class="next-line">' +
          '<span class="next-name">' + esc(w.name) + '</span>' +
          '<span class="next-date">' + dateCN(d) + ' ' + weekCN(d) + '</span>' +
        '</div>' +
        '<div class="next-meta">' + w.exercises.length + ' 个动作 · ' + w.totalSets + ' 组 · 约 ' + w.minutes + ' 分钟</div>' +
      '</div>' +
      '<button class="btn btn-ghost" data-act="start" data-value="' + nx.workoutIndex + '">提前开始这次训练</button>' +
    '</section>';
  }

  function exerciseList(workout) {
    return '<div class="section-title"><span>今日动作</span><span>' + workout.exercises.length + ' 个</span></div>' +
      '<div class="card ex-card">' +
      workout.exercises.map(function (item, i) {
        var meta = EX[item.id];
        return '<div class="ex-row">' +
          '<span class="ex-idx">' + pad2(i + 1) + '</span>' +
          '<span class="ex-name">' + esc(meta.name) + '</span>' +
          '<span class="ex-sets">' + item.sets + ' × ' + meta.target + '</span>' +
          '<span class="ex-tag">' + esc(meta.muscle) + '</span>' +
        '</div>';
      }).join('') +
      '</div>';
  }

  function lastCard(entry) {
    var dur = durParts(entry.durationSec);
    return '<div class="section-title"><span>上次训练</span><span>' + daysAgoText(entry.date) + '</span></div>' +
      '<div class="card last-card">' +
        '<div class="last-top">' +
          '<span class="last-name">' + esc(entry.workoutName) + '</span>' +
          '<span class="last-date">' + entry.date.replace(/-/g, '.') + '</span>' +
        '</div>' +
        '<div class="last-stats">' +
          '<div class="last-stat"><b>' + fmtInt(entry.volume) + '</b><span>KG 容量</span></div>' +
          '<div class="last-stat"><b>' + entry.sets + '</b><span>组</span></div>' +
          '<div class="last-stat"><b>' + dur.v + '</b><span>' + dur.u + '</span></div>' +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     04. 训练执行
     ============================================================ */

  function elapsedNow() {
    if (!state.activeSession) return 0;
    var base = state.activeSession.elapsedBase || 0;
    return base + (ui.runningSince ? (Date.now() - ui.runningSince) / 1000 : 0);
  }

  function workoutVolume(s) {
    var volume = 0;
    s.exercises.forEach(function (e) {
      e.sets.forEach(function (st) {
        if (st.done) volume += (Number(st.w) || 0) * (Number(st.r) || 0);
      });
    });
    return volume;
  }

  function setCounts(s) {
    var total = 0;
    var done = 0;
    s.exercises.forEach(function (e) {
      total += e.sets.length;
      done += e.sets.filter(function (x) { return x.done; }).length;
    });
    return { total: total, done: done };
  }

  function renderWorkout() {
    var s = state.activeSession;
    if (!s) return renderHome();

    var exIdx = Math.min(Math.max(ui.exIndex, 0), s.exercises.length - 1);
    ui.exIndex = exIdx;
    var ex = s.exercises[exIdx];
    var meta = EX[ex.id];
    var counts = setCounts(s);
    var exDone = ex.sets.filter(function (x) { return x.done; }).length;
    var isLast = exIdx === s.exercises.length - 1;
    var pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

    var dots = s.exercises.map(function (e, i) {
      var full = e.sets.length > 0 && e.sets.every(function (x) { return x.done; });
      return '<span class="ex-dot ' + (full ? 'on' : i === ui.exIndex ? 'cur' : '') + '"></span>';
    }).join('');

    var rows = ex.sets.map(function (st, i) {
      return setRowHTML(ex, meta, st, i);
    }).join('');

    var plateBox = ui.plateOpen && meta.bar ? plateBoxHTML(ex, meta) : '';

    return '<div class="view workout">' +
      '<header class="wk-top">' +
        '<button class="icon-btn" data-act="exit-workout" aria-label="退出训练">' + icon('x') + '</button>' +
        '<div class="wk-title">' +
          '<span class="wk-state">训练中</span>' +
          '<span class="wk-time num" id="elapsed">' + clock(elapsedNow()) + '</span>' +
        '</div>' +
        '<button class="wk-finish" data-act="finish-workout">完成</button>' +
      '</header>' +
      '<div class="wk-progress"><i id="wkProgress" style="width:' + pct + '%"></i></div>' +
      '<div class="scroll wk-scroll">' +
        '<div class="ex-count">' +
          '<span>动作 <b>' + (exIdx + 1) + '</b> / ' + s.exercises.length + '</span>' +
          '<div class="ex-dots">' + dots + '</div>' +
          '<span class="ex-done" id="exDone">已完成 ' + exDone + ' / ' + ex.sets.length + ' 组</span>' +
        '</div>' +
        '<h1 class="ex-title">' + esc(meta.name) + '</h1>' +
        '<div class="ex-meta">' +
          '<span class="chip">' + esc(meta.muscle) + '</span>' +
          '<span class="chip">' + esc(meta.equip) + '</span>' +
          '<span class="chip">休息 ' + meta.rest + ' 秒</span>' +
        '</div>' +
        (meta.note ? '<div class="ex-hint">' + icon('info', 'ic-sm') + esc(meta.note) + '</div>' : '') +
        '<div class="set-table">' +
          '<div class="set-head">' +
            '<span>组</span><span>上次</span><span class="ta-c">重量 kg</span>' +
            '<span class="ta-c">次数</span><span></span>' +
          '</div>' +
          rows +
        '</div>' +
        '<div class="wk-tools">' +
          '<button class="tool-btn" data-act="copy-prev">' + icon('copy', 'ic-sm') + '复制上一组</button>' +
          (meta.bar
            ? '<button class="tool-btn ' + (ui.plateOpen ? 'is-open' : '') + '" data-act="toggle-plates">' +
                icon('calc', 'ic-sm') + '配重计算' + icon('chev-d', 'ic-sm chev') +
              '</button>'
            : '') +
        '</div>' +
        '<div class="plate-wrap" id="plateWrap">' + plateBox + '</div>' +
        '<div class="ex-cue">' +
          '<div class="cue-label">动作要点</div>' +
          '<p>' + esc(CUES[ex.id] || '全程控制动作节奏，保留 1–2 次余力。') + '</p>' +
        '</div>' +
        '<div class="wk-tools" style="margin-top:14px">' +
          '<span class="tiny">组间休息会在你勾选完成后自动开始</span>' +
        '</div>' +
      '</div>' +
      '<footer class="wk-foot">' +
        '<div class="wk-volume"><span>本次总容量</span><b id="wkVolume">' + fmtInt(workoutVolume(s)) + '</b><span>kg</span></div>' +
        '<div class="wk-nav">' +
          '<button class="wk-prev" data-act="prev-ex" ' + (exIdx === 0 ? 'disabled' : '') + '>' +
            icon('chev-l', 'ic-sm') + '上一个' +
          '</button>' +
          '<button class="btn btn-primary ' + (isLast ? 'is-finish' : '') + '" data-act="' + (isLast ? 'finish-workout' : 'next-ex') + '">' +
            (isLast ? '完成训练' : '下一个动作') + ' ' + icon(isLast ? 'check' : 'arrow-r', 'ic-sm') +
          '</button>' +
        '</div>' +
      '</footer>' +
    '</div>';
  }

  function setRowHTML(ex, meta, st, i) {
    var p = meta.prev[Math.min(i, meta.prev.length - 1)];
    return '<div class="set-row ' + (st.done ? 'is-done' : '') + '" data-set="' + i + '">' +
      '<span class="set-idx">' + (i + 1) + '</span>' +
      '<span class="set-prev">' + p[0] + '<i>×</i>' + p[1] + '</span>' +
      '<div class="stepper">' +
        '<button class="step-btn" data-act="step" data-set="' + i + '" data-field="w" data-dir="-1" aria-label="减少重量">' +
          icon('minus', 'ic-sm') +
        '</button>' +
        '<input class="num-in" data-field="w" data-set="' + i + '" inputmode="decimal" value="' + fmtW(st.w) +
          '" aria-label="第 ' + (i + 1) + ' 组重量">' +
        '<button class="step-btn" data-act="step" data-set="' + i + '" data-field="w" data-dir="1" aria-label="增加重量">' +
          icon('plus', 'ic-sm') +
        '</button>' +
      '</div>' +
      '<div class="stepper">' +
        '<button class="step-btn" data-act="step" data-set="' + i + '" data-field="r" data-dir="-1" aria-label="减少次数">' +
          icon('minus', 'ic-sm') +
        '</button>' +
        '<input class="num-in" data-field="r" data-set="' + i + '" inputmode="numeric" value="' + fmtW(st.r) +
          '" aria-label="第 ' + (i + 1) + ' 组次数">' +
        '<button class="step-btn" data-act="step" data-set="' + i + '" data-field="r" data-dir="1" aria-label="增加次数">' +
          icon('plus', 'ic-sm') +
        '</button>' +
      '</div>' +
      '<button class="set-check" data-act="toggle-set" data-set="' + i + '" aria-label="完成第 ' + (i + 1) + ' 组">' +
        icon('check') +
      '</button>' +
    '</div>';
  }

  /* ---------- 配重计算 ---------- */

  function plateDiv(p) {
    return '<span class="plate" style="height:' + PLATE_HEIGHTS[p.w] + 'px;background:' + PLATE_COLORS[p.w] + '"></span>';
  }

  function plateBoxHTML(ex, meta) {
    var idx = 0;
    for (var i = 0; i < ex.sets.length; i++) {
      if (!ex.sets[i].done) { idx = i; break; }
      idx = i;
    }
    var st = ex.sets[idx] || ex.sets[0];
    var weight = Number(st.w) || 0;
    var bar = 20;
    var perSide = (weight - bar) / 2;
    var denom = [25, 20, 15, 10, 5, 2.5, 1.25];
    var counts = [];
    var remain = Math.max(0, perSide);

    if (perSide > 0) {
      denom.forEach(function (d) {
        var c = Math.floor((remain + 1e-9) / d);
        if (c > 0) {
          counts.push({ w: d, n: c });
          remain -= c * d;
        }
      });
    }

    var leftHtml = counts.slice().reverse().map(plateDiv).join('');
    var rightHtml = counts.map(plateDiv).join('');
    var legend = counts.length
      ? counts.map(function (p) {
          return '<span class="legend"><i class="legend-dot" style="background:' + PLATE_COLORS[p.w] + '"></i>' +
            p.w + ' × ' + p.n + '</span>';
        }).join('')
      : '<span class="legend"><i class="legend-dot" style="background:#3A3F38"></i>空杆</span>';

    var note;
    if (weight <= bar) {
      note = '按第 ' + (idx + 1) + ' 组 <b>' + fmtW(weight) + 'kg</b> 计算。空杆 20kg，两侧暂不需要配重片。';
    } else if (remain > 0.05) {
      note = '按第 ' + (idx + 1) + ' 组 <b>' + fmtW(weight) + 'kg</b> 计算。每侧约 ' + fmtW(perSide) +
        'kg，存在无法精确组合的余量。';
    } else {
      note = '按第 ' + (idx + 1) + ' 组 <b>' + fmtW(weight) + 'kg</b> 计算：20kg 杠铃 + 每侧 <b>' +
        fmtW(perSide) + 'kg</b>。';
    }

    return '<div class="plate-box">' +
      '<div class="barbell">' +
        '<span class="sleeve"></span>' +
        '<span class="plates">' + leftHtml + '</span>' +
        '<span class="shaft"></span>' +
        '<span class="plates">' + rightHtml + '</span>' +
        '<span class="sleeve"></span>' +
      '</div>' +
      '<div class="plate-legend">' + legend + '</div>' +
      '<div class="plate-note">' + note + '</div>' +
    '</div>';
  }

  /* ---------- 组间休息 ---------- */

  function nextIncomplete(s) {
    for (var i = 0; i < s.exercises.length; i++) {
      var ex = s.exercises[i];
      for (var j = 0; j < ex.sets.length; j++) {
        if (!ex.sets[j].done) {
          return { ex: ex, set: ex.sets[j], setIndex: j };
        }
      }
    }
    return null;
  }

  function startRest(seconds) {
    var s = state.activeSession;
    if (!s) return;
    var nxt = nextIncomplete(s);
    var exName = nxt ? EX[nxt.ex.id].name : '训练完成';
    var line = nxt ? exName + ' 第 ' + (nxt.setIndex + 1) + ' 组' : '所有动作已完成';
    var w = nxt && nxt.set.w !== '' ? nxt.set.w : '-';
    var r = nxt && nxt.set.r !== '' ? nxt.set.r : '-';

    ui.rest = {
      end: Date.now() + seconds * 1000,
      total: seconds,
      exName: exName,
      line: line,
      weight: w,
      reps: r
    };
    renderRest();

    clearInterval(restTimer);
    restTimer = setInterval(tickRest, 200);
  }

  function tickRest() {
    if (!ui.rest) return;
    var left = Math.max(0, Math.ceil((ui.rest.end - Date.now()) / 1000));
    updateRestUI(left);
    if (left <= 0) endRest(true);
  }

  function updateRestUI(left) {
    var t = el('restTime');
    if (t) t.textContent = clock(left);
    var ring = el('restRing');
    if (ring && ui.rest) {
      ring.style.setProperty('--p', Math.max(0, Math.min(1, left / ui.rest.total)).toFixed(4));
    }
  }

  function renderRest() {
    var layer = el('restLayer');
    if (!layer) return;
    if (!ui.rest) {
      layer.classList.remove('show');
      layer.innerHTML = '';
      return;
    }
    var left = Math.max(0, Math.ceil((ui.rest.end - Date.now()) / 1000));
    layer.innerHTML = '<div class="rest-veil"></div>' +
      '<div class="rest-sheet">' +
        '<div class="rest-grip"></div>' +
        '<div class="rest-head">' +
          '<span class="rest-tag">组间休息</span>' +
          '<span class="rest-ex">' + esc(ui.rest.exName) + '</span>' +
        '</div>' +
        '<div class="rest-main">' +
          '<div class="rest-ring" id="restRing" style="--p:' + (left / ui.rest.total).toFixed(4) + '">' +
            '<div class="rest-ring-in">' +
              '<b class="rest-time" id="restTime">' + clock(left) + '</b>' +
              '<span class="rest-sub">剩余</span>' +
            '</div>' +
          '</div>' +
          '<div class="rest-side">' +
            '<div class="rest-line">下一组 · ' + esc(ui.rest.line) + '</div>' +
            '<div class="rest-desc">' + esc(String(ui.rest.weight)) + 'kg × ' + esc(String(ui.rest.reps)) + ' 次 · 深呼吸</div>' +
            '<div class="rest-btns">' +
              '<button class="rest-btn" data-act="rest-minus">−15s</button>' +
              '<button class="rest-btn rest-skip" data-act="rest-skip">跳过</button>' +
              '<button class="rest-btn" data-act="rest-plus">+15s</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    layer.classList.add('show');
  }

  function endRest(notify) {
    clearInterval(restTimer);
    restTimer = null;
    ui.rest = null;
    var layer = el('restLayer');
    if (layer) {
      layer.classList.remove('show');
      layer.innerHTML = '';
    }
    if (notify) toast('休息结束 · 开始下一组');
  }

  /* ============================================================
     05. 训练汇总
     ============================================================ */

  function computeSummary() {
    var s = state.activeSession;
    if (!s) return null;
    var volume = 0;
    var sets = 0;
    var totalSets = 0;
    var prs = [];

    s.exercises.forEach(function (e) {
      var meta = EX[e.id];
      var best = 0;
      var bestSet = null;
      e.sets.forEach(function (st) {
        totalSets++;
        if (!st.done) return;
        var w = Number(st.w) || 0;
        var r = Number(st.r) || 0;
        volume += w * r;
        sets++;
        var est = e1rm(w, r);
        if (est > best) {
          best = est;
          bestSet = { w: w, r: r };
        }
      });
      var baseline = (state.bests && state.bests[e.id]) || 0;
      if (bestSet && best > baseline + 0.05) {
        prs.push({
          id: e.id,
          name: meta.name,
          weight: bestSet.w,
          reps: bestSet.r,
          e1rm: best,
          delta: best - baseline
        });
      }
    });

    var prev = state.history.filter(function (h) {
      return h.workoutId === s.workoutId;
    })[0];

    return {
      id: uid(),
      workoutId: s.workoutId,
      workoutName: s.name,
      planName: state.plan.templateName,
      volume: volume,
      sets: sets,
      totalSets: totalSets,
      durationSec: Math.max(0, Math.round(s.elapsedBase || 0)),
      prs: prs,
      prevVolume: prev ? prev.volume : null
    };
  }

  function renderSummary() {
    var sum = ui.lastSummary;
    if (!sum) return renderHome();

    var today = todayDate();
    var deltaHtml = '';
    if (sum.prevVolume !== null && sum.prevVolume > 0) {
      var diff = sum.volume - sum.prevVolume;
      deltaHtml = '<div class="vol-delta"' + (diff < 0 ? ' style="color:var(--text-3)"' : '') + '>' +
        icon(diff >= 0 ? 'trend' : 'minus', 'ic-sm') +
        '较上次 ' + (diff >= 0 ? '+' : '−') + fmtInt(Math.abs(diff)) + ' kg' +
      '</div>';
    }

    var prHtml = sum.prs.length
      ? sum.prs.slice(0, 4).map(function (p) {
          return '<div class="pr-item">' +
            '<div>' +
              '<div class="pr-name">' + esc(p.name) + '</div>' +
              '<div class="pr-e1rm">预估 1RM ' + p.e1rm.toFixed(1) + ' kg</div>' +
            '</div>' +
            '<div class="pr-val">' + fmtW(p.weight) + 'kg × ' + p.reps +
              '<span>+' + p.delta.toFixed(1) + ' kg</span>' +
            '</div>' +
          '</div>';
        }).join('')
      : '<div class="pr-empty">' + icon('info', 'ic-sm') +
          '这次没有刷新 PR。下次在最后一组多加 2.5kg，让身体继续适应。</div>';

    return '<div class="view summary">' +
      '<div class="scroll sum-scroll">' +
        '<div class="sum-hero">' +
          '<div class="sum-check">' + icon('check') + '</div>' +
          '<div class="sum-eyebrow">' + dateCN(today) + ' · ' + weekCN(today) + '</div>' +
          '<h1 class="sum-title">训练完成</h1>' +
          '<p class="sum-sub">' + esc(sum.workoutName) + ' · ' + esc(sum.planName) + '</p>' +
        '</div>' +
        '<div class="vol-card">' +
          '<div class="vol-label">本次总容量</div>' +
          '<div class="vol-line"><span class="vol-num num">' + fmtInt(sum.volume) + '</span><span class="vol-unit">kg</span></div>' +
          deltaHtml +
        '</div>' +
        '<div class="sum-grid">' +
          '<div class="sum-stat"><b>' + sum.sets + '<small> / ' + sum.totalSets + '</small></b><span>完成组数</span></div>' +
          '<div class="sum-stat"><b>' + clock(sum.durationSec) + '</b><span>训练时长</span></div>' +
        '</div>' +
        '<div class="pr-card">' +
          '<div class="pr-head">' + icon('trophy') + '个人记录</div>' +
          prHtml +
        '</div>' +
        '<div class="sum-note">' + icon('info', 'ic-sm') +
          '所有数据只保存在本机浏览器，不联网、不上传。' +
        '</div>' +
      '</div>' +
      '<div class="sum-foot">' +
        '<button class="btn btn-primary" data-act="back-home">返回首页 ' + icon('arrow-r', 'ic-sm') + '</button>' +
      '</div>' +
    '</div>';
  }

  /* ============================================================
     06. 弹层 / 提示 / 主路由
     ============================================================ */

  function openModal(opts) {
    ui.modal = opts;
    var layer = el('modalLayer');
    layer.innerHTML = '<div class="modal-veil" data-act="modal-cancel"></div>' +
      '<div class="modal">' +
        '<div class="modal-kicker">' + esc(opts.kicker || '请确认') + '</div>' +
        '<h3 class="modal-title">' + esc(opts.title) + '</h3>' +
        '<p class="modal-body">' + esc(opts.body || '') + '</p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost" data-act="modal-cancel">' + esc(opts.cancel || '取消') + '</button>' +
          '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-act="modal-confirm">' +
            esc(opts.confirm || '确定') +
          '</button>' +
        '</div>' +
      '</div>';
    layer.classList.add('show');
  }

  function closeModal() {
    ui.modal = null;
    var layer = el('modalLayer');
    if (layer) {
      layer.classList.remove('show');
      layer.innerHTML = '';
    }
  }

  function toast(msg) {
    var t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('show');
    }, 1900);
  }

  function route(name) {
    if (name !== 'workout') endRest(false);
    ui.route = name;
    clearInterval(clockTimer);
    clockTimer = null;
    if (name === 'workout') {
      if (!ui.runningSince) ui.runningSince = Date.now();
      clockTimer = setInterval(function () {
        var t = el('elapsed');
        if (t) t.textContent = clock(elapsedNow());
      }, 1000);
    }
    render();
  }

  function render() {
    fitPhone();
    var screen = el('screen');
    if (!screen) return;
    if (ui.route === 'onboarding') {
      screen.innerHTML = renderOnboarding();
    } else if (ui.route === 'workout') {
      screen.innerHTML = renderWorkout();
    } else if (ui.route === 'summary') {
      screen.innerHTML = renderSummary();
    } else {
      screen.innerHTML = renderHome();
    }
    renderRest();
  }

  function fitPhone() {
    var phone = el('phone');
    if (!phone) return;
    if (window.innerWidth <= 480) {
      phone.style.transform = '';
      return;
    }
    var scale = Math.min(
      1,
      (window.innerHeight - 56) / 844,
      (window.innerWidth - 56) / 390
    );
    phone.style.transform = 'scale(' + Math.max(0.5, scale).toFixed(3) + ')';
  }

  function pauseElapsed() {
    if (state && state.activeSession && ui.runningSince) {
      state.activeSession.elapsedBase =
        (state.activeSession.elapsedBase || 0) + (Date.now() - ui.runningSince) / 1000;
      ui.runningSince = null;
    }
  }

  /* ============================================================
     07. 交互逻辑
     ============================================================ */

  function beginGeneration() {
    if (ui.generating || !ui.obGoal || !ui.obFreq || !ui.obTemplate) return;
    ui.generating = true;
    ui.genStep = 0;
    render();

    setTimeout(function () {
      if (!ui.generating) return;
      ui.genStep = 1;
      markGen();
    }, 420);
    setTimeout(function () {
      if (!ui.generating) return;
      ui.genStep = 2;
      markGen();
    }, 900);
    setTimeout(function () {
      if (!ui.generating) return;
      ui.genStep = 3;
      markGen();
    }, 1250);
    setTimeout(function () {
      if (!ui.generating) return;
      commitPlan();
    }, 1650);
  }

  function markGen() {
    var steps = document.querySelectorAll('[data-gstep]');
    for (var i = 0; i < steps.length; i++) {
      var n = Number(steps[i].getAttribute('data-gstep'));
      steps[i].classList.toggle('is-on', n < ui.genStep);
    }
  }

  function commitPlan() {
    var plan = makePlan(ui.obGoal, ui.obFreq, ui.obTemplate);
    state = {
      v: 1,
      plan: plan,
      history: seedHistory(plan),
      bests: computeBests(),
      activeSession: null
    };
    ui.generating = false;
    ui.genStep = 0;
    ui.route = 'home';
    ui.dayIndex = 0;
    save();
    render();
    toast('计划已生成 · ' + plan.templateName);
  }

  function createSession(wIdx) {
    var w = state.plan.workouts[wIdx];
    if (!w) return;

    var exercises = w.exercises.map(function (item) {
      var meta = EX[item.id];
      var sets = [];
      for (var i = 0; i < item.sets; i++) {
        var p = meta.prev[Math.min(i, meta.prev.length - 1)];
        sets.push({ w: p[0], r: p[1], done: false });
      }
      return { id: item.id, sets: sets };
    });

    state.activeSession = {
      id: uid(),
      workoutId: w.id,
      name: w.name,
      startedAt: Date.now(),
      elapsedBase: 0,
      exercises: exercises
    };
    ui.exIndex = 0;
    ui.plateOpen = false;
    ui.runningSince = Date.now();
    closeModal();
    route('workout');
    save();
  }

  function startWorkout(wIdx) {
    if (!state) return;
    if (state.activeSession) {
      openModal({
        kicker: '训练草稿',
        title: '还有未完成的训练',
        body: '「' + state.activeSession.name + '」的草稿还在。开始新的训练会覆盖它。',
        confirm: '覆盖并开始',
        cancel: '取消',
        danger: true,
        onConfirm: function () {
          state.activeSession = null;
          createSession(wIdx);
        }
      });
      return;
    }
    createSession(wIdx);
  }

  function continueSession() {
    var s = state.activeSession;
    if (!s) return;
    var idx = -1;
    for (var i = 0; i < s.exercises.length; i++) {
      var allDone = s.exercises[i].sets.every(function (x) { return x.done; });
      if (!allDone) { idx = i; break; }
    }
    ui.exIndex = idx < 0 ? s.exercises.length - 1 : idx;
    ui.plateOpen = false;
    ui.runningSince = Date.now();
    route('workout');
  }

  function exitWorkout() {
    if (!state.activeSession) return;
    pauseElapsed();
    endRest(false);
    ui.dayIndex = 0;
    save();
    route('home');
    toast('已保存草稿 · 随时可以继续');
  }

  function syncWorkout() {
    var s = state.activeSession;
    if (!s) return;
    var ex = s.exercises[ui.exIndex];
    if (!ex) return;

    var counts = setCounts(s);
    var pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
    var prog = el('wkProgress');
    if (prog) prog.style.width = pct + '%';

    var vol = el('wkVolume');
    if (vol) vol.textContent = fmtInt(workoutVolume(s));

    var exDone = el('exDone');
    if (exDone) {
      exDone.textContent = '已完成 ' + ex.sets.filter(function (x) { return x.done; }).length +
        ' / ' + ex.sets.length + ' 组';
    }

    var dots = document.querySelectorAll('.ex-dot');
    s.exercises.forEach(function (e, i) {
      if (!dots[i]) return;
      var full = e.sets.length > 0 && e.sets.every(function (x) { return x.done; });
      dots[i].className = 'ex-dot ' + (full ? 'on' : i === ui.exIndex ? 'cur' : '');
    });

    var rows = document.querySelectorAll('.set-row');
    for (var r = 0; r < rows.length; r++) {
      var idx = Number(rows[r].getAttribute('data-set'));
      var st = ex.sets[idx];
      if (!st) continue;
      if (st.done) rows[r].classList.add('is-done');
      else rows[r].classList.remove('is-done');
    }
  }

  function toggleSet(setIdx) {
    var s = state.activeSession;
    if (!s) return;
    var ex = s.exercises[ui.exIndex];
    var st = ex.sets[setIdx];
    if (!st) return;
    var meta = EX[ex.id];

    if (st.done) {
      st.done = false;
      syncWorkout();
      saveSoon();
      return;
    }

    var p = meta.prev[Math.min(setIdx, meta.prev.length - 1)];
    if (st.w === '' || st.w === null || st.w === undefined) st.w = p[0];
    if (st.r === '' || st.r === null || st.r === undefined) st.r = p[1];
    st.done = true;

    var row = document.querySelector('.set-row[data-set="' + setIdx + '"]');
    if (row) {
      var inW = row.querySelector('input[data-field="w"]');
      var inR = row.querySelector('input[data-field="r"]');
      if (inW) inW.value = fmtW(st.w);
      if (inR) inR.value = fmtW(st.r);
    }

    syncWorkout();
    saveSoon();

    var counts = setCounts(s);
    if (counts.done < counts.total) {
      startRest(meta.rest);
    }
  }

  function stepValue(btn) {
    var s = state.activeSession;
    if (!s) return;
    var ex = s.exercises[ui.exIndex];
    var setIdx = Number(btn.getAttribute('data-set'));
    var field = btn.getAttribute('data-field');
    var dir = Number(btn.getAttribute('data-dir'));
    var st = ex.sets[setIdx];
    if (!st) return;

    var step = field === 'r' ? 1 : (EX[ex.id].bar ? 2.5 : 1);
    var cur = Number(st[field]);
    if (isNaN(cur)) cur = 0;
    var next = Math.max(0, cur + dir * step);
    st[field] = Math.round(next * 100) / 100;

    var row = document.querySelector('.set-row[data-set="' + setIdx + '"]');
    if (row) {
      var inp = row.querySelector('input[data-field="' + field + '"]');
      if (inp) inp.value = fmtW(st[field]);
    }

    syncWorkout();
    saveSoon();
    if (ui.plateOpen && field === 'w') refreshPlate();
  }

  function copyPrev() {
    var s = state.activeSession;
    if (!s) return;
    var ex = s.exercises[ui.exIndex];
    var meta = EX[ex.id];
    var idx = -1;
    for (var i = 0; i < ex.sets.length; i++) {
      if (!ex.sets[i].done) { idx = i; break; }
    }
    if (idx < 0) {
      toast('这个动作的组已经全部完成');
      return;
    }

    var src;
    if (idx > 0) {
      src = { w: ex.sets[idx - 1].w, r: ex.sets[idx - 1].r };
    } else {
      src = { w: meta.prev[0][0], r: meta.prev[0][1] };
    }
    ex.sets[idx].w = src.w;
    ex.sets[idx].r = src.r;

    var row = document.querySelector('.set-row[data-set="' + idx + '"]');
    if (row) {
      var inW = row.querySelector('input[data-field="w"]');
      var inR = row.querySelector('input[data-field="r"]');
      if (inW) inW.value = fmtW(src.w);
      if (inR) inR.value = fmtW(src.r);
    }

    saveSoon();
    if (ui.plateOpen) refreshPlate();
    toast('已复制到第 ' + (idx + 1) + ' 组');
  }

  function togglePlates() {
    ui.plateOpen = !ui.plateOpen;
    var wrap = el('plateWrap');
    if (wrap) {
      var ex = state.activeSession.exercises[ui.exIndex];
      wrap.innerHTML = ui.plateOpen ? plateBoxHTML(ex, EX[ex.id]) : '';
    }
    var btn = document.querySelector('[data-act="toggle-plates"]');
    if (btn) btn.classList.toggle('is-open', ui.plateOpen);
  }

  function refreshPlate() {
    var wrap = el('plateWrap');
    if (!wrap) return;
    var ex = state.activeSession.exercises[ui.exIndex];
    wrap.innerHTML = ui.plateOpen ? plateBoxHTML(ex, EX[ex.id]) : '';
  }

  function finishWorkout() {
    if (!state || !state.activeSession) return;
    pauseElapsed();
    var counts = setCounts(state.activeSession);
    endRest(false);

    if (counts.done < counts.total) {
      openModal({
        kicker: '提前结束',
        title: '还有 ' + (counts.total - counts.done) + ' 组未完成',
        body: '现在结束，只会记录已经勾选完成的组，草稿将不再保留。',
        confirm: '结束训练',
        cancel: '继续练',
        danger: true,
        onConfirm: finishNow
      });
      return;
    }
    finishNow();
  }

  function finishNow() {
    var sum = computeSummary();
    if (!sum) return;

    state.bests = state.bests || {};
    sum.prs.forEach(function (p) {
      state.bests[p.id] = Math.max(state.bests[p.id] || 0, p.e1rm);
    });

    state.history.unshift({
      id: sum.id,
      date: dateKey(todayDate()),
      workoutId: sum.workoutId,
      workoutName: sum.workoutName,
      volume: sum.volume,
      sets: sum.sets,
      totalSets: sum.totalSets,
      durationSec: sum.durationSec,
      prs: sum.prs.map(function (p) { return p.name; })
    });
    if (state.history.length > 12) state.history.pop();

    state.activeSession = null;
    ui.runningSince = null;
    ui.lastSummary = sum;
    closeModal();
    save();
    route('summary');
  }

  var ACTIONS = {
    'pick-goal': function (t) {
      ui.obGoal = t.getAttribute('data-value');
      render();
    },
    'pick-freq': function (t) {
      ui.obFreq = Number(t.getAttribute('data-value'));
      render();
    },
    'pick-template': function (t) {
      ui.obTemplate = t.getAttribute('data-value');
      render();
    },
    'ob-next': function () {
      if (ui.generating) return;
      if (ui.obStep === 1 && ui.obGoal) {
        ui.obStep = 2;
        render();
      } else if (ui.obStep === 2 && ui.obFreq) {
        ui.obStep = 3;
        render();
      } else if (ui.obStep === 3 && ui.obTemplate) {
        beginGeneration();
      }
    },
    'ob-back': function () {
      if (ui.generating) return;
      if (ui.obStep > 1) {
        ui.obStep -= 1;
        render();
      }
    },
    'pick-day': function (t) {
      ui.dayIndex = Number(t.getAttribute('data-value'));
      render();
    },
    'start': function (t) {
      startWorkout(Number(t.getAttribute('data-value')));
    },
    'continue': continueSession,
    'exit-workout': exitWorkout,
    'toggle-set': function (t) {
      toggleSet(Number(t.getAttribute('data-set')));
    },
    'step': stepValue,
    'copy-prev': copyPrev,
    'toggle-plates': togglePlates,
    'prev-ex': function () {
      if (ui.exIndex > 0) {
        ui.exIndex -= 1;
        ui.plateOpen = false;
        render();
      }
    },
    'next-ex': function () {
      var s = state.activeSession;
      if (!s) return;
      if (ui.exIndex < s.exercises.length - 1) {
        ui.exIndex += 1;
        ui.plateOpen = false;
        render();
      }
    },
    'finish-workout': finishWorkout,
    'rest-skip': function () {
      endRest(false);
    },
    'rest-plus': function () {
      if (!ui.rest) return;
      ui.rest.end += 15000;
      updateRestUI(Math.max(0, Math.ceil((ui.rest.end - Date.now()) / 1000)));
    },
    'rest-minus': function () {
      if (!ui.rest) return;
      ui.rest.end -= 15000;
      var left = Math.max(0, Math.ceil((ui.rest.end - Date.now()) / 1000));
      updateRestUI(left);
      if (left <= 0) endRest(false);
    },
    'modal-cancel': closeModal,
    'modal-confirm': function () {
      var m = ui.modal;
      closeModal();
      if (m && typeof m.onConfirm === 'function') m.onConfirm();
    },
    'back-home': function () {
      ui.dayIndex = 0;
      route('home');
    }
  };

  /* ---------- 事件绑定 ---------- */

  function onClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t || t.disabled) return;
    var fn = ACTIONS[t.getAttribute('data-act')];
    if (!fn) return;
    e.preventDefault();
    fn(t);
  }

  function onInput(e) {
    var inp = e.target.closest('.num-in');
    if (!inp) return;
    if (!state || !state.activeSession) return;
    var ex = state.activeSession.exercises[ui.exIndex];
    if (!ex) return;
    var setIdx = Number(inp.getAttribute('data-set'));
    var field = inp.getAttribute('data-field');
    var st = ex.sets[setIdx];
    if (!st) return;

    var raw = inp.value.replace(/[^\d.]/g, '');
    if (raw !== inp.value) inp.value = raw;
    var num = raw === '' ? '' : Number(raw);
    st[field] = num === '' || isNaN(num) ? '' : num;

    syncWorkout();
    saveSoon();
    if (ui.plateOpen && field === 'w') refreshPlate();
  }

  function init() {
    try {
      var params = new URLSearchParams(location.search);
      if (params.get('reset') === '1') {
        try { localStorage.removeItem(STORE_KEY); } catch (err) {}
        state = null;
        ui.route = 'onboarding';
        try { history.replaceState(null, '', location.pathname); } catch (err2) {}
      }
    } catch (e) {}

    var app = el('app');
    if (app) {
      app.addEventListener('click', onClick);
      app.addEventListener('input', onInput);
    }
    window.addEventListener('resize', fitPhone);

    if (state) {
      ui.route = 'home';
    } else {
      ui.route = 'onboarding';
    }
    route(ui.route);
  }

  init();

})();
