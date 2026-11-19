<template>
  <view v-if="ready" class="kr-page home">
    <view class="brand">
      <view class="brand-left">
        <text class="brand-mark">K</text>
        <text class="brand-name">KEEPREAL</text>
      </view>
      <text class="brand-date">{{ dateText }}</text>
    </view>

    <view class="kr-head">
      <text class="kr-kicker">{{ weekday }} / {{ planMeta }}</text>
      <text class="kr-title">今天</text>
    </view>

    <!-- 有草稿：继续训练 -->
    <view v-if="draft" class="hero hero--draft">
      <view class="corner" />
      <view class="corner corner--br" />
      <view class="hero-top">
        <text class="kr-tag kr-tag--acid">继续训练</text>
        <text class="hero-day">{{ draftElapsed }}</text>
      </view>
      <text class="hero-name">{{ draft.dayName }}</text>
      <text class="hero-focus">已完成 {{ draftDone }} / {{ draftTotal }} 组，草稿已保存在本机。</text>
      <view class="live-bar"><view class="live-bar__fill" :style="{ width: draftPct + '%' }" /></view>
      <view class="live-meta">
        <text>进度 <text class="live-meta__num">{{ draftPct }}%</text></text>
        <text>接下来 <text class="live-meta__num">{{ draftNext }}</text></text>
      </view>
      <view class="kr-btn kr-btn--primary" @tap="resumeTraining">继续训练</view>
    </view>

    <!-- 今日已完成 -->
    <view v-else-if="doneSession" class="hero hero--done">
      <view class="corner" />
      <view class="corner corner--br" />
      <view class="hero-top">
        <text class="kr-tag">今日已完成</text>
        <text class="hero-day">{{ doneSession.workoutName }}</text>
      </view>
      <text class="hero-name">练完了</text>
      <text class="hero-focus">这练已写入本地训练历史，PR 与容量都已结算。</text>
      <view class="stat-row">
        <view class="stat">
          <text class="stat-num">{{ fmtVol(doneSession.volume) }}<text class="stat-unit">KG</text></text>
          <text class="stat-label">总容量</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ doneSession.sets }}<text class="stat-unit">组</text></text>
          <text class="stat-label">完成组数</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ doneSession.prs.length }}<text class="stat-unit">个</text></text>
          <text class="stat-label">刷新 PR</text>
        </view>
      </view>
      <view class="kr-btn kr-btn--ghost" @tap="openSummary">查看训练汇总</view>
      <view v-if="next" class="next-box">
        <text class="next-label">NEXT SESSION</text>
        <view class="next-row">
          <text>下一次</text>
          <text class="next-name">{{ nextDay ? nextDay.name : '训练日' }}</text>
        </view>
        <text class="next-meta">{{ nextText }} · {{ nextStats ? nextStats.minutes : 0 }} 分钟</text>
      </view>
    </view>

    <!-- 训练日 -->
    <view v-else-if="isTrain" class="hero">
      <view class="corner" />
      <view class="corner corner--br" />
      <view class="hero-top">
        <text class="kr-tag kr-tag--acid">今日训练</text>
        <text class="hero-day">第 {{ entry.index }} 练 / 每周 {{ plan.freq }} 练</text>
      </view>
      <text class="hero-name">{{ todayDay.name }}</text>
      <text class="hero-focus">{{ todayDay.focus }}</text>
      <view class="stat-row">
        <view class="stat">
          <text class="stat-num">{{ stats.main }}<text class="stat-unit">+{{ stats.abs }}</text></text>
          <text class="stat-label">动作</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ stats.sets }}<text class="stat-unit">组</text></text>
          <text class="stat-label">总组数</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ stats.minutes }}<text class="stat-unit">分钟</text></text>
          <text class="stat-label">预计时长</text>
        </view>
      </view>
      <view class="kr-btn kr-btn--primary" @tap="startTraining">开始训练</view>
      <text class="hero-hint">中途退出会保存草稿，回来可以接着练</text>
    </view>

    <!-- 休息日 -->
    <view v-else class="hero hero--rest">
      <view class="corner" />
      <view class="corner corner--br" />
      <view class="hero-top">
        <text class="kr-tag">休息日</text>
        <text class="hero-day">{{ dateText }}</text>
      </view>
      <view class="rest-icon">休</view>
      <text class="hero-name">恢复日</text>
      <text class="hero-focus">今天不安排训练。睡够、吃好，把下一次训练留足力气。</text>
      <view v-if="next" class="next-box">
        <text class="next-label">NEXT SESSION</text>
        <view class="next-row">
          <text>下一次</text>
          <text class="next-name">{{ nextDay ? nextDay.name : '训练日' }}</text>
        </view>
        <text class="next-meta">{{ nextText }} · {{ nextStats ? nextStats.total : 0 }} 个动作 · {{ nextStats ? nextStats.minutes : 0 }} 分钟</text>
      </view>
      <text v-else class="hero-hint hero-hint--left">本周训练已排完，下一次重新打开会生成新一周计划。</text>
    </view>

    <view class="home-foot">
      <text>{{ planMeta }}</text>
      <text>数据仅保存在本机</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { store, persist } from '../../store/appStore'
