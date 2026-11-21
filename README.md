# StudyComfyUI

![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express-61dafb)

**一个让你「看得懂、改得动」ComfyUI 工作流的开源学习工作台。**

> 导入一份工作流 JSON，AI 帮你逐节点讲清作用、参数与设计原理；当你想加功能时，直接用 prompt 提需求，AI 给出节点改造方案、用颜色标出新增与删除，并告诉你在 ComfyUI 里具体要点哪里、怎么连线。
>
> 目标不是替你生成图，而是让你**看懂别人的工作流，改出自己的工作流**——在学中做，在做中学。

中英双语文档站：<https://pages.github.io/studycomfyui/>

---

## 为什么会有这个项目

如果你符合下面任意一条，这个项目就是为你做的：

- 从网上下载了一份 ComfyUI 工作流 JSON，导入后能跑出图，但**完全看不懂那一堆节点在干什么**、为什么这么连。
- 想给现有工作流加个功能（比如「加个 LoRA」「高清放大」「线稿控制」），但**不知道该加哪个节点、加在哪、线从哪拖到哪**。
- 看过不少教程，但教程只告诉你「照着连」，从不解释**为什么这么设计**，换个场景还是不会改。
- 对 ComfyUI 有兴趣，但被节点图劝退，想有一个能**边看边学、边改边学**的地方。

传统教程是「给你一条鱼」，StudyComfyUI 想做的是「带你看懂鱼的结构，再教你亲手改一条」。

## 核心理念：学中做，做中学

```
看懂工作流  →  提出改造需求  →  得到带标注的改动  →  回到 ComfyUI 动手  →  再看懂一层
```

每一轮改造都会输出三样东西：**改了哪些节点**、**为什么这么改**、**在 ComfyUI 里具体怎么操作**。你不是被动接收答案，而是拿着答案回到画布上验证，再从结果里提出下一个问题。

---

## 主要工作

本项目围绕「降低 ComfyUI 工作流的理解与修改门槛」做了以下工作：

1. **工作流结构化解析**
   兼容 ComfyUI 的 UI/图格式（`nodes` + `links`）和 API 格式（`{ "id": { class_type, inputs } }`），统一解析成可读的节点、参数与连线结构，作为后续解读与改造的基础。

2. **AI 驱动的智能解读**
   大模型逐节点解释：这个节点是干什么的、每个参数当前值控制什么、为什么工作流要这么设计；同时梳理整条链路的数据流动过程，输出结构化学习要点。

3. **学习页面生成与持久化**
   解读结果自动生成学习页面，保存在本地工作台中，可长期保留、重命名、删除，也能一键导出为独立 HTML 文件离线阅读。

4. **基于 prompt 的智能节点改造**
   用户用自然语言提出新功能需求，AI 判断需要增加、删除或修改哪些节点，输出完整的新工作流，并在提示词中强制要求说明**新增节点的必要性**和**可执行的 ComfyUI 操作步骤**。注意：代码只校验返回结构（`newWorkflow` 与 `changes`），不验证节点类型、连线合法性或工作流是否真正可运行。

5. **可视化差异标注**
   在工作流图上用颜色标注改动：绿色=新增，红色=删除，黄色=修改，删除的连线用虚线表示；改造记录页同步列出原因与操作步骤。

6. **双引擎兜底**
   配置任意 OpenAI 兼容 API 时调用大模型；未配置，或请求失败 / 返回结构不完整时，自动切换到内置节点知识库与改造规则。内置知识库覆盖 23 类常见节点；内置改造规则支持删除节点、超分放大、LoRA、ControlNet、二次采样、预览中间结果 6 类意图，未命中时会给出提示。

---

## 功能特性

