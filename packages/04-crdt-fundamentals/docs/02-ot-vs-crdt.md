# OT vs CRDT：深度对比

> 理解两种协同编辑方案的本质区别和选型依据

## 🎯 核心差异

### 一句话总结

```
OT (Operational Transformation):
"中央权威 + 事后转换"
→ 操作发生冲突时，通过 Transform 函数解决

CRDT (Conflict-free Replicated Data Type):
"数学保证 + 自动收敛"
→ 设计数据结构，让冲突从根本上无法发生
```

## 📊 全面对比表

| 维度 | OT (Phase 3) | CRDT (Phase 4) |
|------|--------------|----------------|
| **架构模式** | 中心化（Client-Server） | 去中心化（P2P） |
| **冲突解决** | Transform 算法 | 数据结构保证 |
| **操作顺序** | 敏感（需要版本号） | 无关（可交换） |
| **离线编辑** | 复杂（需要重放） | 简单（自动合并） |
| **实时性** | 优秀（服务器排序） | 良好（P2P传播） |
| **数据量** | 小（只传操作） | 大（操作+元数据） |
| **内存占用** | 小 | 大（墓碑标记） |
| **实现复杂度** | 算法复杂 | 数据结构复杂 |
| **扩展性** | 受限（服务器瓶颈） | 好（分布式） |
| **一致性保证** | 依赖 TP1/TP2 性质 | 数学证明（CvRDT/CmRDT） |
| **垃圾回收** | 不需要 | 需要（墓碑清理） |
| **调试难度** | 中等 | 困难（分布式状态） |

## 🔍 详细对比

### 1. 架构模式

#### OT：中心化架构

```
客户端A ────┐
           ├──→ 服务器（排序、转换）──→ 广播给其他客户端
客户端B ────┘

特点：
✅ 服务器是权威（解决冲突简单）
✅ 操作顺序由服务器保证
❌ 服务器是单点故障
❌ 扩展受限（服务器瓶颈）
```

**代码示例（Phase 3）**：

```typescript
// OT 客户端
class OTClient {
  applyRemoteOperation(op, serverVersion) {
    // 必须按服务器的顺序应用操作
    let transformed = op;
    for (const pendingOp of this.pending) {
      transformed = transform(transformed, pendingOp, "right");
    }
    this.document = apply(this.document, transformed);
  }
}
```

#### CRDT：去中心化架构

```
客户端A ←────────→ 客户端B
   ↕                   ↕
客户端C ←────────→ 客户端D

特点：
✅ 无中心节点（P2P 友好）
✅ 任意顺序应用操作都收敛
✅ 易于扩展（分布式）
❌ 网络流量大（需要传播给所有节点）
❌ 状态更复杂（每个节点维护完整状态）
```

**代码示例（Phase 4）**：

```typescript
// CRDT RGA
class RGA {
  applyInsert(op) {
    // 不需要知道操作顺序！
    // 通过 ID 自动排序
    this.chars.splice(insertIndex, 0, op.char);
  }
}
```

### 2. 冲突解决机制

#### OT：事后转换

```
场景：两个用户同时在位置2插入

用户A：insert(2, "X")  →  服务器（先到）  →  version 1
用户B：insert(2, "Y")  →  服务器（后到）  →  需要 Transform!

Transform(op_B, op_A, "left"):
  - op_A 在位置2插入了 "X"
  - op_B 需要调整位置：insert(3, "Y")
  - 最终结果："..XY.."

核心：通过算法"修正"冲突操作
```

**代码**：

```typescript
// OT Transform 函数（Phase 3）
function transform(op1, op2, side) {
  if (isInsert(op1) && isInsert(op2)) {
    // 两个插入冲突，调整位置
    if (side === "left") {
      return retain(op2.text.length); // 让路
    } else {
      return op1; // 保持原样
    }
  }
  // ... 复杂的情况处理
}
```

#### CRDT：事前预防

```
场景：两个用户同时在"相同位置"插入

用户A：insert({id: {replica: "A", clock: 1}, value: "X"}, afterId: {id0})
用户B：insert({id: {replica: "B", clock: 1}, value: "Y"}, afterId: {id0})

合并规则（RGA）：
  - 两个字符都在 id0 之后
  - 比较 ID：clock 相同，比较 replicaId
  - "A" < "B" (字典序)
  - 最终顺序：id0 → X → Y

核心：通过数据结构"避免"冲突
```

**代码**：

```typescript
// CRDT RGA（Phase 4）
applyInsert(op) {
  // 找到 afterId 的位置
  let insertIndex = findIndex(op.afterId) + 1;
  
  // 处理并发插入：按 ID 排序
  while (insertIndex < this.chars.length) {
    if (compareId(this.chars[insertIndex].id, op.char.id) < 0) {
      insertIndex++;
    } else {
      break;
    }
  }
  
  this.chars.splice(insertIndex, 0, op.char);
  // ✅ 无论操作顺序，结果相同！
}
```

### 3. 操作顺序依赖

