const request = require('../../utils/request')
const format = require('../../utils/format')
const CONFIG = require('../../utils/config')
const { ISSUE_TYPES } = require('../../utils/constants')

Page({
  data: {
    formType: 'add',
    serviceId: '',
    issueIndex: -1,
    categories: [],
    categoryIndex: -1,
    zones: [CONFIG.zone],
    zoneIndex: 0,
    name: '',
    phone: '',
    address: '',
    hours: '',
    desc: '',
    descCount: 0,
    submitting: false,
    ISSUE_TYPES
  },

  onLoad(options) {
    const isCorrect = options.type === 'correct'
    const patch = {
      formType: isCorrect ? 'correct' : 'add',
      serviceId: options.serviceId || ''
    }
    if (options.name) patch.name = decodeURIComponent(options.name)
    this.setData(patch)
    this.fetchMeta()
  },

  fetchMeta() {
    request.call('categories.list', {}).then(res => {
      if (res.code !== 0) return
      const zones = res.data.zones && res.data.zones.length ? res.data.zones : this.data.zones
      this.setData({ categories: res.data.categories || [], zones })
    })
  },

  onName(e) { this.setData({ name: e.detail.value }) },
  onPhone(e) { this.setData({ phone: e.detail.value }) },
  onAddress(e) { this.setData({ address: e.detail.value }) },
  onHours(e) { this.setData({ hours: e.detail.value }) },
  onDesc(e) {
    const v = e.detail.value
    if (v.length > 200) return
    this.setData({ desc: v, descCount: v.length })
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) })
  },

  onZoneChange(e) {
    this.setData({ zoneIndex: Number(e.detail.value) })
  },

  onIssueTap(e) {
    this.setData({ issueIndex: Number(e.currentTarget.dataset.index) })
  },

  validate() {
    const d = this.data
    if (!d.name.trim()) return '请填写名称'
    if (d.formType === 'add' && d.categoryIndex < 0) return '请选择分类'
    if (!format.isPhoneValid(d.phone)) return '请填写正确的电话'
    if (d.formType === 'correct' && d.issueIndex < 0) return '请选择纠错原因'
    return ''
  },

  onSubmit() {
    if (this.data.submitting) return
    const err = this.validate()
    if (err) {
      wx.showToast({ title: err, icon: 'none' })
      return
    }
    const d = this.data
    const payload = {
      name: d.name.trim(),
      categoryId: d.categoryIndex >= 0 ? d.categories[d.categoryIndex]._id : '',
      zone: d.zones[d.zoneIndex] || CONFIG.zone,
      phone: d.phone.trim(),
      address: d.address.trim(),
      hours: d.hours.trim(),
      desc: d.desc.trim()
    }
    const data = {
      type: d.formType,
      payload
    }
    if (d.formType === 'correct') {
      data.targetServiceId = d.serviceId
      data.issueType = ISSUE_TYPES[d.issueIndex].value
    }
    this.setData({ submitting: true })
    request.call('submit.create', data).then(res => {
      this.setData({ submitting: false })
      if (res.code === 0) {
        wx.showToast({ title: '已收到，感谢反馈', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/mine/mine' })
        }, 800)
      } else {
        const map = {
          40101: '登录状态异常，请重试',
          40302: '今日提交已达上限',
          41001: '内容不合规，请修改后重试'
        }
        wx.showToast({ title: map[res.code] || res.message || '提交失败，请重试', icon: 'none' })
      }
    })
  }
})
