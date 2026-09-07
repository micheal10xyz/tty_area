const CONFIG = require('../../utils/config')

Page({
  data: {
    version: CONFIG.version
  },

  goMine() {
    wx.navigateTo({ url: '/pages/mine/mine' })
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' })
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },

  onShareAppMessage() {
    return {
      title: '天通苑便民 · 本地服务黄页',
      path: '/pages/home/home'
    }
  }
})
