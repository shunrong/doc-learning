# 为什么 Compose 这么复杂？

## 问题背景

`compose` 函数看起来非常复杂，有大量的条件分支和状态管理。这是必须的吗？

## 简短回答

**是的，必须这么复杂。** 真实生产环境（Quill、ShareDB、Automerge）的实现甚至更复杂。

## 核心挑战

### 挑战 1：操作作用的"文档空间"不同

```typescript
// ops1 作用于原始文档
// ops2 作用于 apply(原始文档, ops1) 的结果文档
// composed 必须直接作用于原始文档，得到相同结果

const original = "ABC";
const ops1 = [retain(1), insert("X")];  // 作用于 "ABC" → "AXBC"
const ops2 = [retain(2), insert("Y")];  // 作用于 "AXBC" → "AXYBC"

// 问题：如何直接从 "ABC" 到 "AXYBC"？
const composed = compose(ops1, ops2);
// composed 必须是 [retain(1), insert("XY"), retain(2)]
```

**关键**：ops2 中的 `retain(2)` 在不同的文档空间！
- 对于 "AXBC"，`retain(2)` 是 "AX"
- 但在原始文档 "ABC" 中，我们需要区分：
  - 第 1 个字符是原文档的（retain）
  - 第 2 个字符是 ops1 插入的（不需要 retain）

### 挑战 2：Insert + Delete 的相互抵消

```typescript
const ops1 = [insert("Hello")];
const ops2 = [deleteOp(3)];

// 用户先插入 "Hello"，然后立刻删除前 3 个字符 "Hel"
// 最终结果应该是只插入 "lo"

const composed = compose(ops1, ops2);
// composed = [insert("lo")]  ← 两个操作"抵消"了部分内容
```

**为什么复杂**：
- 需要判断 insert 和 delete 的相对长度
- 需要处理 3 种情况：insert 更长、delete 更长、长度相等
- 需要"切割"操作（如 `insert("Hello")` 切成 `insert("lo")`）

### 挑战 3：Retain + Delete/Retain 的"空间转换"

```typescript
const ops1 = [retain(5), insert("XX")];  // 原文档 5 个字符 + 插入 "XX"
const ops2 = [retain(3), deleteOp(2)];   // 在结果文档中 retain 3, delete 2

// 问题：ops2 的 retain(3) 对应 ops1 的什么？
// - 前 3 个字符可能来自原文档的 retain
// - 也可能包含 ops1 的 insert

// 如果原文档是 "ABCDE"：
// ops1 → "ABCDEXX"
// ops2 的 retain(3) = "ABC"（都来自原文档）
// ops2 的 delete(2) = "DE"（也来自原文档）

// 所以 composed = [retain(3), deleteOp(2), insert("XX")]
```

**为什么复杂**：
- 需要"同步"遍历两个操作序列
- 需要根据长度"切割"操作（如果 ops1 和 ops2 的长度不匹配）
- 需要记住"剩余部分"并继续处理

### 挑战 4：操作长度不匹配的"切割"

```typescript
const ops1 = [insert("ABCDE")];     // 长度 5
const ops2 = [retain(2), deleteOp(1)];  // retain 2, delete 1

// ops2 的 retain(2) 对应 ops1 的 "AB"
// ops2 的 delete(1) 对应 ops1 的 "C"
// 但 ops1 还剩 "DE" 没处理

// 解决方案：需要"切割" ops1 的 insert
// 第一次处理：insert("AB") + retain(2) → insert("AB")
// 第二次处理：insert("C") + delete(1) → （抵消）
// 第三次处理：insert("DE") + （ops2 已结束）→ insert("DE")

// 最终：composed = [insert("ABDE")]
```

## 代码结构分析

让我们逐行理解 compose 的实现：

```typescript
export function compose(ops1: Operation[], ops2: Operation[]): Operation[] {
  const result: Operation[] = [];
  
  // 两个指针，分别遍历 ops1 和 ops2
  let i = 0;
  let j = 0;
  
  // 关键：保持"当前操作的剩余部分"
  let op1: Operation | null = i < ops1.length ? ops1[i] : null;
  let op2: Operation | null = j < ops2.length ? ops2[j] : null;
  
  while (op1 || op2) {
    // ... 处理各种组合
  }
}
```

