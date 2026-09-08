/**
 * 分类与首页聚合：categories.list
 */
const { db, ok, ZONES, fetchPublished } = require('../common')

/** 服务区域列表：优先读 zones 集合（运营可配置），空/异常时回退内置常量 */
async function listZones() {
  try {
    const res = await db.collection('zones').orderBy('sort', 'asc').limit(50).get()
    const names = (res.data || []).map(z => z.name).filter(Boolean)
    return names.length ? names : ZONES
  } catch (e) {
    return ZONES
  }
}

async function categoriesList() {
  const catRes = await db.collection('categories').orderBy('sort', 'asc').limit(100).get()
  const cats = (catRes.data || []).filter(c => c.status !== 'disabled')
  const hot = await fetchPublished({ type: 'hotline' })
  hot.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  return ok({
    categories: cats,
    hotlines: hot.slice(0, 8).map(h => ({ _id: h._id, name: h.name, glyph: h.glyph || String(h.name || '').slice(0, 1), phone: h.phone })),
    zones: await listZones()
  })
}

module.exports = {
  'categories.list': categoriesList
}
