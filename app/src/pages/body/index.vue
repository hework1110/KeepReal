<template>
  <view class="kr-page body-page">
    <view class="top-line">
      <view>
        <text class="kr-kicker">BODY / 身体</text>
        <text class="kr-title">身体</text>
      </view>
      <text class="top-date">{{ todayText }}</text>
    </view>

    <view class="hero">
      <text class="hero-label">最新体重</text>
      <view v-if="weight" class="hero-value">
        <text class="hero-num">{{ fmt1(weight.kg) }}</text>
        <text class="hero-unit">KG</text>
        <text v-if="wDelta" class="hero-delta" :class="wDelta > 0 ? 'down' : 'up'">
          {{ wDelta > 0 ? '+' : '' }}{{ wDelta }}
        </text>
      </view>
      <text v-else class="hero-empty">还没有体重记录</text>
      <view class="hero-meta">
        <text v-if="weight">{{ weight.date }}</text>
        <text v-if="fat">体脂 {{ fmt1(fat.bf) }}%</text>
        <text v-else>体脂未记录</text>
      </view>
      <view class="hero-actions">
        <view class="mini-btn" @tap="openWeight">记录体重</view>
        <view class="mini-btn" @tap="openMeasure">记录围度</view>
        <view class="mini-btn" @tap="openCardio">记录有氧</view>
      </view>
    </view>

    <view class="kr-section-head">
      <text class="kr-section-head__title">体重趋势</text>
      <text class="kr-section-head__meta">{{ weightPoints.length }} 条记录</text>
    </view>
    <view class="chart-card">
      <kr-line-chart v-if="weightPoints.length" :points="weightPoints" :height="160" unit="kg" :digits="1" />
      <view v-else class="empty-inline">记录体重后显示趋势</view>
    </view>

    <view class="kr-section-head">
      <text class="kr-section-head__title">体脂率</text>
      <text class="kr-section-head__meta">独立纵轴</text>
    </view>
    <view class="chart-card">
      <kr-line-chart v-if="fatPoints.length" :points="fatPoints" :height="150" unit="%" :digits="1" />
      <view v-else class="empty-inline">体脂选填，记录后显示趋势</view>
    </view>

    <view class="kr-section-head">
      <text class="kr-section-head__title">围度</text>
      <text class="kr-section-head__meta">与上次对比 · cm</text>
    </view>
    <view class="measure-grid">
      <view v-for="item in measures" :key="item.key" class="measure-cell">
        <text class="measure-name">{{ item.name }}</text>
        <text class="measure-num">{{ measureValue(item.key) }}</text>
        <text v-if="measureDelta(item.key)" class="measure-delta" :class="measureDelta(item.key) > 0 ? 'down' : 'up'">
          {{ measureDelta(item.key) > 0 ? '+' : '' }}{{ measureDelta(item.key) }}
        </text>
        <text v-else class="measure-delta is-flat">—</text>
      </view>
    </view>

    <view class="kr-section-head">
      <text class="kr-section-head__title">有氧</text>
      <text class="kr-section-head__meta">近 7 天 {{ cardioMinutes }} 分钟</text>
    </view>
    <view v-if="cardioList.length" class="panel">
      <view v-for="row in cardioList" :key="row.id" class="cardio-row">
        <view class="cardio-main">
          <text class="cardio-type">{{ row.type }}</text>
          <text class="cardio-sub">{{ cardioDetail(row) }}</text>
        </view>
        <view class="cardio-right">
          <text class="cardio-min">{{ row.minutes }}</text>
          <text class="cardio-unit">分钟</text>
        </view>
      </view>
    </view>
    <view v-else class="empty-inline">还没有有氧记录</view>
    <view class="kr-btn kr-btn--ghost cardio-btn" @tap="openCardio">记录有氧</view>

    <kr-sheet :visible="weightVisible" title="记录体重与体脂" @close="weightVisible = false">
      <view class="field">
        <text class="field-label">体重 KG</text>
        <input v-model="weightForm.kg" class="field-input" type="digit" placeholder="例如 72.4" />
      </view>
      <view class="field">
        <text class="field-label">体脂率 % · 选填</text>
        <input v-model="weightForm.bf" class="field-input" type="digit" placeholder="留空表示不记录" />
      </view>
      <view class="sheet-foot">
        <view class="kr-btn kr-btn--primary" @tap="saveWeight">保存记录</view>
      </view>
    </kr-sheet>

    <kr-sheet :visible="measureVisible" title="记录围度" @close="measureVisible = false">
      <view class="field" v-for="item in measures" :key="'f_' + item.key">
        <text class="field-label">{{ item.name }} · cm</text>
        <input v-model="measureForm[item.key]" class="field-input" type="digit" placeholder="选填" />
      </view>
      <view class="sheet-foot">
        <view class="kr-btn kr-btn--primary" @tap="saveMeasure">保存围度</view>
      </view>
    </kr-sheet>

    <kr-sheet :visible="cardioVisible" title="记录有氧" @close="cardioVisible = false">
      <view class="field">
        <text class="field-label">项目</text>
        <view class="chips chips--wrap">
          <text
            v-for="type in cardioTypes"
            :key="type"
            class="chip"
            :class="{ 'is-on': cardioForm.type === type }"
            @tap="cardioForm.type = type"
          >{{ type }}</text>
        </view>
      </view>
      <view class="field">
        <text class="field-label">时长 · 分钟</text>
        <input v-model="cardioForm.minutes" class="field-input" type="number" placeholder="例如 30" />
      </view>
      <view class="field">
        <text class="field-label">坡度 % · 选填{{ noIncline ? '（' + cardioForm.type + '可留空）' : '' }}</text>
        <input v-model="cardioForm.incline" class="field-input" type="digit" placeholder="选填" />
      </view>
      <view class="field">
        <text class="field-label">速度 · 选填</text>
        <input v-model="cardioForm.speed" class="field-input" type="digit" placeholder="例如 6.5" />
      </view>
      <view class="sheet-foot">
        <view class="kr-btn kr-btn--primary" @tap="saveCardio">保存有氧</view>
      </view>
    </kr-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { store, persist } from '../../store/appStore'
