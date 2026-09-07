/**
 * 云数据库初始化种子数据
 * 说明：seed 中的分类会以固定 docId 写入（如 cat_repair），服务/热线由 init.bootstrap 自动导入。
 * ！！！占位号码（010-000xxxxxx / 010-0000xxxx）仅供联调演示，
 *     正式运营前请在云数据库 services 集合中替换为核实后的真实号码 ！！！
 */
const ZONE = '天通苑西二区'

/* ---------- 分类目录（docId 固定） ---------- */
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

/* ---------- 常用热线（占位号码，运营前必须核实替换） ---------- */
// { name, glyph, phone, desc, hours }
const HOTLINE_SEED = [
  { name: '西二区物业服务中心', glyph: '物', phone: '010-00000001', desc: '物业客服、报修与咨询', hours: '8:30-17:30' },
  { name: '西二区社区居委会', glyph: '居', phone: '010-00000002', desc: '社区事务、证明与活动', hours: '工作日 9:00-17:00' },
  { name: '属地派出所值班电话', glyph: '警', phone: '010-00000003', desc: '报警求助（非紧急）', hours: '24小时' },
  { name: '社区卫生服务中心', glyph: '卫', phone: '010-00000004', desc: '诊疗、疫苗、家医签约', hours: '8:00-17:30' },
  { name: '供电报修服务', glyph: '电', phone: '010-00000005', desc: '停电报修与用电咨询', hours: '24小时' },
  { name: '燃气客户服务', glyph: '气', phone: '010-00000006', desc: '燃气报修、开户与安检', hours: '9:00-17:00' },
  { name: '供热服务热线', glyph: '暖', phone: '010-00000007', desc: '供暖季报修与咨询', hours: '供暖季 24小时' },
  { name: '水务集团客服', glyph: '水', phone: '010-00000008', desc: '自来水报修与缴费咨询', hours: '9:00-17:00' },
  { name: '街道便民服务中心', glyph: '街', phone: '010-00000009', desc: '社保、民政等窗口业务', hours: '工作日 9:00-17:00' },
  { name: '开锁备案服务窗口', glyph: '备', phone: '010-00000010', desc: '急开锁请先确认备案资质', hours: '9:00-17:00' }
]

/* ---------- 便民服务条目（占位号码，运营前必须核实替换） ---------- */
// { categoryKey, name, desc, hours, hot, address, stale }  stale=true 表示超过 180 天待复核，用于演示“待复核”标签
const SERVICE_SEED = [
  { categoryKey: 'cat_repair', name: '老张家电维修', desc: '空调/冰箱/洗衣机上门维修，先报价后维修', hours: '8:00-21:00', hot: true, address: '西二区3号院底商', stale: true },
  { categoryKey: 'cat_repair', name: '小李水电快修', desc: '水管电路改造、灯具开关维修更换', hours: '7:00-22:00', hot: false, address: '西二区5号院' },
  { categoryKey: 'cat_clean', name: '洁家保洁', desc: '日常保洁、开荒保洁，按次计费', hours: '8:30-18:00', hot: false, address: '西二区商业街' },
  { categoryKey: 'cat_clean', name: '安心家政（钟点工）', desc: '钟点工、月嫂、育儿嫂，持证上岗', hours: '9:00-18:00', hot: false, address: '西二区2号院' },
  { categoryKey: 'cat_lock', name: '顺达开锁换锁', desc: '防盗门/汽车开锁，公安备案，换超B级锁芯', hours: '24小时', hot: true, address: '西二区4号院', stale: true },
  { categoryKey: 'cat_move', name: '快捷搬家公司', desc: '居民搬家、家具拆装，明码标价', hours: '7:00-20:00', hot: false, address: '西二区东侧停车场' },
  { categoryKey: 'cat_move', name: '小货车搬家拉货', desc: '同城小件搬运、送家具家电', hours: '6:00-21:00', hot: false, address: '西二区1号院' },
  { categoryKey: 'cat_drain', name: '老刘疏通下水道', desc: '马桶/地漏/主管道疏通，高压清洗', hours: '24小时', hot: true, address: '西二区6号院', stale: true },
  { categoryKey: 'cat_drain', name: '高压疏通清洗', desc: '厨房管道油污清洗、化粪池清理', hours: '7:00-19:00', hot: false, address: '西二区商业街' },
  { categoryKey: 'cat_recycle', name: '上门废品回收', desc: '纸箱/旧书/塑料/金属，按斤回收', hours: '8:00-20:00', hot: false, address: '上门（西二区）' },
  { categoryKey: 'cat_recycle', name: '高价回收旧家电', desc: '旧空调冰箱洗衣机回收，置换抵扣', hours: '9:00-19:00', hot: false, address: '西二区3号院' },
  { categoryKey: 'cat_express', name: '西二区快递驿站', desc: '代收代寄快递、包裹暂存', hours: '9:00-20:30', hot: false, address: '西二区7号院底商' },
  { categoryKey: 'cat_express', name: '同城寄件服务点', desc: '同城当日达寄件、大件打包', hours: '8:30-19:00', hot: false, address: '西二区商业街' },
  { categoryKey: 'cat_dryclean', name: '小区干洗店', desc: '衣物干洗、皮具护理、洗鞋', hours: '9:00-20:00', hot: false, address: '西二区2号院' },
  { categoryKey: 'cat_dryclean', name: '洗衣缝补改衣', desc: '改裤脚、换拉链、织补破洞', hours: '9:00-19:00', hot: false, address: '西二区1号院' },
  { categoryKey: 'cat_key', name: '配钥匙磨钥匙', desc: '小区门禁钥匙、普通钥匙配换', hours: '8:30-20:00', hot: false, address: '西二区4号院' },
  { categoryKey: 'cat_key', name: '电子门禁卡配制', desc: '门禁卡复制、电梯卡升级', hours: '9:00-18:00', hot: false, address: '西二区商业街' },
  { categoryKey: 'cat_pet', name: '阳光宠物店', desc: '宠物洗澡美容、零食用品', hours: '9:00-20:00', hot: false, address: '西二区3号院' },
  { categoryKey: 'cat_pet', name: '宠物寄养代遛', desc: '家庭式寄养，节假日需提前预约', hours: '8:00-21:00', hot: false, address: '西二区6号院' }
]

const ADMIN_CONFIG_SEED = {
  _id: 'admins',
  admins: []
}

module.exports = { ZONE, CATEGORY_SEED, HOTLINE_SEED, SERVICE_SEED, ADMIN_CONFIG_SEED }
