/**
 * Phase 2: 可视化 Demo 主文件
 */

import {
  apply,
  invert,
  compose,
  insert,
  deleteOp,
  retain,
  normalize,
} from "./operation";
import type { Operation } from "./types";
import { Delta, diff } from "./delta";
import { createDocument, createParagraph, createText, toHTML } from "./tree";

// ==================== Tab 切换 ====================

const tabs = document.querySelectorAll(".tab");
const demoSections = document.querySelectorAll(".demo-section");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const demoName = tab.getAttribute("data-demo");

    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    demoSections.forEach((section) => {
      section.classList.remove("active");
    });
    document.getElementById(`demo-${demoName}`)?.classList.add("active");
  });
});

// ==================== Demo 1: Apply ====================

const applyText = document.getElementById("apply-text") as HTMLInputElement;
const applyOps = document.getElementById("apply-ops") as HTMLTextAreaElement;
const applyResult = document.getElementById("apply-result")!;

document.getElementById("apply-run")?.addEventListener("click", () => {
  try {
    const text = applyText.value;
    const ops: Operation[] = JSON.parse(applyOps.value);
    const result = apply(text, ops);

    applyResult.innerHTML = `
      <div class="result-box">
        <h4>结果文本</h4>
        <div class="result-text">${escapeHtml(result)}</div>
      </div>
      <div class="result-box">
        <h4>操作详情</h4>
        <div class="operation-list">
          ${ops.map((op) => renderOperation(op)).join("")}
        </div>
      </div>
      <div class="result-box">
        <h4>执行过程</h4>
        <pre>${visualizeApply(text, ops)}</pre>
      </div>
    `;
  } catch (e) {
    applyResult.innerHTML = `
      <div class="result-box" style="background:#f8d7da;border-color:#721c24;">
        <h4 style="color:#721c24;">错误</h4>
        <pre>${escapeHtml(String(e))}</pre>
      </div>
    `;
  }
});

// 示例按钮
document.getElementById("apply-example1")?.addEventListener("click", () => {
  applyText.value = "Hello World";
  applyOps.value = JSON.stringify(
    [
      { type: "retain", length: 6 },
      { type: "insert", text: "Beautiful " },
    ],
    null,
    2
  );
});

document.getElementById("apply-example2")?.addEventListener("click", () => {
  applyText.value = "Hello Beautiful World";
  applyOps.value = JSON.stringify(
    [
      { type: "retain", length: 6 },
      { type: "delete", length: 10 },
    ],
    null,
    2
  );
});

document.getElementById("apply-example3")?.addEventListener("click", () => {
  applyText.value = "Hello World";
  applyOps.value = JSON.stringify(
    [
      { type: "retain", length: 6 },
      { type: "delete", length: 5 },
      { type: "insert", text: "TypeScript" },
    ],
    null,
    2
  );
});

// ==================== Demo 2: Invert ====================

const invertText = document.getElementById("invert-text") as HTMLInputElement;
const invertOps = document.getElementById("invert-ops") as HTMLTextAreaElement;
const invertResult = document.getElementById("invert-result")!;

document.getElementById("invert-run")?.addEventListener("click", () => {
  try {
    const text = invertText.value;
    const ops: Operation[] = JSON.parse(invertOps.value);
    const inverse = invert(ops, text);
    const modified = apply(text, ops);

    invertResult.innerHTML = `
      <div class="result-box">
        <h4>原始文本</h4>
        <div class="result-text">${escapeHtml(text)}</div>
      </div>
      <div class="result-box">
        <h4>应用操作后</h4>
        <div class="result-text">${escapeHtml(modified)}</div>
      </div>
      <div class="result-box">
        <h4>反向操作</h4>
        <div class="operation-list">
          ${inverse.map((op) => renderOperation(op)).join("")}
        </div>
        <pre style="margin-top:10px;">${JSON.stringify(inverse, null, 2)}</pre>
      </div>
    `;
  } catch (e) {
    invertResult.innerHTML = `
      <div class="result-box" style="background:#f8d7da;border-color:#721c24;">
        <h4 style="color:#721c24;">错误</h4>
        <pre>${escapeHtml(String(e))}</pre>
      </div>
    `;
  }
});

