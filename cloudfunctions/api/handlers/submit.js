/**
 * 用户提交：submit.create（收录/纠错）、submit.mine（我的提交）
 * 注：本模块前端当前不再调用（v0.1.1 下线收录入口），保留供管理后台复用。
 */
const { cloud, db, _, ok, fail, isPhoneValid, todayStart, checkText, ZONES } = require('../common')

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

module.exports = {
  'submit.create': submitCreate,
  'submit.mine': submitMine
}
