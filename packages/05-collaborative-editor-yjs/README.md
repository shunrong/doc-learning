# Phase 6: 协同编辑器 (Yjs + Tiptap)

> **终于到了！** 一个真正可用的、生产级的协同编辑应用 🎉

## 🎯 学习目标

通过本阶段，你将：
- ✅ 掌握 Yjs（最成熟的 CRDT 库）的使用
- ✅ 掌握 Tiptap（现代化编辑器框架）的集成
- ✅ 理解 WebSocket Provider（实时协同）
- ✅ 理解 IndexedDB Provider（离线编辑）
- ✅ 实现远程光标和用户列表
- ✅ 对比 OT 和 CRDT 的实战差异

## 🚀 快速开始

### 1. 安装依赖

```bash
# 在项目根目录
cd packages/05-collaborative-editor-yjs

# 安装前端依赖
cd client && pnpm install

# 安装后端依赖
cd ../server && pnpm install
```

### 2. 启动服务器

```bash
# 在 server 目录
pnpm dev
```

你会看到：
```
🚀 Yjs WebSocket Server 启动成功！
📡 监听端口: 1234
🔗 客户端连接地址: ws://localhost:1234
```

### 3. 启动前端

```bash
# 在 client 目录（新终端）
pnpm dev
```

访问 `http://localhost:5173`

### 4. 体验协同编辑

**方式 1：多标签页**
1. 打开多个浏览器标签页
2. 访问相同 URL（相同房间）
3. 在任意标签页输入文字
4. 看到其他标签页实时更新 ✨

**方式 2：不同房间**
```
http://localhost:5173?room=room1&name=Alice
http://localhost:5173?room=room1&name=Bob
http://localhost:5173?room=room2&name=Charlie
```

Alice 和 Bob 在同一房间，可以协同
Charlie 在不同房间，独立编辑

**方式 3：离线编辑**
1. 打开浏览器，开始编辑
2. 打开开发者工具，Network → Offline
3. 继续编辑（会保存到 IndexedDB）
4. 恢复网络连接
5. 自动同步！✅

## 📁 项目结构

```
05-collaborative-editor-yjs/
├── client/                    # 前端（React + Vite）
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.tsx         # Tiptap 编辑器
│   │   │   ├── Editor.css
│   │   │   ├── UserList.tsx       # 在线用户列表
│   │   │   ├── UserList.css
│   │   │   ├── StatusBar.tsx      # 状态栏
│   │   │   └── StatusBar.css
│   │   ├── hooks/
│   │   │   └── useYjs.ts          # Yjs 集成 Hook
│   │   ├── App.tsx                # 主应用
│   │   ├── App.css
│   │   └── main.tsx
│   └── package.json
├── server/                    # 后端（Node.js + WebSocket）
│   ├── server.js                  # Yjs WebSocket 服务器
│   └── package.json
├── docs/
│   ├── 01-architecture.md         # 架构说明
│   ├── 02-ot-vs-crdt-practice.md # OT vs CRDT 实战对比
│   └── 03-yjs-deep-dive.md       # Yjs 深入解析
└── README.md
```

## 🔑 核心代码解析

### 1. Yjs 初始化（useYjs Hook）

```typescript
// client/src/hooks/useYjs.ts

// 创建 Yjs 文档（CRDT）
const doc = new Y.Doc();

// WebSocket Provider（实时协同）
const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  roomName,
  doc
);

// IndexedDB Provider（离线存储）
const persistence = new IndexeddbPersistence(roomName, doc);

// Awareness（协作者状态）
wsProvider.awareness.setLocalStateField('user', {
  name: userName,
  color: userColor,
});
```

**就这么简单！** 对比 Phase 3 (OT)，我们需要手写：
- Transform 函数（235 行）
- OT Client（200 行）
- OT Server（164 行）

现在只需要**几行配置**！

### 2. Tiptap 编辑器集成

```typescript
// client/src/components/Editor.tsx

const editor = useEditor({
  extensions: [
    StarterKit,              // 基础功能
    Collaboration.configure({
      document: ydoc,        // 绑定 Yjs 文档
    }),
    CollaborationCursor.configure({
      provider: wsProvider,  // 绑定 WebSocket
      user: { name, color },
    }),
  ],
});
```

**数据流向**：
```
用户输入 → Tiptap → Collaboration 扩展 → Yjs → WebSocket → 其他用户
         ↓
         IndexedDB（本地持久化）
```

### 3. Yjs 服务器

```javascript
// server/server.js

import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);  // 就这一行！
});
```

**Yjs 自动处理**：
- ✅ 房间管理
- ✅ 状态同步
- ✅ 消息转发
- ✅ Awareness 同步
- ✅ 错误处理

## 🆚 与 Phase 3 (OT) 的对比

