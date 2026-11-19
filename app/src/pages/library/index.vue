<template>
  <view class="kr-page lib-page">
    <view class="nav">
      <text class="nav-back" @tap="goBack">‹</text>
      <view class="nav-main">
        <text class="nav-title">{{ picking ? '添加动作' : '动作库' }}</text>
        <text class="nav-sub">{{ navSub }}</text>
      </view>
      <text v-if="picking" class="nav-action" @tap="goBack">完成</text>
      <text v-else class="nav-action" @tap="openCustom">新增</text>
    </view>

    <view class="search">
      <text class="search-icon">⌕</text>
      <input
        class="search-input"
        :value="ui.libQuery"
        type="text"
        placeholder="搜索动作、肌群或器械"
        confirm-type="search"
        @input="onSearch"
      />
    </view>

    <scroll-view scroll-x class="chip-scroll">
      <view class="chips">
        <text
          v-for="g in groupOptions"
          :key="'g_' + g"
          class="chip"
          :class="{ 'is-on': ui.libGroup === g }"
          @tap="ui.libGroup = g"
        >{{ g }}</text>
        <input
          v-if="adding === 'group'"
          v-model="newValue"
          class="chip chip--input"
          type="text"
          maxlength="8"
          placeholder="部位名称"
          confirm-type="done"
          @confirm="confirmOption"
          @blur="confirmOption"
        />
        <text v-else class="chip chip--add" @tap="startAdd('group')">＋</text>
      </view>
    </scroll-view>

    <scroll-view scroll-x class="chip-scroll">
      <view class="chips">
        <text
          v-for="e in equipOptions"
          :key="'e_' + e"
          class="chip"
          :class="{ 'is-on': ui.libEquip === e }"
          @tap="ui.libEquip = e"
        >{{ e }}</text>
        <input
          v-if="adding === 'equip'"
          v-model="newValue"
          class="chip chip--input"
          type="text"
          maxlength="8"
          placeholder="器械名称"
          confirm-type="done"
          @confirm="confirmOption"
          @blur="confirmOption"
        />
        <text v-else class="chip chip--add" @tap="startAdd('equip')">＋</text>
      </view>
    </scroll-view>

    <view v-if="!grouped.length" class="empty-inline">
      <text class="empty-title">没有匹配的动作</text>
      <text class="empty-sub">换个关键词，或清空筛选试试。</text>
    </view>

    <view v-for="group in grouped" :key="group.pattern" class="lib-group">
      <view class="group-head">
        <text class="group-title">{{ group.pattern }}</text>
        <text class="group-count">{{ group.items.length }} 个</text>
      </view>
      <view class="panel">
        <view
          v-for="name in group.items"
          :key="name"
          class="lib-row"
          @tap="rowTap(name)"
        >
          <view class="lib-main">
            <view class="lib-name-line">
              <text class="lib-name">{{ name }}</text>
              <text v-if="exInfo(name).unilateral" class="kr-tag">单侧</text>
              <text v-if="isCustomExercise(name)" class="kr-tag kr-tag--acid">自定义</text>
            </view>
            <text class="lib-sub">{{ exInfo(name).muscle }} · {{ exInfo(name).equip }}{{ lastText(name) }}</text>
          </view>
          <view class="lib-right">
            <template v-if="picking">
              <text v-if="isAdded(name)" class="lib-added">已添加</text>
              <text v-else class="lib-add" @tap.stop="addRow(name)">＋</text>
            </template>
            <template v-else>
              <text class="lib-pr">{{ prText(name) }}</text>
              <text class="lib-chev">›</text>
            </template>
          </view>
        </view>
      </view>
    </view>

    <text v-if="picking" class="form-tip">新动作默认 3 组 × 8-12 次，组间休息 90 秒；添加后回到编辑页调整。</text>

    <view v-if="picking" class="bottom-bar">
      <view class="kr-btn kr-btn--ghost" @tap="openCustom">自定义动作</view>
      <view class="kr-btn kr-btn--primary" @tap="goBack">完成添加</view>
    </view>

    <kr-sheet :visible="infoVisible" :title="infoName" @close="infoVisible = false">
      <view class="info-row">
        <text class="info-label">主要肌群</text>
        <text class="info-value">{{ infoData.muscle }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">器械</text>
        <text class="info-value">{{ infoData.equip }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">最好重量</text>
        <text class="info-value">{{ prText(infoName) }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">上次训练</text>
        <text class="info-value">{{ lastText(infoName).replace(' · ', '') || '还没有记录' }}</text>
      </view>
      <text class="info-cue">{{ infoData.cue }}</text>
    </kr-sheet>

    <kr-sheet :visible="customVisible" title="新增自定义动作" @close="customVisible = false">
      <view class="field">
        <text class="field-label">动作名称</text>
        <input v-model="custom.name" class="field-input" type="text" maxlength="20" placeholder="例如：史密斯上斜卧推" />
      </view>
      <view class="field">
        <text class="field-label">主要肌群</text>
        <view class="chips chips--wrap">
          <text
            v-for="g in groupOptions"
            :key="'cg_' + g"
            class="chip"
            :class="{ 'is-on': custom.group === g }"
            @tap="custom.group = g"
          >{{ g }}</text>
        </view>
      </view>
      <view class="field">
        <text class="field-label">器械</text>
        <view class="chips chips--wrap">
          <text
            v-for="e in equipOptions"
            :key="'ce_' + e"
            class="chip"
            :class="{ 'is-on': custom.equip === e }"
            @tap="custom.equip = e"
          >{{ e }}</text>
        </view>
      </view>
      <view class="field field--row">
        <view>
          <text class="field-label">是否单侧</text>
          <text class="field-hint">单侧动作会标记「单侧」，重量按单边记录</text>
        </view>
        <view class="switch" :class="{ 'is-on': custom.unilateral }" @tap="custom.unilateral = !custom.unilateral">
          <view class="switch-dot" />
        </view>
      </view>
      <view class="sheet-foot">
        <view class="kr-btn kr-btn--primary" @tap="saveCustom">保存动作</view>
      </view>
    </kr-sheet>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { store, persist } from '../../store/appStore'
import { ui } from '../../store/ui'
import {
  addCustomExercise,
  addCustomEquip,
  addCustomGroup,
  allEquips,
  allGroups,
  filterExerciseNames
} from '../../store/exercises'
import { PATTERNS, exInfo, isCustomExercise } from '../../data/catalog'
import { addTemplateExercise } from '../../store/templates'
import { addExerciseToDay, getDayById } from '../../store/plan'
import { lastLift } from '../../store/workout'
import { fmtNum } from '../../utils/format'
import KrSheet from '../../components/KrSheet.vue'

const mode = ref('browse')
const targetDayId = ref('')
const adding = ref('')
const newValue = ref('')
const infoVisible = ref(false)
const infoName = ref('')
const customVisible = ref(false)
const custom = reactive({ name: '', group: '胸', equip: '哑铃', unilateral: false })

const picking = computed(() => mode.value === 'day' || mode.value === 'tpl')
const groupOptions = computed(() => ['全部'].concat(allGroups(store)))
const equipOptions = computed(() => ['全部'].concat(allEquips(store)))

onLoad((query) => {
  if (query && query.mode) mode.value = query.mode
  if (query && query.dayId) targetDayId.value = query.dayId
  else if (ui.picker) {
    mode.value = ui.picker.mode
    targetDayId.value = ui.picker.dayId
  }
})

const names = computed(() => filterExerciseNames(store, ui.libQuery, ui.libGroup, ui.libEquip))

const grouped = computed(() => {
  const map = {}
  names.value.forEach((name) => {
    const pattern = exInfo(name).pattern
    ;(map[pattern] = map[pattern] || []).push(name)
  })
  return PATTERNS.concat(['自定义'])
    .filter((pattern) => map[pattern] && map[pattern].length)
    .map((pattern) => ({ pattern, items: map[pattern] }))
})

const navSub = computed(() => {
  if (picking.value) {
    const total = targetHost() ? targetHost().exercises.length : 0
    return '从动作库选择 · 已添加 ' + total + ' 个'
  }
  return '25 个核心动作 · 9 个动作模式' + (store.customEx.length ? ' · 自定义 ' + store.customEx.length : '')
})

function targetHost() {
  if (mode.value === 'day') return store.plan ? getDayById(store.plan, targetDayId.value) : null
  if (mode.value === 'tpl' && ui.tplDraft) {
    return (ui.tplDraft.days || []).find((day) => day.id === targetDayId.value) || null
  }
  return null
}

function isAdded(name) {
  const host = targetHost()
  return !!(host && host.exercises.some((row) => row.ex === name))
}

function addRow(name) {
  if (isAdded(name)) return
  if (mode.value === 'day') {
    if (!addExerciseToDay(store.plan, targetDayId.value, name)) return
    persist()
  } else if (mode.value === 'tpl') {
    const host = targetHost()
    if (!host) return
    if (!addTemplateExercise(host, name)) return
  } else {
    return
  }
  uni.showToast({ title: '已添加 ' + name, icon: 'none' })
}

function rowTap(name) {
  if (picking.value) {
    addRow(name)
    return
  }
  infoName.value = name
  infoVisible.value = true
}

const infoData = computed(() => exInfo(infoName.value))

function prText(name) {
  const info = exInfo(name)
  if (info.bw) return info.hold ? '计时' : '自重'
  const pr = store.records.prs[name] || info.pr || 0
  return pr ? fmtNum(pr) + ' kg' : '—'
}

function lastText(name) {
  const lift = lastLift(store, name)
  return lift ? ' · 上次 ' + fmtNum(lift.weight) + '×' + lift.reps : ''
}

function onSearch(event) {
  ui.libQuery = event.detail.value
}

function startAdd(kind) {
  adding.value = kind
  newValue.value = ''
}

function confirmOption() {
  const value = newValue.value
  if (!value) {
    adding.value = ''
    return
  }
  const ok = adding.value === 'group' ? addCustomGroup(store, value) : addCustomEquip(store, value)
  if (ok) {
    persist()
    if (adding.value === 'group') ui.libGroup = value.trim()
    else ui.libEquip = value.trim()
    uni.showToast({ title: '已添加', icon: 'none' })
  } else {
    uni.showToast({ title: '名称已存在或为空', icon: 'none' })
  }
  adding.value = ''
  newValue.value = ''
}

function openCustom() {
  custom.name = ''
  custom.group = ui.libGroup !== '全部' ? ui.libGroup : allGroups(store)[0]
  custom.equip = ui.libEquip !== '全部' ? ui.libEquip : allEquips(store)[0]
  custom.unilateral = false
  customVisible.value = true
}

function saveCustom() {
  const result = addCustomExercise(store, { ...custom })
  if (!result.ok) {
    uni.showToast({ title: result.msg, icon: 'none' })
    return
  }
  persist()
  customVisible.value = false
  uni.showToast({ title: result.msg, icon: 'none' })
  if (picking.value) addRow(custom.name)
}

function goBack() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/plan/index' })
  })
}
</script>

