# Selection 和 Range API 详解

## 核心概念

在富文本编辑器中，理解光标和选区的管理是基础中的基础。

### Selection（选区）
代表用户当前选中的文本范围或光标位置。

### Range（范围）
表示文档中的一个连续区域，可以跨越多个节点。

### 关系
- 一个 Selection 可以包含多个 Range（虽然大多数浏览器只支持单个 Range）
- 光标实际上是一个"折叠"的 Range（起点和终点相同）

## Selection API

### 获取 Selection 对象

```javascript
// 获取当前选区
const selection = window.getSelection();

// 也可以从 document 获取（等价）
const selection2 = document.getSelection();
```

### Selection 的核心属性

```javascript
const selection = window.getSelection();

// 选区类型
console.log(selection.type);
// "None" - 没有选区
// "Caret" - 光标（折叠的选区）
// "Range" - 选中了内容

// 是否折叠（光标状态）
console.log(selection.isCollapsed); // true/false

// Range 的数量
console.log(selection.rangeCount); // 通常是 0 或 1

// 起点（anchor）信息
console.log(selection.anchorNode);   // 起点所在的节点
console.log(selection.anchorOffset); // 起点在节点中的偏移量

// 终点（focus）信息
console.log(selection.focusNode);    // 终点所在的节点
console.log(selection.focusOffset);  // 终点在节点中的偏移量

// 选中的文本内容
console.log(selection.toString());
```

### 重要概念：Anchor vs Focus

```
用户从左往右选择：
Hello World
^    ^
|    |
anchor  focus

用户从右往左选择：
Hello World
^    ^
|    |
focus  anchor
```

**Anchor（锚点）：** 用户开始选择的位置  
**Focus（焦点）：** 用户结束选择的位置（会随着拖动变化）

### Selection 的核心方法

#### 1. 操作 Range

```javascript
const selection = window.getSelection();

// 获取第一个 Range
const range = selection.getRangeAt(0);

// 添加 Range
selection.addRange(range);

// 移除特定 Range
selection.removeRange(range);

// 移除所有 Range
selection.removeAllRanges();
```

#### 2. 折叠选区（设置光标）

```javascript
// 折叠到起点（光标移到选区开始）
selection.collapseToStart();

// 折叠到终点（光标移到选区结束）
selection.collapseToEnd();

// 折叠到指定位置
const node = document.getElementById('editor').firstChild;
selection.collapse(node, 5); // 光标设置在 node 的第 5 个字符后
```

#### 3. 扩展选区

```javascript
// 扩展选区到指定节点和偏移
const node = document.getElementById('target');
selection.extend(node, 10);
```

#### 4. 选择节点

```javascript
const element = document.getElementById('paragraph');

// 选中节点的所有内容
selection.selectAllChildren(element);
```

## Range API

Range 是更底层、更灵活的 API。

### 创建 Range

```javascript
// 创建一个新的 Range
const range = document.createRange();

// 从 Selection 获取
const selection = window.getSelection();
const range = selection.getRangeAt(0);
```

### Range 的核心属性

```javascript
const range = document.createRange();

// 起点
console.log(range.startContainer); // 起点容器节点
console.log(range.startOffset);    // 起点偏移量

// 终点
console.log(range.endContainer);   // 终点容器节点
console.log(range.endOffset);      // 终点偏移量

// 是否折叠
console.log(range.collapsed);      // true/false

// 公共祖先容器
console.log(range.commonAncestorContainer);
```

### 偏移量（Offset）的理解

偏移量的含义取决于节点类型：

#### 文本节点
```javascript
const textNode = document.createTextNode('Hello World');
const range = document.createRange();

// offset 是字符位置
range.setStart(textNode, 0);  // 'H' 之前
range.setEnd(textNode, 5);    // 'o' 之后，选中 "Hello"
```

#### 元素节点
```javascript
const div = document.createElement('div');
div.innerHTML = '<p>段落1</p><p>段落2</p><p>段落3</p>';

const range = document.createRange();

// offset 是子节点的索引
range.setStart(div, 0);  // 第一个 <p> 之前
range.setEnd(div, 2);    // 第三个 <p> 之前，选中前两个 <p>
```

### Range 的核心方法

#### 1. 设置范围

```javascript
const range = document.createRange();
const element = document.getElementById('editor');

// 设置起点
range.setStart(node, offset);

// 设置终点
range.setEnd(node, offset);

// 在节点之前设置起点
range.setStartBefore(node);

// 在节点之后设置起点
range.setStartAfter(node);

// 在节点之前设置终点
range.setEndBefore(node);

// 在节点之后设置终点
range.setEndAfter(node);

// 选中整个节点的内容
range.selectNodeContents(element);

// 选中整个节点（包括节点本身）
range.selectNode(element);
```

#### 2. 折叠

```javascript
// 折叠到起点
range.collapse(true);

// 折叠到终点
range.collapse(false);
// 或
range.collapse();
```

#### 3. 提取和操作内容

```javascript
// 克隆 Range
const clonedRange = range.cloneRange();

// 克隆选中的内容
const fragment = range.cloneContents();

// 提取选中的内容（会从文档中移除）
const extractedFragment = range.extractContents();

// 删除选中的内容
range.deleteContents();

// 插入节点
const newNode = document.createElement('span');
newNode.textContent = '插入的内容';
range.insertNode(newNode);

// 用节点包围选中的内容
const wrapper = document.createElement('strong');
range.surroundContents(wrapper);
```

#### 4. 比较和检测

