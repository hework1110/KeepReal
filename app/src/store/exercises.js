// 动作库查询与自定义动作：动作数据本身来自 data/catalog.js。

import { EQUIPS, GROUPS, allExerciseNames, exInfo } from '../data/catalog'

export function allGroups(store) {
  const extra = (store && store.ui && store.ui.customGroups) || []
  return GROUPS.concat(extra.filter((name) => GROUPS.indexOf(name) < 0))
}

export function allEquips(store) {
  const extra = (store && store.ui && store.ui.customEquips) || []
  return EQUIPS.concat(extra.filter((name) => EQUIPS.indexOf(name) < 0))
}

export function addCustomGroup(store, name) {
  const value = String(name || '').trim()
  if (!value) return false
  if (allGroups(store).indexOf(value) >= 0) return false
  store.ui.customGroups.push(value)
  return true
}

export function addCustomEquip(store, name) {
  const value = String(name || '').trim()
  if (!value) return false
  if (allEquips(store).indexOf(value) >= 0) return false
  store.ui.customEquips.push(value)
  return true
}

export function filterExerciseNames(store, query, group, equip) {
  const q = String(query || '').trim().toLowerCase()
  return allExerciseNames().filter((name) => {
    const info = exInfo(name)
    if (group && group !== '全部' && info.group !== group) return false
    if (equip && equip !== '全部' && info.equip !== equip) return false
    if (!q) return true
    const hay = (name + ' ' + info.muscle + ' ' + info.group + ' ' + info.equip + ' ' + info.pattern).toLowerCase()
    return hay.indexOf(q) >= 0
  })
}

// 自定义动作只保存名称、主要肌群、器械和是否单侧。
export function addCustomExercise(store, payload) {
  const name = String(payload.name || '').trim()
  if (!name) return { ok: false, msg: '动作名称不能为空' }
  if (name.length > 20) return { ok: false, msg: '动作名称最多 20 个字' }
  const duplicated =
    allExerciseNames().indexOf(name) >= 0 || (store.customEx || []).some((item) => item.name === name)
  if (duplicated) return { ok: false, msg: '动作库里已有同名动作' }
  store.customEx.push({
    name,
    group: payload.group || '核心',
    equip: payload.equip || '哑铃',
    unilateral: !!payload.unilateral
  })
  return { ok: true, msg: '动作已加入动作库' }
}
