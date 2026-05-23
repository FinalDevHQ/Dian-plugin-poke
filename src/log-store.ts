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

export class LogStore {
  private logs: PokeLogEntry[] = [];
  private readonly maxSize = 200;

  add(entry: PokeLogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxSize) {
      this.logs.length = this.maxSize;
    }
  }

  recent(limit = 50): PokeLogEntry[] {
    return this.logs.slice(0, limit);
  }

  countSince(since: number): number {
    return this.logs.filter((e) => e.time >= since).length;
  }
}
