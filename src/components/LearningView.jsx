import { Lightbulb, GitBranch, Wand2, Hash } from 'lucide-react'

export default function LearningView({ analysis, workflow }) {
  const a = analysis || {}
  const nodes = a.nodes || []
  const paragraphs = String(a.flowExplanation || '').split(/\n+/).filter(Boolean)

  return (
    <div className="learning-view">
      <div className="stat-row">
        <div className="stat"><Hash size={15} /><b>{workflow?.nodes?.length || 0}</b><span>个节点</span></div>
        <div className="stat"><GitBranch size={15} /><b>{workflow?.links?.length || 0}</b><span>条连线</span></div>
        <div className="stat"><Wand2 size={15} /><b>{nodes.length}</b><span>条节点解读</span></div>
      </div>

      <section className="panel">
        <h2>工作流概览</h2>
        <p className="lead">{a.summary || '暂无概览'}</p>
      </section>

      <section className="panel">
        <h2>数据在流程中如何流动</h2>
        {paragraphs.length ? (
          <div className="flow-steps">
            {paragraphs.map((p, i) => <div className="flow-step" key={i}>{p}</div>)}
          </div>
        ) : <p className="muted">暂无流程说明</p>}
      </section>

      <section className="panel">
        <h2>节点逐一解读</h2>
        <div className="node-grid">
          {nodes.map((n, i) => (
            <article className="node-card" key={`${n.id}-${i}`}>
              <header>
                <span className="node-index">{i + 1}</span>
                <div>
                  <h3>{n.type}</h3>
                  <span className="node-id">ID {n.id}</span>
                </div>
              </header>
              <p className="node-role">{n.role}</p>
              {(n.parameters || []).length > 0 && (
                <table className="param-table">
                  <thead><tr><th>参数</th><th>当前值</th><th>含义与设计原因</th></tr></thead>
                  <tbody>
                    {n.parameters.map((p, j) => (
                      <tr key={j}>
                        <td className="p-name">{p.name}</td>
                        <td className="p-value">{String(p.value)}</td>
                        <td>{p.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="why-box"><Lightbulb size={14} /> <span>{n.whyDesigned}</span></div>
            </article>
          ))}
        </div>
      </section>

      {(a.keyInsights || []).length > 0 && (
        <section className="panel">
          <h2>学习要点</h2>
          <ul className="bullet-list">
            {a.keyInsights.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </section>
      )}

      {(a.suggestions || []).length > 0 && (
        <section className="panel">
          <h2>可以进一步尝试</h2>
          <ul className="bullet-list accent">
            {a.suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
