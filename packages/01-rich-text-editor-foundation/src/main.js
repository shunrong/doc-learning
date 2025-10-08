import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// ==================== Demo 1: Quill 编辑器 ====================

const quill = new Quill('#quill-editor', {
  theme: 'snow',
  placeholder: '开始编辑...',
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean']
    ]
  }
});

// 监听文本变更，实时显示 Delta
quill.on('text-change', () => {
  const delta = quill.getContents();
  document.getElementById('quill-delta').textContent = JSON.stringify(delta, null, 2);
});

// 初始化显示
document.getElementById('quill-delta').textContent = JSON.stringify(quill.getContents(), null, 2);

// 设置一些初始内容
quill.setContents({
  ops: [
    { insert: '欢迎使用 Quill 编辑器', attributes: { bold: true, size: 'large' } },
    { insert: '\n', attributes: { header: 1 } },
    { insert: '这是一个功能强大的富文本编辑器。\n\n' },
    { insert: '主要特点：', attributes: { bold: true } },
    { insert: '\n' },
    { insert: '模块化架构\n', attributes: { list: 'bullet' } },
    { insert: '丰富的 API\n', attributes: { list: 'bullet' } },
    { insert: '可定制的工具栏\n', attributes: { list: 'bullet' } },
    { insert: '\n试着编辑这段文本，观察右下方的 Delta 数据结构变化。\n' }
  ]
});

// ==================== Demo 2: 自定义编辑器 ====================

const customEditor = document.getElementById('custom-editor');
const customHtml = document.getElementById('custom-html');
const toolbar = document.querySelector('#demo-custom .toolbar');

// 更新 HTML 显示
function updateCustomHtml() {
  customHtml.textContent = customEditor.innerHTML;
}

// 初始化显示
updateCustomHtml();

// 监听编辑器变更
customEditor.addEventListener('input', updateCustomHtml);

// 工具栏按钮点击事件
toolbar.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;

  const command = button.dataset.command;
  if (!command) return;

  // 分割命令和参数
  const [cmd, value] = command.split(':');

  // 执行命令
  if (value) {
    document.execCommand(cmd, false, value);
  } else {
    document.execCommand(cmd, false, null);
  }

  // 更新按钮激活状态
  updateToolbarState();
  
  // 保持焦点
  customEditor.focus();
});

// 更新工具栏按钮状态
function updateToolbarState() {
  const buttons = toolbar.querySelectorAll('button');
  buttons.forEach(button => {
    const command = button.dataset.command?.split(':')[0];
    if (command && ['bold', 'italic', 'underline', 'strikeThrough'].includes(command)) {
      const isActive = document.queryCommandState(command);
      button.classList.toggle('active', isActive);
    }
  });
}

// 监听选区变化
customEditor.addEventListener('mouseup', updateToolbarState);
customEditor.addEventListener('keyup', updateToolbarState);

// ==================== Demo 3: Selection API ====================

const selectionEditor = document.getElementById('selection-editor');
const selectionInfo = document.getElementById('selection-info');
let savedRange = null;

// 更新 Selection 信息显示
function updateSelectionInfo() {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0) {
    selectionInfo.textContent = '无选区';
    return;
  }

  const range = selection.getRangeAt(0);
  
  const info = `
Selection 信息：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
类型: ${selection.type}
是否折叠: ${selection.isCollapsed ? '是（光标状态）' : '否（选中状态）'}
Range 数量: ${selection.rangeCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Anchor（起点）：
  节点: ${selection.anchorNode?.nodeName || 'null'}
  偏移: ${selection.anchorOffset}
  文本: "${selection.anchorNode?.textContent?.substring(0, 30) || ''}"

Focus（终点）：
  节点: ${selection.focusNode?.nodeName || 'null'}
  偏移: ${selection.focusOffset}
  文本: "${selection.focusNode?.textContent?.substring(0, 30) || ''}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Range 信息：
  开始容器: ${range.startContainer.nodeName}
  开始偏移: ${range.startOffset}
  结束容器: ${range.endContainer.nodeName}
  结束偏移: ${range.endOffset}
  是否折叠: ${range.collapsed}

选中的文本: "${selection.toString()}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
  
  selectionInfo.textContent = info;
}

// 监听选区变化
selectionEditor.addEventListener('mouseup', updateSelectionInfo);
selectionEditor.addEventListener('keyup', updateSelectionInfo);
selectionEditor.addEventListener('selectstart', updateSelectionInfo);
document.addEventListener('selectionchange', () => {
  // 只在焦点在 selectionEditor 时更新
  const selection = window.getSelection();
  if (selection.anchorNode && selectionEditor.contains(selection.anchorNode)) {
    updateSelectionInfo();
  }
});

// Selection API 操作按钮
document.getElementById('btn-get-selection').addEventListener('click', () => {
  const selection = window.getSelection();
  console.log('当前选区:', selection);
  console.log('选中文本:', selection.toString());
  updateSelectionInfo();
});

document.getElementById('btn-select-all').addEventListener('click', () => {
  const range = document.createRange();
  range.selectNodeContents(selectionEditor);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  updateSelectionInfo();
});

document.getElementById('btn-collapse-start').addEventListener('click', () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    selection.collapseToStart();
    updateSelectionInfo();
  }
});

document.getElementById('btn-collapse-end').addEventListener('click', () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    selection.collapseToEnd();
    updateSelectionInfo();
  }
});

document.getElementById('btn-save-selection').addEventListener('click', () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0).cloneRange();
    alert('选区已保存！现在可以点击其他地方，然后使用"恢复选区"按钮。');
  }
});

document.getElementById('btn-restore-selection').addEventListener('click', () => {
  if (savedRange) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    updateSelectionInfo();
    alert('选区已恢复！');
  } else {
    alert('还没有保存过选区！');
  }
});

// ==================== Tab 切换逻辑 ====================

const tabs = document.querySelectorAll('.tab');
const demoSections = document.querySelectorAll('.demo-section');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const demoName = tab.dataset.demo;
    
    // 切换 tab 激活状态
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // 切换 demo 显示
    demoSections.forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`demo-${demoName}`).classList.add('active');
  });
});

// ==================== 控制台输出一些调试信息 ====================

console.log('%c🎉 Phase 1: 富文本编辑器基础', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c学习要点：', 'color: #764ba2; font-size: 16px; font-weight: bold;');
console.log('1. ContentEditable API - 浏览器原生的富文本编辑能力');
console.log('2. Selection 和 Range API - 光标和选区的操作');
console.log('3. document.execCommand() - 格式化命令（已废弃但仍广泛使用）');
console.log('4. Quill Delta - 现代富文本编辑器的数据结构');
console.log('');
console.log('%c💡 尝试这些操作：', 'color: #667eea; font-size: 14px;');
console.log('• 在 Demo 1 中编辑文本，观察 Delta 数据结构的变化');
console.log('• 在 Demo 2 中使用工具栏格式化文本，查看生成的 HTML');
console.log('• 在 Demo 3 中选择文本，理解 Selection 和 Range 的区别');
console.log('• 在 Demo 4 中学习 Delta 的三种操作类型');
console.log('');
console.log('%c📚 下一步：', 'color: #764ba2; font-size: 14px;');
console.log('阅读 docs/ 目录下的理论文档，深入理解这些概念。');

