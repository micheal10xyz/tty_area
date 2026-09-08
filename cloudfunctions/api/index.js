const { cloud, fail, isAdmin } = require('./common')

const PUBLIC = Object.assign(
  {},
  require('./handlers/categories'),
  require('./handlers/services'),
  require('./handlers/submit'),
  require('./handlers/feedback'),
  require('./handlers/init')
)

const ADMIN = require('./handlers/admin')

exports.main = async (event = {}) => {
  const action = event.action
  try {
    if (!action) return fail(40001, '缺少 action')
    if (ADMIN[action] && !(await isAdmin(cloud.getWXContext().OPENID || ''))) {
      return fail(40301, '无权限')
    }
    const fn = PUBLIC[action] || ADMIN[action]
    if (fn) return await fn(event)
    return fail(40001, '未知 action: ' + action)
  } catch (e) {
    console.error('[api] error action=' + action, e)
    return fail(50000, '系统异常')
  }
}
