# Quick Start

StudyComfyUI is a local learning workbench for ComfyUI workflows: import a workflow JSON and the AI explains every node; when you want a new feature, describe it in a prompt and the AI returns a color-coded modification plan with ComfyUI operation steps.

[中文版本](/guide)

## Installation

```bash
git clone https://github.com/your-username/studycomfyui.git
cd studycomfyui
npm install
npm run dev
```

Open `http://localhost:5173`. Requires Node.js >= 18. `npm run dev` starts the API (3001) and the frontend (5173) together.

Other scripts:

| Command | Description |
| --- | --- |
| `npm run dev:server` / `npm run dev:web` | Start the backend or frontend only |
| `npm run build` / `npm run preview` | Build the frontend into `dist/` / preview the build |
| `npm start` | Start the API and serve `dist/` if present, at `http://localhost:3001` |
| `npm run docs:dev` / `npm run docs:build` / `npm run docs:preview` | Develop (5174), build, and preview this docs site |

## Three Steps

1. **Import**: Export the workflow JSON from ComfyUI, paste it into the workbench, and click "Analyze & Generate Learning Page".
2. **Learn**: Review node-by-node explanations, parameter meanings, data flow, and the workflow graph.
3. **Modify**: Try a prompt like "add a LoRA node", check the reasons and steps in the modification log, then verify in ComfyUI.

## Model Configuration

Use **Settings** in the top-right to configure any OpenAI-compatible API (Key / Base URL / Model). When no key is configured — or when a request fails or returns an incomplete structure — the system falls back to the built-in knowledge base: 23 node types and 6 built-in intents (delete node, upscaling, LoRA, ControlNet, second sampling, preview intermediate results).

You can also copy `.env.example` to `.env`, which supports `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `PORT` (default 3001). Settings saved in the UI go to `data/config.json` and take precedence over `.env`; pages are stored in `data/pages.json`. The Vite dev proxy is hard-coded to port 3001, so changing `PORT` also requires updating `vite.config.js`.

## Main Endpoints

`GET /api/health` (health check), `POST /api/parse` (parse only), `POST /api/analyze` (analyze and create a page), `POST /api/modify` (modify), `GET/PUT/DELETE /api/pages/:id`, `GET /api/pages/:id/html`, `GET/POST /api/config`.

## Docs Maintenance

When adding or changing features, APIs, or configuration, update this file, `docs/guide.md`, `README.md` (Chinese only), and the homepage feature cards (`docs/.vitepress/theme/Home.vue`), then run `npm run docs:build`. For full details, see the project [README](https://github.com/your-username/studycomfyui).
