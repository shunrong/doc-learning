# Delta 数据结构设计原理

## 什么是 Delta？

Delta 是 Quill 编辑器使用的文档格式，它是一种基于 JSON 的格式，可以同时描述：
1. **文档内容**（Document）
2. **变更操作**（Change）

这种双重用途的设计是 Delta 的精妙之处。

## 为什么需要 Delta？

### 问题：直接使用 HTML 的缺陷

```html
<!-- HTML 很难进行结构化操作 -->
<p>
  <strong style="color: red">Hello</strong>
  <em>World</em>
</p>

<!-- 如何表示"在 Hello 和 World 之间插入空格"这个操作？ -->
<!-- 如何计算两个版本的 diff？ -->
<!-- 如何合并多人的编辑？ -->
```

### 解决方案：抽象的数据结构

Delta 提供了：
- ✅ 统一的数据格式
- ✅ 易于序列化和传输
- ✅ 便于计算变更
- ✅ 支持协同编辑
- ✅ 与视图层解耦

## Delta 的结构

Delta 是一个包含 `ops` 数组的对象：

```javascript
{
  ops: [
    { insert: "Hello" },
    { insert: " " },
    { insert: "World", attributes: { bold: true } },
    { insert: "\n" }
  ]
}
```

## 三种操作类型

Delta 有三种操作类型：`insert`、`delete`、`retain`

### 1. Insert（插入）

```javascript
// 插入纯文本
{ insert: "Hello" }

// 插入带格式的文本
{ insert: "Hello", attributes: { bold: true } }

// 插入带多个属性的文本
{
  insert: "标题",
  attributes: {
    bold: true,
    color: "#ff0000",
    size: "large"
  }
}

// 插入换行（带段落格式）
{ insert: "\n", attributes: { header: 1 } }

// 插入嵌入对象（如图片）
{ insert: { image: "https://example.com/image.png" } }

// 插入视频
{ insert: { video: "https://example.com/video.mp4" } }
```

### 2. Delete（删除）

```javascript
// 删除 5 个字符
{ delete: 5 }

// 注意：delete 只有一个数字参数
// 表示删除多少个字符
```

### 3. Retain（保留）

```javascript
// 保留（跳过）3 个字符
{ retain: 3 }

// 保留 3 个字符，并应用格式
{ retain: 3, attributes: { bold: true } }

// 保留 3 个字符，并移除格式
{ retain: 3, attributes: { bold: null } }
```

## 描述文档内容

Delta 用 `insert` 操作描述文档内容：

### 示例 1：纯文本

```javascript
// 文档内容：Hello World
{
  ops: [
    { insert: "Hello World\n" }
  ]
}
```

### 示例 2：带格式文本

```javascript
// 文档内容：
// Hello（粗体） World（斜体）
{
  ops: [
    { insert: "Hello", attributes: { bold: true } },
    { insert: " " },
    { insert: "World", attributes: { italic: true } },
    { insert: "\n" }
  ]
}
```

### 示例 3：标题和段落

```javascript
// 文档内容：
// # 富文本编辑器（H1）
// 这是一个段落。
{
  ops: [
    { insert: "富文本编辑器" },
    { insert: "\n", attributes: { header: 1 } },
    { insert: "这是一个段落。" },
    { insert: "\n" }
  ]
}
```

### 示例 4：列表

```javascript
// 文档内容：
// • 第一项
// • 第二项
// • 第三项
{
  ops: [
    { insert: "第一项" },
    { insert: "\n", attributes: { list: "bullet" } },
    { insert: "第二项" },
    { insert: "\n", attributes: { list: "bullet" } },
    { insert: "第三项" },
    { insert: "\n", attributes: { list: "bullet" } }
  ]
}
```

### 示例 5：嵌入内容

```javascript
// 文档包含文本和图片
{
  ops: [
    { insert: "这是一张图片：\n" },
    {
      insert: {
        image: "https://example.com/image.png"
      },
      attributes: {
        width: "300"
      }
    },
    { insert: "\n" }
  ]
}
```

## 描述变更操作

Delta 也可以用来描述如何修改文档：

### 示例 1：在开头插入文本

```javascript
// 原文档：Hello World
// 操作：在开头插入 "Hi, "
// 结果：Hi, Hello World

{
  ops: [
    { insert: "Hi, " }
  ]
}
```

### 示例 2：在中间插入文本

```javascript
// 原文档：Hello World
// 操作：在 "Hello" 后插入 " Beautiful"
// 结果：Hello Beautiful World

{
  ops: [
    { retain: 5 },        // 保留 "Hello"
    { insert: " Beautiful" }
  ]
}
```

### 示例 3：删除文本

