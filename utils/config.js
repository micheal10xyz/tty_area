/**
 * 全局配置
 * cloudEnv 为空字符串时使用开发者工具默认环境；联调时若需指定环境请填写 envId
 */
module.exports = {
  cloudEnv: '',
  // 云函数不可用（未开通/未部署）时是否回退演示数据，便于联调前预览 UI；正式联调可置 false
  allowMock: true,
  zone: '天通苑西二区',
  pageSize: 20,
  version: '0.1.0'
}
