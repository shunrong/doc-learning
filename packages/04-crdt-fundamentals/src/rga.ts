/**
 * RGA (Replicated Growable Array)
 *
 * 用于文本协同编辑的 CRDT
 *
 * 核心思想：
 * 1. 每个字符有唯一的 ID（不依赖位置）
 * 2. 删除使用墓碑标记（不真正删除）
 * 3. 并发插入通过 ID 排序解决冲突
 */

/**
 * 字符节点
 */
export interface Character {
  id: CharacterId; // 唯一标识
  value: string; // 字符内容
  tombstone: boolean; // 是否被删除（墓碑）
}

/**
 * 字符ID：由副本ID + 时钟组成，保证全局唯一
 */
export interface CharacterId {
  replicaId: string; // 副本标识
  clock: number; // 逻辑时钟（递增）
}

/**
 * 插入操作
 */
export interface InsertOperation {
  type: "insert";
  char: Character;
  afterId: CharacterId | null; // 在哪个字符之后插入（null表示开头）
}

/**
 * 删除操作
 */
export interface DeleteOperation {
  type: "delete";
  charId: CharacterId;
}

export type Operation = InsertOperation | DeleteOperation;

/**
 * RGA 文本编辑器
 */
export class RGA {
  private chars: Character[] = [];
  private clock: number = 0;
  private replicaId: string;

  constructor(replicaId: string) {
    this.replicaId = replicaId;
  }

  /**
   * 获取下一个时钟值
   */
  private nextClock(): number {
    return ++this.clock;
  }

  /**
   * 比较两个字符ID（用于排序）
   *
   * 规则：
   * 1. 先比较 clock（越大越靠后）
   * 2. clock 相同则比较 replicaId（字典序）
   */
  private compareId(id1: CharacterId, id2: CharacterId): number {
    if (id1.clock !== id2.clock) {
      return id1.clock - id2.clock;
    }
    return id1.replicaId.localeCompare(id2.replicaId);
  }

  /**
   * 判断两个ID是否相等
   */
  private idEquals(id1: CharacterId | null, id2: CharacterId | null): boolean {
    if (id1 === null && id2 === null) return true;
    if (id1 === null || id2 === null) return false;
    return id1.replicaId === id2.replicaId && id1.clock === id2.clock;
  }

