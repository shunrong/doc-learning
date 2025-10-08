# Phase 4: CRDT - 快速开始指南

## 🚀 快速体验

### 1. 运行所有测试

```bash
cd packages/04-crdt-fundamentals
pnpm test
```

你将看到：
- ✅ 14 个 G-Counter 测试通过
- ✅ 11 个 PN-Counter 测试通过
- ✅ 19 个 RGA 测试通过

**总计：44 个测试全部通过！**

### 2. 运行命令行 Demo

```bash
pnpm demo
```

你将看到 6 个 Demo：
1. **G-Counter**：只增计数器的基本操作和合并
2. **PN-Counter**：可增可减计数器
3. **RGA 基础**：文本编辑的插入和删除
4. **RGA 并发**：两个用户同时编辑的场景
5. **RGA 多用户**：三个用户同时编辑并收敛
6. **RGA 离线**：离线编辑后同步的场景

### 3. 启动交互式网页 Demo

```bash
pnpm dev
```

然后打开浏览器访问 `http://localhost:5176`

你将看到：
- 3 个并行的编辑器（Alice、Bob、Charlie）
- 实时操作日志
- 3 个场景测试按钮
- 内部状态查看功能

## 📚 学习路径

### 第一步：理解概念（20分钟）

阅读 `docs/01-what-is-crdt.md`：
- ✅ CRDT 是什么？
- ✅ 为什么需要 CRDT？
- ✅ 数学基础：交换律、结合律、幂等性
- ✅ State-based vs Operation-based

**关键洞察**：
```
OT 的思路："遇到冲突，用算法解决"
CRDT 的思路："设计数据结构，让冲突不存在"
```

### 第二步：实现 G-Counter（30分钟）

查看 `src/g-counter.ts` 和 `src/g-counter.test.ts`

**核心代码**：
```typescript
// merge 函数：取每个副本的最大值
merge(other: GCounter): GCounter {
  const result = new GCounter();
  const allReplicas = new Set([
    ...this.counts.keys(),
    ...other.counts.keys(),
  ]);
  for (const replica of allReplicas) {
    const thisCount = this.counts.get(replica) || 0;
    const otherCount = other.counts.get(replica) || 0;
    result.counts.set(replica, Math.max(thisCount, otherCount));
  }
  return result;
}
```

**运行测试**：
```bash
pnpm test g-counter
```

### 第三步：理解 RGA（1小时）

查看 `src/rga.ts` 和 `src/rga.test.ts`

**核心概念**：
1. 每个字符有唯一 ID（replicaId + clock）
2. 删除使用墓碑标记（不真正删除）
3. 并发插入通过 ID 排序

**关键代码**：
```typescript
// 插入时生成唯一 ID
const char: Character = {
  id: { replicaId: this.replicaId, clock: this.nextClock() },
  value,
  tombstone: false,
};

// 并发插入时按 ID 排序
if (this.compareId(currentChar.id, char.id) < 0) {
  insertIndex++;
}
```

**运行测试**：
```bash
pnpm test rga
```

### 第四步：对比 OT 和 CRDT（30分钟）

阅读 `docs/02-ot-vs-crdt.md`

**关键对比**：

| 维度 | OT | CRDT |
|------|-----|------|
| 架构 | 中心化 | 去中心化 |
| 离线编辑 | 困难 | 简单 |
| 数据量 | 小 | 大 |
| 实现复杂度 | 算法复杂 | 数据结构复杂 |

**何时用 CRDT**：
- ✅ 离线编辑是核心需求
- ✅ P2P 场景
- ✅ 去中心化架构

**何时用 OT**：
- ✅ 有稳定的服务器
- ✅ 实时性是第一优先级
- ✅ 主要是在线协同

### 第五步：体验交互式 Demo（30分钟）

启动 Demo：
```bash
pnpm dev
```

**场景 1：基础同步**
1. 点击"场景1：基础同步"
2. 观察 Alice 输入 "Hello"
3. 观察操作如何同步到 Bob 和 Charlie

