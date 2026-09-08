/**
 * 天通苑社区便民黄页 · 云函数 api（入口）
 * 仅做 action 分发与统一鉴权/异常兜底；业务实现见 handlers/，公共能力见 common.js。
 * 集合：categories / zones / services / submissions / feedbacks / adminConfig
 */
const { cloud, fail, isAdmin } = require('./common')

// 公开接口：无需管理员（用户提交类在处理器内部自行校验 openid/频率/内容安全）
const PUBLIC = Object.assign(
  {},
  require('./handlers/categories'),
  require('./handlers/services'),
  require('./handlers/submit'),
  require('./handlers/feedback')
)

// 初始化引导：管理员名单未配置前允许执行（init.js 内自鉴权）
const INIT = require('./handlers/init')

// 管理接口：由入口统一鉴权后调用
const ADMIN = require('./handlers/admin')

exports.main = async (event = {}) => {
  const action = event.action
  try {
    if (!action) return fail(40001, '缺少 action')
    if (PUBLIC[action]) return await PUBLIC[action](event)
    if (INIT[action]) return await INIT[action](event)

    // 管理接口统一鉴权
    const openid = cloud.getWXContext().OPENID || ''
    if (!(await isAdmin(openid))) return fail(40301, '无权限')
    if (ADMIN[action]) return await ADMIN[action](event)

    return fail(40001, '未知 action: ' + action)
  } catch (e) {
    console.error('[api] error action=' + action, e)
    return fail(50000, '系统异常')
  }
}
