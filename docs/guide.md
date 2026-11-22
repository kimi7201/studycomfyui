# 快速开始

StudyComfyUI 是一个本地运行的 ComfyUI 工作流学习工作台：导入工作流 JSON，AI 逐节点讲清原理；想加功能时用 prompt 提需求，AI 给出带颜色标注的改造方案与 ComfyUI 操作步骤。

## 安装

```bash
git clone https://github.com/your-username/studycomfyui.git
cd studycomfyui
npm install
npm run dev
```

打开 `http://localhost:5173`。要求 Node.js >= 18。`npm run dev` 同时启动 API（3001）和前端（5173）。已有学习页面时，工作台启动后会自动打开最近更新的那一页；也可用 `?page=<页面ID>` 直接指定。当前选中的页面会被记住，刷新后仍保持。

其他命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev:server` / `npm run dev:web` | 单独启动后端 / 前端 |
| `npm run build` / `npm run preview` | 构建前端到 `dist/` / 预览构建产物 |
| `npm start` | 启动 API 并托管 `dist/`（若存在），访问 `http://localhost:3001` |
| `npm run docs:dev` / `npm run docs:build` / `npm run docs:preview` | 文档站点开发（5174）/ 构建 / 预览 |

## 三步上手

1. **导入**：在 ComfyUI 中导出工作流 JSON，点击工作台「上传 JSON」选择文件，或直接粘贴到输入框，再点击「解读并生成学习页面」。
2. **学习**：查看逐节点解读、参数含义、数据流动过程和工作流图。工作台的「工作流图」页默认保留原画布坐标，新增节点就近放置、删除节点以虚线幽灵节点留在原位，增删改理由直接标在节点上；可用「聚焦改动」放大变更区，也可切换「按功能分区」视图；点击节点会在右侧弹出解读面板；导出的独立 HTML 中，点击结构图节点同样会弹出该节点的作用、参数、输入/输出与常见前后连接；结构图支持滚轮/按钮缩放、拖拽平移和一键适应窗口。导出页可下载改造后工作流 JSON 与依赖清单 JSON，并列出模型文件、目标目录、自定义节点及可确认的 `git clone` 地址。
3. **改造**：输入「帮我加一个 LoRA 节点」这类需求，在改造记录里看新增/删除原因与具体操作步骤，再回到 ComfyUI 动手验证。

## 模型配置

右上角「设置」可填任意 OpenAI 兼容 API（Key / Base URL / 模型名）。不填，或请求失败、返回结构不完整时，会自动切换到内置知识库模式：覆盖 23 类节点，内置规则支持删除节点、超分放大、LoRA、ControlNet、二次采样、预览中间结果。

也可复制 `.env.example` 为 `.env`，支持 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`、`PORT`（默认 3001）。界面保存的配置写入 `data/config.json` 并优先于 `.env`；页面数据保存在 `data/pages.json`。开发模式下 Vite 代理固定指向 3001，修改 `PORT` 需同步改 `vite.config.js`。

## 常用接口

`GET /api/health`（健康检查）、`POST /api/parse`（仅解析）、`POST /api/analyze`（解读并建页）、`POST /api/modify`（改造）、`GET/PUT/DELETE /api/pages/:id`、`GET /api/pages/:id/html`、`GET/POST /api/config`。

## 文档维护

新增或修改功能、接口、配置时，同步更新本文件、`docs/en/guide.md`、`README.md`（纯中文）、首页功能卡片（`docs/.vitepress/theme/Home.vue`）和 `CHANGELOG.md`，并运行 `npm run docs:build`。详细功能说明见项目 [README](https://github.com/your-username/studycomfyui)。

[English version](/en/guide)
