const request = require('../../utils/request')
const phone = require('../../utils/phone')
const CONFIG = require('../../utils/config')

Page({
  data: {
    zone: CONFIG.zone,
    mode: '',
    loading: true,
    error: false,
    hotlines: [],
    categories: [],
    recs: []
  },

  onLoad() {
    this.load()
  },

  onPullDownRefresh() {
    this.load(true)
  },

  load(isRefresh) {
    this.setData({ loading: true, error: false })
    Promise.all([
      request.call('categories.list', {}),
      request.call('service.list', { type: 'all', page: 1, pageSize: 5 })
    ]).then(results => {
      const catRes = results[0]
      const listRes = results[1]
      if (catRes.code !== 0 || listRes.code !== 0) {
        throw new Error('加载失败')
      }
      this.setData({
        loading: false,
        mode: request.getMode(),
        hotlines: catRes.data.hotlines || [],
        categories: catRes.data.categories || [],
        recs: listRes.data.list || []
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
    wx.navigateTo({ url: '/pages/list/list?type=search' })
  },

  goCategory(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({ url: '/pages/list/list?type=category&categoryId=' + id + '&title=' + encodeURIComponent(name) })
  },

  goAllHotline() {
    wx.navigateTo({ url: '/pages/list/list?type=hotline&title=' + encodeURIComponent('常用热线') })
  },

  goAllService() {
    wx.navigateTo({ url: '/pages/list/list?type=all&title=' + encodeURIComponent('便民服务') })
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  goSubmit() {
    wx.navigateTo({ url: '/pages/submit/submit?type=add' })
  },

  /* ---------- 拨打 ---------- */
  dialHotline(e) {
    const { id, name, phone: p } = e.currentTarget.dataset
    phone.confirmCall({ _id: id, name, phone: p })
  }
})
