/** 纠错问题类型 */
const ISSUE_TYPES = [
  { value: 'phone_down', label: '电话失效或打不通' },
  { value: 'info_wrong', label: '信息有误 / 已过时' },
  { value: 'not_exist', label: '服务已不存在' },
  { value: 'no_consent', label: '商户不愿展示' },
  { value: 'other', label: '其他问题' }
]

/** 意见反馈类型 */
const FEEDBACK_TYPES = [
  { value: 'bug', label: '功能问题' },
  { value: 'suggestion', label: '功能建议' },
  { value: 'other', label: '其他' }
]

/** 提交状态映射 */
const SUB_STATUS = {
  pending: '待审核',
  done: '已处理',
  rejected: '已驳回'
}

function issueLabel(value) {
  const found = ISSUE_TYPES.find(i => i.value === value)
  return found ? found.label : ''
}

function subTypeLabel(type) {
  return type === 'correct' ? '纠错' : '收录'
}

function subStatusLabel(status) {
  return SUB_STATUS[status] || status || ''
}

module.exports = {
  ISSUE_TYPES,
  FEEDBACK_TYPES,
  SUB_STATUS,
  issueLabel,
  subTypeLabel,
  subStatusLabel
}
