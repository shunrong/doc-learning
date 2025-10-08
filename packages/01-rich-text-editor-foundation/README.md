# Phase 1: 富文本编辑器基础

> 理解 ContentEditable 和 Selection API，掌握 Quill Delta 数据结构

## 📖 学习目标

通过本阶段的学习，你将：

- ✅ 理解浏览器原生的 **ContentEditable** 能力和局限性
- ✅ 掌握 **Selection 和 Range API** 的使用
- ✅ 了解富文本编辑器的**数据结构**（Delta 格式）
- ✅ 实现基本的**格式化功能**
- ✅ 理解为什么需要富文本编辑器框架

## 🚀 快速开始

### 安装依赖
```bash
cd packages/01-rich-text-editor-foundation
pnpm install
```

### 运行开发服务器
```bash
pnpm dev
```

然后访问 http://localhost:5173

## 🎯 Demo 说明

### Demo 1: Quill 编辑器
展示 Quill 的基本使用和 Delta 数据结构的实时变化。

**学习重点：**
- Quill 的初始化和配置
- Delta 数据格式
- 文本变更监听

### Demo 2: 自定义编辑器
使用原生 `contenteditable` 和 `document.execCommand()` 实现简单的富文本编辑器。

**学习重点：**
- ContentEditable 的工作原理
- document.execCommand() 的使用
- 浏览器的默认行为和差异

### Demo 3: Selection API
深入理解 Selection 和 Range API，实现选区的获取、保存和恢复。

**学习重点：**
- Selection vs Range 的区别
- 如何获取和设置光标位置
- 如何保存和恢复选区

### Demo 4: Delta 数据结构
详细解析 Quill Delta 的三种操作类型：Insert、Delete、Retain。

**学习重点：**
- Delta 的设计理念
- 如何用 Delta 描述文档内容
- 如何用 Delta 描述变更操作

## 📚 理论文档

阅读顺序建议：

1. [ContentEditable API 详解](./docs/01-contenteditable-api.md)
   - ContentEditable 的基本概念
   - 浏览器差异和兼容性问题
   - 为什么需要富文本编辑器框架

2. [Selection 和 Range API](./docs/02-selection-range.md)
   - Selection API 核心概念
   - Range API 详解
   - 常见的光标操作场景

3. [Delta 数据结构设计原理](./docs/03-delta-format.md)
   - Delta 的设计思想
   - 三种操作类型详解
   - Delta 的组合和转换

4. [实现思路和最佳实践](./docs/04-implementation.md)
   - 如何选择技术方案
   - 常见问题和解决方案
   - 性能优化建议

## 🔑 核心概念

### 1. ContentEditable
浏览器提供的原生富文本编辑能力：
```html
<div contenteditable="true">可编辑内容</div>
```

**优点：**
- 原生支持，无需额外依赖
- 浏览器自动处理光标、输入法等

**缺点：**
- 跨浏览器行为不一致
- 生成的 HTML 结构难以控制
- 难以实现复杂的自定义功能

### 2. Selection 和 Range
- **Selection**: 用户选中的内容（可能包含多个 Range）
- **Range**: 文档中的一个连续区域

```javascript
const selection = window.getSelection();
const range = selection.getRangeAt(0);
```

### 3. Quill Delta
用于描述富文本内容和变更的 JSON 格式：

```javascript
// 文档内容
{
  ops: [
    { insert: 'Hello ', attributes: { bold: true } },
    { insert: 'World\n' }
  ]
}

// 变更操作
{
  ops: [
    { retain: 6 },           // 保留前 6 个字符
    { delete: 5 },           // 删除 5 个字符
    { insert: 'Quill' }      // 插入 'Quill'
  ]
}
```

## 💡 学习建议

### Day 1-2: 理论学习
- 阅读所有理论文档
- 运行 Demo，观察行为
- 在浏览器控制台实验 API

### Day 3-4: 动手实践
- 修改 Demo 代码，加入自己的功能
- 尝试实现一个最小化的编辑器
- 处理各种边界情况

### Day 5: 总结提升
- 整理学习笔记
- 对比不同编辑器的实现
- 思考协同编辑的需求

## 🎓 思考题

1. **为什么 ContentEditable 跨浏览器行为不一致？**
   <details>
   <summary>查看答案</summary>
   不同浏览器对 HTML 编辑的实现细节不同，比如：
   - Chrome 倾向于使用 `<b>` 标签
   - Firefox 倾向于使用 `<strong>` 标签
   - 换行的处理：`<div>` vs `<p>` vs `<br>`
   - 粘贴处理的差异
   </details>

2. **Selection 和 Range 有什么区别？**
   <details>
   <summary>查看答案</summary>
   - Selection 代表用户的选择，一个 Selection 可以包含多个 Range
   - Range 是文档中的一个连续区域
   - 通常情况下，一个 Selection 只有一个 Range
   - 在 Firefox 中，用户可以通过 Ctrl+点击创建多个 Range
   </details>

3. **为什么需要 Delta 这样的数据结构？**
   <details>
   <summary>查看答案</summary>
   - 统一的数据格式，避免直接操作 HTML
   - 便于计算文档变更（diff）
   - 支持协同编辑的操作转换
   - 易于序列化和传输
   - 与视图层解耦
   </details>

## 🔗 相关资源

### 官方文档
- [Quill 官方文档](https://quilljs.com/)
- [MDN - ContentEditable](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/contenteditable)
- [MDN - Selection API](https://developer.mozilla.org/zh-CN/docs/Web/API/Selection)
- [MDN - Range API](https://developer.mozilla.org/zh-CN/docs/Web/API/Range)

### 推荐阅读
- [Why ContentEditable is Terrible](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480)
- [Quill Delta 规范](https://quilljs.com/docs/delta/)

## ⏭️ 下一步

完成本阶段后，进入 **Phase 2: 文档数据结构与操作**，深入理解 Operation 的设计和实现。

---

**开始学习：** 运行 `pnpm dev`，然后打开浏览器开始探索！

