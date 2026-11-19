// 动作库与内置模板，数据来自 2026-11-19 原型的 01-data.js。
// 只保留训练主链路需要的字段：动作信息、模板、腹部收尾与杠铃片。

export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
export const PLATE_H = { 25: 62, 20: 56, 15: 50, 10: 42, 5: 34, 2.5: 27, 1.25: 21 }
export const DAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/* 25 个核心动作。base = 建议起始重量，step = 加重量步进。 */
export const EX_LIB = {
  杠铃深蹲: {
    pattern: '蹲', group: '腿', muscle: '股四头肌 · 臀大肌', equip: '杠铃', type: 'barbell',
    base: 90, step: 2.5, pr: 110,
    cue: '脚掌三点踩实，髋膝同时启动，下蹲到髋略低于膝，起身时想象把地面推开。'
  },
  高脚杯深蹲: {
    pattern: '蹲', group: '腿', muscle: '股四头肌 · 核心', equip: '哑铃', type: 'dumbbell',
    base: 20, step: 2, pr: 32,
    cue: '哑铃抱在胸前，肘部在膝盖内侧，躯干保持直立，蹲到底再站起。'
  },
  保加利亚分腿蹲: {
    pattern: '蹲', group: '腿', muscle: '股四头肌 · 臀', equip: '哑铃', type: 'dumbbell',
    unilateral: true, base: 16, step: 2, pr: 30,
    cue: '后脚搭在凳上，前脚踩稳，重心压在前腿，下蹲时膝盖对准脚尖。'
  },
  硬拉: {
    pattern: '髋铰链', group: '背', muscle: '后链 · 竖脊肌', equip: '杠铃', type: 'barbell',
    base: 110, step: 5, pr: 140,
    cue: '杠铃贴腿，背部中立，脚蹬地站起，别用腰把杠铃抽起来。'
  },
  罗马尼亚硬拉: {
    pattern: '髋铰链', group: '腿', muscle: '腘绳肌 · 臀大肌', equip: '杠铃', type: 'barbell',
    base: 80, step: 2.5, pr: 120,
    cue: '膝盖微屈，髋向后坐，杠铃贴腿下放，后链有拉伸感就起身。'
  },
  杠铃臀桥: {
    pattern: '髋铰链', group: '臀', muscle: '臀大肌', equip: '杠铃', type: 'barbell',
    base: 60, step: 5, pr: 100,
    cue: '上背贴凳，杠铃压在髋部，顶峰夹紧臀部一秒，别用腰顶。'
  },
  单腿罗马尼亚硬拉: {
    pattern: '髋铰链', group: '臀', muscle: '臀 · 腘绳肌', equip: '哑铃', type: 'dumbbell',
    unilateral: true, base: 12, step: 2, pr: 22,
    cue: '支撑腿微屈，髋向后推，后腿与躯干保持一条线，别让髋部翻开。'
  },
  杠铃卧推: {
    pattern: '水平推', group: '胸', muscle: '胸大肌 · 肱三头肌', equip: '杠铃', type: 'barbell',
    base: 60, step: 2.5, pr: 62.5,
    cue: '肩胛后收下沉，杠铃触胸后沿斜线推起，手腕保持中立。'
  },
  哑铃卧推: {
    pattern: '水平推', group: '胸', muscle: '胸大肌', equip: '哑铃', type: 'dumbbell',
    base: 20, step: 2, pr: 30,
    cue: '肩胛收紧，肘部约 45°，下放到胸侧，推起时不要让哑铃相撞。'
  },
  绳索夹胸: {
    pattern: '水平推', group: '胸', muscle: '胸大肌', equip: '绳索', type: 'cable',
    base: 20, step: 2.5, pr: 30,
    cue: '肘部微屈固定，用胸肌把把手夹到一起，停一秒再开。'
  },
  哑铃肩推: {
    pattern: '垂直推', group: '肩', muscle: '三角肌前束 · 中束', equip: '哑铃', type: 'dumbbell',
    base: 22.5, step: 2.5, pr: 30,
    cue: '核心收紧，哑铃推到头顶正上方，别用腰去顶重量。'
  },
  侧平举: {
    pattern: '垂直推', group: '肩', muscle: '三角肌中束', equip: '哑铃', type: 'dumbbell',
    base: 8, step: 1, pr: 12.5,
    cue: '小重量控制，肘部略高于手腕，别耸肩借力。'
  },
  杠铃划船: {
    pattern: '水平拉', group: '背', muscle: '背阔肌 · 后束', equip: '杠铃', type: 'barbell',
    base: 65, step: 2.5, pr: 80,
    cue: '髋部铰链固定，杠铃拉向下腹，躯干别上下起伏。'
  },
  坐姿划船: {
    pattern: '水平拉', group: '背', muscle: '背阔肌 · 中背', equip: '器械', type: 'machine',
    base: 55, step: 5, pr: 65,
    cue: '胸口贴住垫子，肘部向后拉，顶峰夹紧肩胛一秒再回放。'
  },
  面拉: {
    pattern: '水平拉', group: '肩', muscle: '三角肌后束 · 肩袖', equip: '绳索', type: 'cable',
    base: 22.5, step: 2.5, pr: 30,
    cue: '绳索拉向眉心，末端外旋打开肩袖，肩膀别耸。'
  },
  高位下拉: {
    pattern: '垂直拉', group: '背', muscle: '背阔肌 · 大圆肌', equip: '绳索', type: 'cable',
    base: 55, step: 2.5, pr: 70,
    cue: '先沉肩再拉，杆拉到锁骨上方，回放时让背阔肌完全拉长。'
  },
  引体向上: {
    pattern: '垂直拉', group: '背', muscle: '背阔肌 · 肱二头肌', equip: '自重', type: 'bodyweight',
    bw: true, base: 0, step: 0, pr: 0,
    cue: '先沉肩再屈肘，胸口靠近横杆，下放控制住，别摆腿借力。'
  },
  哑铃弯举: {
    pattern: '手臂', group: '手臂', muscle: '肱二头肌', equip: '哑铃', type: 'dumbbell',
    base: 12, step: 1, pr: 16,
    cue: '肘部不前后摆，顶峰收缩一秒，下放慢一点。'
  },
  绳索下压: {
    pattern: '手臂', group: '手臂', muscle: '肱三头肌', equip: '绳索', type: 'cable',
    base: 30, step: 2.5, pr: 32.5,
    cue: '肘部固定贴身，只让小臂发力下压，到底停一下再回。'
  },
  腿弯举: {
    pattern: '腿后与小腿', group: '腿', muscle: '腘绳肌', equip: '器械', type: 'machine',
    base: 45, step: 2.5, pr: 60,
    cue: '收紧核心，只让腿后侧发力，别用下背代偿。'
  },
  坐姿提踵: {
    pattern: '腿后与小腿', group: '腿', muscle: '腓肠肌 · 比目鱼肌', equip: '器械', type: 'machine',
    base: 60, step: 5, pr: 90,
    cue: '顶峰停一秒，下放到小腿充分拉伸，节奏比重量重要。'
  },
  悬垂举腿: {
    pattern: '核心', group: '核心', muscle: '腹直肌 · 髂腰肌', equip: '自重', type: 'bodyweight',
    bw: true, base: 0, step: 0, pr: 0,
    cue: '身体别晃，用腹肌把骨盆卷起来，腿放下时控制住。'
  },
  绳索卷腹: {
    pattern: '核心', group: '核心', muscle: '腹直肌', equip: '绳索', type: 'cable',
    base: 35, step: 2.5, pr: 45,
    cue: '髋部固定，用腹肌把肋骨卷向骨盆，不要用手臂拉。'
  },
  平板支撑: {
    pattern: '核心', group: '核心', muscle: '腹横肌 · 核心', equip: '自重', type: 'bodyweight',
    bw: true, hold: true, base: 0, step: 0, pr: 0,
    cue: '肘在肩下，骨盆后倾，臀腿收紧，保持呼吸不要塌腰。'
  },
  健腹轮: {
    pattern: '核心', group: '核心', muscle: '腹直肌 · 背阔肌', equip: '自重', type: 'bodyweight',
    bw: true, base: 0, step: 0, pr: 0,
    cue: '收紧腹部再向前推，腰部别塌，推到能控制的位置就回。'
  }
}