- **导入即解读**：粘贴 JSON 即可，UI 格式与 API 格式都支持。
- **逐节点讲解**：作用、参数含义、设计意图，一个不漏。
- **数据流动讲解**：按执行顺序说明每一步的输入来自哪里、输出流向哪里。
- **学习页面留存**：打开、重命名、导出 HTML、删除，全在工作台内完成。
- **按需求改造**：加 LoRA、超分放大、ControlNet、二次采样、预览中间结果、删除节点……
- **颜色化差异**：新增/删除/修改节点与连线一目了然。
- **操作指引**：每个新增节点都写明「为什么新增」+「在 ComfyUI 中右键搜什么、参数怎么设、线怎么拖」。
- **零配置可用**：内置知识库模式无需任何 API Key。
- **快捷操作**：`Ctrl / ⌘ + Enter` 快速提交；改造页提供 5 个示例 prompt 一键填入。
- **交互式工作流图**：节点可拖拽、画布可缩放，带 MiniMap 与控件；新增连线带动画，删除节点以虚线「幽灵节点」保留用于教学对照。
- **独立 HTML 学习页**：导出内容含内联 SVG 工作流示意图、差异图例、完整改造历史与操作步骤，点击「导出 HTML」会在新标签页打开。

---

## 快速开始

```bash
git clone https://github.com/your-username/studycomfyui.git
cd studycomfyui
npm install
npm run dev
```

打开 <http://localhost:5173>。`npm run dev` 会同时启动 API 服务（3001）和前端页面（5173）。

生产模式：

```bash
npm run build
npm start
```

此时访问 <http://localhost:3001>。要求 Node.js >= 18。`npm start` 只有在 `dist/` 已构建时才会托管前端；否则只提供 API。

### 全部命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 同时启动 API（3001）与前端（5173） |
| `npm run dev:server` / `npm run dev:web` | 单独启动后端 / 前端 |
| `npm run build` | 构建前端到 `dist/` |
| `npm run preview` | 本地预览构建产物 |
| `npm start` | 启动 API 并托管 `dist/`（若存在） |
| `npm run docs:dev` / `npm run docs:build` / `npm run docs:preview` | 文档站点开发（5174）/ 构建 / 预览 |

### 文档站点

文档位于 `docs/`，使用 VitePress，提供**中英双语**版本（英文在 `/en/`）；`.github/workflows/deploy.yml` 会在推送到 `main` 后自动构建并部署到 GitHub Pages（base 为 `/studycomfyui/`）。修改文档或功能后，需同步更新 `README.md` 与 `docs/` 的中英文页面，详见文末「维护约定」。

---

## 使用指南

### 1. 导入工作流

在 ComfyUI 中导出工作流 JSON（`Workflow → Export (API Format)`，或直接保存界面 JSON），粘贴到工作台顶部输入框，点击「解读并生成学习页面」。也支持粘贴带 JSON 代码围栏或前后带说明文字的内容；跟在 JSON 后面的文字会作为你关注的重点传给解读。

### 2. 学习原理

在「学习解读」页查看逐节点讲解与数据流动过程；在「工作流图」页查看节点与连线结构。不懂哪个节点，就回到这一页翻它的参数含义与设计原因。

### 3. 提出改造需求

在顶部输入框直接用自然语言描述，例如：

| 你说 | AI 会做什么 |
| --- | --- |
| 帮我加一个 LoRA 节点来强化画风 | 插入 `LoraLoader`，重接 MODEL / CLIP，给出 LoRA 文件放置目录与强度建议 |
| 在保存前增加 4 倍超分放大 | 插入 `UpscaleModelLoader` + `ImageUpscaleWithModel`，改接 SaveImage 的输入 |
| 加入 ControlNet 线稿控制构图 | 插入 `ControlNetLoader` + `CannyEdgePreprocessor` + `ApplyControlNet`，并提示需要参考图 |
| 增加潜空间放大和二次采样细化 | 插入 `LatentUpscale` + 第二个 `KSampler`，解释 denoise 取值的影响 |
| 删掉某个节点 / 预览中间结果 | 移除节点并清理连线，或插入 `PreviewImage` |

### 4. 动手验证与留存

到「改造记录」页查看新增节点的原因和 ComfyUI 操作步骤，到「工作流图」页看着色后的结构变化，然后**回到 ComfyUI 按步骤实际改一遍**。满意就留着页面，不需要就在左侧列表删除（有二次确认）；也可点「导出 HTML」在新标签页打开独立学习页面。标题框失焦即保存，操作结果会有 toast 提示。

---

## 模型配置（可选）

点击右上角「设置」：

