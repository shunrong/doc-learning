# 什么是 OT（Operational Transformation）？

## 核心问题：协同编辑的冲突

### 场景重现

想象两个用户 Alice 和 Bob 同时编辑同一份文档：

```
初始文档: "ABC"

同一时刻：
- Alice 在位置 0 插入 "X"  → "XABC"
- Bob   在位置 2 插入 "Y"  → "ABYC"

问题：最终文档应该是什么？
```

**天真的方案（错误）**：

```typescript
// Alice 的编辑器
let doc = "ABC";
doc = apply(doc, [insert("X")]);  // "XABC"

// 收到 Bob 的操作 [retain(2), insert("Y")]
doc = apply(doc, [retain(2), insert("Y")]);  // "XAYBC"  ❌ 错误！

// Bob 的编辑器
let doc = "ABC";
doc = apply(doc, [retain(2), insert("Y")]);  // "ABYC"

// 收到 Alice 的操作 [insert("X")]
doc = apply(doc, [insert("X")]);  // "XABYC"  ❌ 错误！

// 结果：Alice 和 Bob 的文档不一致！
```

**问题出在哪里？**

Bob 的操作 `[retain(2), insert("Y")]` 是基于文档 "ABC" 的，意思是：
- "跳过 2 个字符（AB）"
- "插入 Y"
- "结果是 ABYC"

但当这个操作到达 Alice 时，Alice 的文档已经是 "XABC"：
- "跳过 2 个字符（XA）" ← 位置错了！
- "插入 Y"
- "结果是 XAYBC" ← 错误！

## OT 的解决方案

**核心思想**：当收到远程操作时，**转换（Transform）**这个操作，使其适应本地已发生的变化。

```typescript
// Alice 的编辑器
let doc = "ABC";
const myOp = [insert("X")];
doc = apply(doc, myOp);  // "XABC"

// 收到 Bob 的操作（基于 "ABC"）
const bobOp = [retain(2), insert("Y")];

// 关键：Transform！
const bobOp_transformed = transform(bobOp, myOp, "right");
// bobOp_transformed = [retain(3), insert("Y")]
//                     ↑ 原来是 2，现在是 3（因为 Alice 插入了 1 个字符）

doc = apply(doc, bobOp_transformed);  // "XABYC"  ✅ 正确！

// Bob 的编辑器（对称的过程）
let doc = "ABC";
const myOp = [retain(2), insert("Y")];
doc = apply(doc, myOp);  // "ABYC"

const aliceOp = [insert("X")];
const aliceOp_transformed = transform(aliceOp, myOp, "left");
// aliceOp_transformed = [insert("X")]  （不需要改变）

doc = apply(doc, aliceOp_transformed);  // "XABYC"  ✅ 正确！

// 结果：两边的文档一致！
```

## Transform 函数的定义

```typescript
/**
 * 转换操作，使其适应另一个并发操作
 *
 * @param op1 - 需要被转换的操作
 * @param op2 - 已经应用的操作
 * @param side - "left" 或 "right"，用于处理插入位置相同的情况
 * @returns 转换后的操作
 *
 * 满足的性质：
 * apply(apply(doc, op1), transform(op2, op1, "right")) ===
 * apply(apply(doc, op2), transform(op1, op2, "left"))
 */
function transform(op1, op2, side) {
  // ...
}
```

## OT 的数学性质

OT 必须满足两个核心性质（Convergence Properties）：

### 1. TP1（Transformation Property 1）

```typescript
// 无论操作顺序如何，最终结果相同
apply(apply(doc, op1), transform(op2, op1, "right")) ===
apply(apply(doc, op2), transform(op1, op2, "left"))
```

**形象理解**：两条路径到达同一终点。

```
        op1
   doc -----> doc1
    |          |
    |          | transform(op2, op1, "right")
  op2          |
    |          v
    v       result
   doc2 -----> 
        transform(op1, op2, "left")
```

### 2. TP2（Transformation Property 2）

```typescript
// 连续转换的可组合性
transform(op3, compose(op1, op2)) ===
compose(
  transform(transform(op3, op1), transform(op2, transform(op1, op3))),
  ...
)
```

**实际意义**：可以处理多个并发操作。

## OT 的 9 种核心组合

Transform 需要处理所有操作类型的组合：

| op1 \ op2 | Insert | Delete | Retain |
|-----------|--------|--------|--------|
| **Insert** | 插入-插入 | 插入-删除 | 插入-保留 |
| **Delete** | 删除-插入 | 删除-删除 | 删除-保留 |
| **Retain** | 保留-插入 | 保留-删除 | 保留-保留 |

每种组合都有特定的转换规则。

## 示例：详解各种组合

### 1. Insert vs Insert（最关键）

```typescript
// 文档: "ABC"
// Alice: 在位置 1 插入 "X"  → "AXBC"
// Bob:   在位置 1 插入 "Y"  → "AYBC"

const aliceOp = [retain(1), insert("X")];
const bobOp   = [retain(1), insert("Y")];

// 问题：最终是 "AXYBC" 还是 "AYXBC"？
// 解决：使用 side 参数

// Alice 收到 Bob 的操作
transform(bobOp, aliceOp, "right");
// → [retain(2), insert("Y")]  // 2 = 1 + 1（Alice 的插入）
// 结果: "AXYBC"

// Bob 收到 Alice 的操作
transform(aliceOp, bobOp, "left");
// → [retain(1), insert("X")]  // 保持在位置 1（在 Bob 的 Y 之前）
// 结果: "AXYBC"

// ✅ 一致！
```

