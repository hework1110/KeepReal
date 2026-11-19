// 自定义模板：新建、编辑、复制为计划与预览。

import { ABS_PAIRS, ABS_POOL } from '../data/catalog'
import { uid } from '../utils/id'

export function customTemplates(store) {
  return store.templates || []
}

export function findCustomTemplate(store, id) {
  return customTemplates(store).find((tpl) => tpl.id === id) || null
}

export function templateMeta(tpl) {
  const days = tpl.days || []
  const exCount = days.reduce((sum, day) => sum + (day.exercises || []).length, 0)
  const sets = days.reduce(
    (sum, day) => sum + (day.exercises || []).reduce((inner, row) => inner + (+row.sets || 0), 0),
    0
  )
  return { exCount, sets }
}

export function emptyTemplateDay(index) {
  return { id: uid('td'), name: '训练日 ' + (index + 1), focus: '自定义训练日', exercises: [] }
}

export function createTemplateDraft() {
  return { id: uid('tpl'), name: '', days: [emptyTemplateDay(0)] }
}

export function cloneForEdit(tpl) {
  return JSON.parse(JSON.stringify(tpl))
}

export function addTemplateDay(draft) {
  draft.days.push(emptyTemplateDay(draft.days.length))
}

export function removeTemplateDay(draft, dayId) {
  if (draft.days.length <= 1) return false
  const index = draft.days.findIndex((day) => day.id === dayId)
  if (index < 0) return false
  draft.days.splice(index, 1)
  return true
}

export function addTemplateExercise(day, name) {
  if (!day || !name) return false
  if (day.exercises.some((row) => row.ex === name)) return false
  day.exercises.push({ ex: name, sets: 3, repsMin: 8, repsMax: 12, rest: 90 })
  return true
}

export function removeTemplateExercise(day, index) {
  if (!day || index < 0 || index >= day.exercises.length) return false
  day.exercises.splice(index, 1)
  return true
}

export function moveTemplateExercise(day, from, to) {
  if (!day || from === to || from < 0 || to < 0) return false
  if (from >= day.exercises.length || to >= day.exercises.length) return false
  const [row] = day.exercises.splice(from, 1)
  day.exercises.splice(to, 0, row)
  return true
}

export function saveTemplateDraft(store, draft) {
  const name = String(draft.name || '').trim()
  if (!name) return { ok: false, msg: '模板名称不能为空' }
  if (!draft.days.length) return { ok: false, msg: '至少需要一个训练日' }
  const empty = draft.days.find((day) => !day.exercises.length)
  if (empty) return { ok: false, msg: '「' + empty.name + '」还没有动作' }
  const payload = JSON.parse(JSON.stringify(draft))
  payload.name = name
  const index = customTemplates(store).findIndex((tpl) => tpl.id === payload.id)
  if (index >= 0) store.templates[index] = payload
  else store.templates.push(payload)
  return { ok: true, msg: '模板已保存' }
}

export function deleteTemplate(store, id) {
  const index = customTemplates(store).findIndex((tpl) => tpl.id === id)
  if (index < 0) return false
  store.templates.splice(index, 1)
  return true
}

// 预览时补上腹部收尾，和复制出的计划保持一致。
export function previewTemplateDays(tpl) {
  return (tpl.days || []).map((day, index) => {
    const pair = ABS_PAIRS[index % ABS_PAIRS.length]
    return {
      ...day,
      abs: pair,
      absDetail: pair.map((name) => ({ ex: name, ...ABS_POOL[name] }))
    }
  })
}
