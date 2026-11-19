<template>
  <view v-if="visible" class="ks-mask" @tap="emit('close')">
    <view class="ks-sheet" @tap.stop>
      <view class="ks-head">
        <text class="ks-title">{{ title }}</text>
        <text class="ks-close" @tap="emit('close')">×</text>
      </view>
      <scroll-view scroll-y class="ks-body">
        <slot />
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

const emit = defineEmits(['close'])
</script>

<style scoped>
.ks-mask {
  position: fixed;
  inset: 0;
  /* 高于 H5 原生 tabBar（z-index 998），避免底部弹层被 tabBar 盖住。 */
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.62);
}

.ks-sheet {
  width: 100%;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  padding: 0 18px calc(18px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--kr-line-strong);
  border-radius: 14px 14px 0 0;
  background: var(--kr-surface);
}

.ks-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0 12px;
  border-bottom: 1px solid var(--kr-line);
}

.ks-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ks-close {
  width: 30px;
  height: 30px;
  line-height: 28px;
  text-align: center;
  border: 1px solid var(--kr-line);
  border-radius: var(--kr-radius-md);
  color: var(--kr-text-dim);
  font-size: 16px;
}

.ks-body {
  max-height: 66vh;
  padding-top: 14px;
  box-sizing: border-box;
}
</style>
