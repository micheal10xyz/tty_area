# API：天通苑社区信息服务平台（便民黄页）

| 项目 | 内容 |
| -- | -- |
| 版本 | v0.1（MVP） |
| 载体 | 微信云开发 · 云函数 |
| 试点组团 | 天通苑西二区 |
| 关联文档 | docs/PRD.md、docs/DATABASE.md |

---

## 1. 调用规范

### 1.1 形态

- 采用**单一云函数 `api`**（按 `action` 分发），降低冷启动与配置成本；`admin` 审核逻辑并入 `api` 的 `admin.*` action，以 `adminConfig` 白名单鉴权。
- 客户端统一经 `wx.cloud.callFunction({ name:'api', data:{ action, ... } })`。
- 身份：云函数内取 `cloud.getWXContext().OPENID`，**不传 openid**，防止伪造。

### 1.2 统一响应

```json
{ "code": 0, "message": "ok", "data": {} }
```

### 1.3 错误码

| code | message | 含义 |
| -- | -- | -- |
| 0 | ok | 成功 |
| 40001 | 参数错误 | 缺参/格式非法/超长 |
| 40101 | 未授权 | 登录态缺失（openid 为空） |
| 40301 | 无权限 | 非运营白名单 |
| 40302 | 操作过于频繁 | 频率超限 |
| 40401 | 内容不存在或已下线 | 详情/目标条目不可见 |
| 41001 | 内容不合规 | 命中内容安全检测 |
| 50000 | 系统异常 | 兜底 |

## 2. 接口清单

| action | 登录 | 说明 |
| -- | -- | -- |
| categories.list | 否 | 分类 + 常用热线分组 + 组团配置 |
| service.list | 否 | 分类/搜索/全部 分页列表 |
| service.detail | 否 | 单条详情 |
| call.record | 否 | 拨打计数 +1 |
| submit.create | 是 | 收录/纠错提交 |
| submit.mine | 是 | 我的提交记录 |
| feedback.create | 是 | 意见反馈 |
| admin.pendingList | 是(admin) | 待审核列表 |
| admin.approve | 是(admin) | 通过（add→发布 / correct→修正） |
| admin.reject | 是(admin) | 驳回并备注 |
| admin.offline | 是(admin) | 下线条目 |
| admin.fix | 是(admin) | 直接编辑条目信息 |

## 3. 接口详述

### 3.1 categories.list（无需登录）

请求：`{ action:'categories.list' }`

数据：

```json
{
  "hotlines": ["物业", "居委会", "派出所", "供热", "供电", "燃气", "水务", "社区医院"],
  "categories": [
    { "_id": "cat_plumber", "name": "维修安装", "icon": "repair", "sort": 1 }
  ],
  "zones": ["天通苑西二区"]
}
```

异常：50000。

### 3.2 service.list（无需登录）

请求：`{ action:'service.list', type:'all'|'category'|'search'|'hotline', categoryId?, keyword?, zone?, page:1, pageSize:20 }`

- 默认仅返回 `auditStatus=published && isDeleted=false`。
- 排序：`sort` 升序 → `updateAt` 降序；热线条目另按内置顺序。
- 分页：`page/pageSize`，返回 `hasMore`。

数据：

```json
{
  "list": [ { "_id":"s1", "name":"xx开锁", "type":"service", "categoryId":"cat_lock",
              "zone":"天通苑西二区", "phone":"010-xxxx", "address":"", "hours":"24小时",
              "desc":"", "tags":[], "callCount":12, "reviewedAt":"2026-09-01",
              "stale": false } ],
  "page": 1, "hasMore": false
}
```

> `stale` 由服务端按 `reviewedAt > 180 天` 计算返回，前端显示「待复核」。

### 3.3 service.detail（无需登录）

请求：`{ action:'service.detail', id:'s1' }`

- 命中非 published 或已删除 → 40401。

### 3.4 call.record（无需登录）

请求：`{ action:'call.record', serviceId:'s1' }`

- 对 `callCount` 原子 `_.inc(1)`；服务端校验条目存在且 published。
- 失败（条目不存在）→ 40401。无身份要求，控制台可加日频控。

### 3.5 submit.create（需登录）

请求：

```json
{
  "action": "submit.create",
  "type": "add",
  "payload": {
    "name": "张记开锁", "categoryId": "cat_lock", "phone": "138...",
    "zone": "天通苑西二区", "address": "", "hours": "", "desc": ""
  }
}
```

纠错：`type:'correct'`，携带 `targetServiceId`、`issueType`（phone_down/addr_wrong/not_exist/no_consent/other）与 payload（可部分）。

处理：
1. openid 为空 → 40101。
2. 校验字段：名称/电话必填、电话格式、desc ≤200、payload ≤500 字符 → 40001。
3. 频率：当日提交（含 add+correct）> 5 → 40302。
4. 文本内容安全 `security.msgSecCheck`（合并 name+desc+备注）→ 命中 41001。
5. 写入 submissions（pending），返回 `submitId`。

