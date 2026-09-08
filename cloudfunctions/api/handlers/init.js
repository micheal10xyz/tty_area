/**
 * 初始化引导：init.bootstrap
 * 幂等导入默认区域/分类/服务/热线；管理员名单配置前允许任意用户执行（避免引导死锁）。
 */
const { cloud, db, ok, fail } = require('../common')

const COLLECTION_NAMES = ['categories', 'zones', 'services', 'submissions', 'feedbacks', 'adminConfig']

/** 幂等建集合：集合不存在时自动创建，避免首次引导因缺集合失败 */
async function ensureCollections() {
  for (const name of COLLECTION_NAMES) {
    if (typeof db.createCollection !== 'function') break
    try {
      await db.createCollection(name)
    } catch (e) {
      // 已存在时报错属正常，忽略
    }
  }
}

async function initBootstrap() {
  const seed = require('../seed')
  const openid = cloud.getWXContext().OPENID || ''

  // 权限：管理员名单未配置前允许任意用户执行首次引导；配置后仅管理员可执行
  let admins = []
  try {
    const cfgRes = await db.collection('adminConfig').doc('admins').get()
    admins = (cfgRes.data && cfgRes.data.admins) || []
  } catch (e) {
    // 集合/占位文档尚不存在，视为未配置
  }
  if (admins.length && admins.indexOf(openid) === -1) return fail(40301, '无权限')

  // 集合不存在时自动创建（区域/分类/服务/提交/反馈/管理员配置）
  await ensureCollections()

  const result = { categoriesInserted: 0, zonesInserted: 0, servicesInserted: 0 }

  // 0) 区域：zones 集合为空时写入默认组团；此后运营在控制台增删即可随 categories.list 下发
  const zoneCount = await db.collection('zones').count()
  if (zoneCount.total === 0) {
    const znow = Date.now()
    for (const z of seed.ZONES_SEED) {
      await db.collection('zones').add({ data: Object.assign({}, z, { createAt: znow, updateAt: znow }) })
      result.zonesInserted += 1
    }
  }

  // 1) 分类：使用固定 docId（如 cat_repair）写入，服务条目与批量导入均引用该 id
  const catCount = await db.collection('categories').count()
  if (catCount.total === 0) {
    for (const c of seed.CATEGORY_SEED) {
      const { _id, ...rest } = c
      await db.collection('categories').doc(_id).set({
        data: Object.assign({}, rest, { status: 'enabled', createAt: Date.now(), updateAt: Date.now() })
      })
      result.categoriesInserted += 1
    }
  }

  // 2) 构建 分类 seedKey/名称 → 实际 _id 映射（兼容旧版自动 id 的库）
  const idOf = {}
  const catRes = await db.collection('categories').limit(100).get()
  ;(catRes.data || []).forEach(c => {
    ;[c.seedKey, c._id, c.name].forEach(k => { if (k) idOf[k] = c._id })
  })

  // 3) 服务与常用热线首次导入（services 集合为空时一次性写入）
  const svcCount = await db.collection('services').count()
  if (svcCount.total === 0) {
    const now = Date.now()
    const day = 24 * 3600 * 1000
    const docs = []

    seed.HOTLINE_SEED.forEach((h, i) => {
      docs.push({
        name: h.name, glyph: h.glyph, type: 'hotline', categoryId: '',
        zone: seed.ZONE, phone: h.phone, address: '', hours: h.hours,
        desc: h.desc, tags: [], callCount: 0, reviewedAt: new Date(now - 20 * day).toISOString(),
        hot: false, sort: i + 1, auditStatus: 'published', source: 'seed',
        submitId: '', isDeleted: false, createAt: now, updateAt: now
      })
    })

    seed.SERVICE_SEED.forEach((s, i) => {
      docs.push({
        name: s.name, glyph: '', type: 'service', categoryId: idOf[s.categoryKey] || '',
        zone: seed.ZONE, phone: '010-00000' + String(100 + i), address: s.address, hours: s.hours,
        desc: s.desc, tags: [], callCount: 0,
        reviewedAt: new Date(now - (s.stale ? 200 * day : 20 * day)).toISOString(),
        hot: !!s.hot, sort: 0, auditStatus: 'published', source: 'seed',
        submitId: '', isDeleted: false, createAt: now, updateAt: now
      })
    })

    for (const d of docs) {
      await db.collection('services').add({ data: d })
      result.servicesInserted += 1
    }
  }

  // 4) adminConfig 占位文档（首次在控制台将运营者 openid 填入 admins.admins）
  try {
    await db.collection('adminConfig').doc('admins').get()
  } catch (e) {
    await db.collection('adminConfig').add({ data: seed.ADMIN_CONFIG_SEED })
  }

  return ok(Object.assign({}, result, {
    note: '在 adminConfig/admins.admins 填入你的 openid 后即可使用管理接口'
  }))
}

module.exports = {
  'init.bootstrap': initBootstrap
}