<style scoped>
.lib-page {
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
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

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 0 12px;
  height: 42px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: var(--kr-surface);
}

.search-icon {
  color: var(--kr-text-dim);
  font-size: 15px;
}

.search-input {
  flex: 1;
  height: 42px;
  color: var(--kr-text);
  font-size: 13px;
}

.chip-scroll {
  margin-top: 10px;
  white-space: nowrap;
}

.chips {
  display: inline-flex;
  gap: 8px;
}

.chips--wrap {
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
}

.chip {
  flex: none;
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

.chip--add {
  width: 34px;
  text-align: center;
  border-style: dashed;
  color: var(--kr-text-dim);
}

.chip--input {
  width: 96px;
  height: 28px;
  line-height: 28px;
  color: var(--kr-text);
  border-color: var(--kr-acid-line);
}

.lib-group {
  margin-top: 18px;
}

.group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 6px;
}

.group-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.group-count {
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

.lib-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--kr-line);
}

.lib-row:last-child {
  border-bottom: 0;
}

.lib-main {
  flex: 1;
  min-width: 0;
}

.lib-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lib-name {
  font-size: 13.5px;
  font-weight: 600;
}

.lib-sub {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: var(--kr-text-dim);
}

.lib-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lib-pr {
  font-family: var(--kr-font-mono);
  font-size: 10.5px;
  color: var(--kr-text-sub);
}