import { dayStats, ensurePlanFresh, getDayById, nextTrainAfter } from '../../store/plan'
import { makeSession } from '../../store/workout'
import { fmtClock, fmtVol, todayISO } from '../../utils/format'

const ready = ref(false)

onShow(() => {
  if (!store.plan) {
    uni.reLaunch({ url: '/pages/onboarding/index' })
    return
  }
  if (ensurePlanFresh(store)) persist()
  ready.value = true
})

const plan = computed(() => store.plan)
const todayIndex = computed(() => {
  if (!plan.value || !plan.value.schedule) return -1
  return plan.value.schedule.findIndex((item) => item.date === todayISO())
})
const entry = computed(() => {
  if (!plan.value || !plan.value.schedule || !plan.value.schedule.length) return null
  return plan.value.schedule[todayIndex.value] || plan.value.schedule[0]
})
const isTrain = computed(() => !!entry.value && entry.value.type === 'train')
const todayDay = computed(() => (isTrain.value ? getDayById(plan.value, entry.value.dayId) : null))
const stats = computed(() => (todayDay.value ? dayStats(todayDay.value) : null))

const draft = computed(() => (store.draft && store.draft.date === todayISO() ? store.draft : null))
const draftDone = computed(() => (draft.value ? draft.value.sets.filter((row) => row.done).length : 0))
const draftTotal = computed(() => (draft.value ? draft.value.sets.length : 0))
const draftPct = computed(() => (draftTotal.value ? Math.round((draftDone.value / draftTotal.value) * 100) : 0))
const draftElapsed = computed(() => fmtClock(draft.value ? draft.value.elapsed : 0))
const draftNext = computed(() => {
  if (!draft.value) return ''
  const row = draft.value.sets.find((item) => !item.done)
  return row ? row.ex + ' · 第 ' + (row.setIdx + 1) + ' 组' : '全部完成，去结算'
})

const doneSession = computed(() => {
  if (!entry.value || entry.value.type !== 'train') return null
  return (
    store.records.sessions.find(
      (item) => item.date === entry.value.date && item.dayId === entry.value.dayId
    ) || null
  )
})

const next = computed(() => nextTrainAfter(plan.value, todayIndex.value))
const nextDay = computed(() => (next.value ? getDayById(plan.value, next.value.dayId) : null))
const nextStats = computed(() => (nextDay.value ? dayStats(nextDay.value) : null))
const nextText = computed(() => (next.value ? next.value.dow + ' ' + next.value.month + '/' + next.value.dayNum : ''))

const dateText = computed(() => (entry.value ? entry.value.month + '月' + entry.value.dayNum + '日' : ''))
const weekday = computed(() => (entry.value ? entry.value.dow : ''))
const planMeta = computed(() =>
  plan.value ? plan.value.name + ' · 每周 ' + plan.value.freq + ' 练' : ''
)

function startTraining() {
  if (!entry.value || entry.value.type !== 'train') return
  const session = makeSession(store, entry.value)
  if (!session) {
    uni.showToast({ title: '训练日数据缺失', icon: 'none' })
    return
  }
  store.draft = session
  persist()
  uni.navigateTo({ url: '/pages/workout/index' })
}