function exCfg(ex, sets, repsMin, repsMax, rest) {
  return { ex, sets, repsMin, repsMax, rest }
}

export const TEMPLATES = [
  {
    id: 'fb', name: '全身新手版', sub: '全身 A / B 交替 · 每次覆盖主要肌群',
    desc: '动作简单、恢复压力小，先把深蹲、卧推、划船练扎实。',
    tags: ['新手友好', '全身'], recFor: [2, 3],
    days: [
      {
        name: '全身 A', focus: '基础力量 · 下肢主导',
        exercises: [
          exCfg('杠铃深蹲', 4, 6, 8, 150),
          exCfg('杠铃卧推', 4, 6, 8, 150),
          exCfg('坐姿划船', 3, 10, 12, 90),
          exCfg('哑铃肩推', 3, 8, 10, 90),
          exCfg('绳索下压', 2, 10, 12, 60)
        ]
      },
      {
        name: '全身 B', focus: '后链与上肢 · 髋铰链',
        exercises: [
          exCfg('罗马尼亚硬拉', 4, 8, 10, 150),
          exCfg('哑铃卧推', 4, 8, 10, 120),
          exCfg('高位下拉', 3, 10, 12, 90),
          exCfg('高脚杯深蹲', 3, 12, 12, 90),
          exCfg('哑铃弯举', 2, 10, 12, 60),
          exCfg('侧平举', 3, 12, 15, 60)
        ]
      }
    ]
  },
  {
    id: 'ul', name: '上下肢分化', sub: '上肢 / 下肢交替 · 单次更聚焦',
    desc: '上肢与下肢分开安排，适合一周四练、想提高单部位容量的人。',
    tags: ['进阶', '四分化'], recFor: [4],
    days: [
      {
        name: '上肢 A', focus: '推拉平衡 · 肩背手臂',
        exercises: [
          exCfg('杠铃卧推', 4, 6, 8, 150),
          exCfg('杠铃划船', 4, 8, 10, 150),
          exCfg('哑铃肩推', 3, 8, 10, 90),
          exCfg('高位下拉', 3, 10, 12, 90),
          exCfg('绳索下压', 3, 10, 12, 60),
          exCfg('哑铃弯举', 3, 10, 12, 60),
          exCfg('面拉', 3, 15, 15, 60)
        ]
      },
      {
        name: '下肢 A', focus: '蹲与髋铰链 · 腿部容量',
        exercises: [
          exCfg('杠铃深蹲', 4, 6, 8, 150),
          exCfg('罗马尼亚硬拉', 4, 8, 10, 150),
          exCfg('高脚杯深蹲', 3, 12, 12, 90),
          exCfg('腿弯举', 3, 12, 12, 60),
          exCfg('坐姿提踵', 3, 15, 15, 60)
        ]
      }
    ]
  },
  {
    id: 'ppl', name: '推拉腿', sub: '推 / 拉 / 腿循环 · 容量充足',
    desc: '按动作模式分化，推日练胸肩三头，拉日练背二头，腿日专注下肢。',
    tags: ['进阶', '高容量'], recFor: [5],
    days: [
      {
        name: '推日', focus: '胸 · 肩 · 三头',
        exercises: [
          exCfg('杠铃卧推', 4, 5, 6, 180),
          exCfg('哑铃卧推', 3, 8, 10, 120),
          exCfg('哑铃肩推', 3, 8, 10, 90),
          exCfg('绳索夹胸', 3, 12, 12, 60),
          exCfg('绳索下压', 3, 10, 12, 60),
          exCfg('侧平举', 3, 15, 15, 60)
        ]
      },
      {
        name: '拉日', focus: '背 · 后束 · 二头',
        exercises: [
          exCfg('硬拉', 4, 4, 6, 180),
          exCfg('高位下拉', 4, 8, 10, 90),
          exCfg('杠铃划船', 3, 8, 10, 120),
          exCfg('面拉', 3, 15, 15, 60),
          exCfg('哑铃弯举', 3, 10, 12, 60)
        ]
      },
      {
        name: '腿日', focus: '股四头 · 后链 · 小腿',
        exercises: [
          exCfg('杠铃深蹲', 4, 5, 6, 180),
          exCfg('罗马尼亚硬拉', 4, 8, 8, 150),
          exCfg('高脚杯深蹲', 3, 10, 12, 120),
          exCfg('腿弯举', 3, 12, 12, 60),
          exCfg('坐姿提踵', 3, 15, 15, 60)
        ]
      }
    ]
  },
  {
    id: 'fb3', name: '三练全身', sub: '全身 A / B / C 轮换 · 力量与容量兼顾',
    desc: '三套全身模板轮换，硬拉日与深蹲日错开，适合一周三到四练。',
    tags: ['均衡', '全身'], recFor: [3],
    days: [
      {
        name: '全身 A', focus: '下肢主导 · 全身覆盖',
        exercises: [
          exCfg('杠铃深蹲', 4, 6, 8, 150),
          exCfg('杠铃卧推', 4, 6, 8, 150),
          exCfg('坐姿划船', 3, 10, 12, 90),
          exCfg('哑铃肩推', 3, 8, 10, 90),
          exCfg('绳索下压', 3, 10, 12, 60)
        ]
      },
      {
        name: '全身 B', focus: '后链与上肢 · 髋铰链',
        exercises: [
          exCfg('罗马尼亚硬拉', 4, 8, 10, 150),
          exCfg('哑铃卧推', 4, 8, 10, 120),
          exCfg('高位下拉', 3, 10, 12, 90),
          exCfg('高脚杯深蹲', 3, 12, 12, 90),
          exCfg('哑铃弯举', 3, 10, 12, 60),
          exCfg('侧平举', 3, 12, 15, 60)
        ]
      },
      {
        name: '全身 C', focus: '力量与核心 · 全身覆盖',
        exercises: [
          exCfg('硬拉', 4, 4, 6, 180),
          exCfg('杠铃划船', 4, 8, 10, 120),
          exCfg('哑铃肩推', 3, 8, 10, 90),
          exCfg('绳索夹胸', 3, 10, 12, 60),
          exCfg('腿弯举', 3, 12, 12, 60),
          exCfg('坐姿提踵', 3, 15, 15, 60)
        ]
      }
    ]
  }
]

