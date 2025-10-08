# 实现思路和最佳实践

## 技术方案选择

### 场景 1：简单的富文本需求

**需求特点：**
- 基本的格式化（粗体、斜体、标题）
- 不需要复杂的自定义节点
- 不需要协同编辑
- 快速开发

**推荐方案：** Quill

```javascript
import Quill from 'quill';

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }]
    ]
  }
});
```

**优点：**
- 开箱即用
- API 简单
- 文档完善
- 性能好

### 场景 2：高度定制的编辑器

**需求特点：**
- 需要自定义节点类型
- 复杂的交互逻辑
- 深度集成到 React 应用
- 需要完全控制渲染

**推荐方案：** Slate

```javascript
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';

function MyEditor() {
  const [editor] = useState(() => withReact(createEditor()));
  
  return (
    <Slate editor={editor} initialValue={initialValue}>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
      />
    </Slate>
  );
}
```

**优点：**
- 高度可定制
- React 集成完美
- 插件化架构
- 完全控制

**缺点：**
- 学习曲线陡峭
- 需要自己实现很多功能

### 场景 3：需要协同编辑

**需求特点：**
- 多人实时协作
- 离线编辑支持
- 冲突自动解决

**推荐方案：** Yjs + Tiptap

```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEditor } from '@tiptap/react';
import Collaboration from '@tiptap/extension-collaboration';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:1234', 'room', ydoc);

const editor = useEditor({
  extensions: [
    StarterKit,
    Collaboration.configure({
      document: ydoc,
    }),
  ],
});
```

**优点：**
- 协同编辑开箱即用
- 离线支持
- CRDT 算法自动解决冲突

## 常见问题和解决方案

### 1. 光标位置丢失

**问题：**
```javascript
// 某些操作后光标位置丢失
editor.blur();
// ... 做一些处理 ...
editor.focus(); // 光标回到开头了！
```

**解决方案：保存和恢复选区**
```javascript
class SelectionManager {
  constructor() {
    this.savedRange = null;
  }
  
  save() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      this.savedRange = selection.getRangeAt(0).cloneRange();
    }
  }
  
  restore() {
    if (this.savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(this.savedRange);
    }
  }
}

// 使用
const selectionMgr = new SelectionManager();

button.addEventListener('click', () => {
  selectionMgr.save();
  
  // 执行可能导致失焦的操作
  doSomething();
  
  selectionMgr.restore();
});
```

### 2. 粘贴内容格式混乱

**问题：**
用户从 Word、网页等地方粘贴内容，带来大量无用的样式和标签。

**解决方案：清理粘贴内容**
```javascript
editor.addEventListener('paste', (e) => {
  e.preventDefault();
  
  // 获取纯文本
  const text = e.clipboardData.getData('text/plain');
  
  // 或者获取 HTML 并清理
  const html = e.clipboardData.getData('text/html');
  const cleaned = cleanHTML(html);
  
  // 插入到编辑器
  insertContent(cleaned);
});

function cleanHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // 移除所有 style 属性
  div.querySelectorAll('[style]').forEach(el => {
    el.removeAttribute('style');
  });
  
  // 只保留允许的标签
  const allowedTags = ['p', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'br'];
  removeUnallowedTags(div, allowedTags);
  
  return div.innerHTML;
}
```

### 3. 输入法（IME）问题

**问题：**
中文、日文等输入法的组合输入会触发多次 input 事件。

**解决方案：监听 composition 事件**
```javascript
let isComposing = false;

editor.addEventListener('compositionstart', () => {
  isComposing = true;
  console.log('开始输入');
});

editor.addEventListener('compositionupdate', (e) => {
  console.log('输入中:', e.data);
});

editor.addEventListener('compositionend', (e) => {
  isComposing = false;
  console.log('输入结束:', e.data);
  
  // 在这里处理输入
  handleInput(e.data);
});

editor.addEventListener('input', (e) => {
  if (!isComposing) {
    // 只在非组合输入时处理
    handleInput(e.data);
  }
});
```

### 4. 移动端键盘问题

**问题：**
移动端虚拟键盘遮挡编辑区域。

**解决方案：滚动到可见区域**
```javascript
function scrollIntoView(element) {
  // 等待键盘弹出
  setTimeout(() => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // 如果被键盘遮挡
    if (rect.bottom > viewportHeight) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, 300);
}

editor.addEventListener('focus', () => {
  scrollIntoView(editor);
});
```

### 5. 表格编辑的复杂性

