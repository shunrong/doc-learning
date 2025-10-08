import { describe, it, expect } from "vitest";
import { GCounter } from "./g-counter";

describe("G-Counter (Grow-only Counter)", () => {
  describe("基础功能", () => {
    it("初始值应该为 0", () => {
      const counter = new GCounter();
      expect(counter.value()).toBe(0);
    });

    it("应该能递增计数", () => {
      const counter = new GCounter();
      counter.increment("replica-1");
      expect(counter.value()).toBe(1);

      counter.increment("replica-1");
      expect(counter.value()).toBe(2);
    });

    it("应该能指定递增量", () => {
      const counter = new GCounter();
      counter.increment("replica-1", 5);
      expect(counter.value()).toBe(5);

      counter.increment("replica-1", 3);
      expect(counter.value()).toBe(8);
    });

    it("多个副本应该独立计数", () => {
      const counter = new GCounter();
      counter.increment("replica-1", 5);
      counter.increment("replica-2", 3);
      expect(counter.value()).toBe(8);
    });
  });

  describe("合并操作（核心）", () => {
    it("应该能合并两个空计数器", () => {
      const c1 = new GCounter();
      const c2 = new GCounter();
      const merged = c1.merge(c2);
      expect(merged.value()).toBe(0);
    });

    it("应该能合并不同副本的计数", () => {
      const c1 = new GCounter();
      c1.increment("replica-1", 5);

      const c2 = new GCounter();
      c2.increment("replica-2", 3);

      const merged = c1.merge(c2);
      expect(merged.value()).toBe(8);
    });

    it("合并时应该取每个副本的最大值", () => {
      const c1 = new GCounter();
      c1.increment("replica-1", 10);
      c1.increment("replica-2", 3);

      const c2 = new GCounter();
      c2.increment("replica-1", 5); // replica-1 的值比 c1 小
      c2.increment("replica-2", 7); // replica-2 的值比 c1 大

      const merged = c1.merge(c2);
      const state = merged.getState();

      expect(state["replica-1"]).toBe(10); // 取最大值
      expect(state["replica-2"]).toBe(7); // 取最大值
      expect(merged.value()).toBe(17);
    });

    it("应该满足交换律 (a.merge(b) == b.merge(a))", () => {
      const c1 = new GCounter();
      c1.increment("replica-1", 5);
      c1.increment("replica-2", 3);

      const c2 = new GCounter();
      c2.increment("replica-1", 2);
      c2.increment("replica-3", 4);

      const merged1 = c1.merge(c2);
      const merged2 = c2.merge(c1);

      expect(merged1.value()).toBe(merged2.value());
      expect(merged1.getState()).toEqual(merged2.getState());
    });

    it("应该满足结合律 ((a.merge(b)).merge(c) == a.merge(b.merge(c)))", () => {
      const c1 = new GCounter();
      c1.increment("replica-1", 5);

      const c2 = new GCounter();
      c2.increment("replica-2", 3);

      const c3 = new GCounter();
      c3.increment("replica-3", 2);

      const merged1 = c1.merge(c2).merge(c3);
      const merged2 = c1.merge(c2.merge(c3));

      expect(merged1.value()).toBe(merged2.value());
      expect(merged1.getState()).toEqual(merged2.getState());
    });

    it("应该满足幂等性 (a.merge(a) == a)", () => {
      const c1 = new GCounter();
      c1.increment("replica-1", 5);
      c1.increment("replica-2", 3);

      const merged = c1.merge(c1);

      expect(merged.value()).toBe(c1.value());
      expect(merged.getState()).toEqual(c1.getState());
    });
  });

  describe("协同场景模拟", () => {
    it("模拟两个用户同时编辑", () => {
      // 初始状态
      const server = new GCounter();

      // 用户A 的副本
      const userA = new GCounter();
      userA.increment("user-a", 3);

      // 用户B 的副本（同时进行）
      const userB = new GCounter();
      userB.increment("user-b", 5);

      // 服务器合并两个用户的更新
      const merged = server.merge(userA).merge(userB);

      expect(merged.value()).toBe(8);
    });

    it("模拟网络分区后的合并", () => {
      // 初始状态
      const initial = new GCounter();
      initial.increment("replica-1", 10);

      // 网络分区：副本A和B分别操作
      const replicaA = GCounter.fromState(initial.getState());
      replicaA.increment("replica-1", 5); // 继续递增

      const replicaB = GCounter.fromState(initial.getState());
      replicaB.increment("replica-1", 3); // 同时也在递增

      // 网络恢复，合并
      const merged = replicaA.merge(replicaB);

      // 应该取最大值：10 + 5 = 15
      expect(merged.value()).toBe(15);
    });

    it("模拟离线编辑后同步", () => {
      // 服务器状态
      const server = new GCounter();
      server.increment("replica-1", 10);
      server.increment("replica-2", 5);

      // 客户端离线前拉取状态
      const client = GCounter.fromState(server.getState());

      // 客户端离线期间，服务器继续更新
      server.increment("replica-2", 3); // replica-2: 5 -> 8

      // 客户端离线期间，本地操作
      client.increment("replica-1", 2); // replica-1: 10 -> 12

      // 客户端上线，合并
      const synced = server.merge(client);

      const state = synced.getState();
      expect(state["replica-1"]).toBe(12); // 取客户端的值
      expect(state["replica-2"]).toBe(8); // 取服务器的值
      expect(synced.value()).toBe(20);
    });
  });

  describe("状态序列化", () => {
    it("应该能导出和导入状态", () => {
      const c1 = new GCounter();
      c1.increment("replica-1", 5);
      c1.increment("replica-2", 3);

      const state = c1.getState();
      const c2 = GCounter.fromState(state);

      expect(c2.value()).toBe(c1.value());
      expect(c2.getState()).toEqual(c1.getState());
    });
  });
});
