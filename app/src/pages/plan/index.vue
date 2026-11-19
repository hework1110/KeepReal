<template>
  <view class="kr-page plan-page">
    <view class="page-top">
      <view>
        <text class="kr-kicker">PLAN / 训练日</text>
        <text class="kr-title">计划</text>
      </view>
      <view class="kr-icon-btn" @tap="openTemplates">模板</view>
    </view>

    <view v-if="!plan" class="kr-card empty-card">
      <text class="kr-card-label">当前计划</text>
      <text class="kr-num">--</text>
      <text class="kr-empty">还没有训练计划，先选一套模板生成，再回来调整训练日。</text>
      <view class="kr-btn kr-btn--primary empty-btn" @tap="goOnboarding">去选模板</view>
    </view>

    <template v-else>
      <view class="plan-hero">
        <view class="hero-top">
          <text class="kr-tag kr-tag--acid">{{ goalName }}</text>
          <text class="hero-day">每周 {{ plan.freq }} 练</text>
        </view>
        <text class="hero-name">{{ plan.name }}</text>
        <text class="hero-meta">{{ days.length }} 个训练日 · {{ totalEx }} 个动作 · 可自由编辑</text>
        <view class="hero-stats">
          <view class="hero-stat">
            <text class="hero-stat-num">{{ days.length }}</text>
            <text class="hero-stat-label">训练日</text>
          </view>
          <view class="hero-stat">
            <text class="hero-stat-num">{{ weekSets }}</text>
            <text class="hero-stat-label">每周组数</text>
          </view>
          <view class="hero-stat">
            <text class="hero-stat-num">{{ totalEx }}</text>
            <text class="hero-stat-label">动作总数</text>
          </view>
        </view>
        <view class="hero-actions">
          <view class="mini-btn" @tap="editDay(days[0].id)">编辑训练日</view>
          <view class="mini-btn" @tap="openTemplates">更换模板</view>
        </view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">训练日</text>
        <text class="kr-section-head__meta">点开查看热身与动作</text>
      </view>
      <view class="panel">
        <view v-for="(day, i) in days" :key="day.id" class="day-row" @tap="openDay(day.id)">
          <text class="day-index">{{ pad(i + 1) }}</text>
          <view class="day-main">
            <text class="day-name">{{ day.name }}</text>
            <text class="day-focus">{{ day.focus }}</text>
          </view>
          <view class="day-meta">
            <text>{{ dayStats(day).main }} + {{ dayStats(day).abs }} 动作</text>
            <text>{{ dayStats(day).sets }} 组</text>
          </view>
          <text class="chev">›</text>
        </view>
      </view>

      <view class="kr-section-head">
        <text class="kr-section-head__title">工具</text>
        <text class="kr-section-head__meta">动作与模板</text>
      </view>
      <view class="tool-row">
        <view class="tool-card" @tap="openLibrary">
          <text class="tool-title">动作库</text>
          <text class="tool-sub">25 个核心动作 + 自定义</text>
        </view>
        <view class="tool-card" @tap="openTemplates">
          <text class="tool-title">模板库</text>
          <text class="tool-sub">内置 + 我的模板 · 可预览复制</text>
        </view>
      </view>

      <view class="notice">复制模板会替换当前训练日安排，训练历史与身体数据不受影响。</view>
    </template>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { store } from '../../store/appStore'
import { dayStats } from '../../store/plan'
import { pad } from '../../utils/format'

const GOAL_NAMES = { muscle: '增肌', cut: '减脂', both: '两者兼顾' }

onShow(() => {
  // 计划页只读展示，无计划时停留在空状态引导。
})

const plan = computed(() => store.plan)
const days = computed(() => (plan.value ? plan.value.days : []))
const goalName = computed(() => (plan.value ? GOAL_NAMES[plan.value.goal] || '增肌' : ''))
const totalEx = computed(() =>
  days.value.reduce((sum, day) => sum + dayStats(day).total, 0)
)
const weekSets = computed(() => {
  if (!plan.value) return 0
  const schedule = plan.value.schedule || []
  const train = schedule.filter((item) => item.type === 'train')
  if (!train.length) return days.value.reduce((sum, day) => sum + dayStats(day).sets, 0)
  return train.reduce((sum, item) => {
    const day = days.value.find((row) => row.id === item.dayId)
    return day ? sum + dayStats(day).sets : sum
  }, 0)
})

function goOnboarding() {
  uni.reLaunch({ url: '/pages/onboarding/index' })
}

function openDay(dayId) {
  uni.navigateTo({ url: '/pages/plan/day?id=' + dayId })
}

function editDay(dayId) {
  uni.navigateTo({ url: '/pages/plan/edit?id=' + dayId })
}

function openTemplates() {
  uni.navigateTo({ url: '/pages/templates/index' })
}

function openLibrary() {
  uni.navigateTo({ url: '/pages/library/index' })
}
</script>

<style scoped>
.plan-page {
  padding-bottom: calc(70px + env(safe-area-inset-bottom));
}

.page-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.page-top .kr-title {
  display: block;
  margin-top: 8px;
}

.empty-card {
  margin-top: 18px;
}

.empty-btn {
  margin-top: 16px;
}

.plan-hero {
  margin-top: 20px;
  padding: 18px 16px 16px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: linear-gradient(158deg, #161c17 0%, #0d110f 62%);
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.hero-day {
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-text-dim);
}

.hero-name {
  display: block;
  margin-top: 14px;
  font-family: var(--kr-font-display);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
}

.hero-meta {
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--kr-text-dim);
}

.hero-stats {
  display: flex;
  margin-top: 16px;
  border-top: 1px solid var(--kr-line);
  border-bottom: 1px solid var(--kr-line);
}

.hero-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0 10px 12px;
  border-left: 1px solid var(--kr-line);
}

.hero-stat:first-child {
  padding-left: 0;
  border-left: 0;
}

.hero-stat-num {
  font-family: var(--kr-font-display);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.05;
}

.hero-stat-label {
  font-size: 9.5px;
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
  font-size: 12px;
}

.panel {
  padding: 2px 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.day-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--kr-line);
}

.day-row:last-child {
  border-bottom: 0;
}

.day-index {
  width: 24px;
  flex: none;
  font-family: var(--kr-font-mono);
  font-size: 11px;
  color: var(--kr-text-dim);
}

.day-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.day-name {
  font-size: 14px;
  font-weight: 600;
}

.day-focus {
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.day-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.chev {
  color: var(--kr-text-dim);
  font-size: 16px;
}

.tool-row {
  display: flex;
  gap: 10px;
}

.tool-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.tool-title {
  font-size: 14px;
  font-weight: 600;
}

.tool-sub {
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.notice {
  margin-top: 20px;
  padding: 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: #0a0d0b;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--kr-text-dim);
}
</style>