#### OT：顺序敏感

```
问题：操作必须按照服务器分配的版本号顺序应用

例子：
文档初始："AB"

op1: delete(0, 1)  →  "B"
op2: delete(0, 1)  →  应用在 "AB" 上是删除 "A"，应用在 "B" 上是删除 "B"

❌ 如果顺序错误，结果错误
✅ 需要 Transform 来调整
```

**影响**：

```
- 离线编辑困难
  └─ 需要缓存操作顺序
  └─ 上线后重放操作
  └─ 可能需要多次 Transform

- P2P 场景困难
  └─ 需要全局顺序（如 Lamport Clock）
  └─ 实现复杂
```

#### CRDT：顺序无关

```
优势：操作可以任意顺序应用

例子：
文档初始：""

op1: insert({id: A1, value: "H"}, afterId: null)
op2: insert({id: B1, value: "i"}, afterId: A1)

应用顺序1：op1 → op2  →  "Hi"
应用顺序2：op2 → op1  →  "Hi"

✅ 结果相同！
```

**影响**：

```
✅ 离线编辑简单
  └─ 缓存操作即可
  └─ 上线后直接应用
  └─ 自动收敛

✅ P2P 场景简单
  └─ 直接传播操作
  └─ 无需全局顺序
```

### 4. 离线编辑

#### OT：复杂

```typescript
// OT 离线场景
class OTClient {
  // 离线时
  offlineOps: Operation[] = [];
  
  goOffline() {
    // 缓存本地操作
    this.offlineOps.push(localOp);
  }
  
  goOnline() {
    // 需要拉取服务器最新状态
    const serverOps = await fetchServerOps(this.lastVersion);
    
    // 对每个离线操作进行 Transform
    for (const localOp of this.offlineOps) {
      for (const serverOp of serverOps) {
        localOp = transform(localOp, serverOp, "left");
      }
    }
    
    // 发送转换后的操作
    this.sendOps(this.offlineOps);
  }
}

问题：
❌ 需要知道离线期间服务器的所有操作
❌ Transform 可能很复杂（多次嵌套）
❌ 可能需要重新同步整个文档
```

#### CRDT：简单

```typescript
// CRDT 离线场景
class CRDTClient {
  offlineOps: Operation[] = [];
  
  goOffline() {
    // 缓存本地操作
    this.offlineOps.push(localOp);
    this.rga.applyOperation(localOp); // 立即应用到本地
  }
  
  goOnline() {
    // 直接发送离线操作
    this.sendOps(this.offlineOps);
    
    // 接收其他客户端的操作
    const remoteOps = await fetchRemoteOps();
    
    // 直接应用，自动收敛
    for (const remoteOp of remoteOps) {
      this.rga.applyOperation(remoteOp);
    }
  }
}

优势：
✅ 无需知道操作顺序
✅ 直接应用即可
✅ 数学保证收敛
```

### 5. 数据量对比

#### OT：操作数据量小

```json
// OT 操作
{
  "type": "insert",
  "position": 5,
  "text": "Hello"
}

大小：~50 字节
```

#### CRDT：操作数据量大

```json
// CRDT 操作
{
  "type": "insert",
  "char": {
    "id": {
      "replicaId": "client-abc123",
      "clock": 12345
    },
    "value": "H",
    "tombstone": false
  },
  "afterId": {
    "replicaId": "client-xyz789",
    "clock": 12340
  }
}

大小：~200 字节（4倍）
```

**内存占用**：

```
OT 文档状态：
"Hello World"  →  11 字节

CRDT 文档状态：
[
  {id: {replica: "A", clock: 1}, value: "H", tombstone: false},
  {id: {replica: "A", clock: 2}, value: "e", tombstone: false},
  {id: {replica: "B", clock: 1}, value: "l", tombstone: false},
  {id: {replica: "B", clock: 2}, value: "l", tombstone: false},
  {id: {replica: "A", clock: 3}, value: "o", tombstone: false},
  {id: {replica: "A", clock: 4}, value: " ", tombstone: true},  ← 墓碑
  // ...
]

→  每个字符 ~80 字节  →  880+ 字节（80倍）
```

### 6. 实现复杂度

#### OT：算法复杂

```
难点：
1. Transform 函数
   - 需要处理 Insert × Insert, Insert × Delete, Delete × Delete...
   - 需要保证 TP1/TP2 性质
   - 边界情况多

2. 客户端状态管理
   - Pending 队列
   - 版本号管理
   - ACK 处理

3. 服务器逻辑
   - 操作排序
   - 广播
   - 历史记录

实现难度：⭐⭐⭐⭐ (4/5)
验证难度：⭐⭐⭐⭐⭐ (5/5)  ← TP1/TP2 难以验证
```

#### CRDT：数据结构复杂

```
难点：
1. 唯一 ID 生成
   - 需要保证全局唯一
   - 需要支持排序

2. 墓碑管理
   - 删除不能真删除
   - 需要垃圾回收机制

3. 并发排序规则
   - 需要定义明确的排序规则
   - 需要处理因果关系

实现难度：⭐⭐⭐ (3/5)
验证难度：⭐⭐⭐ (3/5)  ← 数学可证明
```

