# 为什么需要 Operation？

## 从 Phase 1 的问题说起

还记得 Phase 1 的核心结论吗？

> **HTML 无法结构化，需要用 JSON 数据结构。**

现在我们深入一步：**不仅要用 JSON 表示文档，还要用 JSON 表示变更！**

## 问题场景

### 场景 1：如何描述"在位置5插入文字"？

```javascript
// ❌ 直接操作 HTML
const div = document.getElementById('editor');
div.innerHTML = div.innerHTML.substring(0, 5) + '新文字' + div.innerHTML.substring(5);
// 问题：HTML 结构被破坏了！
```

```javascript
// ✅ 用 Operation 描述
const op = [
  { type: 'retain', length: 5 },
  { type: 'insert', text: '新文字' }
];
// 清晰、可序列化、可传输！
```

### 场景 2：如何实现撤销功能？

```javascript
// ❌ 用 HTML
// 无法知道之前删除的是什么内容

// ✅ 用 Operation
const originalText = "Hello World";
const deleteOp = [retain(6), deleteOp(5)];
const invertOp = invert(deleteOp, originalText);
// invertOp === [retain(6), insert("World")]
// 可以完美还原！
```

### 场景 3：如何实现协同编辑？

```javascript
// 用户A：在位置5插入 "abc"
const opA = [retain(5), insert("abc")];

// 用户B（同时）：在位置3删除2个字符
const opB = [retain(3), deleteOp(2)];

// ❌ 用 HTML：无法合并这两个操作
// ✅ 用 Operation：可以用 transform 算法处理冲突（Phase 5 会学）
```

## Operation 的价值

### 1. 结构化的变更描述

**不是这样：**
```javascript
"在第5个字符后面插入'abc'" // 字符串描述，无法执行
```

**而是这样：**
```typescript
{ type: 'retain', length: 5 }
{ type: 'insert', text: 'abc' }
// 机器可读、可执行、可验证
```

### 2. 可逆性

每个 Operation 都可以生成反向操作：

```typescript
insert(text)  ↔  delete(text.length)
delete(n)     ↔  insert(deletedText)
retain(n)     ↔  retain(n)
```

这是 **Undo/Redo** 的基础。

### 3. 可组合性

多个 Operation 可以组合成一个：

```typescript
compose(
  [insert("H")],
  [retain(1), insert("ello")]
) === [insert("Hello")]
```

这是 **性能优化** 的基础。

### 4. 可转换性（协同编辑的核心）

并发的 Operation 可以转换：

```typescript
transform(opA, opB) → [opA', opB']

// 保证：
apply(opB, apply(opA, doc)) === apply(opA', apply(opB', doc))
```

这是 **协同编辑（OT）** 的基础（Phase 5 会深入）。

## Operation 的三种类型

### Insert - 插入

```typescript
{ type: 'insert', text: 'Hello' }
```

**含义：** 在当前位置插入文本

**效果：**
```
before: "World"
after:  "HelloWorld"
        ^
        插入位置
```

### Delete - 删除

```typescript
{ type: 'delete', length: 5 }
```

**含义：** 删除当前位置的 N 个字符

**效果：**
```
before: "HelloWorld"
after:  "World"
        ^^^^^
        删除
```

### Retain - 保留

```typescript
{ type: 'retain', length: 5 }
```

**含义：** 跳过（保留）N 个字符，移动到下一个位置

**效果：**
```
"HelloWorld"
 ^^^^^ (跳过)
      ^ 现在在这里
```

**为什么需要 Retain？**

如果只有 Insert 和 Delete，如何在文档中间插入？

```
// 要在 "Hello World" 的中间插入 "Beautiful "
原文: "Hello World"
目标: "Hello Beautiful World"

// ❌ 没有 Retain，只能这样：
[delete(11), insert("Hello Beautiful World")]
// 删除所有，重新插入 — 效率低！

// ✅ 有了 Retain，可以这样：
[retain(6), insert("Beautiful ")]
// 跳过 "Hello "，插入新内容 — 高效！
```

**Retain 就像是光标移动！**

## Operation 与 Phase 1 的对比

### Phase 1: Selection API
```javascript
// 获取光标位置
const selection = window.getSelection();
const range = selection.getRangeAt(0);
```

**问题：** Selection 描述的是"位置"，不是"操作"

### Phase 2: Operation
```typescript
// 描述在某个位置的操作
{ type: 'retain', length: 5 }  // 移动到位置5
{ type: 'insert', text: 'abc' } // 插入
```

**优势：** Operation 描述"如何改变文档"

**关系：**
```
Selection/Range (Phase 1) → 获取位置
Operation (Phase 2)       → 描述在该位置的操作
```

## Operation 与协同编辑的关系

这是 Phase 2 最重要的洞察！

### 协同编辑的挑战

```
初始文档: "Hello World"

用户A: 在位置6插入 "Beautiful "
用户B: 在位置0插入 "Oh, "

问题：两个操作如何合并？
```

### 用 Operation 表示

```typescript
const opA = [retain(6), insert("Beautiful ")];
const opB = [insert("Oh, ")];

// Phase 5 会学的 transform 函数：
const [opA', opB'] = transform(opA, opB);

// 结果：
apply(opB, apply(opA, doc)) === apply(opA', apply(opB', doc))
// 最终都是："Oh, Hello Beautiful World"
```

**Operation 让并发操作可以数学化地处理！**

## 小结

### Operation 解决的问题

1. ✅ **结构化变更** - 用 JSON 描述编辑操作
2. ✅ **可逆性** - 实现 Undo/Redo
3. ✅ **可组合性** - 压缩历史记录
4. ✅ **可转换性** - 协同编辑（OT/CRDT 的基础）

### Operation 的三种类型

- **Insert** - 插入文本
- **Delete** - 删除文本
- **Retain** - 跳过（定位）

### Operation 在学习路径中的位置

```
Phase 1: 原生 API（ContentEditable、Selection）
   ↓
Phase 2: Operation 模型 ← 你在这里
   ↓
Phase 3: 撤销重做（应用 invert）
   ↓
Phase 4: 实时通信（传输 Operation）
   ↓
Phase 5: OT 算法（transform Operation）
   ↓
Phase 6: CRDT 算法（另一种协同方案）
```

**Operation 是整个协同编辑的基石！**

---

下一步：阅读 `02-core-methods.md`，深入理解 apply、invert、compose 的实现。

