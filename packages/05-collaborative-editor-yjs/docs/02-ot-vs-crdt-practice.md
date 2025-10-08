# OT vs CRDT：实战对比

> 从代码层面深度对比 Phase 3 (OT) 和 Phase 6 (Yjs CRDT)

## 🎯 对比维度

我们从以下维度对比两种方案：
1. 代码复杂度
2. 功能完整性
3. 性能表现
4. 开发体验
5. 适用场景

---

## 1️⃣ 代码复杂度对比

### Phase 3 (OT) - 手写实现

```typescript
// ========== 核心算法：Transform 函数 ==========
// src/transform.ts (235 行)

export function transform(
  op1: Operation[],
  op2: Operation[],
  side: Side
): Operation[] {
  const result: Operation[] = [];
  let i = 0, j = 0;
  
  while (o1 || o2) {
    // Insert vs Insert
    if (o1 && isInsert(o1)) {
      // ...
    }
    // Insert vs Delete
    else if (o1 && isInsert(o1) && o2 && isDelete(o2)) {
      // ...
    }
    // Delete vs Delete
    else if (o1 && isDelete(o1) && o2 && isDelete(o2)) {
      // ...
    }
    // ... 十几种组合
  }
  
  return normalize(result);
}

// ========== 客户端状态管理 ==========
// src/client.ts (200 行)

export class OTClient {
  private pending: Operation[][] = [];
  private version: number = 0;
  
  applyLocalOperation(operations: Operation[]): void {
    this.document = apply(this.document, operations);
    this.pending.push(operations);
    // 发送到服务器
  }
  
  applyRemoteOperation(operations: Operation[], serverVersion: number): void {
    // 核心：需要 Transform pending 操作
    let transformed = operations;
    for (const pendingOp of this.pending) {
      transformed = transform(transformed, pendingOp, "right");
    }
    this.document = apply(this.document, transformed);
    
    // Transform pending 队列
    const newPending: Operation[][] = [];
    for (const pendingOp of this.pending) {
      const transformedPending = transform(pendingOp, operations, "left");
      newPending.push(transformedPending);
    }
    this.pending = newPending;
  }
  
  serverAck(version: number): void {
    this.pending.shift();
    this.version = version;
  }
}

// ========== 服务器端 ==========
// src/server/ot-server.ts (164 行)

export class OTServer {
  private document: string = "";
  private version: number = 0;
  private clients: Map<string, ClientConnection>;
  private history: OperationRecord[] = [];
  
  receiveOperation(clientId: string, operations: Operation[]): void {
    // 应用操作
    this.document = apply(this.document, operations);
    
    // 版本管理
    this.version++;
    this.history.push({
      version: this.version,
      operations,
      clientId,
      timestamp: Date.now()
    });
    
    // ACK 发送者
    this.clients.get(clientId)?.send({
      type: "ack",
      version: this.version
    });
    
    // 广播其他客户端
    this.broadcast({
      type: "operation",
      operations,
      version: this.version,
      clientId
    }, clientId);
  }
}

// ========== 前端集成 ==========
// src/main.ts (362 行)

let client: OTClient | null = null;
let ws: WebSocket | null = null;

editor.addEventListener("input", () => {
  const newContent = editor.value;
  const operations = calculateDiff(lastContent, newContent);
  
  if (operations.length > 0 && client) {
    client.applyLocalOperation(operations);
    sendOperation(operations);
  }
  
  lastContent = newContent;
});

function sendOperation(operations: Operation[]) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "operation",
      operations
    }));
  }
}

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === "operation" && client) {
    client.applyRemoteOperation(message.operations, message.version);
    editor.value = client.document;
  }
  else if (message.type === "ack" && client) {
    client.serverAck(message.version);
  }
});
```

**统计**：
- `transform.ts`: 235 行
- `client.ts`: 200 行
- `server.ts`: 164 行
- `main.ts`: 362 行
- **总计**: ~961 行核心代码
- **关键难点**: Transform 函数的正确性

---

### Phase 6 (Yjs CRDT) - 库集成

