const CONFIG = require('../../utils/config')

Page({
  data: {
    version: CONFIG.version
  },

  onShow() {
    this.syncTab()
  },

  syncTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' })
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
  },

  onShareAppMessage() {
    return {
      title: '天通苑便民 · 本地服务黄页',
      path: '/pages/home/home'
    }
  }
})