```javascript
// 原文档：Hello World
// 操作：删除 " World"
// 结果：Hello

{
  ops: [
    { retain: 5 },        // 保留 "Hello"
    { delete: 6 }         // 删除 " World"
  ]
}
```

### 示例 4：替换文本

```javascript
// 原文档：Hello World
// 操作：将 "World" 替换为 "Quill"
// 结果：Hello Quill

{
  ops: [
    { retain: 6 },        // 保留 "Hello "
    { delete: 5 },        // 删除 "World"
    { insert: "Quill" }   // 插入 "Quill"
  ]
}
```

### 示例 5：应用格式

```javascript
// 原文档：Hello World
// 操作：将 "World" 设置为粗体
// 结果：Hello **World**

{
  ops: [
    { retain: 6 },        // 保留 "Hello "
    { retain: 5, attributes: { bold: true } }  // 给 "World" 加粗
  ]
}
```

### 示例 6：移除格式

```javascript
// 原文档：Hello **World**（World 是粗体）
// 操作：移除粗体
// 结果：Hello World

{
  ops: [
    { retain: 6 },        // 保留 "Hello "
    { retain: 5, attributes: { bold: null } }  // 移除粗体
  ]
}
```

## Delta 的组合（Compose）

两个 Delta 可以组合成一个：

```javascript
const delta1 = new Delta([
  { insert: "Hello" }
]);

const delta2 = new Delta([
  { retain: 5 },
  { insert: " World" }
]);

// 组合：先应用 delta1，再应用 delta2
const composed = delta1.compose(delta2);
// 结果：{ ops: [{ insert: "Hello World" }] }
```

### 组合的应用场景

1. **压缩历史记录**
   ```javascript
   // 用户连续输入 "H" "e" "l" "l" "o"
   // 不需要保存 5 个操作，可以组合成一个
   const combined = op1.compose(op2).compose(op3).compose(op4).compose(op5);
   ```

2. **应用多个变更**
   ```javascript
   // 离线时积累的多个操作
   const allChanges = changes.reduce((acc, change) => acc.compose(change), new Delta());
   ```

## Delta 的转换（Transform）

协同编辑的核心！当两个用户同时编辑时，需要转换操作。

```javascript
// 用户 A 的操作
const opA = new Delta([
  { retain: 5 },
  { insert: "Beautiful " }
]);

// 用户 B 的操作（同时进行）
const opB = new Delta([
  { retain: 11 },
  { insert: "!" }
]);

// 转换：使两个操作能够协同
const opA_prime = opA.transform(opB, true);
const opB_prime = opB.transform(opA, false);

// 应用转换后的操作，结果一致
doc.compose(opA).compose(opB_prime)  // 结果相同
doc.compose(opB).compose(opA_prime)  // 结果相同
```

这是 **Operational Transformation (OT)** 算法的基础，我们在 Phase 5 会深入学习。

## Delta 的差异（Diff）

计算两个文档之间的差异：

```javascript
const doc1 = new Delta([
  { insert: "Hello World\n" }
]);

const doc2 = new Delta([
  { insert: "Hello Beautiful World\n" }
]);

// 计算 diff
const diff = doc1.diff(doc2);
// 结果：{ ops: [
//   { retain: 6 },
//   { insert: "Beautiful " }
// ]}
```

## 属性（Attributes）

### 行内格式（Inline Formats）

应用于文本字符：

```javascript
{
  bold: true,           // 粗体
  italic: true,         // 斜体
  underline: true,      // 下划线
  strike: true,         // 删除线
  color: "#ff0000",     // 文字颜色
  background: "#ffff00",// 背景色
  size: "large",        // 字体大小
  font: "serif",        // 字体
  link: "https://...",  // 链接
  script: "super"       // 上标/下标
}
```

### 块级格式（Block Formats）

应用于换行符（段落）：

```javascript
{
  header: 1,            // 标题级别（1-6）
  list: "bullet",       // 列表类型（bullet/ordered）
  blockquote: true,     // 引用块
  code-block: true,     // 代码块
  align: "center",      // 对齐方式
  indent: 1             // 缩进级别
}
```

### 嵌入对象（Embeds）

```javascript
// 图片
{
  insert: {
    image: "url"
  }
}

// 视频
{
  insert: {
    video: "url"
  }
}

// 自定义嵌入
{
  insert: {
    mention: {
      id: "123",
      value: "@username"
    }
  }
}
```

## Delta 的规范化

Delta 会自动规范化操作：

### 合并相邻的相同操作

```javascript
// 输入
{
  ops: [
    { insert: "Hello" },
    { insert: " " },
    { insert: "World" }
  ]
}

// 规范化后
{
  ops: [
    { insert: "Hello World" }
  ]
}
```

