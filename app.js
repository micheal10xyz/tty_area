const request = require('./utils/request')

App({
  globalData: {
    zone: '天通苑西二区',
    version: '0.1.0',
    mode: 'cloud'
  },

  onLaunch() {
    request.init()
  }
})
