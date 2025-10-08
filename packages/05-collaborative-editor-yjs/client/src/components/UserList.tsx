/**
 * 在线用户列表组件
 *
 * 功能：
 * 1. 显示当前在线的所有用户
 * 2. 显示用户名和颜色（与光标颜色对应）
 * 3. 实时更新（用户加入/离开）
 *
 * 使用 Yjs Awareness API
 */

import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import "./UserList.css";

export interface User {
  clientId: number;
  name: string;
  color: string;
}

export interface UserListProps {
  provider: WebsocketProvider | null;
}

export function UserList({ provider }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    const updateUsers = () => {
      const states = awareness.getStates();
      const userList: User[] = [];

      states.forEach((state, clientId) => {
        if (state.user) {
          userList.push({
            clientId,
            name: state.user.name || "匿名用户",
            color: state.user.color || "#999999",
          });
        }
      });

      setUsers(userList);
      console.log(`👥 在线用户: ${userList.length} 人`, userList);
    };

    // 初始化
    updateUsers();

    // 监听变化
    awareness.on("change", updateUsers);

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [provider]);

  if (!provider) {
    return null;
  }

  return (
    <div className="user-list">
      <h3 className="user-list-title">在线用户 ({users.length})</h3>
      <div className="user-list-items">
        {users.map((user) => (
          <div key={user.clientId} className="user-item">
            <div
              className="user-avatar"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user.name}</span>
          </div>
        ))}

        {users.length === 0 && (
          <div className="user-list-empty">暂无其他用户</div>
        )}
      </div>
    </div>
  );
}
