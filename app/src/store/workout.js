// 训练会话：生成草稿、读取上次数据、结算训练汇总与 PR。

import { PLATES, exInfo, isBW, isHold } from '../data/catalog'
import { exercisesOfDay, getDayById } from './plan'
import { fmtNum, todayISO } from '../utils/format'

export function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

// 最近一次练过该动作的历史（从新到旧）。
export function lastLift(store, name) {
  for (let i = 0; i < store.records.sessions.length; i++) {
    const session = store.records.sessions[i]
    const lift = (session.lifts || []).find((row) => row.ex === name)
    if (lift) return lift
  }
  return null
}

function prefillRow(store, cfg, setIdx) {
  const info = exInfo(cfg.ex)
  const last = lastLift(store, cfg.ex)
  const detail = last && Array.isArray(last.detail) ? last.detail[setIdx] : null

  let weight = 0
  if (detail && detail.weight > 0) weight = detail.weight
  else if (last && last.weight > 0) weight = last.weight
  else if (!info.bw) weight = info.base || 0

  let reps = cfg.repsMax
  if (detail && detail.reps > 0) reps = detail.reps
  else if (last && last.reps > 0) reps = last.reps

  return { weight: fmtNum(weight), reps: String(reps) }
}

export function makeSession(store, entry) {
  const day = getDayById(store.plan, entry.dayId)
  if (!day) return null
  const exercises = exercisesOfDay(day)
  const sets = []
  exercises.forEach((cfg, exIdx) => {
    for (let setIdx = 0; setIdx < cfg.sets; setIdx++) {
      const prefill = prefillRow(store, cfg, setIdx)
      sets.push({
        ex: cfg.ex,
        exIdx,
        setIdx,
        weight: prefill.weight,
        reps: prefill.reps,
        done: false
      })
    }
  })
  return {
    dayId: day.id,
    dayName: day.name,
    date: entry.date || todayISO(),
    elapsed: 0,
    openEx: 0,
    exercises,
    sets,
    rest: null
  }
}

// 生成历史记录：容量、完成组数、时长、PR 与每个动作的明细。
// 会同时更新 store.records.prs（有旧纪录且被超过才计入 PR 列表）。
export function buildSummary(store) {
  const draft = store.draft
  if (!draft) return null

  const doneRows = draft.sets.filter((row) => row.done && +row.reps > 0)
  const weighted = doneRows.filter((row) => +row.weight > 0)

  const names = []
  draft.sets.forEach((row) => {
    if (!names.includes(row.ex)) names.push(row.ex)
  })

  const breakdown = names.map((name) => {
    const allRows = draft.sets
      .filter((row) => row.ex === name)
      .sort((a, b) => a.setIdx - b.setIdx)
    const rows = doneRows.filter((row) => row.ex === name)
    const wRows = weighted.filter((row) => row.ex === name)

    let best = null
    let volume = 0
    wRows.forEach((row) => {
      const w = +row.weight
      const reps = +row.reps
      volume += w * reps
      if (!best || w > best.weight) best = { weight: w, reps }
    })

    const detail = allRows.map((row) => {
      if (!row.done || !(+row.reps > 0)) return null
      return { weight: +row.weight || 0, reps: +row.reps }
    })

    return {
      name,
      sets: rows.length,
      planSets: allRows.length,
      volume,
      best,
      bw: isBW(name),
      detail
    }
  })

  const prs = []
  breakdown.forEach((row) => {
    if (!row.best || row.bw) return
    const old = store.records.prs[row.name]
    if (typeof old === 'number') {
      if (row.best.weight > old + 0.001) {
        prs.push({ name: row.name, from: old, to: row.best.weight })
        store.records.prs[row.name] = row.best.weight
      }
    } else {
      // 第一次记录只建立基线，不算刷新 PR。
      store.records.prs[row.name] = row.best.weight
    }
  })

  const lifts = breakdown
    .filter((row) => row.best)
    .map((row) => ({
      ex: row.name,
      weight: row.best.weight,
      reps: row.best.reps,
      e1rm: Math.round(row.best.weight * (1 + row.best.reps / 30) * 10) / 10,
      volume: row.volume,
      sets: row.sets,
      detail: row.detail
    }))

  const volume = weighted.reduce((sum, row) => sum + +row.weight * +row.reps, 0)

  return {
    id: uid('h'),
    date: draft.date,
    dayId: draft.dayId,
    workoutName: draft.dayName,
    volume,
    sets: doneRows.length,
    totalSets: draft.sets.length,
    duration: Math.round(draft.elapsed || 0),
    prs,
    breakdown,
    lifts
  }
}

// 杠铃配重：返回每侧需要的杠铃片与剩余重量。
export function plateStack(weight) {
  const total = +weight || 0
  const bar = 20
  let perSide = Math.max(0, (total - bar) / 2)
  const used = []
  PLATES.forEach((plate) => {
    while (perSide >= plate - 0.001) {
      used.push(plate)
      perSide = Math.round((perSide - plate) * 100) / 100
    }
  })
  return {
    bar,
    perSide: Math.round(Math.max(0, (total - bar) / 2) * 100) / 100,
    used,
    left: Math.max(0, perSide),
    valid: total >= bar
  }
}

export function isHoldExercise(name) {
  return isHold(name)
}
