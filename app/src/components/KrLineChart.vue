<template>
  <view class="kr-chart" :style="{ height: height + 'px' }">
    <canvas
      :id="canvasId"
      :canvas-id="canvasId"
      class="kr-canvas"
      :style="{ height: height + 'px' }"
    />
    <view v-if="!values.length" class="kr-chart-empty">暂无数据</view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, watch } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
  height: { type: Number, default: 160 },
  unit: { type: String, default: '' },
  fill: { type: Boolean, default: true },
  digits: { type: Number, default: 0 }
})

const instance = getCurrentInstance()
const canvasId = 'krc_' + Math.random().toString(36).slice(2, 8)

const values = computed(() =>
  (props.points || [])
    .map((row) => (typeof row === 'number' ? { value: row, label: '' } : row))
    .filter((row) => typeof row.value === 'number' && isFinite(row.value))
)

function fmt(value) {
  const fixed = Number(value).toFixed(props.digits)
  return props.digits > 0 ? String(+fixed) : String(Math.round(value))
}

function draw() {
  const list = values.value
  if (!list.length) return
  const query = uni.createSelectorQuery()
  if (instance && instance.proxy) query.in(instance.proxy)
  query
    .select('.kr-canvas')
    .boundingClientRect((rect) => {
      if (!rect || !rect.width) return
      const W = rect.width
      const H = props.height
      const L = 34
      const R = 8
      const T = 16
      const B = 22
      const pw = W - L - R
      const ph = H - T - B

      const vals = list.map((row) => row.value)
      let lo = Math.min.apply(null, vals)
      let hi = Math.max.apply(null, vals)
      const span = hi - lo || Math.abs(hi) * 0.15 || 1
      lo -= span * 0.2
      hi += span * 0.2
      const n = list.length
      const x = (i) => (n === 1 ? L + pw / 2 : L + (i / (n - 1)) * pw)
      const y = (v) => T + ph - ((v - lo) / (hi - lo)) * ph

      const ctx = uni.createCanvasContext(canvasId, instance.proxy)
      ctx.clearRect(0, 0, W, H)

      ctx.setLineWidth(1)
      ctx.setStrokeStyle('#242B27')
      ctx.setFillStyle('#65716A')
      ctx.setFontSize(9)
     ;[0, 0.5, 1].forEach((k) => {
        const v = lo + (hi - lo) * k
        const yy = y(v)
        ctx.beginPath()
        ctx.moveTo(L, yy)
        ctx.lineTo(W - R, yy)
        ctx.stroke()
        ctx.setTextAlign('right')
        ctx.fillText(fmt(v), L - 5, yy + 3)
      })

      if (props.fill) {
        ctx.beginPath()
        ctx.moveTo(x(0), y(vals[0]))
        for (let i = 1; i < n; i++) ctx.lineTo(x(i), y(vals[i]))
        ctx.lineTo(x(n - 1), T + ph)
        ctx.lineTo(x(0), T + ph)
        ctx.closePath()
        ctx.setFillStyle('rgba(199,255,58,0.10)')
        ctx.fill()
      }

      ctx.beginPath()
      ctx.setStrokeStyle('#C7FF3A')
      ctx.setLineWidth(1.6)
      for (let i = 0; i < n; i++) {
        if (i === 0) ctx.moveTo(x(0), y(vals[0]))
        else ctx.lineTo(x(i), y(vals[i]))
      }
      ctx.stroke()

      ctx.setFillStyle('#C7FF3A')
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.arc(x(i), y(vals[i]), n > 24 ? 1.6 : 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.setFillStyle('#65716A')
      const idx = n <= 1 ? [0] : n <= 5 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1]
      idx.forEach((i, k) => {
        const label = list[i].label || ''
        if (!label) return
        ctx.setTextAlign(k === 0 ? 'left' : k === idx.length - 1 ? 'right' : 'center')
        ctx.fillText(label, x(i), H - 6)
      })

      ctx.setFillStyle('#F1F4EF')
      ctx.setTextAlign(n === 1 ? 'center' : 'right')
      ctx.fillText(fmt(vals[n - 1]) + props.unit, x(n - 1), Math.max(T - 4, y(vals[n - 1]) - 7))

      ctx.draw()
    })
    .exec()
}

onMounted(() => {
  nextTick(() => setTimeout(draw, 40))
})

watch(
  () => props.points,
  () => nextTick(() => setTimeout(draw, 30)),
  { deep: true }
)
</script>

<style scoped>
.kr-chart {
  position: relative;
  width: 100%;
}

.kr-canvas {
  width: 100%;
  display: block;
}

.kr-chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  color: var(--kr-text-dim);
}
</style>
