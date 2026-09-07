const request = require('./request')
const format = require('./format')

/**
 * 一键拨打：二次确认 → 记录拨打数 → 发起电话
 */
function confirmCall(service) {
  if (!service || !service.phone) {
    wx.showToast({ title: '号码缺失', icon: 'none' })
    return
  }
  const content = (service.name || '服务') + '\n' + service.phone
  wx.showModal({
    title: '拨打电话',
    content,
    confirmText: '拨打',
    confirmColor: '#35689C',
    success(res) {
      if (!res.confirm) return
      if (service._id) {
        request.call('call.record', { serviceId: service._id })
      }
      wx.makePhoneCall({
        phoneNumber: format.cleanPhone(service.phone),
        fail() {
          wx.showToast({ title: '拨号失败，可长按号码复制', icon: 'none' })
        }
      })
    }
  })
}

/** 复制号码 */
function copyPhone(phone) {
  if (!phone) return
  wx.setClipboardData({
    data: phone,
    success() {
      wx.showToast({ title: '号码已复制', icon: 'none' })
    }
  })
}

module.exports = { confirmCall, copyPhone }
