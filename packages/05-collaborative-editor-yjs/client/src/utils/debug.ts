/**
 * Yjs 调试工具
 *
 * 帮助你查看和理解二进制数据
 */

import * as Y from "yjs";

/**
 * 将二进制数据转换为可读的十六进制字符串
 */
export function binaryToHex(binary: Uint8Array): string {
  return Array.from(binary)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

/**
 * 尝试从二进制中提取文本内容
 */
export function extractText(binary: Uint8Array): string {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    return decoder.decode(binary);
  } catch {
    return "<无法解码>";
  }
}

/**
 * 将 Y.Doc 导出为 JSON（调试用）
 */
export function ydocToJSON(ydoc: Y.Doc): any {
  const json: any = {};

  // 遍历所有共享类型
  ydoc.share.forEach((value, key) => {
    if (value instanceof Y.Text) {
      json[key] = value.toString();
    } else if (value instanceof Y.Map) {
      json[key] = value.toJSON();
    } else if (value instanceof Y.Array) {
      json[key] = value.toJSON();
    } else if (value instanceof Y.XmlFragment) {
      json[key] = value.toString();
    } else {
      json[key] = "<未知类型>";
    }
  });

  return json;
}

/**
 * 打印 Y.Doc 的可读信息
 */
export function debugYDoc(ydoc: Y.Doc, label: string = "Y.Doc") {
  console.group(`🔍 ${label} 调试信息`);

  // 1. 文档内容（JSON格式）
  console.log("📄 文档内容:", ydocToJSON(ydoc));

  // 2. 文档状态向量
  const stateVector = Y.encodeStateVector(ydoc);
  console.log("📊 状态向量 (二进制):", binaryToHex(stateVector));
  console.log("   大小:", stateVector.byteLength, "字节");

  // 3. 完整文档快照
  const snapshot = Y.encodeStateAsUpdate(ydoc);
  console.log(
    "💾 文档快照 (二进制):",
    binaryToHex(snapshot).slice(0, 100) + "..."
  );
  console.log("   大小:", snapshot.byteLength, "字节");

  // 4. 文档统计
  let itemCount = 0;
  ydoc.store.clients.forEach((structs) => {
    itemCount += structs.length;
  });
  console.log("📈 统计:", {
    客户端数量: ydoc.store.clients.size,
    结构项数量: itemCount,
  });

  console.groupEnd();
}

/**
 * 监控 Y.Doc 的所有更新（调试用）
 */
export function watchYDoc(ydoc: Y.Doc, label: string = "Y.Doc") {
  let updateCount = 0;

  ydoc.on("update", (update: Uint8Array, origin: any) => {
    updateCount++;
    console.group(`🔄 ${label} 更新 #${updateCount}`);
    console.log("来源:", origin);
    console.log("大小:", update.byteLength, "字节");
    console.log("十六进制:", binaryToHex(update).slice(0, 100) + "...");
    console.log("尝试提取文本:", extractText(update));
    console.log("更新后内容:", ydocToJSON(ydoc));
    console.groupEnd();
  });

  console.log(`👀 开始监控 ${label}，每次更新都会打印详细信息`);
}

/**
 * 将 Y.Doc 导出为人类可读的 JSON 文件
 */
export function exportYDocAsJSON(ydoc: Y.Doc): string {
  const data = {
    content: ydocToJSON(ydoc),
    metadata: {
      exportTime: new Date().toISOString(),
      clients: Array.from(ydoc.store.clients.keys()),
      totalBytes: Y.encodeStateAsUpdate(ydoc).byteLength,
    },
  };

  return JSON.stringify(data, null, 2);
}

/**
 * 下载 Y.Doc 为 JSON 文件
 */
export function downloadYDocAsJSON(
  ydoc: Y.Doc,
  filename: string = "ydoc-export.json"
) {
  const json = exportYDocAsJSON(ydoc);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 从 IndexedDB 读取并解析 Yjs 数据
 */
export async function debugIndexedDB(dbName: string) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = () => {
      const db = request.result;
      console.group(`💾 IndexedDB: ${dbName}`);

      // 列出所有对象存储
      console.log("对象存储:", Array.from(db.objectStoreNames));

      // 读取数据
      const tx = db.transaction(db.objectStoreNames[0], "readonly");
      const store = tx.objectStore(db.objectStoreNames[0]);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const data = getAllRequest.result;
        console.log("记录数量:", data.length);

        data.forEach((item, index) => {
          console.group(`记录 #${index}`);
          console.log("键:", item.key || item.id || "<未知>");

          if (item.value instanceof Uint8Array) {
            console.log("类型: 二进制 (Uint8Array)");
            console.log("大小:", item.value.byteLength, "字节");
            console.log(
              "十六进制 (前100字节):",
              binaryToHex(item.value).slice(0, 100) + "..."
            );

            // 尝试解析为 Y.Doc
            try {
              const doc = new Y.Doc();
              Y.applyUpdate(doc, item.value);
              console.log("解析后的内容:", ydocToJSON(doc));
            } catch (e) {
              console.log("无法解析为 Y.Doc:", e);
            }
          } else {
            console.log("数据:", item);
          }

          console.groupEnd();
        });

        console.groupEnd();
        resolve(data);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * 清空 IndexedDB（调试用）
 */
export async function clearIndexedDB(dbName: string) {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    deleteRequest.onsuccess = () => {
      console.log(`✅ 已清空 IndexedDB: ${dbName}`);
      resolve(true);
    };
    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
}

// 将工具挂载到 window 上方便调试
if (typeof window !== "undefined") {
  (window as any).yjsDebug = {
    binaryToHex,
    extractText,
    ydocToJSON,
    debugYDoc,
    watchYDoc,
    exportYDocAsJSON,
    downloadYDocAsJSON,
    debugIndexedDB,
    clearIndexedDB,
  };

  console.log("🛠️ Yjs 调试工具已加载！使用 window.yjsDebug 访问");
  console.log("示例：");
  console.log('  - yjsDebug.debugIndexedDB("default-room")  // 查看 IndexedDB');
  console.log('  - yjsDebug.clearIndexedDB("default-room")  // 清空 IndexedDB');
}
