# 学习资源汇总

## 官方文档

### 编辑器框架
- [Quill 官方文档](https://quilljs.com/) - 简单易用的富文本编辑器
- [Slate 官方文档](https://docs.slatejs.org/) - 可定制的 React 编辑器
- [ProseMirror 指南](https://prosemirror.net/docs/guide/) - 功能强大的编辑器工具包
- [Tiptap 文档](https://tiptap.dev/) - 现代化的编辑器框架

### 协同编辑
- [Yjs 文档](https://docs.yjs.dev/) - 最流行的 CRDT 实现
- [Automerge 文档](https://automerge.org/) - 另一个 CRDT 库
- [ShareDB](https://share.github.io/sharedb/) - OT 协同框架

### Web API
- [MDN - ContentEditable](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/contenteditable)
- [MDN - Selection API](https://developer.mozilla.org/zh-CN/docs/Web/API/Selection)
- [MDN - Range API](https://developer.mozilla.org/zh-CN/docs/Web/API/Range)

## 理论文章

### 协同编辑算法

#### OT (Operational Transformation)
- [OT 算法详解](https://operational-transformation.github.io/) - 最全面的 OT 资源
- [Understanding OT](https://medium.com/@srijancse/how-real-time-collaborative-editing-work-operational-transformation-ac4902d75682) - OT 入门文章
- [Google Wave OT](https://svn.apache.org/repos/asf/incubator/wave/whitepapers/operational-transform/operational-transform.html) - Google Wave 的 OT 实现

#### CRDT
- [CRDT 官方网站](https://crdt.tech/) - CRDT 资源汇总
- [CRDT 论文合集](https://github.com/pfrazee/crdt_notes) - 学术论文
- [Yjs YATA 算法论文](https://www.researchgate.net/publication/310212186_Near_Real-Time_Peer-to-Peer_Shared_Editing_on_Extensible_Data_Types) - Yjs 核心算法
- [A Conflict-Free Replicated JSON Datatype](https://arxiv.org/abs/1608.03960) - Automerge 论文

### 富文本编辑器

#### 设计原理
- [Why ContentEditable is Terrible](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480) - Medium 的经验
- [Building a Rich Text Editor](https://www.tiny.cloud/blog/content-editable-rich-text-editors/) - TinyMCE 的见解
- [The Challenges of Building Rich Text Editors](https://ckeditor.com/blog/Lessons-learned-from-creating-a-rich-text-editor-with-real-time-collaboration/) - CKEditor 的经验

#### 数据结构
- [Quill Delta 规范](https://quilljs.com/docs/delta/) - Delta 格式详解
- [Slate 数据模型](https://docs.slatejs.org/concepts/02-nodes) - 树形结构设计
- [ProseMirror Document Structure](https://prosemirror.net/docs/guide/#doc) - 文档模型

## 实战教程

### 从零实现编辑器
- [Build Your Own Text Editor](https://viewsourcecode.org/snaptoken/kilo/) - C 语言实现（理解原理）
- [Build a Rich Text Editor](https://levelup.gitconnected.com/building-a-rich-text-editor-with-react-and-draft-js-7e8e1e5a4c72) - React 实现
- [Creating a Custom Editor with Slate](https://docs.slatejs.org/walkthroughs/01-installing-slate) - Slate 官方教程

### 协同编辑实现
- [Building Real-time Collaboration with Yjs](https://blog.kevinjahns.de/are-crdts-suitable-for-shared-editing/) - Yjs 作者的文章
- [Implementing OT in JavaScript](https://github.com/Operational-Transformation/ot.js) - OT.js 实现
- [Real-time Collaborative Editing](https://www.tiny.cloud/blog/real-time-collaborative-editing/) - TinyMCE 的方案

## 开源项目

### 编辑器示例
- [Quill Examples](https://github.com/quilljs/quill/tree/develop/examples)
- [Slate Examples](https://github.com/ianstormtaylor/slate/tree/main/site/examples)
- [ProseMirror Examples](https://github.com/ProseMirror/prosemirror-example-setup)
- [Tiptap Examples](https://github.com/ueberdosis/tiptap/tree/main/demos)

### 协同编辑示例
- [Yjs Demos](https://github.com/yjs/yjs-demos) - 各种 Yjs 集成示例
- [Tiptap Collaboration](https://github.com/ueberdosis/tiptap/tree/main/demos/src/Examples/CollaborativeEditing) - Tiptap 协同示例
- [ProseMirror Collab](https://github.com/ProseMirror/prosemirror-collab) - ProseMirror 协同模块

### 完整产品
- [BlockNote](https://github.com/TypeCellOS/BlockNote) - Notion 风格编辑器
- [Lexical](https://github.com/facebook/lexical) - Facebook 的编辑器框架
- [Milkdown](https://github.com/Milkdown/milkdown) - 插件驱动的编辑器
- [Novel](https://github.com/steven-tey/novel) - Notion 风格编辑器（Tiptap）

## 技术博客

### 国外
- [Yjs 作者博客](https://blog.kevinjahns.de/)
- [Slate 作者博客](https://ianstormtaylor.com/)
- [ProseMirror 作者博客](https://marijnhaverbeke.nl/)
- [Notion Engineering](https://www.notion.so/blog/topic/engineering)
- [Figma Engineering](https://www.figma.com/blog/engineering/)

### 国内
- [飞书技术团队](https://www.feishu.cn/hc/zh-CN/categories/360000039336)
- [语雀技术团队](https://www.yuque.com/yuque/blog)
- [腾讯文档团队](https://cloud.tencent.com/developer/column/90768)

## 视频教程

### YouTube
- [Build a Notion Clone with React](https://www.youtube.com/watch?v=0XGt03QTrnE)
- [Slate.js Tutorial](https://www.youtube.com/watch?v=Gt6g_h7zrF4)
- [Building Real-time Collaboration](https://www.youtube.com/watch?v=jIv2CsZx1Pk)

### B站
- [富文本编辑器开发](https://www.bilibili.com/video/BV1xb4y1R7Tf)
- [协同编辑原理](https://www.bilibili.com/video/BV1PK411H7Tu)

## 技术分享

### 会议演讲
- [Real-time Collaborative Editing - QCon](https://www.infoq.com/presentations/collaborative-editing-browser/)
- [CRDTs: The Hard Parts - GOTO](https://www.youtube.com/watch?v=x7drE24geUw)
- [Yjs - JSConf](https://www.youtube.com/watch?v=0l5XgnQ6rB4)

### 技术文章
- [飞书文档协同编辑实践](https://mp.weixin.qq.com/s/4lI4O2xsCo8cIbfFrV9xqA)
- [腾讯文档协同方案演进](https://mp.weixin.qq.com/s/qk1pfJNtXCuPdNiJA4GGGQ)
- [字节跳动的协同编辑实践](https://juejin.cn/post/7075305954319712269)

## 学术论文

### 经典论文
- [Concurrency Control in Groupware Systems (1989)](http://www.lively-kernel.org/repository/webwerkstatt/projects/Collaboration/paper/Jupiter.pdf) - OT 开山之作
- [Operational Transformation in Real-Time Group Editors (1998)](https://dl.acm.org/doi/10.1145/289444.289469)
- [A Comprehensive Study of CRDTs (2011)](https://hal.inria.fr/inria-00555588/document)

### 现代研究
- [Yjs: A Framework for Near Real-Time P2P Shared Editing (2016)](https://www.researchgate.net/publication/310212186)
- [Automerge: A JSON-like data structure (2017)](https://arxiv.org/abs/1608.03960)
- [Conflict-Free Replicated Data Types (2018)](https://arxiv.org/abs/1805.06358)

## 工具和库

### 开发工具
- [Quill Modules](https://github.com/quilljs/awesome-quill) - Quill 生态
- [Slate Plugins](https://github.com/udecode/plate) - Slate 插件集合
- [Tiptap Extensions](https://tiptap.dev/extensions) - Tiptap 扩展

### 辅助库
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML 清理
- [Delta](https://github.com/quilljs/delta) - Delta 操作库
- [Immer](https://github.com/immerjs/immer) - 不可变数据
- [y-websocket](https://github.com/yjs/y-websocket) - Yjs WebSocket Provider
- [y-webrtc](https://github.com/yjs/y-webrtc) - Yjs WebRTC Provider

### 测试工具
- [Vitest](https://vitest.dev/) - 单元测试
- [Testing Library](https://testing-library.com/) - React 测试
- [Playwright](https://playwright.dev/) - E2E 测试

## 社区资源

### GitHub Awesome 系列
- [Awesome Quill](https://github.com/quilljs/awesome-quill)
- [Awesome Slate](https://github.com/ianstormtaylor/slate/wiki)
- [Awesome CRDT](https://github.com/alangibson/awesome-crdt)

### 讨论区
- [Quill Community](https://github.com/quilljs/quill/discussions)
- [Slate Slack](https://slate-slack.herokuapp.com/)
- [Yjs Discussions](https://github.com/yjs/yjs/discussions)
- [ProseMirror Forum](https://discuss.prosemirror.net/)

### Stack Overflow 标签
- [quill](https://stackoverflow.com/questions/tagged/quill)
- [slate.js](https://stackoverflow.com/questions/tagged/slate.js)
- [prosemirror](https://stackoverflow.com/questions/tagged/prosemirror)
- [yjs](https://stackoverflow.com/questions/tagged/yjs)

## 书籍推荐

### 算法和数据结构
- 《算法导论》 - 理解 OT 的数学基础
- 《分布式系统原理与范型》 - 理解协同编辑的分布式本质

### Web 开发
- 《JavaScript 高级程序设计》 - JS 基础
- 《React 设计原理》 - React 深入理解

### 特定主题
- 《Designing Data-Intensive Applications》 - 分布式系统
- 《Real-Time Collaboration Patterns》 - 协同模式（如果能找到）

## 在线课程

### 免费课程
- [MDN Web Docs](https://developer.mozilla.org/) - Web 基础
- [JavaScript.info](https://javascript.info/) - JS 教程
- [React 官方教程](https://react.dev/learn) - React 学习

### 付费课程（可选）
- [Frontend Masters](https://frontendmasters.com/) - 前端进阶
- [Egghead.io](https://egghead.io/) - React 生态

## 实战项目创意

### 初级
- [ ] 简单的 Markdown 编辑器
- [ ] 富文本评论框
- [ ] 在线代码编辑器

### 中级
- [ ] Notion 风格的块编辑器
- [ ] 协同 Todo 应用
- [ ] 在线白板（简化版）

### 高级
- [ ] 完整的协同文档系统
- [ ] 在线思维导图（协同）
- [ ] Figma 风格的设计工具（简化版）

## 持续学习

### 关注更新
- [Yjs Release Notes](https://github.com/yjs/yjs/releases)
- [Tiptap Changelog](https://github.com/ueberdosis/tiptap/blob/main/CHANGELOG.md)
- [Slate Changelog](https://github.com/ianstormtaylor/slate/blob/main/docs/general/changelog.md)

### 加入社区
- GitHub Discussions
- Discord 服务器
- 技术会议

### 分享经验
- 写技术博客
- 做开源贡献
- 参与讨论

---

## 学习建议

### 第一阶段（基础）
1. 先看 MDN 文档，理解 Web API
2. 运行本项目的 Demo
3. 阅读 Quill 文档

### 第二阶段（深入）
1. 研究 Slate/ProseMirror 源码
2. 阅读 OT 和 CRDT 论文
3. 看技术分享视频

### 第三阶段（实战）
1. 实现自己的编辑器
2. 集成协同功能
3. 参与开源项目

### 第四阶段（专家）
1. 研究生产级实现
2. 性能优化
3. 分享经验

---

**记住：**
- 不要试图一次性看完所有资源
- 按需学习，边做边学
- 实践是最好的老师
- 保持好奇心和耐心

**开始探索：** 选择 1-2 个资源深入学习！🚀

