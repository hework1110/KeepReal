<template>
  <view v-if="ready && draft" class="wk">
    <view class="wk-head">
      <view class="kr-icon-btn" @tap="requestExit">×</view>
      <view class="wk-mid">
        <text class="wk-name">{{ draft.dayName }}</text>
        <text class="wk-meta">{{ headerMeta }}</text>
      </view>
      <text class="wk-done" @tap="requestFinish">完成</text>
    </view>

    <view class="progress">
      <view class="progress__fill" :style="{ width: pct + '%' }" />
    </view>

    <view class="ex-list">
      <view
        v-for="(ex, idx) in draft.exercises"
        :id="'ex-' + idx"
        :key="idx"
        class="ex"
        :class="{ 'ex--open': openIdx === idx }"
      >
        <view class="ex-head" @tap="toggleEx(idx)">
          <text class="ex-no">{{ pad(idx + 1) }}</text>
          <view class="ex-title">
            <text class="ex-name">{{ ex.ex }}</text>
            <text class="ex-meta">{{ exInfoOf(ex).muscle }} · {{ ex.sets }} 组 × {{ repsText(ex) }}</text>
          </view>
          <text class="ex-count" :class="{ 'ex-count--on': doneOf(idx) === ex.sets }">{{ doneOf(idx) }}/{{ ex.sets }}</text>
          <text class="ex-chev">{{ openIdx === idx ? '−' : '+' }}</text>
        </view>

        <view v-if="openIdx === idx" class="ex-body">
          <view class="facts">
            <view class="fact">
              <text class="fact-num">{{ ex.sets }}</text>
              <text class="fact-label">组数</text>
            </view>
            <view class="fact">
              <text class="fact-num">{{ repsShort(ex) }}</text>
              <text class="fact-label">{{ isHold(ex.ex) ? '秒数' : '次数' }}</text>
            </view>
            <view class="fact">
              <text class="fact-num">{{ ex.rest }}<text class="fact-unit">s</text></text>
              <text class="fact-label">组间休息</text>
            </view>
            <view class="fact">
              <text class="fact-num fact-num--text">{{ exInfoOf(ex).equip }}</text>
              <text class="fact-label">器械</text>
            </view>
          </view>

          <text class="cue">{{ exInfoOf(ex).cue }}</text>

          <view class="prev-bar">
            <text class="prev-label">上次</text>
            <text class="prev-val">{{ prevText(ex.ex) }}</text>
          </view>

          <view v-if="calc" class="calc">
            <view class="calc-toggle" @tap="calcOpen = !calcOpen">
              <text>杠铃配重 · {{ calc.weight }} KG</text>
              <text>{{ calcOpen ? '收起' : '展开' }}</text>
            </view>
            <view v-if="calcOpen" class="calc-panel">
              <view class="plate-vis">
                <view class="plate-side">
                  <view
                    v-for="(plate, pi) in calc.used"
                    :key="'l' + pi"
                    class="plate"
                    :class="{ 'plate--acid': pi === 0 }"
                    :style="{ height: plateH(plate) + 'px' }"
                  />
                  <view class="collar" />
                </view>
                <view class="rod" />
                <view class="plate-side">
                  <view class="collar" />
                  <view
                    v-for="(plate, pi) in calc.used"
                    :key="'r' + pi"
                    class="plate"
                    :class="{ 'plate--acid': pi === calc.used.length - 1 }"
                    :style="{ height: plateH(plate) + 'px' }"
                  />
                </view>
              </view>
              <view class="calc-row">
                <text>每侧配片</text>
                <text>{{ calc.used.length ? calc.used.join(' + ') + ' kg' : '空杆' }}</text>
              </view>
              <view class="calc-row">
                <text>杠铃杆</text>
                <text>20 kg</text>
              </view>
              <view class="calc-row" :class="{ 'calc-row--warn': calc.left > 0.001 }">
                <text>{{ calc.left > 0.001 ? '每侧还差' : '配重合计' }}</text>
                <text>{{ calc.left > 0.001 ? calc.left + ' kg' : calc.weight + ' kg' }}</text>
              </view>
              <text class="calc-note">{{ calc.weight < 20 ? '当前重量低于 20 kg 空杆' : '按 20 kg 杠铃杆、双侧对称装片计算' }}</text>
            </view>
          </view>

          <view class="set-head">
            <text>组</text>
            <text>重量 KG</text>
            <text>{{ isHold(ex.ex) ? '秒' : '次数' }}</text>
            <text>上次同组</text>
            <text />
          </view>

          <view
            v-for="row in rowsByEx[idx]"
            :key="row.setIdx"
            class="set-row"
            :class="{ 'set-row--done': row.done }"
          >
            <text class="set-idx">{{ row.setIdx + 1 }}</text>
            <input class="set-input" type="digit" v-model="row.weight" @input="onInput" />
            <input class="set-input" type="number" v-model="row.reps" @input="onInput" />
            <text class="set-prev">{{ rowPrev(row) }}</text>
            <view class="set-check" :class="{ 'set-check--on': row.done }" @tap="toggleSet(row)">
              <text v-if="row.done" class="check-mark">✓</text>
            </view>
          </view>

          <view class="set-tools">
            <view class="mini-btn" @tap="copyPrev">复制上一组</view>
            <text class="tool-hint">勾选后自动开始组间休息</text>
          </view>
        </view>
      </view>
    </view>

    <view class="wk-foot">
      <view class="kr-btn kr-btn--ghost wk-prev" :class="{ 'kr-btn--disabled': openIdx <= 0 }" @tap="prevStep">上一项</view>
      <view class="kr-btn kr-btn--primary wk-next" @tap="nextStep">
        {{ openIdx >= draft.exercises.length - 1 ? '完成训练' : '下一项' }}
      </view>
    </view>

    <view v-if="draft.rest" class="rest-mask">
      <view class="rest">
        <view class="rest-top">
          <text class="rest-label">组间休息</text>
          <text class="rest-next">{{ draft.rest.next }}</text>
        </view>
        <view class="rest-mid">
          <text class="rest-time">{{ restTime }}</text>
          <text class="rest-unit">剩余</text>
        </view>
        <view class="rest-bar">
          <view class="rest-fill" :style="{ width: restPct + '%' }" />
        </view>
        <view class="rest-actions">
          <view class="mini-btn" @tap="adjustRest(-15000)">-15s</view>
          <view class="mini-btn" @tap="adjustRest(15000)">+15s</view>
          <view class="mini-btn mini-btn--acid" @tap="skipRest">跳过休息</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onBackPress, onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { store, persist, persistSoon } from '../../store/appStore'
