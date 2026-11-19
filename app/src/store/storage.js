// 本地数据层：统一封装 uni 的同步存储，页面不直接调用 uni.getStorageSync。
// 数据结构预留 version 字段，后续模型升级时按版本号做迁移。

export const STORAGE_KEY = 'keepreal.app'
export const SCHEMA_VERSION = 1

// 三类数据的空壳：计划 / 训练记录 / 身体数据。
// 字段命名对齐 2026-11-19 原型的数据模型，便于后续直接搬运。
export function createEmptyStore() {
  return {
    version: SCHEMA_VERSION,
    plan: {
      templateId: '',
      goal: '', // muscle | fat
      freq: 0,
      createdAt: '',
      schedule: [] // { date, dow, dayNum, month, type: 'train' | 'rest', workoutId }
    },
    records: {
      sessions: [] // { date, workoutId, workoutName, volume, sets, duration, prs }
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

// 把任意读取结果收敛成合法结构，缺字段时用空壳补齐。
function normalize(raw) {
  const base = createEmptyStore()
  if (!isObject(raw)) return base

  const plan = isObject(raw.plan) ? raw.plan : {}
  const records = isObject(raw.records) ? raw.records : {}
  const body = isObject(raw.body) ? raw.body : {}

  return {
    version: typeof raw.version === 'number' ? raw.version : SCHEMA_VERSION,
    plan: {
      ...base.plan,
      ...plan,
      schedule: Array.isArray(plan.schedule) ? plan.schedule : []
    },
    records: {
      ...base.records,
      ...records,
      sessions: Array.isArray(records.sessions) ? records.sessions : []
    },
    body: {
      ...base.body,
      ...body,
      weights: Array.isArray(body.weights) ? body.weights : [],
      bodyFats: Array.isArray(body.bodyFats) ? body.bodyFats : [],
      cardio: Array.isArray(body.cardio) ? body.cardio : []
    }
  }
}

export function readStore() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return createEmptyStore()
    return normalize(typeof raw === 'string' ? JSON.parse(raw) : raw)
  } catch (error) {
    console.warn('[storage] 读取本地数据失败，已回退为空数据', error)
    return createEmptyStore()
  }
}

export function saveStore(store) {
  const next = normalize(store)
  try {
    uni.setStorageSync(STORAGE_KEY, next)
  } catch (error) {
    console.warn('[storage] 写入本地数据失败', error)
  }
  return next
}

// 首次启动时落地一份空数据，之后所有读写都基于这份结构。
export function ensureStore() {
  let raw = ''
  try {
    raw = uni.getStorageSync(STORAGE_KEY)
  } catch (error) {
    console.warn('[storage] 无法访问本地存储，本次运行仅使用内存数据', error)
    return createEmptyStore()
  }
  if (!raw) return saveStore(createEmptyStore())
  return normalize(typeof raw === 'string' ? JSON.parse(raw) : raw)
}

export function resetStore() {
  return saveStore(createEmptyStore())
}
