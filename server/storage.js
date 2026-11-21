import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const PAGES_FILE = path.join(DATA_DIR, 'pages.json')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(PAGES_FILE)) fs.writeFileSync(PAGES_FILE, '[]', 'utf8')
}

function readPages() {
  ensure()
  try {
    const data = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writePages(pages) {
  ensure()
  fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2), 'utf8')
}

export function listPages() {
  return readPages().map(({ modifications = [], ...rest }) => ({
    ...rest,
    modificationCount: modifications.length,
  })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getPage(id) {
  return readPages().find((p) => p.id === id) || null
}

export function createPage(data) {
  const pages = readPages()
  const now = new Date().toISOString()
  const page = {
    id: crypto.randomUUID(),
    title: data.title || '未命名学习页面',
    createdAt: now,
    updatedAt: now,
    workflow: data.workflow || null,
    apiWorkflow: data.apiWorkflow || null,
    analysis: data.analysis || {},
    modifications: [],
    engine: data.engine || 'knowledge',
  }
  pages.push(page)
  writePages(pages)
  return page
}

export function updatePage(id, patch) {
  const pages = readPages()
  const index = pages.findIndex((p) => p.id === id)
  if (index < 0) return null
  pages[index] = { ...pages[index], ...patch, id, updatedAt: new Date().toISOString() }
  writePages(pages)
  return pages[index]
}

export function deletePage(id) {
  const pages = readPages()
  const next = pages.filter((p) => p.id !== id)
  if (next.length === pages.length) return false
  writePages(next)
  return true
}

// 运行时配置持久化（仅保存用户填写的字段，不覆盖 .env 的默认行为）
export function readSavedConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {}
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  } catch {
    return {}
  }
}

export function writeSavedConfig(config) {
  ensure()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}