/* 腹部收尾：四个动作两两轮换。 */
export const ABS_POOL = {
  悬垂举腿: { sets: 3, repsMin: 10, repsMax: 15, rest: 60 },
  绳索卷腹: { sets: 3, repsMin: 12, repsMax: 15, rest: 60 },
  平板支撑: { sets: 3, repsMin: 45, repsMax: 45, rest: 60 },
  健腹轮: { sets: 3, repsMin: 10, repsMax: 12, rest: 60 }
}

export const ABS_PAIRS = [
  ['悬垂举腿', '绳索卷腹'],
  ['平板支撑', '健腹轮'],
  ['悬垂举腿', '健腹轮'],
  ['绳索卷腹', '平板支撑']
]

/* 动作模式 / 肌群 / 器械，用于动作库筛选与自定义动作。 */
export const PATTERNS = ['蹲', '髋铰链', '水平推', '垂直推', '水平拉', '垂直拉', '手臂', '腿后与小腿', '核心']
export const GROUPS = ['胸', '背', '肩', '手臂', '腿', '臀', '核心']
export const EQUIPS = ['杠铃', '哑铃', '器械', '绳索', '自重']
export const CARDIO_TYPES = ['爬坡走', '快走', '跑步', '单车', '椭圆机', '划船机']
export const CARDIO_NO_INCLINE = ['跑步', '单车']
export const MEASURES = [
  { key: 'chest', name: '胸围' },
  { key: 'waist', name: '腰围' },
  { key: 'hip', name: '臀围' },
  { key: 'arm', name: '臂围' },
  { key: 'leg', name: '腿围' }
]

