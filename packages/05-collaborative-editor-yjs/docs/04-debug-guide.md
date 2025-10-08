# Yjs 二进制数据调试指南

> 如何查看和理解那些"看不见"的二进制数据？

## 😫 问题：二进制数据无法直接查看

当你打开浏览器开发者工具时：

**Network 标签：**
```
WS → Messages → Binary Message (27 bytes)
[无法阅读的二进制数据]
```

**Application 标签 → IndexedDB：**
```
default-room → updates
  key: 0
  value: Uint8Array(1234) [...]
[无法阅读的二进制数据]
```

**问题：**
- ❌ 无法知道传输了什么内容
- ❌ 无法验证数据是否正确
- ❌ 无法调试协同问题
- ❌ 无法理解 CRDT 的工作原理

---

## ✅ 解决方案：使用调试工具

我们提供了一套完整的调试工具！

---

## 🛠️ 方法 1：浏览器控制台调试（最简单）

### 1. 打开控制台

打开应用后，按 **F12** 打开开发者工具，切换到 **Console** 标签。

你会看到提示：
```
💡 提示: 使用 yjsDebug 对象调试 Yjs 数据
   例如: yjsDebug.debugYDoc(ydoc)
```

### 2. 查看当前文档内容

```javascript
// 方法 1：直接访问全局变量（如果你暴露了）
window.ydoc  // Y.Doc 实例

// 方法 2：使用调试工具（推荐）
yjsDebug.debugYDoc(window.ydoc)
```

**输出示例：**
```
🔍 Y.Doc 调试信息
  📄 文档内容: {
    "default": "Hello World! 这是协同编辑测试"
  }
  📊 状态向量 (二进制): 00 01 05 a2 01
     大小: 5 字节
  💾 文档快照 (二进制): 00 01 05 a2 01 02 01 48 65 6c 6c 6f...
     大小: 156 字节
  📈 统计: {
    客户端数量: 1,
    结构项数量: 3
  }
```

**看！文档内容被解析出来了！** ✨

### 3. 查看 IndexedDB 数据

```javascript
// 查看指定房间的 IndexedDB 数据
await yjsDebug.debugIndexedDB('default-room')
```

**输出示例：**
```
💾 IndexedDB: default-room
  对象存储: ["updates"]
  记录数量: 1
  
  记录 #0
    键: <未知>
    类型: 二进制 (Uint8Array)
    大小: 156 字节
    十六进制 (前100字节): 00 01 05 a2 01 02 01 48 65 6c 6c 6f 20 57...
    解析后的内容: {
      "default": "Hello World! 这是协同编辑测试"
    }
```

**IndexedDB 的二进制数据也被解析出来了！** 🎉

### 4. 导出为 JSON 文件

```javascript
// 下载当前文档为 JSON 文件
yjsDebug.downloadYDocAsJSON(window.ydoc, 'my-document.json')
```

**下载的文件内容：**
```json
{
  "content": {
    "default": "Hello World! 这是协同编辑测试"
  },
  "metadata": {
    "exportTime": "2024-10-08T12:34:56.789Z",
    "clients": [1, 2],
    "totalBytes": 156
  }
}
```

**现在可以用任何文本编辑器查看了！** 📝

### 5. 实时监控更新

```javascript
// 监控所有更新（会在控制台打印）
yjsDebug.watchYDoc(window.ydoc, 'My Document')
```

**然后在编辑器里输入文字，控制台会显示：**
```
🔄 My Document 更新 #1
  来源: WebsocketProvider
  大小: 18 字节
  十六进制: 00 01 05 a3 01 01 05 48 65 6c 6c 6f...
  尝试提取文本: Hello
  更新后内容: {
    "default": "Hello World! 这是协同编辑测试Hello"
  }
```

**每次编辑都能看到详细信息！** 👀

---

## 🔧 方法 2：修改代码添加日志

### 在 `useYjs.ts` 中添加监听

