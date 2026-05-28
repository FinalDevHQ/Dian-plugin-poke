import type { PluginStore } from "@myfinal/plugin-runtime";
import { DEFAULTS, type PokeConfig } from "./config.js";
import type { PokeLogEntry } from "./log-store.js";

const TABLE_CONFIG = "poke_config";
const TABLE_LOGS = "poke_logs";

const CONFIG_COLUMNS = [
  "key TEXT NOT NULL UNIQUE",
  "value TEXT NOT NULL",
];

const LOG_COLUMNS = [
  "time INTEGER NOT NULL",
  "bot_id TEXT NOT NULL",
  "poker_id TEXT NOT NULL",
  "target_id TEXT NOT NULL",
  "group_id TEXT",
  "is_self_poke INTEGER NOT NULL",
  "rule_id TEXT NOT NULL",
  "rule_name TEXT NOT NULL",
  "action TEXT NOT NULL",
];

export class PokeStore {
  private store!: PluginStore;
  private ready = false;

  async init(store: PluginStore): Promise<void> {
    if (this.ready) return;
    this.store = store;
    await this.store.createTable(TABLE_CONFIG, CONFIG_COLUMNS);
    await this.store.createTable(TABLE_LOGS, LOG_COLUMNS);
    this.ready = true;
  }

  get isReady(): boolean {
    return this.ready;
  }

  // ── 配置 ──────────────────────────────────────────────────────────────────

  async loadConfig(): Promise<PokeConfig> {
    if (!this.ready) return { ...DEFAULTS };
    try {
      const rows = await this.store.query(TABLE_CONFIG) as { key: string; value: string }[];
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      if (!map["config"]) return { ...DEFAULTS };
      return { ...DEFAULTS, ...(JSON.parse(map["config"]) as Partial<PokeConfig>) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  async saveConfig(cfg: PokeConfig): Promise<void> {
    if (!this.ready) return;
    const value = JSON.stringify(cfg);
    // upsert: delete then insert (PluginStore has no update)
    await this.store.delete(TABLE_CONFIG, { key: "config" });
    await this.store.insert(TABLE_CONFIG, { key: "config", value });
  }

  // ── 日志 ──────────────────────────────────────────────────────────────────

  async addLog(entry: PokeLogEntry): Promise<void> {
    if (!this.ready) return;
    await this.store.insert(TABLE_LOGS, {
      time: entry.time,
      bot_id: entry.botId,
      poker_id: entry.pokerId,
      target_id: entry.targetId,
      group_id: entry.groupId ?? null,
      is_self_poke: entry.isSelfPoke ? 1 : 0,
      rule_id: entry.ruleId,
      rule_name: entry.ruleName,
      action: entry.action,
    });
    // 保留最新 500 条，超出时裁剪（按 id ASC 最旧的）
    await this.pruneLogs(500);
  }

  async recentLogs(limit = 50): Promise<PokeLogEntry[]> {
    if (!this.ready) return [];
    const rows = await this.store.query(TABLE_LOGS, undefined, {
      orderBy: "id",
      order: "DESC",
      limit,
    }) as Record<string, unknown>[];
    return rows.map(this.rowToEntry);
  }

  async countSince(since: number): Promise<number> {
    if (!this.ready) return 0;
    // query all and filter client-side (PluginStore 不支持 WHERE > 条件)
    const rows = await this.store.query(TABLE_LOGS) as { time: number }[];
    return rows.filter((r) => r.time >= since).length;
  }

  private rowToEntry(row: Record<string, unknown>): PokeLogEntry {
    return {
      time: row.time as number,
      botId: row.bot_id as string,
      pokerId: row.poker_id as string,
      targetId: row.target_id as string,
      groupId: (row.group_id as string | null) ?? undefined,
      isSelfPoke: row.is_self_poke === 1,
      ruleId: row.rule_id as string,
      ruleName: row.rule_name as string,
      action: row.action as string,
    };
  }

  private async pruneLogs(maxRows: number): Promise<void> {
    const all = await this.store.query(TABLE_LOGS, undefined, {
      orderBy: "id",
      order: "DESC",
      limit: maxRows + 50,
    }) as { id: number }[];
    if (all.length <= maxRows) return;
    const excess = all.slice(maxRows);
    for (const row of excess) {
      await this.store.delete(TABLE_LOGS, { id: row.id });
    }
  }
}
