# ContentEditable API 详解

## 什么是 ContentEditable？

`contenteditable` 是 HTML5 提供的一个全局属性，可以让任何 HTML 元素变得可编辑。

```html
<div contenteditable="true">
  这段文本可以编辑
</div>
```

## 基本用法

### 启用编辑
```html
<!-- 可编辑 -->
<div contenteditable="true">可编辑内容</div>

<!-- 不可编辑（默认） -->
<div contenteditable="false">不可编辑</div>

<!-- 继承父元素 -->
<div contenteditable="inherit">继承</div>
```

### JavaScript 操作
```javascript
const div = document.getElementById('editor');

// 启用编辑
div.contentEditable = 'true';

// 检查是否可编辑
console.log(div.isContentEditable); // true

// 禁用编辑
div.contentEditable = 'false';
```

## 核心 API：document.execCommand()

这是操作可编辑内容的主要 API（虽然已被标记为废弃，但仍广泛使用）。

### 常用命令

#### 文本格式化
```javascript
// 粗体
document.execCommand('bold');

// 斜体
document.execCommand('italic');

// 下划线
document.execCommand('underline');

// 删除线
document.execCommand('strikeThrough');

// 字体颜色
document.execCommand('foreColor', false, '#ff0000');

// 背景色
document.execCommand('backColor', false, '#ffff00');
```

#### 段落格式
```javascript
// 标题
document.execCommand('formatBlock', false, 'h1');
document.execCommand('formatBlock', false, 'h2');

// 段落
document.execCommand('formatBlock', false, 'p');

// 对齐
document.execCommand('justifyLeft');
document.execCommand('justifyCenter');
document.execCommand('justifyRight');
document.execCommand('justifyFull');
```

#### 列表
```javascript
// 无序列表
document.execCommand('insertUnorderedList');

// 有序列表
document.execCommand('insertOrderedList');
```

#### 撤销重做
```javascript
// 撤销
document.execCommand('undo');

// 重做
document.execCommand('redo');
```

### 查询命令状态
```javascript
// 检查当前选区是否为粗体
const isBold = document.queryCommandState('bold');

// 检查命令是否可用
const canUndo = document.queryCommandEnabled('undo');

// 获取命令的值
const fontSize = document.queryCommandValue('fontSize');
```

## 浏览器差异问题

这是 ContentEditable 最大的痛点！

### 1. 换行处理差异

**Chrome/Safari:**
```html
<!-- 按 Enter 创建新的 <div> -->
<div>第一行</div>
<div>第二行</div>
```

**Firefox:**
```html
<!-- 按 Enter 创建新的 <br> -->
第一行<br>
第二行
```

**Internet Explorer:**
```html
<!-- 按 Enter 创建新的 <p> -->
<p>第一行</p>
<p>第二行</p>
```

### 2. 格式化标签差异

**粗体命令的输出：**
- Chrome: `<b>文本</b>`
- Firefox: `<strong>文本</strong>`
- 某些浏览器: `<span style="font-weight: bold">文本</span>`

### 3. 粘贴行为差异

粘贴同样的富文本内容，不同浏览器生成的 HTML 结构完全不同：

```html
<!-- 粘贴的原始内容 -->
Word 文档中的一段粗体文字

<!-- Chrome 可能生成 -->
<div><b>Word 文档中的一段粗体文字</b></div>

<!-- Firefox 可能生成 -->
<p><strong>Word 文档中的一段粗体文字</strong></p>

<!-- Safari 可能生成 -->
<span style="font-weight: bold">Word 文档中的一段粗体文字</span>
```

### 4. 删除和退格行为

不同浏览器在删除跨节点内容时的行为也不一致。

## ContentEditable 的问题

### 1. 不可控的 HTML 结构
```html
<!-- 你想要的干净结构 -->
<p>Hello <strong>World</strong></p>

<!-- 实际可能生成的混乱结构 -->
<div>Hello <b><span style="font-weight: bold">World</span></b></div>
```

### 2. 浏览器兼容性噩梦
- 不同浏览器的默认行为差异巨大
- 需要大量的 hack 代码来统一行为
- 难以测试和维护

