# StudyComfyUI

![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express-61dafb)

> 🇨🇳 **一个让你「看得懂、改得动」ComfyUI 工作流的开源学习工作台。**
> 🌐 **An open-source learning workbench that helps you truly understand and modify ComfyUI workflows.**

> **中文**：导入一份工作流 JSON，AI 帮你逐节点讲清作用、参数与设计原理；当你想加功能时，直接用 prompt 提需求，AI 给出节点改造方案、用颜色标出新增与删除，并告诉你在 ComfyUI 里具体要点哪里、怎么连线。
> 目标不是替你生成图，而是让你**看懂别人的工作流，改出自己的工作流**——在学中做，在做中学。
>
> **English**: Import a workflow JSON and the AI explains every node — its purpose, parameters, and design rationale. When you want to add a feature, just describe it in a prompt: the AI proposes a node-level modification, highlights additions and deletions in color, and tells you exactly where to click and how to connect wires in ComfyUI.
> The goal is not to generate images for you, but to help you **understand others' workflows and build your own** — learning by doing, and doing by learning.

---

## 为什么会有这个项目 / Why This Project

**中文**：如果你符合下面任意一条，这个项目就是为你做的：

**English**: If any of the following sounds like you, this project is for you:

- **中文**：从网上下载了一份 ComfyUI 工作流 JSON，导入后能跑出图，但**完全看不懂那一堆节点在干什么**、为什么这么连。
  **EN**: You downloaded a ComfyUI workflow JSON, imported it and got images — but you have **no idea what those nodes do** or why they are connected that way.
- **中文**：想给现有工作流加个功能（比如「加个 LoRA」「高清放大」「线稿控制」），但**不知道该加哪个节点、加在哪、线从哪拖到哪**。
  **EN**: You want to add a feature to an existing workflow (a LoRA, high-resolution upscaling, line-art control), but **don't know which node to add, where to put it, or which wires to connect**.
- **中文**：看过不少教程，但教程只告诉你「照着连」，从不解释**为什么这么设计**，换个场景还是不会改。
  **EN**: You've followed tutorials that only say "connect it like this" and never explain **why it's designed that way**, so a new scenario still leaves you stuck.
- **中文**：对 ComfyUI 有兴趣，但被节点图劝退，想有一个能**边看边学、边改边学**的地方。
  **EN**: You're curious about ComfyUI but intimidated by node graphs, and want a place to **learn by reading and by doing**.

**中文**：传统教程是「给你一条鱼」，StudyComfyUI 想做的是「带你看懂鱼的结构，再教你亲手改一条」。

**English**: Traditional tutorials "give you a fish". StudyComfyUI wants to show you how the fish is built, then teach you to modify one yourself.

## 核心理念：学中做，做中学 / Core Philosophy: Learn by Doing

```
看懂工作流  →  提出改造需求  →  得到带标注的改动  →  回到 ComfyUI 动手  →  再看懂一层
Understand  →  Request a change  →  Get annotated changes  →  Apply in ComfyUI  →  Understand deeper
```

**中文**：每一轮改造都会输出三样东西：**改了哪些节点**、**为什么这么改**、**在 ComfyUI 里具体怎么操作**。你不是被动接收答案，而是拿着答案回到画布上验证，再从结果里提出下一个问题。

**English**: Every iteration produces three things: **which nodes changed**, **why they changed**, and **how to do it in ComfyUI**. You don't just receive answers passively — you take them back to the canvas to verify, then ask the next question based on what you see.

---

## 主要工作 / What This Project Does

本项目围绕「降低 ComfyUI 工作流的理解与修改门槛」做了以下工作 / To lower the barrier to understanding and modifying ComfyUI workflows, the project provides:

1. **工作流结构化解析 / Structured Workflow Parsing**
   兼容 ComfyUI 的 UI/图格式（`nodes` + `links`）和 API 格式（`{ "id": { class_type, inputs } }`），统一解析成可读的节点、参数与连线结构，作为后续解读与改造的基础。
   Supports both the ComfyUI UI/graph format (`nodes` + `links`) and the API format (`{ "id": { class_type, inputs } }`), normalizing them into readable nodes, parameters, and connections as the foundation for interpretation and modification.

2. **AI 驱动的智能解读 / AI-Powered Interpretation**
   大模型逐节点解释：这个节点是干什么的、每个参数当前值控制什么、为什么工作流要这么设计；同时梳理整条链路的数据流动过程，输出结构化学习要点。
   The LLM explains each node — what it does, what each current parameter controls, and why the workflow is designed this way — and traces the data flow through the entire chain, producing structured learning notes.