### 删除空操作

```javascript
// 输入
{
  ops: [
    { insert: "Hello" },
    { retain: 0 },        // 无效操作
    { insert: "" },       // 无效操作
    { delete: 0 },        // 无效操作
    { insert: " World" }
  ]
}

// 规范化后
{
  ops: [
    { insert: "Hello World" }
  ]
}
```

## 实现一个简单的 Delta

理解了原理，我们可以自己实现一个简化版：

```javascript
class SimpleDelta {
  constructor(ops = []) {
    this.ops = ops;
  }
  
  // 插入文本
  insert(text, attributes) {
    this.ops.push({ insert: text, attributes });
    return this;
  }
  
  // 删除
  delete(length) {
    if (length > 0) {
      this.ops.push({ delete: length });
    }
    return this;
  }
  
  // 保留
  retain(length, attributes) {
    if (length > 0) {
      this.ops.push({ retain: length, attributes });
    }
    return this;
  }
  
  // 应用到文本
  apply(text) {
    let result = '';
    let index = 0;
    
    for (const op of this.ops) {
      if (op.insert) {
        result += op.insert;
      } else if (op.delete) {
        index += op.delete;
      } else if (op.retain) {
        result += text.substring(index, index + op.retain);
        index += op.retain;
      }
    }
    
    // 添加剩余文本
    result += text.substring(index);
    
    return result;
  }
  
  // 计算长度
  length() {
    return this.ops.reduce((len, op) => {
      if (op.insert) {
        return len + (typeof op.insert === 'string' ? op.insert.length : 1);
      } else if (op.delete) {
        return len;
      } else if (op.retain) {
        return len + op.retain;
      }
      return len;
    }, 0);
  }
}

// 使用示例
const delta = new SimpleDelta();
delta.insert("Hello ")
     .insert("World", { bold: true })
     .insert("\n");

// 应用变更
const originalText = "Test";
const changeDelta = new SimpleDelta();
changeDelta.retain(4).insert(" Delta");

const result = changeDelta.apply(originalText);
console.log(result); // "Test Delta"
```

## Delta 的优势总结

### 1. 结构化
- 不是杂乱的 HTML，而是清晰的 JSON
- 易于解析和处理

### 2. 可组合
- 多个 Delta 可以组合成一个
- 便于压缩历史记录

### 3. 可转换
- 支持 OT 算法
- 是协同编辑的基础

### 4. 可序列化
- JSON 格式，易于传输和存储
- 跨语言兼容

### 5. 与视图分离
- 数据层和视图层解耦
- 可以用不同的方式渲染（HTML、Canvas、移动端）

## 与其他数据格式的对比

### Delta vs HTML

```javascript
// HTML
"<p><strong>Hello</strong> World</p>"
// 难以计算变更、难以协同

// Delta
{
  ops: [
    { insert: "Hello", attributes: { bold: true } },
    { insert: " World\n" }
  ]
}
// 易于操作、易于协同
```

### Delta vs Markdown

```javascript
// Markdown
"**Hello** World"
// 易读但难以表示复杂格式

// Delta
// 既能表示复杂格式，又能描述操作
```

### Delta vs 树形结构（如 Slate）

```javascript
// Slate 的树形结构
{
  type: 'paragraph',
  children: [
    { type: 'text', text: 'Hello', bold: true },
    { type: 'text', text: ' World' }
  ]
}
// 更适合复杂的嵌套结构

// Delta 的扁平结构
// 更简单，更适合线性文本
```

## 实践建议

1. **始终以 Delta 为数据源**
   - 不要依赖 DOM 结构
   - DOM 只是 Delta 的渲染结果

2. **用 Delta 描述变更**
   - 不要直接修改 DOM
   - 生成 Delta，应用到数据，再重新渲染

3. **善用 compose 和 transform**
   - 压缩历史记录用 compose
   - 协同编辑用 transform

4. **理解操作的顺序**
   - Delta 的操作是有顺序的
   - retain 和 delete 都是从当前位置开始

## 小结

Delta 是现代富文本编辑器的核心数据结构：

1. **双重用途**：既描述内容，又描述变更
2. **三种操作**：insert、delete、retain
3. **可组合**：compose 操作
4. **可转换**：transform 操作（协同编辑基础）
5. **结构化**：比 HTML 更易于操作

掌握 Delta 后，你就理解了富文本编辑器的"内功"。下一步，我们将学习如何基于 Delta 实现更复杂的功能。

## 参考资源

- [Quill Delta 官方文档](https://quilljs.com/docs/delta/)
- [Delta 规范](https://github.com/quilljs/delta)
- [Operational Transformation 入门](https://operational-transformation.github.io/)

