/**
 * Phase 2: Operation 核心实现
 *
 * 实现三个核心方法：
 * 1. apply - 将操作应用到文本
 * 2. invert - 生成反向操作（用于撤销）
 * 3. compose - 组合多个操作
 */

import type {
  Operation,
  InsertOp,
  DeleteOp,
  RetainOp,
  Attributes,
} from "./types";

// ==================== 辅助函数 ====================

/**
 * 创建插入操作
 */
export function insert(text: string, attributes?: Attributes): InsertOp {
  return { type: "insert", text, attributes };
}

/**
 * 创建删除操作
 */
export function deleteOp(length: number): DeleteOp {
  return { type: "delete", length };
}

/**
 * 创建保留操作
 */
export function retain(length: number, attributes?: Attributes): RetainOp {
  return { type: "retain", length, attributes };
}

/**
 * 判断是否为插入操作
 */
export function isInsert(op: Operation): op is InsertOp {
  return op.type === "insert";
}

/**
 * 判断是否为删除操作
 */
export function isDelete(op: Operation): op is DeleteOp {
  return op.type === "delete";
}

/**
 * 判断是否为保留操作
 */
export function isRetain(op: Operation): op is RetainOp {
  return op.type === "retain";
}

/**
 * 获取操作的长度
 * - insert: 文本长度
 * - delete: 删除长度
 * - retain: 保留长度
 */
export function getOpLength(op: Operation): number {
  if (isInsert(op)) {
    return op.text.length;
  } else if (isDelete(op)) {
    return op.length;
  } else {
    return op.length;
  }
}

// ==================== 核心方法 1: apply ====================

/**
 * 将操作应用到文本
 *
 * @param text - 原始文本
 * @param operations - 要应用的操作列表
 * @returns 应用操作后的文本
 *
 * @example
 * const text = "Hello World";
 * const ops = [
 *   retain(6),        // 保留 "Hello "
 *   deleteOp(5),      // 删除 "World"
 *   insert("Quill")   // 插入 "Quill"
 * ];
 * const result = apply(text, ops);
 * // result === "Hello Quill"
 */
export function apply(text: string, operations: Operation[]): string {
  let result = "";
  let textIndex = 0;

  for (const op of operations) {
    if (isInsert(op)) {
      // 插入：直接添加文本
      result += op.text;
    } else if (isDelete(op)) {
      // 删除：跳过指定长度的文本
      textIndex += op.length;
    } else if (isRetain(op)) {
      // 保留：复制指定长度的文本
      result += text.substring(textIndex, textIndex + op.length);
      textIndex += op.length;
    }
  }

  // 添加剩余的文本（如果有）
  if (textIndex < text.length) {
    result += text.substring(textIndex);
  }

  return result;
}

// ==================== 核心方法 2: invert ====================

/**
 * 生成操作的反向操作（用于撤销）
 *
 * @param operations - 原操作列表
 * @param originalText - 操作前的文本
 * @returns 反向操作列表
 *
 * @example
 * const text = "Hello";
 * const ops = [retain(5), insert(" World")];
 * const inverse = invert(ops, text);
 * // inverse === [retain(5), deleteOp(6)]
 *
 * // 验证：
 * apply(apply(text, ops), inverse) === text
 */
export function invert(
  operations: Operation[],
  originalText: string
): Operation[] {
  const inverted: Operation[] = [];
  let textIndex = 0;

  for (const op of operations) {
    if (isInsert(op)) {
      // 插入的反向是删除
      inverted.push(deleteOp(op.text.length));
    } else if (isDelete(op)) {
      // 删除的反向是插入被删除的文本
      const deletedText = originalText.substring(
        textIndex,
        textIndex + op.length
      );
      inverted.push(insert(deletedText));
      textIndex += op.length;
    } else if (isRetain(op)) {
      // 保留的反向还是保留
      inverted.push(retain(op.length));
      textIndex += op.length;
    }
  }

  return inverted;
}

// ==================== 核心方法 3: compose ====================

/**
 * 组合两个操作序列
 *
 * compose(a, b) 的结果等价于先应用 a，再应用 b
 *
 * @param ops1 - 第一个操作序列
 * @param ops2 - 第二个操作序列
 * @returns 组合后的操作序列
 *
 * @example
 * const ops1 = [insert("Hello")];
 * const ops2 = [retain(5), insert(" World")];
 * const composed = compose(ops1, ops2);
 * // composed === [insert("Hello World")]
 *
 * // 验证：
 * apply(apply(text, ops1), ops2) === apply(text, composed)
 */