import { PLATE_H, exInfo, isHold } from '../../data/catalog'
import { repsText } from '../../store/plan'
import { buildSummary, lastLift, plateStack } from '../../store/workout'
import { fmtClock, fmtMs, fmtNum, pad } from '../../utils/format'

const ready = ref(false)
const now = ref(Date.now())
const calcOpen = ref(false)

let ticker = null
let lastTick = 0
let sinceSave = 0

const draft = computed(() => store.draft)
const rowsByEx = computed(() => {
  if (!draft.value) return []
  return draft.value.exercises.map((item, idx) =>
    draft.value.sets.filter((row) => row.exIdx === idx)
  )
})
const openIdx = computed(() => (draft.value ? draft.value.openEx : -1))
const totalSets = computed(() => (draft.value ? draft.value.sets.length : 0))
const doneSets = computed(() => (draft.value ? draft.value.sets.filter((row) => row.done).length : 0))
const pct = computed(() => (totalSets.value ? Math.round((doneSets.value / totalSets.value) * 100) : 0))
const headerMeta = computed(() => {
  if (!draft.value) return ''
  const exTotal = draft.value.exercises.length
  return 'EX ' + pad(openIdx.value + 1) + ' / ' + pad(exTotal) + ' · ' + fmtClock(draft.value.elapsed)
})