```typescript
// useYjs.ts
useEffect(() => {
  // ... 创建 ydoc、provider 等

  // 添加更新监听
  doc.on('update', (update: Uint8Array, origin: any) => {
    console.group('📦 Y.Doc 更新');
    console.log('来源:', origin);
    console.log('大小:', update.byteLength, '字节');
    
    // 使用调试工具
    if ((window as any).yjsDebug) {
      const hex = (window as any).yjsDebug.binaryToHex(update);
      console.log('十六进制:', hex.slice(0, 100) + '...');
      console.log('当前内容:', (window as any).yjsDebug.ydocToJSON(doc));
    }
    
    console.groupEnd();
  });

  // ... 其他代码
}, []);
```

### 在 `App.tsx` 中暴露 ydoc

```typescript
// App.tsx
useEffect(() => {
  if (ydoc) {
    // 暴露到 window，方便调试
    (window as any).ydoc = ydoc;
    (window as any).provider = provider;
    
    console.log('✅ ydoc 和 provider 已暴露到 window');
    console.log('   使用 window.ydoc 访问文档');
    console.log('   使用 window.provider 访问 WebSocket Provider');
  }
}, [ydoc, provider]);
```

---

## 📱 方法 3：查看浏览器 Application 面板

### 1. 查看 IndexedDB

1. **F12 → Application → Storage → IndexedDB**
2. 展开你的数据库（如 `default-room`）
3. 点击 `updates` 对象存储
4. 看到 `value: Uint8Array(...)`

### 2. 查看二进制详情

虽然直接看不懂，但可以：

```javascript
// 在控制台执行
const request = indexedDB.open('default-room');
request.onsuccess = () => {
  const db = request.result;
  const tx = db.transaction('updates', 'readonly');
  const store = tx.objectStore('updates');
  const getAll = store.getAll();
  
  getAll.onsuccess = () => {
    const data = getAll.result;
    console.log('IndexedDB 数据:', data);
    
    // 使用调试工具解析
    data.forEach((item, i) => {
      if (item.value instanceof Uint8Array) {
        console.log(`记录 ${i}:`);
        console.log('  大小:', item.value.byteLength, '字节');
        console.log('  内容:', yjsDebug.extractText(item.value));
      }
    });
  };
};
```

---

## 🎯 实战案例

### 案例 1：验证协同是否正确

**场景：** 两个用户同时编辑，怀疑数据不一致

```javascript
// 在两个标签页的控制台分别执行
yjsDebug.exportYDocAsJSON(window.ydoc)
```

**对比输出：**
```json
// 标签页 1
{
  "content": { "default": "Hello World" },
  "metadata": { "clients": [1, 2] }
}

// 标签页 2
{
  "content": { "default": "Hello World" },  // ✅ 内容一致
  "metadata": { "clients": [1, 2] }
}
```

### 案例 2：调试离线编辑

**步骤：**
1. 断网前：`yjsDebug.debugIndexedDB('default-room')`
2. 断网
3. 编辑内容
4. 再次查看：`yjsDebug.debugIndexedDB('default-room')`
5. 对比发现 IndexedDB 已更新 ✅

### 案例 3：查看网络传输内容

**浏览器开发者工具：**
1. **Network → WS → Messages**
2. 点击某条消息
3. 复制二进制数据（右键 → Copy as Base64）

**控制台解析：**
```javascript
// 粘贴 Base64 数据
const base64 = 'AAEFARUC...';
const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

// 使用调试工具
console.log('十六进制:', yjsDebug.binaryToHex(binary));
console.log('文本:', yjsDebug.extractText(binary));

// 尝试解析为 Y.Doc
const doc = new Y.Doc();
Y.applyUpdate(doc, binary);
console.log('内容:', yjsDebug.ydocToJSON(doc));
```

---

## 🧹 清理数据

### 清空 IndexedDB

```javascript
// 清空指定房间
await yjsDebug.clearIndexedDB('default-room')

// 刷新页面，重新开始
location.reload()
```