**场景 2：并发插入**
1. 点击"场景2：并发插入"
2. 三个用户同时在开头插入不同字符
3. 观察它们如何自动收敛到相同结果

**场景 3：冲突解决**
1. 点击"场景3：冲突解决"
2. Alice 和 Bob 同时编辑同一文档
3. 观察 CRDT 如何自动解决冲突

**手动测试**：
1. 在 Alice 的编辑器输入文字
2. 点击"同步所有副本"
3. 观察所有编辑器是否收敛到相同内容

## 🎯 核心要点

### 1. G-Counter 的精髓

```typescript
// 为什么取最大值？
result.counts.set(replica, Math.max(thisCount, otherCount));

原因：
✅ 幂等性：重复合并不会改变结果
✅ 交换律：合并顺序无关
✅ 收敛性：最终所有副本相同
```

### 2. RGA 的精髓

```typescript
// 为什么需要唯一 ID？
const char: Character = {
  id: { replicaId: this.replicaId, clock: this.nextClock() },
  value,
  tombstone: false,
};

原因：
✅ 位置会变化，但 ID 不变
✅ 并发插入可以通过 ID 排序
✅ 删除可以精确定位字符
✅ 支持离线编辑
```

### 3. 墓碑的必要性

```typescript
// 为什么删除不真正删除？
delete(position: number): DeleteOperation | null {
  this.chars[index].tombstone = true; // 标记为删除
  // 而不是 this.chars.splice(index, 1); // 真正删除
}

原因：
✅ 因果关系：其他副本可能还在引用这个字符
✅ 幂等性：重复删除不会有副作用
✅ 离线支持：离线副本需要知道哪些字符被删除了
```

## 🔧 常见问题

### Q1: CRDT 的数据量太大怎么办？

**A**: 生产级 CRDT（如 Yjs）使用了多种优化技术：
- 增量编码（Delta encoding）
- 压缩算法
- 垃圾回收（清理墓碑）
- 树形结构（而不是数组）

### Q2: 为什么我的 Demo 场景 4 显示收敛失败？

**A**: 这是因为简化实现中的操作应用顺序问题。在交互式 Demo 中我们已经修复了这个问题。这也说明了为什么生产级 CRDT 需要更复杂的实现。

### Q3: CRDT 真的能替代 OT 吗？

**A**: 不能完全替代，各有优势：
- Google Docs 仍然用 OT（实时性好）
- Figma 用 CRDT（设计工具，离线需求）
- 最佳实践：根据场景选择或混合使用

### Q4: 如何学习更高级的 CRDT？

**A**: 推荐资源：
1. [Yjs](https://github.com/yjs/yjs) - 高性能 CRDT 库
2. [Automerge](https://github.com/automerge/automerge) - JSON CRDT
3. [CRDT 论文](https://hal.inria.fr/inria-00555588/document)

## 🎓 下一步

完成 Phase 4 后，你已经掌握了：
- ✅ CRDT 的核心原理
- ✅ State-based CRDT（G-Counter、PN-Counter）
- ✅ Operation-based CRDT（RGA）
- ✅ OT vs CRDT 的权衡

**继续学习**：
1. 探索 Yjs 的优化技术
2. 实现更复杂的 CRDT（如 JSON CRDT）
3. 构建一个完整的协同应用（Phase 5）

## 💡 小贴士

- 🧪 **实验是最好的老师**：修改 Demo 代码，看看会发生什么
- 📝 **阅读测试用例**：测试用例是最好的使用示例
- 🐛 **调试技巧**：使用"查看内部状态"按钮观察 CRDT 的内部结构
- 🎨 **自己动手**：尝试实现一个 OR-Set（可删除的集合）

---

**祝学习愉快！** 🚀

如果有任何问题，请参考：
- `README.md` - 项目概览
- `docs/` - 详细文档
- `src/*.test.ts` - 测试用例

