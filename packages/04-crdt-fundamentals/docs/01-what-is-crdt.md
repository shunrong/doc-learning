# 什么是 CRDT？

> CRDT = Conflict-free Replicated Data Types（无冲突复制数据类型）

## 🎯 核心概念

### 一句话解释

**CRDT 是一种特殊设计的数据结构，保证在没有中央服务器的情况下，多个副本最终会自动收敛到相同的状态。**

### 形象类比

```
OT（Phase 3 学的）:
就像交通路口的红绿灯
├─ 需要中央控制（服务器排序）
├─ 需要 Transform 函数（避免碰撞）
└─ 实时性好，但依赖服务器

CRDT:
就像自动驾驶汽车
├─ 每辆车自己决定路线（无需中央控制）
├─ 通过数学规则避免碰撞（数据结构保证）
└─ 离线友好，但数据结构复杂
```

## 🔥 核心问题：为什么需要 CRDT？

### OT 的局限

回顾 Phase 3 的 OT：

```typescript
// OT 的问题
class OTClient {
  applyRemoteOperation(op, version) {
    // 必须知道操作的顺序！
    // 必须依赖服务器分配版本号！
    // 离线时无法正确合并！
  }
}
```

**OT 的痛点**：

```
1. 依赖中央服务器
   ❌ 服务器挂了，协同停止
   ❌ 网络不稳定，体验差
   ❌ 扩展困难（服务器是瓶颈）

2. 操作顺序敏感
   ❌ 必须按顺序应用操作
   ❌ 离线编辑难以合并
   ❌ P2P 场景无法使用

3. Transform 复杂
   ❌ TP1/TP2 性质难以保证
   ❌ 边界情况多
   ❌ 实现和验证困难
```

### CRDT 的解决方案

```
CRDT 的优势：
✅ 无需中央服务器（P2P 友好）
✅ 操作顺序无关（自动收敛）
✅ 离线编辑完美支持
✅ 数学保证收敛（不需要 Transform）
✅ 易于扩展（去中心化）
```

## 📐 CRDT 的数学基础

### 核心性质：交换律 + 结合律 + 幂等性

```
交换律（Commutativity）:
a ⊕ b = b ⊕ a

例子：
- 用户A 插入 "X"，用户B 插入 "Y"
- 无论谁先谁后，最终结果相同

结合律（Associativity）:
(a ⊕ b) ⊕ c = a ⊕ (b ⊕ c)

例子：
- 3个用户的操作，无论如何分组，结果相同

幂等性（Idempotence）:
a ⊕ a = a

例子：
- 重复收到同一个操作，不会重复应用
```

**用代码理解**：

```typescript
// 非 CRDT：普通的 Set
const setA = new Set([1, 2]);
const setB = new Set([2, 3]);

// 合并时需要定义规则，可能有歧义
const merged = new Set([...setA, ...setB]); // [1, 2, 3]

// 问题：如果 A 删除了 2，B 添加了 2，最终应该有 2 吗？
// ❌ 普通 Set 无法处理这种冲突


// CRDT：G-Set（Grow-only Set）
class GSet<T> {
  private items = new Set<T>();
  
  add(item: T) {
    this.items.add(item);
  }
  
  // 关键：合并函数满足交换律
  merge(other: GSet<T>): GSet<T> {
    const result = new GSet<T>();
    for (const item of this.items) {
      result.add(item);
    }
    for (const item of other.items) {
      result.add(item);
    }
    return result;
  }
}

// ✅ 无论合并顺序如何，结果相同
const a = new GSet(); a.add(1); a.add(2);
const b = new GSet(); b.add(2); b.add(3);

a.merge(b) === b.merge(a) // true!
```

## 🌳 CRDT 的两大类型

### 1. State-based CRDT (CvRDT)

**核心思想**：传输整个状态，而不是操作

```typescript
// 例子：G-Counter (只增计数器)
class GCounter {
  // 每个副本的状态
  private counts: Map<string, number> = new Map();
  
  increment(replicaId: string) {
    const current = this.counts.get(replicaId) || 0;
    this.counts.set(replicaId, current + 1);
  }
  
  value(): number {
    let sum = 0;
    for (const count of this.counts.values()) {
      sum += count;
    }
    return sum;
  }
  
  // 关键：merge 函数
  merge(other: GCounter): GCounter {
    const result = new GCounter();
    
    // 取每个副本的最大值
    const allReplicas = new Set([
      ...this.counts.keys(),
      ...other.counts.keys()
    ]);
    
    for (const replica of allReplicas) {
      const thisCount = this.counts.get(replica) || 0;
      const otherCount = other.counts.get(replica) || 0;
      result.counts.set(replica, Math.max(thisCount, otherCount));
    }
    
    return result;
  }
}
```

**使用场景**：

```
副本 A                  副本 B
count: {A:5, B:3}      count: {A:4, B:6}
    |                       |
    └───────── merge ───────┘
               |
          count: {A:5, B:6}
          value: 11 ✅
```

**优点**：
- ✅ 简单直观
- ✅ 易于实现

**缺点**：
- ❌ 传输整个状态（数据量大）
- ❌ 不适合大型数据结构

### 2. Operation-based CRDT (CmRDT)

**核心思想**：传输操作，但操作是可交换的

```typescript
// 例子：OR-Set (可删除的 Set)
class ORSet<T> {
  private items: Map<T, Set<string>> = new Map(); // 值 -> 唯一ID集合
  
  add(item: T, uniqueId: string) {
    if (!this.items.has(item)) {
      this.items.set(item, new Set());
    }
    this.items.get(item)!.add(uniqueId);
  }
  
  remove(item: T) {
    this.items.delete(item);
  }
  
  has(item: T): boolean {
    return this.items.has(item) && this.items.get(item)!.size > 0;
  }
}
```