const restLeft = computed(() => {
  if (!draft.value || !draft.value.rest) return 0
  return Math.max(0, draft.value.rest.until - now.value)
})
const restPct = computed(() => {
  if (!draft.value || !draft.value.rest) return 0
  return Math.max(0, Math.min(100, (restLeft.value / draft.value.rest.total) * 100))
})
const restTime = computed(() => fmtMs(restLeft.value))

const calc = computed(() => {
  if (!draft.value || openIdx.value < 0) return null
  const ex = draft.value.exercises[openIdx.value]
  if (!ex || exInfo(ex.ex).type !== 'barbell') return null
  const rows = rowsByEx.value[openIdx.value] || []
  const row = rows.find((item) => !item.done) || rows[0]
  const weight = row ? +row.weight || 0 : 20
  return { weight, ...plateStack(weight) }
})

onShow(() => {
  if (!store.draft) {
    uni.switchTab({ url: '/pages/today/index' })
    return
  }
  ready.value = true
  startTicker()
})

onHide(() => {
  stopTicker()
  if (store.draft) persist()
})

onUnload(() => {
  stopTicker()
  if (store.draft) persist()
})

onBackPress(() => {
  if (store.draft) persist()
  return false
})

function startTicker() {
  stopTicker()
  lastTick = Date.now()
  now.value = lastTick
  ticker = setInterval(tick, 500)
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker)
    ticker = null
  }
}

function tick() {
  const t = Date.now()
  const delta = Math.min(2, (t - lastTick) / 1000)
  lastTick = t
  now.value = t
  const session = store.draft
  if (!session) return
  session.elapsed = (session.elapsed || 0) + delta
  sinceSave += delta

  if (session.rest && session.rest.until <= t) {
    session.rest = null
    persist()
    sinceSave = 0
  } else if (sinceSave >= 4) {
    persist()
    sinceSave = 0
  }
}

function exInfoOf(ex) {
  return exInfo(ex.ex)
}

function repsShort(cfg) {
  if (isHold(cfg.ex)) return cfg.repsMax + 's'
  return cfg.repsMin === cfg.repsMax ? String(cfg.repsMin) : cfg.repsMin + '–' + cfg.repsMax
}

function plateH(plate) {
  return PLATE_H[plate] || 30
}

function doneOf(idx) {
  const rows = rowsByEx.value[idx] || []
  return rows.filter((row) => row.done).length
}

function prevText(name) {
  const lift = lastLift(store, name)
  if (!lift) return '首次训练，先建立一个基线'
  if (lift.weight > 0) return lift.weight + ' kg × ' + lift.reps + ' 次'
  return '自重 × ' + lift.reps + ' 次'
}

function rowPrev(row) {
  const lift = lastLift(store, row.ex)
  if (!lift) return '—'
  const detail = lift.detail && lift.detail[row.setIdx]
  if (detail) {
    return detail.weight > 0 ? detail.weight + '×' + detail.reps : detail.reps + '次'
  }
  if (lift.weight > 0) return lift.weight + '×' + lift.reps
  return '自重'
}

function toast(title) {
  uni.showToast({ title, icon: 'none' })
}

function toggleEx(idx) {
  const session = store.draft
  if (!session) return
  session.openEx = session.openEx === idx ? -1 : idx
  calcOpen.value = false
  persistSoon()
  if (session.openEx >= 0) scrollToEx(session.openEx)
}

function scrollToEx(idx) {
  try {
    uni.pageScrollTo({ selector: '#ex-' + idx, offsetTop: -10, duration: 200 })
  } catch (error) {
    // 滚动仅影响体验，失败不打断训练。
  }
}

function prevStep() {
  const session = store.draft
  if (!session) return
  const base = session.openEx < 0 ? 0 : session.openEx
  const next = Math.max(0, base - 1)
  session.openEx = next
  calcOpen.value = false
  persist()
  scrollToEx(next)
}