**规则**：
- 如果两个 insert 在同一位置，`side = "left"` 的插入在前
- `side = "right"` 的插入需要加上 `side = "left"` 的插入长度

### 2. Insert vs Delete

```typescript
// 文档: "ABCDE"
// Alice: 在位置 2 插入 "X"    → "ABXCDE"
// Bob:   从位置 1 删除 3 个字符 → "AE"

const aliceOp = [retain(2), insert("X")];
const bobOp   = [retain(1), deleteOp(3)];

// Alice 收到 Bob 的操作
// Bob 删除的是 "BCD"，但 Alice 在 "AB" 之后插入了 "X"
// X 不应该被删除
transform(bobOp, aliceOp, "right");
// → [retain(1), deleteOp(3)]  // 删除的还是 3 个，但跳过了 X

// Bob 收到 Alice 的操作
// Alice 的插入在位置 2，但 Bob 删除了位置 1-3
// Alice 的插入在被删除的范围内，需要调整
transform(aliceOp, bobOp, "left");
// → [retain(1), insert("X")]  // 位置从 2 调整到 1
```

**规则**：
- Insert 不受 Delete 影响（插入的内容不会被删除）
- 但 Insert 的位置需要根据 Delete 调整

### 3. Delete vs Delete

```typescript
// 文档: "ABCDE"
// Alice: 从位置 1 删除 2 个（"BC"） → "ADE"
// Bob:   从位置 2 删除 2 个（"CD"） → "ABE"

const aliceOp = [retain(1), deleteOp(2)];
const bobOp   = [retain(2), deleteOp(2)];

// Alice 收到 Bob 的操作
// Bob 要删除 "CD"，但 Alice 已删除 "BC"
// 重叠部分是 "C"（1 个字符）
transform(bobOp, aliceOp, "right");
// → [retain(1), deleteOp(1)]  // 只删除 "D"（C 已被删除）

// Bob 收到 Alice 的操作
// Alice 要删除 "BC"，但 Bob 已删除 "CD"
// 重叠部分是 "C"
transform(aliceOp, bobOp, "left");
// → [retain(1), deleteOp(1)]  // 只删除 "B"
```

**规则**：
- 计算删除的重叠部分
- 调整删除长度和位置

## 协同编辑的完整流程

```
【客户端 Alice】                【服务器】              【客户端 Bob】

1. 初始状态
   doc: "ABC"                 doc: "ABC"              doc: "ABC"
   version: 0                 version: 0              version: 0

2. Alice 编辑
   op: insert("X") at 0
   doc: "XABC"
   version: 1 (本地)
   
   发送 ──────────────────>
                              收到 Alice op
                              apply(doc, op)
                              doc: "XABC"
                              version: 1
                              
                              广播 ────────────────>  收到 op
                                                      apply(doc, op)
                                                      doc: "XABC"
                                                      version: 1

3. 并发编辑（关键）
   【Alice】                                          【Bob】
   op: insert("Y") at 2       version: 1             op: insert("Z") at 1
   doc: "XAYBC" (本地)                               doc: "XAZBC" (本地)
   
   发送 ─────────>            收到 Alice op          <───────── 发送
                              （先到）
                              apply(doc, op)
                              doc: "XAYBC"
                              version: 2
                              
                              收到 Bob op
                              （后到，需要 transform！）
                              op' = transform(
                                Bob_op,
                                Alice_op,
                                "right"
                              )
                              apply(doc, op')
                              doc: "XAYZBC"
                              version: 3
                              
   <─── 广播 Bob op'                                广播 Alice op ───>
   
   收到 Bob op'               doc: "XAYZBC"          收到 Alice op
   （已转换）                 version: 3             需要 transform
   apply(doc, op')                                   op' = transform(
   doc: "XAYZBC"                                       Alice_op,
                                                       Bob_op,
                                                       "left"
                                                     )
                                                     apply(doc, op')
                                                     doc: "XAYZBC"
                                                     version: 3

4. 最终状态（收敛）
   ✅ Alice: "XAYZBC"        ✅ Server: "XAYZBC"     ✅ Bob: "XAYZBC"
```

## 为什么 OT 很难？

### 1. Transform 的实现复杂

9 种组合 × 长度不匹配 × 边界情况 = 大量代码

### 2. TP2 很难保证

当有 3+ 个并发操作时，需要正确的转换顺序。

### 3. 撤销/重做很难

需要保存完整的操作历史，并正确转换撤销操作。

### 4. 性能问题

每个操作都需要与历史操作对比和转换。

## OT vs CRDT

| 特性 | OT | CRDT |
|------|----|----|
| **收敛保证** | 需要正确实现 TP1/TP2 | 数学保证自动收敛 |
| **中央服务器** | 需要（排序操作） | 不需要（P2P） |
| **实现复杂度** | 高（transform 复杂） | 中（数据结构复杂） |
| **性能** | 优（操作小） | 一般（元数据大） |
| **撤销/重做** | 困难 | 更困难 |
| **代表产品** | Google Docs, Quill | Figma, Notion |

## 小结

**OT 的核心**：
1. ✅ **Transform 函数**：转换操作以适应并发变化
2. ✅ **收敛性**：保证 TP1 和 TP2 性质
3. ✅ **中央服务器**：排序操作，简化协同
4. ✅ **实时性**：毫秒级同步

**接下来**：
- 实现 Transform 函数
- 实现客户端-服务器模型
- 创建协同编辑 Demo

准备好深入代码了吗？🚀

