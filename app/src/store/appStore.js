// 全应用共享的响应式数据，页面统一从 store 读写并调用 persist 落盘。

import { reactive } from 'vue'
import { registerCustomExercises } from '../data/catalog'
import { readStore, saveStore } from './storage'

export const store = reactive(readStore())

// 自定义动作参与动作库与训练重量预填，启动时注册一次。
registerCustomExercises(store.customEx)

export function persist() {
  registerCustomExercises(store.customEx)
  saveStore(store)
}

let saveTimer = null

// 输入过程中的高频改动合并后再落盘。
export function persistSoon(delay) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    persist()
  }, typeof delay === 'number' ? delay : 300)
}
