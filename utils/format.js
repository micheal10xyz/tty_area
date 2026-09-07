const CONFIG = require('./config')

/* ================= 工具函数 ================= */

/** 去除电话中的空格与短横线，供 wx.makePhoneCall 使用 */
function cleanPhone(phone) {
  return String(phone || '').replace(/[\s-]/g, '')
}

/** 基础电话格式校验：手机 或 带区号座机 */
function isPhoneValid(phone) {
  const p = cleanPhone(phone)
  return /^1[3-9]\d{9}$/.test(p) || /^0\d{2,3}\d{7,8}$/.test(p)
}

/** YYYY-MM-DD 格式化 */
function formatDate(input) {
  if (!input) return ''
  const d = new Date(input)
  if (isNaN(d.getTime())) return ''
  const m = d.getMonth() + 1
  const day = d.getDate()
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
}

/** 按 reviewedAt 计算是否超 180 天待复核 */
function isStale(reviewedAt, now) {
  if (!reviewedAt) return false
  const t = new Date(reviewedAt).getTime()
  if (isNaN(t)) return false
  const base = now || Date.now()
  return base - t > 180 * 24 * 3600 * 1000
}

/** 号码脱敏展示：保留后四位 */
function maskPhone(phone) {
  const p = cleanPhone(phone)
  if (p.length <= 4) return p
  return '****' + p.slice(-4)
}

module.exports = {
  cleanPhone,
  isPhoneValid,
  formatDate,
  isStale,
  maskPhone
}
