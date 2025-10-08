# Transform vs Compose：核心区别

## 问题：它们看起来很像？

**是的**，乍一看它们都在"组合操作"，但**目的和场景完全不同**！

## 关键区别

| 维度 | Compose | Transform |
|------|---------|-----------|
| **输入** | 两个**顺序**操作 | 两个**并发**操作 |
| **基准文档** | op2 基于 apply(doc, op1) | op1 和 op2 都基于 doc |
| **目的** | 合并操作历史，优化存储 | 解决并发冲突 |
| **结果** | 单个等价操作 | 转换后的操作 |
| **应用场景** | 撤销/重做、历史压缩 | 协同编辑 |

## 详细对比

### Compose：顺序操作的组合

```typescript
// 场景：Alice 依次进行两次编辑
const doc = "ABC";

// 第一步：插入 "X"
const op1 = [insert("X")];
const doc1 = apply(doc, op1);  // "XABC"

// 第二步（基于 doc1）：在位置 2 插入 "Y"
const op2 = [retain(2), insert("Y")];
const doc2 = apply(doc1, op2);  // "XAYBC"

// Compose 的作用：合并这两步为一个操作
const composed = compose(op1, op2);
// composed = [insert("X"), retain(1), insert("Y"), retain(3)]

// 验证：从原始文档直接得到最终结果
apply(doc, composed) === doc2  // true, "XAYBC"
```

**关键**：
- op2 是**基于 doc1** 的（doc1 = apply(doc, op1)）
- 操作是**有顺序的**（先 op1，后 op2）
- 目的是**历史压缩**（减少存储）

### Transform：并发操作的转换

```typescript
// 场景：Alice 和 Bob **同时**编辑同一文档
const doc = "ABC";

// Alice 的操作（基于 "ABC"）
const aliceOp = [insert("X")];  // → "XABC"

// Bob 的操作（也基于 "ABC"）
const bobOp = [retain(2), insert("Y")];  // → "ABYC"

// 问题：最终文档应该是什么？
// - Alice 看到的：先 "ABC" → "XABC"，收到 Bob 的操作后 → ???
// - Bob 看到的：先 "ABC" → "ABYC"，收到 Alice 的操作后 → ???

// Transform 的作用：转换操作以适应并发变化

// Alice 端：
const doc_alice = apply(doc, aliceOp);  // "XABC"
const bobOp_transformed = transform(bobOp, aliceOp, "right");
// bobOp_transformed = [retain(3), insert("Y")]  // 位置从 2 调整到 3
const final_alice = apply(doc_alice, bobOp_transformed);
// "XABYC"

// Bob 端：
const doc_bob = apply(doc, bobOp);  // "ABYC"
const aliceOp_transformed = transform(aliceOp, bobOp, "left");
// aliceOp_transformed = [insert("X")]  // 不需要调整
const final_bob = apply(doc_bob, aliceOp_transformed);
// "XABYC"

// 结果：两边收敛！
final_alice === final_bob  // true, "XABYC"
```

**关键**：
- aliceOp 和 bobOp 都**基于同一个 doc**
- 操作是**并发的**（同时发生）
- 目的是**冲突解决**（保证收敛）

## 形象类比

### Compose 像 "视频剪辑"

```
原始视频: A
镜头1: A → B  (添加特效)
镜头2: B → C  (添加字幕，基于 B)

Compose: 直接从 A 到 C 的单一操作
效果: 省去中间状态 B，提高效率
```

### Transform 像 "交通路口"

```
十字路口: 两辆车同时到达

车A: 直行
车B: 左转

Transform: 根据交通规则调整路径
- 车A transform 后: 等待车B左转后再直行
- 车B transform 后: 在车A直行时完成左转

结果: 不发生碰撞，安全通过
```

## 代码实现的区别

### Compose 的实现逻辑

```typescript
function compose(ops1, ops2) {
  // 关键：ops2 作用于 apply(doc, ops1) 的结果
  // 需要将 ops2 的位置"映射回"原始文档
  
  // 遍历 ops1 和 ops2，处理它们的交互
  // 例如：
  // - ops1 插入了 "X"，ops2 的 retain(2) 需要考虑这个 X
  // - ops1 删除了 "AB"，ops2 的操作需要跳过这些已删除的字符
  
  return mergedOps;
}
```

### Transform 的实现逻辑

```typescript
function transform(op1, op2, side) {
  // 关键：op1 和 op2 都基于同一个原始文档
  // 需要将 op1 转换以适应 op2 已应用的情况
  
  // 遍历 op1 和 op2，处理并发冲突
  // 例如：
  // - 两个都是 Insert：使用 side 参数决定顺序
  // - op1 Insert, op2 Delete：Insert 不受影响，但位置需调整
  // - op1 Delete, op2 Delete：计算重叠部分
  
  return transformedOp1;
}
```

