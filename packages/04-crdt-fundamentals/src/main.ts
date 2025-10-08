import { RGA, Operation, InsertOperation, DeleteOperation } from "./rga";
import { GCounter } from "./g-counter";

// 全局 RGA 实例
let aliceRGA: RGA;
let bobRGA: RGA;
let charlieRGA: RGA;

// 操作历史（用于模拟同步）
const operations: Map<string, Operation[]> = new Map([
  ["alice", []],
  ["bob", []],
  ["charlie", []],
]);

// 初始化
function init() {
  aliceRGA = new RGA("alice");
  bobRGA = new RGA("bob");
  charlieRGA = new RGA("charlie");

  // 绑定事件
  const aliceEditor = document.getElementById(
    "editor-alice"
  ) as HTMLTextAreaElement;
  const bobEditor = document.getElementById(
    "editor-bob"
  ) as HTMLTextAreaElement;
  const charlieEditor = document.getElementById(
    "editor-charlie"
  ) as HTMLTextAreaElement;

  // 监听输入事件
  aliceEditor.addEventListener("input", () =>
    handleInput("alice", aliceEditor, aliceRGA)
  );
  bobEditor.addEventListener("input", () =>
    handleInput("bob", bobEditor, bobRGA)
  );
  charlieEditor.addEventListener("input", () =>
    handleInput("charlie", charlieEditor, charlieRGA)
  );

  updateAllInfo();
  log("系统初始化完成，开始你的 CRDT 之旅！", "");
}

// 处理输入
let lastValues: Map<string, string> = new Map([
  ["alice", ""],
  ["bob", ""],
  ["charlie", ""],
]);

function handleInput(replica: string, editor: HTMLTextAreaElement, rga: RGA) {
  const newValue = editor.value;
  const oldValue = lastValues.get(replica) || "";

  // 计算差异并生成操作
  const ops = calculateDiff(oldValue, newValue, rga);

  // 记录操作
  ops.forEach((op) => {
    operations.get(replica)!.push(op);
    logOperation(replica, op);
  });

  lastValues.set(replica, newValue);
  updateInfo(replica, rga);
}

// 简化的差异计算（实际应用中需要更复杂的算法）
function calculateDiff(
  oldText: string,
  newText: string,
  rga: RGA
): Operation[] {
  const ops: Operation[] = [];

  if (newText.length > oldText.length) {
    // 插入
    const insertPos = findInsertPosition(oldText, newText);
    const insertedText = newText.substring(
      insertPos,
      insertPos + (newText.length - oldText.length)
    );

    for (let i = 0; i < insertedText.length; i++) {
      const op = rga.insert(insertPos + i, insertedText[i]);
      ops.push(op);
    }
  } else if (newText.length < oldText.length) {
    // 删除
    const deletePos = findDeletePosition(oldText, newText);
    const deleteCount = oldText.length - newText.length;

    for (let i = 0; i < deleteCount; i++) {
      const op = rga.delete(deletePos);
      if (op) ops.push(op);
    }
  }

  return ops;
}

function findInsertPosition(oldText: string, newText: string): number {
  for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
    if (oldText[i] !== newText[i]) {
      return i;
    }
  }
  return oldText.length;
}

function findDeletePosition(oldText: string, newText: string): number {
  for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
    if (oldText[i] !== newText[i]) {
      return i;
    }
  }
  return newText.length;
}

// 更新信息显示
function updateInfo(replica: string, rga: RGA) {
  const state = rga.getState();
  const lengthEl = document.getElementById(`info-${replica}-length`);
  const clockEl = document.getElementById(`info-${replica}-clock`);
  const charsEl = document.getElementById(`info-${replica}-chars`);

  if (lengthEl) lengthEl.textContent = rga.length().toString();
  if (clockEl) clockEl.textContent = state.clock.toString();
  if (charsEl) charsEl.textContent = state.chars.length.toString();
}

function updateAllInfo() {
  updateInfo("alice", aliceRGA);
  updateInfo("bob", bobRGA);
  updateInfo("charlie", charlieRGA);
}

// 日志
function log(message: string, type: string = "") {
  const container = document.getElementById("log-container");
  if (!container) return;

  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  container.insertBefore(entry, container.firstChild);

  // 限制日志数量
  if (container.children.length > 50) {
    container.removeChild(container.lastChild!);
  }
}

function logOperation(replica: string, op: Operation) {
  if (op.type === "insert") {
    log(
      `${replica} 插入字符 '${op.char.value}' (ID: ${op.char.id.replicaId}-${op.char.id.clock})`,
      "log-insert"
    );
  } else {
    log(
      `${replica} 删除字符 (ID: ${op.charId.replicaId}-${op.charId.clock})`,
      "log-delete"
    );
  }
}

