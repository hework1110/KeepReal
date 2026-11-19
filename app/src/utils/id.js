// 本地记录 id：时间戳 + 随机串，不依赖浏览器 API。
export function uid(prefix) {
  return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}