function nextStep() {
  const session = store.draft
  if (!session) return
  const base = session.openEx < 0 ? 0 : session.openEx
  if (base >= session.exercises.length - 1) {
    requestFinish()
    return
  }
  session.openEx = base + 1
  calcOpen.value = false
  persist()
  scrollToEx(base + 1)
}

function onInput() {
  persistSoon()
}

function toggleSet(row) {
  const info = exInfo(row.ex)
  if (!(+row.reps > 0)) {
    toast(isHold(row.ex) ? '请先填写秒数' : '请先填写次数')
    return
  }
  if (!info.bw && !(+row.weight > 0)) {
    toast('请先填写重量')
    return
  }
  row.done = !row.done
  if (row.done) {
    row.weight = fmtNum(row.weight)
    row.reps = fmtNum(row.reps)
    startRest(row)
  }
  persist()
}

function startRest(row) {
  const session = store.draft
  if (!session) return
  const ex = session.exercises[row.exIdx]
  if (!ex || !(ex.rest > 0)) return
  const idx = session.sets.indexOf(row)
  const next = session.sets.slice(idx + 1).find((item) => !item.done)
  session.rest = {
    until: Date.now() + ex.rest * 1000,
    total: ex.rest * 1000,
    next: next
      ? next.ex === row.ex
        ? '接下来 ' + next.ex + ' · 第 ' + (next.setIdx + 1) + ' 组'
        : '接下来 ' + next.ex
      : '最后一个动作完成'
  }
  now.value = Date.now()
}

function adjustRest(delta) {
  const session = store.draft
  if (!session || !session.rest) return
  const rest = session.rest
  rest.until += delta
  rest.total = Math.max(5000, rest.total + delta)
  if (rest.until <= Date.now()) {
    session.rest = null
  }
  persist()
}

function skipRest() {
  if (store.draft) {
    store.draft.rest = null
    persist()
  }
}

function copyPrev() {
  const session = store.draft
  if (!session || session.openEx < 0) return
  const rows = rowsByEx.value[session.openEx] || []
  let changed = 0
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].done) continue
    rows[i].weight = rows[i - 1].weight
    rows[i].reps = rows[i - 1].reps
    changed++
  }
  if (changed) {
    persist()
    toast('已把上一组填到未完成组')
  } else {
    toast('没有可填写的未完成组')
  }
}

function requestFinish() {
  const session = store.draft
  if (!session) return
  const done = session.sets.filter((row) => row.done).length
  if (!done) {
    toast('至少勾选一组再完成训练')
    return
  }
  uni.showModal({
    title: '完成本次训练？',
    content: '已勾选 ' + done + ' / ' + session.sets.length + ' 组，完成后写入本地历史并结算 PR。',
    confirmText: '完成训练',
    cancelText: '再练一会',
    success: (res) => {
      if (res.confirm) finishNow()
    }
  })
}

function finishNow() {
  const summary = buildSummary(store)
  if (!summary) return
  store.records.sessions.unshift(summary)
  store.draft = null
  persist()
  uni.redirectTo({ url: '/pages/summary/index?id=' + encodeURIComponent(summary.id) })
}

function requestExit() {
  uni.showModal({
    title: '退出训练？',
    content: '已填写的重量、次数和勾选会保留为草稿，回到「今天」可以继续。',
    confirmText: '保存并退出',
    cancelText: '继续训练',
    success: (res) => {
      if (res.confirm) {
        persist()
        uni.navigateBack({
          fail: () => uni.switchTab({ url: '/pages/today/index' })
        })
      }
    }
  })
}
</script>

<style scoped>
.wk {
  box-sizing: border-box;
  min-height: 100vh;
  padding-bottom: calc(92px + env(safe-area-inset-bottom));
}

.wk-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(16px + env(safe-area-inset-top)) 16px 10px;
}

