/**
 * Compose 和 Normalize 的实际演示
 *
 * 运行这个文件来看实际效果：
 * pnpm tsx examples/compose-normalize-demo.ts
 */

import {
  apply,
  compose,
  normalize,
  insert,
  deleteOp,
  retain,
} from "../src/operation";
import { Operation } from "../src/types";

console.log("=".repeat(60));
console.log("📚 Compose 和 Normalize 实战演示");
console.log("=".repeat(60));

// ========== 示例 1：Normalize 的必要性 ==========
console.log("\n【示例 1】Normalize 的效果\n");

const messyOps = [
  insert("H"),
  insert("e"),
  insert("l"),
  insert("l"),
  insert("o"),
  insert(""), // 空操作
  retain(0), // 无效操作
  deleteOp(0), // 无效操作
];

console.log("未优化的操作（用户逐字输入）：");
console.log(JSON.stringify(messyOps, null, 2));
console.log(`操作数量: ${messyOps.length}`);
console.log(`JSON 大小: ${JSON.stringify(messyOps).length} 字节`);

const cleanOps = normalize(messyOps);
console.log("\n优化后的操作：");
console.log(JSON.stringify(cleanOps, null, 2));
console.log(`操作数量: ${cleanOps.length}`);
console.log(`JSON 大小: ${JSON.stringify(cleanOps).length} 字节`);
console.log(
  `节省: ${(
    (1 - JSON.stringify(cleanOps).length / JSON.stringify(messyOps).length) *
    100
  ).toFixed(1)}%`
);

// ========== 示例 2：Compose 的魔法 ==========
console.log("\n" + "=".repeat(60));
console.log("【示例 2】Compose 的组合效果\n");

const text = "";
console.log(`原始文本: "${text}"\n`);

// 第一步：插入 "Hello World"
const ops1 = [insert("Hello World")];
console.log("步骤 1: 插入 'Hello World'");
console.log("操作:", JSON.stringify(ops1));
const step1 = apply(text, ops1);
console.log(`结果: "${step1}"\n`);

// 第二步：删除 "World"，保留 "Hello "
const ops2 = [retain(6), deleteOp(5)];
console.log("步骤 2: 删除 'World'");
console.log("操作:", JSON.stringify(ops2));
const step2 = apply(step1, ops2);
console.log(`结果: "${step2}"\n`);

// 第三步：插入 "TypeScript"
const ops3 = [retain(6), insert("TypeScript")];
console.log("步骤 3: 插入 'TypeScript'");
console.log("操作:", JSON.stringify(ops3));
const step3 = apply(step2, ops3);
console.log(`结果: "${step3}"\n`);

// 使用 Compose 组合所有操作
console.log("🎯 使用 Compose 组合所有操作:");
const composed_12 = compose(ops1, ops2);
console.log("compose(ops1, ops2):", JSON.stringify(composed_12));

const composed_all = compose(composed_12, ops3);
console.log("compose(result, ops3):", JSON.stringify(composed_all));

const directResult = apply(text, composed_all);
console.log(`\n直接应用组合操作: "${directResult}"`);
console.log(`逐步应用: "${step3}"`);
console.log(`结果相同: ${directResult === step3 ? "✅" : "❌"}`);

// ========== 示例 3：Insert + Delete 的抵消 ==========
console.log("\n" + "=".repeat(60));
console.log("【示例 3】Insert + Delete 的抵消效果\n");

const opsInsert = [insert("HelloWorld")];
const opsDelete = [deleteOp(5)]; // 删除前 5 个字符

console.log("操作 1: 插入 'HelloWorld'");
console.log("操作 2: 删除前 5 个字符");

const composedCancel = compose(opsInsert, opsDelete);
console.log("\nCompose 结果:", JSON.stringify(composedCancel));
console.log("效果: 插入的部分被删除抵消了！");

const result = apply("", composedCancel);
console.log(`最终文本: "${result}"`);

// ========== 示例 4：真实场景：用户编辑流程 ==========
console.log("\n" + "=".repeat(60));
console.log("【示例 4】真实场景：用户编辑流程\n");

const original = "The quick fox";
console.log(`原始文本: "${original}"\n`);