**优点**：
- ✅ 传输操作（数据量小）
- ✅ 适合实时协同

**缺点**：
- ❌ 需要保证操作可交换
- ❌ 需要因果序（Causal Order）

## 📝 CRDT 在文本编辑中的应用

### 核心挑战

```
问题：如何用 CRDT 实现文本编辑？

挑战：
1. 字符位置会变化
   - 用户A在位置2插入"X"
   - 用户B在位置1插入"Y"
   - 位置2已经失效了！

2. 删除操作的语义
   - 用户A删除位置3
   - 用户B也删除位置3
   - 应该删除哪个字符？

3. 并发插入的顺序
   - 两个用户在同一位置插入
   - 最终顺序是什么？
```

### 解决方案：基于唯一标识的 CRDT

#### RGA (Replicated Growable Array)

**核心思想**：每个字符有唯一的 ID，而不是位置

```typescript
interface Character {
  id: string;           // 唯一标识 (replica-id + timestamp)
  value: string;        // 字符内容
  tombstone: boolean;   // 是否被删除（墓碑标记）
}

class RGA {
  private chars: Character[] = [];
  
  insert(char: Character, afterId: string | null) {
    // 在 afterId 之后插入
    // 即使位置变化，ID 不变！
  }
  
  delete(charId: string) {
    // 标记为删除（墓碑）
    // 不真正删除，保留因果关系
  }
}
```

**例子**：

```
初始: ""

用户A: 插入 'H' (id: A1, after: null)
       chars: [{id: A1, value: 'H'}]
       text: "H"

用户B: 插入 'i' (id: B1, after: null) (同时发生)
       chars: [{id: B1, value: 'i'}]
       text: "i"

合并（A 收到 B 的操作）:
       chars: [{id: A1, value: 'H'}, {id: B1, value: 'i'}]
       text: "Hi"  (或 "iH"，取决于 ID 排序规则)

合并（B 收到 A 的操作）:
       chars: [{id: A1, value: 'H'}, {id: B1, value: 'i'}]
       text: "Hi"  (相同！)

✅ 无论合并顺序，结果相同
```

#### LSEQ / WOOT / Logoot

这些都是不同的 CRDT 文本编辑算法，核心思想类似：

- **LSEQ**: 使用分数位置
- **WOOT**: 使用逻辑时钟
- **Logoot**: 使用位置标识符

## 🆚 CRDT vs OT 对比

| 维度 | OT (Phase 3) | CRDT (Phase 4) |
|------|--------------|----------------|
| **中央服务器** | 需要（排序） | 不需要 |
| **操作顺序** | 敏感 | 无关 |
| **离线编辑** | 困难 | 简单 |
| **冲突解决** | Transform | 数据结构保证 |
| **实现复杂度** | 算法复杂 | 数据结构复杂 |
| **数据量** | 小（只发操作） | 大（带元数据） |
| **内存占用** | 小 | 大（墓碑） |
| **实时性** | 好（集中式） | 一般（P2P） |
| **扩展性** | 服务器瓶颈 | 易扩展 |

### 使用场景对比

```
选择 OT：
✅ 有稳定的中央服务器
✅ 实时性要求高
✅ 在线协同为主
✅ 对数据量敏感

代表产品：Google Docs, Office 365

选择 CRDT：
✅ 离线编辑重要
✅ P2P 场景
✅ 去中心化需求
✅ 扩展性要求高

代表产品：Figma, Notion, Apple Notes
```

## 🎯 学习目标

通过 Phase 4，你将：

1. ✅ 理解 CRDT 的数学基础
2. ✅ 实现简单的 CRDT（G-Counter, PN-Counter）
3. ✅ 实现文本编辑的 CRDT（RGA）
4. ✅ 对比 OT 和 CRDT 的优劣
5. ✅ 理解真实产品的技术选型

## 🚀 实践路径

```
Phase 4 学习路径：

1. 基础 CRDT
   ├─ G-Counter（只增计数器）
   ├─ PN-Counter（可增可减计数器）
   └─ G-Set（只增集合）

2. 高级 CRDT
   ├─ OR-Set（可删除集合）
   ├─ LWW-Register（最后写者赢）
   └─ RGA（文本编辑）

3. 实战应用
   ├─ P2P 文本编辑器
   ├─ 离线支持
   └─ 与 OT 对比 Demo
```

## 💡 关键洞察

### CRDT 的本质

```
OT 的思路：
"遇到冲突，用算法解决"
→ Transform 函数

CRDT 的思路：
"设计数据结构，让冲突不存在"
→ 数学保证

类比：
OT = 事后处理（遇到问题解决问题）
CRDT = 事前预防（设计消除问题）
```

### 为什么 CRDT 越来越流行？

```
趋势：
2010 - 2015: OT 为主
  └─ Google Docs 引领

2015 - 2020: CRDT 崛起
  ├─ Figma（设计协同）
  ├─ Notion（笔记）
  └─ Apple Notes（iCloud 同步）

2020 - 现在: 混合方案
  ├─ 文本用 OT
  ├─ 其他数据用 CRDT
  └─ 根据场景选择

原因：
1. 移动互联网（离线需求增加）
2. 分布式系统（去中心化趋势）
3. Yjs 等成熟库（降低实现成本）
```

---

**准备好了吗？** 让我们开始实现第一个 CRDT：G-Counter！🚀

