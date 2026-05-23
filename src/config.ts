import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "config.json");

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

export function loadConfig(): PokeConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as PokeConfig };
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveConfig(cfg: PokeConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}