- `API Key`：密钥
- `Base URL`：任意 OpenAI 兼容地址，如 `https://api.openai.com/v1`、DeepSeek、通义、本地 Ollama
- `模型名称`：如 `gpt-4o-mini`

也可复制 `.env.example` 为 `.env`，支持 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`、`PORT`（默认 `3001`）四个变量。运行时界面保存的配置写入 `data/config.json`，并**优先于** `.env`；学习页面保存在 `data/pages.json`，两者均被 `.gitignore` 忽略。注意：开发模式下 Vite 代理固定指向 `http://localhost:3001`，修改 `PORT` 后需同步调整 `vite.config.js`。不配置时显示「内置知识库模式」，仍能完成解读与常见改造；配置后若请求失败或返回结构不完整，也会自动降级。模型调用固定使用 `temperature: 0.35` 与 JSON 输出格式。

---

## 技术栈

- **前端**：React 18 + Vite + [@xyflow/react](https://reactflow.dev/)（节点图可视化）
- **后端**：Express + Node 原生 fetch
- **存储**：本地 JSON 文件，无数据库依赖
- **AI**：OpenAI 兼容 Chat Completions 接口 + 内置知识库降级

## 目录结构

```
studycomfyui/
├── server/
│   ├── index.js           # API 路由
│   ├── workflowParser.js  # 两种工作流格式解析
│   ├── nodeKnowledge.js   # 内置节点知识库
│   ├── llm.js             # 大模型调用与无密钥降级
│   ├── prompts.js         # 解读 / 改造提示词
│   ├── annotate.js        # 改造差异标注
│   ├── htmlGenerator.js   # 学习页面 HTML 生成
│   └── storage.js         # 本地持久化
├── src/
│   ├── App.jsx            # 工作台主界面
│   ├── api.js
│   └── components/        # 侧边栏、输入、学习页、节点图、改造记录、设置
├── data/                  # pages.json（学习页面）与 config.json（运行时配置）
├── docs/                  # VitePress 双语文档站点与 GitHub Pages 部署
├── .github/workflows/     # GitHub Pages 自动部署
├── .env.example
└── README.md
```

## 主要接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查，返回 `ok` 与时间 |
| POST | `/api/parse` | 仅解析工作流，不生成学习页面 |
| POST | `/api/analyze` | 导入工作流，生成解读与学习页面 |
| POST | `/api/modify` | 对指定页面提出改造需求 |
| GET | `/api/pages` | 列出学习页面（不含完整改造记录，附 `modificationCount`） |
| GET | `/api/pages/:id` | 获取单个页面 |
| GET | `/api/pages/:id/html` | 导出独立学习页面 HTML |
| PUT | `/api/pages/:id` | 重命名 |
| DELETE | `/api/pages/:id` | 删除 |
| GET / POST | `/api/config` | 查看 / 保存模型配置（GET 返回 `configured`、`apiKeyMasked` 等；POST 可用 `apiKey: null` 清除密钥） |

---

## Roadmap

- [ ] 扩充内置节点知识库，覆盖更多自定义节点
- [ ] 支持一次改造多条需求，并保留中间版本对比
- [ ] 参数智能建议：根据当前工作流推荐更合理的 steps / cfg / 分辨率
- [ ] 学习页面导出为 Markdown / PDF
- [ ] 支持分享与导入他人生成的学习页面

欢迎提 Issue 或 PR，尤其是你常用的节点知识补充。

## 维护约定：代码与文档同步

每次新增功能、修改接口或调整配置时，请一并检查并更新：

1. 本文件（纯中文）：功能列表、使用指南、命令、接口表、目录结构。
2. `docs/guide.md` 与 `docs/en/guide.md`：文档站点的中英文快速开始。
3. `docs/.vitepress/theme/Home.vue`：文档站首页文案（中英文词条都在文件顶部的 `zh` / `en` 中）。
4. `.env.example` 与 `vite.config.js`：涉及环境变量或端口时。
5. `package.json`：涉及 npm 脚本时。
6. 执行 `npm run docs:build` 重建文档产物（GitHub Pages 部署在推送到 `main` 时自动完成）。

## 许可证

MIT