**问题：**
表格内的编辑、合并单元格、插入删除行列非常复杂。

**解决方案：使用专门的表格插件**
```javascript
// Quill 的表格模块
import QuillBetterTable from 'quill-better-table';

Quill.register({
  'modules/better-table': QuillBetterTable
}, true);

const quill = new Quill('#editor', {
  modules: {
    table: false,
    'better-table': {
      operationMenu: {
        items: {
          insertColumnRight: {
            text: '在右侧插入列'
          },
          insertRowBelow: {
            text: '在下方插入行'
          },
          mergeCells: {
            text: '合并单元格'
          }
        }
      }
    }
  }
});
```

### 6. 大文档性能问题

**问题：**
文档内容过多时，编辑卡顿。

**解决方案：虚拟滚动**
```javascript
// 只渲染可视区域的内容
class VirtualEditor {
  constructor(container, content) {
    this.container = container;
    this.content = content; // 完整内容
    this.visibleRange = { start: 0, end: 100 }; // 可见行范围
    
    this.setupScrollListener();
    this.render();
  }
  
  setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      this.updateVisibleRange();
      this.render();
    });
  }
  
  updateVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const lineHeight = 20; // 每行高度
    const visibleLines = Math.ceil(this.container.clientHeight / lineHeight);
    
    const start = Math.floor(scrollTop / lineHeight);
    const end = start + visibleLines + 10; // 缓冲区
    
    this.visibleRange = { start, end };
  }
  
  render() {
    // 只渲染可见范围的内容
    const visibleContent = this.content.slice(
      this.visibleRange.start,
      this.visibleRange.end
    );
    
    this.container.innerHTML = visibleContent.join('\n');
  }
}
```

## 性能优化建议

### 1. 防抖输入处理

```javascript
import { debounce } from 'lodash';

// 不要在每次 input 事件都保存
editor.addEventListener('input', debounce(() => {
  saveContent();
}, 300));
```

### 2. 使用 DocumentFragment

```javascript
// 批量 DOM 操作使用 fragment
const fragment = document.createDocumentFragment();

for (const item of items) {
  const div = document.createElement('div');
  div.textContent = item;
  fragment.appendChild(div);
}

container.appendChild(fragment); // 只触发一次重排
```

### 3. 避免频繁的 getSelection

```javascript
// ❌ 不好的做法
editor.addEventListener('input', () => {
  const selection = window.getSelection(); // 每次都获取
  // ...
});

// ✅ 好的做法
let cachedSelection = null;

editor.addEventListener('selectionchange', () => {
  cachedSelection = window.getSelection();
});

editor.addEventListener('input', () => {
  // 使用缓存的 selection
  if (cachedSelection) {
    // ...
  }
});
```

### 4. 使用 requestAnimationFrame

```javascript
// 渲染相关的更新使用 RAF
let renderScheduled = false;

function scheduleRender() {
  if (!renderScheduled) {
    renderScheduled = true;
    requestAnimationFrame(() => {
      render();
      renderScheduled = false;
    });
  }
}

editor.addEventListener('input', () => {
  updateData();
  scheduleRender(); // 而不是立即渲染
});
```

## 安全性考虑

### 1. XSS 防护

**问题：**
用户输入的内容可能包含恶意脚本。

**解决方案：**
```javascript
// 清理 HTML
import DOMPurify from 'dompurify';

function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'br'],
    ALLOWED_ATTR: []
  });
}

// 使用
const userInput = '<p>正常内容</p><script>alert("XSS")</script>';
const safe = sanitizeHTML(userInput);
// 结果：<p>正常内容</p>
```

### 2. 内容长度限制

```javascript
const MAX_LENGTH = 100000; // 10万字符

editor.addEventListener('input', (e) => {
  const content = editor.textContent;
  
  if (content.length > MAX_LENGTH) {
    e.preventDefault();
    alert(`内容不能超过 ${MAX_LENGTH} 个字符`);
    
    // 恢复到之前的内容
    restorePreviousContent();
  }
});
```

## 可访问性（Accessibility）

### 1. 键盘导航

```javascript
editor.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + B: 加粗
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    toggleBold();
  }
  
  // Ctrl/Cmd + I: 斜体
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault();
    toggleItalic();
  }
  
  // Ctrl/Cmd + Z: 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  }
});
```

### 2. ARIA 属性

```html
<div
  role="textbox"
  aria-label="富文本编辑器"
  aria-multiline="true"
  contenteditable="true"
>
</div>
```