3. **学习页面生成与持久化 / Learning Page Generation & Persistence**
   解读结果自动生成学习页面，保存在本地工作台中，可长期保留、重命名、删除，也能一键导出为独立 HTML 文件离线阅读。
   Interpretations automatically generate a learning page stored in the local workbench. Keep it long-term, rename it, delete it, or export it as a standalone HTML file for offline reading.

4. **基于 prompt 的智能节点改造 / Prompt-Driven Node Modification**
   用户用自然语言提出新功能需求，AI 判断需要增加、删除或修改哪些节点，输出完整的新工作流，并在提示词中强制要求说明**新增节点的必要性**和**可执行的 ComfyUI 操作步骤**。注意：代码只校验返回结构（`newWorkflow` 与 `changes`），不验证节点类型、连线合法性或工作流是否真正可运行。
   Describe a new feature in natural language. The AI determines which nodes to add, remove, or change and outputs a complete new workflow, with prompt-level requirements to explain **why new nodes are necessary** and **the exact ComfyUI steps to apply**. Note: the code only validates the response shape (`newWorkflow` and `changes`); it does not verify node types, link validity, or actual runnability.

5. **可视化差异标注 / Visual Diff Annotation**
   在工作流图上用颜色标注改动：绿色=新增，红色=删除，黄色=修改，删除的连线用虚线表示；改造记录页同步列出原因与操作步骤。
   Colors mark every change on the graph: green = added, red = removed, yellow = modified; deleted links are drawn as dashed lines. The modification log lists the reasons and operation steps alongside.

6. **双引擎兜底 / Dual-Engine Fallback**
   配置任意 OpenAI 兼容 API 时调用大模型；未配置，或请求失败 / 返回结构不完整时，自动切换到内置节点知识库与改造规则。内置知识库覆盖 23 类常见节点；内置改造规则支持删除节点、超分放大、LoRA、ControlNet、二次采样、预览中间结果 6 类意图，未命中时会给出提示。
   With an OpenAI-compatible API configured, the LLM is used; without one — or when the request fails or returns an incomplete structure — the system automatically falls back to a built-in knowledge base and modification rules. The knowledge base covers 23 common node types; the built-in rules handle 6 intents: delete node, upscaling, LoRA, ControlNet, second sampling, and preview intermediate results, with a hint when a request doesn't match.

---

## 功能特性 / Features

- **导入即解读 / Import & Analyze**：粘贴 JSON 即可，UI 格式与 API 格式都支持。Paste JSON and go — both UI and API formats are supported.
- **逐节点讲解 / Node-by-Node Explanation**：作用、参数含义、设计意图，一个不漏。Purpose, parameter meanings, and design intent — nothing is missed.
- **数据流动讲解 / Data Flow Walkthrough**：按执行顺序说明每一步的输入来自哪里、输出流向哪里。Follows execution order to show where each step's inputs come from and where its outputs go.
- **学习页面留存 / Persistent Learning Pages**：打开、重命名、导出 HTML、删除，全在工作台内完成。Open, rename, export to HTML, and delete — all inside the workbench.
- **按需求改造 / Modify by Request**：加 LoRA、超分放大、ControlNet、二次采样、预览中间结果、删除节点…… Add a LoRA, upscale, ControlNet, a second sampling pass, preview intermediate results, remove nodes…
- **颜色化差异 / Color-Coded Diffs**：新增/删除/修改节点与连线一目了然。Added, removed, and modified nodes and links are visible at a glance.
- **操作指引 / Operation Guides**：每个新增节点都写明「为什么新增」+「在 ComfyUI 中右键搜什么、参数怎么设、线怎么拖」。Every new node includes "why it was added" plus "what to right-click search in ComfyUI, how to set parameters, and how to drag the wires".
- **零配置可用 / Zero-Config Ready**：内置知识库模式无需任何 API Key。The built-in knowledge base mode needs no API key.
- **快捷操作 / Keyboard Shortcuts**：`Ctrl / ⌘ + Enter` 快速提交；改造页提供 5 个示例 prompt 一键填入。Press `Ctrl / ⌘ + Enter` to submit; the modification view offers 5 one-click example prompts.
- **交互式工作流图 / Interactive Graph**：节点可拖拽、画布可缩放，带 MiniMap 与控件；新增连线带动画，删除节点以虚线「幽灵节点」保留用于教学对照。Drag nodes, zoom the canvas, use the MiniMap and controls; new links are animated and deleted nodes remain as dashed "ghost nodes" for teaching comparison.
- **独立 HTML 学习页 / Standalone HTML Page**：导出内容含内联 SVG 工作流示意图、差异图例、完整改造历史与操作步骤，点击「导出 HTML」会在新标签页打开。The export includes an inline SVG workflow diagram, a color legend, the full modification history and operation steps; "Export HTML" opens it in a new tab.

