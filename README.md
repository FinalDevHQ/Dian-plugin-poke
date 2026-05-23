# Dian Plugin - 戳一戳 (Poke)

> 适用版本：Dian `0.1.x` · plugin-runtime `0.2.x`

检测 OneBot 戳一戳事件，支持多规则自定义响应动作。

## 功能

- **事件监听**：群聊 & 私聊戳一戳（戳自己 / 戳别人）
- **响应动作**：
  - `poke_back` — 戳回去
  - `follow` — 跟戳（可指定戳戳人者或被戳者）
  - `command` — 触发其他插件指令
  - `message` — 回复自定义消息
- **规则系统**：多条规则按顺序匹配，每条可独立配置匹配条件、限定群、冷却时间
- **防回环**：自动跳过机器人自己发起的戳事件
- **Web UI**：仪表盘统计 / 规则编辑器 / 触发记录

## 平台支持

| 平台 | 状态 |
|------|------|
| NapCat | 已实现 |
| LLOneBot | 预留 |

## 安装

```bash
# 构建
npm install
npm run build

# 打包
npm run pack
```

将生成的 `poke.zip` 上传到 Dian 管理界面 → 插件模块 → 上传安装。

## 项目结构

```
src/
├── index.ts          ← 插件主入口（拦截器 + API 路由 + UI 注册）
├── config.ts         ← 配置结构定义 & 读写
├── dispatcher.ts     ← 动作分发器
├── platform.ts       ← 平台抽象（NapCat group_poke / friend_poke）
├── cooldown.ts       ← 冷却管理器
├── log-store.ts      ← 事件日志存储
└── version.ts        ← 版本号

ui/
├── App.tsx           ← 侧边栏导航
├── components.tsx    ← 通用组件
└── pages/
    ├── Dashboard.tsx ← 仪表盘（统计 + 实时动态）
    ├── Config.tsx    ← 规则编辑器
    └── Logs.tsx      ← 触发记录
```

## 配置结构

```typescript
interface PokeConfig {
  globalCooldown: number;     // 全局冷却（秒），0 = 不限制
  disabledGroups: string[];   // 禁用群号
  blacklist: string[];        // 用户黑名单（QQ 号）
  rules: PokeRule[];
}

interface PokeRule {
  id: string;
  name: string;
  enabled: boolean;
  matchSelf: boolean;         // 匹配：别人戳机器人
  matchOthers: boolean;       // 匹配：别人戳别人
  groupIds: string[];         // 限定群（空 = 所有群）
  action: "poke_back" | "follow" | "command" | "message";
  followTarget: "poker" | "targeted";  // 跟戳时的目标
  commandText: string;        // 触发指令文本
  messageText: string;        // 回复消息内容
  cooldown: number;           // 独立冷却（秒），0 = 使用全局
}
```

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/status` | 统计 + 配置 + 最近日志 |
| POST | `/api/config` | 保存完整配置 |
| GET | `/api/logs?limit=50` | 历史日志 |
| GET | `/api/groups` | 可用群列表（远程 + 缓存） |

> 所有路由访问地址：`/plugins/poke/api/...`

## Web UI

- **仪表盘** `/plugins/poke/ui/` — 总触发次数、今日触发、规则状态、实时动态
- **规则配置** — 全局冷却/黑名单/禁用群 + 规则增删改（彩色边框标识动作类型）
- **触发记录** — 按条件筛选（全部 / 戳我 / 戳别人），10 秒自动刷新

## 戳事件识别

插件通过 `@Interceptor` 拦截所有事件，根据以下条件识别戳一戳：

```typescript
event.type === "notice"
event.raw.notice_type === "notify"
event.raw.sub_type === "poke"
```

防回环检查：`user_id === self_id` 时跳过（机器人自己戳的）。

## NapCat API

- **群戳一戳**：`sendAction("group_poke", { group_id, user_id })`
- **私聊戳一戳**：`sendAction("friend_poke", { user_id })`

## 跨插件指令触发

通过构造合成 `BotEvent`（`type: "message"`）并调用 `pluginManager.dispatch()` 走完整派发管道，可触发任意插件的指令。

需要 `external: ["@myfinal/plugin-runtime"]` 配置（已包含在 `tsup.config.ts` 中）。
