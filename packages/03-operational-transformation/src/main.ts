/**
 * Phase 3: 实时协同编辑 Demo - 前端主文件
 */

import { OTClient } from "./client";
import { insert, deleteOp, retain } from "./transform";
import type { Operation } from "./types";

// WebSocket 连接
let ws: WebSocket | null = null;
let client: OTClient | null = null;

// DOM 元素
const editor = document.getElementById("editor") as HTMLTextAreaElement;
const statusDot = document.getElementById("statusDot")!;
const statusText = document.getElementById("statusText")!;
const clientIdEl = document.getElementById("clientId")!;
const versionEl = document.getElementById("version")!;
const pendingEl = document.getElementById("pending")!;
const docLengthEl = document.getElementById("docLength")!;
const lineCountEl = document.getElementById("lineCount")!;
const historyList = document.getElementById("historyList")!;

const btnConnect = document.getElementById("btnConnect") as HTMLButtonElement;
const btnInsert = document.getElementById("btnInsert") as HTMLButtonElement;
const btnDelete = document.getElementById("btnDelete") as HTMLButtonElement;
const btnClear = document.getElementById("btnClear") as HTMLButtonElement;

// 防抖：避免频繁发送操作
let lastContent = "";

/**
 * 连接到 WebSocket 服务器
 */
function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    alert("已经连接到服务器！");
    return;
  }

  updateStatus("connecting", "连接中...");

  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => {
    updateStatus("connected", "已连接");
    console.log("✅ 已连接到服务器");
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    } catch (error) {
      console.error("解析消息失败:", error);
    }
  };

  ws.onclose = () => {
    updateStatus("disconnected", "未连接");
    console.log("❌ 与服务器断开连接");
    ws = null;
    client = null;
  };

  ws.onerror = (error) => {
    console.error("WebSocket 错误:", error);
    updateStatus("error", "连接错误");
  };
}

/**
 * 处理服务器消息
 */
function handleServerMessage(message: {
  type: string;
  clientId?: string;
  version?: number;
  document?: string;
  operations?: Operation[];
}) {
  switch (message.type) {
    case "init":
      // 初始化客户端
      if (message.clientId && message.document !== undefined) {
        client = new OTClient(message.clientId, message.document);
        clientIdEl.textContent = message.clientId;
        editor.value = message.document;
        lastContent = message.document;
        updateDocInfo();
        console.log("🎉 客户端初始化:", message);
      }
      break;

    case "ack":
      // 服务器确认
      if (client && message.version !== undefined) {
        client.serverAck(message.version);
        updateUI();
      }
      break;

    case "operation":
      // 收到远程操作
      if (client && message.operations && message.version !== undefined) {
        // 保存光标位置
        const cursorPos = editor.selectionStart;

        // 应用远程操作
        client.applyRemoteOperation(message.operations, message.version);

        // 更新编辑器（如果当前没有焦点）
        if (document.activeElement !== editor) {
          editor.value = client.document;
          lastContent = client.document;
        } else {
          // 有焦点时也更新，但尝试保持光标位置
          editor.value = client.document;
          editor.setSelectionRange(cursorPos, cursorPos);
          lastContent = client.document;
        }

        updateUI();
      }
      break;

    default:
      console.warn("未知消息类型:", message.type);
  }
}

/**
 * 编辑器输入事件
 */
editor.addEventListener("input", () => {
  if (!client || !ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const currentContent = editor.value;

  // 生成操作
  const operations = generateOperations(lastContent, currentContent);

  if (operations.length > 0) {
    // 应用本地操作
    client.applyLocalOperation(operations);

    // 发送到服务器
    sendOperation(operations);

    // 更新 UI
    updateUI();
  }

  lastContent = currentContent;
});

/**
 * 生成操作（简化版：删除全部 + 插入新内容）
 */
function generateOperations(oldText: string, newText: string): Operation[] {
  // 找到变化的位置
  let start = 0;
  while (
    start < oldText.length &&
    start < newText.length &&
    oldText[start] === newText[start]
  ) {
    start++;
  }

  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    oldText[oldEnd - 1] === newText[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  const operations: Operation[] = [];

  // 保留前面相同的部分
  if (start > 0) {
    operations.push(retain(start));
  }

  // 删除不同的部分
  if (oldEnd > start) {
    operations.push(deleteOp(oldEnd - start));
  }

  // 插入新的部分
  if (newEnd > start) {
    operations.push(insert(newText.substring(start, newEnd)));
  }

  return operations;
}

/**
 * 发送操作到服务器
 */
function sendOperation(operations: Operation[]) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "operation",
        operations,
      })
    );
  }
}

