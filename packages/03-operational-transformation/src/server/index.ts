/**
 * Phase 3: WebSocket 服务器
 *
 * 提供实时通信能力，连接客户端和 OT 服务器
 */

import { WebSocketServer, WebSocket } from "ws";
import { OTServer } from "./ot-server";
import type { Operation } from "../types";

const PORT = 8080;

// 创建 OT 服务器
const otServer = new OTServer(""); // 初始空文档

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket 服务器启动在端口 ${PORT}`);

// 客户端 ID 计数器
let clientIdCounter = 0;

wss.on("connection", (ws: WebSocket) => {
  // 分配客户端 ID
  const clientId = `client-${++clientIdCounter}`;

  console.log(`✅ 新客户端连接: ${clientId}`);

  // 添加到 OT 服务器
  otServer.addClient({
    id: clientId,
    send: (message: unknown) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },
  });

  // 处理客户端消息
  ws.on("message", (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "operation":
          // 客户端发送操作
          otServer.receiveOperation(
            clientId,
            message.operations as Operation[]
          );
          break;

        case "ping":
          // 心跳
          ws.send(JSON.stringify({ type: "pong" }));
          break;

        default:
          console.warn(`[Server] 未知消息类型: ${message.type}`);
      }
    } catch (error) {
      console.error(`[Server] 解析消息失败:`, error);
    }
  });

  // 处理断开连接
  ws.on("close", () => {
    console.log(`❌ 客户端断开: ${clientId}`);
    otServer.removeClient(clientId);
  });

  // 处理错误
  ws.on("error", (error) => {
    console.error(`[Server] WebSocket 错误 (${clientId}):`, error);
  });
});

// 定时打印服务器状态
setInterval(() => {
  const state = otServer.getState();
  console.log(`\n📊 服务器状态:`, state);
}, 30000); // 每 30 秒

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n\n🛑 关闭服务器...");
  wss.close(() => {
    console.log("✅ 服务器已关闭");
    process.exit(0);
  });
});
