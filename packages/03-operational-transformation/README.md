# Phase 3: Operational Transformation (OT) - 协同编辑核心算法

> 深入理解协同编辑的经典方案，掌握 Google Docs、Quill.js 背后的核心技术

## 🎯 学习目标

通过这个阶段，你将：

1. ✅ **理解协同编辑的核心挑战**
   - 并发冲突的本质
   - 为什么需要 Transform
   - 收敛性的数学定义

2. 🔨 **实现 OT 核心算法**（当前进度 80%）
   - Transform 函数的 9 种组合
   - TP1 性质验证
   - 边界情况处理

3. 📡 **构建客户端-服务器模型**
   - 客户端状态管理
   - 服务器操作排序
   - 确认机制（ACK）

4. 🎮 **创建实时协同 Demo**
   - WebSocket 实时通信
   - 多用户同时编辑
   - 操作历史可视化

5. 🔍 **对比 OT 和 CRDT**
   - 各自的优劣
   - 适用场景
   - 为什么两者都重要

## 📚 核心概念

### 1. Transform：OT 的灵魂

```typescript
// 场景：两个用户同时编辑 "ABC"
const doc = "ABC";
const aliceOp = [insert("X")];           // Alice: → "XABC"
const bobOp   = [retain(2), insert("Y")]; // Bob: → "ABYC"

// 问题：最终应该是什么？
// 答案：用 Transform 保证双方收敛到 "XABYC"

// Alice 端
const bobOp_transformed = transform(bobOp, aliceOp, "right");
// [retain(3), insert("Y")] - 位置从 2 调整到 3

// Bob 端
const aliceOp_transformed = transform(aliceOp, bobOp, "left");
// [insert("X")] - 不需要调整

// 结果：双方都是 "XABYC" ✓
```

### 2. Transform vs Compose

| 维度 | Compose | Transform |
|------|---------|-----------|
| **输入** | 顺序操作 | 并发操作 |
| **基准文档** | op2 基于 apply(doc, op1) | 都基于 doc |
| **目的** | 历史压缩 | 冲突解决 |
| **场景** | 撤销/重做 | 协同编辑 |

**关键理解**：
- **Compose** = 视频剪辑（合并镜头）
- **Transform** = 交通路口（避免碰撞）

### 3. TP1 性质（收敛性保证）

```typescript
// 两条路径必须到达同一结果
apply(apply(doc, op1), transform(op2, op1, "right")) ===
apply(apply(doc, op2), transform(op1, op2, "left"))
```

这是 OT 正确性的数学保证！

## 📁 项目结构

```
03-operational-transformation/
├── src/
│   ├── types.ts                 # 类型定义
│   ├── operation.ts             # 基础操作（apply）
│   ├── transform.ts             # Transform 核心实现 ⭐
│   ├── transform.test.ts        # Transform 测试（17 个用例）
│   ├── client.ts                # 客户端状态管理
│   ├── server/
│   │   ├── index.ts             # WebSocket 服务器
│   │   └── ot-server.ts         # OT 服务器逻辑
│   └── main.ts                  # 前端 Demo
│
├── docs/
│   ├── 01-what-is-ot.md         # OT 是什么？
│   ├── 02-transform-vs-compose.md  # Transform vs Compose
│   ├── 03-why-learn-ot.md       # 为什么学 OT？
│   └── 04-client-server-model.md   # 客户端-服务器模型
│
├── examples/
│   └── ot-demo.ts               # Transform 演示脚本
│
├── index.html                   # 实时协同 Demo
└── README.md                    # 本文档
```

## 🚀 快速开始

### 1. 运行测试

```bash
# 在项目根目录
cd packages/03-operational-transformation

# 运行单元测试
pnpm test

# 当前测试结果：
# ✅ 13 个测试通过（Insert vs Delete, Delete vs Delete 等）
# 🔨 4 个测试待完善（Insert vs Insert 的 side 参数处理）
```

### 2. 运行 Transform 演示

