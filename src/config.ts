export interface PokeRule {
  id: string;
  name: string;
  enabled: boolean;
  matchSelf: boolean;
  matchOthers: boolean;
  groupIds: string[];
  action: "poke_back" | "follow" | "command" | "message";
  followTarget: "poker" | "targeted";
  commandText: string;
  messageText: string;
  cooldown: number;
}

export interface PokeConfig {
  globalCooldown: number;
  rules: PokeRule[];
  disabledGroups: string[];
  blacklist: string[];
}

export const DEFAULTS: PokeConfig = {
  globalCooldown: 5,
  rules: [],
  disabledGroups: [],
  blacklist: [],
};