### 3. 输入法（IME）支持问题
中文、日文等输入法的组合输入处理复杂：
```javascript
// 组合输入事件
element.addEventListener('compositionstart', () => {
  console.log('开始输入');
});

element.addEventListener('compositionupdate', (e) => {
  console.log('输入中:', e.data);
});

element.addEventListener('compositionend', (e) => {
  console.log('输入结束:', e.data);
});
```

### 4. 光标位置管理困难
- 获取光标位置复杂
- 设置光标位置更复杂
- 跨节点选区的处理

### 5. 性能问题
- 大文档编辑卡顿
- 频繁的 DOM 操作
- 内存泄漏风险

## 为什么需要富文本编辑器框架？

### 问题总结
1. ❌ 浏览器行为不一致
2. ❌ HTML 结构难以控制
3. ❌ 输入法支持复杂
4. ❌ 光标管理困难
5. ❌ 扩展性差
6. ❌ 无法实现协同编辑

### 解决方案

现代富文本编辑器框架通过以下方式解决这些问题：

#### 1. 抽象数据层
不直接操作 HTML，而是维护一个抽象的数据模型：
```javascript
// 不是直接生成 HTML
const html = '<p><b>Hello</b></p>';

// 而是维护数据结构
const content = {
  type: 'paragraph',
  children: [
    { type: 'text', text: 'Hello', bold: true }
  ]
};
```

#### 2. 统一的渲染层
框架控制如何将数据渲染为 DOM，保证跨浏览器一致性。

#### 3. 自定义的输入处理
拦截浏览器的默认行为，自己处理输入：
```javascript
editor.addEventListener('beforeinput', (e) => {
  e.preventDefault(); // 阻止浏览器默认行为
  
  // 自己处理输入
  handleInput(e.data);
});
```

#### 4. 插件化架构
可以轻松扩展功能，而不修改核心代码。

## 主流编辑器的技术方案对比

### 1. Quill（基于 ContentEditable）
```
用户输入 → ContentEditable → 拦截事件 
  → 更新 Delta → 重新渲染 DOM
```

**优点：**
- 利用浏览器能力，实现简单
- 输入法支持好
- 性能较好

**缺点：**
- 仍需处理部分浏览器差异
- 复杂场景控制不足

### 2. Slate（基于 ContentEditable + React）
```
用户输入 → ContentEditable → 转换为 Operation 
  → 更新数据模型 → React 重新渲染
```

**优点：**
- React 组件化
- 数据流清晰
- 扩展性强

**缺点：**
- 性能开销较大
- 学习曲线陡峭

### 3. ProseMirror（基于 ContentEditable + Schema）
```
用户输入 → ContentEditable → 验证 Schema 
  → 转换为 Transaction → 更新状态
```

**优点：**
- 严格的文档结构
- 强大的插件系统
- 适合复杂场景

**缺点：**
- API 复杂
- 上手难度高

### 4. Google Docs（Canvas 自绘）
```
用户输入 → 完全自己处理 → 更新数据 
  → Canvas 绘制
```

**优点：**
- 完全控制渲染
- 性能极致优化
- 跨浏览器完全一致

**缺点：**
- 实现复杂度极高
- 输入法处理困难
- 无障碍访问问题

## 实践建议

### 什么时候用原生 ContentEditable？
- ✅ 简单的评论框
- ✅ 单行输入增强
- ✅ 快速原型

### 什么时候用编辑器框架？
- ✅ 需要复杂的格式化
- ✅ 需要协同编辑
- ✅ 需要自定义节点类型
- ✅ 需要跨浏览器一致性
- ✅ 生产环境的富文本编辑器

## 小结

ContentEditable 是浏览器提供的强大能力，但也带来了巨大的挑战：

1. **优点：** 原生支持，无需额外依赖
2. **缺点：** 浏览器差异、HTML 混乱、扩展性差
3. **解决方案：** 使用成熟的编辑器框架
4. **核心思想：** 抽象数据层 + 统一渲染 + 自定义输入处理

下一步，我们将学习 Selection 和 Range API，理解如何精确控制光标和选区。

## 参考资源

- [MDN: contenteditable](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/contenteditable)
- [Why ContentEditable is Terrible](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480)
- [HTML5 execCommand 参考](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/execCommand)

