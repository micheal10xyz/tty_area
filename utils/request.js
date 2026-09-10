/**
 * 数据请求适配层（本地配置模式）
 *
 * 说明：原先所有业务数据均通过 wx.cloud.callFunction 调用云函数 api 获取；
 *      现改为直接读取 utils/local-data.js 的本地配置，按 action 分发。
 *      init() / call(action, data) / getMode() 三个方法的签名保持不变，
 *      因此页面（home / list / detail / feedback / phone）无需任何改动。
 *
 * 恢复云端：把 call() 内部换回 wx.cloud.callFunction（见文件末尾注释），
 *          并删除对 local-data 的依赖即可。
 */
const DATA = require('./local-data')
const format = require('./format')

let inited = false
let ready = false
let initMessage = ''

/** 初始化（本地模式仅做就绪标记，不再初始化云开发） */
function init() {
  if (inited) return
  inited = true
  try {
    ready = true
    console.log('[tty] 已启用本地配置数据源（未接入云函数）')
  } catch (e) {
    initMessage = '本地数据源初始化失败：' + (e && e.message ? e.message : e)
    console.warn('[tty] 本地数据源初始化失败：', e)
  }
}

/** 数据来源标识：本地配置 = demo，首页据此展示「演示数据」标签 */
function getMode() {
  return ready ? 'demo' : 'pending'
}

/* ---------- 响应工具（与云函数返回结构保持一致） ---------- */

const ok = (data) => ({ code: 0, message: 'ok', data: data || {} })
const fail = (code, message) => ({ code, message })

/* ---------- 数据辅助 ---------- */

/** 分类 _id → 分类文档 */
function getCatMap() {
  const map = {}
  DATA.CATEGORIES.forEach(c => { map[c._id] = c })
  return map
}

/** 按条件筛选已发布且未删除的条目 */
function fetchPublished(cond) {
  const base = Object.assign({ auditStatus: 'published', isDeleted: false }, cond || {})
  const keys = Object.keys(base)
  return DATA.SERVICES.filter(item => keys.every(k => item[k] === base[k]))
}

/** 补充 categoryName / glyph / stale（对齐云函数 common.decorate 的行为） */
function decorate(item, catMap) {
  const out = Object.assign({}, item)
  const cat = catMap[item.categoryId]
  if (item.type !== 'hotline') {
    out.categoryName = cat ? cat.name : ''
    out.glyph = cat ? cat.glyph : ''
  }
  out.stale = format.isStale(item.reviewedAt)
  if (!out.glyph) out.glyph = String(out.name || '服').slice(0, 1)
  return out
}

/* ---------- action 实现 ---------- */

/** categories.list：分类 + 首页热线条目 + 服务区域 */
function categoriesList() {
  const cats = DATA.CATEGORIES
    .filter(c => c.status !== 'disabled')
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
  const hot = fetchPublished({ type: 'hotline' }).sort((a, b) => (a.sort || 0) - (b.sort || 0))
  return ok({
    categories: cats,
    hotlines: hot.slice(0, 8).map(h => ({
      _id: h._id,
      name: h.name,
      glyph: h.glyph || String(h.name || '').slice(0, 1),
      phone: h.phone,
      desc: h.desc,
      hours: h.hours
    })),
    zones: DATA.ZONES.slice()
  })
}

/** service.list：服务 / 热线列表，支持分类、搜索、区域与分页 */
function serviceList(p) {
  const params = p || {}
  const ptype = params.type || 'all'
  let list = []

  if (ptype === 'hotline') {
    list = fetchPublished({ type: 'hotline' }).sort((a, b) => (a.sort || 0) - (b.sort || 0))
  } else {
    list = DATA.SERVICES.filter(s => s.type !== 'hotline' && s.auditStatus === 'published' && !s.isDeleted)
    if (ptype === 'category' && params.categoryId) {
      list = list.filter(s => s.categoryId === params.categoryId)
    }
    if (params.zone) {
      list = list.filter(s => s.zone === params.zone)
    }
    list = list.slice().sort((a, b) => {
      if (!!a.hot !== !!b.hot) return a.hot ? -1 : 1
      return (b.updateAt || 0) - (a.updateAt || 0)
    })
  }

  const kw = String(params.keyword || '').trim().toLowerCase()
  const catMap = getCatMap()
  list = list.map(item => decorate(item, catMap))
  if (kw) {
    list = list.filter(item => {
      const hay = [item.name, item.desc, item.categoryName,
        (item.tags || []).join(' '), item.zone].join(' ').toLowerCase()
      return hay.indexOf(kw) > -1
    })
  }

  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(params.pageSize) || 20))
  const start = (page - 1) * pageSize
  return ok({
    list: list.slice(start, start + pageSize),
    page,
    hasMore: start + pageSize < list.length
  })
}

/** service.detail：单条详情 */
function serviceDetail(p) {
  const params = p || {}
  if (!params.id) return fail(40001, '缺少参数 id')
  const doc = DATA.SERVICES.filter(s => s._id === params.id)[0]
  if (!doc || doc.auditStatus !== 'published' || doc.isDeleted) {
    return fail(40401, '内容不存在或已下线')
  }
  return ok({ service: decorate(doc, getCatMap()) })
}

/** call.record：拨打计数（本地内存累加，重启复位） */
function callRecord(p) {
  const params = p || {}
  if (!params.serviceId) return fail(40001, '缺少参数 serviceId')
  const doc = DATA.SERVICES.filter(s => s._id === params.serviceId)[0]
  if (!doc) return fail(40401, '内容不存在或已下线')
  doc.callCount = (doc.callCount || 0) + 1
  return ok({})
}

/** feedback.create：意见反馈（本地仅返回成功，不落库） */
let feedbackSeq = 0
function feedbackCreate() {
  feedbackSeq += 1
  return ok({ id: 'local_fb_' + feedbackSeq })
}

const HANDLERS = {
  'categories.list': categoriesList,
  'service.list': serviceList,
  'service.detail': serviceDetail,
  'call.record': callRecord,
  'feedback.create': feedbackCreate
}

/** 统一的 action 分发入口（返回值仍是 Promise，兼容页面原有写法） */
function call(action, data) {
  if (!ready) {
    return Promise.resolve(fail(50000, initMessage || '数据源未就绪'))
  }
  const handler = HANDLERS[action]
  if (!handler) {
    return Promise.resolve(fail(40400, '未知接口：' + action))
  }
  try {
    return Promise.resolve(handler(data || {}))
  } catch (e) {
    console.warn('[tty] 本地数据分发失败 action=' + action, e)
    return Promise.resolve(fail(50000, '本地数据读取失败'))
  }
}

module.exports = { init, call, getMode }

/* ------------------------------------------------------------------
 * 恢复云函数调用（备用参考，勿直接启用）：
 *
 * function callCloud(action, data) {
 *   return new Promise(resolve => {
 *     wx.cloud.callFunction({
 *       name: 'api',
 *       data: Object.assign({ action }, data || {})
 *     }).then(res => {
 *       const r = res && res.result
 *       resolve(r && typeof r === 'object' ? r : { code: 0, message: 'ok', data: r })
 *     }).catch(err => {
 *       console.warn('[tty] 云函数调用失败 action=' + action, err)
 *       resolve({ code: 50000, message: '服务繁忙，请稍后重试' })
 *     })
 *   })
 * }
 * ------------------------------------------------------------------ */