---

## 快速开始 / Quick Start

**中文**：

```bash
git clone https://github.com/your-username/studycomfyui.git
cd studycomfyui
npm install
npm run dev
```

打开 <http://localhost:5173>。`npm run dev` 会同时启动 API 服务（3001）和前端页面（5173）。

**English**:

```bash
git clone https://github.com/your-username/studycomfyui.git
cd studycomfyui
npm install
npm run dev
```

Open <http://localhost:5173>. `npm run dev` starts the API server (3001) and the frontend (5173) together.

生产模式 / Production mode:

```bash
npm run build
npm start
```

**中文**：此时访问 <http://localhost:3001>。要求 Node.js >= 18。`npm start` 只有在 `dist/` 已构建时才会托管前端；否则只提供 API。

**English**: Then visit <http://localhost:3001>. Requires Node.js >= 18. `npm start` serves the frontend only when `dist/` exists; otherwise it provides the API only.

### 全部命令 / All Scripts

| 命令 / Command | 说明 / Description |
| --- | --- |
| `npm run dev` | 同时启动 API（3001）与前端（5173）/ Start API (3001) + frontend (5173) |
| `npm run dev:server` / `npm run dev:web` | 单独启动后端 / 前端 / Start backend or frontend only |
| `npm run build` | 构建前端到 `dist/` / Build frontend into `dist/` |
| `npm run preview` | 本地预览构建产物 / Preview the production build |
| `npm start` | 启动 API 并托管 `dist/`（若存在）/ Start API and serve `dist/` if present |
| `npm run docs:dev` / `npm run docs:build` / `npm run docs:preview` | VitePress 文档站点的开发（5174）/ 构建 / 预览 / Develop (5174), build, and preview the VitePress docs |

### 文档站点 / Documentation Site

**中文**：文档位于 `docs/`，使用 VitePress；`.github/workflows/deploy.yml` 会在推送到 `main` 后自动构建并部署到 GitHub Pages（base 为 `/studycomfyui/`）。修改文档或功能后，需同步更新 `README.md` 与 `docs/`，详见文末「维护约定」。

**English**: Docs live in `docs/` and use VitePress. `.github/workflows/deploy.yml` builds and deploys them to GitHub Pages (base `/studycomfyui/`) on every push to `main`. After changing docs or features, update both `README.md` and `docs/` — see "Maintenance" at the end.

---

## 使用指南 / How to Use

### 1. 导入工作流 / Import a Workflow

**中文**：在 ComfyUI 中导出工作流 JSON（`Workflow → Export (API Format)`，或直接保存界面 JSON），粘贴到工作台顶部输入框，点击「解读并生成学习页面」。也支持粘贴带 JSON 代码围栏或前后带说明文字的内容；跟在 JSON 后面的文字会作为你关注的重点传给解读。

**English**: Export your workflow JSON in ComfyUI (`Workflow → Export (API Format)`, or simply save the UI JSON), paste it into the input box at the top of the workbench, and click **Analyze & Generate Learning Page**. Inputs wrapped in a fenced JSON code block or surrounded by free text are also accepted; text after the JSON is passed to the analysis as your focus point.

### 2. 学习原理 / Learn the Principles

**中文**：在「学习解读」页查看逐节点讲解与数据流动过程；在「工作流图」页查看节点与连线结构。不懂哪个节点，就回到这一页翻它的参数含义与设计原因。

**English**: Review the node-by-node explanations and data flow on the **Learning** tab, and inspect the node/link structure on the **Workflow Graph** tab. Whenever a node is unclear, come back here for its parameter meanings and design rationale.

### 3. 提出改造需求 / Request a Modification

**中文**：在顶部输入框直接用自然语言描述，例如：

**English**: Describe what you want in the top input box in plain language, for example:

