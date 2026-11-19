<template>
  <view class="kr-page progress-page">
    <view class="top-line">
      <view>
        <text class="kr-kicker">PROGRESS / 趋势</text>
        <text class="kr-title">进步</text>
      </view>
      <picker mode="selector" :range="rangeLabels" :value="rangeIndex" @change="onRangeChange">
        <view class="range-select">
          <text>{{ rangeLabel }}</text>
          <text class="range-caret">▾</text>
        </view>
      </picker>
    </view>

    <template v-if="hasData">
      <view class="hero">
        <text class="hero-label">训练容量 · {{ rangeLabel }}</text>
        <view class="hero-value">
          <text class="hero-num">{{ fmtVol(totalVolume) }}</text>
          <text class="hero-unit">KG</text>
        </view>
        <view class="hero-meta">
          <text>{{ sessions.length }} 次训练</text>
          <text v-if="prevBucket > 0" :class="delta >= 0 ? 'up' : 'down'">
            较上一{{ unit }} {{ delta >= 0 ? '+' : '' }}{{ delta }}%
          </text>
          <text v-else>上一{{ unit }}暂无记录</text>
        </view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">{{ daily ? '每日训练容量' : '周训练容量' }}</text>
        <text class="kr-section-head__meta">单位 KG</text>
      </view>
      <view class="chart-card">
        <view class="bars">
          <view v-for="(bar, i) in buckets" :key="bar.start + i" class="bar-col">
            <view
              class="bar"
              :class="{ 'is-hot': i === buckets.length - 1 }"
              :style="{ height: barHeight(bar.value) + '%' }"
            />
          </view>
        </view>
        <view class="bar-labels">
          <text
            v-for="(bar, i) in buckets"
            :key="'l' + bar.start + i"
            class="bar-label"
            :class="{ 'is-hidden': !showLabel(i) }"
          >{{ bar.label }}</text>
        </view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">PR 榜</text>
        <text class="kr-section-head__meta">最好重量 / 预估 1RM</text>
      </view>
      <view v-if="prs.length" class="panel">
        <view v-for="row in shownPrs" :key="row.ex" class="pr-row">
          <view class="pr-main">
            <text class="pr-name">{{ row.ex }}</text>
            <text class="pr-sub">{{ row.weight }} kg × {{ row.reps }} · {{ shortDate(row.weightDate) }}</text>
          </view>
          <view class="pr-right">
            <text class="pr-e1rm">{{ row.e1rm }}</text>
            <text class="pr-e1rm-label">e1RM</text>
          </view>
        </view>
        <text v-if="prs.length > 8" class="text-btn" @tap="toggleAllPr">
          {{ store.ui.prAll ? '收起' : '查看全部 ' + prs.length + ' 项' }}
        </text>
      </view>
      <view v-else class="empty-inline">这个时间范围内还没有重量记录。</view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">单动作趋势</text>
        <text class="kr-section-head__meta">预估 1RM · {{ rangeLabel }}</text>
      </view>

      <view v-if="names.length" class="ex-select">
        <scroll-view scroll-x class="ex-scroll">
          <view class="ex-chips">
            <text
              v-for="name in names"
              :key="name"
              class="ex-chip"
              :class="{ 'is-on': name === selected }"
              @tap="selectEx(name)"
            >{{ name }}</text>
          </view>
        </scroll-view>
        <view class="ex-more" @tap="moreVisible = true">…</view>
      </view>

      <view v-if="selected" class="curve-card">
        <view class="curve-head">
          <text class="curve-name">{{ selected }}</text>
          <text class="curve-count">{{ series.length }} 次记录</text>
        </view>
        <kr-line-chart :points="series" :height="170" unit="" :digits="0" />
        <view v-if="series.length" class="curve-stats">
          <view class="curve-stat">
            <text class="curve-stat-label">最新 e1RM</text>
            <text class="curve-stat-num">{{ Math.round(series[series.length - 1].value) }}<text class="curve-stat-unit">kg</text></text>
          </view>
          <view class="curve-stat">
            <text class="curve-stat-label">区间变化</text>
            <text class="curve-stat-num" :class="exDelta >= 0 ? 'up' : 'down'">{{ exDelta >= 0 ? '+' : '' }}{{ exDelta }}<text class="curve-stat-unit">%</text></text>
          </view>
          <view class="curve-stat">
            <text class="curve-stat-label">最好重量</text>
            <text class="curve-stat-num">{{ bestWeight }}<text class="curve-stat-unit">kg</text></text>
          </view>
        </view>
      </view>
      <view v-else class="empty-inline">这个时间范围内还没有单动作记录。</view>
    </template>

    <view v-else class="empty-card">
      <text class="empty-title">还没有训练数据</text>
      <text class="empty-sub">完成一次训练后，这里会出现容量、PR 和单动作趋势。</text>
      <view class="kr-btn kr-btn--ghost empty-btn" @tap="goToday">去今天页</view>
    </view>

    <kr-sheet :visible="moreVisible" title="全部有记录的动作" @close="moreVisible = false">
      <view v-for="name in names" :key="'m' + name" class="more-row" @tap="selectEx(name)">
        <text class="more-name" :class="{ 'is-on': name === selected }">{{ name }}</text>
        <text v-if="name === selected" class="more-tag">当前</text>
      </view>
      <view v-if="!names.length" class="empty-inline">暂无动作记录</view>
    </kr-sheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { store } from '../../store/appStore'
