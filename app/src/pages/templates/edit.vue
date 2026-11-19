<template>
  <view class="kr-page tpl-edit-page">
    <view class="nav">
      <text class="nav-back" @tap="goBack">‹</text>
      <view class="nav-main">
        <text class="nav-title">{{ isNew ? '新建模板' : '编辑模板' }}</text>
        <text class="nav-sub">保存后可在模板库复制成计划</text>
      </view>
      <text class="nav-action" @tap="save">保存</text>
    </view>

    <template v-if="draft">
      <view class="field">
        <text class="field-label">模板名称</text>
        <input v-model="draft.name" class="field-input" type="text" maxlength="20" placeholder="例如：我的四分化" />
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">训练日</text>
        <text class="kr-section-head__meta">{{ draft.days.length }} 个</text>
      </view>
      <scroll-view scroll-x class="day-tabs">
        <view class="day-tabs-inner">
          <view
            v-for="(day, i) in draft.days"
            :key="day.id"
            class="day-tab"
            :class="{ 'is-on': day.id === activeDayId }"
            @tap="activeDayId = day.id"
          >
            <text class="day-tab-num">{{ pad(i + 1) }}</text>
            <text class="day-tab-name">{{ day.name }}</text>
          </view>
          <text class="day-tab day-tab--add" @tap="addDay">＋</text>
        </view>
      </scroll-view>

      <template v-if="activeDay">
        <view class="field field--inline">
          <text class="field-label">训练日名称</text>
          <input v-model="activeDay.name" class="field-input field-input--sm" type="text" maxlength="12" />
        </view>

        <view class="panel">
          <view
            v-for="(row, i) in activeDay.exercises"
            :key="row.ex + '_' + i"
            class="ex-row"
            :class="{ 'is-dragging': dragging === i, 'is-target': dragTarget === i && dragging !== i }"
            :style="dragging === i ? { transform: 'translateY(' + dragOffset + 'px)' } : null"
          >
            <text
              class="row-handle"
              @touchstart.stop="onTouchStart(i, $event)"
              @touchmove.stop.prevent="onTouchMove($event)"
              @touchend.stop="onTouchEnd"
              @touchcancel.stop="onTouchEnd"
              @mousedown.stop="onMouseDown(i, $event)"
            >{{ pad(i + 1) }}</text>
            <view class="row-main">
              <text class="row-title">{{ row.ex }}</text>
              <text class="row-sub">{{ row.sets }} 组 · {{ repsText(row) }} · {{ row.rest }}s</text>
            </view>
            <text class="row-tool" @tap="openConfig(i)">调节</text>
            <text class="row-del" @tap="removeExercise(i)">删</text>
          </view>
          <view v-if="!activeDay.exercises.length" class="empty-inline">还没有动作，添加几个再保存。</view>
        </view>

        <view class="day-tools">
          <view class="kr-btn kr-btn--ghost" @tap="addExercise">添加动作</view>
          <view class="kr-btn kr-btn--ghost danger" @tap="removeDay">删除本日</view>
        </view>
      </template>

      <view class="bottom-space" />
      <view class="bottom-bar">
        <view class="kr-btn kr-btn--primary" @tap="save">保存模板</view>
      </view>
    </template>

    <kr-ex-config-sheet
      :visible="configVisible"
      :cfg="configCfg"
      @close="configVisible = false"
      @save="saveConfig"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { persist, store } from '../../store/appStore'
import { ui } from '../../store/ui'
import {
  addTemplateDay,
  createTemplateDraft,
  moveTemplateExercise,
  removeTemplateDay,
  removeTemplateExercise,
  saveTemplateDraft
} from '../../store/templates'
import { pad } from '../../utils/format'
import { repsText } from '../../store/plan'
import { useDragSort } from '../../composables/useDragSort'
import KrExConfigSheet from '../../components/KrExConfigSheet.vue'

const isNew = ref(true)
const activeDayId = ref('')
const configVisible = ref(false)
const configIndex = ref(-1)
const configCfg = ref(null)

onLoad(() => {
  if (!ui.tplDraft) ui.tplDraft = createTemplateDraft()
  isNew.value = !store.templates.some((tpl) => tpl.id === ui.tplDraft.id)
  if (!activeDayId.value && ui.tplDraft.days.length) activeDayId.value = ui.tplDraft.days[0].id
})

const draft = computed(() => ui.tplDraft)
const activeDay = computed(() => {
  if (!draft.value) return null
  return draft.value.days.find((day) => day.id === activeDayId.value) || draft.value.days[0] || null
})

const { dragging, dragOffset, dragTarget, onTouchStart, onTouchMove, onTouchEnd, onMouseDown } =
  useDragSort(
    () => (activeDay.value ? activeDay.value.exercises.length : 0),
    (from, to) => {
      if (activeDay.value) moveTemplateExercise(activeDay.value, from, to)
    }
  )

function addDay() {
  addTemplateDay(draft.value)
  activeDayId.value = draft.value.days[draft.value.days.length - 1].id
}

