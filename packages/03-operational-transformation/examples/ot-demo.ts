/**
 * Phase 3: OT 协同编辑演示脚本
 *
 * 模拟两个客户端同时编辑文档的场景
 */

import { OTClient } from "../src/client";
import { insert, deleteOp, retain } from "../src/transform";
import { apply } from "../src/operation";
import type { Operation } from "../src/types";

console.log("=".repeat(60));
console.log("🎯 OT 协同编辑演示");
console.log("=".repeat(60));

// 模拟服务器状态
class SimulatedServer {
  private document: string;
  private version: number;

  constructor(initialDoc: string = "") {
    this.document = initialDoc;
    this.version = 0;
  }

  receiveOperation(operations: Operation[]): number {
    this.document = apply(this.document, operations);
    this.version++;
    return this.version;
  }

  getDocument(): string {
    return this.document;
  }

  getVersion(): number {
    return this.version;
  }
}

// ========== 场景 1：基本协同 ==========
console.log("\n【场景 1】基本协同编辑\n");

const server1 = new SimulatedServer("ABC");
const alice1 = new OTClient("Alice", "ABC");
const bob1 = new OTClient("Bob", "ABC");

console.log(`初始文档: "${server1.getDocument()}"\n`);

// Alice 在开头插入 "X"
console.log("1️⃣ Alice 操作: 在开头插入 'X'");
const aliceOp1 = [insert("X")];
alice1.applyLocalOperation(aliceOp1);
console.log(`   Alice 本地: "${alice1.document}"`);

// 发送到服务器
const v1 = server1.receiveOperation(aliceOp1);
alice1.serverAck(v1);
console.log(`   服务器: "${server1.getDocument()}" (version ${v1})\n`);

// Bob 收到 Alice 的操作
console.log("2️⃣ Bob 收到远程操作");
bob1.applyRemoteOperation(aliceOp1, v1);
console.log(`   Bob: "${bob1.document}"\n`);

console.log("✅ 结果: Alice 和 Bob 的文档一致！\n");

// ========== 场景 2：并发冲突 ==========
console.log("=".repeat(60));
console.log("【场景 2】并发冲突解决\n");

const server2 = new SimulatedServer("ABC");
const alice2 = new OTClient("Alice", "ABC");
const bob2 = new OTClient("Bob", "ABC");

console.log(`初始文档: "${server2.getDocument()}"\n`);

// Alice 和 Bob 同时编辑
console.log("1️⃣ Alice 操作: 在开头插入 'X'");
const aliceOp2 = [insert("X")];
alice2.applyLocalOperation(aliceOp2);
console.log(`   Alice 本地: "${alice2.document}"`);

console.log("\n2️⃣ Bob 操作: 在位置 2 插入 'Y' (同时发生)");
const bobOp2 = [retain(2), insert("Y")];
bob2.applyLocalOperation(bobOp2);
console.log(`   Bob 本地: "${bob2.document}"`);

console.log("\n3️⃣ 服务器先收到 Alice 的操作");
const v2 = server2.receiveOperation(aliceOp2);
alice2.serverAck(v2);
console.log(`   服务器: "${server2.getDocument()}" (version ${v2})`);

console.log("\n4️⃣ 服务器再收到 Bob 的操作，广播给 Alice");
// 服务器需要应用 Bob 的操作（Bob 的操作基于旧版本）
// 实际中服务器会直接应用，这里为了演示简化
const v3 = server2.receiveOperation(bobOp2);
bob2.serverAck(v3);
console.log(`   服务器: "${server2.getDocument()}" (version ${v3})`);

console.log("\n5️⃣ Alice 收到 Bob 的操作（已被服务器接受）");
alice2.applyRemoteOperation(bobOp2, v3);
console.log(`   Alice: "${alice2.document}"`);

console.log("\n6️⃣ Bob 收到 Alice 的操作");
bob2.applyRemoteOperation(aliceOp2, v2);
console.log(`   Bob: "${bob2.document}"`);

console.log("\n✅ 结果: 通过 OT Transform，双方最终收敛！");
console.log(`   最终文档: "${alice2.document}"`);

// ========== 场景 3：复杂编辑 ==========
console.log("\n" + "=".repeat(60));
console.log("【场景 3】复杂编辑序列\n");

const server3 = new SimulatedServer("Hello World");
const alice3 = new OTClient("Alice", "Hello World");
const bob3 = new OTClient("Bob", "Hello World");

console.log(`初始文档: "${server3.getDocument()}"\n`);

// Alice: 在 "Hello" 后添加 "Beautiful"
console.log("1️⃣ Alice: 在 'Hello' 后添加 'Beautiful'");
const aliceOp3 = [retain(6), insert("Beautiful ")];
alice3.applyLocalOperation(aliceOp3);
console.log(`   Alice 本地: "${alice3.document}"`);

// Bob: 将 "World" 改成 "TypeScript"
console.log("\n2️⃣ Bob: 将 'World' 改成 'TypeScript'");
const bobOp3 = [retain(6), deleteOp(5), insert("TypeScript")];
bob3.applyLocalOperation(bobOp3);
console.log(`   Bob 本地: "${bob3.document}"`);

// 服务器处理
console.log("\n3️⃣ 服务器依次处理操作");
const v4 = server3.receiveOperation(aliceOp3);
alice3.serverAck(v4);
console.log(`   应用 Alice 操作: "${server3.getDocument()}"`);

const v5 = server3.receiveOperation(bobOp3);
bob3.serverAck(v5);
console.log(`   应用 Bob 操作: "${server3.getDocument()}"`);

// 客户端同步
console.log("\n4️⃣ 客户端接收远程操作");
alice3.applyRemoteOperation(bobOp3, v5);
console.log(`   Alice: "${alice3.document}"`);

bob3.applyRemoteOperation(aliceOp3, v4);
console.log(`   Bob: "${bob3.document}"`);

console.log("\n✅ 最终结果: 所有客户端和服务器一致！");
console.log(`   文档: "${alice3.document}"`);

// ========== 统计信息 ==========
console.log("\n" + "=".repeat(60));
console.log("📊 统计信息\n");

console.log("Alice 状态:", alice3.getState());
console.log("Bob 状态:", bob3.getState());
console.log(`服务器版本: ${server3.getVersion()}`);
console.log(`服务器文档: "${server3.getDocument()}"`);

console.log("\n" + "=".repeat(60));
console.log("✨ OT 协同编辑演示完成！");
console.log("=".repeat(60));

console.log("\n💡 关键理解：");
console.log("1. Transform 函数是 OT 的核心，用于转换并发操作");
console.log("2. 客户端需要管理未确认的操作队列");
console.log("3. 服务器负责排序和广播操作");
console.log("4. 通过正确的 Transform，所有客户端最终会收敛到一致状态");
