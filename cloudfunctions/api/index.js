/**
 * 天通苑社区便民黄页 · 云函数 api
 * 统一入口：event.action 分发；身份取 wxContext.OPENID（不信任客户端传入）
 * 集合：categories / services / submissions / feedbacks / adminConfig
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const ZONES = ['天通苑西二区']
const STALE_MS = 180 * 24 * 3600 * 1000
const SERVICE_STATUS = ['published', 'pending', 'rejected', 'offline', 'draft']

const ok = (data) => ({ code: 0, message: 'ok', data: data || {} })
const fail = (code, message) => ({ code, message })

const cleanPhone = (p) => String(p || '').replace(/[\s-]/g, '')
const isPhoneValid = (p) => {
  const v = cleanPhone(p)
  return /^1[3-9]\d{9}$/.test(v) || /^0\d{2,3}\d{7,8}$/.test(v)
}
const escapeReg = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const todayStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/* ---------- 通用数据辅助 ---------- */

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

/* ---------- 公开查询 ---------- */

async function categoriesList() {
  const catRes = await db.collection('categories').orderBy('sort', 'asc').limit(100).get()
  const cats = (catRes.data || []).filter(c => c.status !== 'disabled')
  const hot = await fetchPublished({ type: 'hotline' })
  hot.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  return ok({
    categories: cats,
    hotlines: hot.slice(0, 8).map(h => ({ _id: h._id, name: h.name, glyph: h.glyph || String(h.name || '').slice(0, 1), phone: h.phone })),
    zones: ZONES
  })
}

async function serviceList(p) {
  const ptype = p.type || 'all'
  let list = []
  if (ptype === 'hotline') {
    list = await fetchPublished({ type: 'hotline' })
    list.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  } else {
    const cond = { type: _.neq('hotline') }
    if (ptype === 'category' && p.categoryId) cond.categoryId = p.categoryId
    else if (ptype === 'search') delete cond.type
    if (p.zone) cond.zone = p.zone
    list = await fetchPublished(cond)
    list.sort((a, b) => {
      if (!!a.hot !== !!b.hot) return a.hot ? -1 : 1
      return (b.updateAt || 0) - (a.updateAt || 0)
    })
  }

  const kw = String(p.keyword || '').trim().toLowerCase()
  const catMap = await getCatMap()
  list = list.map(item => decorate(item, catMap))
  if (kw) {
    list = list.filter(item => {
      const hay = [item.name, item.desc, item.categoryName,
        (item.tags || []).join(' '), item.zone].join(' ').toLowerCase()
      return hay.indexOf(kw) > -1
    })
  }

  const page = Math.max(1, Number(p.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(p.pageSize) || 20))
  const start = (page - 1) * pageSize
  return ok({ list: list.slice(start, start + pageSize), page, hasMore: start + pageSize < list.length })
}

async function serviceDetail(p) {
  if (!p.id) return fail(40001, '缺少参数 id')
  let doc = null
  try {
    const res = await db.collection('services').doc(p.id).get()
    doc = res.data
  } catch (e) {
    return fail(40401, '内容不存在或已下线')
  }
  if (!doc || doc.auditStatus !== 'published' || doc.isDeleted) {
    return fail(40401, '内容不存在或已下线')
  }
  const catMap = await getCatMap()
  return ok({ service: decorate(doc, catMap) })
}

async function callRecord(p) {
  if (!p.serviceId) return fail(40001, '缺少参数 serviceId')
  try {
    await db.collection('services').doc(p.serviceId).update({
      data: { callCount: _.inc(1) }
    })
  } catch (e) {
    return fail(40401, '内容不存在或已下线')
  }
  return ok({})
}

/* ---------- 用户提交 ---------- */

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

async function submitCreate(p) {
  const openid = cloud.getWXContext().OPENID
  if (!openid) return fail(40101, '未授权')
  const type = p.type === 'correct' ? 'correct' : 'add'
  const payload = p.payload || {}

  // 基础校验
  if (!payload.name || !payload.name.trim()) return fail(40001, '请填写名称')
  if (payload.phone && !isPhoneValid(payload.phone)) return fail(40001, '电话格式不正确')
  if (type === 'add') {
    if (!payload.categoryId) return fail(40001, '请选择分类')
    if (!isPhoneValid(payload.phone)) return fail(40001, '电话格式不正确')
  }
  if (type === 'correct') {
    if (!p.issueType) return fail(40001, '请选择纠错原因')
    if (p.targetServiceId && !payload.phone && !payload.desc && !payload.address && !payload.hours && !payload.categoryId) {
      return fail(40001, '请填写需要更正的信息')
    }
  }
  const strLen = JSON.stringify(payload).length
  if (strLen > 800) return fail(40001, '内容过长')

  // 频率限制：同 openid 每日 add+correct 合计 5 条
  const countRes = await db.collection('submissions')
    .where({ openid, createAt: _.gte(todayStart()) }).count()
  if (countRes.total >= 5) return fail(40302, '今日提交已达上限')

  // 内容安全
  const safe = await checkText([payload.name, payload.desc, payload.address].join(' '))
  if (!safe) return fail(41001, '内容不合规')

  const rec = {
    type,
    targetServiceId: p.targetServiceId || '',
    issueType: type === 'correct' ? p.issueType : '',
    payload: {
      name: String(payload.name).trim().slice(0, 30),
      categoryId: payload.categoryId || '',
      zone: payload.zone || ZONES[0],
      phone: payload.phone ? String(payload.phone).trim() : '',
      address: payload.address ? String(payload.address).trim().slice(0, 60) : '',
      hours: payload.hours ? String(payload.hours).trim().slice(0, 30) : '',
      desc: payload.desc ? String(payload.desc).trim().slice(0, 200) : ''
    },
    auditStatus: 'pending',
    note: '',
    openid,
    createAt: Date.now(),
    updateAt: Date.now()
  }
  const addRes = await db.collection('submissions').add({ data: rec })
  return ok({ submitId: addRes._id, auditStatus: 'pending' })
}

