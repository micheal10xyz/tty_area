/**
 * 分类与首页聚合：categories.list
 */
const { db, ok, listZones, fetchPublished } = require('../common')

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
