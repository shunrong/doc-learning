# 文档协同编辑技术 - 渐进式学习项目

> 系统学习在线文档协同编辑技术的深水区知识

## 📚 项目概述

这是一个**项目驱动的渐进式学习路线**，通过 6 个独立但递进的项目，系统掌握文档协同编辑的核心技术。

### 核心技术栈
- 富文本编辑器（Quill、Slate、Tiptap）
- 文档数据结构（Delta、树形结构）
- 协同算法（OT、CRDT）
- 实时通信（WebSocket、WebRTC）
- React 18 + TypeScript

## 🎯 学习路线图

```
Phase 1: 富文本编辑器基础 (1周)
    ↓ 掌握编辑器核心API和数据结构
Phase 2: 文档数据结构与操作 (1.5周)
    ↓ 理解 Operation 和 Delta 概念
Phase 3: 历史记录与撤销重做 (1周)
    ↓ 掌握单机版本的状态管理
Phase 4: 实时通信基础设施 (0.5周)
    ↓ 搭建 WebSocket 协同架构
Phase 5: 协同编辑引擎 - OT 方案 (2周) ⭐️
    ↓ 理解冲突解决的经典方案
Phase 6: 现代协同方案 - CRDT (1周) ⭐️
    ↓ 掌握业界主流的实现
```

**总计：核心路径 6-7 周**

## 📦 项目结构

```
doc-learning/
├── packages/
│   ├── 01-rich-text-editor-foundation/    # Phase 1: 纯 JS + Vite
│   ├── 02-document-model-operations/      # Phase 2: TS + 算法
│   ├── 03-history-undo-redo/              # Phase 3: TS + React
│   ├── 04-realtime-infrastructure/        # Phase 4: Monorepo 前后端
│   ├── 05-collaborative-ot-engine/        # Phase 5: OT 协同
│   └── 06-collaborative-crdt-yjs/         # Phase 6: CRDT 协同
├── docs/                                   # 全局文档
│   ├── learning-roadmap.md                # 学习路线详解
│   ├── tech-comparison.md                 # 技术方案对比
│   └── resources.md                       # 学习资源汇总
├── package.json                           # 根配置
└── pnpm-workspace.yaml                    # Workspace 配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8

### 安装依赖
```bash
pnpm install
```

### 运行项目

#### 运行 Phase 1（当前阶段）
```bash
pnpm dev:phase1
```

#### 运行所有项目
```bash
pnpm dev
```

#### 运行指定阶段
```bash
pnpm dev:phase2  # Phase 2
pnpm dev:phase3  # Phase 3
# ... 以此类推
```

## 📖 各阶段详情

### Phase 1: 富文本编辑器基础
**技术栈：** 纯 JavaScript + Vite + Quill.js  
**学习目标：**
- ✅ 理解 ContentEditable 和 Selection API
- ✅ 掌握富文本数据结构（Delta 格式）
- ✅ 实现基本的格式化功能

**核心文件：**
- `packages/01-rich-text-editor-foundation/src/editor.js` - 编辑器核心
- `packages/01-rich-text-editor-foundation/docs/` - 理论文档

### Phase 2: 文档数据结构与操作
**技术栈：** TypeScript + Vitest  
**学习目标：**
- ✅ 深入理解 Operation（操作）的概念
- ✅ 实现操作的 apply、invert、compose
- ✅ 对比扁平化 vs 树形结构

### Phase 3: 历史记录与撤销重做
**技术栈：** TypeScript + React + Immer  
**学习目标：**
- ✅ 实现单用户的撤销重做栈
- ✅ 历史快照和时间旅行
- ✅ 本地持久化（IndexedDB）

### Phase 4: 实时通信基础设施
**技术栈：** TypeScript + React + Node.js + WebSocket  
**学习目标：**
- ✅ 搭建 WebSocket 实时通信架构
- ✅ 房间管理和用户在线状态
- ✅ 远程光标显示

### Phase 5: 协同编辑引擎（OT 方案）⭐️
**技术栈：** TypeScript + React + Node.js + 自实现 OT  
**学习目标：**
- ✅ 理解 OT 算法的核心思想
- ✅ 实现 Transform 函数
- ✅ 掌握中心化协同架构

### Phase 6: 现代协同方案（CRDT）⭐️
**技术栈：** TypeScript + React + Yjs + Tiptap  
**学习目标：**
- ✅ 理解 CRDT 的核心思想
- ✅ 使用 Yjs 实现生产级协同
- ✅ 支持离线编辑和 P2P 协同

## 🎓 学习方法

### 每个项目的标准流程

1. **理论先行**（1-2天）
   - 阅读 `docs/` 目录下的理论文档
   - 理解核心概念和设计原理

2. **最小实现**（2-3天）
   - 实现核心功能
   - 不追求完美，能跑通即可

3. **实践验证**（1-2天）
   - 写测试用例
   - 验证各种场景

4. **文档同步**（1天）
   - 补充实现文档
   - 记录踩坑经验

### 推荐的学习路径

#### 🏃 快速路径（3周）
适合面试/工作需要
```
Phase 1 → Phase 4 → Phase 6
```

#### 🚶 完整路径（6-7周）
适合深度学习
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
```

#### ⭐️ 平衡路径（5周）
推荐方案
```
Phase 1 → Phase 2 → Phase 4 → Phase 6 → Phase 5（回头补）
```

## 📚 学习资源

### 开源项目
- [Yjs](https://github.com/yjs/yjs) - 最流行的 CRDT 实现
- [Quill](https://github.com/quilljs/quill) - 简单优雅的编辑器
- [Slate](https://github.com/ianstormtaylor/slate) - 可定制性强
- [ProseMirror](https://github.com/ProseMirror/prosemirror) - 架构设计优秀
- [Tiptap](https://github.com/ueberdosis/tiptap) - 基于 ProseMirror

### 推荐文章
- [OT 算法原理](https://operational-transformation.github.io/)
- [CRDT 综述](https://crdt.tech/)
- 飞书文档协同编辑实践

### 论文阅读（可选）
- Ellis & Gibbs (1989) - OT 经典论文
- Yjs YATA 算法论文

## 🛠 技术栈对比

| 阶段 | JS/TS | 框架 | 工程化 | 测试 |
|------|-------|------|--------|------|
| Phase 1 | **JS** | 无 | Vite | 无 |
| Phase 2 | **TS** | 无 | Vite | ✅ Vitest |
| Phase 3 | **TS** | React | Vite | ✅ Vitest |
| Phase 4 | **TS** | React + Node | Monorepo | ✅ Vitest |
| Phase 5 | **TS** | React + Node | 完整 | ✅ 完整 |
| Phase 6 | **TS** | React + Yjs | 完整 | ✅ 完整 |

## 🤝 贡献指南

这是一个个人学习项目，欢迎：
- 提出改进建议
- 分享学习心得
- 补充文档和示例

## 📝 License

MIT

---

**开始学习：** 进入 `packages/01-rich-text-editor-foundation` 开始 Phase 1 🚀

