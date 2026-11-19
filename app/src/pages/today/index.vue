<template>
  <view class="kr-page">
    <text class="kr-kicker">KEEPREAL / TODAY</text>
    <view class="kr-head">
      <text class="kr-title">今天</text>
      <text class="kr-sub">把今天练扎实。</text>
    </view>

    <view class="kr-card">
      <text class="kr-card-label">今日训练</text>
      <text class="kr-num kr-num--acid">—</text>
      <text class="kr-empty">计划模块接入后，这里显示今天的训练安排与开始入口。</text>
    </view>

    <view class="kr-card">
      <view class="kr-row">
        <text class="kr-row-label">本周训练</text>
        <text class="kr-row-value">-- 次</text>
      </view>
      <view class="kr-row">
        <text class="kr-row-label">连续训练</text>
        <text class="kr-row-value">-- 天</text>
      </view>
    </view>
  </view>
</template>

<script setup>
// 骨架页：本轮只验证 tab 切换与主题变量，业务逻辑在后续迭代接入。
</script>
