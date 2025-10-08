/**
 * Yjs WebSocket 服务器
 * 
 * 功能：
 * 1. 房间管理：不同文档在不同"房间"中
 * 2. 消息转发：将一个客户端的更新转发给同房间的其他客户端
 * 3. 状态同步：新客户端加入时同步完整状态
 * 4. 自动清理：断开连接时清理资源
 * 
 * 对比 03 (OT Server)：
 * - 03: 需要手动管理版本号、Transform、操作队列
 * - 05: Yjs 自动处理，只需转发消息
 */

import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const PORT = process.env.PORT || 1234;

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 Yjs WebSocket Server 启动成功！`);
console.log(`📡 监听端口: ${PORT}`);
console.log(`🔗 客户端连接地址: ws://localhost:${PORT}`);
console.log('');

// 连接计数（用于统计）
let connectionCount = 0;
const rooms = new Map(); // 房间统计

wss.on('connection', (ws, req) => {
  connectionCount++;
  const connectionId = connectionCount;
  
  // 从 URL 中提取房间名（文档ID）
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomName = url.searchParams.get('room') || 'default';
  
  console.log(`✅ 新连接 #${connectionId} 加入房间: ${roomName}`);
  
  // 更新房间统计
  if (!rooms.has(roomName)) {
    rooms.set(roomName, 0);
  }
  rooms.set(roomName, rooms.get(roomName) + 1);
  
  console.log(`   当前房间 "${roomName}" 有 ${rooms.get(roomName)} 个连接`);
  console.log(`   总连接数: ${wss.clients.size}`);
  console.log('');
  
  // 设置 Yjs WebSocket 连接
  // 这个函数会自动处理：
  // 1. 同步初始状态（新客户端加入时）
  // 2. 转发更新消息（客户端编辑时）
  // 3. Awareness 状态同步（光标、用户信息等）
  setupWSConnection(ws, req);
  
  // 监听断开连接
  ws.on('close', () => {
    rooms.set(roomName, rooms.get(roomName) - 1);
    if (rooms.get(roomName) === 0) {
      rooms.delete(roomName);
    }
    
    console.log(`❌ 连接 #${connectionId} 断开，离开房间: ${roomName}`);
    console.log(`   当前房间 "${roomName}" 有 ${rooms.get(roomName) || 0} 个连接`);
    console.log(`   总连接数: ${wss.clients.size}`);
    console.log('');
  });
  
  // 监听错误
  ws.on('error', (error) => {
    console.error(`⚠️  连接 #${connectionId} 错误:`, error.message);
  });
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 正在关闭服务器...');
  wss.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

/**
 * 对比说明：
 * 
 * 03 (OT Server) 需要做的事情：
 * ```javascript
 * class OTServer {
 *   receiveOperation(clientId, operation) {
 *     // 1. 分配版本号
 *     this.version++;
 *     
 *     // 2. 应用操作
 *     this.document = apply(this.document, operation);
 *     
 *     // 3. 保存历史
 *     this.history.push({version, operation, clientId});
 *     
 *     // 4. 广播（其他客户端需要 Transform）
 *     this.broadcast({operation, version}, clientId);
 *   }
 * }
 * ```
 * 
 * 05 (Yjs Server) 需要做的事情：
 * ```javascript
 * setupWSConnection(ws, req);  // 就这一行！
 * ```
 * 
 * Yjs 自动做了：
 * - ✅ 状态同步（无需版本号）
 * - ✅ 消息转发（无需 Transform）
 * - ✅ 房间管理（URL 参数）
 * - ✅ Awareness 同步（光标、用户信息）
 * - ✅ 错误处理
 * - ✅ 自动清理
 */