export function compose(ops1: Operation[], ops2: Operation[]): Operation[] {
  const result: Operation[] = [];

  // 使用两个指针遍历两个操作序列
  let i = 0; // ops1 的索引
  let j = 0; // ops2 的索引

  // ops1 当前操作的剩余部分
  let op1: Operation | null = i < ops1.length ? ops1[i] : null;
  let op2: Operation | null = j < ops2.length ? ops2[j] : null;

  while (op1 || op2) {
    // Case 1: ops2 是 insert，直接添加到结果
    if (op2 && isInsert(op2)) {
      result.push(insert(op2.text, op2.attributes));
      j++;
      op2 = j < ops2.length ? ops2[j] : null;
    }
    // Case 2: ops1 是 delete，直接添加到结果
    else if (op1 && isDelete(op1)) {
      result.push(deleteOp(op1.length));
      i++;
      op1 = i < ops1.length ? ops1[i] : null;
    }
    // Case 3: 需要处理 ops1 和 ops2 的交互
    else if (op1 && op2) {
      // 获取当前操作的长度
      const len1 = isInsert(op1) ? op1.text.length : op1.length;
      const len2 = isDelete(op2) ? op2.length : op2.length;

      if (isInsert(op1) && isDelete(op2)) {
        // insert + delete: 互相抵消
        if (len1 > len2) {
          // insert 更长，剩余部分继续
          op1 = insert(op1.text.substring(len2), op1.attributes);
          j++;
          op2 = j < ops2.length ? ops2[j] : null;
        } else if (len1 < len2) {
          // delete 更长，剩余部分继续
          op2 = deleteOp(len2 - len1);
          i++;
          op1 = i < ops1.length ? ops1[i] : null;
        } else {
          // 长度相等，都消耗掉
          i++;
          j++;
          op1 = i < ops1.length ? ops1[i] : null;
          op2 = j < ops2.length ? ops2[j] : null;
        }
      } else if (isInsert(op1) && isRetain(op2)) {
        // insert + retain: 保留 insert 的内容
        if (len1 > len2) {
          result.push(
            insert(
              op1.text.substring(0, len2),
              op2.attributes || op1.attributes
            )
          );
          op1 = insert(op1.text.substring(len2), op1.attributes);
          j++;
          op2 = j < ops2.length ? ops2[j] : null;
        } else if (len1 < len2) {
          result.push(insert(op1.text, op2.attributes || op1.attributes));
          op2 = retain(len2 - len1, op2.attributes);
          i++;
          op1 = i < ops1.length ? ops1[i] : null;
        } else {
          result.push(insert(op1.text, op2.attributes || op1.attributes));
          i++;
          j++;
          op1 = i < ops1.length ? ops1[i] : null;
          op2 = j < ops2.length ? ops2[j] : null;
        }
      } else if (isRetain(op1) && isDelete(op2)) {
        // retain + delete: 变成 delete
        if (len1 > len2) {
          result.push(deleteOp(len2));
          op1 = retain(len1 - len2, op1.attributes);
          j++;
          op2 = j < ops2.length ? ops2[j] : null;
        } else if (len1 < len2) {
          result.push(deleteOp(len1));
          op2 = deleteOp(len2 - len1);
          i++;
          op1 = i < ops1.length ? ops1[i] : null;
        } else {
          result.push(deleteOp(len1));
          i++;
          j++;
          op1 = i < ops1.length ? ops1[i] : null;
          op2 = j < ops2.length ? ops2[j] : null;
        }
      } else if (isRetain(op1) && isRetain(op2)) {
        // retain + retain: 还是 retain
        if (len1 > len2) {
          result.push(retain(len2, op2.attributes || op1.attributes));
          op1 = retain(len1 - len2, op1.attributes);
          j++;
          op2 = j < ops2.length ? ops2[j] : null;
        } else if (len1 < len2) {
          result.push(retain(len1, op2.attributes || op1.attributes));
          op2 = retain(len2 - len1, op2.attributes);
          i++;
          op1 = i < ops1.length ? ops1[i] : null;
        } else {
          result.push(retain(len1, op2.attributes || op1.attributes));
          i++;
          j++;
          op1 = i < ops1.length ? ops1[i] : null;
          op2 = j < ops2.length ? ops2[j] : null;
        }
      }
    } else if (op1) {
      // 只剩 ops1
      result.push(op1);
      i++;
      op1 = i < ops1.length ? ops1[i] : null;
    } else if (op2) {
      // 只剩 ops2 (应该不会发生，因为 ops2 应该作用于 ops1 的结果)
      result.push(op2);
      j++;
      op2 = j < ops2.length ? ops2[j] : null;
    }
  }

  return normalize(result);
}

// ==================== 辅助函数：规范化 ====================

/**
 * 规范化操作序列
 * - 合并相邻的相同类型操作
 * - 移除空操作
 */
export function normalize(operations: Operation[]): Operation[] {
  const result: Operation[] = [];

  for (const op of operations) {
    // 跳过空操作
    if (isInsert(op) && op.text.length === 0) continue;
    if ((isDelete(op) || isRetain(op)) && op.length === 0) continue;

    const last = result[result.length - 1];

    // 合并相邻的插入
    if (last && isInsert(last) && isInsert(op)) {
      result[result.length - 1] = insert(last.text + op.text, last.attributes);
      continue;
    }

    // 合并相邻的删除
    if (last && isDelete(last) && isDelete(op)) {
      result[result.length - 1] = deleteOp(last.length + op.length);
      continue;
    }

    // 合并相邻的保留（如果属性相同）
    if (
      last &&
      isRetain(last) &&
      isRetain(op) &&
      JSON.stringify(last.attributes) === JSON.stringify(op.attributes)
    ) {
      result[result.length - 1] = retain(
        last.length + op.length,
        last.attributes
      );
      continue;
    }

    result.push(op);
  }

  return result;
}

// ==================== 计算操作长度 ====================

/**
 * 计算操作序列的总长度（应用后的文档长度）
 */
export function length(operations: Operation[]): number {
  return operations.reduce((len, op) => {
    if (isInsert(op)) {
      return len + op.text.length;
    } else if (isRetain(op)) {
      return len + op.length;
    }
    return len;
  }, 0);
}

/**
 * 计算操作序列需要的原文档最小长度
 */
export function baseLength(operations: Operation[]): number {
  return operations.reduce((len, op) => {
    if (isDelete(op) || isRetain(op)) {
      return len + op.length;
    }
    return len;
  }, 0);
}