// 用户操作序列
const edits = [
  {
    desc: "在 'quick' 后插入 'brown'",
    ops: [retain(10), insert("brown "), retain(3)],
  },
  {
    desc: "在 'brown' 后删除 'fox'，插入 'dog'",
    ops: [retain(16), deleteOp(3), insert("dog")],
  },
  { desc: "在开头插入 'Oh, '", ops: [insert("Oh, "), retain(16)] },
];

let currentText = original;
const allOps: Operation[][] = [];

edits.forEach((edit, index) => {
  console.log(`${index + 1}. ${edit.desc}`);
  console.log(`   操作: ${JSON.stringify(edit.ops)}`);
  currentText = apply(currentText, edit.ops);
  console.log(`   结果: "${currentText}"\n`);
  allOps.push(edit.ops);
});

// 组合所有操作
let finalComposed: Operation[] = allOps[0];
for (let i = 1; i < allOps.length; i++) {
  finalComposed = compose(finalComposed, allOps[i]);
}

console.log("🎯 组合所有操作:");
console.log(JSON.stringify(finalComposed, null, 2));

const directApply = apply(original, finalComposed);
console.log(`\n直接应用: "${directApply}"`);
console.log(`逐步应用: "${currentText}"`);
console.log(`结果相同: ${directApply === currentText ? "✅" : "❌"}`);

// ========== 示例 5：Normalize 在协同编辑中的作用 ==========
console.log("\n" + "=".repeat(60));
console.log("【示例 5】协同编辑：减少网络传输\n");

// 模拟用户快速输入
const rapidTyping: Operation[] = [];
const sentence = "Hello World";
for (const char of sentence) {
  rapidTyping.push(insert(char));
}

console.log("用户快速输入 'Hello World':");
console.log(`未优化: ${rapidTyping.length} 个操作`);
console.log(`传输大小: ${JSON.stringify(rapidTyping).length} 字节`);

const optimized = normalize(rapidTyping);
console.log(`\n优化后: ${optimized.length} 个操作`);
console.log(`传输大小: ${JSON.stringify(optimized).length} 字节`);

const saved =
  (1 - JSON.stringify(optimized).length / JSON.stringify(rapidTyping).length) *
  100;
console.log(`\n💾 节省带宽: ${saved.toFixed(1)}%`);
console.log(
  `📊 操作数减少: ${((1 - optimized.length / rapidTyping.length) * 100).toFixed(
    1
  )}%`
);

// ========== 示例 6：Compose 处理复杂交互 ==========
console.log("\n" + "=".repeat(60));
console.log("【示例 6】Compose 处理复杂的操作交互\n");

// 场景：用户先插入，然后在插入的内容中间删除
const baseText = "ABC";
console.log(`原始: "${baseText}"\n`);

const op1 = [retain(1), insert("XXXXX"), retain(2)]; // "ABC" → "AXXXXBC"
console.log("操作 1: 在 A 后插入 'XXXXX'");
const after1 = apply(baseText, op1);
console.log(`结果: "${after1}"`);

const op2 = [retain(3), deleteOp(3), retain(4)]; // 删除中间 3 个 X
console.log("\n操作 2: 删除中间 3 个 X");
const after2 = apply(after1, op2);
console.log(`结果: "${after2}"`);

const composed = compose(op1, op2);
console.log("\nCompose 结果:", JSON.stringify(composed));

const direct = apply(baseText, composed);
console.log(`直接应用到原始文本: "${direct}"`);
console.log(`结果正确: ${direct === after2 ? "✅" : "❌"}`);

console.log("\n💡 关键: Compose 正确处理了 ops2 对 ops1 插入内容的删除！");

// ========== 总结 ==========
console.log("\n" + "=".repeat(60));
console.log("📝 总结");
console.log("=".repeat(60));
console.log(`
1. Normalize 的作用:
   ✓ 合并相邻相同类型的操作
   ✓ 移除空操作和无效操作
   ✓ 大幅减少网络传输和存储
   ✓ 为协同编辑提供规范形式

2. Compose 的作用:
   ✓ 将多个操作序列组合成一个等价操作
   ✓ 正确处理插入、删除、保留的交互
   ✓ 为操作历史压缩提供基础
   ✓ 协同编辑的核心算法

3. 为什么复杂但必需:
   ✓ 保证数学正确性
   ✓ 处理所有边界情况
   ✓ 支持协同编辑
   ✓ 真实生产环境的实际需求
`);
