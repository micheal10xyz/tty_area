/**
 * 演示数据层（仅用于联调前 UI 预览）
 * ！！！所有号码均为示例占位，上线/联调前必须替换为运营核实后的真实号码 ！！！
 */
const CONFIG = require('./config')
const format = require('./format')

/* ---------- 分类目录 ---------- */
const CATEGORIES = [
  { _id: 'cat_repair', name: '维修安装', glyph: '修', hot: true, sort: 1 },
  { _id: 'cat_clean', name: '家政保洁', glyph: '洁', hot: false, sort: 2 },
  { _id: 'cat_lock', name: '开锁换锁', glyph: '锁', hot: true, sort: 3 },
  { _id: 'cat_move', name: '搬家货运', glyph: '搬', hot: false, sort: 4 },
  { _id: 'cat_drain', name: '管道疏通', glyph: '通', hot: true, sort: 5 },
  { _id: 'cat_recycle', name: '废品回收', glyph: '收', hot: false, sort: 6 },
  { _id: 'cat_express', name: '快递驿站', glyph: '递', hot: false, sort: 7 },
  { _id: 'cat_dryclean', name: '干洗缝补', glyph: '洗', hot: false, sort: 8 },
  { _id: 'cat_key', name: '配钥匙', glyph: '钥', hot: false, sort: 9 },
  { _id: 'cat_pet', name: '宠物服务', glyph: '宠', hot: false, sort: 10 }
]

/* ---------- 常用热线（示例） ---------- */
const HOTLINES = [
  { _id: 'h01', name: '西二区物业服务中心', glyph: '物', phone: '010-00000001', desc: '物业客服、报修与咨询', hours: '8:30-17:30' },
  { _id: 'h02', name: '西二区社区居委会', glyph: '居', phone: '010-00000002', desc: '社区事务、证明与活动', hours: '工作日 9:00-17:00' },
  { _id: 'h03', name: '属地派出所值班电话', glyph: '警', phone: '010-00000003', desc: '报警求助（非紧急）', hours: '24小时' },
  { _id: 'h04', name: '社区卫生服务中心', glyph: '卫', phone: '010-00000004', desc: '诊疗、疫苗、家医签约', hours: '8:00-17:30' },
  { _id: 'h05', name: '供电报修服务', glyph: '电', phone: '010-00000005', desc: '停电报修与用电咨询', hours: '24小时' },
  { _id: 'h06', name: '燃气客户服务', glyph: '气', phone: '010-00000006', desc: '燃气报修、开户与安检', hours: '9:00-17:00' },
  { _id: 'h07', name: '供热服务热线', glyph: '暖', phone: '010-00000007', desc: '供暖季报修与咨询', hours: '供暖季 24小时' },
  { _id: 'h08', name: '水务集团客服', glyph: '水', phone: '010-00000008', desc: '自来水报修与缴费咨询', hours: '9:00-17:00' },
  { _id: 'h09', name: '街道便民服务中心', glyph: '街', phone: '010-00000009', desc: '社保、民政等窗口业务', hours: '工作日 9:00-17:00' },
  { _id: 'h10', name: '开锁备案服务窗口', glyph: '备', phone: '010-00000010', desc: '急开锁请先确认备案资质', hours: '9:00-17:00' }
]

/* ---------- 便民服务条目（示例） ---------- */
// [名称, 分类id, 描述, 营业时间, 是否热门, 地址]
const SERVICE_SPEC = [
  ['老张家电维修', 'cat_repair', '空调/冰箱/洗衣机上门维修，先报价后维修', '8:00-21:00', true, '西二区3号院底商'],
  ['小李水电快修', 'cat_repair', '水管电路改造、灯具开关维修更换', '7:00-22:00', false, '西二区5号院'],
  ['洁家保洁', 'cat_clean', '日常保洁、开荒保洁，按次计费', '8:30-18:00', false, '西二区商业街'],
  ['安心家政（钟点工）', 'cat_clean', '钟点工、月嫂、育儿嫂，持证上岗', '9:00-18:00', false, '西二区2号院'],
  ['顺达开锁换锁', 'cat_lock', '防盗门/汽车开锁，公安备案，换超B级锁芯', '24小时', true, '西二区4号院'],
  ['快捷搬家公司', 'cat_move', '居民搬家、家具拆装，明码标价', '7:00-20:00', false, '西二区东侧停车场'],
  ['小货车搬家拉货', 'cat_move', '同城小件搬运、送家具家电', '6:00-21:00', false, '西二区1号院'],
  ['老刘疏通下水道', 'cat_drain', '马桶/地漏/主管道疏通，高压清洗', '24小时', true, '西二区6号院'],
  ['高压疏通清洗', 'cat_drain', '厨房管道油污清洗、化粪池清理', '7:00-19:00', false, '西二区商业街'],
  ['上门废品回收', 'cat_recycle', '纸箱/旧书/塑料/金属，按斤回收', '8:00-20:00', false, '上门（西二区）'],
  ['高价回收旧家电', 'cat_recycle', '旧空调冰箱洗衣机回收，置换抵扣', '9:00-19:00', false, '西二区3号院'],
  ['西二区快递驿站', 'cat_express', '代收代寄快递、包裹暂存', '9:00-20:30', false, '西二区7号院底商'],
  ['同城寄件服务点', 'cat_express', '同城当日达寄件、大件打包', '8:30-19:00', false, '西二区商业街'],
  ['小区干洗店', 'cat_dryclean', '衣物干洗、皮具护理、洗鞋', '9:00-20:00', false, '西二区2号院'],
  ['洗衣缝补改衣', 'cat_dryclean', '改裤脚、换拉链、织补破洞', '9:00-19:00', false, '西二区1号院'],
  ['配钥匙磨钥匙', 'cat_key', '小区门禁钥匙、普通钥匙配换', '8:30-20:00', false, '西二区4号院'],
  ['电子门禁卡配制', 'cat_key', '门禁卡复制、电梯卡升级', '9:00-18:00', false, '西二区商业街'],
  ['阳光宠物店', 'cat_pet', '宠物洗澡美容、零食用品', '9:00-20:00', false, '西二区3号院'],
  ['宠物寄养代遛', 'cat_pet', '家庭式寄养，节假日需提前预约', '8:00-21:00', false, '西二区6号院']
]