.wk-mid {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.wk-name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wk-meta {
  display: block;
  margin-top: 3px;
  font-family: var(--kr-font-mono);
  font-size: 10px;
  letter-spacing: 0.05em;
  color: var(--kr-text-dim);
}

.wk-done {
  width: 38px;
  flex: none;
  text-align: right;
  font-size: 12px;
  color: var(--kr-acid);
}

.progress {
  height: 2px;
  margin: 0 16px;
  border-radius: 2px;
  background: #1d2320;
  overflow: hidden;
}

.progress__fill {
  display: block;
  height: 100%;
  background: var(--kr-acid);
  transition: width 0.3s ease;
}

.ex-list {
  padding: 4px 16px 0;
}

.ex {
  margin-top: 8px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-lg);
  background: #0c100e;
  overflow: hidden;
}

.ex--open {
  border-color: var(--kr-line-strong);
  background: linear-gradient(180deg, #121714 0%, #0b0f0c 100%);
}

.ex-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 12px;
}

.ex-no {
  width: 18px;
  flex: none;
  font-family: var(--kr-font-mono);
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.ex-title {
  flex: 1;
  min-width: 0;
}

.ex-name {
  display: block;
  font-size: 14.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ex-meta {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: var(--kr-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ex-count {
  font-family: var(--kr-font-mono);
  font-size: 11px;
  color: var(--kr-text-dim);
}

.ex-count--on {
  color: var(--kr-acid);
}

.ex-chev {
  width: 18px;
  text-align: center;
  font-size: 16px;
  color: var(--kr-text-sub);
}

.ex-body {
  padding: 0 12px 13px;
}

.facts {
  display: flex;
  margin-top: 2px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: #0b0f0c;
  overflow: hidden;
}

.fact {
  flex: 1;
  padding: 8px 2px;
  text-align: center;
  border-left: 1px solid var(--kr-line);
}

.fact:first-child {
  border-left: 0;
}

.fact-num {
  display: block;
  font-family: var(--kr-font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
}

.fact-num--text {
  font-family: var(--kr-font-body);
  font-size: 12px;
  line-height: 20px;
}

.fact-unit {
  margin-left: 1px;
  font-size: 9px;
  color: var(--kr-text-dim);
}

.fact-label {
  font-size: 9.5px;
  color: var(--kr-text-dim);
}

.cue {
  display: block;
  margin-top: 13px;
  padding-left: 10px;
  border-left: 2px solid #2c342e;
  font-size: 11.5px;
  line-height: 1.72;
  color: var(--kr-text-dim);
}

.prev-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 13px;
  padding: 8px 10px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-sm);
  background: #0b0f0c;
}

.prev-label {
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.1em;
  color: var(--kr-text-dim);
}

.prev-val {
  font-family: var(--kr-font-mono);
  font-size: 10.5px;
  color: var(--kr-text-sub);
}

.calc {
  margin-top: 9px;
}

.calc-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border: 1px dashed #2e3731;
  border-radius: var(--kr-radius-sm);
  font-size: 11.5px;
  color: var(--kr-text-sub);
}

.calc-panel {
  margin-top: 7px;
  padding: 12px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: #0a0e0b;
}

.plate-vis {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 74px;
  border-radius: var(--kr-radius-sm);
  overflow: hidden;
  background: repeating-linear-gradient(90deg, transparent 0 23px, rgba(255, 255, 255, 0.025) 23px 24px);
}

.plate-side {
  display: flex;
  align-items: center;
  gap: 2px;
}

.plate {
  width: 8px;
  border-radius: 2px;
  background: #2a322c;
  border: 1px solid #404b43;
}

.plate--acid {
  border-color: var(--kr-acid);
  background: #243018;
}

.collar {
  width: 4px;
  height: 12px;
  border-radius: 1px;
  background: #4a554d;
}

.rod {
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: #3b463e;
}

.calc-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.calc-row text:last-child {
  font-family: var(--kr-font-mono);
  font-size: 11px;
  color: var(--kr-text-sub);
}

.calc-row--warn text:last-child {
  color: var(--kr-danger);
}

.calc-note {
  display: block;
  margin-top: 6px;
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  color: #4e5a52;
}

.set-head {
  display: grid;
  grid-template-columns: 26px 1fr 1fr 62px 34px;
  gap: 6px;
  margin-top: 16px;
  padding: 0 4px 6px;
  font-family: var(--kr-font-mono);
  font-size: 8.5px;
  letter-spacing: 0.08em;
  text-align: center;
  color: #525e56;
}

.set-head text:first-child {
  text-align: left;
}

.set-row {
  display: grid;
  grid-template-columns: 26px 1fr 1fr 62px 34px;
  gap: 6px;
  align-items: center;
  padding: 6px 4px;
  margin-bottom: 5px;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  background: #0b0f0c;
  transition: border-color 0.16s, background 0.16s;
}

.set-row--done {
  border-color: rgba(199, 255, 58, 0.38);
  background: rgba(199, 255, 58, 0.045);
}

.set-idx {
  font-family: var(--kr-font-mono);
  font-size: 11.5px;
  text-align: center;
  color: var(--kr-text-dim);
}

.set-row--done .set-idx {
  color: var(--kr-acid);
}

.set-input {
  height: 40px;
  border: 1px solid #29312b;
  border-radius: var(--kr-radius-sm);
  background: #070a08;
  text-align: center;
  font-family: var(--kr-font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--kr-text);
}

.set-input :deep(.uni-input-input) {
  height: 100%;
  background: transparent;
  text-align: center;
  font-family: var(--kr-font-mono);
  font-size: 16px;
  font-weight: 600;
  color: inherit;
}

.set-row--done .set-input {
  border-color: #364331;
}

.set-row--done .set-input :deep(.uni-input-input) {
  color: var(--kr-acid);
}

.set-prev {
  font-family: var(--kr-font-mono);
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
  color: #58645c;
}

.set-check {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #364038;
  border-radius: var(--kr-radius-sm);
  background: #080b09;
}

.set-check--on {
  border-color: var(--kr-acid);
  background: var(--kr-acid);
  color: #0a0d05;
}

.check-mark {
  font-size: 16px;
  font-weight: 700;
}

.set-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 9px;
}

.mini-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--kr-line-strong);
  border-radius: var(--kr-radius-sm);
  font-size: 11px;
  color: var(--kr-text-sub);
}

