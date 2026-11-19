// 本地数据层：统一封装 uni 的同步存储，页面不直接调用 uni.getStorageSync。
// version 字段用于后续结构升级时的迁移判断。
// 数据模型对齐 2026-11-19 原型的训练主链路。

export const STORAGE_KEY = 'keepreal.app'
export const SCHEMA_VERSION = 2

export function createEmptyStore() {
  return {
    version: SCHEMA_VERSION,
    plan: null,
    draft: null,
    records: {
      sessions: [], // 训练历史（汇总记录）
      prs: {} // 动作名 -> 最大重量
    },
    body: {
      weights: [], // { date, value }
      bodyFats: [], // { date, value }
      cardio: [] // { date, type, minutes, note }
    }
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizePlan(raw) {
  if (!isObject(raw) || typeof raw.templateId !== 'string' || !raw.templateId) return null
  if (!Array.isArray(raw.days) || !raw.days.length) return null
  const days = raw.days.filter(isObject).map((day) => ({
    ...day,
    exercises: Array.isArray(day.exercises) ? day.exercises.filter(isObject) : [],
    abs: Array.isArray(day.abs) ? day.abs : []
  }))
  return {
    ...raw,
    days,
    rotation: Array.isArray(raw.rotation) ? raw.rotation : days.map((day) => day.id),
    schedule: Array.isArray(raw.schedule) ? raw.schedule.filter(isObject) : []
  }
}

function normalizeDraft(raw) {
  if (!isObject(raw)) return null
  if (!Array.isArray(raw.sets) || !Array.isArray(raw.exercises)) return null
  return {
    ...raw,
    openEx: typeof raw.openEx === 'number' ? raw.openEx : 0,
    elapsed: typeof raw.elapsed === 'number' ? raw.elapsed : 0,
    exercises: raw.exercises.filter(isObject),
    sets: raw.sets.filter(isObject),
    rest: isObject(raw.rest) ? raw.rest : null
  }
}

// 把任意读取结果收敛成合法结构，缺字段时用空壳补齐。
function normalize(raw) {
  const base = createEmptyStore()
  if (!isObject(raw)) return base

  const records = isObject(raw.records) ? raw.records : {}
  const body = isObject(raw.body) ? raw.body : {}

  return {
    version: SCHEMA_VERSION,
    plan: normalizePlan(raw.plan),
    draft: normalizeDraft(raw.draft),
    records: {
      sessions: Array.isArray(records.sessions) ? records.sessions.filter(isObject) : [],
      prs: isObject(records.prs) ? { ...records.prs } : {}
    },
    body: {
      weights: Array.isArray(body.weights) ? body.weights : [],
      bodyFats: Array.isArray(body.bodyFats) ? body.bodyFats : [],
      cardio: Array.isArray(body.cardio) ? body.cardio : []
    }
  }
}

function parseRaw(raw) {
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (error) {
    console.warn('[storage] 本地数据解析失败，已回退为空数据', error)
    return null
  }
}

export function readStore() {
  try {
    return normalize(parseRaw(uni.getStorageSync(STORAGE_KEY)))
  } catch (error) {
    console.warn('[storage] 读取本地数据失败，已回退为空数据', error)
    return createEmptyStore()
  }
}

export function saveStore(store) {
  // reactive 对象转成纯数据后再落盘，避免代理对象跨端序列化问题。
  const next = normalize(JSON.parse(JSON.stringify(store || createEmptyStore())))
  try {
    uni.setStorageSync(STORAGE_KEY, next)
  } catch (error) {
    console.warn('[storage] 写入本地数据失败', error)
  }
  return next
}

// 首次启动时落地一份空数据；旧版本数据在这里升级到当前版本。
export function ensureStore() {
  let raw = ''
  try {
    raw = uni.getStorageSync(STORAGE_KEY)
  } catch (error) {
    console.warn('[storage] 无法访问本地存储，本次运行仅使用内存数据', error)
    return createEmptyStore()
  }
  const parsed = parseRaw(raw)
  if (!parsed) return saveStore(createEmptyStore())
  const normalized = normalize(parsed)
  if (parsed.version !== SCHEMA_VERSION) return saveStore(normalized)
  return normalized
}

export function resetStore() {
  return saveStore(createEmptyStore())
}