/**
 * 更新状态显示
 */
function updateStatus(
  status: "connected" | "disconnected" | "connecting" | "error",
  text: string
) {
  statusText.textContent = text;

  statusDot.classList.remove("connected");
  if (status === "connected") {
    statusDot.classList.add("connected");
  }

  // 更新按钮状态
  if (status === "connected") {
    btnConnect.textContent = "✅ 已连接";
    btnConnect.disabled = true;
    btnInsert.disabled = false;
    btnDelete.disabled = false;
    btnClear.disabled = false;
  } else {
    btnConnect.textContent = "🔌 连接服务器";
    btnConnect.disabled = false;
    btnInsert.disabled = true;
    btnDelete.disabled = true;
    btnClear.disabled = true;
  }
}

/**
 * 更新 UI 显示
 */
function updateUI() {
  if (!client) return;

  const state = client.getState();
  versionEl.textContent = state.version.toString();
  pendingEl.textContent = state.pendingCount.toString();

  updateDocInfo();
  updateHistory();
}

/**
 * 更新文档信息
 */
function updateDocInfo() {
  const doc = editor.value;
  docLengthEl.textContent = doc.length.toString();
  lineCountEl.textContent = doc.split("\n").length.toString();
}

/**
 * 更新操作历史
 */
function updateHistory() {
  if (!client) return;

  const history = client.history.slice(-10).reverse(); // 最近 10 条

  if (history.length === 0) {
    historyList.innerHTML = `
      <div style="text-align: center; color: #999; padding: 20px;">
        暂无操作记录
      </div>
    `;
    return;
  }

  historyList.innerHTML = history
    .map((item) => {
      const time = new Date().toLocaleTimeString();
      const opsStr = JSON.stringify(item.ops, null, 2);
      const source = item.source === "local" ? "本地" : "远程";
      const className = item.source === "local" ? "" : "remote";

      return `
      <div class="history-item ${className}">
        <div class="time">${time} - ${source}</div>
        <div class="ops">${opsStr}</div>
      </div>
    `;
    })
    .join("");
}

/**
 * 快捷按钮：插入文本
 */
btnInsert.addEventListener("click", () => {
  if (!client) return;

  const text = "Hello OT! ";
  const pos = editor.selectionStart;

  editor.value =
    editor.value.substring(0, pos) + text + editor.value.substring(pos);
  editor.setSelectionRange(pos + text.length, pos + text.length);

  // 触发 input 事件
  editor.dispatchEvent(new Event("input"));
});

/**
 * 快捷按钮：删除文本
 */
btnDelete.addEventListener("click", () => {
  if (!client) return;

  const pos = editor.selectionStart;
  if (pos > 0) {
    editor.value =
      editor.value.substring(0, pos - 1) + editor.value.substring(pos);
    editor.setSelectionRange(pos - 1, pos - 1);

    // 触发 input 事件
    editor.dispatchEvent(new Event("input"));
  }
});

/**
 * 快捷按钮：清空文档
 */
btnClear.addEventListener("click", () => {
  if (!client) return;

  if (confirm("确定要清空整个文档吗？")) {
    editor.value = "";
    editor.dispatchEvent(new Event("input"));
  }
});

/**
 * 连接按钮
 */
btnConnect.addEventListener("click", connect);

// 初始化 UI
updateStatus("disconnected", "未连接");
updateDocInfo();

console.log("🚀 OT 协同编辑 Demo 已加载");
console.log("💡 点击 '连接服务器' 开始体验实时协同编辑！");
