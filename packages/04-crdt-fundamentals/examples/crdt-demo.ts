/**
 * CRDT 命令行 Demo
 *
 * 演示 G-Counter、PN-Counter 和 RGA 的基本用法
 */

import { GCounter } from "../src/g-counter";
import { PNCounter } from "../src/pn-counter";
import { RGA } from "../src/rga";

console.log("=".repeat(80));
console.log("🚀 Phase 4: CRDT 基础 - 命令行 Demo");
console.log("=".repeat(80));
console.log();

// ============================================================================
// Demo 1: G-Counter（只增计数器）
// ============================================================================
console.log("📊 Demo 1: G-Counter（只增计数器）");
console.log("-".repeat(80));

const counter1 = new GCounter();
const counter2 = new GCounter();
const counter3 = new GCounter();

console.log("1. 初始状态：");
console.log(`   counter1.value() = ${counter1.value()}`);
console.log(`   counter2.value() = ${counter2.value()}`);
console.log(`   counter3.value() = ${counter3.value()}`);
console.log();

console.log("2. 各个副本分别递增：");
counter1.increment("alice", 5);
console.log(`   Alice 的计数器 +5: counter1.value() = ${counter1.value()}`);

counter2.increment("bob", 3);
console.log(`   Bob 的计数器 +3: counter2.value() = ${counter2.value()}`);

counter3.increment("charlie", 7);
console.log(`   Charlie 的计数器 +7: counter3.value() = ${counter3.value()}`);
console.log();

console.log("3. 合并所有计数器：");
const merged = counter1.merge(counter2).merge(counter3);
console.log(`   merged.value() = ${merged.value()} (应该是 15)`);
console.log(`   内部状态:`, merged.getState());
console.log();

console.log("4. 验证交换律（合并顺序无关）：");
const mergedA = counter1.merge(counter2).merge(counter3);
const mergedB = counter3.merge(counter1).merge(counter2);
console.log(`   方式A: ${mergedA.value()}`);
console.log(`   方式B: ${mergedB.value()}`);
console.log(`   结果相同: ${mergedA.value() === mergedB.value()} ✅`);
console.log();

// ============================================================================
// Demo 2: PN-Counter（可增可减计数器）
// ============================================================================
console.log("📊 Demo 2: PN-Counter（可增可减计数器）");
console.log("-".repeat(80));

const pnCounter1 = new PNCounter();
const pnCounter2 = new PNCounter();

console.log("1. Alice 的计数器：+10, -3");
pnCounter1.increment("alice", 10);
pnCounter1.decrement("alice", 3);
console.log(`   pnCounter1.value() = ${pnCounter1.value()} (应该是 7)`);
console.log();

console.log("2. Bob 的计数器：+5, -2");
pnCounter2.increment("bob", 5);
pnCounter2.decrement("bob", 2);
console.log(`   pnCounter2.value() = ${pnCounter2.value()} (应该是 3)`);
console.log();

console.log("3. 合并两个计数器：");
const pnMerged = pnCounter1.merge(pnCounter2);
console.log(`   merged.value() = ${pnMerged.value()} (应该是 10)`);
console.log(`   内部状态:`, pnMerged.getState());
console.log();

// ============================================================================
// Demo 3: RGA（文本编辑器）- 基础操作
// ============================================================================
console.log("📝 Demo 3: RGA（文本编辑器）- 基础操作");
console.log("-".repeat(80));

const rga = new RGA("alice");

console.log("1. 插入字符 'H', 'e', 'l', 'l', 'o':");
rga.insert(0, "H");
rga.insert(1, "e");
rga.insert(2, "l");
rga.insert(3, "l");
rga.insert(4, "o");
console.log(`   文本: "${rga.toString()}"`);
console.log();

console.log("2. 在位置 5 插入 ' World':");
" World".split("").forEach((char, i) => {
  rga.insert(5 + i, char);
});
console.log(`   文本: "${rga.toString()}"`);
console.log();

console.log("3. 删除位置 5 的字符（空格）:");
rga.delete(5);
console.log(`   文本: "${rga.toString()}"`);
console.log();

console.log("4. 内部状态：");
const state = rga.getState();
console.log(`   可见字符数: ${rga.length()}`);
console.log(`   总字符数（含墓碑）: ${state.chars.length}`);
console.log(`   逻辑时钟: ${state.clock}`);
console.log();

// ============================================================================
// Demo 4: RGA - 并发编辑场景
// ============================================================================
console.log("📝 Demo 4: RGA - 并发编辑场景");
console.log("-".repeat(80));

const alice = new RGA("alice");
const bob = new RGA("bob");

console.log("1. 初始状态：Alice 输入 'Hi'");
const opsInit = ["H", "i"].map((char, i) => alice.insert(i, char));
opsInit.forEach((op) => bob.applyOperation(op));
console.log(`   Alice: "${alice.toString()}"`);
console.log(`   Bob:   "${bob.toString()}"`);
console.log();

console.log("2. 并发编辑：");
console.log("   - Alice 在末尾插入 '!'");
const opAlice = alice.insert(2, "!");
console.log(`   Alice: "${alice.toString()}"`);