async function submitMine() {
  const openid = cloud.getWXContext().OPENID
  if (!openid) return fail(40101, '未授权')
  const res = await db.collection('submissions')
    .where({ openid }).orderBy('createAt', 'desc').limit(50).get()
  return ok({ list: res.data || [] })
}

async function feedbackCreate(p) {
  const openid = cloud.getWXContext().OPENID
  if (!openid) return fail(40101, '未授权')
  const type = ['bug', 'suggestion', 'other'].indexOf(p.type) > -1 ? p.type : 'other'
  const content = String(p.content || '').trim()
  if (!content || content.length < 2) return fail(40001, '请填写反馈内容')
  if (content.length > 500) return fail(40001, '内容过长')
  if ((p.contact || '').length > 40) return fail(40001, '联系方式过长')

  const countRes = await db.collection('feedbacks')
    .where({ openid, createAt: _.gte(todayStart()) }).count()
  if (countRes.total >= 3) return fail(40302, '今日反馈已达上限')

  const safe = await checkText(content + ' ' + (p.contact || ''))
  if (!safe) return fail(41001, '内容不合规')

  await db.collection('feedbacks').add({
    data: {
      type, content,
      contact: String(p.contact || '').trim(),
      openid, status: 'open',
      createAt: Date.now()
    }
  })
  return ok({})
}

/* ---------- 管理端 ---------- */

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

async function loadSubmission(id) {
  try {
    const res = await db.collection('submissions').doc(id).get()
    return res.data
  } catch (e) {
    return null
  }
}

async function adminPendingList() {
  const res = await db.collection('submissions')
    .where({ auditStatus: 'pending' }).orderBy('createAt', 'asc').limit(50).get()
  const list = res.data || []
  // 关联纠错目标名称
  const ids = list.filter(i => i.targetServiceId).map(i => i.targetServiceId)
  const nameMap = {}
  if (ids.length) {
    const r = await db.collection('services').where({ _id: _.in(ids) }).limit(100).get()
    ;(r.data || []).forEach(s => { nameMap[s._id] = s.name })
  }
  list.forEach(i => { i.targetName = nameMap[i.targetServiceId] || '' })
  return ok({ list })
}

async function adminApprove(p) {
  if (!p.id) return fail(40001, '缺少参数 id')
  const sub = await loadSubmission(p.id)
  if (!sub || sub.auditStatus !== 'pending') return fail(40401, '申请不存在或已处理')
  const now = Date.now()
  const payload = sub.payload || {}
  let serviceId = ''

  if (sub.type === 'add') {
    const addRes = await db.collection('services').add({
      data: {
        name: payload.name, type: 'service', categoryId: payload.categoryId,
        zone: payload.zone || ZONES[0], phone: payload.phone,
        address: payload.address || '', hours: payload.hours || '', desc: payload.desc || '',
        tags: [], auditStatus: 'published', callCount: 0, reviewedAt: now,
        source: 'user', submitId: sub._id, hot: false, sort: 999,
        isDeleted: false, createAt: now, updateAt: now
      }
    })
    serviceId = addRes._id
  } else {
    // correct：targetServiceId 为空或目标不存在时仅记录处理
    if (sub.targetServiceId) {
      try {
        const targetRes = await db.collection('services').doc(sub.targetServiceId).get()
        const target = targetRes.data
        if (target && !target.isDeleted) {
          const patch = {
            name: payload.name || target.name,
            categoryId: payload.categoryId || target.categoryId,
            zone: payload.zone || target.zone,
            address: payload.address || target.address,
            hours: payload.hours || target.hours,
            desc: payload.desc || target.desc,
            updateAt: now
          }
          if (payload.phone) patch.phone = payload.phone
          if (['no_consent', 'not_exist'].indexOf(sub.issueType) > -1) {
            patch.auditStatus = 'offline'
          } else {
            patch.auditStatus = 'published'
            patch.reviewedAt = now
          }
          await db.collection('services').doc(sub.targetServiceId).update({ data: patch })
          serviceId = sub.targetServiceId
        }
      } catch (e) { /* 目标已删除则忽略 */ }
    }
  }

  await db.collection('submissions').doc(p.id).update({
    data: { auditStatus: 'done', note: p.note || '', handledAt: now }
  })
  return ok({ serviceId })
}

