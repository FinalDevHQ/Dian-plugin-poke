import type { PokeStore } from "./store.js";

export interface PokeLogEntry {
  time: number;
  botId: string;
  pokerId: string;
  targetId: string;
  groupId?: string;
  isSelfPoke: boolean;
  ruleId: string;
  ruleName: string;
  action: string;
}

/**
 * LogStore — 内存缓存 + 数据库持久化双轨
 *
 * - 内存缓存：用于当次启动后的快速读取（countSince / recent）
 * - 数据库：通过 PokeStore 持久化，store 就绪后写入
 */
export class LogStore {
  private logs: PokeLogEntry[] = [];
  private readonly maxMemory = 200;
  private pokeStore: PokeStore | null = null;

  /** store 就绪后注入，同时从数据库恢复最近日志到内存缓存 */
  async attachStore(store: PokeStore): Promise<void> {
    this.pokeStore = store;
    // 从数据库恢复最近 200 条到内存
    try {
      this.logs = await store.recentLogs(this.maxMemory);
    } catch { /* 恢复失败不影响运行 */ }
  }

  async add(entry: PokeLogEntry): Promise<void> {
    // 写内存
    this.logs.unshift(entry);
    if (this.logs.length > this.maxMemory) {
      this.logs.length = this.maxMemory;
    }
    // 写数据库（store 未就绪时静默跳过）
    if (this.pokeStore) {
      await this.pokeStore.addLog(entry).catch((e) => {
        console.error("[poke] failed to persist log:", e);
      });
    }
  }

  recent(limit = 50): PokeLogEntry[] {
    return this.logs.slice(0, limit);
  }

  countSince(since: number): number {
    return this.logs.filter((e) => e.time >= since).length;
  }
}