function resumeTraining() {
  uni.navigateTo({ url: '/pages/workout/index' })
}

function openSummary() {
  if (!doneSession.value) return
  uni.navigateTo({ url: '/pages/summary/index?id=' + encodeURIComponent(doneSession.value.id) })
}
</script>

<style scoped>
.home {
  padding-bottom: calc(60px + env(safe-area-inset-bottom));
}

.brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.brand-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-mark {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--kr-acid);
  color: #0A0D05;
  font-family: var(--kr-font-display);
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  line-height: 24px;
}

.brand-name {
  font-family: var(--kr-font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.brand-date {
  font-family: var(--kr-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--kr-text-dim);
}

.kr-head {
  margin-top: 28px;
  margin-bottom: 18px;
}

.hero {
  position: relative;
  margin-top: 16px;
  padding: 18px 16px 16px;
  overflow: hidden;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: linear-gradient(158deg, #161c17 0%, #0d110f 62%);
}

.hero--draft {
  border-color: var(--kr-acid-line);
}

.hero--done {
  border-color: var(--kr-line-strong);
}

.corner {
  position: absolute;
  top: 9px;
  left: 9px;
  width: 16px;
  height: 16px;
  border-top: 1px solid var(--kr-acid);
  border-left: 1px solid var(--kr-acid);
  opacity: 0.45;
}

.corner--br {
  top: auto;
  left: auto;
  right: 9px;
  bottom: 9px;
  border-top: 0;
  border-left: 0;
  border-right: 1px solid var(--kr-acid);
  border-bottom: 1px solid var(--kr-acid);
}

.hero-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.hero-day {
  font-family: var(--kr-font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--kr-text-dim);
}

.hero-name {
  position: relative;
  display: block;
  margin-top: 16px;
  font-family: var(--kr-font-display);
  font-size: 34px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.hero-focus {
  position: relative;
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--kr-text-dim);
}

.stat-row {
  position: relative;
  display: flex;
  margin: 16px 0 14px;
  border-top: 1px solid var(--kr-line);
  border-bottom: 1px solid var(--kr-line);
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 11px 0 11px 12px;
  border-left: 1px solid var(--kr-line);
}

.stat:first-child {
  padding-left: 0;
  border-left: 0;
}

.stat-num {
  font-family: var(--kr-font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.05;
}

.stat-unit {
  margin-left: 3px;
  font-family: var(--kr-font-body);
  font-size: 10px;
  font-weight: 400;
  color: var(--kr-text-dim);
}

.stat-label {
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--kr-text-dim);
}

.hero-hint {
  display: block;
  margin-top: 10px;
  font-size: 10px;
  line-height: 1.5;
  color: var(--kr-text-dim);
  text-align: center;
}

.hero-hint--left {
  text-align: left;
  margin-top: 14px;
}

.rest-icon {
  width: 46px;
  height: 46px;
  margin: 18px 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--kr-line-strong);
  border-radius: 50%;
  background: var(--kr-acid-soft);
  color: var(--kr-acid);
  font-size: 18px;
  font-weight: 700;
}

.hero--rest .hero-name {
  margin-top: 8px;
}

.live-bar {
  position: relative;
  height: 3px;
  margin: 16px 0 8px;
  border-radius: 2px;
  background: #232a25;
  overflow: hidden;
}

.live-bar__fill {
  display: block;
  height: 100%;
  background: var(--kr-acid);
  transition: width 0.3s ease;
}

.live-meta {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.live-meta__num {
  color: var(--kr-text);
  font-family: var(--kr-font-mono);
}

.next-box {
  position: relative;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: #0a0d0b;
}

.next-label {
  display: block;
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: var(--kr-acid);
}

.next-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 7px;
  font-size: 11px;
  color: var(--kr-text-dim);
}

.next-name {
  font-size: 14px;
  color: var(--kr-text);
  font-weight: 600;
}

.next-meta {
  display: block;
  margin-top: 4px;
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.home-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid var(--kr-line);
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: #4e5a52;
}
</style>
