const CONFIG = require('../../utils/config')

Page({
  data: {
    version: CONFIG.version
  },

  onShareAppMessage() {
    return {
      title: '天通苑便民 · 本地服务黄页',
      path: '/pages/home/home'
    }
  }
})
