const CONFIG = require('../../utils/config')

Page({
  data: {
    version: CONFIG.version
  },

  goSubmit() {
    wx.navigateTo({ url: '/pages/submit/submit?type=add' })
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' })
  },

  onShareAppMessage() {
    return {
      title: '天通苑便民 · 本地服务黄页',
      path: '/pages/home/home'
    }
  }
})
