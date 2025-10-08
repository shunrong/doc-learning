/**
 * Phase 2: 树形数据模型（Slate 风格）
 *
 * 树形结构适合表示复杂的文档结构
 * 特点：灵活、强大、适合嵌套内容
 */

import type {
  Node,
  DocumentNode,
  BlockNode,
  TextNode,
  ParagraphNode,
  HeadingNode,
  Path,
  Point,
  Range,
} from "./types";

// ==================== 节点创建函数 ====================

/**
 * 创建文档节点
 */
export function createDocument(children: BlockNode[] = []): DocumentNode {
  return {
    type: "document",
    children,
  };
}

/**
 * 创建段落节点
 */
export function createParagraph(children: TextNode[] = []): ParagraphNode {
  return {
    type: "paragraph",
    children: children.length > 0 ? children : [createText("")],
  };
}

/**
 * 创建标题节点
 */
export function createHeading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  children: TextNode[] = []
): HeadingNode {
  return {
    type: "heading",
    level,
    children: children.length > 0 ? children : [createText("")],
  };
}

/**
 * 创建文本节点
 */
export function createText(
  text: string,
  props: Partial<TextNode> = {}
): TextNode {
  return {
    type: "text",
    text,
    ...props,
  };
}

// ==================== 路径操作 ====================

/**
 * 比较两个路径
 */
export function comparePath(path1: Path, path2: Path): number {
  const minLength = Math.min(path1.length, path2.length);

  for (let i = 0; i < minLength; i++) {
    if (path1[i] < path2[i]) return -1;
    if (path1[i] > path2[i]) return 1;
  }

  return path1.length - path2.length;
}

/**
 * 判断 path1 是否是 path2 的祖先
 */
export function isAncestor(path1: Path, path2: Path): boolean {
  if (path1.length >= path2.length) return false;

  for (let i = 0; i < path1.length; i++) {
    if (path1[i] !== path2[i]) return false;
  }

  return true;
}

/**
 * 获取父路径
 */
export function getParentPath(path: Path): Path | null {
  if (path.length === 0) return null;
  return path.slice(0, -1);
}

// ==================== 节点遍历 ====================

/**
 * 通过路径获取节点
 */
export function getNode(root: Node, path: Path): Node | null {
  let current: Node = root;

  for (const index of path) {
    if (!("children" in current) || !current.children) {
      return null;
    }

    if (index < 0 || index >= current.children.length) {
      return null;
    }

    current = current.children[index] as Node;
  }

  return current;
}

/**
 * 设置节点
 */
export function setNode(root: Node, path: Path, node: Node): Node {
  if (path.length === 0) {
    return node;
  }

  const [index, ...rest] = path;

  if (!("children" in root) || !root.children) {
    throw new Error("Cannot set node: parent is not a container");
  }

  const newChildren = [...root.children];

  if (rest.length === 0) {
    newChildren[index] = node as any;
  } else {
    newChildren[index] = setNode(newChildren[index] as Node, rest, node) as any;
  }

  return {
    ...root,
    children: newChildren,
  };
}

/**
 * 插入节点
 */
export function insertNode(root: Node, path: Path, node: Node): Node {
  if (path.length === 0) {
    throw new Error("Cannot insert at root");
  }

  const parentPath = getParentPath(path)!;
  const index = path[path.length - 1];
  const parent = getNode(root, parentPath);

  if (!parent || !("children" in parent) || !parent.children) {
    throw new Error("Parent is not a container");
  }

  const newChildren = [...parent.children];
  newChildren.splice(index, 0, node as any);

  const newParent = {
    ...parent,
    children: newChildren,
  };

  return setNode(root, parentPath, newParent);
}

/**
 * 删除节点
 */
export function removeNode(root: Node, path: Path): Node {
  if (path.length === 0) {
    throw new Error("Cannot remove root");
  }

  const parentPath = getParentPath(path)!;
  const index = path[path.length - 1];
  const parent = getNode(root, parentPath);

  if (!parent || !("children" in parent) || !parent.children) {
    throw new Error("Parent is not a container");
  }

  const newChildren = [...parent.children];
  newChildren.splice(index, 1);

  const newParent = {
    ...parent,
    children: newChildren,
  };

  return setNode(root, parentPath, newParent);
}

// ==================== 文本操作 ====================

