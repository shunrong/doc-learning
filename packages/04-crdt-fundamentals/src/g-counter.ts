/**
 * G-Counter (Grow-only Counter)
 *
 * 最简单的 CRDT：只能递增的计数器
 *
 * 核心思想：
 * - 每个副本维护自己的计数
 * - 合并时取所有副本计数的总和
 * - 满足交换律、结合律、幂等性
 */

export class GCounter {
  /**
   * 存储每个副本的计数
   * key: 副本ID (replica ID)
   * value: 该副本的计数
   */
  private counts: Map<string, number>;

  constructor() {
    this.counts = new Map();
  }

  /**
   * 递增计数
   * @param replicaId - 副本ID
   * @param amount - 递增量（默认1）
   */
  increment(replicaId: string, amount: number = 1): void {
    const current = this.counts.get(replicaId) || 0;
    this.counts.set(replicaId, current + amount);
  }

  /**
   * 获取当前总计数
   */
  value(): number {
    let sum = 0;
    for (const count of this.counts.values()) {
      sum += count;
    }
    return sum;
  }

  /**
   * 合并另一个 G-Counter（核心方法）
   *
   * 关键：对每个副本，取两者中的最大值
   * 这保证了幂等性和收敛性
   */
  merge(other: GCounter): GCounter {
    const result = new GCounter();

    // 获取所有副本ID
    const allReplicas = new Set([
      ...this.counts.keys(),
      ...other.counts.keys(),
    ]);

    // 对每个副本，取最大值
    for (const replica of allReplicas) {
      const thisCount = this.counts.get(replica) || 0;
      const otherCount = other.counts.get(replica) || 0;
      result.counts.set(replica, Math.max(thisCount, otherCount));
    }

    return result;
  }

  /**
   * 获取内部状态（用于调试）
   */
  getState(): Record<string, number> {
    const state: Record<string, number> = {};
    for (const [replica, count] of this.counts.entries()) {
      state[replica] = count;
    }
    return state;
  }

  /**
   * 从状态创建 G-Counter
   */
  static fromState(state: Record<string, number>): GCounter {
    const counter = new GCounter();
    for (const [replica, count] of Object.entries(state)) {
      counter.counts.set(replica, count);
    }
    return counter;
  }
}