| 维度 | Phase 3 (OT) | Phase 6 (Yjs CRDT) |
|------|--------------|-------------------|
| **实时协同** | ✅ 手动实现 Transform | ✅ Yjs 自动处理 |
| **离线编辑** | ❌ 需要大量代码 | ✅ IndexedDB Provider |
| **远程光标** | ❌ 未实现 | ✅ CollaborationCursor |
| **代码量** | ~800 行 | ~300 行 |
| **核心算法** | Transform (235行) | Yjs (调用) |
| **服务器** | 手写 OT Server | setupWSConnection |
| **数据量** | 小（~11 字节） | 大但优化（~20 字节）|
| **学习曲线** | 陡峭（Transform 难） | 平缓（配置即用）|

### 实现复杂度对比

**Phase 3 (OT) 需要实现**：
```typescript
// 1. Transform 函数（最难）
function transform(op1, op2, side) {
  // Insert vs Insert
  // Insert vs Delete
  // Delete vs Delete
  // Retain vs ...
  // 处理所有边界情况
}

// 2. OT Client
class OTClient {
  pending = [];
  applyLocalOperation(op) { /* ... */ }
  applyRemoteOperation(op) { /* transform */ }
  serverAck() { /* ... */ }
}

// 3. OT Server
class OTServer {
  version = 0;
  history = [];
  receiveOperation(op) { /* 版本管理、广播 */ }
}
```

**Phase 6 (Yjs) 只需配置**：
```typescript
// 1. 初始化 Yjs
const ydoc = new Y.Doc();
const provider = new WebsocketProvider('ws://...', room, ydoc);

// 2. 绑定编辑器
const editor = useEditor({
  extensions: [Collaboration.configure({ document: ydoc })],
});

// 3. 启动服务器
setupWSConnection(ws, req);

// 完成！✅
```

## 🎓 学习要点

### 1. Yjs 的 CRDT 实现

Yjs 使用 **YATA** (Yet Another Transformation Approach) 算法：
- 比我们的 RGA（Phase 4）优化 10-100 倍
- 块级存储（多个字符一个块）
- 增量编码（压缩更新）
- 垃圾回收（清理墓碑）

### 2. Provider 架构

Yjs 的 Provider 模式非常灵活：
```
Y.Doc (核心 CRDT)
  ↓
Provider 层（可插拔）
  ├── WebsocketProvider  （实时协同）
  ├── IndexeddbPersistence（本地存储）
  ├── y-webrtc           （P2P 协同）
  └── 自定义 Provider    （如 Firebase）
```

### 3. Awareness API

协作者状态（不属于文档内容）：
- 光标位置
- 选区
- 用户信息
- 在线状态

使用 **临时状态**（CRDT-like，但会自动清理）

## 🚧 进阶功能

### 添加更多功能

**1. P2P 协同（无需服务器）**：
```bash
pnpm add y-webrtc
```

```typescript
import { WebrtcProvider } from 'y-webrtc';

const webrtcProvider = new WebrtcProvider(roomName, ydoc);
```

**2. 版本历史**：
```typescript
import { UndoManager } from 'yjs';

const undoManager = new UndoManager(ytext);
```

**3. 评论功能**：
使用 `Y.Map` 存储评论：
```typescript
const comments = ydoc.getMap('comments');
comments.set(commentId, { text, author, ... });
```

## 🐛 常见问题

### Q1: 服务器启动失败？

确保端口 1234 没有被占用：
```bash
lsof -i :1234
# 如果有进程，kill 掉或换端口
```

### Q2: 前端连接不上服务器？

检查服务器是否在运行：
```bash
# 应该看到 WebSocket Server 启动成功
```

### Q3: 离线编辑不工作？

检查浏览器是否支持 IndexedDB（所有现代浏览器都支持）

### Q4: 多标签页看不到实时更新？

确保使用相同的 `room` 参数

## 📚 扩展阅读

- [Yjs 官方文档](https://docs.yjs.dev/)
- [Tiptap 官方文档](https://tiptap.dev/)
- [YATA 算法论文](https://www.researchgate.net/publication/310212186_Near_Real-Time_Peer-to-Peer_Shared_Editing_on_Extensible_Data_Types)

## 🎉 恭喜！

你已经完成了：
- ✅ Phase 1: 富文本基础
- ✅ Phase 2: 数据模型
- ✅ Phase 3: OT 实现（手写）
- ✅ Phase 4: CRDT 原理（手写）
- ✅ **Phase 6: 生产级协同编辑器**

**你现在拥有**：
- 深度的理论理解（OT + CRDT）
- 手写的实现经验
- 生产级工具的使用能力
- 完整的作品展示

---

**下一步**：
- 阅读 `docs/` 中的深入文档
- 尝试添加更多功能
- 部署到生产环境
- 或者，庆祝一下！🎊

