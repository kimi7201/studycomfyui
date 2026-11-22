import { Plus, Trash2, BookOpen, Layers, Clock3, Sparkles } from 'lucide-react'

export default function Sidebar({ pages, activeId, onSelect, onDelete, onNew }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Layers size={20} /></div>
        <div>
          <div className="brand-title">ComfyUI 学习台</div>
          <div className="brand-sub">Workflow Study Workbench</div>
        </div>
      </div>

      <button className="new-btn" onClick={onNew}>
        <Plus size={17} /> 新建学习页面
      </button>

      <div className="side-label">
        <BookOpen size={14} /> 我的学习页面 <span>{pages.length}</span>
      </div>

      <div className="page-list">
        {pages.length === 0 && (
          <div className="side-empty">还没有学习页面<br />上传或粘贴一份工作流开始吧</div>
        )}
        {pages.map((page) => (
          <div
            key={page.id}
            className={`page-item ${page.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(page.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(page.id)}
          >
            <div className="page-item-top">
              <span className="page-title">{page.title}</span>
              <button
                className="icon-btn danger"
                title="删除这个学习页面"
                onClick={(e) => { e.stopPropagation(); onDelete(page) }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="page-meta">
              <Clock3 size={12} /> {new Date(page.updatedAt).toLocaleDateString('zh-CN')}
              {page.modificationCount > 0 && (
                <span className="mod-badge"><Sparkles size={11} /> {page.modificationCount} 次改造</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="side-footer">
        本地保存 · 可随时删除或保留
      </div>
    </aside>
  )
}
