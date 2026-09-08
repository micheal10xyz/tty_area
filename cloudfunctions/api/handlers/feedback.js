/**
 * 意见反馈：feedback.create
 */
const { cloud, db, _, ok, fail, todayStart, checkText } = require('../common')

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

module.exports = {
  'feedback.create': feedbackCreate
}
