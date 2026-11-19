<template>
  <view class="kr-page edit-page">
    <view class="nav">
      <text class="nav-back" @tap="done">‹</text>
      <view class="nav-main">
        <text class="nav-title">编辑 · {{ day ? day.name : '训练日' }}</text>
        <text class="nav-sub">按住左侧序号拖动排序，改动即时保存</text>
      </view>
      <text class="nav-action" @tap="done">完成</text>
    </view>

    <template v-if="day">
      <view class="notice">拖动序号调整动作顺序；点「调节」改组数、次数区间和休息；热身会根据动作自动更新。</view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">训练动作</text>
        <text class="kr-section-head__meta">{{ day.exercises.length }} 个</text>
      </view>

      <view class="panel">
        <view
          v-for="(row, i) in day.exercises"
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
            <text class="row-sub">{{ row.sets }} 组 · {{ repsText(row) }} · {{ row.rest }}s · {{ exInfo(row.ex).equip }}</text>
          </view>
          <text class="row-tool" @tap="openConfig(i)">调节</text>
          <text class="row-del" @tap="removeExercise(i)">删</text>
        </view>
        <view v-if="!day.exercises.length" class="empty-inline">还没有动作，点下方「添加动作」从动作库选择。</view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">腹部收尾</text>
        <text class="kr-section-head__meta">固定 · 不参与编辑</text>
      </view>
      <view class="panel">
        <view v-for="(row, i) in absRows" :key="row.ex" class="ex-row ex-row--static">
          <text class="row-handle row-handle--static">{{ pad(i + 1) }}</text>
          <view class="row-main">
            <text class="row-title">{{ row.ex }}</text>
            <text class="row-sub">{{ exInfo(row.ex).muscle }}</text>
          </view>
          <view class="row-right">
            <text class="row-right-main">{{ row.sets }} 组</text>
            <text class="row-right-sub">{{ repsText(row) }}</text>
          </view>
        </view>
      </view>

      <text class="foot-note">腹部收尾由计划固定轮换，不在本页编辑；模板与计划共用这套编辑方式。</text>

      <view class="day-tools">
        <view class="kr-btn kr-btn--ghost" @tap="addDay">添加训练日</view>
        <view class="kr-btn kr-btn--ghost danger" @tap="removeDay">删除本训练日</view>
      </view>

      <view class="bottom-space" />

      <view class="bottom-bar">
        <view class="kr-btn kr-btn--primary" @tap="addExercise">添加动作</view>
      </view>
    </template>

    <view v-else class="empty-inline">训练日不存在，可能已被删除。</view>

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
import { store, persist } from '../../store/appStore'
import {
  addPlanDay,
  exercisesOfDay,
  getDayById,
  moveExercise,
  removeExerciseFromDay,
  removePlanDay,
  repsText,
  updateExercise
} from '../../store/plan'
import { exInfo } from '../../data/catalog'
import { pad } from '../../utils/format'
import { useDragSort } from '../../composables/useDragSort'
import KrExConfigSheet from '../../components/KrExConfigSheet.vue'
import { ui } from '../../store/ui'

const dayId = ref('')
const configVisible = ref(false)
const configIndex = ref(-1)
const configCfg = ref(null)

onLoad((query) => {
  dayId.value = (query && query.id) || (store.plan && store.plan.days[0] ? store.plan.days[0].id : '')
})

const day = computed(() => (store.plan ? getDayById(store.plan, dayId.value) : null))
const absRows = computed(() =>
  day.value ? exercisesOfDay(day.value).slice(day.value.exercises.length) : []
)

const { dragging, dragOffset, dragTarget, onTouchStart, onTouchMove, onTouchEnd, onMouseDown } =
  useDragSort(
    () => (day.value ? day.value.exercises.length : 0),
    (from, to) => {
      moveExercise(store.plan, dayId.value, from, to)
      persist()
    }
  )

function openConfig(index) {
  if (!day.value || !day.value.exercises[index]) return
  configIndex.value = index
  configCfg.value = { ...day.value.exercises[index] }
  configVisible.value = true
}

function saveConfig(patch) {
  if (configIndex.value >= 0) {
    updateExercise(store.plan, dayId.value, configIndex.value, patch)
    persist()
  }
  configVisible.value = false
}

function removeExercise(index) {
  uni.showModal({
    title: '删除动作',
    content: '从训练日中移除「' + day.value.exercises[index].ex + '」？',
    confirmColor: '#FF6A4D',
    success: (res) => {
      if (!res.confirm) return
      removeExerciseFromDay(store.plan, dayId.value, index)
      persist()
    }
  })
}

function addExercise() {
  ui.picker = { mode: 'day', dayId: dayId.value }
  uni.navigateTo({ url: '/pages/library/index?mode=day&dayId=' + dayId.value })
}

function addDay() {
  const created = addPlanDay(store.plan)
  persist()
  uni.redirectTo({ url: '/pages/plan/edit?id=' + created.id })
}

function removeDay() {
  if (!store.plan || store.plan.days.length <= 1) {
    uni.showToast({ title: '至少保留一个训练日', icon: 'none' })
    return
  }
  uni.showModal({
    title: '删除训练日',
    content: '删除「' + day.value.name + '」？训练历史不会受影响。',
    confirmColor: '#FF6A4D',
    success: (res) => {
      if (!res.confirm) return
      removePlanDay(store.plan, dayId.value)
      persist()
      uni.navigateBack({
        fail: () => uni.switchTab({ url: '/pages/plan/index' })
      })
    }
  })
}

function done() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/plan/index' })
  })
}
</script>

<style scoped>
.edit-page {
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

.notice {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: #0a0d0b;
  font-size: 10.5px;
  line-height: 1.65;
  color: var(--kr-text-dim);
}

.panel {
  padding: 2px 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
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

.ex-row--static {
  opacity: 0.82;
}

.ex-row.is-dragging {
  position: relative;
  z-index: 5;
  opacity: 0.92;
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

.row-handle--static {
  border-color: var(--kr-line);
}

.row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.row-title {
  font-size: 13.5px;
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

.row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.row-right-main {
  font-family: var(--kr-font-mono);
  font-size: 12px;
}

.row-right-sub {
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.empty-inline {
  padding: 18px 0;
  text-align: center;
  font-size: 12px;
  color: var(--kr-text-dim);
}

.foot-note {
  display: block;
  margin-top: 12px;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--kr-text-dim);
}

.day-tools {
  display: flex;
  gap: 10px;
  margin-top: 18px;
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
  height: 16px;
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
