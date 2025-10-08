/**
 * Phase 2: Operation 测试用例
 *
 * 测试核心方法的正确性
 */

import { describe, it, expect } from "vitest";
import {
  apply,
  invert,
  compose,
  insert,
  deleteOp,
  retain,
  normalize,
  length,
  baseLength,
} from "./operation";
import type { Operation } from "./types";

describe("Operation: apply", () => {
  it("应该正确应用插入操作", () => {
    const text = "Hello";
    const ops = [insert("Hi, "), retain(5)];
    const result = apply(text, ops);
    expect(result).toBe("Hi, Hello");
  });

  it("应该正确应用删除操作", () => {
    const text = "Hello World";
    const ops = [retain(6), deleteOp(5)];
    const result = apply(text, ops);
    expect(result).toBe("Hello ");
  });

  it("应该正确应用保留操作", () => {
    const text = "Hello World";
    const ops = [retain(5)]; // 只保留前5个字符
    const result = apply(text, ops);
    // 保留5个字符后，剩余部分也会保留（除非显式删除）
    expect(result).toBe("Hello World");
  });

  it("应该正确应用复合操作", () => {
    const text = "Hello World";
    const ops = [
      retain(6), // 保留 "Hello "
      deleteOp(5), // 删除 "World"
      insert("TypeScript"), // 插入 "TypeScript"
    ];
    const result = apply(text, ops);
    expect(result).toBe("Hello TypeScript");
  });

  it("应该保留未被操作的文本", () => {
    const text = "Hello World";
    const ops = [insert("Hi, ")];
    const result = apply(text, ops);
    expect(result).toBe("Hi, Hello World");
  });

  it("应该处理空文本", () => {
    const text = "";
    const ops = [insert("Hello")];
    const result = apply(text, ops);
    expect(result).toBe("Hello");
  });

  it("应该处理空操作", () => {
    const text = "Hello";
    const ops: Operation[] = [];
    const result = apply(text, ops);
    expect(result).toBe("Hello");
  });
});

describe("Operation: invert", () => {
  it("应该反转插入操作", () => {
    const text = "Hello";
    const ops = [retain(5), insert(" World")];
    const inverse = invert(ops, text);

    expect(inverse).toEqual([retain(5), deleteOp(6)]);

    // 验证：应用操作再应用反向操作应该回到原文本
    const modified = apply(text, ops);
    const reverted = apply(modified, inverse);
    expect(reverted).toBe(text);
  });

  it("应该反转删除操作", () => {
    const text = "Hello World";
    const ops = [retain(6), deleteOp(5)];
    const inverse = invert(ops, text);

    expect(inverse).toEqual([retain(6), insert("World")]);

    const modified = apply(text, ops);
    const reverted = apply(modified, inverse);
    expect(reverted).toBe(text);
  });

  it("应该反转复合操作", () => {
    const text = "Hello World";
    const ops = [retain(6), deleteOp(5), insert("TypeScript")];
    const inverse = invert(ops, text);

    const modified = apply(text, ops);
    const reverted = apply(modified, inverse);
    expect(reverted).toBe(text);
  });

  it("应该处理仅插入的操作", () => {
    const text = "";
    const ops = [insert("Hello")];
    const inverse = invert(ops, text);

    expect(inverse).toEqual([deleteOp(5)]);
  });
});

