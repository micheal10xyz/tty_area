/**
 * 初始化种子数据（仅分类目录；服务条目请用 admin.batchImport 导入运营核实后的真实数据）
 */
const CATEGORY_SEED = [
  { _id: 'cat_repair', name: '维修安装', glyph: '修', hot: true, sort: 1 },
  { _id: 'cat_clean', name: '家政保洁', glyph: '洁', hot: false, sort: 2 },
  { _id: 'cat_lock', name: '开锁换锁', glyph: '锁', hot: true, sort: 3 },
  { _id: 'cat_move', name: '搬家货运', glyph: '搬', hot: false, sort: 4 },
  { _id: 'cat_drain', name: '管道疏通', glyph: '通', hot: true, sort: 5 },
  { _id: 'cat_recycle', name: '废品回收', glyph: '收', hot: false, sort: 6 },
  { _id: 'cat_express', name: '快递驿站', glyph: '递', hot: false, sort: 7 },
  { _id: 'cat_dryclean', name: '干洗缝补', glyph: '洗', hot: false, sort: 8 },
  { _id: 'cat_key', name: '配钥匙', glyph: '钥', hot: false, sort: 9 },
  { _id: 'cat_pet', name: '宠物服务', glyph: '宠', hot: false, sort: 10 }
]

const ADMIN_CONFIG_SEED = {
  _id: 'admins',
  admins: []
}

module.exports = { CATEGORY_SEED, ADMIN_CONFIG_SEED }