// 场景测试
(window as any).scenario1 = function scenario1() {
  (window as any).clearAll();
  setScenario("Alice 输入 'Hello'，然后同步到 Bob 和 Charlie");

  // Alice 输入
  const ops: Operation[] = [];
  "Hello".split("").forEach((char, i) => {
    const op = aliceRGA.insert(i, char);
    ops.push(op);
  });

  updateEditor("alice", aliceRGA);
  log("Alice 输入了 'Hello'", "log-insert");

  // 同步到 Bob
  setTimeout(() => {
    ops.forEach((op) => bobRGA.applyOperation(op));
    updateEditor("bob", bobRGA);
    log("Bob 收到并应用了 Alice 的操作", "log-merge");
    updateAllInfo();
  }, 500);

  // 同步到 Charlie
  setTimeout(() => {
    ops.forEach((op) => charlieRGA.applyOperation(op));
    updateEditor("charlie", charlieRGA);
    log("Charlie 收到并应用了 Alice 的操作", "log-merge");
    updateAllInfo();
  }, 1000);
};

(window as any).scenario2 = function scenario2() {
  (window as any).clearAll();
  setScenario("Alice、Bob、Charlie 同时在开头插入不同字符，然后同步");

  // Alice 插入 'A'
  const opA = aliceRGA.insert(0, "A");
  updateEditor("alice", aliceRGA);
  log("Alice 在开头插入 'A'", "log-insert");

  // Bob 插入 'B'（同时）
  const opB = bobRGA.insert(0, "B");
  updateEditor("bob", bobRGA);
  log("Bob 在开头插入 'B' (并发)", "log-insert");

  // Charlie 插入 'C'（同时）
  const opC = charlieRGA.insert(0, "C");
  updateEditor("charlie", charlieRGA);
  log("Charlie 在开头插入 'C' (并发)", "log-insert");

  // 同步
  setTimeout(() => {
    // Alice 收到 Bob 和 Charlie 的操作
    aliceRGA.applyOperation(opB);
    aliceRGA.applyOperation(opC);
    updateEditor("alice", aliceRGA);

    // Bob 收到 Alice 和 Charlie 的操作
    bobRGA.applyOperation(opA);
    bobRGA.applyOperation(opC);
    updateEditor("bob", bobRGA);

    // Charlie 收到 Alice 和 Bob 的操作
    charlieRGA.applyOperation(opA);
    charlieRGA.applyOperation(opB);
    updateEditor("charlie", charlieRGA);

    log("所有副本已同步 - 注意结果是否收敛！", "log-merge");
    updateAllInfo();

    // 验证收敛
    setTimeout(() => {
      const aliceText = aliceRGA.toString();
      const bobText = bobRGA.toString();
      const charlieText = charlieRGA.toString();

      if (aliceText === bobText && bobText === charlieText) {
        log(`✅ 收敛成功！所有副本都是: "${aliceText}"`, "log-merge");
      } else {
        log(
          `❌ 收敛失败！Alice: "${aliceText}", Bob: "${bobText}", Charlie: "${charlieText}"`,
          "log-merge"
        );
      }
    }, 500);
  }, 1000);
};

(window as any).scenario3 = function scenario3() {
  (window as any).clearAll();
  setScenario("冲突场景：Alice 和 Bob 同时编辑同一文档");

  // 初始状态：所有副本都有 "Hi"
  const opsInit: Operation[] = [];
  "Hi".split("").forEach((char, i) => {
    const op = aliceRGA.insert(i, char);
    opsInit.push(op);
    bobRGA.applyOperation(op);
  });
  updateEditor("alice", aliceRGA);
  updateEditor("bob", bobRGA);
  log("初始状态：Alice 和 Bob 都有 'Hi'", "");

  setTimeout(() => {
    // Alice 在末尾加 '!'
    const opAlice = aliceRGA.insert(2, "!");
    updateEditor("alice", aliceRGA);
    log("Alice 在末尾插入 '!'", "log-insert");

    // Bob 在开头加 'Oh, '（同时）
    const opsBob: Operation[] = [];
    "Oh, ".split("").forEach((char, i) => {
      const op = bobRGA.insert(i, char);
      opsBob.push(op);
    });
    updateEditor("bob", bobRGA);
    log("Bob 在开头插入 'Oh, ' (并发)", "log-insert");

    // 同步
    setTimeout(() => {
      // Alice 收到 Bob 的操作
      opsBob.forEach((op) => aliceRGA.applyOperation(op));
      updateEditor("alice", aliceRGA);
      log("Alice 收到 Bob 的操作", "log-merge");

      // Bob 收到 Alice 的操作
      bobRGA.applyOperation(opAlice);
      updateEditor("bob", bobRGA);
      log("Bob 收到 Alice 的操作", "log-merge");

      updateAllInfo();

      // 验证
      setTimeout(() => {
        const aliceText = aliceRGA.toString();
        const bobText = bobRGA.toString();

        if (aliceText === bobText) {
          log(`✅ 收敛成功！最终结果: "${aliceText}"`, "log-merge");
        } else {
          log(
            `❌ 收敛失败！Alice: "${aliceText}", Bob: "${bobText}"`,
            "log-merge"
          );
        }
      }, 500);
    }, 1000);
  }, 1000);
};

