<template>
  <view class="kr-page detail-page">
    <view class="nav">
      <text class="nav-back" @tap="goBack">‹</text>
      <text class="nav-action" v-if="isCustom" @tap="editTemplate">编辑</text>
    </view>

    <view class="hero">
      <view class="hero-top">
        <text class="kr-tag kr-tag--acid">{{ isCustom ? '我的模板' : '内置模板' }}</text>
        <text v-if="!isCustom" class="hero-day">{{ freqText }}</text>
      </view>
      <text class="hero-name">{{ tpl.name }}</text>
      <text v-if="tpl.sub" class="hero-sub">{{ tpl.sub }}</text>
      <text v-if="tpl.desc" class="hero-desc">{{ tpl.desc }}</text>
      <view class="hero-meta">
        <text>{{ tpl.days.length }} 个训练日</text>
        <text>{{ meta.exCount }} 个动作</text>
        <text>{{ meta.sets }} 组 / 轮</text>
      </view>
    </view>

    <view v-for="(day, i) in days" :key="day.id || i" class="day-block">
      <view class="day-head">
        <text class="day-num">{{ pad(i + 1) }}</text>
        <view class="day-main">
          <text class="day-name">{{ day.name }}</text>
          <text class="day-focus">{{ day.focus }}</text>
        </view>
        <text class="day-count">{{ day.exercises.length }} + {{ day.abs.length }}</text>
      </view>
      <view class="panel">
        <view v-for="row in day.exercises" :key="row.ex" class="ex-row">
          <text class="ex-name">{{ row.ex }}</text>
          <text class="ex-meta">{{ row.sets }} 组 · {{ repsText(row) }} · {{ row.rest }}s</text>
        </view>
        <view class="abs-row">
          <text class="abs-label">腹部收尾</text>
          <text class="abs-value">{{ day.abs.join(' / ') }}</text>
        </view>
      </view>
    </view>

    <view v-if="isCustom" class="danger-row" @tap="removeTemplate">删除这个模板</view>

    <view class="bottom-space" />

    <view class="bottom-bar">
      <view class="kr-btn kr-btn--primary" @tap="copyToPlan">复制为我的计划</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { TEMPLATES } from '../../data/catalog'
import { store, persist } from '../../store/appStore'
import { buildPlanFromTemplate, repsText } from '../../store/plan'
import { deleteTemplate, findCustomTemplate, previewTemplateDays, templateMeta, cloneForEdit } from '../../store/templates'
import { ui } from '../../store/ui'
import { pad } from '../../utils/format'

const tplId = ref('')

onLoad((query) => {
  tplId.value = (query && query.id) || ''
})

const customTpl = computed(() => findCustomTemplate(store, tplId.value))
const isCustom = computed(() => !!customTpl.value)
const tpl = computed(() => customTpl.value || TEMPLATES.find((item) => item.id === tplId.value) || TEMPLATES[0])
const days = computed(() => previewTemplateDays(tpl.value))
const meta = computed(() => templateMeta(tpl.value))
const freqText = computed(() => {
  const rec = tpl.value.recFor || []
  return rec.length ? '建议每周 ' + rec.join('-') + ' 练' : ''
})

function copyToPlan() {
  const current = store.plan
  const goal = current ? current.goal : 'muscle'
  const freq = (tpl.value.recFor && tpl.value.recFor[0]) || (current && current.freq) || Math.min(days.value.length || 3, 5)
  uni.showModal({
    title: '复制为我的计划',
    content: '会用「' + tpl.value.name + '」替换当前训练日安排，训练历史与身体数据不受影响。',
    success: (res) => {
      if (!res.confirm) return
      store.plan = buildPlanFromTemplate(tpl.value, goal, freq)
      store.draft = null
      persist()
      uni.switchTab({ url: '/pages/plan/index' })
      setTimeout(() => uni.showToast({ title: '计划已更新', icon: 'none' }), 320)
    }
  })
}

function editTemplate() {
  ui.tplDraft = cloneForEdit(customTpl.value)
  uni.navigateTo({ url: '/pages/templates/edit' })
}

function removeTemplate() {
  uni.showModal({
    title: '删除模板',
    content: '删除「' + tpl.value.name + '」？已经复制出的计划不受影响。',
    confirmColor: '#FF6A4D',
    success: (res) => {
      if (!res.confirm) return
      deleteTemplate(store, tplId.value)
      persist()
      uni.navigateBack({
        fail: () => uni.switchTab({ url: '/pages/plan/index' })
      })
    }
  })
}

function goBack() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/plan/index' })
  })
}
</script>

<style scoped>
.detail-page {
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
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

.nav-action {
  font-size: 13px;
  color: var(--kr-acid);
}

.hero {
  margin-top: 14px;
  padding: 18px 16px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: linear-gradient(158deg, #161c17 0%, #0d110f 62%);
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-day {
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-text-dim);
}

.hero-name {
  display: block;
  margin-top: 12px;
  font-family: var(--kr-font-display);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.12;
}

.hero-sub {
  display: block;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--kr-text-sub);
}

.hero-desc {
  display: block;
  margin-top: 5px;
  font-size: 10.5px;
  line-height: 1.65;
  color: var(--kr-text-dim);
}

.hero-meta {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--kr-line);
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-text-dim);
}

.day-block {
  margin-top: 18px;
}

.day-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
}

.day-num {
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-acid);
}

.day-main {
  flex: 1;
  min-width: 0;
}

.day-name {
  font-size: 13.5px;
  font-weight: 600;
}

.day-focus {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: var(--kr-text-dim);
}

.day-count {
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.panel {
  padding: 2px 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.ex-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--kr-line);
}

.ex-name {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
}

.ex-meta {
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.abs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
}

.abs-label {
  font-size: 11px;
  color: var(--kr-text-dim);
}

.abs-value {
  font-size: 10.5px;
  color: var(--kr-text-sub);
  text-align: right;
}

.danger-row {
  margin-top: 22px;
  padding: 13px 0;
  text-align: center;
  border: 1px solid rgba(255, 106, 77, 0.3);
  border-radius: var(--kr-radius-md);
  color: var(--kr-danger);
  font-size: 12px;
}

.bottom-space {
  height: 140px;
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