function removeDay() {
  if (!activeDay.value) return
  if (draft.value.days.length <= 1) {
    uni.showToast({ title: '至少保留一个训练日', icon: 'none' })
    return
  }
  uni.showModal({
    title: '删除训练日',
    content: '删除「' + activeDay.value.name + '」？',
    confirmColor: '#FF6A4D',
    success: (res) => {
      if (!res.confirm) return
      removeTemplateDay(draft.value, activeDay.value.id)
      activeDayId.value = draft.value.days[0].id
    }
  })
}

function addExercise() {
  if (!activeDay.value) return
  ui.picker = { mode: 'tpl', dayId: activeDay.value.id }
  uni.navigateTo({ url: '/pages/library/index?mode=tpl&dayId=' + activeDay.value.id })
}

function removeExercise(index) {
  if (!activeDay.value) return
  removeTemplateExercise(activeDay.value, index)
}

function openConfig(index) {
  if (!activeDay.value) return
  configIndex.value = index
  configCfg.value = { ...activeDay.value.exercises[index] }
  configVisible.value = true
}

function saveConfig(patch) {
  if (activeDay.value && activeDay.value.exercises[configIndex.value]) {
    Object.assign(activeDay.value.exercises[configIndex.value], patch)
  }
  configVisible.value = false
}

function save() {
  if (!draft.value) return
  const result = saveTemplateDraft(store, draft.value)
  if (!result.ok) {
    uni.showToast({ title: result.msg, icon: 'none' })
    return
  }
  persist()
  ui.tplDraft = null
  uni.showToast({ title: result.msg, icon: 'none' })
  setTimeout(() => {
    uni.navigateBack({
      fail: () => uni.switchTab({ url: '/pages/plan/index' })
    })
  }, 260)
}

function goBack() {
  ui.tplDraft = null
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/plan/index' })
  })
}
</script>

<style scoped>
.tpl-edit-page {
  padding-bottom: calc(90px + env(safe-area-inset-bottom));
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-back {
  width: 34px;
  height: 34px;
  line-height: 30px;
  text-align: center;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  color: var(--kr-text-sub);
  font-size: 20px;
}

.nav-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-title {
  font-size: 16px;
  font-weight: 700;
}

.nav-sub {
  font-size: 10px;
  color: var(--kr-text-dim);
}

.nav-action {
  font-size: 13px;
  color: var(--kr-acid);
}

.field {
  margin-top: 16px;
}

.field--inline {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.field--inline .field-label {
  margin-bottom: 0;
}

.field-label {
  display: block;
  margin-bottom: 7px;
  font-size: 11px;
  color: var(--kr-text-dim);
}

.field-input {
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: var(--kr-surface);
  color: var(--kr-text);
  font-size: 13.5px;
}

.field-input--sm {
  flex: 1;
  height: 36px;
}

.day-tabs {
  white-space: nowrap;
}

.day-tabs-inner {
  display: inline-flex;
  gap: 8px;
  padding-bottom: 2px;
}

.day-tab {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 13px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: var(--kr-surface);
}

.day-tab--add {
  width: 40px;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: var(--kr-text-dim);
  font-size: 15px;
}

.day-tab.is-on {
  border-color: var(--kr-acid-line);
  background: var(--kr-acid-soft);
}

.day-tab-num {
  font-family: var(--kr-font-mono);
  font-size: 9px;
  color: var(--kr-text-dim);
}

.day-tab.is-on .day-tab-num {
  color: var(--kr-acid);
}

.day-tab-name {
  font-size: 11.5px;
  color: var(--kr-text-sub);
}

.day-tab.is-on .day-tab-name {
  color: var(--kr-text);
}

.panel {
  padding: 2px 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
  margin-top: 10px;
}

.ex-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--kr-line);
  background: var(--kr-surface);
}

.ex-row:last-child {
  border-bottom: 0;
}

.ex-row.is-dragging {
  position: relative;
  z-index: 5;
  border-radius: var(--kr-radius-md);
  background: var(--kr-surface-2);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}

.ex-row.is-target {
  background: var(--kr-acid-soft);
}

.row-handle {
  width: 30px;
  height: 32px;
  line-height: 30px;
  flex: none;
  text-align: center;
  border: 1px dashed var(--kr-line-strong);
  border-radius: var(--kr-radius-sm);
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-text-dim);
}

.row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.row-title {
  font-size: 13px;
  font-weight: 600;
}

.row-sub {
  font-size: 10px;
  color: var(--kr-text-dim);
}

.row-tool {
  padding: 5px 8px;
  border: 1px solid var(--kr-line-strong);
  border-radius: var(--kr-radius-sm);
  font-size: 10.5px;
  color: var(--kr-text-sub);
}

.row-del {
  padding: 5px 8px;
  font-size: 10.5px;
  color: var(--kr-danger);
}

.empty-inline {
  padding: 18px 0;
  text-align: center;
  font-size: 12px;
  color: var(--kr-text-dim);
}

.day-tools {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.day-tools .kr-btn {
  flex: 1;
  height: 44px;
  font-size: 12.5px;
}

.day-tools .danger {
  color: var(--kr-danger);
}

.bottom-space {
  height: 24px;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--kr-line);
  background: rgba(8, 10, 9, 0.96);
}
</style>
