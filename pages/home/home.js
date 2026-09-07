const request = require('../../utils/request')
const phone = require('../../utils/phone')
const CONFIG = require('../../utils/config')

Page({
  data: {
    zone: CONFIG.zone,
    mode: '',
    loading: true,
    error: false,
    hotlines: []
  },

  onLoad() {
    this.load()
  },

  onShow() {
    // 从其它 Tab 切回时静默刷新，避免公告/热线过期
    if (this._shown) this.load(true)
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
    request.call('categories.list', {}).then(res => {
      if (res.code !== 0) {
        this.setData({ loading: false, error: true })
        if (isRefresh) wx.stopPullDownRefresh()
        return
      }
      this.setData({
        loading: false,
        error: false,
        mode: request.getMode(),
        hotlines: res.data.hotlines || []
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
