Page({
  data: {},

  onShow() {
    this.syncTab()
  },

  syncTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onShareAppMessage() {
    return {
      title: '天通苑便民 · 社区公告',
      path: '/pages/notice/notice'
    }
  }
})
