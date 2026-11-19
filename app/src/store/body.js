// 身体数据：体重/体脂同一条记录，围度与有氧独立记录。

import { MEASURES } from '../data/catalog'
import { isoOf, todayISO } from '../utils/format'
import { uid } from '../utils/id'

function parseISO(iso) {
  const part = String(iso || '').split('-')
  return new Date(+part[0], +part[1] - 1, +part[2])
}

function shortDate(iso) {
  const date = parseISO(iso)
  return date.getMonth() + 1 + '/' + date.getDate()
}

function ascending(rows) {
  return rows.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

function latestOf(rows) {
  const list = ascending(rows)
  return list.length ? list[list.length - 1] : null
}

export { MEASURES }

export function weightSeries(store, limit) {
  const max = limit || 24
  return ascending(store.body.weights || [])
    .filter((row) => +row.kg > 0)
    .slice(-max)
    .map((row) => ({ date: row.date, label: shortDate(row.date), value: +row.kg }))
}

export function bodyFatSeries(store, limit) {
  const max = limit || 24
  return ascending(store.body.weights || [])
    .filter((row) => +row.bf > 0)
    .slice(-max)
    .map((row) => ({ date: row.date, label: shortDate(row.date), value: +row.bf }))
}

export function latestWeight(store) {
  const list = ascending((store.body.weights || []).filter((row) => +row.kg > 0))
  return list.length ? list[list.length - 1] : null
}

export function weightDelta(store) {
  const list = ascending((store.body.weights || []).filter((row) => +row.kg > 0))
  if (list.length < 2) return 0
  return Math.round((list[list.length - 1].kg - list[list.length - 2].kg) * 10) / 10
}

export function latestBodyFat(store) {
  const list = ascending((store.body.weights || []).filter((row) => +row.bf > 0))
  return list.length ? list[list.length - 1] : null
}

export function latestMeasures(store) {
  const list = ascending(store.body.measures || [])
  return list.length ? list[list.length - 1] : null
}

export function measureDeltas(store) {
  const list = ascending(store.body.measures || [])
  if (list.length < 2) return {}
  const last = list[list.length - 1]
  const prev = list[list.length - 2]
  const out = {}
  MEASURES.forEach((item) => {
    const now = +last[item.key] || 0
    const before = +prev[item.key] || 0
    out[item.key] = now && before ? Math.round((now - before) * 10) / 10 : 0
  })
  return out
}

// 同一天只保留一条体重记录，重复记录时合并。
export function saveWeightRecord(store, payload) {
  const kg = +payload.kg || 0
  const bf = +payload.bf || 0
  if (!(kg > 0) && !(bf > 0)) return { ok: false, msg: '体重和体脂至少填一项' }
  if (kg > 400) return { ok: false, msg: '体重数值看起来不太对' }
  if (bf > 70) return { ok: false, msg: '体脂率数值看起来不太对' }
  const date = payload.date || todayISO()
  const hit = (store.body.weights || []).find((row) => row.date === date)
  if (hit) {
    if (kg > 0) hit.kg = kg
    if (bf > 0) hit.bf = bf
  } else {
    store.body.weights.push({ id: uid('w'), date, kg, bf })
  }
  return { ok: true, msg: '已记录' }
}

export function saveMeasureRecord(store, payload) {
  const values = {}
  let filled = 0
  MEASURES.forEach((item) => {
    const value = +payload[item.key] || 0
    if (value > 0) filled += 1
    values[item.key] = value
  })
  if (!filled) return { ok: false, msg: '至少填写一项围度' }
  const date = payload.date || todayISO()
  const hit = (store.body.measures || []).find((row) => row.date === date)
  if (hit) Object.assign(hit, values)
  else store.body.measures.push({ id: uid('m'), date, ...values })
  return { ok: true, msg: '围度已记录' }
}

export function saveCardioRecord(store, payload) {
  const minutes = +payload.minutes || 0
  if (!payload.type) return { ok: false, msg: '请选择有氧项目' }
  if (!(minutes > 0)) return { ok: false, msg: '时长需要大于 0' }
  if (minutes > 600) return { ok: false, msg: '时长数值看起来不太对' }
  store.body.cardio.push({
    id: uid('c'),
    date: payload.date || todayISO(),
    type: payload.type,
    minutes,
    incline: +payload.incline || 0,
    speed: +payload.speed || 0
  })
  return { ok: true, msg: '有氧已记录' }
}

export function cardioWeekMinutes(store) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  const startISO = isoOf(start)
  return (store.body.cardio || [])
    .filter((row) => row.date >= startISO)
    .reduce((sum, row) => sum + (+row.minutes || 0), 0)
}

export function recentCardio(store, limit) {
  const max = limit || 6
  return (store.body.cardio || [])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, max)
}

export function totalCardioMinutes(row) {
  return +row.minutes || 0
}
