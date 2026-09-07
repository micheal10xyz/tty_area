Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: 'home' },
      { pagePath: '/pages/notice/notice', text: '公告', icon: 'notice' },
      { pagePath: '/pages/services/services', text: '便民', icon: 'services' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'mine' }
    ]
  },

  methods: {
    onTab(e) {
      const index = Number(e.currentTarget.dataset.index)
      if (index === this.data.selected) return
      const item = this.data.list[index]
      if (!item) return
      wx.switchTab({ url: item.pagePath })
    }
  }
})
