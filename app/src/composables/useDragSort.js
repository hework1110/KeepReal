// 列表拖拽排序：真机走 touch 事件，H5 桌面预览额外支持鼠标拖动。
// 仅依赖通用事件，不使用 canvas、pointer capture 等浏览器专有能力。

import { onUnmounted, ref } from 'vue'

export function useDragSort(getLength, onMove) {
  const dragging = ref(-1)
  const dragOffset = ref(0)
  const dragTarget = ref(-1)

  let from = -1
  let startY = 0
  let rowHeight = 64
  let mouseBound = false

  function measure() {
    const query = uni.createSelectorQuery()
    query.select('.ex-row').boundingClientRect((rect) => {
      if (rect && rect.height) rowHeight = rect.height
    })
    query.exec()
  }

  function begin(index, clientY) {
    from = index
    dragging.value = index
    dragTarget.value = index
    dragOffset.value = 0
    startY = clientY
    measure()
  }

  function moveTo(clientY) {
    if (dragging.value < 0) return
    dragOffset.value = clientY - startY
    const step = Math.round(dragOffset.value / Math.max(40, rowHeight))
    const max = Math.max(0, getLength() - 1)
    dragTarget.value = Math.min(max, Math.max(0, from + step))
  }

  function end() {
    if (dragging.value >= 0 && dragTarget.value >= 0 && dragTarget.value !== from) {
      onMove(from, dragTarget.value)
    }
    dragging.value = -1
    dragOffset.value = 0
    dragTarget.value = -1
    from = -1
    unbind()
  }

  function onTouchStart(index, event) {
    const touch = event.touches && event.touches[0]
    if (touch) begin(index, touch.clientY)
  }

  function onTouchMove(event) {
    const touch = event.touches && event.touches[0]
    if (touch) moveTo(touch.clientY)
  }

  function onMouseMove(event) {
    moveTo(event.clientY)
  }

  function bind() {
    if (mouseBound) return
    mouseBound = true
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', end)
    }
  }

  function unbind() {
    if (!mouseBound) return
    mouseBound = false
    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', end)
    }
  }

  function onMouseDown(index, event) {
    if (event.button !== undefined && event.button !== 0) return
    begin(index, event.clientY)
    bind()
  }

  onUnmounted(unbind)

  return {
    dragging,
    dragOffset,
    dragTarget,
    onTouchStart,
    onTouchMove,
    onTouchEnd: end,
    onMouseDown
  }
}
