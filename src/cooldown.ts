export class CooldownManager {
  private map = new Map<string, number>();

  private key(userId: string, ruleId: string): string {
    return `${userId}:${ruleId}`;
  }

  isOnCooldown(userId: string, ruleId: string): boolean {
    const expireAt = this.map.get(this.key(userId, ruleId));
    if (!expireAt) return false;
    if (Date.now() >= expireAt) {
      this.map.delete(this.key(userId, ruleId));
      return false;
    }
    return true;
  }

  set(userId: string, ruleId: string, seconds: number): void {
    if (seconds <= 0) return;
    this.map.set(this.key(userId, ruleId), Date.now() + seconds * 1000);
  }

  clear(): void {
    this.map.clear();
  }
}