### 3. 屏幕阅读器支持

```javascript
// 添加辅助文本
const srOnly = document.createElement('span');
srOnly.className = 'sr-only';
srOnly.textContent = '正在编辑富文本内容';
editor.appendChild(srOnly);
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## 测试策略

### 1. 单元测试

```javascript
import { describe, it, expect } from 'vitest';

describe('Delta operations', () => {
  it('should insert text correctly', () => {
    const delta = new Delta([{ insert: 'Hello' }]);
    const result = delta.apply('');
    expect(result).toBe('Hello');
  });
  
  it('should delete text correctly', () => {
    const delta = new Delta([
      { retain: 5 },
      { delete: 6 }
    ]);
    const result = delta.apply('Hello World');
    expect(result).toBe('Hello');
  });
});
```

### 2. 集成测试

```javascript
import { render, fireEvent } from '@testing-library/react';

describe('Editor', () => {
  it('should apply bold format', () => {
    const { getByRole } = render(<Editor />);
    const editor = getByRole('textbox');
    
    // 输入文本
    fireEvent.input(editor, { data: 'Hello' });
    
    // 选中文本
    selectText(editor, 0, 5);
    
    // 点击加粗按钮
    const boldButton = getByRole('button', { name: '加粗' });
    fireEvent.click(boldButton);
    
    // 验证结果
    expect(editor.innerHTML).toContain('<strong>Hello</strong>');
  });
});
```

### 3. E2E 测试

```javascript
import { test, expect } from '@playwright/test';

test('collaborative editing', async ({ page, context }) => {
  // 打开两个页面模拟两个用户
  const page1 = page;
  const page2 = await context.newPage();
  
  await page1.goto('http://localhost:3000/editor?room=test');
  await page2.goto('http://localhost:3000/editor?room=test');
  
  // 用户1输入
  await page1.fill('[role="textbox"]', 'User 1');
  
  // 用户2应该看到
  await expect(page2.locator('[role="textbox"]')).toContainText('User 1');
  
  // 用户2输入
  await page2.fill('[role="textbox"]', 'User 1 User 2');
  
  // 用户1应该看到
  await expect(page1.locator('[role="textbox"]')).toContainText('User 1 User 2');
});
```

## 最佳实践总结

### 1. 架构设计
- ✅ 数据层和视图层分离
- ✅ 使用状态管理（Redux/Zustand）
- ✅ 插件化架构，易于扩展

### 2. 性能
- ✅ 虚拟滚动处理大文档
- ✅ 防抖/节流优化频繁操作
- ✅ 使用 RAF 优化渲染

### 3. 用户体验
- ✅ 自动保存
- ✅ 离线支持
- ✅ 加载状态提示
- ✅ 错误恢复机制

### 4. 安全性
- ✅ XSS 防护
- ✅ 内容长度限制
- ✅ 输入验证

### 5. 可访问性
- ✅ 键盘导航
- ✅ ARIA 属性
- ✅ 屏幕阅读器支持

### 6. 测试
- ✅ 单元测试覆盖核心逻辑
- ✅ 集成测试覆盖交互
- ✅ E2E 测试覆盖关键流程

## 工具推荐

### 开发工具
- **Quill** - 快速开发
- **Slate** - 高度定制
- **ProseMirror** - 复杂场景
- **Tiptap** - 现代化方案

### 辅助库
- **DOMPurify** - HTML 清理
- **lodash** - 工具函数
- **Immer** - 不可变数据
- **Yjs** - CRDT 协同

### 测试工具
- **Vitest** - 单元测试
- **Testing Library** - React 测试
- **Playwright** - E2E 测试

## 小结

富文本编辑器的实现充满挑战，但遵循最佳实践可以事半功倍：

1. **选对方案** - 根据需求选择合适的技术栈
2. **解决常见问题** - 光标、粘贴、输入法等
3. **性能优化** - 虚拟滚动、防抖、RAF
4. **安全第一** - XSS 防护、内容过滤
5. **注重可访问性** - 键盘、ARIA、屏幕阅读器
6. **完善测试** - 单元、集成、E2E

掌握这些实践经验后，你就可以开发出高质量的富文本编辑器了！

## 参考资源

- [Quill 最佳实践](https://quilljs.com/guides/how-to-customize-quill/)
- [Slate 示例](https://github.com/ianstormtaylor/slate/tree/main/site/examples)
- [Web 可访问性指南](https://www.w3.org/WAI/WCAG21/quickref/)