```javascript
const range1 = document.createRange();
const range2 = document.createRange();

// 比较边界点
// how: 如何比较
//   Range.START_TO_START (0)
//   Range.START_TO_END (1)
//   Range.END_TO_END (2)
//   Range.END_TO_START (3)
const result = range1.compareBoundaryPoints(Range.START_TO_START, range2);
// 返回值：-1, 0, 1

// 检查节点是否在 Range 中
const isIntersecting = range.intersectsNode(node);
```

## 常见操作场景

### 1. 获取选中的文本

```javascript
function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString();
}
```

### 2. 获取光标位置

```javascript
function getCursorPosition() {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0) {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  
  return {
    container: range.startContainer,
    offset: range.startOffset
  };
}
```

### 3. 设置光标位置

```javascript
function setCursor(node, offset) {
  const range = document.createRange();
  const selection = window.getSelection();
  
  range.setStart(node, offset);
  range.collapse(true); // 折叠到起点
  
  selection.removeAllRanges();
  selection.addRange(range);
}
```

### 4. 选中指定范围的文本

```javascript
function selectText(startNode, startOffset, endNode, endOffset) {
  const range = document.createRange();
  const selection = window.getSelection();
  
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  
  selection.removeAllRanges();
  selection.addRange(range);
}
```

### 5. 保存和恢复选区

```javascript
// 保存选区
function saveSelection() {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0) {
    return null;
  }
  
  return selection.getRangeAt(0).cloneRange();
}

// 恢复选区
function restoreSelection(savedRange) {
  if (!savedRange) return;
  
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedRange);
}

// 使用示例
const saved = saveSelection();
// ... 做一些操作，光标可能会丢失 ...
restoreSelection(saved);
```

### 6. 在光标位置插入内容

```javascript
function insertAtCursor(html) {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0) {
    return;
  }
  
  const range = selection.getRangeAt(0);
  range.deleteContents(); // 删除选中的内容
  
  // 创建要插入的节点
  const div = document.createElement('div');
  div.innerHTML = html;
  const fragment = document.createDocumentFragment();
  
  while (div.firstChild) {
    fragment.appendChild(div.firstChild);
  }
  
  range.insertNode(fragment);
  
  // 将光标移到插入内容的末尾
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
```

### 7. 高亮选中的文本

```javascript
function highlightSelection(color = 'yellow') {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0 || selection.isCollapsed) {
    return;
  }
  
  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.style.backgroundColor = color;
  
  try {
    range.surroundContents(span);
  } catch (e) {
    // surroundContents 在跨节点选择时可能失败
    // 这时需要更复杂的处理
    console.error('无法高亮跨节点选择', e);
  }
}
```

## 高级话题

### 1. 处理跨节点选区

```javascript
function getSelectedNodes() {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0) {
    return [];
  }
  
  const range = selection.getRangeAt(0);
  const treeWalker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        return range.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const nodes = [];
  while (treeWalker.nextNode()) {
    nodes.push(treeWalker.currentNode);
  }
  
  return nodes;
}
```

### 2. 计算光标的绝对位置

```javascript
function getCaretCoordinates() {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0) {
    return null;
  }
  
  const range = selection.getRangeAt(0).cloneRange();
  
  // 插入一个临时的零宽度空格
  const span = document.createElement('span');
  span.textContent = '\u200B'; // 零宽度空格
  range.insertNode(span);
  
  const rect = span.getBoundingClientRect();
  const coordinates = {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
  
  // 移除临时元素
  span.remove();
  
  return coordinates;
}
```

### 3. 处理输入法组合输入

```javascript
let isComposing = false;

editor.addEventListener('compositionstart', () => {
  isComposing = true;
});

editor.addEventListener('compositionend', () => {
  isComposing = false;
  handleInput(); // 组合输入结束后再处理
});

editor.addEventListener('input', () => {
  if (!isComposing) {
    handleInput();
  }
});
```

## 浏览器兼容性注意事项

### Firefox 的多 Range 支持
Firefox 允许用户通过 Ctrl+点击创建多个 Range：

```javascript
const selection = window.getSelection();

// Firefox 可能返回 > 1
console.log(selection.rangeCount);

// 获取所有 Range
const ranges = [];
for (let i = 0; i < selection.rangeCount; i++) {
  ranges.push(selection.getRangeAt(i));
}
```

### Safari 的特殊行为
Safari 在某些情况下的选区行为与其他浏览器不同，特别是在处理空节点时。

## 实践建议

### 1. 总是检查 rangeCount
```javascript
const selection = window.getSelection();

if (selection.rangeCount === 0) {
  // 没有选区，不要尝试访问
  return;
}

const range = selection.getRangeAt(0);
```

### 2. 克隆 Range 再操作
```javascript
// 不要直接修改 selection 的 range
const range = selection.getRangeAt(0).cloneRange();

// 对克隆的 range 进行操作
range.setStart(...);
```

### 3. 小心 surroundContents
它在跨节点选择时会失败，需要特殊处理。

### 4. 记得恢复选区
某些操作（如 focus blur）会导致选区丢失，需要手动保存和恢复。

## 小结

Selection 和 Range API 是富文本编辑器的基石：

1. **Selection** - 用户级别的选区，通常只有一个 Range
2. **Range** - 底层的范围对象，更灵活强大
3. **偏移量** - 理解不同节点类型的偏移含义
4. **常见操作** - 获取、设置、保存、恢复选区
5. **浏览器差异** - 注意兼容性问题

掌握这些 API 后，你就能精确控制光标和选区，这是实现协同编辑中"远程光标"功能的基础。

## 参考资源

- [MDN: Selection API](https://developer.mozilla.org/zh-CN/docs/Web/API/Selection)
- [MDN: Range API](https://developer.mozilla.org/zh-CN/docs/Web/API/Range)
- [JavaScript Range 详解](https://javascript.info/selection-range)