import {
  MEASURES,
  bodyFatSeries,
  cardioWeekMinutes,
  latestBodyFat,
  latestMeasures,
  latestWeight,
  measureDeltas,
  recentCardio,
  saveCardioRecord,
  saveMeasureRecord,
  saveWeightRecord,
  weightDelta,
  weightSeries
} from '../../store/body'
import { CARDIO_NO_INCLINE, CARDIO_TYPES } from '../../data/catalog'
import { todayISO } from '../../utils/format'
import KrSheet from '../../components/KrSheet.vue'
import KrLineChart from '../../components/KrLineChart.vue'

const weightVisible = ref(false)
const measureVisible = ref(false)
const cardioVisible = ref(false)

const weightForm = reactive({ kg: '', bf: '' })
const measureForm = reactive({ chest: '', waist: '', hip: '', arm: '', leg: '' })
const cardioForm = reactive({ type: CARDIO_TYPES[0], minutes: '', incline: '', speed: '' })

const measures = MEASURES
const cardioTypes = CARDIO_TYPES

const weight = computed(() => latestWeight(store))
const fat = computed(() => latestBodyFat(store))
const wDelta = computed(() => weightDelta(store))
const weightPoints = computed(() => weightSeries(store))
const fatPoints = computed(() => bodyFatSeries(store))
const latestMeasureRow = computed(() => latestMeasures(store))
const deltas = computed(() => measureDeltas(store))
const cardioList = computed(() => recentCardio(store, 6))
const cardioMinutes = computed(() => cardioWeekMinutes(store))
const noIncline = computed(() => CARDIO_NO_INCLINE.indexOf(cardioForm.type) >= 0)
const todayText = computed(() => todayISO().split('-').slice(1).join('/'))

function fmt1(value) {
  const num = Math.round((+value || 0) * 10) / 10
  return Number.isInteger(num) ? String(num) : num.toFixed(1)
}

function measureValue(key) {
  const row = latestMeasureRow.value
  if (!row) return '--'
  const value = +row[key] || 0
  return value > 0 ? fmt1(value) : '--'
}

function measureDelta(key) {
  return deltas.value[key] || 0
}

function cardioDetail(row) {
  const parts = []
  if (row.incline) parts.push('坡度 ' + row.incline + '%')
  if (row.speed) parts.push('速度 ' + row.speed)
  parts.push(row.date.split('-').slice(1).join('/'))
  return parts.join(' · ')
}