.mini-btn--acid {
  flex: 1;
  border-color: var(--kr-acid-line);
  color: var(--kr-acid);
  background: var(--kr-acid-soft);
}

.tool-hint {
  font-size: 9.5px;
  line-height: 1.5;
  text-align: right;
  color: #525e56;
}

.wk-foot {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  display: flex;
  gap: 8px;
  max-width: 560px;
  margin: 0 auto;
  padding: 10px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--kr-line);
  background: rgba(8, 10, 9, 0.96);
}

.wk-prev {
  width: 94px;
  flex: none;
  font-size: 12px;
}

.wk-next {
  flex: 1;
}

.rest-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  background: rgba(3, 4, 3, 0.45);
}

.rest {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: 560px;
  margin: 0 auto;
  padding: 15px 16px calc(15px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--kr-acid-line);
  border-radius: 10px 10px 0 0;
  background: #111613;
  box-shadow: 0 -26px 56px rgba(0, 0, 0, 0.65);
}

.rest-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rest-label {
  font-family: var(--kr-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.16em;
  color: var(--kr-acid);
}

.rest-next {
  max-width: 60%;
  font-size: 10px;
  line-height: 1.4;
  text-align: right;
  color: var(--kr-text-dim);
}

.rest-mid {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 6px 0 9px;
}

.rest-time {
  font-family: var(--kr-font-display);
  font-size: 50px;
  font-weight: 600;
  line-height: 1;
  color: var(--kr-text);
}

.rest-unit {
  font-size: 10px;
  color: var(--kr-text-dim);
}

.rest-bar {
  height: 3px;
  border-radius: 2px;
  background: #232a25;
  overflow: hidden;
}

.rest-fill {
  display: block;
  height: 100%;
  background: var(--kr-acid);
  transition: width 0.22s linear;
}

.rest-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 13px;
}

.rest-actions .mini-btn {
  flex: 1;
  height: 38px;
}
</style>
