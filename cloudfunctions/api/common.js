/**
 * 云函数 api · 公共层
 * 初始化 wx-server-sdk / 云数据库，并提供各业务模块共享的工具与数据辅助。
 * 注：本文件被 require 时即完成 cloud.init，整包只初始化一次。
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/** 内置默认区域（categories.list 读取 zones 集合为空/异常时的兜底值） */
const ZONES = ['天通苑西二区']

/** 超过该时长视为“待复核”（stale 标记） */
const STALE_MS = 180 * 24 * 3600 * 1000

/** 服务合法审核状态 */
const SERVICE_STATUS = ['published', 'pending', 'rejected', 'offline', 'draft']

/* ---------- 响应工具 ---------- */

const ok = (data) => ({ code: 0, message: 'ok', data: data || {} })
const fail = (code, message) => ({ code, message })

/* ---------- 校验工具 ---------- */

const cleanPhone = (p) => String(p || '').replace(/[\s-]/g, '')
const isPhoneValid = (p) => {
  const v = cleanPhone(p)
  return /^1[3-9]\d{9}$/.test(v) || /^0\d{2,3}\d{7,8}$/.test(v)
}
const todayStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/* ---------- 数据辅助 ---------- */

async function getCatMap() {
  const res = await db.collection('categories').limit(100).get()
  const map = {}
  ;(res.data || []).forEach(c => { map[c._id] = c })
  return map
}

function decorate(item, catMap) {
  const out = Object.assign({}, item)
  const cat = catMap[item.categoryId]
  if (item.type !== 'hotline') {
    out.categoryName = cat ? cat.name : ''
    out.glyph = cat ? cat.glyph : ''
  }
  const rt = new Date(item.reviewedAt).getTime()
  out.stale = !isNaN(rt) && Date.now() - rt > STALE_MS
  if (!out.glyph) out.glyph = String(out.name || '服').slice(0, 1)
  return out
}

/** 拉取已发布且未删除的服务条目（内存分页轮询至 2000 条） */
async function fetchPublished(cond) {
  const base = Object.assign({ auditStatus: 'published', isDeleted: false }, cond || {})
  const all = []
  let skip = 0
  while (skip < 2000) {
    const res = await db.collection('services').where(base).orderBy('sort', 'asc').skip(skip).limit(100).get()
    all.push.apply(all, res.data || [])
    if ((res.data || []).length < 100) break
    skip += 100
  }
  return all
}

/* ---------- 内容安全（submit / feedback 共用） ---------- */

async function checkText(content) {
  if (!content) return true
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      content: String(content).slice(0, 2500),
      version: 2,
      scene: 2,
      openid: cloud.getWXContext().OPENID || 'o-preview'
    })
    const suggest = res && res.result && res.result.suggest
    return !suggest || suggest === 'pass'
  } catch (e) {
    if (e && (e.errCode === 87014)) return false
    // 检测服务异常时不阻断提交，交由人工审核兜底
    return true
  }
}

/* ---------- 权限（入口分发用） ---------- */

async function isAdmin(openid) {
  if (!openid) return false
  try {
    const res = await db.collection('adminConfig').doc('admins').get()
    const admins = (res.data && res.data.admins) || []
    return admins.indexOf(openid) > -1
  } catch (e) {
    return false
  }
}

module.exports = {
  cloud,
  db,
  _,
  ZONES,
  SERVICE_STATUS,
  ok,
  fail,
  cleanPhone,
  isPhoneValid,
  todayStart,
  getCatMap,
  decorate,
  fetchPublished,
  checkText,
  isAdmin
}
