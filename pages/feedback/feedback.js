const request = require('../../utils/request')
const { FEEDBACK_TYPES } = require('../../utils/constants')

Page({
  data: {
    FEEDBACK_TYPES,
    typeIndex: -1,
    content: '',
    contentCount: 0,
    contact: '',
    submitting: false
  },

  onTypeTap(e) {
    this.setData({ typeIndex: Number(e.currentTarget.dataset.index) })
  },

  onContent(e) {
    const v = e.detail.value
    if (v.length > 500) return
    this.setData({ content: v, contentCount: v.length })
  },

  onContact(e) {
    this.setData({ contact: e.detail.value })
  },

  onSubmit() {
    if (this.data.submitting) return
    const { typeIndex, content } = this.data
    if (typeIndex < 0) {
      wx.showToast({ title: '请选择反馈类型', icon: 'none' })
      return
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' })
      return
    }
    if (content.trim().length < 5) {
      wx.showToast({ title: '内容过短，请再补充一些', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    request.call('feedback.create', {
      type: FEEDBACK_TYPES[typeIndex].value,
      content: content.trim(),
      contact: this.data.contact.trim()
    }).then(res => {
      this.setData({ submitting: false })
      if (res.code === 0) {
        wx.showToast({ title: '已收到，谢谢反馈', icon: 'success' })
        setTimeout(() => wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/home/home' }) }), 800)
      } else {
        const map = {
          40101: '登录状态异常，请重试',
          40302: '今日反馈已达上限',
          41001: '内容不合规，请修改后重试'
        }
        wx.showToast({ title: map[res.code] || res.message || '提交失败，请重试', icon: 'none' })
      }
    })
  }
})
