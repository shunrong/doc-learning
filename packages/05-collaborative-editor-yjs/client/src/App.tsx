/**
 * 主应用组件
 *
 * 集成所有功能：
 * 1. Yjs 协同（useYjs Hook）
 * 2. Tiptap 编辑器
 * 3. 用户列表
 * 4. 状态栏
 */

import { useState, useEffect } from "react";
import { useYjs } from "./hooks/useYjs";
import { Editor } from "./components/Editor";
import { UserList } from "./components/UserList";
import { StatusBar } from "./components/StatusBar";
import "./App.css";
import "./utils/debug"; // 加载调试工具

function App() {
  // 用户配置（可以从 URL 参数或用户输入获取）
  const [userName] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("name") || `用户${Math.floor(Math.random() * 1000)}`;
  });

  const [roomName] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room") || "default-room";
  });

  // 生成固定的用户颜色（只生成一次）
  const [userColor] = useState(() => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  });

  // 初始化 Yjs
  const { ydoc, provider, synced, connected } = useYjs({
    roomName,
    serverUrl: "ws://localhost:1234",
    userName,
    userColor,
  });

  // 开发模式下启用调试（可选）
  useEffect(() => {
    if (ydoc && provider) {
      // 暴露到 window，方便调试
      (window as any).ydoc = ydoc;
      (window as any).provider = provider;

      if (import.meta.env.DEV) {
        console.log("");
        console.log("🛠️  Yjs 调试工具已就绪！");
        console.log("");
        console.log("📖 常用命令：");
        console.log("  yjsDebug.debugYDoc(ydoc)           - 查看文档详情");
        console.log(
          '  yjsDebug.debugIndexedDB("' + roomName + '")  - 查看 IndexedDB'
        );
        console.log("  yjsDebug.downloadYDocAsJSON(ydoc)  - 下载为 JSON");
        console.log("  yjsDebug.watchYDoc(ydoc)           - 监控实时更新");
        console.log("");
      }
    }
  }, [ydoc, provider, roomName]);

  // 等待 Yjs 初始化完成
  if (!ydoc || !provider) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>正在连接协同服务器...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 标题 */}
      <header className="app-header">
        <h1>🚀 协同编辑器</h1>
        <p className="app-subtitle">基于 Yjs + Tiptap 的实时协同编辑</p>
      </header>

      {/* 状态栏 */}
      <StatusBar connected={connected} synced={synced} roomName={roomName} />

      {/* 主要内容区域 */}
      <div className="app-main">
        {/* 左侧：编辑器 */}
        <div className="editor-section">
          <Editor
            ydoc={ydoc}
            provider={provider}
            userName={userName}
            userColor={userColor}
          />
        </div>

        {/* 右侧：用户列表 */}
        <div className="sidebar-section">
          <UserList provider={provider} />
        </div>
      </div>

      {/* 提示信息 */}
      <footer className="app-footer">
        <div className="tips">
          <h4>💡 使用提示：</h4>
          <ul>
            <li>
              打开多个标签页体验<strong>实时协同</strong>（相同房间）
            </li>
            <li>
              使用 <code>?room=xxx&name=你的名字</code> 参数进入指定房间
            </li>
            <li>
              断开网络试试<strong>离线编辑</strong>，重连后自动同步
            </li>
            <li>刷新页面，内容不丢失（IndexedDB 持久化）</li>
          </ul>
        </div>

        <div className="comparison">
          <h4>📊 与 Phase 3 (OT) 的对比：</h4>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Phase 3 (OT)</th>
                <th>Phase 6 (Yjs CRDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>实时协同</strong>
                </td>
                <td>✅ 自己实现</td>
                <td>✅ Yjs 开箱即用</td>
              </tr>
              <tr>
                <td>
                  <strong>离线编辑</strong>
                </td>
                <td>❌ 困难</td>
                <td>✅ 自动支持</td>
              </tr>
              <tr>
                <td>
                  <strong>代码量</strong>
                </td>
                <td>~800 行</td>
                <td>~300 行</td>
              </tr>
              <tr>
                <td>
                  <strong>核心算法</strong>
                </td>
                <td>Transform 函数</td>
                <td>Yjs CRDT</td>
              </tr>
            </tbody>
          </table>
        </div>
      </footer>
    </div>
  );
}

export default App;
