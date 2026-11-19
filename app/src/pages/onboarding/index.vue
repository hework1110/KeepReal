<template>
  <view class="ob">
    <view class="ob-brand">
      <text class="ob-mark">K</text>
      <text class="ob-brand-name">KEEPREAL</text>
      <text class="ob-brand-meta">OFFLINE TRAINING LOG</text>
    </view>

    <view class="ob-head">
      <text class="kr-kicker">STEP 01 / TEMPLATE</text>
      <text class="ob-title">选一套训练模板</text>
      <text class="ob-sub">选好后会直接生成每周计划，之后从「今天」开始训练。训练数据只保存在本机。</text>
    </view>

    <view
      v-for="tpl in templates"
      :key="tpl.id"
      class="tpl"
      :class="{ 'tpl--on': picking === tpl.id, 'tpl--disabled': !!picking }"
      @tap="pick(tpl)"
    >
      <view class="tpl-top">
        <text class="tpl-name">{{ tpl.name }}</text>
        <view class="tpl-radio" :class="{ 'tpl-radio--on': picking === tpl.id }" />
      </view>
      <text class="tpl-sub">{{ tpl.sub }}</text>
      <text class="tpl-desc">{{ tpl.desc }}</text>
      <view class="tpl-meta">
        <text>{{ tpl.days.length }} 个训练日</text>
        <text>{{ tpl.freq }} 练 / 周</text>
        <text>{{ tpl.exCount }} 个动作</text>
        <text>{{ tpl.sets }} 组</text>
      </view>
      <view class="tpl-tags">
        <text v-for="tag in tpl.tags" :key="tag" class="kr-tag">{{ tag }}</text>
      </view>
    </view>

    <text class="ob-foot">选择即生成计划 · 无需注册 · 数据不上传</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { store, persist } from '../../store/appStore'
import { TEMPLATES } from '../../data/catalog'
import { buildPlan, dayStats, exercisesOfDay, planDaysFromTemplate } from '../../store/plan'

const picking = ref('')

const templates = TEMPLATES.map((tpl) => {
  const { days } = planDaysFromTemplate(tpl)
  const sets = days.reduce((sum, day) => sum + dayStats(day).sets, 0)
  const exCount = days.reduce((sum, day) => sum + exercisesOfDay(day).length, 0)
  return {
    ...tpl,
    days,
    sets,
    exCount,
    freq: tpl.recFor[0] || 3
  }
})

onShow(() => {
  if (store.plan && !picking.value) {
    uni.reLaunch({ url: '/pages/today/index' })
  }
})

function pick(tpl) {
  if (picking.value) return
  picking.value = tpl.id
  store.plan = buildPlan(tpl.id, 'muscle', tpl.recFor[0] || 3)
  store.draft = null
  persist()
  uni.reLaunch({
    url: '/pages/today/index',
    success: () => {
      uni.showToast({ title: '计划已生成', icon: 'none' })
    }
  })
}
</script>

<style scoped>
.ob {
  box-sizing: border-box;
  min-height: 100vh;
  max-width: 560px;
  margin: 0 auto;
  padding: calc(28px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom));
}

.ob-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ob-mark {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: var(--kr-acid);
  color: #0A0D05;
  font-family: var(--kr-font-display);
  font-size: 17px;
  font-weight: 700;
  text-align: center;
  line-height: 26px;
}

.ob-brand-name {
  font-family: var(--kr-font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.ob-brand-meta {
  margin-left: auto;
  font-family: var(--kr-font-mono);
  font-size: 9px;
  color: var(--kr-text-dim);
  letter-spacing: 0.1em;
}

.ob-head {
  margin: 34px 0 22px;
}

.ob-title {
  display: block;
  margin-top: 10px;
  font-family: var(--kr-font-display);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.16;
}

.ob-sub {
  display: block;
  margin-top: 10px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--kr-text-dim);
}

.tpl {
  padding: 15px;
  margin-bottom: 10px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: linear-gradient(160deg, #141A15 0%, #0C100E 72%);
  cursor: pointer;
  transition: border-color 0.16s, opacity 0.16s;
}

.tpl--on {
  border-color: var(--kr-acid-line);
  background: linear-gradient(160deg, rgba(199, 255, 58, 0.09), rgba(199, 255, 58, 0.012) 70%);
}

.tpl--disabled {
  opacity: 0.55;
}

.tpl-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tpl-name {
  font-size: 16px;
  font-weight: 700;
}

.tpl-radio {
  width: 16px;
  height: 16px;
  border: 1px solid var(--kr-line-strong);
  border-radius: 50%;
}

.tpl-radio--on {
  border-color: var(--kr-acid);
  background: radial-gradient(circle at center, var(--kr-acid) 0 4px, transparent 4.5px);
}

.tpl-sub {
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--kr-text-sub);
}

.tpl-desc {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.65;
  color: var(--kr-text-dim);
}

.tpl-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 11px;
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-text-dim);
}

.tpl-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}

.ob-foot {
  display: block;
  margin-top: 22px;
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: #4E5A52;
  text-align: center;
}
</style>
