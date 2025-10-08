/**
 * Phase 2: 文档数据结构与操作 - 类型定义
 *
 * 核心概念：
 * - Operation: 对文档的原子操作（插入、删除、保留）
 * - Document: 文档的抽象表示
 * - Position: 文档中的位置
 */

// ==================== 基础类型 ====================

/**
 * 文档中的位置（从 0 开始的偏移量）
 */
export type Position = number;

/**
 * 文本属性（格式化信息）
 */
export interface Attributes {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontFamily?: string;
  link?: string;
  [key: string]: any;
}

// ==================== Operation 类型 ====================

/**
 * 插入操作
 * 在当前位置插入文本
 */
export interface InsertOp {
  type: "insert";
  text: string;
  attributes?: Attributes;
}

/**
 * 删除操作
 * 删除指定数量的字符
 */
export interface DeleteOp {
  type: "delete";
  length: number;
}

/**
 * 保留操作
 * 保留（跳过）指定数量的字符，可选地应用或移除属性
 */
export interface RetainOp {
  type: "retain";
  length: number;
  attributes?: Attributes;
}

/**
 * Operation - 对文档的单个操作
 */
export type Operation = InsertOp | DeleteOp | RetainOp;

// ==================== 扁平化数据模型（Delta 风格）====================

/**
 * Delta - 一系列操作的集合
 * 可以描述文档内容，也可以描述变更
 */
export interface Delta {
  ops: Operation[];
}

// ==================== 树形数据模型（Slate 风格）====================

/**
 * 文本节点
 */
export interface TextNode {
  type: "text";
  text: string;
  // 格式标记
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  [key: string]: any;
}

/**
 * 段落节点
 */
export interface ParagraphNode {
  type: "paragraph";
  children: (TextNode | InlineNode)[];
}

/**
 * 标题节点
 */
export interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: (TextNode | InlineNode)[];
}

/**
 * 行内节点（链接等）
 */
export interface InlineNode {
  type: "link" | "mention" | "inline-code";
  children: TextNode[];
  [key: string]: any;
}

/**
 * 块级节点
 */
export type BlockNode = ParagraphNode | HeadingNode;

/**
 * 文档根节点
 */
export interface DocumentNode {
  type: "document";
  children: BlockNode[];
}

/**
 * 任意节点
 */
export type Node = DocumentNode | BlockNode | TextNode | InlineNode;

// ==================== 路径（用于树形结构定位）====================

/**
 * 路径 - 用于在树形结构中定位节点
 * 例如：[0, 1] 表示第一个块级节点的第二个子节点
 */
export type Path = number[];

/**
 * 点 - 树形结构中的精确位置
 */
export interface Point {
  path: Path;
  offset: number;
}

/**
 * 范围 - 树形结构中的一段区域
 */
export interface Range {
  anchor: Point;
  focus: Point;
}

// ==================== 操作结果 ====================

/**
 * 操作应用的结果
 */
export interface ApplyResult {
  success: boolean;
  error?: string;
  newContent?: string;
}

/**
 * 操作组合的结果
 */
export interface ComposeResult {
  operations: Operation[];
}
