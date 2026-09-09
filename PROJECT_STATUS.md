# Project Status

## 项目名称

天通苑社区信息服务平台（便民服务黄页 · 试点天通苑西二区）

## 当前阶段

MVP 编码完成，数据源已切换为微信云开发（云函数 + 云数据库，无 mock），待部署云函数与真实数据核验

## 当前 Sprint

Sprint 02-07 · 编码（已完成）

## 已完成

- [x] 产品需求分析
- [x] 关键决策确认（公益形态 / 黄页优先 / 微信云开发 / 单组团试点）
- [x] PRD v0.1 编写（docs/PRD.md）
- [x] 试点组团确认：天通苑西二区
- [x] 用户流程图（docs/USER_FLOW.md）
- [x] UI 设计规范与页面原型（docs/UI_DESIGN.md）
- [x] 数据库设计（docs/DATABASE.md）
- [x] 云函数/API 设计（docs/API.md）
- [x] S02 项目初始化：工程骨架、全局设计变量、云开发适配层（云函数不可用时回退演示数据）
- [x] S03 首页常用热线 / 分类宫格 / 推荐服务（早期架构，v0.1.1 已重组）
- [x] S04 分类与搜索列表页、服务详情页（一键拨打）
- [x] S05 提交闭环：收录/纠错表单、意见反馈（v0.1.1 整体下线收录，保留意见反馈）
- [x] S06 个人中心 / 我的提交 / 关于与声明（v0.1.1 个人中心改为「我的」Tab）
- [x] S07 云函数 `api`（查询/拨打/提交/管理审核/初始化）与种子数据结构（待联调，含下线字段待清理）
- [x] JS 语法与全部 JSON 校验通过，无 lint 报错
- [x] v0.1.1 信息架构调整：底部四 Tab（首页 / 公告 / 便民 / 我的）
- [x] v0.1.1 首页精简：搜索 + 常用热线 + 公告速递（移除便民服务宫格与推荐服务区块）
- [x] v0.1.1 新增「公告」Tab 占位页与「便民」Tab 页（分类宫格 + 推荐服务）
- [x] v0.1.1 整体下线「我要收录 / 纠错 / 我的提交」，删除 pages/submit 与 pages/mine
- [x] v0.1.2 首页顶部去掉「我的」快捷入口（由「我的」Tab 承担）
- [x] v0.1.2 视觉统一为黑白灰色调（app.wxss 设计令牌灰阶化，去除绿色/蓝色点缀）
- [x] v0.1.2 底部 Tab 改为自定义组件（custom-tab-bar）：字体放大至 26rpx，绘制纯 CSS 形象图标（首页/公告/便民/我的）
- [x] v0.1.3/v0.1.4 色调改为「雾蓝」：淡蓝页面底 + 低饱和蓝色按钮/图标 + 偏蓝冷墨文本，蓝调明显但依旧柔和
- [x] v0.1.5 公告、便民服务暂不提供服务：两 Tab 改为统一的「敬请期待」空态（含首页公告卡片文案同步）
- [x] v0.2.0 数据源切换为微信云函数：删除 utils/mock 演示数据层与云端回退逻辑，前端只经云函数 api 访问云数据库；云函数种子（seed.js）补齐分类/常用热线/便民服务，`init.bootstrap` 首次自动导入（管理员名单配置前允许执行，避免引导死锁）
- [x] v0.2.1 云函数联调增强：`init.bootstrap` 内置幂等建集合（categories/zones/services/submissions/feedbacks/adminConfig），首次运行无需手动建集合；本地校验种子分类引用/占位号码唯一性通过
- [x] v0.2.2 新增 zones 集合承载服务区域：`categories.list` 的 zones 改从 zones 集合动态读取（运营可配置，空/异常回退内置常量），引导自动写入默认组团「天通苑西二区」
- [x] v0.2.3 云函数 api 按功能拆分：`index.js` 仅保留 action 分发/统一鉴权/异常兜底，业务拆入 `common.js`（云初始化+公共工具）+ `handlers/`（categories/services/submit/feedback/admin/init），行为与 14 个 action 逐一保持不变，全部语法校验通过
- [x] v0.2.4 区域数据全量收口到云数据库：移除 common 内置 `ZONES` 常量与回退，新增 `common.listZones`/`getDefaultZone` 统一查 zones 集合；`categories.list`、`admin.approve`/`admin.batchImport`、`submit.create` 的默认区域均改从 zones 集合查询
- [x] v0.2.5 zones 读取迁移至云托管（callContainer）：新增 `utils/zones.js` 以 `wx.cloud.callContainer` 访问云托管服务 `springboot-5k3p` 的 `GET /api/zones`，`app.js` 启动预热并写入 `globalData.zones`；`utils/config.js` 新增 `cloudEnv`/`containerService`；客户端无须再经云函数 `categories.list` 拿 zones，也无须配置 request 合法域名

## 进行中

- [ ] 开发者工具内预览 v0.1.1（四 Tab 全流程：首页/公告/便民/我的 + 拨打）
- [ ] 设计文档同步 v0.1.1（PRD / USER_FLOW / UI_DESIGN / API 收录相关章节修订）
- [ ] 云开发部署与联调（部署云函数 → init.bootstrap → 真实号码替换核验）

## 待开发

- [ ] 真实数据整理与导入（≥15 官方热线、≥25 便民服务，全部人工核实）
- [ ] TEST_CASES.md 与功能测试
- [ ] 部署与上线准备（类目核验、ICP 备案、隐私/用户协议文案落地）

## 已知问题

- 个人主体小程序类目与「商户名录」边界需在小程序后台核验（高风险项，前置处理）
- 小程序 ICP 备案需同步准备
- 云端种子数据（cloudfunctions/api/seed.js）中的电话号码均为占位示例，严禁带入正式数据
- 设计文档（PRD / USER_FLOW / UI_DESIGN / API）仍含收录/纠错旧章节，待随 v0.1.1 同步修订

## 技术债务

- service.list 采用「拉取后内存分页」，数据量增长后需改为游标/全文检索
- msgSecCheck 偶发失败时当前策略为放行交由人工审核，正式上线前评估是否收紧
- cloudfunctions/api 中 submit.* 处理与 submissions 集合定义前端已不再调用，云开发联调时一并清理

## 下一步

1. 微信开发者工具导入项目（基础库 ≥ 2.2.3，确保 AppID 已开通云开发）
2. 开通云开发并部署 `cloudfunctions/api`（右键「上传并部署：云端安装依赖」）
3. 在云开发控制台/工具内调用 `api` 函数一次 `action=init.bootstrap`，自动导入分类、常用热线与便民服务
4. 在云数据库 `adminConfig/admins.admins` 填入运营者 openid（此后引导与管理接口仅管理员可用）
5. 在云数据库 services/categories 中把占位号码替换为核实后的真实电话后即可联调/上线