```bash
pnpm demo

# 输出示例：
# - 展示各种 Transform 场景
# - 验证 TP1 性质
# - 对比不同的并发冲突
```

### 3. 启动实时协同 Demo（开发中）

```bash
# 启动服务器
pnpm server

# 启动前端
pnpm dev

# 访问 http://localhost:5175
# - 打开多个浏览器标签
# - 同时编辑文档
# - 观察实时同步效果
```

## 📖 学习路径

### Step 1: 理解核心概念 ✅

1. 阅读 `docs/01-what-is-ot.md`
   - OT 解决什么问题
   - Transform 函数的作用
   - TP1/TP2 性质

2. 阅读 `docs/02-transform-vs-compose.md`
   - Transform 和 Compose 的本质区别
   - 各自的应用场景
   - 为什么容易混淆

3. 阅读 `docs/03-why-learn-ot.md`
   - 为什么 OT 仍然重要
   - OT vs CRDT 对比
   - 真实产品的选择

### Step 2: 实现 Transform 函数 🔨（当前进度 80%）

**已完成**：
- ✅ Insert vs Delete（插入不受删除影响）
- ✅ Delete vs Delete（计算重叠部分）
- ✅ Retain vs Delete（调整保留位置）
- ✅ 大部分复杂场景

**待完善**：
- 🔨 Insert vs Insert 的 side 参数处理
  - 同位置插入的顺序决定
  - 空文档的并发插入
  - 这是 OT 中最微妙的部分

**学习建议**：
- 当前 80% 的实现足以理解 OT 的核心思想
- 剩余 20% 是边界情况，不影响整体理解
- 可以先继续学习客户端-服务器模型
- 回头再完善细节

### Step 3: 客户端-服务器模型 📡（接下来）

理解协同编辑的完整流程：

```
客户端 A                服务器              客户端 B
   |                     |                    |
   | ① 本地编辑          |                    |
   |    "ABC" → "XABC"   |                    |
   |                     |                    |
   | ② 发送操作          |                    |
   |------ op1 --------->|                    |
   |                     | ③ 应用 + 排序     |
   |                     |    version++       |
   |                     |                    |
   |                     | ④ 广播             |
   |<------ op1 ---------|------- op1 ------>|
   |                     |                    | ⑤ 应用
   |                     |                    |    "ABC" → "XABC"
```

**核心挑战**：
- 操作排序（中央服务器的作用）
- 未确认操作的管理
- 网络延迟和丢包处理

### Step 4: 实时协同 Demo 🎮（核心目标）

构建一个可以多人同时编辑的文本编辑器：

**功能**：
- 多个用户同时编辑
- 实时看到他人的修改
- 光标位置同步
- 操作历史展示
- 网络状态提示

**技术栈**：
- WebSocket（实时通信）
- TypeScript（类型安全）
- 原生 DOM（保持简洁）

### Step 5: 拓展与对比 🔍

**对比 OT 和 CRDT**：
- OT: 算法转换（需要服务器排序）
- CRDT: 数据结构（数学保证收敛）

**真实案例**：
- Google Docs: OT
- Figma: CRDT
- Notion: OT + CRDT 混合

**为什么两者都重要**：
- 不同场景适合不同方案
- 理解权衡（Trade-off）
- 展示技术广度

## 🧪 测试用例解读

### Transform 的 9 种核心组合

| op1 \ op2 | Insert | Delete | Retain |
|-----------|--------|--------|--------|
| **Insert** | ✅ 13/17 | ✅ 完成 | ✅ 完成 |
| **Delete** | ✅ 完成 | ✅ 完成 | ✅ 完成 |
| **Retain** | ✅ 完成 | ✅ 完成 | ✅ 完成 |

### 典型测试案例