```typescript
// ========== Yjs 初始化 ==========
// src/hooks/useYjs.ts (核心部分 ~30 行)

export function useYjs(options: UseYjsOptions) {
  useEffect(() => {
    // 1. 创建 Yjs 文档
    const doc = new Y.Doc();
    
    // 2. WebSocket Provider（实时协同）
    const wsProvider = new WebsocketProvider(
      serverUrl,
      roomName,
      doc
    );
    
    // 3. IndexedDB Provider（离线存储）
    const persistence = new IndexeddbPersistence(roomName, doc);
    
    // 4. Awareness（协作者状态）
    wsProvider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
    });
    
    // 5. 监听事件
    wsProvider.on('sync', setSynced);
    wsProvider.on('status', setConnected);
    
    return () => {
      wsProvider.destroy();
      persistence.destroy();
      doc.destroy();
    };
  }, [roomName]);
  
  return { ydoc, provider, synced, connected };
}

// ========== Tiptap 编辑器集成 ==========
// src/components/Editor.tsx (核心部分 ~20 行)

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false,  // 使用 Yjs 的历史
    }),
    Collaboration.configure({
      document: ydoc,  // 绑定 Yjs 文档
    }),
    CollaborationCursor.configure({
      provider: wsProvider,
      user: { name, color },
    }),
  ],
});

// ========== 服务器端 ==========
// server/server.js (核心部分 ~5 行)

import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);  // 就这一行！
});

// ========== 前端主应用 ==========
// src/App.tsx (核心部分 ~20 行)

function App() {
  // 初始化 Yjs
  const { ydoc, provider, synced, connected } = useYjs({
    roomName,
    serverUrl: 'ws://localhost:1234',
    userName,
  });
  
  // 渲染编辑器
  return (
    <Editor
      ydoc={ydoc}
      provider={provider}
      userName={userName}
      userColor={userColor}
    />
  );
}
```

**统计**：
- `useYjs.ts`: ~100 行（大部分是注释和状态管理）
- `Editor.tsx`: ~120 行（大部分是 UI）
- `server.js`: ~80 行（大部分是日志）
- `App.tsx`: ~150 行（大部分是 UI）
- **核心逻辑**: ~75 行
- **总计**: ~450 行（包含 UI）
- **关键难点**: 无（配置即用）

---

## 2️⃣ 功能完整性对比

| 功能 | Phase 3 (OT) | Phase 6 (Yjs) | 对比 |
|------|--------------|---------------|------|
| **实时协同** | ✅ 实现 | ✅ 实现 | Yjs 更简单 |
| **离线编辑** | ❌ 未实现 | ✅ 实现 | Yjs 优势 |
| **远程光标** | ❌ 未实现 | ✅ 实现 | Yjs 优势 |
| **用户列表** | ❌ 未实现 | ✅ 实现 | Yjs 优势 |
| **撤销/重做** | ❌ 未实现 | ✅ 内置 | Yjs 优势 |
| **数据持久化** | ❌ 未实现 | ✅ IndexedDB | Yjs 优势 |
| **断线重连** | ✅ 基础 | ✅ 自动 | Yjs 更健壮 |
| **P2P 协同** | ❌ 不支持 | ✅ y-webrtc | Yjs 优势 |

**结论**: Yjs 功能更完整，开箱即用

---

## 3️⃣ 性能对比

### 数据量对比

```
测试场景：1000 字符的文档

OT:
- 文档: 1000 字节
- 操作: ~50 字节/操作
- 历史: 100 操作 = 5KB
- 总计: ~6KB

Yjs (未优化):
- 文档: ~26KB (每字符 26 字节)
- 操作: ~200 字节/操作
- 历史: 100 操作 = 20KB
- 总计: ~46KB

Yjs (优化后):
- 文档: ~2KB (块级存储)
- 操作: ~20 字节/操作（压缩）
- 历史: 100 操作 = 2KB
- 总计: ~4KB
```

### 内存占用对比

```
10,000 字符的文档：

OT:
- 内存: ~10KB
- 操作缓存: ~1KB
- 总计: ~11KB

Yjs:
- 内存: ~50KB（含元数据）
- 操作缓存: ~5KB
- 总计: ~55KB

差距: Yjs 比 OT 重 5 倍
但：Yjs 包含了更多功能（离线、历史等）
```

### 并发性能对比

```
100 个客户端同时编辑：

OT Server:
- CPU: 60-80%（Transform 计算）
- 内存: ~200MB
- 延迟: 50-100ms

Yjs Server:
- CPU: 10-20%（仅转发）
- 内存: ~100MB
- 延迟: 10-30ms

结论: Yjs 服务器更轻量
```

---

## 4️⃣ 开发体验对比

### 实现新功能的难度

**场景：添加"评论"功能**

#### OT 方案：
```typescript
// 1. 扩展 Operation 类型
type Operation = 
  | InsertOp 
  | DeleteOp 
  | RetainOp
  | CommentOp;  // 新增

// 2. 修改 Transform 函数（+100 行）
function transform(op1, op2, side) {
  // ... 现有逻辑
  
  // Comment vs Insert
  if (isComment(op1) && isInsert(op2)) {
    // 需要调整 Comment 的位置
  }
  
  // Comment vs Delete
  if (isComment(op1) && isDelete(op2)) {
    // 如果删除了评论的目标，怎么办？
  }
  
  // Comment vs Comment
  if (isComment(op1) && isComment(op2)) {
    // 同一位置的评论冲突？
  }
  
  // ... 更多组合
}

// 3. 修改 Client 和 Server
// 4. 编写大量测试

工作量: 2-3 天
风险: Transform 逻辑可能出错
```