### 清空所有协同数据

```javascript
// 1. 清空 IndexedDB
await yjsDebug.clearIndexedDB('default-room')

// 2. 断开 WebSocket
window.provider?.disconnect()

// 3. 刷新
location.reload()
```

---

## 🎓 调试工具 API 参考

### `yjsDebug.binaryToHex(binary)`
将二进制数据转换为十六进制字符串
```javascript
yjsDebug.binaryToHex(new Uint8Array([72, 101, 108, 108, 111]))
// "48 65 6c 6c 6f"
```

### `yjsDebug.extractText(binary)`
尝试从二进制中提取文本
```javascript
yjsDebug.extractText(new Uint8Array([72, 101, 108, 108, 111]))
// "Hello"
```

### `yjsDebug.ydocToJSON(ydoc)`
将 Y.Doc 转换为 JSON
```javascript
yjsDebug.ydocToJSON(window.ydoc)
// { "default": "Hello World" }
```

### `yjsDebug.debugYDoc(ydoc, label?)`
打印 Y.Doc 的完整调试信息
```javascript
yjsDebug.debugYDoc(window.ydoc, 'My Document')
```

### `yjsDebug.watchYDoc(ydoc, label?)`
实时监控 Y.Doc 的所有更新
```javascript
yjsDebug.watchYDoc(window.ydoc)
// 之后每次编辑都会在控制台打印
```

### `yjsDebug.downloadYDocAsJSON(ydoc, filename?)`
下载 Y.Doc 为 JSON 文件
```javascript
yjsDebug.downloadYDocAsJSON(window.ydoc, 'document.json')
```

### `yjsDebug.debugIndexedDB(dbName)`
查看 IndexedDB 数据并解析
```javascript
await yjsDebug.debugIndexedDB('default-room')
```

### `yjsDebug.clearIndexedDB(dbName)`
清空 IndexedDB
```javascript
await yjsDebug.clearIndexedDB('default-room')
```

---

## 💡 调试技巧

### 1. 对比二进制大小

```javascript
// 编辑前
const before = Y.encodeStateAsUpdate(window.ydoc);
console.log('编辑前大小:', before.byteLength, '字节');

// 输入 "Hello"

// 编辑后
const after = Y.encodeStateAsUpdate(window.ydoc);
console.log('编辑后大小:', after.byteLength, '字节');
console.log('增加:', after.byteLength - before.byteLength, '字节');
```

### 2. 查看状态向量

```javascript
// 状态向量记录了每个客户端的最新版本
const stateVector = Y.encodeStateVector(window.ydoc);
console.log('状态向量:', yjsDebug.binaryToHex(stateVector));
console.log('大小:', stateVector.byteLength, '字节');
```

### 3. 生成差异更新

```javascript
// 获取从某个状态到当前状态的差异
const stateVector = Y.encodeStateVector(window.ydoc);
const diff = Y.encodeStateAsUpdate(window.ydoc, stateVector);
console.log('差异更新:', yjsDebug.binaryToHex(diff));
```

---

## 🎯 总结

| 需求 | 方法 |
|------|------|
| **查看文档内容** | `yjsDebug.ydocToJSON(ydoc)` |
| **查看 IndexedDB** | `yjsDebug.debugIndexedDB('room')` |
| **监控实时更新** | `yjsDebug.watchYDoc(ydoc)` |
| **导出为 JSON** | `yjsDebug.downloadYDocAsJSON(ydoc)` |
| **解析二进制** | `yjsDebug.binaryToHex(binary)` |
| **清空数据** | `yjsDebug.clearIndexedDB('room')` |

**虽然 Yjs 用二进制，但我们有工具让它变得可调试！** 🎉

---

## 🚀 下一步

1. 打开 http://localhost:5173
2. 按 F12 打开控制台
3. 输入一些文字
4. 执行 `yjsDebug.debugYDoc(window.ydoc)`
5. 看到文档内容被漂亮地展示出来！

**试试吧！** 😊

