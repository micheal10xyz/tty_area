Page({
  data: {},

  onShow() {
    this.syncTab()
  },

  syncTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  onShareAppMessage() {
    return {
      title: '小区事先知 · 本地服务黄页',
      path: '/pages/services/services'
    }
  }
})
