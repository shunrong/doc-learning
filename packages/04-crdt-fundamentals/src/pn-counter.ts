import { GCounter } from "./g-counter";

/**
 * PN-Counter (Positive-Negative Counter)
 *
 * 可增可减的计数器
 *
 * 核心思想：
 * - 用两个 G-Counter：一个记录增加，一个记录减少
 * - value = positive.value() - negative.value()
 * - 巧妙地将"减法"转换为"加法"
 */

export class PNCounter {
  private positive: GCounter; // 记录所有增加操作
  private negative: GCounter; // 记录所有减少操作

  constructor() {
    this.positive = new GCounter();
    this.negative = new GCounter();
  }

  /**
   * 递增计数
   */
  increment(replicaId: string, amount: number = 1): void {
    this.positive.increment(replicaId, amount);
  }

  /**
   * 递减计数
   *
   * 关键：减法转换为负计数器的加法
   */
  decrement(replicaId: string, amount: number = 1): void {
    this.negative.increment(replicaId, amount);
  }

  /**
   * 获取当前总计数
   * value = positive - negative
   */
  value(): number {
    return this.positive.value() - this.negative.value();
  }

  /**
   * 合并另一个 PN-Counter
   *
   * 分别合并 positive 和 negative
   */
  merge(other: PNCounter): PNCounter {
    const result = new PNCounter();
    result.positive = this.positive.merge(other.positive);
    result.negative = this.negative.merge(other.negative);
    return result;
  }

  /**
   * 获取内部状态
   */
  getState(): {
    positive: Record<string, number>;
    negative: Record<string, number>;
  } {
    return {
      positive: this.positive.getState(),
      negative: this.negative.getState(),
    };
  }

  /**
   * 从状态创建 PN-Counter
   */
  static fromState(state: {
    positive: Record<string, number>;
    negative: Record<string, number>;
  }): PNCounter {
    const counter = new PNCounter();
    counter.positive = GCounter.fromState(state.positive);
    counter.negative = GCounter.fromState(state.negative);
    return counter;
  }
}
