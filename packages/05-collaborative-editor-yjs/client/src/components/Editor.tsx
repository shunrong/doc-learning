/**
 * Tiptap 协同编辑器组件
 *
 * 功能：
 * 1. 集成 Tiptap 编辑器（基于 ProseMirror）
 * 2. 绑定 Yjs 文档（Collaboration 扩展）
 * 3. 显示远程光标（CollaborationCursor 扩展）
 * 4. 提供富文本编辑功能（StarterKit）
 *
 * 对比 01 (原生 ContentEditable)：
 * - 01: 直接操作 DOM，处理浏览器差异
 * - 05: 使用 Tiptap，统一的 API，开箱即用
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import "./Editor.css";

export interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  userName: string;
  userColor: string;
}

export function Editor({ ydoc, provider, userName, userColor }: EditorProps) {
  // 创建 Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      // 1. StarterKit - 基础功能包
      // 包括：段落、标题、粗体、斜体、列表等
      StarterKit.configure({
        // 禁用默认的历史记录（Yjs 有自己的历史）
        history: false,
      }),

      // 2. Collaboration - Yjs 协同扩展
      // 这是核心！将 Tiptap 的编辑操作转换为 Yjs 的 CRDT 更新
      Collaboration.configure({
        document: ydoc, // 绑定 Yjs 文档
      }),

      // 3. CollaborationCursor - 远程光标扩展
      // 显示其他用户的光标和选区
      CollaborationCursor.configure({
        provider: provider, // 绑定 WebSocket Provider
        user: {
          name: userName,
          color: userColor,
        },
      }),
    ],
    content: "", // 初始内容（会被 Yjs 同步的内容覆盖）
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  if (!editor) {
    return <div className="editor-loading">编辑器加载中...</div>;
  }

  return (
    <div className="editor-container">
      {/* 工具栏 */}
      <div className="editor-toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="粗体 (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="斜体 (Ctrl+I)"
        >
          <em>I</em>
        </button>

        <div className="toolbar-separator" />

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={
            editor.isActive("heading", { level: 1 }) ? "is-active" : ""
          }
          title="标题 1"
        >
          H1
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor.isActive("heading", { level: 2 }) ? "is-active" : ""
          }
          title="标题 2"
        >
          H2
        </button>

        <div className="toolbar-separator" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "is-active" : ""}
          title="无序列表"
        >
          • 列表
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "is-active" : ""}
          title="有序列表"
        >
          1. 列表
        </button>

        <div className="toolbar-separator" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="撤销 (Ctrl+Z)"
        >
          ↶ 撤销
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="重做 (Ctrl+Shift+Z)"
        >
          ↷ 重做
        </button>
      </div>

      {/* 编辑区域 */}
      <EditorContent editor={editor} />

      {/* 字符统计 */}
      <div className="editor-footer">
        <span className="character-count">
          {editor.storage.characterCount?.characters() || 0} 字符
        </span>
      </div>
    </div>
  );
}

/**
 * 数据流向：
 *
 * 用户输入 "H"
 *     ↓
 * Tiptap 接收（ProseMirror Transaction）
 *     ↓
 * Collaboration 扩展拦截
 *     ↓
 * 转换为 Yjs 操作
 *     ↓
 * Yjs.Y.Doc 应用操作（CRDT）
 *     ↓
 * ┌─────────────┬──────────────┐
 * ↓             ↓              ↓
 * IndexedDB  WebSocket    其他 Provider
 * (保存)     (发送)       (同步)
 *
 *
 * 接收远程更新
 *     ↓
 * WebSocket Provider 接收
 *     ↓
 * Yjs.Y.Doc 应用（自动合并）
 *     ↓
 * Collaboration 扩展监听
 *     ↓
 * 转换为 ProseMirror Transaction
 *     ↓
 * Tiptap 更新显示
 *     ↓
 * 用户看到变化 ✅
 */
