import { useEffect, useState } from 'react'
import { Settings, Download, BookOpen, Network, Sparkles, CheckCircle2, AlertCircle, Lightbulb, FileJson, WandSparkles } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Composer from './components/Composer.jsx'
import LearningView from './components/LearningView.jsx'
import WorkflowGraph from './components/WorkflowGraph.jsx'
import ModificationsView from './components/ModificationsView.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import { api } from './api.js'

export default function App() {
  const [pages, setPages] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [page, setPage] = useState(null)
  const [tab, setTab] = useState('learn')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [config, setConfig] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const notify = (message, type = 'success') => setToast({ message, type })

  useEffect(() => {
    api.listPages().then((d) => setPages(d.pages || [])).catch((e) => notify(e.message, 'error'))
    api.getConfig().then(setConfig).catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(timer)
  }, [toast])

  const refreshPages = async () => {
    const d = await api.listPages()
    setPages(d.pages || [])
  }

  const loadPage = async (id) => {
    try {
      const d = await api.getPage(id)
      setPage(d.page)
      setActiveId(id)
      setTab('learn')
    } catch (e) { notify(e.message, 'error') }
  }

  const handleAnalyze = async (prompt) => {
    setBusy(true)
    try {
      const d = await api.analyze(prompt)
      setPage(d.page)
      setActiveId(d.page.id)
      setTab('learn')
      await refreshPages()
      notify(`学习页面「${d.page.title}」已生成`)
    } catch (e) { notify(e.message, 'error') }
    finally { setBusy(false) }
  }

  const handleModify = async (prompt) => {
    if (!activeId) return
    setBusy(true)
    try {
      const d = await api.modify(activeId, prompt)
      setPage(d.page)
      setTab('mods')
      await refreshPages()
      notify('工作流改造完成，新增与删除已用颜色标出')
    } catch (e) { notify(e.message, 'error') }
    finally { setBusy(false) }
  }

  const handleDelete = async (target) => {
    if (!window.confirm(`确定删除学习页面「${target.title}」吗？此操作不可恢复。`)) return
    try {
      await api.deletePage(target.id)
      if (activeId === target.id) { setPage(null); setActiveId(null) }
      await refreshPages()
      notify('学习页面已删除')
    } catch (e) { notify(e.message, 'error') }
  }

  const handleNew = () => {
    setPage(null)
    setActiveId(null)
    setTab('learn')
  }

  const handleTitleBlur = async (e) => {
    const title = e.target.value.trim()
    if (!page || !title || title === page.title) return
    try {
      const d = await api.updatePage(page.id, title)
      setPage(d.page)
      await refreshPages()
    } catch (err) { notify(err.message, 'error') }
  }

  const handleSaveConfig = async (form) => {
    try {
      const d = await api.saveConfig(form)
      setConfig(d.config)
      setSettingsOpen(false)
      notify(d.config.configured ? '模型配置已保存' : '已切换为内置知识库模式')
    } catch (e) { notify(e.message, 'error') }
  }

  const handleClearKey = async () => {
    try {
      const d = await api.saveConfig({ apiKey: null })
      setConfig(d.config)
      setSettingsOpen(false)
      notify('已清除密钥，切换为内置知识库模式')
    } catch (e) { notify(e.message, 'error') }
  }

  return (
    <div className="app">
      <Sidebar
        pages={pages}
        activeId={activeId}
        onSelect={loadPage}
        onDelete={handleDelete}
        onNew={handleNew}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            {page ? (
              <input
                className="title-input"
                value={page.title}
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                onBlur={handleTitleBlur}
                title="点击可修改标题"
              />
            ) : <span className="topbar-title">学习工作台</span>}
          </div>
          <div className="topbar-right">
            <span className={`engine-tag ${config?.configured ? 'llm' : 'knowledge'}`}>
              <Sparkles size={13} /> {config?.configured ? `大模型 · ${config.model}` : '内置知识库模式'}
            </span>
            {page && (
              <a className="ghost-btn" href={api.htmlUrl(page.id)} target="_blank" rel="noreferrer">
                <Download size={15} /> 导出 HTML
              </a>
            )}
            <button className="ghost-btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={15} /> 设置
            </button>
          </div>
        </header>

        <div className="content">
          <Composer mode={page ? 'modify' : 'new'} busy={busy} onSubmit={page ? handleModify : handleAnalyze} />

          {page ? (
            <>
              <div className="tabs">
                <button className={`tab ${tab === 'learn' ? 'active' : ''}`} onClick={() => setTab('learn')}>
                  <BookOpen size={15} /> 学习解读
                </button>
                <button className={`tab ${tab === 'graph' ? 'active' : ''}`} onClick={() => setTab('graph')}>
                  <Network size={15} /> 工作流图
                </button>
                <button className={`tab ${tab === 'mods' ? 'active' : ''}`} onClick={() => setTab('mods')}>
                  <WandSparkles size={15} /> 改造记录
                  {page.modifications?.length > 0 && <span className="tab-count">{page.modifications.length}</span>}
                </button>
              </div>
              <div className="tab-content">
                {tab === 'learn' && <LearningView analysis={page.analysis} workflow={page.workflow} />}
                {tab === 'graph' && <WorkflowGraph workflow={page.workflow} />}
                {tab === 'mods' && <ModificationsView modifications={page.modifications} />}
              </div>
            </>
          ) : (
            <div className="welcome">
              <div className="welcome-card">
                <div className="welcome-icon"><Lightbulb size={26} /></div>
                <h2>把工作流读懂，再动手改造</h2>
                <p>粘贴一份 ComfyUI 工作流 JSON，工作台会自动识别每个节点的作用、参数含义与设计原因，生成一份可长期保存的学习页面。</p>
              </div>
              <div className="feature-grid">
                <div className="feature"><FileJson size={20} /><b>导入即解读</b><span>兼容 UI 格式与 API 格式，逐节点讲清参数为什么这样设。</span></div>
                <div className="feature"><BookOpen size={20} /><b>学习页面留存</b><span>生成的内容保存在工作台，随时打开、重命名、导出 HTML 或删除。</span></div>
                <div className="feature"><WandSparkles size={20} /><b>按需求改造</b><span>提出新功能，标出新增/删除节点与连线，并给出 ComfyUI 具体操作步骤。</span></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <SettingsModal open={settingsOpen} initial={config} onClose={() => setSettingsOpen(false)} onSave={handleSaveConfig} onClear={handleClearKey} />

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
