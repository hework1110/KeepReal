// 日期、数字与时长格式化，页面与业务逻辑共用。

export function pad(n) {
  return String(n).padStart(2, '0')
}

export function fmtNum(n) {
  const value = Math.round((+n || 0) * 100) / 100
  return String(value)
}

export function fmtVol(n) {
  return String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function fmtClock(sec) {
  const total = Math.max(0, Math.floor(+sec || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return pad(h) + ':' + pad(m) + ':' + pad(s)
}

export function fmtMs(ms) {
  const total = Math.ceil(Math.max(0, +ms || 0) / 1000)
  return pad(Math.floor(total / 60)) + ':' + pad(total % 60)
}

export function isoOf(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
}

export function addDays(date, n) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + n)
  return next
}

export function todayISO() {
  return isoOf(new Date())
}
