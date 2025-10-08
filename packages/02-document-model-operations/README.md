# Phase 2: 文档数据结构与操作

> 深入理解 Operation 模型、apply/invert/compose 方法、扁平化 vs 树形结构

## 📖 学习目标

通过本阶段的学习，你将：

- ✅ 掌握 **Operation 模型**的设计原理（insert/delete/retain）
- ✅ 实现 **apply、invert、compose** 三个核心方法
- ✅ 理解**扁平化**和**树形**两种数据模型的差异
- ✅ 为 Phase 5（OT）和 Phase 6（CRDT）打下基础
- ✅ 学会使用 **TypeScript** 和 **Vitest** 进行算法开发

## 🚀 快速开始

### 安装依赖
```bash
cd packages/02-document-model-operations
pnpm install
```

### 运行开发服务器
```bash
pnpm dev
```

然后访问 http://localhost:5174

### 运行测试
```bash
pnpm test        # 运行测试
pnpm test:ui     # 测试 UI 界面
pnpm test:coverage  # 测试覆盖率
```

## 🎯 Demo 说明

### Demo 1: Apply - 应用操作
展示如何将操作序列应用到文本上，生成新文本。

**核心代码：**
```typescript
const text = "Hello World";
const ops = [
  { type: 'retain', length: 6 },
  { type: 'delete', length: 5 },
  { type: 'insert', text: 'TypeScript' }
];
const result = apply(text, ops);
// result === "Hello TypeScript"
```

### Demo 2: Invert - 生成反向操作
展示如何生成操作的反向操作，用于实现撤销功能。

**核心代码：**
```typescript
const text = "Hello";
const ops = [retain(5), insert(" World")];
const inverse = invert(ops, text);
// inverse === [retain(5), deleteOp(6)]

// 验证：
apply(apply(text, ops), inverse) === text  // true
```

### Demo 3: Compose - 组合操作
展示如何将多个操作组合成一个，用于压缩历史记录。

**核心代码：**
```typescript
const ops1 = [insert("Hello")];
const ops2 = [retain(5), insert(" World")];
const composed = compose(ops1, ops2);
// composed === [insert("Hello World")]

// 验证：
apply(apply(text, ops1), ops2) === apply(text, composed)  // true
```

### Demo 4: 数据模型对比
对比扁平化（Delta）和树形（Slate）两种数据模型。

**扁平化模型（Quill Delta）：**
```json
{
  "ops": [
    { "insert": "Hello ", "attributes": { "bold": true } },
    { "insert": "World\n" }
  ]
}
```

**树形模型（Slate）：**
```json
{
  "type": "document",
  "children": [
    {
      "type": "paragraph",
      "children": [
        { "type": "text", "text": "Hello ", "bold": true },
        { "type": "text", "text": "World" }
      ]
    }
  ]
}
```

### Demo 5: 可视化执行流程
逐步可视化展示操作的执行过程，帮助理解每一步的变化。

## 📚 核心概念

### 1. Operation 的三种类型

#### Insert（插入）
```typescript
{ type: 'insert', text: 'Hello', attributes?: { bold: true } }
```
在当前位置插入文本，可选地应用格式。

#### Delete（删除）
```typescript
{ type: 'delete', length: 5 }
```
删除指定数量的字符。

#### Retain（保留）
```typescript
{ type: 'retain', length: 10, attributes?: { bold: true } }
```
保留（跳过）指定数量的字符，可选地应用或移除格式。

### 2. 三个核心方法

#### apply(text, ops)
将操作序列应用到文本上。

**算法：**
1. 遍历操作序列
2. Insert：插入文本
3. Delete：跳过指定长度
4. Retain：复制指定长度的文本

#### invert(ops, originalText)
生成反向操作（用于撤销）。

**映射关系：**
- Insert → Delete
- Delete → Insert（插入被删除的文本）
- Retain → Retain

#### compose(ops1, ops2)
组合两个操作序列。

**数学性质：**
```typescript
apply(apply(text, ops1), ops2) === apply(text, compose(ops1, ops2))
```

### 3. 数据模型对比

| 维度 | 扁平化（Delta） | 树形（Slate） |
|------|----------------|--------------|
| **结构** | 线性、简单 | 嵌套、复杂 |
| **适用场景** | 线性文本 | 复杂文档 |
| **协同编辑** | 容易（OT） | 较难 |
| **自定义节点** | 有限 | 灵活 |
| **类型约束** | 弱 | 强（Schema） |

## 🧪 测试覆盖

完整的测试用例覆盖：

- ✅ apply 的各种场景
- ✅ invert 的正确性验证
- ✅ compose 的数学性质
- ✅ 边界情况处理
- ✅ 中文和 Emoji 支持

运行测试查看详情：
```bash
pnpm test:coverage
```

## 📖 理论文档

阅读顺序建议：