document.getElementById("invert-verify")?.addEventListener("click", () => {
  try {
    const text = invertText.value;
    const ops: Operation[] = JSON.parse(invertOps.value);
    const inverse = invert(ops, text);

    const modified = apply(text, ops);
    const reverted = apply(modified, inverse);

    const success = reverted === text;

    invertResult.innerHTML = `
      <div class="result-box" style="background:${
        success ? "#d4edda" : "#f8d7da"
      };border-color:${success ? "#155724" : "#721c24"};">
        <h4 style="color:${success ? "#155724" : "#721c24"};">
          ${success ? "✓ 验证成功" : "✗ 验证失败"}
        </h4>
        <div style="margin-top:10px;">
          <strong>原始文本：</strong><code>${escapeHtml(text)}</code><br>
          <strong>应用操作后：</strong><code>${escapeHtml(modified)}</code><br>
          <strong>应用反向操作后：</strong><code>${escapeHtml(
            reverted
          )}</code><br>
          <br>
          ${success ? "反向操作成功撤销了原操作！" : "反向操作未能正确撤销！"}
        </div>
      </div>
    `;
  } catch (e) {
    invertResult.innerHTML = `
      <div class="result-box" style="background:#f8d7da;border-color:#721c24;">
        <h4 style="color:#721c24;">错误</h4>
        <pre>${escapeHtml(String(e))}</pre>
      </div>
    `;
  }
});

// ==================== Demo 3: Compose ====================

const composeText = document.getElementById("compose-text") as HTMLInputElement;
const composeOpsA = document.getElementById(
  "compose-ops-a"
) as HTMLTextAreaElement;
const composeOpsB = document.getElementById(
  "compose-ops-b"
) as HTMLTextAreaElement;
const composeResult = document.getElementById("compose-result")!;

document.getElementById("compose-run")?.addEventListener("click", () => {
  try {
    const text = composeText.value;
    const opsA: Operation[] = JSON.parse(composeOpsA.value);
    const opsB: Operation[] = JSON.parse(composeOpsB.value);
    const composed = compose(opsA, opsB);

    composeResult.innerHTML = `
      <div class="result-box">
        <h4>组合后的操作</h4>
        <div class="operation-list">
          ${composed.map((op) => renderOperation(op)).join("")}
        </div>
        <pre style="margin-top:10px;">${JSON.stringify(composed, null, 2)}</pre>
      </div>
      <div class="result-box">
        <h4>操作说明</h4>
        <div style="color:#666;">
          <p>组合操作 <code>compose(A, B)</code> 的效果等同于：</p>
          <ol style="margin-left:20px; margin-top:10px;">
            <li>先应用操作 A</li>
            <li>再应用操作 B</li>
          </ol>
          <p style="margin-top:10px;">这样可以将多个操作合并为一个，用于压缩历史记录。</p>
        </div>
      </div>
    `;
  } catch (e) {
    composeResult.innerHTML = `
      <div class="result-box" style="background:#f8d7da;border-color:#721c24;">
        <h4 style="color:#721c24;">错误</h4>
        <pre>${escapeHtml(String(e))}</pre>
      </div>
    `;
  }
});