/* 热身池：练腿偏髋膝踝，上肢偏肩肘。 */
export const WARM_POOL = {
  cardio: { name: '轻有氧热身', detail: '单车或划船 4 分钟，心率上来、微微出汗', tag: '全身' },
  hip: { name: '髋部环绕', detail: '双手叉腰，前后各 8 次，把髋关节活动开', tag: '髋膝踝' },
  squat: { name: '自重深蹲', detail: '15 次，幅度做满，膝盖顺着脚尖方向', tag: '髋膝踝' },
  bridge: { name: '臀桥激活', detail: '15 次，顶峰夹紧臀部 2 秒', tag: '髋膝踝' },
  ankle: { name: '踝关节背屈', detail: '每侧 10 次，脚跟不离地，膝盖向前压', tag: '髋膝踝' },
  shoulder: { name: '肩部环绕', detail: '前后各 10 次，小幅度开始逐渐加大', tag: '肩肘' },
  band: { name: '弹力带外旋', detail: '每侧 12 次，肘贴身体，只转小臂', tag: '肩肘' },
  scap: { name: '肩胛俯卧撑', detail: '10 次，手臂伸直，只让肩胛骨前后移动', tag: '肩肘' },
  catcow: { name: '猫牛式', detail: '8 次，配合呼吸活动整条脊柱', tag: '全身' }
}

