<template>
  <kr-sheet :visible="visible" :title="'调节 · ' + (draft.ex || '')" @close="emit('close')">
    <view class="cfg-row">
      <view class="cfg-label">
        <text class="cfg-name">组数</text>
        <text class="cfg-hint">这个动作做几组</text>
      </view>
      <view class="stepper">
        <text class="stepper-btn" @tap="step('sets', -1)">−</text>
        <text class="stepper-val">{{ draft.sets }}</text>
        <text class="stepper-btn" @tap="step('sets', 1)">+</text>
      </view>
    </view>

    <view class="cfg-row">
      <view class="cfg-label">
        <text class="cfg-name">次数区间</text>
        <text class="cfg-hint">下限与上限，相同表示固定次数</text>
      </view>
      <view class="range-steppers">
        <view class="stepper stepper--sm">
          <text class="stepper-btn" @tap="step('repsMin', -1)">−</text>
          <text class="stepper-val">{{ draft.repsMin }}</text>
          <text class="stepper-btn" @tap="step('repsMin', 1)">+</text>
        </view>
        <text class="range-dash">–</text>
        <view class="stepper stepper--sm">
          <text class="stepper-btn" @tap="step('repsMax', -1)">−</text>
          <text class="stepper-val">{{ draft.repsMax }}</text>
          <text class="stepper-btn" @tap="step('repsMax', 1)">+</text>
        </view>
      </view>
    </view>

    <view class="cfg-row">
      <view class="cfg-label">
        <text class="cfg-name">组间休息</text>
        <text class="cfg-hint">训练时按这个时长倒计时</text>
      </view>
      <view class="stepper">
        <text class="stepper-btn" @tap="step('rest', -15)">−</text>
        <text class="stepper-val">{{ draft.rest }}s</text>
        <text class="stepper-btn" @tap="step('rest', 15)">+</text>
      </view>
    </view>

    <view class="cfg-foot">
      <view class="kr-btn kr-btn--ghost" @tap="emit('close')">取消</view>
      <view class="kr-btn kr-btn--primary" @tap="save">保存设置</view>
    </view>
  </kr-sheet>
</template>

<script setup>
import { reactive, watch } from 'vue'
import KrSheet from './KrSheet.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  cfg: { type: Object, default: null }
})
const emit = defineEmits(['close', 'save'])

const draft = reactive({ ex: '', sets: 3, repsMin: 8, repsMax: 12, rest: 90 })

watch(
  () => props.visible,
  (show) => {
    if (!show || !props.cfg) return
    draft.ex = props.cfg.ex
    draft.sets = +props.cfg.sets || 3
    draft.repsMin = +props.cfg.repsMin || 8
    draft.repsMax = +props.cfg.repsMax || 12
    draft.rest = +props.cfg.rest || 90
  }
)

function step(key, delta) {
  const next = draft[key] + delta
  if (key === 'sets') draft.sets = Math.min(10, Math.max(1, next))
  else if (key === 'repsMin') {
    draft.repsMin = Math.min(draft.repsMax, Math.max(1, next))
  } else if (key === 'repsMax') {
    draft.repsMax = Math.min(60, Math.max(draft.repsMin, next))
  } else if (key === 'rest') {
    draft.rest = Math.min(300, Math.max(15, next))
  }
}

function save() {
  emit('save', {
    sets: draft.sets,
    repsMin: draft.repsMin,
    repsMax: draft.repsMax,
    rest: draft.rest
  })
}
</script>

<style scoped>
.cfg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--kr-line);
}

.cfg-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cfg-name {
  font-size: 13.5px;
  color: var(--kr-text);
}

.cfg-hint {
  font-size: 10.5px;
  color: var(--kr-text-dim);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--kr-line-strong);
  border-radius: var(--kr-radius-md);
  overflow: hidden;
}

.stepper-btn {
  width: 34px;
  height: 34px;
  line-height: 32px;
  text-align: center;
  color: var(--kr-text-sub);
  font-size: 16px;
  background: transparent;
}

.stepper-val {
  min-width: 46px;
  padding: 0 4px;
  text-align: center;
  font-family: var(--kr-font-mono);
  font-size: 13px;
  color: var(--kr-text);
}

.stepper--sm .stepper-btn {
  width: 28px;
  height: 30px;
  line-height: 28px;
  font-size: 14px;
}

.stepper--sm .stepper-val {
  min-width: 32px;
  font-size: 12px;
}

.range-steppers {
  display: flex;
  align-items: center;
  gap: 6px;
}

.range-dash {
  color: var(--kr-text-dim);
  font-size: 12px;
}

.cfg-foot {
  display: flex;
  gap: 10px;
  padding-top: 16px;
}

.cfg-foot .kr-btn {
  flex: 1;
}
</style>
