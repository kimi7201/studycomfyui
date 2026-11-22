import { Plus, Minus, Edit3, Link2, Unlink2, ListOrdered } from 'lucide-react'

const COLORS = { added: '#22c55e', removed: '#ef4444', modified: '#f59e0b' }

function ChangeList({ icon: Icon, title, items, tone, render }) {
  if (!items?.length) return null
  return (
    <div className="change-group">
      <h4 style={{ color: COLORS[tone] }}><Icon size={15} /> {title} <span>{items.length}</span></h4>
      <ul className="change-list">
        {items.map((item, i) => <li key={i} className={`tone-${tone}`}>{render(item)}</li>)}
      </ul>
    </div>
  )
}

export default function ModificationsView({ modifications = [] }) {
  if (!modifications.length) {
    return <div className="empty-state">还没有改造记录。在上方输入你的新功能需求，大模型会给出节点变更与具体操作步骤。</div>
  }

  return (
    <div className="mod-view">
      {[...modifications].reverse().map((m, idx) => {
        const c = m.changes || {}
        return (
          <section className="panel mod-panel" key={m.id}>
            <div className="mod-head">
              <span className="mod-seq">#{modifications.length - idx}</span>
              <div>
                <h2>改造需求</h2>
                <p className="mod-prompt">{m.prompt}</p>
              </div>
              <span className={`engine-tag ${m.engine}`}>{m.engine === 'llm' ? '大模型' : m.engine === 'assistant' ? 'CodeBuddy 助手' : '内置规则'}</span>
            </div>
            <p className="lead">{m.explanation}</p>

            <ChangeList icon={Plus} title="新增节点" items={c.addedNodes} tone="added" render={(n) => (
              <>
                <div className="change-title"><b>{n.type}</b><code>{n.id}</code></div>
                <p><b>为什么新增：</b>{n.reason}</p>
                {n.role && <p><b>作用：</b>{n.role}</p>}
                {n.params && Object.keys(n.params).length > 0 && (
                  <p><b>建议参数：</b>{Object.entries(n.params).map(([k, v]) => `${k}=${String(v)}`).join('，')}</p>
                )}
                {(n.operationSteps || []).length > 0 && (
                  <div className="steps-box">
                    <div className="steps-title"><ListOrdered size={14} /> 在 ComfyUI 中的具体操作步骤</div>
                    <ol>{n.operationSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                  </div>
                )}
              </>
            )} />

            <ChangeList icon={Minus} title="删除节点" items={c.removedNodes} tone="removed" render={(n) => (
              <><div className="change-title"><b>{n.type}</b><code>{n.id}</code></div><p>{n.reason}</p></>
            )} />

            <ChangeList icon={Edit3} title="修改节点" items={c.modifiedNodes} tone="modified" render={(n) => (
              <><div className="change-title"><b>{n.type}</b><code>{n.id}</code></div><p>{n.what}。{n.reason}</p></>
            )} />

            <ChangeList icon={Link2} title="新增连线" items={c.addedLinks} tone="added" render={(l) => (
              <><span className="link-route">{l.from} → {l.to}</span><span className="link-type">{l.type}</span> {l.reason}</>
            )} />

            <ChangeList icon={Unlink2} title="删除连线" items={c.removedLinks} tone="removed" render={(l) => (
              <><span className="link-route">{l.from} → {l.to}</span> {l.reason}</>
            )} />

            {m.summary && <div className="why-box mod-summary"><span>{m.summary}</span></div>}
          </section>
        )
      })}
    </div>
  )
}
