# Phase 4: CRDT 基础 - 无冲突复制数据类型

> **学习目标**：理解 CRDT 的核心原理，掌握去中心化协同编辑方案

## 🎯 本阶段学习内容

### 1. CRDT 核心概念

- ✅ CRDT 是什么？为什么需要它？
- ✅ 与 OT 的本质区别
- ✅ 数学基础：交换律、结合律、幂等性
- ✅ State-based vs Operation-based CRDT

### 2. 实现的 CRDT 数据结构

#### 基础 CRDT
- **G-Counter**（Grow-only Counter）：只增计数器
  - 最简单的 CRDT
  - 理解合并规则
  - 理解收敛性

- **PN-Counter**（Positive-Negative Counter）：可增可减计数器
  - 通过两个 G-Counter 实现
  - 巧妙的减法转换

#### 高级 CRDT
- **RGA**（Replicated Growable Array）：文本编辑器
  - 基于唯一 ID 的字符定位
  - 墓碑标记（Tombstone）
  - 并发插入的冲突解决
  - 离线编辑支持

### 3. OT vs CRDT 对比

详细对比两种方案的：
- 架构模式（中心化 vs 去中心化）
- 冲突解决机制
- 离线编辑支持
- 性能特点
- 适用场景

## 📁 项目结构

```
04-crdt-fundamentals/
├── docs/
│   ├── 01-what-is-crdt.md         # CRDT 核心概念
│   └── 02-ot-vs-crdt.md           # OT vs CRDT 对比
├── src/
│   ├── g-counter.ts                # G-Counter 实现
│   ├── g-counter.test.ts           # G-Counter 测试
│   ├── pn-counter.ts               # PN-Counter 实现
│   ├── pn-counter.test.ts          # PN-Counter 测试
│   ├── rga.ts                      # RGA 文本编辑器实现
│   ├── rga.test.ts                 # RGA 测试
│   └── main.ts                     # 交互式 Demo
├── examples/
│   └── crdt-demo.ts                # 命令行 Demo
├── index.html                      # 交互式网页 Demo
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd packages/04-crdt-fundamentals
pnpm install
```

### 2. 运行测试

```bash
pnpm test
```

### 3. 启动交互式 Demo

```bash
pnpm dev
```

然后打开浏览器访问 `http://localhost:5176`

### 4. 运行命令行 Demo

```bash
pnpm demo
```

## 💡 学习路径

### Step 1: 理解 CRDT 概念

阅读 `docs/01-what-is-crdt.md`，理解：
- CRDT 的定义和核心思想
- 为什么需要 CRDT（OT 的局限）
- CRDT 的数学基础
- State-based 和 Operation-based 的区别

### Step 2: 实现 G-Counter

查看 `src/g-counter.ts`，理解：
- 最简单的 CRDT 是如何工作的
- `merge` 函数如何保证收敛性
- 如何满足交换律、结合律、幂等性

运行测试：
```bash
pnpm test g-counter
```

### Step 3: 实现 PN-Counter

查看 `src/pn-counter.ts`，理解：
- 如何通过两个 G-Counter 实现减法
- 为什么这种设计是巧妙的

### Step 4: 实现 RGA（核心）

查看 `src/rga.ts`，理解：
- 如何用唯一 ID 标识字符
- 墓碑标记的作用
- 并发插入如何通过 ID 排序解决冲突
- 离线编辑如何实现

运行测试：
```bash
pnpm test rga
```

### Step 5: 对比 OT 和 CRDT

阅读 `docs/02-ot-vs-crdt.md`，理解：
- 两种方案的本质区别
- 各自的优劣势
- 如何选择合适的方案

### Step 6: 体验交互式 Demo

运行 `pnpm dev`，体验：
- 场景 1：基础同步
- 场景 2：并发插入
- 场景 3：冲突解决

观察：
- 操作如何传播
- 副本如何收敛
- 内部状态的变化

## 🔍 核心代码解析

### G-Counter 的 merge 函数

```typescript
merge(other: GCounter): GCounter {
  const result = new GCounter();
  
  // 获取所有副本ID
  const allReplicas = new Set([
    ...this.counts.keys(),
    ...other.counts.keys(),
  ]);
  
  // 对每个副本，取最大值
  for (const replica of allReplicas) {
    const thisCount = this.counts.get(replica) || 0;
    const otherCount = other.counts.get(replica) || 0;
    result.counts.set(replica, Math.max(thisCount, otherCount));
  }
  
  return result;
}
```

