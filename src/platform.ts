import type { EventContext } from "@myfinal/plugin-runtime";

export interface BotPokeApi {
  poke(ctx: EventContext, userId: string, groupId?: string): Promise<void>;
}

export class NapCatPokeApi implements BotPokeApi {
  async poke(ctx: EventContext, userId: string, groupId?: string): Promise<void> {
    if (groupId) {
      await ctx.sendAction("group_poke", {
        group_id: Number(groupId),
        user_id: Number(userId),
      });
    } else {
      await ctx.sendAction("friend_poke", {
        user_id: Number(userId),
      });
    }
  }
}

export function createPokeApi(platform: string): BotPokeApi {
  switch (platform) {
    case "napcat":
      return new NapCatPokeApi();
    default:
      return new NapCatPokeApi();
  }
}
