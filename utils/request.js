/**
 * 云函数调用适配层
 * 优先走云函数 api；未开通云开发/函数未部署时按配置回退演示数据（mock）
 */
const CONFIG = require('./config')
const mock = require('./mock')

let cloudReady = false
let inited = false
let usingMock = false

function init() {
  if (inited) return
  inited = true
  try {
    if (wx.cloud) {
      wx.cloud.init({ env: CONFIG.cloudEnv || undefined, traceUser: true })
      cloudReady = true
      console.log('[tty] 云开发初始化完成')
    } else {
      console.warn('[tty] 当前基础库不支持云开发')
    }
  } catch (e) {
    console.warn('[tty] 云开发初始化失败：', e)
  }
}

function getMode() {
  if (usingMock) return 'demo'
  if (!cloudReady) return 'pending'
  return 'cloud'
}

function isEnvError(err) {
  const msg = String((err && (err.errMsg || err.message)) || '')
  const code = String((err && err.errCode) || '')
  const pattern = /(env|environment|环境|cloud|云开发|function|函数)/i
  const failWord = /(not\s*(found|exist)|不存在|未开通|未初始化|fail)/i
  return pattern.test(msg + code) && failWord.test(msg + code)
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

function call(action, data) {
  if (!cloudReady || CONFIG.allowMock && usingMock) {
    return mock.handle(action, data)
  }
  return new Promise(resolve => {
    wx.cloud.callFunction({
      name: 'api',
      data: Object.assign({ action }, data || {})
    }).then(res => {
      usingMock = false
      resolve(normalize(res.result))
    }).catch(err => {
      console.warn('[tty] 云函数调用失败 action=' + action, err)
      if (CONFIG.allowMock && isEnvError(err)) {
        usingMock = true
        resolve(mock.handle(action, data))
      } else {
        resolve({ code: 50000, message: '服务繁忙，请稍后重试' })
      }
    })
  })
}

module.exports = { init, call, getMode }
