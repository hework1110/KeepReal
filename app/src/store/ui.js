// 页面级临时状态：不落盘的编辑草稿与动作库筛选条件。

import { reactive } from 'vue'

export const ui = reactive({
  libQuery: '',
  libGroup: '全部',
  libEquip: '全部',
  tplDraft: null, // 自定义模板编辑草稿
  picker: null // { mode: 'day' | 'tpl', dayId }
})

export function resetLibraryFilters() {
  ui.libQuery = ''
  ui.libGroup = '全部'
  ui.libEquip = '全部'
}
