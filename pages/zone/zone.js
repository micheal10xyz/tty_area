const request = require('../../utils/request')
const CONFIG = require('../../utils/config')

/** 已选小区的本地缓存键（与首页共用） */
const ZONE_KEY = 'tty_zone'

Page({
  data: {
    zone: CONFIG.zone,
    zones: [],
    loading: true,
    error: false
  },

  onLoad() {
    const saved = wx.getStorageSync(ZONE_KEY)
    if (saved) this.setData({ zone: saved })
    this.load()
  },

  load() {
    request.call('categories.list', {}).then(res => {
      if (res.code !== 0) {
        this.setData({ loading: false, error: true })
        return
      }
      const zones = (res.data.zones && res.data.zones.length) ? res.data.zones.slice() : []
      // 当前小区若不在可选列表中，也要能显示出来
      if (zones.indexOf(this.data.zone) === -1) zones.unshift(this.data.zone)
      this.setData({ zones, loading: false, error: false })
    }).catch(() => {
      this.setData({ loading: false, error: true })
    })
  },

  retry() {
    this.setData({ loading: true, error: false })
    this.load()
  },

  /** 选中小区：写入缓存后返回上一页 */
  pickZone(e) {
    const zone = e.currentTarget.dataset.name
    if (!zone) return
    if (zone === this.data.zone) {
      wx.navigateBack()
      return
    }
    this.setData({ zone })
    try {
      wx.setStorageSync(ZONE_KEY, zone)
    } catch (err) {
      // 存储失败不影响本次选择
    }
    const app = getApp()
    if (app && app.globalData) app.globalData.zone = zone
    wx.showToast({ title: '已切换到 ' + zone, icon: 'none', duration: 1200 })
    setTimeout(() => wx.navigateBack(), 220)
  }
})
