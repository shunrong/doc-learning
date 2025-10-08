/**
 * Phase 3: 复用 Phase 2 的 Operation 基础函数
 */

import type { Operation, InsertOp, DeleteOp, RetainOp } from "./types";

export function isInsert(op: Operation): op is InsertOp {
  return op.type === "insert";
}

export function isDelete(op: Operation): op is DeleteOp {
  return op.type === "delete";
}

export function isRetain(op: Operation): op is RetainOp {
  return op.type === "retain";
}

/**
 * 将操作应用到文本
 */
export function apply(text: string, operations: Operation[]): string {
  let result = "";
  let textIndex = 0;

  for (const op of operations) {
    if (isInsert(op)) {
      result += op.text;
    } else if (isDelete(op)) {
      textIndex += op.length;
    } else if (isRetain(op)) {
      result += text.substring(textIndex, textIndex + op.length);
      textIndex += op.length;
    }
  }

  // 添加剩余的文本
  if (textIndex < text.length) {
    result += text.substring(textIndex);
  }

  return result;
}
