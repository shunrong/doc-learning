# 🚀 快速开始

欢迎来到文档协同编辑技术学习项目！这份指南将帮助你快速上手。

## 📋 前置要求

- Node.js >= 18
- pnpm >= 8（推荐）或 npm/yarn

## 🎯 5分钟快速体验

### 1. 安装依赖
```bash
cd /Users/lime/Learning/doc-learning
pnpm install
```

### 2. 启动 Phase 1 项目
```bash
pnpm dev:phase1
```

### 3. 打开浏览器
访问 http://localhost:5173

你将看到 4 个交互式 Demo：
- **Demo 1**: Quill 编辑器基础
- **Demo 2**: 自定义编辑器
- **Demo 3**: Selection API 演示
- **Demo 4**: Delta 数据结构解析

### 4. 开始探索
- 在编辑器中输入文本
- 尝试格式化按钮
- 选择文本观察 Selection 信息
- 查看 Delta 数据结构的实时变化

## 📚 学习路径

### 路径 1：快速了解（今天）
```bash
# 只运行 Demo，理解核心概念
pnpm dev:phase1
```

阅读：
- `packages/01-rich-text-editor-foundation/README.md`
- `packages/01-rich-text-editor-foundation/docs/01-contenteditable-api.md`

**耗时：2-3小时**

---

### 路径 2：深入学习（1周）
**Day 1-2: 理论学习**
```bash
pnpm dev:phase1
```

阅读所有 `packages/01-rich-text-editor-foundation/docs/` 下的文档：
- ✅ ContentEditable API
- ✅ Selection/Range API
- ✅ Delta 数据结构
- ✅ 实现思路

**Day 3-4: 动手实践**
- 修改 `src/main.js`，添加新功能
- 尝试实现一个最小化编辑器
- 处理边界情况

**Day 5-7: 总结提升**
- 整理学习笔记
- 对比不同编辑器实现
- 思考协同编辑需求

**耗时：1周**

---

### 路径 3：完整学习（6-7周）
按照学习路线图依次完成所有 Phase：

```bash
# 当前：Phase 1（1周）
pnpm dev:phase1

# 未来：Phase 2-6（陆续开发）
pnpm dev:phase2
pnpm dev:phase3
pnpm dev:phase4
pnpm dev:phase5
pnpm dev:phase6
```

详细规划见：`docs/learning-roadmap.md`

## 📖 文档导航

### 项目文档
- [README.md](./README.md) - 项目总览
- [GETTING_STARTED.md](./GETTING_STARTED.md) - 本文档
- [docs/learning-roadmap.md](./docs/learning-roadmap.md) - 详细学习路线
- [docs/tech-comparison.md](./docs/tech-comparison.md) - 技术方案对比
- [docs/resources.md](./docs/resources.md) - 学习资源汇总

### Phase 1 文档
- [Phase 1 README](./packages/01-rich-text-editor-foundation/README.md) - 阶段总览
- [理论文档目录](./packages/01-rich-text-editor-foundation/docs/)
  - ContentEditable API 详解
  - Selection 和 Range API
  - Delta 数据结构设计原理
  - 实现思路和最佳实践

## 🎓 学习建议

### 第一次学习？
1. **先运行 Demo**（30分钟）
   - 不要急于看代码
   - 体验各种功能
   - 观察数据变化

2. **再看理论**（2小时）
   - 从 `01-contenteditable-api.md` 开始
   - 按顺序阅读文档
   - 不理解的地方做标记

3. **然后看代码**（1小时）
   - 阅读 `src/main.js`
   - 理解实现逻辑
   - 对照文档理解

4. **最后动手改**（2-3小时）
   - 修改现有功能
   - 添加新功能
   - 解决遇到的问题

### 已经有基础？
直接跳到：
- [技术方案对比](./docs/tech-comparison.md) - 了解全景
- [学习路线图](./docs/learning-roadmap.md) - 规划学习
- 选择适合的学习路径

## 💡 常见问题

### Q: Phase 2-6 什么时候发布？
A: 当前只实现了 Phase 1。后续阶段会陆续开发。你可以：
- 先深入学习 Phase 1
- 参考 `docs/learning-roadmap.md` 自己探索
- 关注项目更新

### Q: 我应该选择哪条学习路径？
A: 建议：
- **面试准备** → 路径 1（快速了解）+ 阅读对比文档
- **工作需要** → 路径 2（深入学习 Phase 1）+ 直接用 Yjs
- **技术提升** → 路径 3（完整学习所有 Phase）

### Q: 我对音视频/低代码有经验，有什么优势吗？
A: 很大的优势！
- **音视频经验** → Phase 4 的 WebSocket 架构几乎一样
- **低代码经验** → Phase 2 的数据结构和组件树类似
- **状态管理** → 你的 React 经验很有帮助

### Q: 编辑器框架这么多，我该学哪个？
A: 建议：
- **快速开发** → Quill（Phase 1 使用）
- **高度定制** → Slate（后续会涉及）
- **协同编辑** → Tiptap + Yjs（Phase 6）
- **全面了解** → 都学一点，重点理解原理

详见：`docs/tech-comparison.md`

### Q: 我能直接跳到协同编辑吗？
A: 不建议。协同编辑建立在：
- 编辑器基础（Phase 1）✅ 必须
- 数据结构（Phase 2）✅ 必须
- 实时通信（Phase 4）✅ 必须
- 协同算法（Phase 5-6）✅ 核心

但如果只是想快速使用，可以直接用 Yjs + Tiptap。

### Q: 学完能找到工作吗？
A: 这是很好的技术积累，但：
- ✅ 面试加分项（尤其是协同编辑岗位）
- ✅ 展示技术深度
- ✅ 开源项目经验
- ❌ 不是必备技能（大多数前端不需要）

建议结合其他技能一起学习。

## 🛠 开发命令

```bash
# 安装依赖
pnpm install

# 运行 Phase 1
pnpm dev:phase1

# 运行指定 Phase（未来）
pnpm dev:phase2
pnpm dev:phase3
# ...

# 运行所有项目
pnpm dev

# 清理所有依赖
pnpm clean

# 运行测试（Phase 2 开始有）
pnpm test
```

## 🎉 下一步

### 立即行动：
1. ✅ 运行 `pnpm dev:phase1`
2. ✅ 体验 4 个 Demo
3. ✅ 阅读 Phase 1 的 README
4. ✅ 选择一条学习路径

### 深入学习：
1. 📚 阅读理论文档
2. 💻 修改代码实验
3. 📝 做学习笔记
4. 🤔 思考协同编辑

### 持续成长：
1. 🌟 关注项目更新（Phase 2-6）
2. 🔗 查看学习资源（`docs/resources.md`）
3. 💬 加入开发者社区
4. 🚀 实现自己的编辑器

---

**准备好了吗？开始学习吧！** 🎓

有问题随时查看文档或搜索相关资源。祝你学习愉快！

