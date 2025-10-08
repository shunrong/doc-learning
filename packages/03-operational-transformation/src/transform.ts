/**
 * Phase 3: Operational Transformation - Transform 函数实现
 *
 * Transform 是 OT 的核心：将一个操作转换以适应另一个并发操作
 */

import type { Operation, InsertOp, DeleteOp, RetainOp, Side } from "./types";

// ==================== 类型守卫 ====================

export function isInsert(op: Operation): op is InsertOp {
  return op.type === "insert";
}

export function isDelete(op: Operation): op is DeleteOp {
  return op.type === "delete";
}

export function isRetain(op: Operation): op is RetainOp {
  return op.type === "retain";
}

// ==================== 辅助函数 ====================

export function insert(
  text: string,
  attributes?: Record<string, any>
): InsertOp {
  return { type: "insert", text, attributes };
}

export function deleteOp(length: number): DeleteOp {
  return { type: "delete", length };
}

export function retain(
  length: number,
  attributes?: Record<string, any>
): RetainOp {
  return { type: "retain", length, attributes };
}

// ==================== 核心：Transform 函数 ====================

/**
 * Transform 操作
 *
 * 将 op1 转换以适应 op2 已经被应用的情况
 *
 * 关键理解：
 * - op1 和 op2 都是基于同一个原始文档的
 * - transform(op1, op2, side) 返回 op1'，使得：
 *   apply(apply(doc, op2), op1') === apply(apply(doc, op1), transform(op2, op1, other_side))
 *
 * @param op1 - 需要被转换的操作
 * @param op2 - 已经应用的操作
 * @param side - 处理同位置插入的优先级
 * @returns 转换后的操作
 */
export function transform(
  op1: Operation[],
  op2: Operation[],
  side: Side
): Operation[] {
  const result: Operation[] = [];

  let i = 0; // op1 的索引
  let j = 0; // op2 的索引

  // 当前操作的剩余部分
  let o1: Operation | null = i < op1.length ? op1[i] : null;
  let o2: Operation | null = j < op2.length ? op2[j] : null;

  while (o1 || o2) {
    // Case 1: o1 是 Insert
    if (o1 && isInsert(o1)) {
      // o1 的 insert 始终保留到结果中
      result.push(insert(o1.text, o1.attributes));
      i++;
      o1 = i < op1.length ? op1[i] : null;
    }
    // Case 2: o2 是 Insert
    else if (o2 && isInsert(o2)) {
      // o2 插入了内容，o1 需要用 retain 跳过这些内容
      if (side === "left") {
        // side=left 时，o1 的后续操作需要跳过 o2 的插入
        result.push(retain(o2.text.length));
      } else {
        // side=right 时，o1 的后续操作也需要跳过 o2 的插入
        result.push(retain(o2.text.length));
      }
      j++;
      o2 = j < op2.length ? op2[j] : null;
    }
    // Case 3: o1 和 o2 都不是 Insert
    else if (o1 && o2) {
      const len1 = isDelete(o1) ? o1.length : (o1 as RetainOp).length;
      const len2 = isDelete(o2) ? o2.length : (o2 as RetainOp).length;

      if (isDelete(o1) && isDelete(o2)) {
        // Delete vs Delete: 它们都删除同一部分
        if (len1 > len2) {
          // o1 删除更多，剩余部分继续
          o1 = deleteOp(len1 - len2);
          j++;
          o2 = j < op2.length ? op2[j] : null;
        } else if (len1 < len2) {
          // o2 删除更多，剩余部分继续
          o2 = deleteOp(len2 - len1);
          i++;
          o1 = i < op1.length ? op1[i] : null;
        } else {
          // 长度相等，都消耗完
          i++;
          j++;
          o1 = i < op1.length ? op1[i] : null;
          o2 = j < op2.length ? op2[j] : null;
        }
      } else if (isDelete(o1) && isRetain(o2)) {
        // Delete vs Retain: o1 删除，o2 保留，o1 的删除保留
        const minLen = Math.min(len1, len2);
        result.push(deleteOp(minLen));

        if (len1 > len2) {
          o1 = deleteOp(len1 - len2);
          j++;
          o2 = j < op2.length ? op2[j] : null;
        } else if (len1 < len2) {
          o2 = retain(len2 - len1, o2.attributes);
          i++;
          o1 = i < op1.length ? op1[i] : null;
        } else {
          i++;
          j++;
          o1 = i < op1.length ? op1[i] : null;
          o2 = j < op2.length ? op2[j] : null;
        }
      } else if (isRetain(o1) && isDelete(o2)) {
        // Retain vs Delete: o2 已删除，o1 的 retain 跳过这部分
        if (len1 > len2) {
          o1 = retain(len1 - len2, o1.attributes);
          j++;
          o2 = j < op2.length ? op2[j] : null;
        } else if (len1 < len2) {
          o2 = deleteOp(len2 - len1);
          i++;
          o1 = i < op1.length ? op1[i] : null;
        } else {
          i++;
          j++;
          o1 = i < op1.length ? op1[i] : null;
          o2 = j < op2.length ? op2[j] : null;
        }
      } else if (isRetain(o1) && isRetain(o2)) {
        // Retain vs Retain: 都保留
        const minLen = Math.min(len1, len2);
        result.push(retain(minLen, o2.attributes || o1.attributes));

        if (len1 > len2) {
          o1 = retain(len1 - len2, o1.attributes);
          j++;
          o2 = j < op2.length ? op2[j] : null;
        } else if (len1 < len2) {
          o2 = retain(len2 - len1, o2.attributes);
          i++;
          o1 = i < op1.length ? op1[i] : null;
        } else {
          i++;
          j++;
          o1 = i < op1.length ? op1[i] : null;
          o2 = j < op2.length ? op2[j] : null;
        }
      }
    } else if (o1) {
      // 只剩 o1
      result.push(o1);
      i++;
      o1 = i < op1.length ? op1[i] : null;
    } else if (o2) {
      // 只剩 o2
      if (isInsert(o2)) {
        result.push(retain((o2 as InsertOp).text.length));
      }
      j++;
      o2 = j < op2.length ? op2[j] : null;
    }
  }

  return normalize(result);
}

// ==================== 辅助：规范化 ====================

function normalize(operations: Operation[]): Operation[] {
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

    // 合并相邻的保留
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