async function adminReject(p) {
  if (!p.id) return fail(40001, '缺少参数 id')
  const sub = await loadSubmission(p.id)
  if (!sub || sub.auditStatus !== 'pending') return fail(40401, '申请不存在或已处理')
  await db.collection('submissions').doc(p.id).update({
    data: { auditStatus: 'rejected', note: p.note || '', handledAt: Date.now() }
  })
  return ok({})
}

async function adminOffline(p) {
  if (!p.id) return fail(40001, '缺少参数 id')
  await db.collection('services').doc(p.id).update({
    data: { auditStatus: 'offline', updateAt: Date.now() }
  })
  return ok({})
}

async function adminFix(p) {
  if (!p.id || !p.patch) return fail(40001, '缺少参数')
  const keys = ['name', 'categoryId', 'zone', 'phone', 'address', 'hours', 'desc', 'tags', 'auditStatus', 'sort', 'hot']
  const data = {}
  keys.forEach(k => {
    if (p.patch[k] !== undefined) data[k] = p.patch[k]
  })
  if (data.auditStatus && SERVICE_STATUS.indexOf(data.auditStatus) === -1) {
    return fail(40001, '非法状态')
  }
  data.reviewedAt = Date.now()
  data.updateAt = Date.now()
  await db.collection('services').doc(p.id).update({ data })
  return ok({})
}

async function adminBatchImport(p) {
  const list = Array.isArray(p.list) ? p.list.slice(0, 500) : []
  if (!list.length) return fail(40001, '空列表')
  const now = Date.now()
  let okCount = 0
  for (const item of list) {
    if (!item.name || !item.phone) continue
    await db.collection('services').add({
      data: {
        name: String(item.name).slice(0, 30),
        glyph: String(item.glyph || String(item.name).slice(0, 1)),
        type: item.type === 'hotline' ? 'hotline' : 'service',
        categoryId: item.categoryId || '',
        zone: item.zone || ZONES[0],
        phone: String(item.phone),
        address: String(item.address || '').slice(0, 60),
        hours: String(item.hours || '').slice(0, 30),
        desc: String(item.desc || '').slice(0, 200),
        tags: Array.isArray(item.tags) ? item.tags : [],
        auditStatus: 'published', callCount: 0, reviewedAt: now,
        source: 'admin', submitId: '', hot: !!item.hot, sort: Number(item.sort) || 999,
        isDeleted: false, createAt: now, updateAt: now
      }
    })
    okCount += 1
  }
  return ok({ imported: okCount })
}

async function initBootstrap() {
  const openid = cloud.getWXContext().OPENID || ''
  const admin = await isAdmin(openid)
  if (openid && !admin) return fail(40301, '无权限')
  const seed = require('./seed')

  const catCount = await db.collection('categories').count()
  let inserted = 0
  if (catCount.total === 0) {
    for (const c of seed.CATEGORY_SEED) {
      await db.collection('categories').add({ data: c })
      inserted += 1
    }
  }
  // adminConfig 占位文档（首次在控制台补 admin openid）
  try {
    await db.collection('adminConfig').doc('admins').get()
  } catch (e) {
    await db.collection('adminConfig').add({ data: seed.ADMIN_CONFIG_SEED })
  }
  return ok({ categoriesInserted: inserted, note: '在 adminConfig/admins.admins 填入你的 openid 后即可使用管理接口' })
}

/* ---------- 分发 ---------- */

const HANDLERS = {
  'categories.list': categoriesList,
  'service.list': serviceList,
  'service.detail': serviceDetail,
  'call.record': callRecord,
  'submit.create': submitCreate,
  'submit.mine': submitMine,
  'feedback.create': feedbackCreate
}

exports.main = async (event = {}) => {
  const action = event.action
  try {
    if (!action) return fail(40001, '缺少 action')
    if (HANDLERS[action]) return await HANDLERS[action](event)

    if (action === 'init.bootstrap') return await initBootstrap()

    // 管理接口统一鉴权
    const openid = cloud.getWXContext().OPENID || ''
    const admin = await isAdmin(openid)
    if (!admin) return fail(40301, '无权限')
    const adminMap = {
      'admin.pendingList': adminPendingList,
      'admin.approve': adminApprove,
      'admin.reject': adminReject,
      'admin.offline': adminOffline,
      'admin.fix': adminFix,
      'admin.batchImport': adminBatchImport
    }
    if (adminMap[action]) return await adminMap[action](event)
    return fail(40001, '未知 action: ' + action)
  } catch (e) {
    console.error('[api] error action=' + action, e)
    return fail(50000, '系统异常')
  }
}
