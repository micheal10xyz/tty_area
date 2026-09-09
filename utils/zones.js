/**
 * 区域列表（云托管 /api/zones）调用适配层
 * - 通过 wx.cloud.callContainer 访问「微信云托管」容器（服务名见 utils/config.js#containerService），
 *   不再经云函数 categories.list 附带 zones，也不依赖 request 合法域名配置
 * - 启动时 app.js 会预热一次，结果写入 globalData.zones 供各页面直接消费
 */
const CONFIG = require('./config')

function getApp() {
  return typeof globalThis !== 'undefined' && globalThis.getApp ? globalThis.getApp() : null
}

function pickList(body) {
  if (Array.isArray(body)) return body
  if (Array.isArray(body && body.data)) return body.data
  if (body && Array.isArray(body.data && body.data.zones)) return body.data.zones
  return []
}

function normalize(res) {
  if (!res || typeof res !== 'object') return { code: 50000, message: '返回数据异常', data: [] }
  if (res.code === undefined) return { code: 0, message: 'ok', data: res }
  return res
}

function fetchZones() {
  if (!wx.cloud) {
    return Promise.resolve({ code: 50000, message: '当前基础库不支持云开发', data: [] })
  }
  if (!CONFIG.containerService) {
    return Promise.resolve({ code: 50000, message: '未配置 containerService（utils/config.js）', data: [] })
  }
  const env = CONFIG.cloudEnv || undefined
  return new Promise(resolve => {
    wx.cloud.callContainer({
      config: { env },
      path: '/api/zones',
      method: 'GET',
      header: {
        'X-WX-SERVICE': CONFIG.containerService,
        'content-type': 'application/json'
      },
      success: res => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return resolve({ code: 50000, message: '服务繁忙（HTTP ' + res.statusCode + '）', data: [] })
        }
        const body = normalize(res.data)
        if (body.code !== 0) return resolve(Object.assign({}, body, { data: [] }))
        const list = pickList(body.data).filter(Boolean)
        const app = getApp()
        if (app && app.globalData) app.globalData.zones = list
        resolve({ code: 0, message: 'ok', data: list })
      },
      fail: err => {
        console.warn('[tty] /api/zones callContainer 调用失败：', err)
        resolve({
          code: 50000,
          message: '容器调用失败：' + String((err && (err.errMsg || err.message)) || '') + '；请核对 config.cloudEnv 与 containerService，并确认云托管服务已允许被调用',
          data: []
        })
      }
    })
  })
}

function getCachedZones() {
  const app = getApp()
  return (app && app.globalData && app.globalData.zones) || []
}

module.exports = { fetchZones, getCachedZones }