import { pluginManager, type EventContext } from "@myfinal/plugin-runtime";
import type { BotEvent } from "@myfinal/shared";
import type { PokeRule } from "./config.js";
import { type BotPokeApi, createPokeApi } from "./platform.js";
import type { LogStore, PokeLogEntry } from "./log-store.js";

export interface PokeInfo {
  pokerId: string;
  targetId: string;
  groupId?: string;
  isSelfPoke: boolean;
  botId: string;
}

export class ActionDispatcher {
  private api: BotPokeApi;
  private logStore: LogStore;

  constructor(logStore: LogStore) {
    this.api = createPokeApi("napcat");
    this.logStore = logStore;
  }

  setPlatform(platform: string): void {
    this.api = createPokeApi(platform);
  }

  async execute(rule: PokeRule, ctx: EventContext, info: PokeInfo): Promise<void> {
    const logBase = {
      time: Date.now(),
      botId: info.botId,
      pokerId: info.pokerId,
      targetId: info.targetId,
      groupId: info.groupId,
      isSelfPoke: info.isSelfPoke,
      ruleId: rule.id,
      ruleName: rule.name,
    };

    switch (rule.action) {
      case "poke_back":
        await this.api.poke(ctx, info.pokerId, info.groupId);
        this.logStore.add({ ...logBase, action: "poke_back" });
        break;

      case "follow": {
        const target = rule.followTarget === "poker" ? info.pokerId : info.targetId;
        if (target) {
          await this.api.poke(ctx, target, info.groupId);
        }
        this.logStore.add({ ...logBase, action: `follow_${rule.followTarget}` });
        break;
      }

      case "command":
        if (rule.commandText) {
          await this.triggerCommand(ctx, rule.commandText);
        }
        this.logStore.add({ ...logBase, action: `command:${rule.commandText}` });
        break;

      case "message":
        if (rule.messageText) {
          await ctx.reply(rule.messageText);
        }
        this.logStore.add({ ...logBase, action: "message" });
        break;
    }
  }

  private async triggerCommand(ctx: EventContext, commandText: string): Promise<void> {
    const fakeEvent: BotEvent = {
      eventId: `poke:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      botId: ctx.event.botId,
      platform: "onebot",
      type: "message",
      subtype: ctx.event.payload.groupId ? "message.group" : "message.private",
      timestamp: Math.floor(Date.now() / 1000),
      payload: {
        text: commandText,
        userId: ctx.event.payload.userId,
        groupId: ctx.event.payload.groupId,
        senderName: ctx.event.payload.senderName,
      },
      raw: {},
    };
    await pluginManager.dispatch(fakeEvent, ctx.reply, ctx.sendAction, ctx.store);
  }
}
