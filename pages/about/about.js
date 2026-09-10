const CONFIG = require('../../utils/config')

Page({
  data: {
    version: CONFIG.version
  },

  onShareAppMessage() {
    return {
      title: '小区事先知 · 本地服务黄页',
      path: '/pages/home/home'
    }
  }
})