```typescript
// 测试 1: Insert vs Delete
doc = "ABCDE"
op1 = [retain(2), insert("X")]  // 在位置 2 插入 X
op2 = [retain(1), deleteOp(2)]  // 删除 BC

// 期望：Transform 后双方都是 "AXDE"
// ✅ 测试通过

// 测试 2: Delete vs Delete (重叠)
doc = "ABCDE"
op1 = [retain(1), deleteOp(2)]  // 删除 BC
op2 = [retain(2), deleteOp(2)]  // 删除 CD

// 期望：Transform 后双方都是 "AE"
// ✅ 测试通过

// 测试 3: Insert vs Insert (同位置)
doc = "ABC"
op1 = [retain(1), insert("X")]  // 在位置 1 插入 X
op2 = [retain(1), insert("Y")]  // 在位置 1 插入 Y

// 期望：side 参数决定顺序，最终都是 "AXYBC"
// 🔨 待完善（当前部分用例不通过）
```

## 💡 关键洞察

### 1. Transform 是 OT 的核心，但不是全部

```
完整的协同编辑系统 = 
  Transform（核心算法）
  + 客户端状态管理
  + 服务器操作排序
  + 网络通信协议
  + UI 交互设计
```

### 2. OT 的难点不在理论，在实现

- 理论（TP1）：很容易理解
- 实现（Transform）：边界情况很多
- 工程（客户端-服务器）：状态管理复杂

**这就是为什么 CRDT 越来越流行**：
- CRDT：理论复杂，实现简单（数据结构保证收敛）
- OT：理论简单，实现复杂（需要正确的 Transform）

### 3. 学习策略：理解本质 > 完美实现

```
目标优先级：
  1. ✅ 理解并发冲突的本质
  2. ✅ 理解 Transform 的作用
  3. ✅ 实现 80% 的 Transform（主流场景）
  4. 🎯 构建实时协同 Demo（整体理解）
  5. 🔨 完善 Transform 细节（如有时间）
```

## 🎓 学习成果

完成 Phase 3 后，你将能够：

1. ✅ **解释协同编辑的原理**
   - 向面试官清晰讲解 OT
   - 对比 OT 和 CRDT 的优劣
   - 理解 Google Docs 的技术架构

2. ✅ **实现简单的协同编辑器**
   - 基于 WebSocket 的实时同步
   - 基本的冲突解决
   - 多用户编辑体验

3. ✅ **评估技术方案**
   - 何时选择 OT
   - 何时选择 CRDT
   - 如何权衡性能和复杂度

4. ✅ **展示系统设计能力**
   - 客户端-服务器架构
   - 状态管理
   - 实时通信

## 📚 推荐资源

### 论文和文章
- [Operational Transformation (Wikipedia)](https://en.wikipedia.org/wiki/Operational_transformation)
- [Google Wave OT 论文](https://svn.apache.org/repos/asf/incubator/wave/whitepapers/operational-transform/operational-transform.html)
- [Understanding OT (Gentle Introduction)](https://operational-transformation.github.io/)

### 开源实现
- [Quill Delta](https://github.com/quilljs/delta) - Quill.js 的 OT 实现
- [ShareDB](https://github.com/share/sharedb) - 成熟的 OT 框架
- [ot.js](https://github.com/Operational-Transformation/ot.js) - 纯 JS OT 库

### 对比 CRDT
- [CRDT.tech](https://crdt.tech/) - CRDT 资源汇总
- [Yjs](https://github.com/yjs/yjs) - 流行的 CRDT 实现
- [Automerge](https://github.com/automerge/automerge) - Notion 使用的 CRDT

## 🚦 当前进度

```
Phase 3 进度：60% 完成
├── ✅ 核心概念理解
├── 🔨 Transform 实现（80%）
├── ⏳ 客户端-服务器模型
├── ⏳ 实时协同 Demo
└── ⏳ OT vs CRDT 对比
```

## 🎯 下一步

**继续 Phase 3**：
1. 实现客户端状态管理
2. 实现 WebSocket 服务器
3. 构建实时协同 Demo
4. 完善 Transform 细节（可选）

**或者先理解全貌**：
- 查看 Phase 4（CRDT）的规划
- 了解完整的学习路径
- 根据兴趣调整顺序

---

**准备好继续了吗？** 我们可以开始实现客户端-服务器模型和实时 Demo！🚀

