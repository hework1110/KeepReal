// 计划生成与查询：把模板展开成训练日、排期与今日视图需要的数据。

import { ABS_PAIRS, ABS_POOL, DAY_CN, isHold, templateById } from '../data/catalog'
import { addDays, isoOf, todayISO } from '../utils/format'
import { uid } from '../utils/id'

const OFFSETS = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 2, 4, 5],
  5: [0, 1, 3, 4, 6]
}

// 把模板展开成可编辑的训练日：带上腹部收尾与轮换顺序。
export function planDaysFromTemplate(tpl) {
  const days = (tpl.days || []).map((day, idx) => {
    const pair = ABS_PAIRS[idx % ABS_PAIRS.length]
    return {
      id: tpl.id + '_d' + idx,
      name: day.name,
      focus: day.focus || '自定义训练日',
      exercises: (day.exercises || []).map((row) => ({ ...row })),
      abs: pair.slice(),
      absDetail: pair.map((name) => ({ ex: name, ...ABS_POOL[name] }))
    }
  })
  return { days, rotation: days.map((day) => day.id) }
}

export function emptyPlanDay(index) {
  const pair = ABS_PAIRS[index % ABS_PAIRS.length]
  return {
    id: uid('d'),
    name: '训练日 ' + (index + 1),
    focus: '自定义训练日',
    exercises: [],
    abs: pair.slice(),
    absDetail: pair.map((name) => ({ ex: name, ...ABS_POOL[name] }))
  }
}

export function defaultExerciseCfg(name) {
  return { ex: name, sets: 3, repsMin: 8, repsMax: 12, rest: 90 }
}

export function buildSchedule(days, freq) {
  const offsets = OFFSETS[freq] || OFFSETS[3]
  const start = new Date()
  const out = []
  let trainIndex = 0
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(start, offset)
    const base = {
      date: isoOf(date),
      dow: DAY_CN[date.getDay()],
      dayNum: date.getDate(),
      month: date.getMonth() + 1
    }
    if (offsets.indexOf(offset) >= 0) {
      out.push({
        ...base,
        type: 'train',
        dayId: days[trainIndex % days.length].id,
        index: trainIndex + 1
      })
      trainIndex++
    } else {
      out.push({ ...base, type: 'rest' })
    }
  }
  return out
}

export function buildPlanFromTemplate(tpl, goal, freq) {
  const expanded = planDaysFromTemplate(tpl)
  return {
    templateId: tpl.id,
    name: tpl.name,
    goal: goal || 'muscle',
    freq: freq || 3,
    createdAt: todayISO(),
    days: expanded.days,
    rotation: expanded.rotation,
    schedule: buildSchedule(expanded.days, freq || 3)
  }
}

export function buildPlan(templateId, goal, freq) {
  return buildPlanFromTemplate(templateById(templateId), goal, freq)
}

export function rebuildSchedule(plan) {
  plan.schedule = buildSchedule(plan.days, plan.freq)
  plan.rotation = plan.days.map((day) => day.id)
}

/* ---------- 训练日编辑 ---------- */

export function addExerciseToDay(plan, dayId, name) {
  const day = getDayById(plan, dayId)
  if (!day || !name) return false
  if (day.exercises.some((row) => row.ex === name)) return false
  day.exercises.push(defaultExerciseCfg(name))
  return true
}

export function removeExerciseFromDay(plan, dayId, index) {
  const day = getDayById(plan, dayId)
  if (!day || index < 0 || index >= day.exercises.length) return false
  day.exercises.splice(index, 1)
  return true
}

export function moveExercise(plan, dayId, from, to) {
  const day = getDayById(plan, dayId)
  if (!day || from === to || from < 0 || to < 0) return false
  if (from >= day.exercises.length || to >= day.exercises.length) return false
  const [row] = day.exercises.splice(from, 1)
  day.exercises.splice(to, 0, row)
  return true
}

export function updateExercise(plan, dayId, index, patch) {
  const day = getDayById(plan, dayId)
  if (!day || !day.exercises[index]) return false
  Object.assign(day.exercises[index], patch)
  return true
}

export function addPlanDay(plan) {
  const day = emptyPlanDay(plan.days.length)
  plan.days.push(day)
  rebuildSchedule(plan)
  return day
}

export function removePlanDay(plan, dayId) {
  if (!plan || plan.days.length <= 1) return false
  const index = plan.days.findIndex((day) => day.id === dayId)
  if (index < 0) return false
  plan.days.splice(index, 1)
  rebuildSchedule(plan)
  return true
}

export function getDayById(plan, dayId) {
  if (!plan) return null
  return plan.days.find((day) => day.id === dayId) || null
}

export function exercisesOfDay(day) {
  return [...day.exercises, ...(day.absDetail || [])]
}

export function repsText(cfg) {
  if (isHold(cfg.ex)) return (cfg.repsMax || 45) + ' 秒'
  if (cfg.repsMin === cfg.repsMax) return cfg.repsMin + ' 次'
  return cfg.repsMin + '–' + cfg.repsMax + ' 次'
}

export function dayStats(day) {
  const all = exercisesOfDay(day)
  const sets = all.reduce((sum, row) => sum + row.sets, 0)
  const sec = all.reduce((sum, row) => sum + row.sets * (45 + row.rest), 0)
  const minutes = Math.max(20, Math.round((sec + 420) / 60 / 5) * 5)
  return {
    main: day.exercises.length,
    abs: day.abs.length,
    total: all.length,
    sets,
    minutes
  }
}

export function nextTrainAfter(plan, index) {
  if (!plan) return null
  const schedule = plan.schedule || []
  const from = typeof index === 'number' ? index : 0
  for (let i = from + 1; i < schedule.length; i++) {
    if (schedule[i].type === 'train') return schedule[i]
  }
  return null
}

// 排期覆盖 7 天；过期后才重新排期，保证休息日状态真实可达。
export function ensurePlanFresh(store) {
  const plan = store.plan
  if (!plan) return false
  const today = todayISO()
  let changed = false
  const schedule = plan.schedule || []
  const first = schedule[0] ? schedule[0].date : ''
  const last = schedule.length ? schedule[schedule.length - 1].date : ''
  if (!first || today < first || today > last) {
    plan.schedule = buildSchedule(plan.days, plan.freq)
    changed = true
  }
  if (store.draft && store.draft.date !== today) {
    store.draft = null
    changed = true
  }
  return changed
}