| 你说 / You say | AI 会做什么 / What the AI does |
| --- | --- |
| 帮我加一个 LoRA 节点来强化画风 / Add a LoRA node to strengthen the art style | 插入 `LoraLoader`，重接 MODEL / CLIP，给出 LoRA 文件放置目录与强度建议 / Inserts `LoraLoader`, reconnects MODEL / CLIP, and suggests where to put the LoRA file and what strength to use |
| 在保存前增加 4 倍超分放大 / Add 4× upscaling before saving | 插入 `UpscaleModelLoader` + `ImageUpscaleWithModel`，改接 SaveImage 的输入 / Inserts `UpscaleModelLoader` + `ImageUpscaleWithModel` and rewires SaveImage's input |
| 加入 ControlNet 线稿控制构图 / Add ControlNet line-art control for composition | 插入 `ControlNetLoader` + `CannyEdgePreprocessor` + `ApplyControlNet`，并提示需要参考图 / Inserts the three nodes above and reminds you to provide a reference image |
| 增加潜空间放大和二次采样细化 / Add latent upscaling and a second sampling pass | 插入 `LatentUpscale` + 第二个 `KSampler`，解释 denoise 取值的影响 / Inserts `LatentUpscale` + a second `KSampler` and explains how denoise values affect the result |
| 删掉某个节点 / 预览中间结果 / Remove a node / preview intermediate results | 移除节点并清理连线，或插入 `PreviewImage` / Removes the node and cleans up its links, or inserts `PreviewImage` |

### 4. 动手验证与留存 / Verify and Keep

**中文**：到「改造记录」页查看新增节点的原因和 ComfyUI 操作步骤，到「工作流图」页看着色后的结构变化，然后**回到 ComfyUI 按步骤实际改一遍**。满意就留着页面，不需要就在左侧列表删除（有二次确认）；也可点「导出 HTML」在新标签页打开独立学习页面。标题框失焦即保存，操作结果会有 toast 提示。

**English**: Check the **Modification Log** for why each node was added and the ComfyUI steps, view the color-coded structure on the **Workflow Graph** tab, then **go back to ComfyUI and actually apply the changes step by step**. Keep the page if it's useful, delete it from the sidebar if not (with a confirmation prompt), or click **Export HTML** to open a standalone learning page in a new tab. The title saves on blur, and results are reported via toast notifications.

---

## 模型配置（可选）/ Model Configuration (Optional)

**中文**：点击右上角「设置」：

**English**: Click **Settings** in the top-right corner:

- `API Key`：密钥 / the API key
- `Base URL`：任意 OpenAI 兼容地址，如 `https://api.openai.com/v1`、DeepSeek、通义、本地 Ollama / Any OpenAI-compatible endpoint, such as `https://api.openai.com/v1`, DeepSeek, Qwen, or a local Ollama instance
- `模型名称` / `Model Name`：如 `gpt-4o-mini` / e.g. `gpt-4o-mini`

**中文**：也可复制 `.env.example` 为 `.env`，支持 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`、`PORT`（默认 `3001`）四个变量。运行时界面保存的配置写入 `data/config.json`，并**优先于** `.env`；学习页面保存在 `data/pages.json`，两者均被 `.gitignore` 忽略。注意：开发模式下 Vite 代理固定指向 `http://localhost:3001`，修改 `PORT` 后需同步调整 `vite.config.js`。不配置时显示「内置知识库模式」，仍能完成解读与常见改造；配置后若请求失败或返回结构不完整，也会自动降级。模型调用固定使用 `temperature: 0.35` 与 JSON 输出格式。

**English**: You can also copy `.env.example` to `.env`, which supports `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `PORT` (default `3001`). Settings saved in the UI go to `data/config.json` and take **precedence over** `.env`; learning pages are stored in `data/pages.json`. Both are ignored by `.gitignore`. Note: the Vite dev proxy is hard-coded to `http://localhost:3001`, so changing `PORT` also requires updating `vite.config.js`. Without configuration, **Built-in Knowledge Base Mode** is shown and interpretation plus common modifications still work; the same fallback applies when a configured API request fails or returns an incomplete structure. Model calls use `temperature: 0.35` and JSON response format.

---

## 技术栈 / Tech Stack