document.getElementById("compose-verify")?.addEventListener("click", () => {
  try {
    const text = composeText.value;
    const opsA: Operation[] = JSON.parse(composeOpsA.value);
    const opsB: Operation[] = JSON.parse(composeOpsB.value);
    const composed = compose(opsA, opsB);

    // 方法1：依次应用
    const result1 = apply(apply(text, opsA), opsB);

    // 方法2：先组合再应用
    const result2 = apply(text, composed);

    const success = result1 === result2;

    composeResult.innerHTML = `
      <div class="result-box" style="background:${
        success ? "#d4edda" : "#f8d7da"
      };border-color:${success ? "#155724" : "#721c24"};">
        <h4 style="color:${success ? "#155724" : "#721c24"};">
          ${success ? "✓ 验证成功" : "✗ 验证失败"}
        </h4>
        <div style="margin-top:10px;">
          <strong>原始文本：</strong><code>${escapeHtml(text)}</code><br>
          <strong>方法1（依次应用 A→B）：</strong><code>${escapeHtml(
            result1
          )}</code><br>
          <strong>方法2（应用组合操作）：</strong><code>${escapeHtml(
            result2
          )}</code><br>
          <br>
          ${
            success
              ? "两种方法的结果一致，组合操作正确！"
              : "两种方法的结果不一致！"
          }
        </div>
      </div>
    `;
  } catch (e) {
    composeResult.innerHTML = `
      <div class="result-box" style="background:#f8d7da;border-color:#721c24;">
        <h4 style="color:#721c24;">错误</h4>
        <pre>${escapeHtml(String(e))}</pre>
      </div>
    `;
  }
});

// ==================== Demo 4: 数据模型对比 ====================

const modelsText = document.getElementById(
  "models-text"
) as HTMLTextAreaElement;
const modelsResult = document.getElementById("models-result")!;
const modelsDelta = document.getElementById("models-delta")!;
const modelsTree = document.getElementById("models-tree")!;

document.getElementById("models-show")?.addEventListener("click", () => {
  try {
    const text = modelsText.value;
    const lines = text.split("\n");

    // Delta 模型
    const deltaOps: Operation[] = [];
    for (const line of lines) {
      deltaOps.push(insert(line));
      deltaOps.push(insert("\n"));
    }
    const deltaModel = { ops: normalize(deltaOps) };

    // 树形模型
    const treeModel = createDocument(
      lines.map((line) => createParagraph([createText(line)]))
    );

    modelsDelta.textContent = JSON.stringify(deltaModel, null, 2);
    modelsTree.textContent = JSON.stringify(treeModel, null, 2);

    modelsResult.style.display = "grid";
  } catch (e) {
    alert("错误：" + e);
  }
});

// ==================== Demo 5: 可视化流程 ====================

const visualText = document.getElementById("visual-text") as HTMLInputElement;
const visualOps = document.getElementById("visual-ops") as HTMLTextAreaElement;
const visualResult = document.getElementById("visual-result")!;

document.getElementById("visual-run")?.addEventListener("click", () => {
  try {
    const text = visualText.value;
    const ops: Operation[] = JSON.parse(visualOps.value);

    const steps: string[] = [];
    let currentText = text;
    let textIndex = 0;

    steps.push(renderStep("初始状态", currentText, -1));

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];

      if (op.type === "insert") {
        const before = currentText.substring(0, textIndex);
        const after = currentText.substring(textIndex);
        currentText = before + op.text + after;
        steps.push(
          renderStep(
            `操作 ${i + 1}: 插入 "${op.text}"`,
            currentText,
            textIndex,
            op.text.length
          )
        );
      } else if (op.type === "delete") {
        const before = currentText.substring(0, textIndex);
        const deleted = currentText.substring(textIndex, textIndex + op.length);
        const after = currentText.substring(textIndex + op.length);
        currentText = before + after;
        steps.push(
          renderStep(`操作 ${i + 1}: 删除 "${deleted}"`, currentText, textIndex)
        );
      } else if (op.type === "retain") {
        textIndex += op.length;
        steps.push(
          renderStep(
            `操作 ${i + 1}: 保留 ${op.length} 个字符`,
            currentText,
            textIndex
          )
        );
      }
    }

    visualResult.innerHTML = `
      <div class="step-container">
        ${steps.join("")}
      </div>
    `;
  } catch (e) {
    visualResult.innerHTML = `
      <div class="result-box" style="background:#f8d7da;border-color:#721c24;">
        <h4 style="color:#721c24;">错误</h4>
        <pre>${escapeHtml(String(e))}</pre>
      </div>
    `;
  }
});

