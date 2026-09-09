/**
 * 管理审核与数据维护：admin.pendingList / approve / reject / offline / fix / batchImport
 * 鉴权由入口 index.js 统一完成，本模块不重复校验。
 */
const { db, _, ok, fail, getDefaultZone, SERVICE_STATUS } = require('../common')

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
        zone: payload.zone || (await getDefaultZone()), phone: payload.phone,
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
  const defaultZone = await getDefaultZone()
  let okCount = 0
  for (const item of list) {
    if (!item.name || !item.phone) continue
    await db.collection('services').add({
      data: {
        name: String(item.name).slice(0, 30),
        glyph: String(item.glyph || String(item.name).slice(0, 1)),
        type: item.type === 'hotline' ? 'hotline' : 'service',
        categoryId: item.categoryId || '',
        zone: item.zone || defaultZone,
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

module.exports = {
  'admin.pendingList': adminPendingList,
  'admin.approve': adminApprove,
  'admin.reject': adminReject,
  'admin.offline': adminOffline,
  'admin.fix': adminFix,
  'admin.batchImport': adminBatchImport
}