import {
  PROGRESS_RANGES,
  exSeries,
  prBoard,
  progressBuckets,
  rangeById,
  recordedExercises,
  sessionsInRange
} from '../../store/progress'
import { fmtVol } from '../../utils/format'
import KrSheet from '../../components/KrSheet.vue'
import KrLineChart from '../../components/KrLineChart.vue'

const moreVisible = ref(false)

const rangeLabels = PROGRESS_RANGES.map((item) => item.label)
const rangeIndex = computed(() => {
  const index = PROGRESS_RANGES.findIndex((item) => item.id === store.ui.progressRange)
  return index < 0 ? 0 : index
})
const rangeLabel = computed(() => rangeById(store.ui.progressRange).label)
const activeRange = computed(() => rangeById(store.ui.progressRange))

const sessions = computed(() => sessionsInRange(store, activeRange.value.id))
const hasData = computed(() => sessions.value.length > 0)
const pack = computed(() => progressBuckets(store, activeRange.value.id))
const buckets = computed(() => pack.value.buckets)
const daily = computed(() => pack.value.daily)
const unit = computed(() => (daily.value ? '天' : '周'))
const totalVolume = computed(() => buckets.value.reduce((sum, bar) => sum + bar.value, 0))
const prevBucket = computed(() => (buckets.value.length > 1 ? buckets.value[buckets.value.length - 2].value : 0))
const delta = computed(() => {
  const last = buckets.value.length ? buckets.value[buckets.value.length - 1].value : 0
  if (!prevBucket.value) return 0
  return Math.round(((last - prevBucket.value) / prevBucket.value) * 100)
})

const prs = computed(() => prBoard(store, activeRange.value.id))
const shownPrs = computed(() => (store.ui.prAll ? prs.value : prs.value.slice(0, 8)))
const names = computed(() => recordedExercises(store, activeRange.value.id))
const selected = computed(() => {
  if (store.ui.progressEx && names.value.indexOf(store.ui.progressEx) >= 0) return store.ui.progressEx
  return names.value.indexOf('杠铃深蹲') >= 0 ? '杠铃深蹲' : names.value[0] || null
})
const series = computed(() => (selected.value ? exSeries(store, selected.value, activeRange.value.id) : []))
const bestWeight = computed(() => {
  if (!series.value.length) return 0
  return Math.max.apply(null, series.value.map((row) => row.weight || 0))
})
const exDelta = computed(() => {
  if (!series.value.length) return 0
  const first = series.value[0].value
  const last = series.value[series.value.length - 1].value
  if (!first) return 0
  return Math.round(((last - first) / first) * 100)
})

const maxVolume = computed(() => {
  const max = Math.max.apply(null, buckets.value.map((bar) => bar.value).concat([1]))
  return max
})

function barHeight(value) {
  if (!value) return 2
  return Math.max(2, Math.round((value / maxVolume.value) * 100))
}

function showLabel(index) {
  const n = buckets.value.length
  if (n <= 8) return true
  return index === 0 || index === n - 1 || index === Math.floor((n - 1) / 2)
}

function shortDate(iso) {
  const part = String(iso || '').split('-')
  return part[1] ? +part[1] + '/' + +part[2] : ''
}

function onRangeChange(event) {
  const option = PROGRESS_RANGES[Number(event.detail.value)]
  if (!option) return
  store.ui.progressRange = option.id
  store.ui.progressEx = null
}

function selectEx(name) {
  store.ui.progressEx = name
  moreVisible.value = false
}

function toggleAllPr() {
  store.ui.prAll = !store.ui.prAll
}

function goToday() {
  uni.switchTab({ url: '/pages/today/index' })
}

onShow(() => {
  const list = recordedExercises(store, rangeById(store.ui.progressRange).id)
  if (!list.length) return
  if (store.ui.progressEx && list.indexOf(store.ui.progressEx) >= 0) return
  store.ui.progressEx = list.indexOf('杠铃深蹲') >= 0 ? '杠铃深蹲' : list[0]
})
</script>

<style scoped>
.progress-page {
  padding-bottom: calc(70px + env(safe-area-inset-bottom));
}

