const request = require('../../utils/request')
const phone = require('../../utils/phone')
const format = require('../../utils/format')

Page({
  data: {
    loading: true,
    notFound: false,
    error: false,
    service: null,
    reviewedText: ''
  },

  onLoad(options) {
    this.id = options.id || ''
    this.load()
  },

  load() {
    if (!this.id) {
      this.setData({ loading: false, notFound: true })
      return
    }
    this.setData({ loading: true, error: false, notFound: false })
    request.call('service.detail', { id: this.id }).then(res => {
      if (res.code === 0) {
        const service = res.data.service
        this.setData({
          loading: false,
          service,
          reviewedText: service.reviewedAt ? format.formatDate(service.reviewedAt) : ''
        })
      } else if (res.code === 40401) {
        this.setData({ loading: false, notFound: true })
      } else {
        this.setData({ loading: false, error: true })
      }
    }).catch(() => {
      this.setData({ loading: false, error: true })
    })
  },

  retry() {
    this.load()
  },

  dial() {
    const service = this.data.service
    if (service) phone.confirmCall(service)
  },

  copyPhone() {
    const service = this.data.service
    if (service) phone.copyPhone(service.phone)
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },

  onShareAppMessage() {
    const s = this.data.service
    return {
      title: (s ? s.name : '小区事先知服务') + ' - 小区事先知',
      path: '/pages/detail/detail?id=' + this.id
    }
  }
})