/* ---------- 组装 ---------- */
const CAT_MAP = {}
CATEGORIES.forEach(c => { CAT_MAP[c._id] = c })

let idx = 0
function buildServices() {
  const now = Date.now()
  return SERVICE_SPEC.map((s, i) => {
    const [name, categoryId, desc, hours, hot, address] = s
    idx += 1
    return decorate({
      _id: 's' + (100 + i),
      name,
      type: 'service',
      categoryId,
      zone: CONFIG.zone,
      phone: demoMobile(idx),
      address,
      hours,
      desc,
      tags: [],
      callCount: Math.floor(Math.random() * 30),
      reviewedAt: new Date(now - (i === 4 || i === 7 ? 200 : 20) * 24 * 3600 * 1000).toISOString(),
      hot,
      sort: 0
    })
  })
}

function demoMobile(n) {
  return '1380000' + String(100 + n).slice(1)
}

function decorate(item) {
  const cat = CAT_MAP[item.categoryId] || {}
  const out = Object.assign({}, item)
  if (item.type !== 'hotline') {
    out.categoryName = cat.name || ''
    out.glyph = cat.glyph || '服'
  }
  out.stale = item.reviewedAt ? format.isStale(item.reviewedAt) : false
  return out
}

const HOT_ITEMS = HOTLINES.map(h => decorate(Object.assign({}, h, {
  type: 'hotline', categoryId: 'cat_hotline', zone: CONFIG.zone,
  reviewedAt: new Date().toISOString(), hot: false, sort: 0
})))

let SERVICES = buildServices()

/* ---------- 反馈记录存储（仅模拟） ---------- */
function readStore(key) {
  try { return wx.getStorageSync(key) || [] } catch (e) { return [] }
}
function writeStore(key, list) {
  try { wx.setStorageSync(key, list) } catch (e) { /* ignore */ }
}

const ok = (data) => ({ code: 0, message: 'ok', data: data || {} })
const fail = (code, message) => ({ code, message })

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms || 160))
}

function findService(id) {
  const list = HOT_ITEMS.concat(SERVICES)
  for (let i = 0; i < list.length; i++) {
    if (list[i]._id === id) return list[i]
  }
  return null
}

function filterByKw(item, kw) {
  const hay = [item.name, item.desc, item.categoryName, (item.tags || []).join(' ')].join(' ').toLowerCase()
  return hay.indexOf(kw) > -1
}

async function handle(action, data) {
  await delay()
  const p = data || {}
  switch (action) {
    case 'categories.list':
      return ok({
        hotlines: HOT_ITEMS.slice(0, 8).map(h => ({ _id: h._id, name: h.name, glyph: h.glyph, phone: h.phone })),
        categories: CATEGORIES,
        zones: [CONFIG.zone]
      })

    case 'service.list': {
      const type = p.type || 'all'
      let list = []
      if (type === 'hotline') {
        list = HOT_ITEMS.slice()
      } else if (type === 'search') {
        list = HOT_ITEMS.concat(SERVICES)
      } else {
        list = SERVICES.slice()
        if (type === 'category' && p.categoryId) {
          list = list.filter(i => i.categoryId === p.categoryId)
        }
      }
      const kw = String(p.keyword || '').trim().toLowerCase()
      if (kw) list = list.filter(i => filterByKw(i, kw))
      if (type !== 'hotline') {
        list = list.slice().sort((a, b) => (a.hot === b.hot ? 0 : a.hot ? -1 : 1))
      }
      const page = Math.max(1, Number(p.page) || 1)
      const pageSize = Number(p.pageSize) || CONFIG.pageSize
      const start = (page - 1) * pageSize
      const items = list.slice(start, start + pageSize)
      return ok({ list: items, page, hasMore: start + pageSize < list.length })
    }

    case 'service.detail': {
      const item = findService(p.id)
      if (!item) return fail(40401, '内容不存在或已下线')
      return ok({ service: item })
    }

    case 'call.record': {
      const item = findService(p.serviceId)
      if (!item) return fail(40401, '内容不存在或已下线')
      item.callCount = (item.callCount || 0) + 1
      return ok({ callCount: item.callCount })
    }

    case 'feedback.create': {
      const store = readStore('tty_feedbacks')
      store.unshift({ _id: 'mock_fb_' + Date.now(), type: p.type, content: p.content, contact: p.contact || '', openid: 'demo-user', status: 'open', createAt: Date.now() })
      writeStore('tty_feedbacks', store)
      return ok({})
    }

    default:
      return ok({})
  }
}

module.exports = { handle }
