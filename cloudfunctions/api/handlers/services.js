/**
 * 服务列表 / 详情 / 拨打计数：service.list、service.detail、call.record
 */
const { db, _, ok, fail, getCatMap, decorate, fetchPublished } = require('../common')

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

module.exports = {
  'service.list': serviceList,
  'service.detail': serviceDetail,
  'call.record': callRecord
}