console.log("   - Bob 同时在开头插入 'Oh, '（并发）");
const opsBob = "Oh, ".split("").map((char, i) => bob.insert(i, char));
console.log(`   Bob:   "${bob.toString()}"`);
console.log();

console.log("3. 同步操作：");
console.log("   - Alice 收到 Bob 的操作");
opsBob.forEach((op) => alice.applyOperation(op));
console.log(`   Alice: "${alice.toString()}"`);

console.log("   - Bob 收到 Alice 的操作");
bob.applyOperation(opAlice);
console.log(`   Bob:   "${bob.toString()}"`);
console.log();

console.log("4. 验证收敛：");
const aliceText = alice.toString();
const bobText = bob.toString();
console.log(`   Alice: "${aliceText}"`);
console.log(`   Bob:   "${bobText}"`);
console.log(`   收敛: ${aliceText === bobText ? "✅ 成功" : "❌ 失败"}`);
console.log();

// ============================================================================
// Demo 5: RGA - 三个用户同时编辑
// ============================================================================
console.log("📝 Demo 5: RGA - 三个用户同时编辑");
console.log("-".repeat(80));

const user1 = new RGA("user1");
const user2 = new RGA("user2");
const user3 = new RGA("user3");

console.log("1. 三个用户同时在开头插入不同字符：");
const op1 = user1.insert(0, "A");
console.log(`   User1 插入 'A': "${user1.toString()}"`);

const op2 = user2.insert(0, "B");
console.log(`   User2 插入 'B': "${user2.toString()}"`);

const op3 = user3.insert(0, "C");
console.log(`   User3 插入 'C': "${user3.toString()}"`);
console.log();

console.log("2. 所有用户互相同步：");
// User1 收到 User2 和 User3 的操作
user1.applyOperation(op2);
user1.applyOperation(op3);
console.log(`   User1: "${user1.toString()}"`);

// User2 收到 User1 和 User3 的操作
user2.applyOperation(op1);
user2.applyOperation(op3);
console.log(`   User2: "${user2.toString()}"`);

// User3 收到 User1 和 User2 的操作
user3.applyOperation(op1);
user3.applyOperation(op2);
console.log(`   User3: "${user3.toString()}"`);
console.log();

console.log("3. 验证收敛：");
const text1 = user1.toString();
const text2 = user2.toString();
const text3 = user3.toString();
console.log(`   User1: "${text1}"`);
console.log(`   User2: "${text2}"`);
console.log(`   User3: "${text3}"`);
console.log(
  `   所有用户收敛: ${
    text1 === text2 && text2 === text3 ? "✅ 成功" : "❌ 失败"
  }`
);
console.log();

// ============================================================================
// Demo 6: RGA - 离线编辑场景
// ============================================================================
console.log("📝 Demo 6: RGA - 离线编辑场景");
console.log("-".repeat(80));

const server = new RGA("server");

console.log("1. 服务器初始状态：'Hello'");
"Hello".split("").forEach((char, i) => server.insert(i, char));
console.log(`   Server: "${server.toString()}"`);
console.log();

console.log("2. 客户端拉取初始状态：");
const initialState = server.getState();
const client = RGA.fromState("client", initialState);
console.log(`   Client: "${client.toString()}"`);
console.log();

console.log("3. 客户端离线编辑：");
console.log("   - 客户端在末尾插入 ' World'");
const clientOps = " World"
  .split("")
  .map((char, i) => client.insert(5 + i, char));
console.log(`   Client: "${client.toString()}"`);
console.log();

console.log("4. 服务器同时继续更新：");
console.log("   - 服务器在开头插入 'Oh, '");
const serverOps = "Oh, ".split("").map((char, i) => server.insert(i, char));
console.log(`   Server: "${server.toString()}"`);
console.log();

console.log("5. 客户端上线，同步操作：");
console.log("   - 客户端发送离线操作到服务器");
clientOps.forEach((op) => server.applyOperation(op));
console.log(`   Server: "${server.toString()}"`);

console.log("   - 客户端接收服务器的操作");
serverOps.forEach((op) => client.applyOperation(op));
console.log(`   Client: "${client.toString()}"`);
console.log();

console.log("6. 验证收敛：");
const serverText = server.toString();
const clientText = client.toString();
console.log(`   Server: "${serverText}"`);
console.log(`   Client: "${clientText}"`);
console.log(`   收敛: ${serverText === clientText ? "✅ 成功" : "❌ 失败"}`);
console.log();

// ============================================================================
// 总结
// ============================================================================
console.log("=".repeat(80));
console.log("🎉 Demo 完成！");
console.log("=".repeat(80));
console.log();
console.log("关键要点：");
console.log("1. CRDT 通过数据结构设计避免冲突");
console.log("2. 操作可以任意顺序应用（交换律）");
console.log("3. 无需中央服务器排序");
console.log("4. 完美支持离线编辑");
console.log("5. 数学保证最终收敛");
console.log();
console.log("下一步：");
console.log("- 运行 'pnpm test' 查看完整测试");
console.log("- 运行 'pnpm dev' 查看交互式 Demo");
console.log("- 阅读 docs/02-ot-vs-crdt.md 理解与 OT 的区别");
console.log();
