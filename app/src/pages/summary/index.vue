<template>
  <view class="sum">
    <template v-if="record">
      <view class="sum-head">
        <text class="sum-kicker">SESSION COMPLETE / {{ record.date }}</text>
        <view class="badge">✓</view>
        <text class="sum-title">训练完成</text>
        <text class="sum-sub">{{ record.workoutName }} · {{ fmtClock(record.duration) }}</text>
      </view>

      <view class="vol">
        <text class="vol-label">总容量</text>
        <text class="vol-num">{{ fmtVol(record.volume) }}<text class="vol-unit">KG</text></text>
        <view class="vol-stats">
          <view class="vol-stat">
            <text class="vol-stat-num">{{ record.sets }}<text class="vol-stat-unit">/{{ record.totalSets }}</text></text>
            <text class="vol-stat-label">完成组数</text>
          </view>
          <view class="vol-stat">
            <text class="vol-stat-num">{{ fmtClock(record.duration) }}</text>
            <text class="vol-stat-label">训练时长</text>
          </view>
          <view class="vol-stat">
            <text class="vol-stat-num" :class="{ 'vol-stat-num--acid': record.prs.length > 0 }">{{ record.prs.length }}</text>
            <text class="vol-stat-label">刷新 PR</text>
          </view>
        </view>
      </view>

      <template v-if="record.prs.length">
        <view class="kr-section-head">
          <text class="kr-section-head__title">刷新 PR</text>
          <text class="kr-section-head__meta">合计 +{{ totalDelta }} KG</text>
        </view>
        <view v-for="pr in record.prs" :key="pr.name" class="pr">
          <text class="pr-name">{{ pr.name }}</text>
          <view class="pr-line">
            <text class="pr-old">{{ fmtNum(pr.from) }}</text>
            <text class="pr-arrow">→</text>
            <text class="pr-new">{{ fmtNum(pr.to) }} KG</text>
          </view>
        </view>
      </template>

      <view class="kr-section-head">
        <text class="kr-section-head__title">动作明细</text>
        <text class="kr-section-head__meta">{{ doneLifts.length }} 项</text>
      </view>

      <view v-for="lift in doneLifts" :key="lift.name" class="lift">
        <view class="lift-top">
          <text class="lift-name">{{ lift.name }}</text>
          <text class="lift-sets">{{ lift.sets }}/{{ lift.planSets }} 组</text>
        </view>
        <view class="lift-meta">
          <text>{{ lift.best ? fmtNum(lift.best.weight) + ' KG × ' + lift.best.reps + ' 次' : '自重训练' }}</text>
          <text>容量 {{ fmtVol(lift.volume) }} KG</text>
        </view>
      </view>

      <text v-if="!doneLifts.length" class="sum-empty">这次没有勾选完成的组，历史里只记录了一次空训练。</text>

      <view class="sum-foot">
        <view class="kr-btn kr-btn--primary" @tap="goHome">返回今日</view>
      </view>
    </template>

    <view v-else class="sum-missing">
      <text class="sum-kicker">NO RECORD</text>
      <text class="sum-title">没找到这次训练</text>
      <text class="sum-empty">记录可能已被清理，返回今天重新开始。</text>
      <view class="kr-btn kr-btn--primary" @tap="goHome">返回今日</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { store } from '../../store/appStore'
import { fmtClock, fmtNum, fmtVol } from '../../utils/format'

const recordId = ref('')

onLoad((query) => {
  recordId.value = (query && query.id) || ''
})

const record = computed(() => {
  const sessions = store.records.sessions
  if (recordId.value) {
    const hit = sessions.find((item) => item.id === recordId.value)
    if (hit) return hit
  }
  return sessions[0] || null
})

const doneLifts = computed(() =>
  record.value ? record.value.breakdown.filter((row) => row.sets > 0) : []
)

const totalDelta = computed(() =>
  record.value
    ? Math.round(record.value.prs.reduce((sum, pr) => sum + (pr.to - pr.from), 0) * 100) / 100
    : 0
)

function goHome() {
  uni.switchTab({ url: '/pages/today/index' })
}
</script>

<style scoped>
.sum {
  box-sizing: border-box;
  min-height: 100vh;
  max-width: 560px;
  margin: 0 auto;
  padding: calc(30px + env(safe-area-inset-top)) 20px calc(110px + env(safe-area-inset-bottom));
}

.sum-head {
  text-align: center;
}

.sum-kicker {
  display: block;
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: var(--kr-text-dim);
}

.badge {
  width: 54px;
  height: 54px;
  margin: 22px auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--kr-acid-line);
  border-radius: 50%;
  background: var(--kr-acid-soft);
  color: var(--kr-acid);
  font-size: 24px;
  font-weight: 700;
}

.sum-title {
  display: block;
  font-family: var(--kr-font-display);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
}

.sum-sub {
  display: block;
  margin-top: 7px;
  font-size: 12px;
  color: var(--kr-text-dim);
}

.vol {
  margin-top: 22px;
  padding: 16px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: linear-gradient(158deg, #161c17 0%, #0d110f 62%);
}

.vol-label {
  display: block;
  font-family: var(--kr-font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--kr-text-dim);
}

.vol-num {
  display: block;
  margin: 8px 0 14px;
  font-family: var(--kr-font-display);
  font-size: 52px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
}

.vol-unit {
  margin-left: 6px;
  font-family: var(--kr-font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--kr-acid);
}

.vol-stats {
  display: flex;
  border-top: 1px solid var(--kr-line);
}

.vol-stat {
  flex: 1;
  padding: 12px 0 0 12px;
  border-left: 1px solid var(--kr-line);
}

.vol-stat:first-child {
  padding-left: 0;
  border-left: 0;
}

.vol-stat-num {
  display: block;
  font-family: var(--kr-font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.vol-stat-num--acid {
  color: var(--kr-acid);
}

.vol-stat-unit {
  font-size: 10px;
  color: var(--kr-text-dim);
}

.vol-stat-label {
  display: block;
  margin-top: 2px;
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.pr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px;
  margin-bottom: 8px;
  border: 1px solid var(--kr-acid-line);
  border-radius: var(--kr-radius-md);
  background: var(--kr-acid-soft);
}

.pr-name {
  font-size: 13.5px;
  font-weight: 600;
}

.pr-line {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.pr-old {
  font-family: var(--kr-font-mono);
  font-size: 11px;
  color: var(--kr-text-dim);
  text-decoration: line-through;
}

.pr-arrow {
  font-size: 11px;
  color: var(--kr-text-dim);
}

.pr-new {
  font-family: var(--kr-font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--kr-acid);
}

.lift {
  padding: 12px 0;
  border-bottom: 1px solid var(--kr-line);
}

.lift:last-of-type {
  border-bottom: 0;
}

.lift-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.lift-name {
  font-size: 13.5px;
  font-weight: 600;
}

.lift-sets {
  font-family: var(--kr-font-mono);
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.lift-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  font-family: var(--kr-font-mono);
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.sum-empty {
  display: block;
  margin-top: 18px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--kr-text-dim);
  text-align: center;
}

.sum-foot {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  max-width: 560px;
  margin: 0 auto;
  padding: 10px 20px calc(14px + env(safe-area-inset-bottom));
  background: rgba(8, 10, 9, 0.96);
  border-top: 1px solid var(--kr-line);
}

.sum-missing {
  padding-top: 80px;
  text-align: center;
}

.sum-missing .kr-btn {
  margin-top: 26px;
}
</style>
