/**
 * Phase 3: Transform 函数测试
 *
 * 验证 TP1 性质：
 * apply(apply(doc, op1), transform(op2, op1, "right")) ===
 * apply(apply(doc, op2), transform(op1, op2, "left"))
 */

import { describe, it, expect } from "vitest";
import { transform, insert, deleteOp, retain } from "./transform";
import { apply } from "./operation";
import type { Operation } from "./types";

/**
 * 验证 TP1 性质的辅助函数
 */
function verifyTP1(doc: string, op1: Operation[], op2: Operation[]) {
  // 路径 1: 先应用 op1，再应用转换后的 op2
  const doc1 = apply(doc, op1);
  const op2_prime = transform(op2, op1, "right");
  const result1 = apply(doc1, op2_prime);

  // 路径 2: 先应用 op2，再应用转换后的 op1
  const doc2 = apply(doc, op2);
  const op1_prime = transform(op1, op2, "left");
  const result2 = apply(doc2, op1_prime);

  // 两条路径应该到达同一结果
  expect(result1).toBe(result2);

  return result1;
}

describe("Transform: Insert vs Insert", () => {
  it("应该正确处理不同位置的插入", () => {
    const doc = "ABC";
    const op1 = [insert("X")]; // 在开头插入
    const op2 = [retain(2), insert("Y")]; // 在位置 2 插入

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("XABYC");
  });

  it("应该正确处理同一位置的插入（使用 side）", () => {
    const doc = "ABC";
    const op1 = [retain(1), insert("X")]; // 在位置 1 插入 X
    const op2 = [retain(1), insert("Y")]; // 在位置 1 插入 Y

    const result = verifyTP1(doc, op1, op2);
    // side="left" 的 op1 应该排在前面
    expect(result).toBe("AXYBC");
  });

  it("应该处理多个插入", () => {
    const doc = "";
    const op1 = [insert("Hello")];
    const op2 = [insert("World")];

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("HelloWorld");
  });
});

describe("Transform: Insert vs Delete", () => {
  it("应该保留插入，调整删除位置", () => {
    const doc = "ABCDE";
    const op1 = [retain(2), insert("X")]; // 在位置 2 插入 X → "ABXCDE"
    const op2 = [retain(1), deleteOp(2)]; // 删除位置 1-2 (BC) → "ADE"

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("AXDE");
  });

  it("应该处理插入在删除范围内的情况", () => {
    const doc = "ABCDE";
    const op1 = [retain(2), insert("X")]; // 在位置 2 插入
    const op2 = [retain(1), deleteOp(3)]; // 删除位置 1-3

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("AXE");
  });

  it("应该处理删除在插入之前", () => {
    const doc = "ABCDE";
    const op1 = [insert("X")]; // 在开头插入
    const op2 = [deleteOp(2)]; // 删除前 2 个

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("XCDE");
  });
});

describe("Transform: Delete vs Delete", () => {
  it("应该处理不重叠的删除", () => {
    const doc = "ABCDE";
    const op1 = [deleteOp(2)]; // 删除 AB
    const op2 = [retain(3), deleteOp(2)]; // 删除 DE

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("C");
  });

  it("应该处理重叠的删除", () => {
    const doc = "ABCDE";
    const op1 = [retain(1), deleteOp(2)]; // 删除 BC
    const op2 = [retain(2), deleteOp(2)]; // 删除 CD

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("AE");
  });

  it("应该处理完全重叠的删除", () => {
    const doc = "ABCDE";
    const op1 = [retain(1), deleteOp(3)]; // 删除 BCD
    const op2 = [retain(2), deleteOp(1)]; // 删除 C

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("AE");
  });
});

describe("Transform: Retain vs Delete", () => {
  it("应该处理保留和删除", () => {
    const doc = "ABCDE";
    const op1 = [retain(3)]; // 保留 ABC
    const op2 = [retain(1), deleteOp(2)]; // 删除 BC

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("ADE");
  });
});

describe("Transform: 复杂场景", () => {
  it("应该处理多步编辑", () => {
    const doc = "The quick brown fox";

    const op1 = [retain(10), insert("red ")]; // "The quick red brown fox"
    const op2 = [retain(16), deleteOp(3)]; // "The quick brown "

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("The quick red brown ");
  });

  it("应该处理复杂的组合操作", () => {
    const doc = "ABCD";

    const op1 = [
      insert("X"), // X
      retain(2), // AB
      deleteOp(1), // 删除 C
      insert("Y"), // Y
    ]; // "XABY D"

    const op2 = [
      retain(1), // A
      insert("Z"), // Z
      deleteOp(2), // 删除 BC
    ]; // "AZ D"

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("XAZYD");
  });

  it("应该处理中文字符", () => {
    const doc = "你好世界";
    const op1 = [retain(2), insert("，")];
    const op2 = [deleteOp(2), insert("大家")];

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("大家，世界");
  });

  it("应该处理实际协同编辑场景", () => {
    const doc = "Hello World";

    // Alice: 在 "Hello" 后添加 "Beautiful"
    const aliceOp = [retain(6), insert("Beautiful ")];

    // Bob: 将 "World" 改成 "TypeScript"
    const bobOp = [retain(6), deleteOp(5), insert("TypeScript")];

    const result = verifyTP1(doc, aliceOp, bobOp);
    expect(result).toBe("Hello Beautiful TypeScript");
  });
});

describe("Transform: 边界情况", () => {
  it("应该处理空文档", () => {
    const doc = "";
    const op1 = [insert("A")];
    const op2 = [insert("B")];

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("AB");
  });

  it("应该处理空操作", () => {
    const doc = "ABC";
    const op1: Operation[] = [];
    const op2 = [insert("X")];

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("XABC");
  });

  it("应该处理只保留的操作", () => {
    const doc = "ABC";
    const op1 = [retain(3)];
    const op2 = [retain(3)];

    const result = verifyTP1(doc, op1, op2);
    expect(result).toBe("ABC");
  });
});