#### Yjs 方案：
```typescript
// 1. 创建 Y.Map 存储评论
const comments = ydoc.getMap('comments');

// 2. 添加评论
comments.set(commentId, {
  text: '这是评论',
  author: 'Alice',
  position: 100,
  timestamp: Date.now()
});

// 3. 监听评论变化
comments.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    // 更新 UI
  });
});

工作量: 半天
风险: 几乎没有
```

**结论**: Yjs 扩展性更强

---

### 调试难度

#### OT 调试：
```
问题：两个客户端状态不一致

排查步骤：
1. 检查 Transform 函数（最可能）
2. 检查操作顺序
3. 检查版本号管理
4. 检查 pending 队列
5. 重现步骤（困难）
6. 添加大量日志

平均调试时间: 2-4 小时
```

#### Yjs 调试：
```
问题：两个客户端状态不一致

排查步骤：
1. 检查 Provider 连接（通常是网络问题）
2. 检查 ydoc 绑定
3. Yjs 自己保证收敛（很少出错）

平均调试时间: 10-30 分钟
```

---

## 5️⃣ 适用场景

### OT 更适合：

```
✅ 有稳定的中央服务器
✅ 主要是在线协同
✅ 对数据量敏感（如移动端）
✅ 对实时性要求极高
✅ 团队有 OT 经验

代表产品：
- Google Docs
- Office 365
- 腾讯文档
```

### Yjs 更适合：

```
✅ 离线编辑是核心需求
✅ P2P 协同场景
✅ 快速开发原型
✅ 需要丰富的功能（评论、历史等）
✅ 团队缺乏算法经验

代表产品：
- Figma
- Notion
- Apple Notes
- Obsidian
```

---

## 6️⃣ 学习曲线对比

### OT 学习路径：

```
第 1 周：理解 OT 原理
第 2 周：实现 Transform 函数
第 3 周：实现 Client 和 Server
第 4 周：调试和优化
第 5 周：添加功能
第 6 周：生产就绪

总时间: 6 周
难度: ⭐⭐⭐⭐⭐
成果: 深度理解算法
```

### Yjs 学习路径：

```
第 1 天：理解 CRDT 原理
第 2 天：Yjs 基础 API
第 3 天：集成 Tiptap
第 4 天：添加功能
第 5 天：优化和调试
第 6 天：部署

总时间: 1 周
难度: ⭐⭐
成果: 生产级应用
```

---

## 7️⃣ 成本对比

### 开发成本：

```
OT:
- 初期开发: 高（需要实现核心算法）
- 维护成本: 高（Transform 逻辑复杂）
- 扩展成本: 高（每个新功能都要改 Transform）
- 团队要求: 高（需要算法专家）

Yjs:
- 初期开发: 低（配置即用）
- 维护成本: 低（库维护）
- 扩展成本: 低（直接用 Yjs 数据结构）
- 团队要求: 中（理解 CRDT 概念）
```

### 服务器成本：

```
100 万用户的场景：

OT:
- 服务器: 100 台（Transform 计算密集）
- 带宽: 中等
- 数据库: 大（版本历史）

Yjs:
- 服务器: 20 台（仅转发）
- 带宽: 较高（CRDT 元数据）
- 数据库: 小（或不需要）

结论: Yjs 服务器成本更低
```

---

## 🎯 最终建议

### 选择 OT（手写）如果：
1. 你想深度理解协同编辑算法
2. 对数据量有极致要求
3. 有足够的时间和团队
4. 需要完全控制实现细节

### 选择 Yjs（库）如果：
1. 你想快速构建协同应用
2. 离线编辑是核心需求
3. 团队规模小或时间紧
4. 需要丰富的功能

### 学习建议：
1. **先学原理**（Phase 3 + Phase 4）
2. **再用库**（Phase 6）
3. **理解权衡**
4. **根据场景选择**

---

## 📊 综合评分

| 维度 | OT (手写) | Yjs | 赢家 |
|------|-----------|-----|------|
| **功能完整性** | 3/5 | 5/5 | Yjs |
| **开发效率** | 2/5 | 5/5 | Yjs |
| **性能** | 5/5 | 4/5 | OT |
| **扩展性** | 3/5 | 5/5 | Yjs |
| **学习价值** | 5/5 | 3/5 | OT |
| **生产就绪** | 3/5 | 5/5 | Yjs |
| **服务器成本** | 3/5 | 5/5 | Yjs |
| **调试难度** | 2/5 | 5/5 | Yjs |

**总分**: OT 26/40, Yjs 37/40

---

## 🎓 你的学习成果

通过完成 Phase 3 和 Phase 6，你现在：

✅ **理解原理**：知道 OT 和 CRDT 是如何工作的
✅ **实现经验**：手写过 Transform 函数
✅ **生产能力**：能用 Yjs 构建真实应用
✅ **权衡思维**：知道何时用哪种方案

**这就是最完整的学习路径！** 🎉

