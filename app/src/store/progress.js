// 进步页数据：容量分桶、PR 榜与单动作趋势，全部来自本机训练历史。

import { addDays, isoOf, todayISO } from '../utils/format'

export const PROGRESS_RANGES = [
  { id: '1w', label: '近一周', days: 7 },
  { id: '3m', label: '近三个月', days: 91 },
  { id: '6m', label: '近半年', days: 182 },
  { id: '1y', label: '近一年', days: 365 },
  { id: 'all', label: '全部', days: 36500 }
]

export function rangeById(id) {
  return PROGRESS_RANGES.find((item) => item.id === id) || PROGRESS_RANGES[0]
}

function parseISO(iso) {
  const part = String(iso || '').split('-')
  return new Date(+part[0], +part[1] - 1, +part[2])
}

function daysBetween(fromISO, toISO) {
  return Math.round((parseISO(toISO) - parseISO(fromISO)) / 86400000)
}

function mondayOf(date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (day.getDay() + 6) % 7
  day.setDate(day.getDate() - offset)
  return day
}

function shortDate(iso) {
  const date = parseISO(iso)
  return date.getMonth() + 1 + '/' + date.getDate()
}

export function e1rm(weight, reps) {
  const w = +weight || 0
  const r = +reps || 0
  if (!(w > 0) || !(r > 0)) return 0
  return Math.round(w * (1 + r / 30) * 10) / 10
}

export function sessionsInRange(store, range) {
  const days = rangeById(range).days
  const today = todayISO()
  return (store.records.sessions || []).filter((row) => daysBetween(row.date, today) <= days)
}

// 近一周按天分桶，其余区间按周分桶（周一对齐）。
export function progressBuckets(store, range) {
  const sessions = store.records.sessions || []
  if (range === '1w') {
    const buckets = []
    for (let i = 6; i >= 0; i--) {
      const iso = isoOf(addDays(new Date(), -i))
      buckets.push({ label: shortDate(iso), value: 0, start: iso })
    }
    sessions.forEach((row) => {
      const bucket = buckets.find((item) => item.start === row.date)
      if (bucket) bucket.value += +row.volume || 0
    })
    return { buckets, daily: true }
  }

  const thisMonday = mondayOf(new Date())
  let count
  if (range === 'all') {
    let earliest = null
    sessions.forEach((row) => {
      const date = parseISO(row.date)
      if (!earliest || date < earliest) earliest = date
    })
    count = earliest ? Math.round((thisMonday - mondayOf(earliest)) / 604800000) + 1 : 4
    count = Math.min(53, Math.max(4, count))
  } else {
    count = range === '1y' ? 53 : range === '6m' ? 27 : 13
  }

  const buckets = []
  for (let i = count - 1; i >= 0; i--) {
    const monday = addDays(thisMonday, -7 * i)
    buckets.push({ label: shortDate(isoOf(monday)), value: 0, start: isoOf(monday) })
  }
  sessions.forEach((row) => {
    const diff = Math.round((thisMonday - mondayOf(parseISO(row.date))) / 604800000)
    if (diff >= 0 && diff < count) buckets[count - 1 - diff].value += +row.volume || 0
  })
  return { buckets, daily: false }
}

// PR 榜：最好重量与预估 1RM 分别取历史最优。
export function prBoard(store, range) {
  const days = rangeById(range).days
  const today = todayISO()
  const map = {}
  ;(store.records.sessions || []).forEach((session) => {
    if (daysBetween(session.date, today) > days) return
    ;(session.lifts || []).forEach((lift) => {
      if (!(lift.weight > 0) || !(lift.reps > 0)) return
      const row = map[lift.ex] || (map[lift.ex] = {
        ex: lift.ex,
        weight: 0,
        reps: 0,
        weightDate: session.date,
        e1rm: 0,
        e1rmDate: session.date
      })
      const value = e1rm(lift.weight, lift.reps)
      if (lift.weight > row.weight || (lift.weight === row.weight && lift.reps > row.reps)) {
        row.weight = lift.weight
        row.reps = lift.reps
        row.weightDate = session.date
      }
      if (value > row.e1rm) {
        row.e1rm = value
        row.e1rmDate = session.date
      }
    })
  })
  return Object.keys(map)
    .map((key) => map[key])
    .filter((row) => row.weight > 0)
    .sort((a, b) => b.e1rm - a.e1rm)
}

// 有记录的动作，按最近一次出现排序。
export function recordedExercises(store, range) {
  const sessions = sessionsInRange(store, range).slice().sort((a, b) => (a.date < b.date ? 1 : -1))
  const seen = {}
  const out = []
  sessions.forEach((session) => {
    ;(session.lifts || []).forEach((lift) => {
      if (lift.weight > 0 && !seen[lift.ex]) {
        seen[lift.ex] = 1
        out.push(lift.ex)
      }
    })
  })
  return out
}

export function exSeries(store, name, range) {
  const days = rangeById(range).days
  const today = todayISO()
  return (store.records.sessions || [])
    .filter((session) => daysBetween(session.date, today) <= days)
    .map((session) => {
      const lift = (session.lifts || []).find((item) => item.ex === name)
      if (!lift || !(lift.e1rm > 0)) return null
      return { date: session.date, label: shortDate(session.date), value: lift.e1rm, weight: lift.weight, reps: lift.reps }
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}
