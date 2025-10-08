import { describe, it, expect } from "vitest";
import { PNCounter } from "./pn-counter";

describe("PN-Counter (Positive-Negative Counter)", () => {
  describe("基础功能", () => {
    it("初始值应该为 0", () => {
      const counter = new PNCounter();
      expect(counter.value()).toBe(0);
    });

    it("应该能递增计数", () => {
      const counter = new PNCounter();
      counter.increment("replica-1", 5);
      expect(counter.value()).toBe(5);
    });

    it("应该能递减计数", () => {
      const counter = new PNCounter();
      counter.decrement("replica-1", 3);
      expect(counter.value()).toBe(-3);
    });

    it("应该能同时增减", () => {
      const counter = new PNCounter();
      counter.increment("replica-1", 10);
      counter.decrement("replica-1", 3);
      expect(counter.value()).toBe(7);
    });

    it("多个副本应该独立操作", () => {
      const counter = new PNCounter();
      counter.increment("replica-1", 10);
      counter.decrement("replica-2", 3);
      counter.increment("replica-3", 5);
      expect(counter.value()).toBe(12); // 10 - 3 + 5
    });
  });

  describe("合并操作", () => {
    it("应该能合并两个计数器", () => {
      const c1 = new PNCounter();
      c1.increment("replica-1", 10);
      c1.decrement("replica-1", 3);

      const c2 = new PNCounter();
      c2.increment("replica-2", 5);

      const merged = c1.merge(c2);
      expect(merged.value()).toBe(12); // (10 - 3) + 5
    });

    it("应该满足交换律", () => {
      const c1 = new PNCounter();
      c1.increment("replica-1", 10);
      c1.decrement("replica-2", 3);

      const c2 = new PNCounter();
      c2.increment("replica-3", 5);
      c2.decrement("replica-4", 2);

      const merged1 = c1.merge(c2);
      const merged2 = c2.merge(c1);

      expect(merged1.value()).toBe(merged2.value());
    });

    it("应该满足幂等性", () => {
      const c1 = new PNCounter();
      c1.increment("replica-1", 10);
      c1.decrement("replica-2", 3);

      const merged = c1.merge(c1);
      expect(merged.value()).toBe(c1.value());
    });
  });

  describe("协同场景", () => {
    it("模拟计数器同步", () => {
      // 初始状态
      const server = new PNCounter();
      server.increment("replica-1", 100);

      // 用户A 增加
      const userA = PNCounter.fromState(server.getState());
      userA.increment("user-a", 10);

      // 用户B 减少（同时进行）
      const userB = PNCounter.fromState(server.getState());
      userB.decrement("user-b", 5);

      // 服务器合并
      const merged = server.merge(userA).merge(userB);

      expect(merged.value()).toBe(105); // 100 + 10 - 5
    });

    it("模拟网络分区后的合并", () => {
      const initial = new PNCounter();
      initial.increment("replica-1", 50);

      // 分区A：增加
      const replicaA = PNCounter.fromState(initial.getState());
      replicaA.increment("replica-1", 10);
      replicaA.decrement("replica-1", 5);

      // 分区B：减少
      const replicaB = PNCounter.fromState(initial.getState());
      replicaB.decrement("replica-1", 8);
      replicaB.increment("replica-1", 3);

      // 合并：应该应用所有操作
      const merged = replicaA.merge(replicaB);

      // 分析：
      // replicaA: positive[replica-1] = 50+10 = 60, negative[replica-1] = 5
      //   replicaA 不知道 replicaB 的 increment(3)，所以没有+3
      // replicaB: positive[replica-1] = 50+3 = 53, negative[replica-1] = 8
      //   replicaB 不知道 replicaA 的 increment(10)，所以没有+10
      // merged: positive = max(60, 53) = 60, negative = max(5, 8) = 8
      //         value = 60 - 8 = 52
      expect(merged.value()).toBe(52);
    });
  });

  describe("状态序列化", () => {
    it("应该能导出和导入状态", () => {
      const c1 = new PNCounter();
      c1.increment("replica-1", 10);
      c1.decrement("replica-2", 3);

      const state = c1.getState();
      const c2 = PNCounter.fromState(state);

      expect(c2.value()).toBe(c1.value());
      expect(c2.getState()).toEqual(c1.getState());
    });
  });
});