1. [Operation 模型设计](./docs/01-operation-model.md)
   - Operation 的设计理念
   - 三种操作类型详解
   - 为什么需要 Retain？

2. [核心方法实现](./docs/02-core-methods.md)
   - apply 的实现细节
   - invert 的数学推导
   - compose 的算法分析

3. [扁平化 vs 树形结构](./docs/03-flat-vs-tree.md)
   - 两种模型的对比
   - 适用场景分析
   - 如何选择？

4. [为协同编辑铺路](./docs/04-prepare-for-ot.md)
   - Operation 与 OT 的关系
   - Transform 函数预览
   - 下一步学习方向

## 💡 学习建议

### Day 1-2: 理解 Operation
1. 运行 Demo 1，观察 apply 的执行
2. 阅读 `src/operation.ts` 的代码
3. 理解三种操作类型的含义
4. 思考：为什么需要 Retain？

### Day 3-4: 深入算法
1. 阅读 `docs/02-core-methods.md`
2. 研究 invert 和 compose 的实现
3. 运行测试，理解每个用例
4. 尝试手写一个简化版的 apply

### Day 5-6: 数据模型对比
1. 运行 Demo 4，对比两种模型
2. 阅读 `docs/03-flat-vs-tree.md`
3. 思考：哪种模型更适合协同编辑？
4. 尝试用树形结构表示复杂文档

### Day 7: 总结与展望
1. 整理学习笔记
2. 阅读 `docs/04-prepare-for-ot.md`
3. 思考：如何处理并发编辑？
4. 为 Phase 5（OT）做准备

## 🔑 关键洞察

### 1. Operation 是协同编辑的基础
所有协同编辑算法（OT、CRDT）都建立在 Operation 之上。

### 2. 三个核心方法的重要性
- **apply**：编辑器的核心功能
- **invert**：撤销重做的基础
- **compose**：性能优化的关键

### 3. 数据结构的选择影响一切
- 扁平化 → 简单、易于协同（Phase 5 OT）
- 树形 → 强大、适合复杂场景（Phase 6 CRDT）

### 4. TypeScript 的价值
Operation 的类型定义确保了算法的正确性。

## 🎓 思考题

### 1. 为什么需要 Retain 操作？
<details>
<summary>查看答案</summary>

如果只有 Insert 和 Delete，无法描述"在文档中间插入"的操作。

例如，要在 "Hello World" 的中间插入 "Beautiful "：
- ❌ 不行：`[insert("Beautiful ")]` - 会插入到开头
- ✅ 需要：`[retain(6), insert("Beautiful ")]` - 跳过 "Hello "，再插入

Retain 用于定位操作的位置。
</details>

### 2. invert 和 undo 有什么区别？
<details>
<summary>查看答案</summary>

- **invert**：生成反向操作（算法层面）
- **undo**：撤销用户操作（应用层面）

Undo 需要：
1. 记录操作历史
2. 调用 invert 生成反向操作
3. 应用反向操作

invert 只是 undo 的一个组成部分。
</details>

### 3. compose 的应用场景？
<details>
<summary>查看答案</summary>

1. **压缩历史记录**：用户连续输入 "H" "e" "l" "l" "o"，可以组合成一个操作
2. **离线编辑**：积累多个操作，上线后一次性同步
3. **性能优化**：减少操作数量，提升应用性能

compose 是优化的关键！
</details>

### 4. 扁平化和树形结构各适合什么场景？
<details>
<summary>查看答案</summary>

**扁平化（Delta）适合：**
- 线性文本编辑
- 协同编辑（OT 算法）
- 简单的富文本需求

**树形结构适合：**
- 复杂的嵌套结构（表格、列表）
- 自定义节点类型
- 需要 Schema 约束

Google Docs 用扁平化，Notion 用树形。
</details>

## ⏭️ 下一步

完成本阶段后，你可以：

### 选择 1：继续深入（Phase 3）
学习历史记录与撤销重做，实践 invert 的应用。

### 选择 2：跳到实战（Phase 4）
学习 WebSocket 实时通信，为协同编辑打基础。

### 选择 3：直接协同（Phase 6）
使用 Yjs 快速实现协同编辑（跳过理论）。

**推荐：** 按顺序学习 Phase 3 → Phase 4，理解完整体系。

## 🔗 相关资源

### 代码示例
- `src/operation.ts` - Operation 核心实现
- `src/delta.ts` - Delta 模型实现
- `src/tree.ts` - 树形模型实现
- `src/operation.test.ts` - 完整测试用例

### 文档
- `docs/` - 理论文档
- 根目录 `docs/tech-comparison.md` - 技术方案对比

### 参考
- [Quill Delta](https://quilljs.com/docs/delta/)
- [Slate Data Model](https://docs.slatejs.org/concepts/02-nodes)

---

**开始学习：** 运行 `pnpm dev`，打开浏览器探索 5 个 Demo！🚀