function openWeight() {
  weightForm.kg = weight.value ? String(weight.value.kg) : ''
  weightForm.bf = fat.value ? String(fat.value.bf) : ''
  weightVisible.value = true
}

function openMeasure() {
  Object.keys(measureForm).forEach((key) => {
    measureForm[key] = latestMeasureRow.value && latestMeasureRow.value[key] ? String(latestMeasureRow.value[key]) : ''
  })
  measureVisible.value = true
}

function openCardio() {
  cardioForm.type = CARDIO_TYPES[0]
  cardioForm.minutes = ''
  cardioForm.incline = ''
  cardioForm.speed = ''
  cardioVisible.value = true
}

function saveWeight() {
  const result = saveWeightRecord(store, { ...weightForm })
  if (!result.ok) {
    uni.showToast({ title: result.msg, icon: 'none' })
    return
  }
  persist()
  weightVisible.value = false
  uni.showToast({ title: result.msg, icon: 'none' })
}

function saveMeasure() {
  const result = saveMeasureRecord(store, { ...measureForm })
  if (!result.ok) {
    uni.showToast({ title: result.msg, icon: 'none' })
    return
  }
  persist()
  measureVisible.value = false
  uni.showToast({ title: result.msg, icon: 'none' })
}

function saveCardio() {
  const result = saveCardioRecord(store, { ...cardioForm })
  if (!result.ok) {
    uni.showToast({ title: result.msg, icon: 'none' })
    return
  }
  persist()
  cardioVisible.value = false
  uni.showToast({ title: result.msg, icon: 'none' })
}
</script>

<style scoped>
.body-page {
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

.top-date {
  font-family: var(--kr-font-mono);
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.hero {
  margin-top: 18px;
  padding: 18px 16px 14px;
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
  margin-top: 4px;
}

.hero-num {
  font-family: var(--kr-font-display);
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.hero-unit {
  font-family: var(--kr-font-mono);
  font-size: 11px;
  color: var(--kr-text-dim);
}

.hero-delta {
  margin-left: 6px;
  font-family: var(--kr-font-mono);
  font-size: 12px;
}

.hero-empty {
  display: block;
  margin-top: 10px;
  font-size: 16px;
  color: var(--kr-text-dim);
}

.hero-meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.hero-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.mini-btn {
  flex: 1;
  height: 38px;
  line-height: 36px;
  text-align: center;
  border: 1px solid var(--kr-line-strong);
  border-radius: var(--kr-radius-md);
  color: var(--kr-text-sub);
  font-size: 11.5px;
}

.up {
  color: var(--kr-acid);
}

.down {
  color: var(--kr-danger);
}

.chart-card {
  padding: 12px 10px 6px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.measure-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.measure-cell {
  width: calc(33.333% - 6px);
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: var(--kr-surface);
}

.measure-name {
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.measure-num {
  font-family: var(--kr-font-display);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.1;
}

.measure-delta {
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
}

.measure-delta.is-flat {
  color: var(--kr-text-dim);
}

.panel {
  padding: 2px 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.cardio-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--kr-line);
}

.cardio-row:last-child {
  border-bottom: 0;
}

.cardio-main {
  flex: 1;
  min-width: 0;
}

.cardio-type {
  font-size: 13px;
  font-weight: 600;
}

.cardio-sub {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: var(--kr-text-dim);
}

.cardio-right {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.cardio-min {
  font-family: var(--kr-font-display);
  font-size: 20px;
  font-weight: 600;
}

.cardio-unit {
  font-size: 9px;
  color: var(--kr-text-dim);
}

.cardio-btn {
  margin-top: 10px;
  height: 42px;
  font-size: 12.5px;
}

.empty-inline {
  padding: 22px 0;
  text-align: center;
  font-size: 12px;
  color: var(--kr-text-dim);
}

.field {
  margin-bottom: 14px;
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
  background: var(--kr-surface-2);
  color: var(--kr-text);
  font-size: 13.5px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--kr-line);
  border-radius: 999px;
  font-size: 11.5px;
  color: var(--kr-text-sub);
  background: var(--kr-surface);
}

.chip.is-on {
  border-color: var(--kr-acid-line);
  background: var(--kr-acid-soft);
  color: var(--kr-acid);
}

.sheet-foot {
  padding-top: 4px;
}
</style>
