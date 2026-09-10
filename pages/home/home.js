const request = require('../../utils/request')
const phone = require('../../utils/phone')
const CONFIG = require('../../utils/config')

/** 已选小区的本地缓存键（与 pages/zone/zone 共用） */
const ZONE_KEY = 'tty_zone'

Page({
  data: {
    zone: CONFIG.zone,
    mode: '',
    loading: true,
    error: false,
    hotlines: [],
    notices: []
  },

  onLoad() {
    const saved = wx.getStorageSync(ZONE_KEY)
    if (saved) this.setData({ zone: saved })
    this.load()
  },

  onShow() {
    // 从小区页返回后可能已切换小区
    const saved = wx.getStorageSync(ZONE_KEY)
    const zoneChanged = !!saved && saved !== this.data.zone
    if (zoneChanged) this.setData({ zone: saved })
    // 从其它 Tab 切回时静默刷新，避免公告/热线过期
    if (this._shown || zoneChanged) this.load(true)
    this._shown = true
    this.syncTab()
  },

  syncTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onPullDownRefresh() {
    this.load(true)
  },

  load(isRefresh) {
    // 首页主体（常用热线）与小区动态并发拉取；动态失败不阻塞主内容
    Promise.all([
      request.call('categories.list', {}),
      request.call('notice.list', { limit: 3 })
    ]).then(res => {
      const cat = res[0] || {}
      const notice = res[1] || {}
      const catOk = cat.code === 0
      this.setData({
        loading: false,
        error: !catOk,
        mode: request.getMode(),
        hotlines: catOk ? (cat.data.hotlines || []) : [],
        notices: (notice.code === 0 && notice.data && notice.data.list) || []
      })
      if (isRefresh) wx.stopPullDownRefresh()
    }).catch(() => {
      this.setData({ loading: false, error: true })
      if (isRefresh) wx.stopPullDownRefresh()
    })
  },

  retry() {
    this.load()
  },

  /* ---------- 跳转 ---------- */
  goZonePicker() {
    wx.navigateTo({ url: '/pages/zone/zone' })
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/list/list?type=search&title=' + encodeURIComponent('搜索服务') })
  },

  goAllHotline() {
    wx.navigateTo({ url: '/pages/list/list?type=hotline&title=' + encodeURIComponent('常用热线') })
  },

  goNotice() {
    wx.switchTab({ url: '/pages/notice/notice' })
  },

  /* ---------- 拨打 ---------- */
  dialHotline(e) {
    const { id, name, phone: p } = e.currentTarget.dataset
    phone.confirmCall({ _id: id, name, phone: p })
  },

  onShareAppMessage() {
    return {
      title: '天通苑便民 · 常用电话一键查',
      path: '/pages/home/home'
    }
  }
})