数据：`{ "submitId": "sub_xxx", "auditStatus": "pending" }`

### 3.6 submit.mine（需登录）

请求：`{ action:'submit.mine' }`

- 返回本人 submissions 倒序（≤50），并 join 目标条目当前状态（如已上线/已下线）。

数据：

```json
{
  "list": [ { "_id":"sub_1", "type":"add", "auditStatus":"done", "note":"已上线",
              "payload": { "name":"张记开锁" }, "createAt":"..." } ]
}
```

### 3.7 feedback.create（需登录）

请求：`{ action:'feedback.create', type:'bug'|'suggestion'|'other', content, contact? }`

- 内容 ≤500 字、当日 ≤3 次、过内容安全，写 feedbacks(open)。

### 3.8 admin.*（需 admin 白名单）

| action | 请求 | 行为 |
| -- | -- | -- |
| admin.pendingList | {} | pending 的 submissions 列表 |
| admin.approve | { id, note? } | type=add：创建 services(published, source=user, submitId)；type=correct：按 issueType 修正或下线目标条目；submission→done |
| admin.reject | { id, note } | submission→rejected，记录原因 |
| admin.offline | { id, reason } | services→offline |
| admin.fix | { id, patch } | 直接修改条目字段并刷新 reviewedAt |

- 非白名单 openid → 40301。操作前校验目标存在。
- 运营收录新条目也可直接控制台写 services(published, source=admin)。

## 4. 安全要求

- 内容安全：submit.create、feedback.create 提交文本必须过 msgSecCheck；命中即 41001 且不落库。
- 参数校验与长度限制服务端必须做第二道（前端仅提示）。
- 敏感信息：服务端日志不打印完整电话号码；控制台管理需微信身份校验。
- 客户端不直连写集合；数据库安全规则按 DATABASE.md §5 配置。

## 5. 客户端调用约定（示例，非实现）

```js
const res = await wx.cloud.callFunction({
  name: 'api',
  data: { action: 'service.list', type: 'category', categoryId, page }
})
if (res.result.code !== 0) { /* 按错误码提示 */ }
```

- 错误码→用户提示映射：40001/40401 通用提示；40302「今日提交已达上限」；41001「内容不合规，请修改后重试」；40101「登录状态异常，请重试」。

---

## 6. 云托管 HTTP 接口（zones 等只读数据）

`api` 云函数仍承担所有动作型接口（提交、审核、初始化、拨打计数等）；只读且变更不频繁的资源（如服务区域 `zones`）逐步迁移到「微信云开发 · 云托管」容器，**由前端通过 `wx.cloud.callContainer` 调用**，不再经云函数。

### 6.1 GET /api/zones（无需登录）

- **用途**：获取服务区域列表。替代 `categories.list` 响应里附带的 `zones` 字段。
- **宿主**：云托管服务 `springboot-5k3p`，由其内部读取云数据库 zones 集合（或自有数据库）。
- **客户端配置**（`utils/config.js`）：

  | 项 | 值 |
  | -- | -- |
  | `cloudEnv` | 云开发环境 ID（`wx.cloud.callContainer` 需要确定的环境，建议填写实际 envId） |
  | `containerService` | 云托管服务名：`springboot-5k3p` |

  callContainer 走云开发通道，**无需**在小程序后台配置 request 合法域名；前提是目标云托管服务已允许被调用（云托管 → 服务设置 → 访问方式）。请求由云开发自动注入 `X-WX-OPENID` 等上下文头。

- **请求**：`GET /api/zones`（path），经 `wx.cloud.callContainer` 访问云托管服务 `{containerService}`，无 query、无 body。
- **响应**（统一信封，与 `api` 云函数一致）：

  ```json
  { "code": 0, "message": "ok", "data": ["天通苑西二区", "西二区东院"] }
  ```

  或直接数组形式（兼容）：

  ```json
  ["天通苑西二区"]
  ```

- **异常**：`{ code: 50000, message: "服务繁忙" }`；容器调用失败（多因 `cloudEnv`/`containerService` 配置不符、或服务未开放被调用）→ 「请核对 config.cloudEnv 与 containerService，并确认云托管服务已允许被调用」。

### 6.2 客户端调用

启动时 `app.js#onLaunch` 已调用 `zones.fetchZones()` 预热，结果缓存到 `globalData.zones`。任意页面直接：

```js
const zones = require('../../utils/zones')
// 同步读取已缓存
const list = zones.getCachedZones()
// 主动拉取（覆盖缓存）
zones.fetchZones().then(res => {
  if (res.code === 0) console.log(res.data)
})
```

### 6.3 与云函数的关系

- `categories.list` 响应里的 `zones` 字段将逐步停用，迁移完成后从接口响应中移除。
- 写入操作（admin 新增组团、批量导入）仍走云函数 `admin.*` 动作，避免在前端直接操作数据库。
