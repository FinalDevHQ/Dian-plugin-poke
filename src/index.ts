import "reflect-metadata";
import {
  Plugin,
  Interceptor,
  type EventContext,
  type PluginSetupContext,
} from "@myfinal/plugin-runtime";
import type { ActionResult } from "@myfinal/shared";
import { PKG_VERSION } from "./version.js";
import { type PokeConfig, type PokeRule, loadConfig, saveConfig } from "./config.js";
import { ActionDispatcher, type PokeInfo } from "./dispatcher.js";
import { CooldownManager } from "./cooldown.js";
import { LogStore, type PokeLogEntry } from "./log-store.js";

const PLUGIN_NAME = "poke";
const API_PREFIX = `/plugins/${PLUGIN_NAME}/api`;

@Plugin({
  name: PLUGIN_NAME,
  description: "戳一戳插件 — 检测戳事件并执行自定义动作",
  version: PKG_VERSION,
  author: "your-name",
  icon: "👉",
})
export default class PokePlugin {
  private readonly startTime = Date.now();

  private config: PokeConfig = loadConfig();
  private cooldown = new CooldownManager();
  private logStore = new LogStore();
  private dispatcher = new ActionDispatcher(this.logStore);
  private knownGroups = new Set<string>();
  private botSendActions = new Map<string, (action: string, params?: Record<string, unknown>) => Promise<ActionResult>>();

  @Interceptor(10)
  async pokeInterceptor(ctx: EventContext): Promise<void> {
    // 缓存该 bot 的 sendAction，用于后续 API 调用（如 get_group_list）
    if (!this.botSendActions.has(ctx.event.botId)) {
      this.botSendActions.set(ctx.event.botId, ctx.sendAction);
    }

    // 收集群ID
    if (ctx.event.payload.groupId) {
      this.knownGroups.add(ctx.event.payload.groupId);
    }

    const event = ctx.event;
    if (event.type !== "notice") return;

    const raw = event.raw as Record<string, unknown>;
    if (raw.notice_type !== "notify" || raw.sub_type !== "poke") return;

    const selfId = String(raw.self_id ?? "");
    const pokerId = String(raw.user_id ?? "");
    const targetId = String(raw.target_id ?? "");
    const groupId = event.payload.groupId;
    const isSelfPoke = targetId === selfId;
    const botId = ctx.event.botId;

    if (!pokerId) return;
    if (pokerId === selfId) return; // 跳过机器人自己戳的，防回环
    if (this.config.blacklist.includes(pokerId)) return;
    if (groupId && this.config.disabledGroups.includes(groupId)) return;

    const info: PokeInfo = { pokerId, targetId, groupId, isSelfPoke, botId };

    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;
      if (rule.matchSelf && !isSelfPoke) continue;
      if (rule.matchOthers && isSelfPoke) continue;
      if (rule.groupIds.length > 0 && !groupId) continue;
      if (rule.groupIds.length > 0 && groupId && !rule.groupIds.includes(groupId)) continue;

      const cd = rule.cooldown > 0 ? rule.cooldown : this.config.globalCooldown;
      if (this.cooldown.isOnCooldown(pokerId, rule.id)) continue;

      try {
        await this.dispatcher.execute(rule, ctx, info);
      } catch (e) {
        console.error(`[poke] execute rule ${rule.id} failed:`, e);
      }

      this.cooldown.set(pokerId, rule.id, cd);
    }
  }

  onSetup(ctx: PluginSetupContext): void {
    ctx.route("GET", "/status", (_req, reply) => {
      const now = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      reply.send({
        startTime: this.startTime,
        totalCount: this.logStore.countSince(0),
        todayCount: this.logStore.countSince(todayStart),
        config: this.config,
        recentLogs: this.logStore.recent(10),
        rulesCount: this.config.rules.length,
        enabledRulesCount: this.config.rules.filter((r) => r.enabled).length,
      });
    });

    ctx.route("POST", "/config", (req, reply) => {
      const body = req.body as Partial<PokeConfig>;
      if (body.globalCooldown !== undefined && body.globalCooldown >= 0) {
        this.config.globalCooldown = body.globalCooldown;
      }
      if (Array.isArray(body.disabledGroups)) {
        this.config.disabledGroups = body.disabledGroups;
      }
      if (Array.isArray(body.blacklist)) {
        this.config.blacklist = body.blacklist;
      }
      if (Array.isArray(body.rules)) {
        this.config.rules = body.rules as PokeRule[];
      }
      saveConfig(this.config);
      this.cooldown.clear();
      reply.send({ ok: true, config: this.config });
    });

    ctx.route("GET", "/logs", (_req, reply) => {
      const limit = Number((_req.query as Record<string, string>)?.limit) || 50;
      reply.send({ logs: this.logStore.recent(limit) });
    });

    ctx.route("GET", "/groups", async (_req, reply) => {
      const groups = Array.from(this.knownGroups).sort();
      if (this.botSendActions.size > 0) {
        const sendAction = this.botSendActions.values().next().value;
        const result = await sendAction("get_group_list", {});
        if (result.ok && Array.isArray(result.data)) {
          const remoteGroups = (result.data as Array<{ group_id: number }>)
            .map((g) => String(g.group_id))
            .filter((id) => !groups.includes(id));
          for (const id of remoteGroups) {
            this.knownGroups.add(id);
            groups.push(id);
          }
          groups.sort();
        }
      }
      reply.send({ groups });
    });

    ctx.command({
      name: "poke",
      segment: "poke",
      aliases: ["戳一戳", "戳", "poke", "戳我"],
      description: "戳一戳插件",
      category: "趣味",
      order: 50,
      children: [
        {
          name: "状态",
          segment: "status",
          aliases: ["status", "运行状态", "stats"],
          pattern: /戳一戳状态|poke status/i,
          description: "查看戳一戳插件运行状态",
          usage: "戳一戳状态",
          examples: ["戳一戳状态"],
          order: 10,
          handler: async (c: EventContext) => {
            const now = Date.now();
            const todayStart = new Date().setHours(0, 0, 0, 0);
            await c.reply(
              `👉 戳一戳状态\n` +
              `触发总数：${this.logStore.countSince(0)}\n` +
              `今日触发：${this.logStore.countSince(todayStart)}\n` +
              `规则数量：${this.config.rules.length}（${this.config.rules.filter((r) => r.enabled).length} 启用）`
            );
          },
        },
      ],
    });

    ctx.ui({ staticDir: "./public", entry: "index.html" });
  }
}