// ==================== 辅助函数 ====================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderOperation(op: Operation): string {
  if (op.type === "insert") {
    return `
      <div class="operation-item">
        <span class="op-type op-insert">INSERT</span>
        <span class="op-details">插入: "${escapeHtml(op.text)}"</span>
      </div>
    `;
  } else if (op.type === "delete") {
    return `
      <div class="operation-item">
        <span class="op-type op-delete">DELETE</span>
        <span class="op-details">删除: ${op.length} 个字符</span>
      </div>
    `;
  } else {
    return `
      <div class="operation-item">
        <span class="op-type op-retain">RETAIN</span>
        <span class="op-details">保留: ${op.length} 个字符</span>
      </div>
    `;
  }
}

function visualizeApply(text: string, ops: Operation[]): string {
  let result = `原始文本: "${text}"\n\n`;
  let currentText = text;
  let currentIndex = 0;

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    result += `步骤 ${i + 1}: ${JSON.stringify(op)}\n`;

    if (op.type === "insert") {
      result += `  → 在位置 ${currentIndex} 插入 "${op.text}"\n`;
      currentText =
        currentText.substring(0, currentIndex) +
        op.text +
        currentText.substring(currentIndex);
    } else if (op.type === "delete") {
      const deleted = currentText.substring(
        currentIndex,
        currentIndex + op.length
      );
      result += `  → 从位置 ${currentIndex} 删除 "${deleted}"\n`;
      currentText =
        currentText.substring(0, currentIndex) +
        currentText.substring(currentIndex + op.length);
    } else {
      result += `  → 跳过 ${op.length} 个字符（位置 ${currentIndex} → ${
        currentIndex + op.length
      }）\n`;
      currentIndex += op.length;
    }

    result += `  文本: "${currentText}"\n\n`;
  }

  result += `最终结果: "${currentText}"`;
  return result;
}

function renderStep(
  title: string,
  text: string,
  highlightStart: number,
  highlightLength = 0
): string {
  let displayText = text;

  if (highlightStart >= 0 && highlightLength > 0) {
    const before = text.substring(0, highlightStart);
    const highlight = text.substring(
      highlightStart,
      highlightStart + highlightLength
    );
    const after = text.substring(highlightStart + highlightLength);
    displayText = `${escapeHtml(
      before
    )}<span style="background:#ffd700;padding:2px 4px;border-radius:3px;">${escapeHtml(
      highlight
    )}</span>${escapeHtml(after)}`;
  } else if (highlightStart >= 0) {
    const before = text.substring(0, highlightStart);
    const after = text.substring(highlightStart);
    displayText = `${escapeHtml(
      before
    )}<span style="border-left:2px solid #667eea;padding-left:2px;">|</span>${escapeHtml(
      after
    )}`;
  } else {
    displayText = escapeHtml(text);
  }

  return `
    <div class="step">
      <div class="step-title">${title}</div>
      <div class="step-content" style="font-size:16px;margin-top:5px;">"${displayText}"</div>
    </div>
  `;
}

// ==================== 控制台输出 ====================

console.log(
  "%c🎯 Phase 2: 文档数据结构与操作",
  "color: #667eea; font-size: 20px; font-weight: bold;"
);
console.log(
  "%c学习要点：",
  "color: #764ba2; font-size: 16px; font-weight: bold;"
);
console.log("1. Operation 模型 - insert/delete/retain 三种基本操作");
console.log("2. apply() - 将操作应用到文本");
console.log("3. invert() - 生成反向操作（撤销）");
console.log("4. compose() - 组合多个操作");
console.log("5. 扁平化 vs 树形结构的对比");
console.log("");
console.log("%c💡 尝试这些操作：", "color: #667eea; font-size: 14px;");
console.log("• Demo 1: 体验 apply 操作的执行过程");
console.log("• Demo 2: 理解 invert 如何实现撤销");
console.log("• Demo 3: 看 compose 如何压缩操作历史");
console.log("• Demo 4: 对比两种数据模型的差异");
console.log("• Demo 5: 可视化观察每一步的变化");
console.log("");
console.log("%c📚 下一步：", "color: #764ba2; font-size: 14px;");
console.log("运行测试：pnpm test");
console.log("阅读文档：packages/02-.../docs/");
