/**
 * Phase 3: OT 类型定义
 * 复用 Phase 2 的 Operation 类型
 */

// 操作属性（格式化信息）
export type Attributes = Record<string, any>;

// 插入操作
export interface InsertOp {
  type: "insert";
  text: string;
  attributes?: Attributes;
}

// 删除操作
export interface DeleteOp {
  type: "delete";
  length: number;
}

// 保留操作
export interface RetainOp {
  type: "retain";
  length: number;
  attributes?: Attributes;
}

// 操作联合类型
export type Operation = InsertOp | DeleteOp | RetainOp;

/**
 * Transform 的 side 参数
 * - "left": 当两个 insert 在同一位置时，这个操作排在前面
 * - "right": 当两个 insert 在同一位置时，这个操作排在后面
 */
export type Side = "left" | "right";

/**
 * 客户端状态
 */
export interface ClientState {
  /** 客户端 ID */
  id: string;
  /** 当前文档内容 */
  document: string;
  /** 当前版本号 */
  version: number;
  /** 未确认的本地操作（等待服务器确认） */
  pending: Operation[][];
  /** 操作历史 */
  history: Operation[][];
}

/**
 * 服务器消息类型
 */
export interface ServerMessage {
  type: "init" | "ack" | "operation";
  clientId?: string;
  version?: number;
  document?: string;
  operations?: Operation[];
}

/**
 * 客户端消息类型
 */
export interface ClientMessage {
  type: "operation";
  operations: Operation[];
}
