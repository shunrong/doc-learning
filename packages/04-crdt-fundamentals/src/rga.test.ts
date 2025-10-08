import { describe, it, expect } from "vitest";
import { RGA } from "./rga";

describe("RGA (Replicated Growable Array)", () => {
  describe("基础操作", () => {
    it("应该能插入字符", () => {
      const rga = new RGA("replica-1");
      rga.insert(0, "H");
      rga.insert(1, "i");
      expect(rga.toString()).toBe("Hi");
    });

    it("应该能在中间插入", () => {
      const rga = new RGA("replica-1");
      rga.insert(0, "H");
      rga.insert(1, "i");
      rga.insert(1, "e"); // 在 'H' 和 'i' 之间插入
      expect(rga.toString()).toBe("Hei");
    });

    it("应该能删除字符", () => {
      const rga = new RGA("replica-1");
      rga.insert(0, "H");
      rga.insert(1, "e");
      rga.insert(2, "l");
      rga.insert(3, "l");
      rga.insert(4, "o");

      rga.delete(1); // 删除 'e'
      expect(rga.toString()).toBe("Hllo");
    });

    it("删除应该使用墓碑标记", () => {
      const rga = new RGA("replica-1");
      rga.insert(0, "H");
      rga.insert(1, "i");
      rga.delete(0);

      expect(rga.toString()).toBe("i");
      expect(rga.length()).toBe(1);

      // 内部应该还有字符（带墓碑）
      const state = rga.getState();
      expect(state.chars.length).toBe(2);
      expect(state.chars[0].tombstone).toBe(true);
    });

    it("应该能正确计算长度", () => {
      const rga = new RGA("replica-1");
      expect(rga.length()).toBe(0);

      rga.insert(0, "H");
      expect(rga.length()).toBe(1);

      rga.insert(1, "i");
      expect(rga.length()).toBe(2);

      rga.delete(0);
      expect(rga.length()).toBe(1);
    });
  });

  describe("远程操作应用", () => {
    it("应该能应用远程插入操作", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");

      // replica-1 插入
      const op = rga1.insert(0, "H");

      // replica-2 应用操作
      rga2.applyInsert(op);

      expect(rga2.toString()).toBe("H");
    });

    it("应该能应用远程删除操作", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");

      // replica-1 插入
      const insertOp = rga1.insert(0, "H");

      // replica-2 应用插入
      rga2.applyInsert(insertOp);

      // replica-1 删除
      const deleteOp = rga1.delete(0);

      // replica-2 应用删除
      if (deleteOp) {
        rga2.applyDelete(deleteOp);
      }

      expect(rga2.toString()).toBe("");
    });

    it("应该同步时钟", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");

      rga1.insert(0, "a");
      rga1.insert(1, "b");
      const op3 = rga1.insert(2, "c");

      // rga2 应用 op3
      rga2.applyInsert(op3);

      // rga2 的时钟应该更新
      const state2 = rga2.getState();
      expect(state2.clock).toBe(3);
    });
  });

  describe("并发插入（核心测试）", () => {
    it("两个用户在开头同时插入", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");

      // 两个副本同时在开头插入
      const op1 = rga1.insert(0, "A");
      const op2 = rga2.insert(0, "B");

      // 交换应用
      rga1.applyInsert(op2);
      rga2.applyInsert(op1);

      // 结果应该收敛（按 ID 排序）
      expect(rga1.toString()).toBe(rga2.toString());
    });

    it("两个用户在同一位置同时插入", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");

      // 初始状态：都有 "Hello"
      ["H", "e", "l", "l", "o"].forEach((char, i) => {
        const op = rga1.insert(i, char);
        rga2.applyInsert(op);
      });

      // 在位置2（'l'之前）同时插入
      const op1 = rga1.insert(2, "X");
      const op2 = rga2.insert(2, "Y");

      // 交换应用
      rga1.applyInsert(op2);
      rga2.applyInsert(op1);

      // 结果应该收敛
      expect(rga1.toString()).toBe(rga2.toString());
    });

    it("多个用户同时编辑", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");
      const rga3 = new RGA("replica-3");

      // replica-1 插入
      const op1 = rga1.insert(0, "A");

      // replica-2 插入（同时）
      const op2 = rga2.insert(0, "B");

      // replica-3 插入（同时）
      const op3 = rga3.insert(0, "C");

      // 所有副本互相应用操作
      rga1.applyInsert(op2);
      rga1.applyInsert(op3);

      rga2.applyInsert(op1);
      rga2.applyInsert(op3);

      rga3.applyInsert(op1);
      rga3.applyInsert(op2);

      // 所有副本应该收敛
      expect(rga1.toString()).toBe(rga2.toString());
      expect(rga2.toString()).toBe(rga3.toString());
    });
  });

  describe("并发删除", () => {
    it("两个用户删除同一字符", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");

      // 初始状态
      const insertOp = rga1.insert(0, "H");
      rga2.applyInsert(insertOp);

      // 两个副本同时删除
      const deleteOp1 = rga1.delete(0);
      const deleteOp2 = rga2.delete(0);

      // 交换应用（幂等性）
      if (deleteOp1) rga2.applyDelete(deleteOp1);
      if (deleteOp2) rga1.applyDelete(deleteOp2);

      // 结果应该相同
      expect(rga1.toString()).toBe("");
      expect(rga2.toString()).toBe("");
    });

    it("一个插入一个删除", () => {
      const rga1 = new RGA("replica-1");
      const rga2 = new RGA("replica-2");

      // 初始状态："Hi"
      const op1 = rga1.insert(0, "H");
      const op2 = rga1.insert(1, "i");
      rga2.applyInsert(op1);
      rga2.applyInsert(op2);

      // replica-1 在位置1插入 'e'
      const insertOp = rga1.insert(1, "e");

      // replica-2 删除位置1 ('i')（同时）
      const deleteOp = rga2.delete(1);

      // 交换应用
      rga1.applyDelete(deleteOp!);
      rga2.applyInsert(insertOp);

      // 结果应该收敛
      expect(rga1.toString()).toBe(rga2.toString());
    });
  });

  describe("复杂场景", () => {
    it("模拟真实协同编辑", () => {
      const alice = new RGA("alice");
      const bob = new RGA("bob");

      // Alice 输入 "Hello"
      const aliceOps = ["H", "e", "l", "l", "o"].map((char, i) =>
        alice.insert(i, char)
      );

      // Bob 应用 Alice 的操作
      aliceOps.forEach((op) => bob.applyInsert(op));

      expect(bob.toString()).toBe("Hello");

      // Bob 在末尾加 " World"
      const bobOps = [" ", "W", "o", "r", "l", "d"].map((char, i) =>
        bob.insert(5 + i, char)
      );

      // Alice 同时在 "Hello" 后加 "!"
      const aliceOp = alice.insert(5, "!");

      // 互相应用操作
      bobOps.forEach((op) => alice.applyInsert(op));
      bob.applyInsert(aliceOp);

      // 结果应该收敛
      const expected1 = "Hello! World";
      const expected2 = "Hello World!";

      // 由于并发插入，结果可能是其中之一（取决于 ID 排序）
      const result = alice.toString();
      expect(result === expected1 || result === expected2).toBe(true);
      expect(alice.toString()).toBe(bob.toString());
    });

    it("离线编辑后同步", () => {
      // 初始状态
      const server = new RGA("server");
      server.insert(0, "H");
      server.insert(1, "i");

      // 客户端拉取状态
      const client = RGA.fromState("client", server.getState());

      // 客户端离线编辑
      client.insert(2, "!");
      client.insert(2, " ");
      client.insert(2, "there");

      // 服务器继续更新
      server.insert(0, "Oh, ");

      // 客户端上线，合并状态
      client.merge(server);

      // 检查合并结果
      const clientText = client.toString();
      expect(clientText).toContain("Oh");
      expect(clientText).toContain("Hi");
      expect(clientText).toContain("there");
    });
  });

  describe("状态管理", () => {
    it("应该能导出和导入状态", () => {
      const rga1 = new RGA("replica-1");
      rga1.insert(0, "H");
      rga1.insert(1, "i");

      const state = rga1.getState();
      const rga2 = RGA.fromState("replica-2", state);

      expect(rga2.toString()).toBe("Hi");
    });

    it("导入状态后应该保留墓碑", () => {
      const rga1 = new RGA("replica-1");
      rga1.insert(0, "H");
      rga1.insert(1, "i");
      rga1.delete(0);

      const state = rga1.getState();
      const rga2 = RGA.fromState("replica-2", state);

      expect(rga2.toString()).toBe("i");
      expect(rga2.getState().chars.length).toBe(2);
    });
  });

  describe("操作序列化", () => {
    it("插入操作应该包含完整信息", () => {
      const rga = new RGA("replica-1");
      const op = rga.insert(0, "H");

      expect(op.type).toBe("insert");
      expect(op.char.value).toBe("H");
      expect(op.char.id.replicaId).toBe("replica-1");
      expect(op.char.id.clock).toBeGreaterThan(0);
    });

    it("删除操作应该引用字符ID", () => {
      const rga = new RGA("replica-1");
      rga.insert(0, "H");
      const deleteOp = rga.delete(0);

      expect(deleteOp).not.toBeNull();
      expect(deleteOp!.type).toBe("delete");
      expect(deleteOp!.charId.replicaId).toBe("replica-1");
    });
  });
});