(window as any).syncAll = () => {
  log("开始同步所有副本...", "log-merge");

  // 收集所有操作
  const allOps: Operation[] = [
    ...operations.get("alice")!,
    ...operations.get("bob")!,
    ...operations.get("charlie")!,
  ];

  // 应用到所有副本（除了操作来源）
  allOps.forEach((op) => {
    const insertOp = op as InsertOperation;
    const deleteOp = op as DeleteOperation;

    if (insertOp.char) {
      const sourceReplica = insertOp.char.id.replicaId;
      if (sourceReplica !== "alice") aliceRGA.applyOperation(op);
      if (sourceReplica !== "bob") bobRGA.applyOperation(op);
      if (sourceReplica !== "charlie") charlieRGA.applyOperation(op);
    } else if (deleteOp.charId) {
      const sourceReplica = deleteOp.charId.replicaId;
      if (sourceReplica !== "alice") aliceRGA.applyOperation(op);
      if (sourceReplica !== "bob") bobRGA.applyOperation(op);
      if (sourceReplica !== "charlie") charlieRGA.applyOperation(op);
    }
  });

  updateEditor("alice", aliceRGA);
  updateEditor("bob", bobRGA);
  updateEditor("charlie", charlieRGA);
  updateAllInfo();

  log("同步完成！", "log-merge");
};

(window as any).clearAll = () => {
  aliceRGA = new RGA("alice");
  bobRGA = new RGA("bob");
  charlieRGA = new RGA("charlie");

  operations.set("alice", []);
  operations.set("bob", []);
  operations.set("charlie", []);

  lastValues.set("alice", "");
  lastValues.set("bob", "");
  lastValues.set("charlie", "");

  updateEditor("alice", aliceRGA);
  updateEditor("bob", bobRGA);
  updateEditor("charlie", charlieRGA);
  updateAllInfo();

  const logContainer = document.getElementById("log-container");
  if (logContainer) logContainer.innerHTML = "";

  log("已清空所有内容", "");
};

(window as any).showState = () => {
  log("=== Alice 的内部状态 ===", "");
  const aliceState = aliceRGA.getState();
  console.log("Alice RGA:", aliceState);
  log(
    `Alice: ${aliceState.chars.length} 个字符（含墓碑），时钟: ${aliceState.clock}`,
    ""
  );

  log("=== Bob 的内部状态 ===", "");
  const bobState = bobRGA.getState();
  console.log("Bob RGA:", bobState);
  log(
    `Bob: ${bobState.chars.length} 个字符（含墓碑），时钟: ${bobState.clock}`,
    ""
  );

  log("=== Charlie 的内部状态 ===", "");
  const charlieState = charlieRGA.getState();
  console.log("Charlie RGA:", charlieState);
  log(
    `Charlie: ${charlieState.chars.length} 个字符（含墓碑），时钟: ${charlieState.clock}`,
    ""
  );

  log("详细状态已输出到控制台（F12）", "");
};

(window as any).testCounter = () => {
  log("=== 测试 G-Counter ===", "");

  const counter1 = new GCounter();
  const counter2 = new GCounter();
  const counter3 = new GCounter();

  counter1.increment("alice", 5);
  log("Alice 的计数器 +5", "log-insert");

  counter2.increment("bob", 3);
  log("Bob 的计数器 +3", "log-insert");

  counter3.increment("charlie", 2);
  log("Charlie 的计数器 +2", "log-insert");

  const merged = counter1.merge(counter2).merge(counter3);
  log(`合并后的计数器值: ${merged.value()} (应该是 10)`, "log-merge");

  console.log("G-Counter 状态:", merged.getState());
};

function updateEditor(replica: string, rga: RGA) {
  const editor = document.getElementById(
    `editor-${replica}`
  ) as HTMLTextAreaElement;
  if (editor) {
    editor.value = rga.toString();
    lastValues.set(replica, editor.value);
  }
}

function setScenario(desc: string) {
  const descEl = document.getElementById("scenario-desc");
  if (descEl) descEl.textContent = desc;
}

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