.lib-chev {
  color: var(--kr-text-dim);
  font-size: 15px;
}

.lib-add {
  width: 30px;
  height: 30px;
  line-height: 28px;
  text-align: center;
  border: 1px solid var(--kr-acid-line);
  border-radius: var(--kr-radius-md);
  color: var(--kr-acid);
  font-size: 16px;
}

.lib-added {
  font-family: var(--kr-font-mono);
  font-size: 10px;
  color: var(--kr-acid);
}

.empty-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 36px 0;
  text-align: center;
}

.empty-title {
  font-size: 13px;
  color: var(--kr-text-sub);
}

.empty-sub {
  font-size: 11px;
  color: var(--kr-text-dim);
}

.form-tip {
  display: block;
  margin-top: 14px;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--kr-text-dim);
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 10px;
  padding: 10px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--kr-line);
  background: rgba(8, 10, 9, 0.96);
}

.bottom-bar .kr-btn {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 0;
  border-bottom: 1px solid var(--kr-line);
  font-size: 12.5px;
}

.info-label {
  color: var(--kr-text-dim);
}

.info-value {
  color: var(--kr-text);
}

.info-cue {
  display: block;
  margin-top: 14px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--kr-text-sub);
}

.field {
  margin-bottom: 16px;
}

.field--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.field-label {
  display: block;
  margin-bottom: 7px;
  font-size: 11px;
  color: var(--kr-text-dim);
}

.field-hint {
  display: block;
  font-size: 10px;
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

.switch {
  width: 44px;
  height: 24px;
  flex: none;
  border: 1px solid var(--kr-line-strong);
  border-radius: 999px;
  padding: 2px;
  background: var(--kr-surface-2);
}

.switch-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--kr-line-strong);
  transition: transform 0.18s ease;
}

.switch.is-on {
  border-color: var(--kr-acid-line);
  background: var(--kr-acid-soft);
}

.switch.is-on .switch-dot {
  transform: translateX(19px);
  background: var(--kr-acid);
}

.sheet-foot {
  padding-top: 4px;
}
</style>