  /**
   * 查找字符的索引
   */
  private findIndex(charId: CharacterId | null): number {
    if (charId === null) return -1;

    for (let i = 0; i < this.chars.length; i++) {
      if (this.idEquals(this.chars[i].id, charId)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 本地插入（生成操作）
   *
   * @param position - 可见位置（不包括墓碑）
   * @param value - 插入的字符
   * @returns 生成的插入操作
   */
  insert(position: number, value: string): InsertOperation {
    // 找到可见位置对应的 afterId
    let visibleCount = 0;
    let afterId: CharacterId | null = null;

    // 遍历所有可见字符，找到位置 position - 1 的字符作为 afterId
    for (let i = 0; i < this.chars.length; i++) {
      if (!this.chars[i].tombstone) {
        if (visibleCount === position) {
          // 已经到达插入位置，afterId 就是前一个可见字符
          break;
        }
        afterId = this.chars[i].id; // 记录当前可见字符
        visibleCount++;
      }
    }

    // 如果 position > visibleCount，说明要插入到末尾后面
    // afterId 保持为最后一个可见字符（或 null）

    const char: Character = {
      id: { replicaId: this.replicaId, clock: this.nextClock() },
      value,
      tombstone: false,
    };

    const operation: InsertOperation = {
      type: "insert",
      char,
      afterId,
    };

    // 直接插入到本地（不通过 applyInsert，避免重复计算位置）
    // 找到afterId的位置（如果有的话）
    let insertIndex = 0;
    if (afterId !== null) {
      const afterIndex = this.findIndex(afterId);
      if (afterIndex !== -1) {
        insertIndex = afterIndex + 1;
      }
    }
    // 本地插入不需要考虑并发，直接插入即可
    this.chars.splice(insertIndex, 0, char);

    return operation;
  }

  /**
   * 本地删除（生成操作）
   *
   * @param position - 可见位置
   * @returns 生成的删除操作
   */
  delete(position: number): DeleteOperation | null {
    // 找到可见位置对应的字符
    let visibleCount = 0;

    for (let i = 0; i < this.chars.length; i++) {
      if (!this.chars[i].tombstone) {
        if (visibleCount === position) {
          const operation: DeleteOperation = {
            type: "delete",
            charId: this.chars[i].id,
          };

          // 立即应用到本地
          this.applyDelete(operation);

          return operation;
        }
        visibleCount++;
      }
    }

    return null; // 位置无效
  }

  /**
   * 应用远程插入操作
   */
  applyInsert(operation: InsertOperation): void {
    const { char, afterId } = operation;

    // 更新本地时钟
    this.clock = Math.max(this.clock, char.id.clock);

    // 避免重复插入
    if (this.findIndex(char.id) !== -1) {
      return;
    }

    // 找到插入位置
    let insertIndex = 0;

    if (afterId === null) {
      // 插入到开头，但要考虑并发插入
      // 找到所有在开头的插入，按 ID 排序
      while (insertIndex < this.chars.length) {
        const currentChar = this.chars[insertIndex];
        // 如果当前字符的 ID 更小，则要插入的字符应该在它后面
        if (this.compareId(currentChar.id, char.id) < 0) {
          insertIndex++;
        } else {
          break;
        }
      }
    } else {
      // 找到 afterId 的位置
      const afterIndex = this.findIndex(afterId);

      if (afterIndex === -1) {
        // afterId 不存在，插入到末尾
        insertIndex = this.chars.length;
      } else {
        insertIndex = afterIndex + 1;

        // 处理并发插入：只比较时钟值相同或更大的字符
        // 时钟值小的字符是"早期"插入的，不应该参与并发排序
        // 这是一个简化实现，完整的 CRDT（如 Yjs）会维护完整的因果关系
        while (insertIndex < this.chars.length) {
          const currentChar = this.chars[insertIndex];

          // 只比较时钟值 >= char.clock 的字符（可能是并发操作）
          // 时钟值更小的字符是之前就存在的，不参与排序
          if (currentChar.id.clock < char.id.clock) {
            break;
          }

          // 如果当前字符的 ID 更小，则要插入的字符应该在它后面
          if (this.compareId(currentChar.id, char.id) < 0) {
            insertIndex++;
          } else {
            break;
          }
        }
      }
    }

    // 插入字符
    this.chars.splice(insertIndex, 0, char);
  }

  /**
   * 应用远程删除操作
   */
  applyDelete(operation: DeleteOperation): void {
    const { charId } = operation;

    const index = this.findIndex(charId);
    if (index !== -1) {
      this.chars[index].tombstone = true;
    }
  }

  /**
   * 应用操作（通用方法）
   */
  applyOperation(operation: Operation): void {
    if (operation.type === "insert") {
      this.applyInsert(operation);
    } else {
      this.applyDelete(operation);
    }
  }

  /**
   * 获取当前文本内容（不包括墓碑）
   */
  toString(): string {
    return this.chars
      .filter((char) => !char.tombstone)
      .map((char) => char.value)
      .join("");
  }

  /**
   * 获取可见字符数量
   */
  length(): number {
    return this.chars.filter((char) => !char.tombstone).length;
  }

  /**
   * 获取内部状态（用于调试和同步）
   */
  getState(): { chars: Character[]; clock: number } {
    return {
      chars: this.chars.map((c) => ({ ...c })), // 深拷贝
      clock: this.clock,
    };
  }

  /**
   * 从状态恢复（用于初始化）
   */
  static fromState(
    replicaId: string,
    state: { chars: Character[]; clock: number }
  ): RGA {
    const rga = new RGA(replicaId);
    rga.chars = state.chars.map((c) => ({ ...c })); // 深拷贝
    rga.clock = state.clock;
    return rga;
  }

  /**
   * 合并另一个 RGA 的状态
   *
   * 用于全量同步（不推荐，仅用于初始化或错误恢复）
   */
  merge(other: RGA): void {
    // 简化实现：应用所有对方有但自己没有的字符
    for (const char of other.chars) {
      if (this.findIndex(char.id) === -1) {
        this.applyInsert({ type: "insert", char, afterId: null });
      }
    }

    // 同步删除状态
    for (const char of other.chars) {
      const index = this.findIndex(char.id);
      if (index !== -1 && char.tombstone && !this.chars[index].tombstone) {
        this.chars[index].tombstone = true;
      }
    }

    this.clock = Math.max(this.clock, other.clock);
  }
}