/**
 * 获取节点的文本内容
 */
export function getText(node: Node): string {
  if (node.type === "text") {
    return node.text;
  }

  if ("children" in node && node.children) {
    return node.children.map((child) => getText(child as Node)).join("");
  }

  return "";
}

/**
 * 在指定位置插入文本
 */
export function insertText(root: Node, point: Point, text: string): Node {
  const node = getNode(root, point.path);

  if (!node || node.type !== "text") {
    throw new Error("Target node is not a text node");
  }

  const newText =
    node.text.slice(0, point.offset) + text + node.text.slice(point.offset);
  const newNode = { ...node, text: newText };

  return setNode(root, point.path, newNode);
}

/**
 * 删除文本
 */
export function deleteText(root: Node, range: Range): Node {
  // 简化实现：假设 range 在同一个文本节点内
  if (JSON.stringify(range.anchor.path) !== JSON.stringify(range.focus.path)) {
    throw new Error("Cross-node deletion not implemented");
  }

  const node = getNode(root, range.anchor.path);

  if (!node || node.type !== "text") {
    throw new Error("Target node is not a text node");
  }

  const start = Math.min(range.anchor.offset, range.focus.offset);
  const end = Math.max(range.anchor.offset, range.focus.offset);

  const newText = node.text.slice(0, start) + node.text.slice(end);
  const newNode = { ...node, text: newText };

  return setNode(root, range.anchor.path, newNode);
}

// ==================== 格式化操作 ====================

/**
 * 应用格式到文本节点
 */
export function applyFormat(
  root: Node,
  path: Path,
  format: Partial<TextNode>
): Node {
  const node = getNode(root, path);

  if (!node || node.type !== "text") {
    throw new Error("Target node is not a text node");
  }

  const newNode = { ...node, ...format };
  return setNode(root, path, newNode);
}

// ==================== 示例 ====================

/**
 * 树形模型示例
 */
export function example() {
  console.log("\n=== 树形模型示例 ===\n");

  // 1. 创建文档
  let doc: DocumentNode = createDocument([
    createParagraph([
      createText("Hello "),
      createText("World", { bold: true }),
    ]),
  ]);

  console.log("1. 初始文档:");
  console.log(JSON.stringify(doc, null, 2));

  // 2. 插入文本
  doc = insertText(
    doc,
    { path: [0, 0], offset: 6 },
    "Beautiful "
  ) as DocumentNode;
  console.log("\n2. 插入文本后:");
  console.log("文本内容:", getText(doc));

  // 3. 删除文本
  doc = deleteText(doc, {
    anchor: { path: [0, 0], offset: 6 },
    focus: { path: [0, 0], offset: 16 },
  }) as DocumentNode;
  console.log("\n3. 删除文本后:");
  console.log("文本内容:", getText(doc));

  // 4. 添加段落
  doc = insertNode(
    doc,
    [1],
    createParagraph([createText("This is a new paragraph.")])
  ) as DocumentNode;
  console.log("\n4. 添加段落后:");
  console.log("文本内容:", getText(doc));

  // 5. 应用格式
  doc = applyFormat(doc, [0, 0], { italic: true }) as DocumentNode;
  console.log("\n5. 应用格式后:");
  console.log(JSON.stringify(doc.children[0], null, 2));
}

// ==================== 与 Delta 的对比 ====================

/**
 * 将树形结构转换为纯文本（用于与 Delta 对比）
 */
export function toPlainText(node: Node): string {
  return getText(node);
}

/**
 * 从树形结构生成 HTML
 */
export function toHTML(node: Node): string {
  if (node.type === "text") {
    let html = node.text;
    if (node.bold) html = `<strong>${html}</strong>`;
    if (node.italic) html = `<em>${html}</em>`;
    if (node.underline) html = `<u>${html}</u>`;
    return html;
  }

  if (node.type === "paragraph") {
    const content = node.children
      .map((child) => toHTML(child as Node))
      .join("");
    return `<p>${content}</p>`;
  }

  if (node.type === "heading") {
    const content = node.children
      .map((child) => toHTML(child as Node))
      .join("");
    return `<h${node.level}>${content}</h${node.level}>`;
  }

  if (node.type === "document") {
    return node.children.map((child) => toHTML(child as Node)).join("");
  }

  return "";
}
