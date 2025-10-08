/**
 * Phase 2: Delta 数据模型（扁平化）
 *
 * Delta 是 Quill 使用的扁平化数据结构
 * 特点：简单、易于理解、适合线性文本
 */

import type { Delta as DeltaType, Operation, Attributes } from "./types";
import { apply, invert, compose as composeOps, normalize } from "./operation";

/**
 * Delta 类 - 封装操作序列
 */
export class Delta implements DeltaType {
  ops: Operation[];

  constructor(ops: Operation[] = []) {
    this.ops = normalize(ops);
  }

  /**
   * 插入文本
   */
  insert(text: string, attributes?: Attributes): Delta {
    this.ops.push({ type: "insert", text, attributes });
    return this;
  }

  /**
   * 删除字符
   */
  delete(length: number): Delta {
    if (length > 0) {
      this.ops.push({ type: "delete", length });
    }
    return this;
  }

  /**
   * 保留字符
   */
  retain(length: number, attributes?: Attributes): Delta {
    if (length > 0) {
      this.ops.push({ type: "retain", length, attributes });
    }
    return this;
  }

  /**
   * 应用到文本
   */
  apply(text: string): string {
    return apply(text, this.ops);
  }

  /**
   * 生成反向 Delta
   */
  invert(originalText: string): Delta {
    return new Delta(invert(this.ops, originalText));
  }

  /**
   * 组合两个 Delta
   */
  compose(other: Delta): Delta {
    return new Delta(composeOps(this.ops, other.ops));
  }

  /**
   * 转换为 JSON
   */
  toJSON(): DeltaType {
    return { ops: this.ops };
  }

  /**
   * 从 JSON 创建
   */
  static fromJSON(json: DeltaType): Delta {
    return new Delta(json.ops);
  }

  /**
   * 克隆
   */
  clone(): Delta {
    return new Delta([...this.ops]);
  }

  /**
   * 规范化
   */
  normalize(): Delta {
    this.ops = normalize(this.ops);
    return this;
  }
}

/**
 * 创建 Delta 的便捷方法
 */
export function delta(...ops: Operation[]): Delta {
  return new Delta(ops);
}

/**
 * 从文本创建 Delta
 */
export function fromText(text: string): Delta {
  return new Delta([{ type: "insert", text }]);
}

/**
 * Delta 的 diff 算法（简化版）
 * 计算从 oldText 到 newText 的最小操作序列
 */
export function diff(oldText: string, newText: string): Delta {
  const delta = new Delta();

  // 简单的 diff 算法：找到公共前缀和后缀
  let i = 0;
  let j = 0;

  // 公共前缀
  while (
    i < oldText.length &&
    i < newText.length &&
    oldText[i] === newText[i]
  ) {
    i++;
  }

  // 公共后缀
  while (
    j < oldText.length - i &&
    j < newText.length - i &&
    oldText[oldText.length - 1 - j] === newText[newText.length - 1 - j]
  ) {
    j++;
  }

  // 保留公共前缀
  if (i > 0) {
    delta.retain(i);
  }

  // 插入新内容
  const inserted = newText.substring(i, newText.length - j);
  if (inserted.length > 0) {
    delta.insert(inserted);
  }

  // 删除旧内容
  const deleted = oldText.length - i - j;
  if (deleted > 0) {
    delta.delete(deleted);
  }

  return delta;
}

/**
 * 示例：使用 Delta 进行文档编辑
 */
export function example() {
  console.log("=== Delta 示例 ===\n");

  // 1. 创建文档
  let doc = "";
  const delta1 = new Delta().insert("Hello World");

  doc = delta1.apply(doc);
  console.log("1. 创建文档:", doc);
  // 输出: "Hello World"

  // 2. 插入文本
  const delta2 = new Delta().retain(5).insert(" Beautiful").retain(6);

  doc = delta2.apply(doc);
  console.log("2. 插入文本:", doc);
  // 输出: "Hello Beautiful World"

  // 3. 删除文本
  const delta3 = new Delta().retain(6).delete(10).retain(6);

  doc = delta3.apply(doc);
  console.log("3. 删除文本:", doc);
  // 输出: "Hello World"

  // 4. 组合操作
  const composed = delta1.compose(delta2).compose(delta3);
  const result = composed.apply("");
  console.log("4. 组合后:", result);
  // 输出: "Hello World"

  // 5. 撤销
  const inverted = delta3.invert(delta2.apply(delta1.apply("")));
  doc = inverted.apply(doc);
  console.log("5. 撤销:", doc);
  // 输出: "Hello Beautiful World"

  // 6. Diff
  const oldText = "Hello World";
  const newText = "Hello TypeScript World";
  const diffDelta = diff(oldText, newText);
  console.log("6. Diff:", JSON.stringify(diffDelta.toJSON(), null, 2));
  console.log("   应用:", diffDelta.apply(oldText));
  // 输出: "Hello TypeScript World"
}
