<template>
  <view class="kr-page day-page">
    <view class="nav">
      <text class="nav-back" @tap="goBack">‹</text>
      <view class="nav-main">
        <text class="nav-title">{{ day ? day.name : '训练日' }}</text>
        <text class="nav-sub">{{ day ? day.focus : '' }}</text>
      </view>
      <text v-if="day" class="nav-action" @tap="editDay">编辑</text>
    </view>

    <template v-if="day">
      <scroll-view scroll-x class="day-tabs">
        <view class="day-tabs-inner">
          <view
            v-for="(item, i) in days"
            :key="item.id"
            class="day-tab"
            :class="{ 'is-on': item.id === dayId }"
            @tap="selectDay(item.id)"
          >
            <text class="day-tab-num">{{ pad(i + 1) }}</text>
            <text class="day-tab-name">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="stat-grid">
        <view class="stat-cell">
          <text class="stat-label">主训练</text>
          <text class="stat-num">{{ stats.main }}<text class="stat-unit">动作</text></text>
        </view>
        <view class="stat-cell">
          <text class="stat-label">总组数</text>
          <text class="stat-num">{{ stats.sets }}<text class="stat-unit">组</text></text>
        </view>
        <view class="stat-cell">
          <text class="stat-label">预计</text>
          <text class="stat-num">{{ stats.minutes }}<text class="stat-unit">分钟</text></text>
        </view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">热身</text>
        <text class="kr-section-head__meta">{{ warm.length }} 项 · 不计容量</text>
      </view>
      <view class="panel">
        <view v-for="(item, i) in warm" :key="item.id" class="warm-row">
          <text class="row-index">{{ pad(i + 1) }}</text>
          <view class="row-main">
            <view class="row-title-line">
              <text class="row-title">{{ item.name }}</text>
              <text class="kr-tag">{{ item.tag }}</text>
            </view>
            <text class="row-sub">{{ item.detail }}</text>
          </view>
        </view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">训练动作</text>
        <text class="kr-section-head__meta">{{ day.exercises.length }} 个</text>
      </view>
      <view class="panel">
        <view v-for="(row, i) in day.exercises" :key="row.ex + i" class="ex-row">
          <text class="row-index">{{ pad(i + 1) }}</text>
          <view class="row-main">
            <view class="row-title-line">
              <text class="row-title">{{ row.ex }}</text>
              <text v-if="exInfo(row.ex).unilateral" class="kr-tag">单侧</text>
            </view>
            <text class="row-sub">{{ exInfo(row.ex).muscle }} · {{ exInfo(row.ex).equip }}</text>
          </view>
          <view class="row-right">
            <text class="row-right-main">{{ row.sets }} 组</text>
            <text class="row-right-sub">{{ repsText(row) }} · {{ row.rest }}s</text>
          </view>
        </view>
        <view v-if="!day.exercises.length" class="empty-inline">这个训练日还没有动作，点下方按钮添加。</view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">腹部收尾</text>
        <text class="kr-section-head__meta">固定 2 个动作</text>
      </view>
      <view class="panel">
        <view v-for="(row, i) in absRows" :key="row.ex" class="ex-row">
          <text class="row-index">{{ pad(i + 1) }}</text>
          <view class="row-main">
            <view class="row-title-line">
              <text class="row-title">{{ row.ex }}</text>
              <text class="kr-tag kr-tag--acid">收尾</text>
            </view>
            <text class="row-sub">{{ exInfo(row.ex).muscle }}</text>
          </view>
          <view class="row-right">
            <text class="row-right-main">{{ row.sets }} 组</text>
            <text class="row-right-sub">{{ repsText(row) }}</text>
          </view>
        </view>
      </view>

      <text class="foot-note">热身只热身不计容量；收尾动作计入组数与容量。</text>

      <view class="kr-btn kr-btn--primary edit-btn" @tap="editDay">编辑训练日</view>
    </template>

    <view v-else class="empty-inline">训练日不存在，可能已被删除。</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { store } from '../../store/appStore'
import { dayStats, exercisesOfDay, getDayById, repsText } from '../../store/plan'
import { exInfo, warmupFor } from '../../data/catalog'
import { pad } from '../../utils/format'

const dayId = ref('')

onLoad((query) => {
  dayId.value = (query && query.id) || (store.plan && store.plan.days[0] ? store.plan.days[0].id : '')
})

const days = computed(() => (store.plan ? store.plan.days : []))
const day = computed(() => (store.plan ? getDayById(store.plan, dayId.value) : null))
const stats = computed(() => (day.value ? dayStats(day.value) : { main: 0, abs: 0, total: 0, sets: 0, minutes: 0 }))
const warm = computed(() => (day.value ? warmupFor(day.value) : []))
const absRows = computed(() =>
  day.value ? exercisesOfDay(day.value).slice(day.value.exercises.length) : []
)

function selectDay(id) {
  dayId.value = id
}

function editDay() {
  if (!day.value) return
  uni.navigateTo({ url: '/pages/plan/edit?id=' + day.value.id })
}

function goBack() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/plan/index' })
  })
}
</script>

<style scoped>
.day-page {
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
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
  font-size: 18px;
  font-weight: 700;
}

.nav-sub {
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.nav-action {
  font-size: 13px;
  color: var(--kr-acid);
}

.day-tabs {
  margin-top: 16px;
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
  padding: 9px 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: var(--kr-surface);
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
  font-size: 12px;
  color: var(--kr-text-sub);
}

.day-tab.is-on .day-tab-name {
  color: var(--kr-text);
}

.stat-grid {
  display: flex;
  margin-top: 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.stat-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  border-left: 1px solid var(--kr-line);
}

.stat-cell:first-child {
  border-left: 0;
}

.stat-label {
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--kr-text-dim);
}

.stat-num {
  font-family: var(--kr-font-display);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
}

.stat-unit {
  margin-left: 3px;
  font-family: var(--kr-font-body);
  font-size: 10px;
  font-weight: 400;
  color: var(--kr-text-dim);
}

.panel {
  padding: 2px 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.warm-row {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--kr-line);
}

.warm-row:last-child,
.ex-row:last-child {
  border-bottom: 0;
}

.row-index {
  width: 22px;
  flex: none;
  padding-top: 2px;
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-text-dim);
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.row-title {
  font-size: 13.5px;
  font-weight: 600;
}

.row-sub {
  display: block;
  margin-top: 3px;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--kr-text-dim);
}

.ex-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--kr-line);
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
  color: var(--kr-text);
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

.edit-btn {
  margin-top: 18px;
}
</style>
