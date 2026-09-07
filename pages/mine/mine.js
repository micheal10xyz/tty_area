const request = require('../../utils/request')
const format = require('../../utils/format')
const { issueLabel, subTypeLabel, subStatusLabel } = require('../../utils/constants')

Page({
  data: {
    loading: true,
    error: false,
    list: []
  },

  onShow() {
    this.load()
  },

  onPullDownRefresh() {
    this.load(true)
  },

  load(isRefresh) {
    this.setData({ loading: true, error: false })
    request.call('submit.mine', {}).then(res => {
      if (res.code !== 0) {
        this.setData({ loading: false, error: true })
        return
      }
      const list = (res.data.list || []).map(item => {
        const payload = item.payload || {}
        return {
          _id: item._id,
          title: payload.name || '（未填写名称）',
          typeText: subTypeLabel(item.type),
          statusText: subStatusLabel(item.auditStatus),
          statusType: item.auditStatus || 'pending',
          issueText: item.type === 'correct' ? issueLabel(item.issueType) : '',
          note: item.note || '',
          dateText: format.formatDate(item.createAt)
        }
      })
      this.setData({ loading: false, list })
      if (isRefresh) wx.stopPullDownRefresh()
    }).catch(() => {
      this.setData({ loading: false, error: true })
      if (isRefresh) wx.stopPullDownRefresh()
    })
  },

  goSubmit() {
    wx.navigateTo({ url: '/pages/submit/submit?type=add' })
  },

  retry() {
    this.load()
  }
})