## 实际应用场景

### 何时用 Compose

1. **历史压缩**
   ```typescript
   // 用户连续输入 "Hello"
   const ops = [
     [insert("H")],
     [retain(1), insert("e")],
     [retain(2), insert("l")],
     [retain(3), insert("l")],
     [retain(4), insert("o")],
   ];
   
   // Compose 合并为单个操作
   const compressed = ops.reduce((acc, op) => compose(acc, op));
   // [insert("Hello")]
   
   // 节省存储空间：5 个操作 → 1 个操作
   ```

2. **撤销/重做**
   ```typescript
   // 撤销最近的 3 个操作
   const undo = compose(
     invert(ops[n]),
     compose(invert(ops[n-1]), invert(ops[n-2]))
   );
   ```

3. **操作预览**
   ```typescript
   // 预览应用多个操作后的效果
   const preview = apply(doc, compose(op1, op2, op3));
   ```

### 何时用 Transform

1. **协同编辑**
   ```typescript
   // 收到远程操作时
   function onReceiveRemoteOp(remoteOp) {
     // 转换远程操作以适应本地未确认的操作
     let transformed = remoteOp;
     for (const localOp of pendingOps) {
       transformed = transform(transformed, localOp, "right");
     }
     apply(doc, transformed);
   }
   ```

2. **冲突解决**
   ```typescript
   // 两个用户编辑同一段文字
   const userA_op = getUserEdit();
   const userB_op = getOtherUserEdit();
   
   // 确保双方收敛
   const transformed = transform(userA_op, userB_op, "left");
   ```

3. **离线编辑同步**
   ```typescript
   // 用户离线时的编辑
   const offlineOps = getOfflineEdits();
   
   // 重新上线后，转换以适应服务器的新操作
   const serverOps = getServerOps();
   let transformed = offlineOps;
   for (const serverOp of serverOps) {
     transformed = transform(transformed, serverOp, "right");
   }
   ```

## 数学性质

### Compose 的性质

```typescript
// 结合律
compose(compose(a, b), c) === compose(a, compose(b, c))

// 与 apply 的关系
apply(apply(doc, a), b) === apply(doc, compose(a, b))
```

### Transform 的性质（TP1）

```typescript
// 收敛性：两条路径到达同一结果
apply(apply(doc, op1), transform(op2, op1, "right")) ===
apply(apply(doc, op2), transform(op1, op2, "left"))
```

## 为什么容易混淆？

1. **都在处理多个操作**
   - Compose: 顺序的多个操作
   - Transform: 并发的两个操作

2. **都需要调整位置**
   - Compose: 将 op2 的位置映射回原文档
   - Transform: 将 op1 的位置调整以适应 op2

3. **实现都很复杂**
   - 都需要处理 9 种操作组合（Insert/Delete/Retain）
   - 都需要处理长度不匹配的情况

## 核心记忆点

### Compose
- **时间轴**：op1 → op2（有先后）
- **文档基准**：op2 基于 apply(doc, op1)
- **目标**：合并历史
- **比喻**：视频剪辑

### Transform
- **时间轴**：op1 || op2（并发）
- **文档基准**：都基于同一个 doc
- **目标**：解决冲突
- **比喻**：交通路口

## 协同编辑中的协作

在真实的协同编辑系统中，**两者都需要**！

```typescript
// 客户端
class CollaborativeEditor {
  // 本地编辑：使用 Compose 压缩
  onLocalEdit(op) {
    this.pendingOps = compose(this.pendingOps, op);
  }
  
  // 收到远程操作：使用 Transform 解决冲突
  onRemoteOp(remoteOp) {
    // 转换远程操作
    let transformed = remoteOp;
    for (const pending of this.pendingOps) {
      transformed = transform(transformed, pending, "right");
    }
    
    // 应用转换后的操作
    this.doc = apply(this.doc, transformed);
    
    // 同时转换本地待确认的操作
    this.pendingOps = transform(this.pendingOps, remoteOp, "left");
  }
}
```

## 总结

| 问题 | Compose | Transform |
|------|---------|-----------|
| **解决什么问题** | 优化存储和历史管理 | 解决并发冲突 |
| **操作关系** | 顺序（有因果） | 并发（无因果） |
| **核心挑战** | 位置映射 | 冲突解决 |
| **必需性** | 可选（优化） | 必需（协同） |

**记住**：
- **Compose** = 历史的压缩机 🗜️
- **Transform** = 并发的红绿灯 🚦

两者配合，才能实现高效且正确的协同编辑！

