/**
 * 云函数调用适配层（仅走微信云函数 api，不再提供 mock 数据）
 * 所有业务数据统一由云函数 cloudfunctions/api 从云数据库读取。
 */
const CONFIG = require('./config')

let cloudReady = false
let inited = false
let initMessage = ''

function init() {
  if (inited) return
  inited = true
  try {
    if (!wx.cloud) {
      initMessage = '当前基础库不支持云开发，请升级微信后重试'
      console.warn('[tty] 基础库不支持 wx.cloud')
      return
    }
    wx.cloud.init({ env: CONFIG.cloudEnv || undefined, traceUser: true })
    cloudReady = true
    console.log('[tty] 云开发初始化完成')
  } catch (e) {
    initMessage = '云开发初始化失败：' + (e && e.message ? e.message : e)
    console.warn('[tty] 云开发初始化失败：', e)
  }
}

function getMode() {
  return cloudReady ? 'cloud' : 'pending'
}

function normalize(res) {
  if (!res || typeof res !== 'object') {
    return { code: 50000, message: '返回数据异常' }
  }
  if (res.code === undefined) {
    return { code: 0, message: 'ok', data: res }
  }
  return res
}

/** 把云调用错误翻译成可读提示，便于排障 */
function hint(err) {
  const msg = String((err && (err.errMsg || err.message)) || '')
  if (/env|环境/i.test(msg)) return '云开发未开通或环境配置有误，请在开发者工具开通云开发'
  if (/FunctionName|函数|function|is not found|not found/i.test(msg)) return '云函数未部署，请先部署 cloudfunctions/api'
  return '服务繁忙，请稍后重试'
}

function call(action, data) {
  if (!cloudReady) {
    return Promise.resolve({ code: 50000, message: initMessage || '云开发未就绪' })
  }
  return new Promise(resolve => {
    wx.cloud.callFunction({
      name: 'api',
      data: Object.assign({ action }, data || {})
    }).then(res => {
      resolve(normalize(res.result))
    }).catch(err => {
      console.warn('[tty] 云函数调用失败 action=' + action, err)
      resolve({ code: 50000, message: hint(err) })
    })
  })
}

module.exports = { init, call, getMode }