**关键点**：
- 取最大值保证了幂等性（重复合并不会改变结果）
- 取最大值保证了交换律（合并顺序无关）
- 每个副本独立计数，避免了冲突

### RGA 的并发插入处理

```typescript
applyInsert(operation: InsertOperation): void {
  const { char, afterId } = operation;
  
  // 找到 afterId 的位置
  let insertIndex = this.findIndex(afterId) + 1;
  
  // 处理并发插入：按 ID 排序
  while (insertIndex < this.chars.length) {
    if (this.compareId(this.chars[insertIndex].id, char.id) < 0) {
      insertIndex++;
    } else {
      break;
    }
  }
  
  this.chars.splice(insertIndex, 0, char);
}
```

**关键点**：
- 基于 `afterId` 而不是位置（位置会变化）
- 并发插入通过 ID 排序解决冲突
- 无论操作顺序，最终结果相同

## 📊 测试覆盖

### G-Counter 测试
- ✅ 基础递增
- ✅ 合并操作
- ✅ 交换律
- ✅ 结合律
- ✅ 幂等性
- ✅ 协同场景模拟

### RGA 测试
- ✅ 基础插入/删除
- ✅ 墓碑标记
- ✅ 并发插入
- ✅ 并发删除
- ✅ 复杂协同场景
- ✅ 离线编辑

运行所有测试：
```bash
pnpm test
```

查看测试覆盖率：
```bash
pnpm test:coverage
```

## 🎓 学习要点

### 理解 CRDT 的本质

```
OT 的思路："遇到冲突，用算法解决"
CRDT 的思路："设计数据结构，让冲突不存在"

类比：
OT = 事后处理（遇到问题解决问题）
CRDT = 事前预防（设计消除问题）
```

### 理解墓碑的必要性

```
为什么删除不能真正删除？

1. 因果关系：其他副本可能还在引用这个字符
2. 幂等性：重复应用删除操作不会有副作用
3. 离线支持：离线副本需要知道哪些字符被删除了

代价：
- 内存占用增加
- 需要垃圾回收机制
```

### 理解唯一 ID 的作用

```
为什么每个字符需要唯一 ID？

1. 位置会变化，但 ID 不变
2. 并发插入可以通过 ID 排序
3. 删除可以精确定位字符
4. 支持离线编辑

ID 的设计：
{
  replicaId: string,  // 副本标识（保证不同副本不冲突）
  clock: number       // 逻辑时钟（保证同一副本内唯一）
}
```

## 🆚 与 Phase 3 (OT) 对比

| 维度 | Phase 3 (OT) | Phase 4 (CRDT) |
|------|--------------|----------------|
| **架构** | 中心化 | 去中心化 |
| **核心算法** | Transform | 数据结构 + Merge |
| **离线编辑** | 复杂 | 简单 |
| **数据量** | 小 | 大 |
| **适用场景** | 实时协同 | 离线优先 |

## 🔗 相关资源

### 论文
- [A comprehensive study of CRDT](https://hal.inria.fr/inria-00555588/document)
- [RGA: Replicated Growable Array](https://pages.lip6.fr/Marc.Shapiro/papers/RR-8083.pdf)

### 开源项目
- [Yjs](https://github.com/yjs/yjs) - 高性能 CRDT 库
- [Automerge](https://github.com/automerge/automerge) - CRDT 数据结构库
- [ShareDB](https://github.com/share/sharedb) - OT 实现（对比学习）

### 相关产品
- Figma（设计协同）
- Notion（笔记）
- Apple Notes（iCloud 同步）

## 🎯 下一步学习

完成 Phase 4 后，你可以：

1. **深入 CRDT 优化**
   - 学习 Yjs 的优化技术
   - 实现垃圾回收机制
   - 优化内存和性能

2. **探索混合方案**
   - 何时用 OT，何时用 CRDT
   - 如何在一个产品中同时使用

3. **实战项目**
   - 实现一个支持离线的笔记应用
   - 实现一个 P2P 文档编辑器

4. **继续 Phase 5**
   - 学习真实的编辑器框架（Quill.js / Slate.js）
   - 集成 CRDT/OT 到实际项目

---

**恭喜！** 🎉 你已经掌握了协同编辑的两大核心算法（OT + CRDT），具备了构建协同应用的理论基础！

