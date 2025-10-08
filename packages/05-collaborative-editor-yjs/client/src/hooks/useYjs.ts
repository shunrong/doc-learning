/**
 * Yjs 集成 Hook
 *
 * 功能：
 * 1. 创建 Y.Doc（CRDT 文档）
 * 2. 连接 WebSocket Provider（实时协同）
 * 3. 连接 IndexedDB Provider（离线存储）
 * 4. 管理 Awareness（协作者状态）
 *
 * 对比 04 (手写 CRDT)：
 * - 04: 手动管理 RGA、字符 ID、afterId
 * - 05: Yjs 自动处理，只需配置 Provider
 */

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export interface UseYjsOptions {
  roomName: string; // 房间名（文档ID）
  serverUrl?: string; // WebSocket 服务器地址
  userName?: string; // 用户名
  userColor: string; // 用户颜色（用于光标）- 必须传入以避免无限循环
}

export interface UseYjsReturn {
  ydoc: Y.Doc | null; // Yjs 文档
  provider: WebsocketProvider | null; // WebSocket Provider
  idbProvider: IndexeddbPersistence | null; // IndexedDB Provider
  synced: boolean; // 是否已同步
  connected: boolean; // 是否已连接
}

/**
 * 使用 Yjs 进行协同编辑
 */
export function useYjs(options: UseYjsOptions): UseYjsReturn {
  const {
    roomName,
    serverUrl = "ws://localhost:1234",
    userName = "匿名用户",
    userColor,
  } = options;

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [idbProvider, setIdbProvider] = useState<IndexeddbPersistence | null>(
    null
  );
  const [synced, setSynced] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log("🚀 初始化 Yjs...");
    console.log(`   房间: ${roomName}`);
    console.log(`   服务器: ${serverUrl}`);
    console.log(`   用户: ${userName}`);

    // 1. 创建 Yjs 文档
    // 对比 04：这相当于创建 RGA 实例
    const doc = new Y.Doc({ guid: roomName });
    setYdoc(doc);

    // 2. 创建 WebSocket Provider（实时协同）
    // 这会：
    // - 连接到 WebSocket 服务器
    // - 自动同步文档状态
    // - 自动发送/接收更新
    // - 自动处理断线重连
    const wsProvider = new WebsocketProvider(serverUrl, roomName, doc, {
      connect: true, // 立即连接
    });

    setProvider(wsProvider);

    // 3. 设置 Awareness（协作者状态）
    // 用于显示：
    // - 远程光标
    // - 在线用户列表
    // - 用户信息
    wsProvider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
    });

    // 4. 创建 IndexedDB Provider（离线存储）
    // 这会：
    // - 将文档保存到 IndexedDB
    // - 监听文档变化，自动保存
    // - 页面刷新时自动加载
    // - 离线时仍然可以编辑
    const persistence = new IndexeddbPersistence(roomName, doc);
    setIdbProvider(persistence);

    // 5. 监听同步状态
    wsProvider.on("sync", (isSynced: boolean) => {
      console.log(isSynced ? "✅ 已同步" : "⏳ 同步中...");
      setSynced(isSynced);
    });

    wsProvider.on("status", ({ status }: { status: string }) => {
      console.log(`📡 连接状态: ${status}`);
      setConnected(status === "connected");
    });

    persistence.on("synced", () => {
      console.log("💾 IndexedDB 已同步");
    });

    // 6. 监听错误
    wsProvider.on("connection-error", (error: Error) => {
      console.error("❌ WebSocket 连接错误:", error);
    });

    // 7. 清理函数
    return () => {
      console.log("🧹 清理 Yjs 资源...");
      wsProvider.disconnect();
      wsProvider.destroy();
      persistence.destroy();
      doc.destroy();
    };
  }, [roomName, serverUrl, userName, userColor]);

  return {
    ydoc,
    provider,
    idbProvider,
    synced,
    connected,
  };
}

/**
 * 对比说明：
 *
 * 04 (手写 CRDT) 需要做的事情：
 * ```typescript
 * const rga = new RGA('user-id');
 *
 * // 插入时
 * const op = rga.insert(position, 'H');
 * sendToServer(op);  // 手动发送
 *
 * // 接收时
 * socket.on('operation', (op) => {
 *   rga.applyOperation(op);  // 手动应用
 *   updateUI();              // 手动更新 UI
 * });
 * ```
 *
 * 05 (Yjs) 需要做的事情：
 * ```typescript
 * const { ydoc, provider } = useYjs({ roomName: 'doc-1' });
 *
 * // 就这样！Yjs 自动处理：
 * // - 发送更新
 * // - 接收更新
 * // - 合并 CRDT
 * // - 更新 UI
 * // - 离线存储
 * // - 断线重连
 * ```
 *
 * 简洁度：10 倍以上！
 */
