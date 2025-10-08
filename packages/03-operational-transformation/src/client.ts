/**
 * Phase 3: OT 客户端状态管理
 *
 * 管理客户端的文档状态、未确认操作、和服务器同步
 */

import { apply } from "./operation";
import { transform } from "./transform";
import type { Operation } from "./types";

/**
 * 客户端状态
 */
export class OTClient {
  /** 客户端 ID */
  public clientId: string;

  /** 当前文档内容 */
  public document: string;

  /** 当前版本号（与服务器同步） */
  public version: number;

  /** 未确认的本地操作（等待服务器确认） */
  private pending: Operation[][] = [];

  /** 操作历史（用于调试和展示） */
  public history: Array<{ ops: Operation[]; source: "local" | "remote" }> = [];

  constructor(clientId: string, initialDoc: string = "") {
    this.clientId = clientId;
    this.document = initialDoc;
    this.version = 0;
  }

  /**
   * 应用本地编辑
   * @param operations - 本地操作
   */
  applyLocalOperation(operations: Operation[]): void {
    // 1. 应用到本地文档
    this.document = apply(this.document, operations);

    // 2. 添加到未确认队列
    this.pending.push(operations);

    // 3. 记录历史
    this.history.push({ ops: operations, source: "local" });

    console.log(`[Client ${this.clientId}] 本地编辑:`, operations);
    console.log(`[Client ${this.clientId}] 文档:`, this.document);
  }

  /**
   * 收到服务器确认（ACK）
   * @param version - 服务器版本号
   */
  serverAck(version: number): void {
    if (this.pending.length === 0) {
      console.warn(`[Client ${this.clientId}] 收到 ACK 但没有待确认操作`);
      return;
    }

    // 移除第一个待确认操作
    this.pending.shift();
    this.version = version;

    console.log(
      `[Client ${this.clientId}] 收到 ACK, version: ${version}, pending: ${this.pending.length}`
    );
  }

  /**
   * 收到远程操作
   * @param operations - 远程操作
   * @param serverVersion - 服务器版本号
   */
  applyRemoteOperation(operations: Operation[], serverVersion: number): void {
    console.log(`[Client ${this.clientId}] 收到远程操作:`, operations);

    // 1. Transform 远程操作以适应本地未确认的操作
    let transformed = operations;
    for (const pendingOp of this.pending) {
      transformed = transform(transformed, pendingOp, "right");
    }

    // 2. 应用转换后的操作
    this.document = apply(this.document, transformed);

    // 3. Transform 所有待确认的操作
    const newPending: Operation[][] = [];
    for (const pendingOp of this.pending) {
      const transformedPending = transform(pendingOp, operations, "left");
      newPending.push(transformedPending);
    }
    this.pending = newPending;

    // 4. 更新版本号
    this.version = serverVersion;

    // 5. 记录历史
    this.history.push({ ops: transformed, source: "remote" });

    console.log(
      `[Client ${this.clientId}] 应用远程操作后, 文档:`,
      this.document
    );
  }

  /**
   * 获取待确认的操作
   */
  getPendingOperations(): Operation[][] {
    return [...this.pending];
  }

  /**
   * 获取当前状态（用于调试）
   */
  getState() {
    return {
      clientId: this.clientId,
      document: this.document,
      version: this.version,
      pendingCount: this.pending.length,
      historyCount: this.history.length,
    };
  }
}
