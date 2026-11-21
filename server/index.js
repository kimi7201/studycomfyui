import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWorkflow, toApiFormat } from './workflowParser.js'
import { analyzeWorkflow, modifyWorkflow, getConfig, setConfig } from './llm.js'
import { annotateWorkflow } from './annotate.js'
import { generateLearningHtml } from './htmlGenerator.js'
import * as store from './storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT) || 3001

// 启动时载入用户在界面里保存过的模型配置
const savedConfig = store.readSavedConfig()
if (Object.keys(savedConfig).length) setConfig(savedConfig)

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))

function asyncRoute(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
    console.error('[API Error]', err)
    res.status(500).json({ error: err?.message || '服务器内部错误' })
  })
}

function extractWorkflowJson(input) {
  if (input && typeof input === 'object' && !Array.isArray(input)) return input
  const text = String(input || '').replace(/```(?:json)?/gi, '')
  const start = text.indexOf('{')
  if (start < 0) throw new Error('没有在输入中找到工作流 JSON（应以 { 开头）')
  for (let i = text.indexOf('}', start); i >= 0; i = text.indexOf('}', i + 1)) {
    try {
      const parsed = JSON.parse(text.slice(start, i + 1))
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      // 继续尝试下一个可能的结尾
    }
  }
  throw new Error('JSON 解析失败，请检查粘贴的工作流内容是否完整')
}

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))

app.get('/api/config', (_req, res) => {
  res.json({ ...getConfig(), saved: store.readSavedConfig() })
})

app.post('/api/config', (req, res) => {
  const previous = store.readSavedConfig()
  const patch = {}
  if (req.body?.apiKey === null) patch.apiKey = ''
  else if (typeof req.body?.apiKey === 'string' && req.body.apiKey.trim()) patch.apiKey = req.body.apiKey.trim()
  if (typeof req.body?.baseURL === 'string' && req.body.baseURL.trim()) patch.baseURL = req.body.baseURL.trim()
  if (typeof req.body?.model === 'string' && req.body.model.trim()) patch.model = req.body.model.trim()
  setConfig(patch)
  const next = { ...previous }
  if (patch.apiKey !== undefined) next.apiKey = patch.apiKey
  if (patch.baseURL !== undefined) next.baseURL = patch.baseURL
  if (patch.model !== undefined) next.model = patch.model
  store.writeSavedConfig(next)
  res.json({ ok: true, config: getConfig() })
})

app.get('/api/pages', (_req, res) => res.json({ pages: store.listPages() }))

app.get('/api/pages/:id', (req, res) => {
  const page = store.getPage(req.params.id)
  if (!page) return res.status(404).json({ error: '学习页面不存在' })
  res.json({ page })
})

app.get('/api/pages/:id/html', (req, res) => {
  const page = store.getPage(req.params.id)
  if (!page) return res.status(404).json({ error: '学习页面不存在' })
  res.type('html').send(generateLearningHtml(page))
})

app.delete('/api/pages/:id', (req, res) => {
  const ok = store.deletePage(req.params.id)
  if (!ok) return res.status(404).json({ error: '学习页面不存在' })
  res.json({ ok: true })
})

app.put('/api/pages/:id', (req, res) => {
  const patch = {}
  if (typeof req.body?.title === 'string' && req.body.title.trim()) patch.title = req.body.title.trim()
  const page = store.updatePage(req.params.id, patch)
  if (!page) return res.status(404).json({ error: '学习页面不存在' })
  res.json({ page })
})

app.post('/api/analyze', asyncRoute(async (req, res) => {
  const raw = extractWorkflowJson(req.body?.workflowJson ?? req.body?.prompt)
  const userPrompt = typeof req.body?.prompt === 'string' && req.body.prompt.includes('{') ? '' : String(req.body?.prompt || '')
  const parsed = parseWorkflow(raw)
  const analysis = await analyzeWorkflow(parsed, userPrompt)

  const page = store.createPage({
    title: analysis.title || '未命名学习页面',
    workflow: parsed,
    apiWorkflow: toApiFormat(parsed),
    analysis,
    engine: analysis.engine || 'knowledge',
  })
  res.json({ page })
}))

app.post('/api/modify', asyncRoute(async (req, res) => {
  const { pageId, prompt } = req.body || {}
  if (!pageId) return res.status(400).json({ error: '缺少 pageId' })
  if (!String(prompt || '').trim()) return res.status(400).json({ error: '请描述你想要的新功能' })

  const page = store.getPage(pageId)
  if (!page) return res.status(404).json({ error: '学习页面不存在' })

  const result = await modifyWorkflow({
    apiWorkflow: page.apiWorkflow || toApiFormat(page.workflow),
    summary: page.analysis?.summary || '',
    normalized: page.workflow,
  }, String(prompt))

  const annotatedWorkflow = annotateWorkflow(page.workflow, result.newWorkflow, result.changes)
  const record = {
    id: `${Date.now()}`,
    prompt: String(prompt),
    createdAt: new Date().toISOString(),
    explanation: result.explanation || '',
    changes: result.changes || {},
    newWorkflow: result.newWorkflow,
    summary: result.summary || '',
    engine: result.engine || 'knowledge',
  }

  const updated = store.updatePage(pageId, {
    workflow: annotatedWorkflow,
    apiWorkflow: result.newWorkflow,
    modifications: [...(page.modifications || []), record],
  })
  res.json({ page: updated, result: record })
}))

app.post('/api/parse', asyncRoute(async (req, res) => {
  const raw = extractWorkflowJson(req.body?.workflowJson ?? req.body?.prompt)
  res.json({ workflow: parseWorkflow(raw) })
}))

// 生产模式下托管前端构建产物
const dist = path.join(ROOT, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`\n  ComfyUI 学习工作台 API 已启动: http://localhost:${PORT}`)
  console.log(`  大模型状态: ${getConfig().configured ? `已配置 (${getConfig().model})` : '未配置，使用内置知识库模式'}\n`)
})
