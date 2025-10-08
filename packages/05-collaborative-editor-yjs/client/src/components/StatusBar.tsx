/**
 * 状态栏组件
 *
 * 显示：
 * 1. WebSocket 连接状态
 * 2. 同步状态
 * 3. 房间信息
 */

import "./StatusBar.css";

export interface StatusBarProps {
  connected: boolean;
  synced: boolean;
  roomName: string;
}

export function StatusBar({ connected, synced, roomName }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">房间:</span>
        <span className="status-value room-name">{roomName}</span>
      </div>

      <div className="status-item">
        <span className="status-label">连接:</span>
        <span
          className={`status-indicator ${
            connected ? "connected" : "disconnected"
          }`}
        >
          {connected ? "✓ 已连接" : "✗ 未连接"}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">同步:</span>
        <span className={`status-indicator ${synced ? "synced" : "syncing"}`}>
          {synced ? "✓ 已同步" : "⏳ 同步中"}
        </span>
      </div>
    </div>
  );
}