- **前端 / Frontend**：React 18 + Vite + [@xyflow/react](https://reactflow.dev/)（节点图可视化 / node graph visualization）
- **后端 / Backend**：Express + Node 原生 fetch / native Node fetch
- **存储 / Storage**：本地 JSON 文件，无数据库依赖 / Local JSON files, no database required
- **AI**：OpenAI 兼容 Chat Completions 接口 + 内置知识库降级 / OpenAI-compatible Chat Completions API with built-in knowledge base fallback

## 目录结构 / Project Structure

```
studycomfyui/
├── server/
│   ├── index.js           # API 路由 / API routes
│   ├── workflowParser.js  # 两种工作流格式解析 / parsing both workflow formats
│   ├── nodeKnowledge.js   # 内置节点知识库 / built-in node knowledge base
│   ├── llm.js             # 大模型调用与无密钥降级 / LLM calls and keyless fallback
│   ├── prompts.js         # 解读 / 改造提示词 / interpretation & modification prompts
│   ├── annotate.js        # 改造差异标注 / modification diff annotation
│   ├── htmlGenerator.js   # 学习页面 HTML 生成 / learning page HTML generation
│   └── storage.js         # 本地持久化 / local persistence
├── src/
│   ├── App.jsx            # 工作台主界面 / main workbench UI
│   ├── api.js
│   └── components/        # 侧边栏、输入、学习页、节点图、改造记录、设置 / sidebar, input, learning page, graph, modification log, settings
├── data/                  # pages.json（学习页面）与 config.json（运行时配置）/ pages and runtime config
├── docs/                  # VitePress 文档站点与 GitHub Pages 部署 / VitePress site and GitHub Pages deploy
├── .github/workflows/     # GitHub Pages 自动部署 / GitHub Pages deployment
├── .env.example
└── README.md
```

## 主要接口 / Main API Endpoints

| 方法 / Method | 路径 / Path | 说明 / Description |
| --- | --- | --- |
| GET | `/api/health` | 健康检查，返回 `ok` 与时间 / Health check returning `ok` and timestamp |
| POST | `/api/parse` | 仅解析工作流，不生成学习页面 / Parse a workflow only, without creating a page |
| POST | `/api/analyze` | 导入工作流，生成解读与学习页面 / Import a workflow and generate interpretation + learning page |
| POST | `/api/modify` | 对指定页面提出改造需求 / Request a modification for a specific page |
| GET | `/api/pages` | 列出学习页面（不含完整改造记录，附 `modificationCount`）/ List pages (without full modification records, includes `modificationCount`) |
| GET | `/api/pages/:id` | 获取单个页面 / Get a single page |
| GET | `/api/pages/:id/html` | 导出独立学习页面 HTML / Export a standalone learning page as HTML |
| PUT | `/api/pages/:id` | 重命名 / Rename |
| DELETE | `/api/pages/:id` | 删除 / Delete |
| GET / POST | `/api/config` | 查看 / 保存模型配置（GET 返回 `configured`、`apiKeyMasked` 等；POST 可用 `apiKey: null` 清除密钥）/ Get / save configuration (GET returns `configured`, `apiKeyMasked`, etc.; POST accepts `apiKey: null` to clear the key) |

---

## Roadmap / 路线图

- [ ] 扩充内置节点知识库，覆盖更多自定义节点 / Expand the built-in node knowledge base to cover more custom nodes
- [ ] 支持一次改造多条需求，并保留中间版本对比 / Support multiple modification requests at once and keep intermediate versions for comparison
- [ ] 参数智能建议：根据当前工作流推荐更合理的 steps / cfg / 分辨率 / Smart parameter suggestions: recommend better steps / cfg / resolution based on the current workflow
- [ ] 学习页面导出为 Markdown / PDF / Export learning pages to Markdown / PDF
- [ ] 支持分享与导入他人生成的学习页面 / Share and import learning pages generated by others

**中文**：欢迎提 Issue 或 PR，尤其是你常用的节点知识补充。

**English**: Issues and PRs are welcome — especially additions of node knowledge for the nodes you use most.

## 维护约定：代码与文档同步 / Maintenance: Keep Code and Docs in Sync

**中文**：每次新增功能、修改接口或调整配置时，请一并检查并更新：

1. 本文件（中英双语）：功能列表、使用指南、命令、接口表、目录结构。
2. `docs/guide.md` 与 `docs/.vitepress/theme/Home.vue`：文档站点的快速开始与功能卡片。
3. `.env.example` 与 `vite.config.js`：涉及环境变量或端口时。
4. `package.json`：涉及 npm 脚本时。
5. 执行 `npm run docs:build` 重建文档产物（GitHub Pages 部署在推送到 `main` 时自动完成）。

**English**: Whenever you add a feature, change an API, or adjust configuration, also review and update:

1. This README (bilingual): features, how-to, scripts, endpoint table, project structure.
2. `docs/guide.md` and `docs/.vitepress/theme/Home.vue`: docs-site quick start and feature cards.
3. `.env.example` and `vite.config.js`: when environment variables or ports change.
4. `package.json`: when npm scripts change.
5. Run `npm run docs:build` to refresh docs output (GitHub Pages deploys automatically on push to `main`).

## 许可证 / License

MIT