const FALLBACK_EX = {
  pattern: '自定义', group: '核心', muscle: '未标注', equip: '自重', type: 'bodyweight',
  bw: true, base: 0, step: 0, pr: 0, cue: '保持动作控制，做满全程幅度。'
}

/* 自定义动作注册表：由 store 在启动与增删时写入，exInfo 统一解析。 */
let CUSTOM_EX = []

export function registerCustomExercises(list) {
  CUSTOM_EX = Array.isArray(list) ? list.filter((item) => item && item.name) : []
}

function customInfo(item) {
  const equip = item.equip || '哑铃'
  const typeMap = { 杠铃: 'barbell', 绳索: 'cable', 器械: 'machine', 自重: 'bodyweight' }
  const bw = equip === '自重'
  return {
    pattern: '自定义',
    group: item.group || '核心',
    muscle: item.muscle || item.group || '未标注',
    equip,
    type: typeMap[equip] || 'dumbbell',
    unilateral: !!item.unilateral,
    bw,
    hold: false,
    base: bw ? 0 : equip === '杠铃' ? 20 : 10,
    step: equip === '杠铃' ? 2.5 : 1,
    pr: 0,
    cue: '自定义动作 · 保持动作控制，做满全程幅度。',
    custom: true
  }
}

export function exInfo(name) {
  if (EX_LIB[name]) return EX_LIB[name]
  const hit = CUSTOM_EX.find((item) => item.name === name)
  if (hit) return customInfo(hit)
  return FALLBACK_EX
}

export function allExerciseNames() {
  return Object.keys(EX_LIB).concat(CUSTOM_EX.map((item) => item.name))
}

export function isCustomExercise(name) {
  return !!CUSTOM_EX.find((item) => item.name === name)
}

export function isBW(name) {
  return !!exInfo(name).bw
}

export function isHold(name) {
  return !!exInfo(name).hold
}

export function templateById(id) {
  return TEMPLATES.find((tpl) => tpl.id === id) || TEMPLATES[0]
}

// 根据当天动作模式推导热身项，热身不计入训练容量。
export function warmupFor(day) {
  const pats = (day.exercises || []).map((row) => exInfo(row.ex).pattern)
  const lower = pats.some((p) => p === '蹲' || p === '髋铰链' || p === '腿后与小腿')
  const upper = pats.some((p) => ['水平推', '垂直推', '水平拉', '垂直拉', '手臂'].indexOf(p) >= 0)
  let keys
  if (lower && upper) keys = ['cardio', 'hip', 'squat', 'bridge', 'shoulder', 'scap']
  else if (lower) keys = ['cardio', 'hip', 'squat', 'bridge', 'ankle']
  else if (upper) keys = ['cardio', 'shoulder', 'band', 'scap', 'catcow']
  else keys = ['cardio', 'catcow']
  return keys.map((key, index) => ({ id: index, ...WARM_POOL[key] }))
}