### 为什么需要 `op1/op2` 变量（而不是直接用 `ops1[i]`）？

因为操作可能被"部分消耗"：

```typescript
// 示例：
op1 = insert("ABCDE");  // 长度 5
op2 = retain(2);         // 长度 2

// 第一轮处理：
// - op2 的 retain(2) 只消耗 op1 的前 2 个字符
// - op1 剩余 "CDE" 需要继续处理
// - 所以更新 op1 = insert("CDE")，但 i 不变

op1 = insert(op1.text.substring(2));  // "CDE"
```

## 9 种核心组合

```typescript
// 优先级最高（直接输出）
1. [任意] + Insert    → Insert（ops2 的 insert 直接输出）
2. Delete + [任意]    → Delete（ops1 的 delete 直接输出）

// 需要"交互"处理的 4 种组合
3. Insert + Delete    → 相互抵消（可能部分或全部）
4. Insert + Retain    → Insert（保留插入的内容）
5. Retain + Delete    → Delete（原文档的内容被删除）
6. Retain + Retain    → Retain（原文档的内容保留）

// 边界情况
7. ops1 耗尽，ops2 剩余  → 直接添加 ops2 剩余部分
8. ops2 耗尽，ops1 剩余  → 直接添加 ops1 剩余部分
9. 长度不匹配时的"切割"处理
```

## 真实生产环境的实现

### Quill Delta

Quill 的 Delta 实现：
https://github.com/quilljs/delta/blob/main/src/Delta.ts

```typescript
// Quill 的 compose 实现（简化版）
compose(other: Delta): Delta {
  const thisIter = new Iterator(this.ops);
  const otherIter = new Iterator(other.ops);
  const ops = [];
  
  while (thisIter.hasNext() || otherIter.hasNext()) {
    // 处理各种组合...
    // 代码量 ~100 行
  }
  
  return new Delta(ops);
}
```

### ShareDB (OT 引擎)

ShareDB 的 text OT 实现更复杂，还要处理并发操作的转换：

```typescript
// ShareDB OT transform 函数
// 不仅要 compose，还要处理冲突
function transform(op1, op2, side) {
  // 处理两个并发操作的转换
  // 代码量 ~200 行
}
```

## 为什么不能简化？

### ❌ 错误的简化尝试 1：直接连接

```typescript
// 错误！
function compose(ops1, ops2) {
  return [...ops1, ...ops2];
}

// 测试：
const ops1 = [insert("ABC")];
const ops2 = [deleteOp(1)];
const composed = [...ops1, ...ops2];  // [insert("ABC"), delete(1)]

// 应用到空文档：
apply("", composed);  // "ABC" → "BC" ✗ 错误！

// 正确结果：
const correct = compose(ops1, ops2);  // [insert("BC")]
apply("", correct);  // "" → "BC" ✓ 正确
```

### ❌ 错误的简化尝试 2：先 apply 再生成

```typescript
// 低效！
function compose(ops1, ops2) {
  const intermediate = apply("", ops1);
  const final = apply(intermediate, ops2);
  // 然后反向工程出操作？无法做到！
}
```

**问题**：从两个字符串无法反推出操作序列！

```typescript
const before = "ABC";
const after = "AXC";
// 可能的操作：
// - [retain(1), delete(1), insert("X"), retain(1)]
// - [retain(1), insert("X"), delete(1), retain(1)]
// - 甚至 [delete(3), insert("AXC")]
// 无法确定哪个是正确的！
```

## 结论

**Compose 必须这么复杂**，因为它要：

1. ✅ **保证数学正确性**：`apply(text, compose(ops1, ops2)) === apply(apply(text, ops1), ops2)`
2. ✅ **处理所有组合**：3 种操作 × 3 种操作 = 9 种交互
3. ✅ **处理长度不匹配**：需要"切割"操作
4. ✅ **优化结果**：合并相邻操作（通过 normalize）
5. ✅ **为 OT 打基础**：协同编辑需要 compose 来合并操作历史

真实生产环境中的实现甚至更复杂，因为还要处理：
- **Attributes**（格式化）
- **Embeds**（图片、视频）
- **性能优化**
- **边界情况**（emoji、多字节字符）

所以这份实现已经是**简化版**，但核心逻辑是完整的！