.top-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.top-line .kr-title {
  display: block;
  margin-top: 8px;
}

.range-select {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border: 1px solid var(--kr-line-strong);
  border-radius: var(--kr-radius-md);
  font-size: 11.5px;
  color: var(--kr-text-sub);
}

.range-caret {
  font-size: 9px;
  color: var(--kr-text-dim);
}

.hero {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: linear-gradient(158deg, #161c17 0%, #0d110f 62%);
}

.hero-label {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--kr-text-dim);
}

.hero-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 6px;
}

.hero-num {
  font-family: var(--kr-font-display);
  font-size: 46px;
  font-weight: 700;
  line-height: 1;
}

.hero-unit {
  font-family: var(--kr-font-mono);
  font-size: 11px;
  color: var(--kr-text-dim);
}

.hero-meta {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.up {
  color: var(--kr-acid);
}

.down {
  color: var(--kr-danger);
}

.chart-card {
  padding: 16px 12px 10px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 132px;
  border-bottom: 1px solid var(--kr-line);
  padding-bottom: 2px;
}

.bar-col {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--kr-line-3);
}

.bar.is-hot {
  background: var(--kr-acid);
}

.bar-labels {
  display: flex;
  gap: 3px;
  margin-top: 6px;
}

.bar-label {
  flex: 1;
  text-align: center;
  font-family: var(--kr-font-mono);
  font-size: 8px;
  color: var(--kr-text-dim);
  white-space: nowrap;
  overflow: hidden;
}

.bar-label.is-hidden {
  visibility: hidden;
}

.panel {
  padding: 2px 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.pr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--kr-line);
}

.pr-row:last-of-type {
  border-bottom: 0;
}

.pr-main {
  flex: 1;
  min-width: 0;
}

.pr-name {
  font-size: 13px;
  font-weight: 600;
}

.pr-sub {
  display: block;
  margin-top: 3px;
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.pr-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.pr-e1rm {
  font-family: var(--kr-font-display);
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  color: var(--kr-acid);
}

.pr-e1rm-label {
  margin-top: 2px;
  font-family: var(--kr-font-mono);
  font-size: 8px;
  color: var(--kr-text-dim);
}

.text-btn {
  display: block;
  padding: 12px 0;
  text-align: center;
  font-size: 11.5px;
  color: var(--kr-acid);
}

.ex-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ex-scroll {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.ex-chips {
  display: inline-flex;
  gap: 8px;
}

.ex-chip {
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--kr-line);
  border-radius: 999px;
  font-size: 11.5px;
  color: var(--kr-text-sub);
  background: var(--kr-surface);
}

.ex-chip.is-on {
  border-color: var(--kr-acid-line);
  background: var(--kr-acid-soft);
  color: var(--kr-acid);
}

.ex-more {
  width: 38px;
  height: 34px;
  flex: none;
  line-height: 30px;
  text-align: center;
  border: 1px solid var(--kr-line-strong);
  border-radius: var(--kr-radius-md);
  color: var(--kr-text-sub);
  font-size: 16px;
}

.curve-card {
  margin-top: 10px;
  padding: 14px 12px 10px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.curve-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 0 2px 6px;
}

.curve-name {
  font-size: 13.5px;
  font-weight: 600;
}

.curve-count {
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.curve-stats {
  display: flex;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--kr-line);
}

.curve-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 12px;
  border-left: 1px solid var(--kr-line);
}

.curve-stat:first-child {
  padding-left: 2px;
  border-left: 0;
}

.curve-stat-label {
  font-size: 9px;
  color: var(--kr-text-dim);
}

.curve-stat-num {
  font-family: var(--kr-font-display);
  font-size: 19px;
  font-weight: 600;
}

.curve-stat-unit {
  margin-left: 2px;
  font-family: var(--kr-font-body);
  font-size: 9px;
  font-weight: 400;
  color: var(--kr-text-dim);
}

.empty-inline {
  padding: 22px 0;
  text-align: center;
  font-size: 12px;
  color: var(--kr-text-dim);
}

.empty-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 18px;
  padding: 20px;
  border: 1px dashed var(--kr-line-strong);
  border-radius: var(--kr-radius-lg);
}

.empty-title {
  font-size: 14px;
  color: var(--kr-text-sub);
}

.empty-sub {
  font-size: 11px;
  line-height: 1.6;
  color: var(--kr-text-dim);
}

.empty-btn {
  margin-top: 10px;
  height: 38px;
  font-size: 12px;
}

.more-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px solid var(--kr-line);
}

.more-name {
  font-size: 13px;
  color: var(--kr-text-sub);
}

.more-name.is-on {
  color: var(--kr-acid);
}

.more-tag {
  font-family: var(--kr-font-mono);
  font-size: 9px;
  color: var(--kr-acid);
}
</style>