describe("Operation: compose", () => {
  it("应该组合两个插入操作", () => {
    const ops1 = [insert("Hello")];
    const ops2 = [retain(5), insert(" World")];
    const composed = compose(ops1, ops2);

    // 验证组合后的效果等价于依次应用
    const text = "";
    const result1 = apply(apply(text, ops1), ops2);
    const result2 = apply(text, composed);
    expect(result2).toBe(result1);
    expect(result2).toBe("Hello World");
  });

  it("应该组合插入和删除", () => {
    const ops1 = [insert("Hello World")];
    const ops2 = [retain(6), deleteOp(5)];
    const composed = compose(ops1, ops2);

    const text = "";
    const result1 = apply(apply(text, ops1), ops2);
    const result2 = apply(text, composed);
    expect(result2).toBe(result1);
  });

  it("应该组合多个保留操作", () => {
    const ops1 = [retain(5), insert(" ")];
    const ops2 = [retain(6), insert("World")];
    const composed = compose(ops1, ops2);

    const text = "Hello";
    const result1 = apply(apply(text, ops1), ops2);
    const result2 = apply(text, composed);
    expect(result2).toBe(result1);
    expect(result2).toBe("Hello World");
  });

  it("应该处理复杂的组合", () => {
    const ops1 = [insert("Hello"), retain(5), deleteOp(3)];
    const ops2 = [retain(7), insert(" "), deleteOp(2)];

    const composed = compose(ops1, ops2);

    const text = "World!!!";
    const result1 = apply(apply(text, ops1), ops2);
    const result2 = apply(text, composed);
    expect(result2).toBe(result1);
  });

  it("验证组合的数学性质", () => {
    // compose(a, compose(b, c)) === compose(compose(a, b), c)
    const a = [insert("A")];
    const b = [retain(1), insert("B")];
    const c = [retain(2), insert("C")];

    const text = "";
    const left_result = apply(text, compose(a, compose(b, c)));
    const right_result = apply(text, compose(compose(a, b), c));

    // 验证结果一致即可，不要求操作序列完全相同
    expect(left_result).toBe(right_result);
    expect(left_result).toBe("ABC");
  });
});

describe("Operation: normalize", () => {
  it("应该合并相邻的插入操作", () => {
    const ops = [insert("Hello"), insert(" "), insert("World")];
    const normalized = normalize(ops);
    expect(normalized).toEqual([insert("Hello World")]);
  });

  it("应该合并相邻的删除操作", () => {
    const ops = [deleteOp(3), deleteOp(2), deleteOp(1)];
    const normalized = normalize(ops);
    expect(normalized).toEqual([deleteOp(6)]);
  });

  it("应该合并相邻的保留操作", () => {
    const ops = [retain(3), retain(2), retain(5)];
    const normalized = normalize(ops);
    expect(normalized).toEqual([retain(10)]);
  });

  it("应该移除空操作", () => {
    const ops = [insert(""), deleteOp(0), retain(0), insert("Hello")];
    const normalized = normalize(ops);
    expect(normalized).toEqual([insert("Hello")]);
  });

  it("不应该合并不同类型的操作", () => {
    const ops = [insert("Hello"), deleteOp(5), retain(3)];
    const normalized = normalize(ops);
    expect(normalized).toEqual(ops);
  });
});

describe("Operation: length", () => {
  it("应该计算操作后的文档长度", () => {
    const ops = [insert("Hello"), retain(5), deleteOp(3)];
    expect(length(ops)).toBe(10); // 5 (Hello) + 5 (retain)
  });

  it("应该计算基础文档长度", () => {
    const ops = [insert("Hello"), retain(5), deleteOp(3)];
    expect(baseLength(ops)).toBe(8); // 5 (retain) + 3 (delete)
  });
});

describe("Operation: 综合测试", () => {
  it("多次应用和反转应该保持文本不变", () => {
    const original = "The quick brown fox";

    const ops1 = [retain(4), insert("very ")];
    const ops2 = [retain(9), deleteOp(5), insert("fast")];

    // 应用操作
    let text = original;
    text = apply(text, ops1);
    const afterOps1 = text;
    text = apply(text, ops2);

    // 反转操作
    const inv2 = invert(ops2, afterOps1);
    const inv1 = invert(ops1, original);

    text = apply(text, inv2);
    text = apply(text, inv1);

    expect(text).toBe(original);
  });

  it("组合多个操作应该等价于依次应用", () => {
    const text = "Hello";

    const ops1 = [retain(5), insert(" World")];
    const ops2 = [insert("Oh, ")];

    // 方法1：依次应用
    const result1 = apply(apply(text, ops1), ops2);

    // 方法2：先组合再应用
    const composed = compose(ops1, ops2);
    const result2 = apply(text, composed);

    expect(result2).toBe(result1);
  });

  it("应该正确处理中文字符", () => {
    const text = "你好世界";
    const ops = [retain(2), insert("，"), retain(2)];
    const result = apply(text, ops);
    expect(result).toBe("你好，世界");
  });

  it("应该正确处理 Emoji", () => {
    const text = "Hello 🌍";
    const ops = [retain(6), deleteOp(2), insert("😊")];
    const result = apply(text, ops);
    expect(result).toBe("Hello 😊");
  });
});
