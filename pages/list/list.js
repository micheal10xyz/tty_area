const request = require('../../utils/request')
const phone = require('../../utils/phone')
const CONFIG = require('../../utils/config')

Page({
  data: {
    mode: '',
    listType: 'all',       // all / category / search / hotline
    title: '便民服务',
    categoryId: '',
    showSearch: false,
    hotlineMode: false,
    keyword: '',
    inputVal: '',
    categories: [],
    list: [],
    page: 1,
    hasMore: false,
    loading: true,
    loadMore: false,
    error: false,
    needInput: false
  },

  onLoad(options) {
    const listType = options.type || 'all'
    const keyword = decodeURIComponent(options.keyword || '')
    const title = options.title ? decodeURIComponent(options.title) : ''
    const state = {
      listType,
      keyword,
      inputVal: keyword,
      categoryId: options.categoryId || '',
      showSearch: listType === 'search',
      hotlineMode: listType === 'hotline',
      loading: true
    }
    if (listType === 'all') state.title = title || '便民服务'
    if (listType === 'hotline') state.title = title || '常用热线'
    if (listType === 'search') state.title = title || '搜索'
    this.setData(state)
    this.categoriesLoaded = false
    this.load()
  },

  load() {
    this.fetchCategories()
    this.reload()
  },

  fetchCategories() {
    if (this.categoriesLoaded) return
    request.call('categories.list', {}).then(res => {
      this.categoriesLoaded = true
      if (res.code === 0) {
        this.setData({ categories: res.data.categories || [] })
      }
    })
  },

  reload() {
    this.loadList(1, true)
  },

  loadList(page, replace) {
    const { listType, keyword } = this.data
    if (listType === 'search' && !keyword) {
      this.setData({ loading: false, needInput: true, list: [] })
      return
    }
    const payload = {
      type: listType,
      page,
      pageSize: CONFIG.pageSize,
      categoryId: this.data.categoryId,
      keyword
    }
    this.setData(replace ? { loading: true, needInput: false, error: false } : { loadMore: true })
    request.call('service.list', payload).then(res => {
      if (res.code !== 0) {
        this.setData({ loading: false, loadMore: false, error: true })
        return
      }
      const data = res.data
      const list = replace ? data.list : this.data.list.concat(data.list)
      this.setData({
        loading: false,
        loadMore: false,
        mode: request.getMode(),
        list,
        page,
        hasMore: data.hasMore,
        needInput: false
      })
    }).catch(() => {
      this.setData({ loading: false, loadMore: false, error: true })
    })
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loadMore || this.data.loading) return
    this.loadList(this.data.page + 1, false)
  },

  onPullDownRefresh() {
    this.reload()
    setTimeout(() => wx.stopPullDownRefresh(), 400)
  },

  /* ---------- 交互 ---------- */
  onKeywordInput(e) {
    this.setData({ inputVal: e.detail.value })
  },

  onSearch() {
    this.setData({ keyword: this.data.inputVal.trim() })
    this.setData({ keyword: this.data.inputVal.trim(), loading: true })
    this.reload()
  },

  clearKeyword() {
    this.setData({ inputVal: '', keyword: '' })
    this.setData({ loading: false, needInput: true, list: [] })
  },

  pickCategory(e) {
    const { id, name } = e.currentTarget.dataset
    this.setData({ categoryId: id, title: name || '便民服务' })
    this.reload()
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  goSubmit() {
    wx.navigateTo({ url: '/pages/submit/submit?type=add' })
  },

  retry() {
    this.reload()
  },

  dial(e) {
    const { id, name, phone: p } = e.currentTarget.dataset
    phone.confirmCall({ _id: id, name, phone: p })
  }
})
