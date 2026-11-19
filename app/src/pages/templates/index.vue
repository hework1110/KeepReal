<template>
  <view class="kr-page tpl-page">
    <view class="nav">
      <text class="nav-back" @tap="goBack">‹</text>
      <view class="nav-main">
        <text class="nav-title">模板库</text>
        <text class="nav-sub">内置 4 套 · 我的模板 {{ myTemplates.length }} 套</text>
      </view>
      <text class="nav-action" @tap="createTemplate">新建</text>
    </view>

    <view class="kr-section-head">
      <text class="kr-section-head__title">我的模板</text>
      <text class="kr-section-head__meta">可编辑、可删除</text>
    </view>
    <view v-if="!myTemplates.length" class="empty-card">
      <text class="empty-title">还没有自定义模板</text>
      <text class="empty-sub">把常练的动作组起来，下次直接套用。</text>
      <view class="kr-btn kr-btn--ghost empty-btn" @tap="createTemplate">新建模板</view>
    </view>
    <view v-else class="panel">
      <view v-for="tpl in myTemplates" :key="tpl.id" class="tpl-row" @tap="openDetail(tpl.id)">
        <view class="tpl-main">
          <text class="tpl-name">{{ tpl.name }}</text>
          <text class="tpl-sub">{{ metaText(tpl) }}</text>
        </view>
        <text class="kr-tag">自定义</text>
        <text class="chev">›</text>
      </view>
    </view>

    <view class="kr-section-head">
      <text class="kr-section-head__title">内置模板</text>
      <text class="kr-section-head__meta">预览后可复制</text>
    </view>
    <view class="builtin-list">
      <view v-for="tpl in builtinTemplates" :key="tpl.id" class="builtin-card" @tap="openDetail(tpl.id)">
        <view class="builtin-top">
          <text class="builtin-name">{{ tpl.name }}</text>
          <text class="kr-tag kr-tag--acid">{{ freqText(tpl) }}</text>
        </view>
        <text class="builtin-sub">{{ tpl.sub }}</text>
        <text class="builtin-desc">{{ tpl.desc }}</text>
        <view class="builtin-foot">
          <text class="builtin-meta">{{ metaText(tpl) }}</text>
          <text class="builtin-chev">查看 ›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { TEMPLATES } from '../../data/catalog'
import { store } from '../../store/appStore'
import { customTemplates, templateMeta } from '../../store/templates'
import { ui } from '../../store/ui'

const builtinTemplates = TEMPLATES
const myTemplates = computed(() => customTemplates(store))

function metaText(tpl) {
  const meta = templateMeta(tpl)
  return tpl.days.length + ' 个训练日 · ' + meta.exCount + ' 个动作 · ' + meta.sets + ' 组'
}

function freqText(tpl) {
  const rec = tpl.recFor || [3]
  return '建议每周 ' + rec.join('-') + ' 练'
}

function openDetail(id) {
  uni.navigateTo({ url: '/pages/templates/detail?id=' + id })
}

function createTemplate() {
  ui.tplDraft = null
  uni.navigateTo({ url: '/pages/templates/edit' })
}

function goBack() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/plan/index' })
  })
}
</script>

<style scoped>
.tpl-page {
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
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
  font-size: 17px;
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

.panel {
  padding: 2px 14px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: var(--kr-surface);
}

.tpl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid var(--kr-line);
}

.tpl-row:last-child {
  border-bottom: 0;
}

.tpl-main {
  flex: 1;
  min-width: 0;
}

.tpl-name {
  font-size: 14px;
  font-weight: 600;
}

.tpl-sub {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: var(--kr-text-dim);
}

.chev {
  color: var(--kr-text-dim);
  font-size: 15px;
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 18px;
  border: 1px dashed var(--kr-line-strong);
  border-radius: var(--kr-radius-lg);
}

.empty-title {
  font-size: 13px;
  color: var(--kr-text-sub);
}

.empty-sub {
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.empty-btn {
  margin-top: 8px;
  height: 36px;
  padding: 0 18px;
  font-size: 12px;
}

.builtin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.builtin-card {
  padding: 15px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: linear-gradient(150deg, #141a15 0%, #0d110f 70%);
}

.builtin-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.builtin-name {
  font-size: 16px;
  font-weight: 700;
}

.builtin-sub {
  display: block;
  margin-top: 7px;
  font-size: 11px;
  color: var(--kr-text-sub);
}

.builtin-desc {
  display: block;
  margin-top: 5px;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--kr-text-dim);
}

.builtin-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--kr-line);
}

.builtin-meta {
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.builtin-chev {
  font-size: 11px;
  color: var(--kr-acid);
}
</style>
