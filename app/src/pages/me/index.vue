<template>
  <view class="kr-page">
    <text class="kr-kicker">KEEPREAL / ME</text>
    <view class="kr-head">
      <text class="kr-title">我的</text>
      <text class="kr-sub">训练者 01</text>
    </view>

    <view class="kr-card">
      <view class="kr-row">
        <text class="kr-row-label">数据存储</text>
        <text class="kr-row-value">仅本机</text>
      </view>
      <view class="kr-row">
        <text class="kr-row-label">数据结构版本</text>
        <text class="kr-row-value kr-row-value--acid">v{{ storeVersion }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { readStore } from '../../store/storage'

// 读取一次，用来确认本地存储层可用。
const storeVersion = ref(readStore().version)
</script>