## 🎯 性能对比

### 实时协同（局域网）

```
场景：10个用户同时编辑

OT:
- 延迟：10-30ms
- 带宽：5KB/s per user
- 服务器负载：中等
评分：⭐⭐⭐⭐⭐ (5/5)

CRDT:
- 延迟：20-50ms
- 带宽：20KB/s per user
- 服务器负载：低（仅转发）
评分：⭐⭐⭐⭐ (4/5)
```

### 离线编辑（移动端）

```
场景：用户离线编辑1小时，产生200个操作

OT:
- 上线同步时间：5-10秒
- 需要 Transform：200次
- 可能需要全量同步
评分：⭐⭐ (2/5)

CRDT:
- 上线同步时间：1-2秒
- 直接应用操作
- 自动收敛
评分：⭐⭐⭐⭐⭐ (5/5)
```

### 大文档性能（10万字）

```
OT:
- 内存占用：~100KB
- 插入性能：O(1)
- 查找性能：O(1)
评分：⭐⭐⭐⭐⭐ (5/5)

CRDT (RGA):
- 内存占用：~8MB（含墓碑）
- 插入性能：O(n)（需要查找位置）
- 查找性能：O(n)
评分：⭐⭐ (2/5)

优化后的 CRDT (Yjs):
- 内存占用：~500KB
- 插入性能：O(log n)
- 查找性能：O(log n)
评分：⭐⭐⭐⭐ (4/5)
```

## 🏢 真实产品选型

### 选择 OT 的产品

| 产品 | 为什么选 OT |
|------|------------|
| **Google Docs** | 稳定的服务器、实时性要求高、用户基数大（优化成熟） |
| **Office 365** | 企业级稳定性、已有服务器架构、实时协同为主 |
| **腾讯文档** | 参考 Google Docs、国内网络环境（中心化更稳定） |
| **石墨文档** | 早期产品、OT 技术成熟、团队经验 |

### 选择 CRDT 的产品

| 产品 | 为什么选 CRDT |
|------|------------|
| **Figma** | 设计工具（非纯文本）、离线需求、P2P 协同 |
| **Notion** | 离线编辑重要、块级编辑（非连续文本）、扩展性 |
| **Apple Notes** | iCloud 同步、离线优先、去中心化 |
| **Obsidian** | 本地优先、Markdown、P2P 同步 |

### 混合方案

| 产品 | 策略 |
|------|------|
| **钉钉文档** | 文本用 OT、表格/评论用 CRDT |
| **飞书文档** | 实时协同用 OT、离线同步用 CRDT |

## 🤔 如何选择？

### 决策树

```
你的应用是否需要离线编辑？
├─ 是 → CRDT（离线优先）
│   └─ 例如：笔记应用、设计工具
│
└─ 否 → 继续判断
    │
    你的应用是否有稳定的中央服务器？
    ├─ 是 → OT（实时性优先）
    │   └─ 例如：在线文档、协同编辑
    │
    └─ 否 → CRDT（P2P场景）
        └─ 例如：分布式应用、区块链
```

### 选型建议

```
选择 OT 如果：
✅ 有稳定的服务器基础设施
✅ 实时性是第一优先级
✅ 主要是在线协同
✅ 对网络流量和内存敏感
✅ 团队有 OT 经验

选择 CRDT 如果：
✅ 离线编辑是核心需求
✅ P2P 场景
✅ 去中心化架构
✅ 扩展性要求高
✅ 可以接受更高的内存和带宽成本
```

## 💡 关键洞察

### OT 的精髓

```
"集中式权威 + 智能算法"

优势：高效、实时
代价：依赖服务器、离线困难
```

### CRDT 的精髓

```
"分布式设计 + 数学保证"

优势：离线友好、自动收敛
代价：数据量大、实现复杂
```

### 未来趋势

```
2010-2015: OT 为主
  → Google Docs 引领

2015-2020: CRDT 崛起
  → Figma、Notion 推动

2020-现在: 混合方案
  ├─ 文本编辑：OT（成熟稳定）
  ├─ 数据同步：CRDT（离线友好）
  └─ 根据场景选择

2025+: 更优化的 CRDT
  ├─ Yjs（内存优化）
  ├─ Automerge（性能优化）
  └─ 新算法（如 Loro）
```

## 🎓 学习建议

### Phase 3（OT）+ Phase 4（CRDT）的价值

```
不是选择其中一个，而是：

1. 理解两者的本质区别
   └─ 何时用 OT，何时用 CRDT

2. 掌握核心原理
   └─ Transform vs 数据结构设计

3. 建立系统思维
   └─ 权衡取舍、场景选择

4. 面试和架构设计
   └─ Google Docs 用什么？Figma 为什么不用 OT？
```

---

**恭喜！** 🎉 你现在理解了协同编辑的两大流派，具备了架构选型的能力！

