const request = require('../../utils/request')

Page({
  data: {
    loading: true,
    error: false,
    list: []
  },

  onLoad() {
    this.load()
  },

  onShow() {
    this.syncTab()
    // 从其它 Tab 切回时静默刷新，保证公告时效
    if (this._shown) this.load(true)
    this._shown = true
  },

  syncTab() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onPullDownRefresh() {
    this.load(true)
  },

  load(isRefresh) {
    request.call('notice.list', { limit: 20 }).then(res => {
      if (res.code !== 0) {
        this.setData({ loading: false, error: true })
        if (isRefresh) wx.stopPullDownRefresh()
        return
      }
      this.setData({
        loading: false,
        error: false,
        list: (res.data && res.data.list) || []
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

  onShareAppMessage() {
    return {
      title: '天通苑便民 · 社区公告',
      path: '/pages/notice/notice'
    }
  }
})
