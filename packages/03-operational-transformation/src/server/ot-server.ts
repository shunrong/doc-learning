/**
 * Phase 3: OT 服务器逻辑
 *
 * 中央服务器负责：
 * 1. 接收客户端操作
 * 2. 排序操作（分配版本号）
 * 3. 广播给所有客户端
 */

import { apply } from "../operation";
import type { Operation } from "../types";

/**
 * 客户端连接信息
 */
interface ClientConnection {
  id: string;
  send: (message: unknown) => void;
}

/**
 * 操作历史记录
 */
interface OperationRecord {
  version: number;
  operations: Operation[];
  clientId: string;
  timestamp: number;
}

/**
 * OT 服务器
 */
export class OTServer {
  /** 当前文档内容 */
  private document: string;

  /** 当前版本号 */
  private version: number;

  /** 已连接的客户端 */
  private clients: Map<string, ClientConnection>;

  /** 操作历史 */
  private history: OperationRecord[];

  constructor(initialDoc: string = "") {
    this.document = initialDoc;
    this.version = 0;
    this.clients = new Map();
    this.history = [];
  }

  /**
   * 添加客户端连接
   */
  addClient(client: ClientConnection): void {
    this.clients.set(client.id, client);
    console.log(
      `[Server] 客户端连接: ${client.id}, 总数: ${this.clients.size}`
    );

    // 发送初始状态
    client.send({
      type: "init",
      clientId: client.id,
      version: this.version,
      document: this.document,
    });
  }

  /**
   * 移除客户端连接
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`[Server] 客户端断开: ${clientId}, 剩余: ${this.clients.size}`);
  }

  /**
   * 处理客户端操作
   */
  receiveOperation(clientId: string, operations: Operation[]): void {
    console.log(`[Server] 收到操作 from ${clientId}:`, operations);

    try {
      // 1. 应用操作到服务器文档
      this.document = apply(this.document, operations);

      // 2. 增加版本号
      this.version++;

      // 3. 记录历史
      this.history.push({
        version: this.version,
        operations,
        clientId,
        timestamp: Date.now(),
      });

      console.log(
        `[Server] 应用操作后, version: ${this.version}, 文档:`,
        this.document
      );

      // 4. 向发送者确认（ACK）
      const sender = this.clients.get(clientId);
      if (sender) {
        sender.send({
          type: "ack",
          version: this.version,
        });
      }

      // 5. 广播给其他客户端
      this.broadcast(
        {
          type: "operation",
          operations,
          version: this.version,
          clientId,
        },
        clientId
      );
    } catch (error) {
      console.error(`[Server] 应用操作失败:`, error);
      // 可以在这里发送错误消息给客户端
    }
  }

  /**
   * 广播消息给所有客户端（除了发送者）
   */
  private broadcast(message: unknown, excludeClientId?: string): void {
    let count = 0;
    for (const [clientId, client] of this.clients.entries()) {
      if (clientId !== excludeClientId) {
        client.send(message);
        count++;
      }
    }
    console.log(`[Server] 广播消息给 ${count} 个客户端`);
  }

  /**
   * 获取服务器状态
   */
  getState() {
    return {
      document: this.document,
      version: this.version,
      clientCount: this.clients.size,
      historyCount: this.history.length,
    };
  }

  /**
   * 获取操作历史
   */
  getHistory(): OperationRecord[] {
    return [...this.history];
  }
}
