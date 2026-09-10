/**
 * 全局配置
 *
 * cloudEnv：云开发环境 ID。为空字符串时使用开发者工具当前选中的默认环境；
 *           wx.cloud.callContainer 要求确定的环境，联调/上线请填写实际 envId（如 cloud1-xxxx）。
 *
 * containerService：微信云托管服务名。调用方通过 wx.cloud.callContainer + header X-WX-SERVICE
 *                   定位容器；从「微信开发者工具 → 云开发 → 云托管 → 服务列表」复制服务名。
 *                   callContainer 走云开发通道，不需要在小程序后台配置 request 合法域名。
 *                   前提：该云托管服务已允许被调用（服务设置里开启对应访问方式）。
 */
module.exports = {
  cloudEnv: 'prod-d1gsbov0466b53891',
  zone: '天通苑西二区',
  pageSize: 20,
  version: '0.2.0',
  containerService: 'springboot-5k3p-004'
}