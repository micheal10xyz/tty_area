/**
 * 区域列表适配层
 *
 * - 默认（USE_CLOUD = false）：读取 utils/local-data.js 的本地配置，
 *   离线/联调时无需依赖云端，启动预热逻辑不变。
 * - 切回云端：把 USE_CLOUD 改为 true，即恢复经 wx.cloud.callContainer
 *   访问云托管服务（服务名见 utils/config.js#containerService）的 GET /api/zones。
 *
 * 对外接口 fetchZones() / getCachedZones() 保持不变，app.js 与页面无需改动。
 */
const CONFIG = require('./config')
const DATA = require('./local-data')

/** true = 走云托管 /api/zones；false = 使用本地配置 */
const USE_CLOUD = false

function getApp() {
  return typeof globalThis !== 'undefined' && globalThis.getApp ? globalThis.getApp() : null
}

/** 写入 globalData 缓存，供 getCachedZones 同步读取 */
function applyCache(list) {
  const app = getApp()
  if (app && app.globalData) app.globalData.zones = list
}

/* ---------- 本地配置实现 ---------- */

function localZones() {
  const list = DATA.ZONES.slice()
  applyCache(list)
  return Promise.resolve({ code: 0, message: 'ok', data: list })
}

/* ---------- 云托管实现（保留备用） ---------- */

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

function cloudZones() {
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
        applyCache(list)
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

/* ---------- 对外接口 ---------- */

function fetchZones() {
  return USE_CLOUD ? cloudZones() : localZones()
}

function getCachedZones() {
  const app = getApp()
  return (app && app.globalData && app.globalData.zones) || []
}

module.exports = { fetchZones, getCachedZones }
