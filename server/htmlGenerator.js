// 生成可独立打开的学习页面 HTML，内置工作流示意图与改造差异着色。

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

const STATUS_COLOR = {
  added: '#22c55e',
  removed: '#ef4444',
  modified: '#f59e0b',
  default: '#6366f1',
}

function renderSvg(workflow) {
  if (!workflow || !Array.isArray(workflow.nodes) || !workflow.nodes.length) return '<p class="empty">暂无工作流示意图</p>'
  const nodes = workflow.nodes
  const links = workflow.links || []
  const W = 190
  const H = 74
  const minX = Math.min(...nodes.map((n) => n.pos?.x ?? 0)) - 60
  const minY = Math.min(...nodes.map((n) => n.pos?.y ?? 0)) - 60
  const maxX = Math.max(...nodes.map((n) => (n.pos?.x ?? 0) + W)) + 60
  const maxY = Math.max(...nodes.map((n) => (n.pos?.y ?? 0) + H)) + 60
  const byId = new Map(nodes.map((n) => [String(n.id), n]))

  const linkSvg = links.map((l) => {
    const s = byId.get(String(l.from))
    const t = byId.get(String(l.to))
    if (!s || !t) return ''
    const x1 = (s.pos?.x ?? 0) + W
    const y1 = (s.pos?.y ?? 0) + H / 2
    const x2 = t.pos?.x ?? 0
    const y2 = (t.pos?.y ?? 0) + H / 2
    const cx = (x1 + x2) / 2
    const color = STATUS_COLOR[l.changeStatus] || '#64748b'
    const dash = l.changeStatus === 'removed' ? 'stroke-dasharray="6 5"' : ''
    return `<path d="M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2.5" ${dash} marker-end="url(#arrow)"/>`
  }).join('')

  const nodeSvg = nodes.map((n) => {
    const x = n.pos?.x ?? 0
    const y = n.pos?.y ?? 0
    const color = STATUS_COLOR[n.changeStatus] || STATUS_COLOR.default
    const label = String(n.label || n.type || n.id).slice(0, 24)
    const dash = n.changeStatus === 'removed' ? 'stroke-dasharray="5 4"' : ''
    return `<g>
      <rect x="${x}" y="${y}" width="${W}" height="${H}" rx="10" fill="#141a2b" stroke="${color}" stroke-width="2" ${dash}/>
      <text x="${x + 12}" y="${y + 28}" fill="#f1f5f9" font-size="13" font-weight="700">${esc(label)}</text>
      <text x="${x + 12}" y="${y + 50}" fill="#94a3b8" font-size="11">ID ${esc(n.id)} · ${esc(n.changeStatus || '原有')}</text>
    </g>`
  }).join('')

  return `<svg viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" width="100%" style="background:#0b1020;border-radius:12px;min-height:320px" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#64748b"/></marker></defs>
    ${linkSvg}${nodeSvg}
  </svg>`
}

function renderNodes(nodes) {
  if (!nodes?.length) return '<p class="empty">暂无节点解读</p>'
  return nodes.map((n, i) => {
    const params = (n.parameters || []).map((p) => `<tr><td class="pname">${esc(p.name)}</td><td class="pval">${esc(p.value)}</td><td>${esc(p.meaning)}</td></tr>`).join('')
    return `<div class="node-card">
      <h3><span class="idx">${i + 1}</span> ${esc(n.type)} <small>ID ${esc(n.id)}</small></h3>
      <p class="role">${esc(n.role)}</p>
      ${params ? `<table><thead><tr><th>参数</th><th>当前值</th><th>含义与原因</th></tr></thead><tbody>${params}</tbody></table>` : ''}
      <p class="why"><b>为什么这样设计：</b>${esc(n.whyDesigned)}</p>
    </div>`
  }).join('')
}

function renderModifications(mods) {
  if (!mods?.length) return ''
  return mods.map((m, i) => {
    const c = m.changes || {}
    const list = (items, cls, labelFn) => (items || []).map((item) => `<li class="${cls}">${labelFn(item)}</li>`).join('')
    const added = list(c.addedNodes, 'add', (n) => `<div class="change-title"><b>${esc(n.type)}</b><code>ID ${esc(n.id)}</code></div>
      <div><b>为什么新增：</b>${esc(n.reason)}</div>
      ${n.role ? `<div><b>节点作用：</b>${esc(n.role)}</div>` : ''}
      ${n.params && Object.keys(n.params).length ? `<div><b>建议参数：</b>${esc(Object.entries(n.params).map(([k, v]) => `${k}=${v}`).join('，'))}</div>` : ''}
      ${(n.operationSteps || []).length ? `<div class="steps-title">在 ComfyUI 中的具体操作步骤</div><ol class="steps">${n.operationSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}`)
    const removed = list(c.removedNodes, 'del', (n) => `<b>${esc(n.type)}</b>：${esc(n.reason)}`)
    const modified = list(c.modifiedNodes, 'mod', (n) => `<b>${esc(n.type)}</b>：${esc(n.what)}（${esc(n.reason)}）`)
    const addedLinks = list(c.addedLinks, 'add', (l) => `${esc(l.from)} → ${esc(l.to)}（${esc(l.type || '连线')}）：${esc(l.reason)}`)
    const removedLinks = list(c.removedLinks, 'del', (l) => `${esc(l.from)} → ${esc(l.to)}：${esc(l.reason)}`)
    return `<section class="mod">
      <h2>改造记录 ${i + 1}</h2>
      <p class="prompt">需求：${esc(m.prompt)}</p>
      <p>${esc(m.explanation)}</p>
      ${added ? `<h4 class="add">新增节点</h4><ul>${added}</ul>` : ''}
      ${removed ? `<h4 class="del">删除节点</h4><ul>${removed}</ul>` : ''}
      ${modified ? `<h4 class="mod">修改节点</h4><ul>${modified}</ul>` : ''}
      ${addedLinks ? `<h4 class="add">新增连线</h4><ul>${addedLinks}</ul>` : ''}
      ${removedLinks ? `<h4 class="del">删除连线</h4><ul>${removedLinks}</ul>` : ''}
      <p class="why"><b>总结：</b>${esc(m.summary)}</p>
    </section>`
  }).join('')
}

export function generateLearningHtml(page) {
  const a = page.analysis || {}
  const flow = String(a.flowExplanation || '').split(/\n+/).filter(Boolean).map((line) => `<p>${esc(line)}</p>`).join('')
  const insights = (a.keyInsights || []).map((s) => `<li>${esc(s)}</li>`).join('')
  const suggestions = (a.suggestions || []).map((s) => `<li>${esc(s)}</li>`).join('')

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(page.title)} · ComfyUI 学习页面</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0b1020;color:#e2e8f0;font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;line-height:1.7}
.wrap{max-width:1080px;margin:0 auto;padding:40px 24px 80px}h1{font-size:30px;margin:0 0 8px;background:linear-gradient(90deg,#818cf8,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent}
.meta{color:#64748b;font-size:13px;margin-bottom:28px}h2{font-size:20px;margin:36px 0 14px;padding-left:12px;border-left:3px solid #6366f1}
.card{background:#111827;border:1px solid #1e293b;border-radius:14px;padding:20px;margin-bottom:18px}
.node-card{background:#111827;border:1px solid #1e293b;border-radius:14px;padding:18px 20px;margin-bottom:14px}
.node-card h3{margin:0 0 8px;font-size:16px;color:#f8fafc}.node-card h3 .idx{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;background:#312e81;color:#c7d2fe;border-radius:7px;font-size:12px;margin-right:8px}
.node-card h3 small{color:#64748b;font-weight:400;font-size:12px}.role{color:#cbd5e1;margin:0 0 12px}
table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #1e293b;vertical-align:top}th{color:#94a3b8;font-weight:600}.pname{color:#a5b4fc;white-space:nowrap}.pval{color:#fbbf24;word-break:break-all}
.why{background:#0f172a;border-left:3px solid #38bdf8;border-radius:6px;padding:10px 14px;color:#cbd5e1;font-size:14px;margin:10px 0 0}
ul{padding-left:20px}li{margin:6px 0;color:#cbd5e1}.empty{color:#64748b}
.add{color:#4ade80}.del{color:#f87171}.mod{color:#fbbf24}.mod h2{border-color:#f59e0b}
.prompt{color:#a5b4fc;font-weight:600}.steps{font-size:13px;color:#cbd5e1;margin:8px 0 4px;padding-left:22px}.steps li{margin:5px 0}.steps-title{color:#a5b4fc;font-weight:700;font-size:13px;margin-top:10px}.change-title{display:flex;gap:8px;align-items:center;margin-bottom:5px}.change-title code{background:#0a1020;padding:1px 6px;border-radius:5px;color:#64748b;font-size:11px}
.legend{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:#94a3b8;margin:12px 0}.legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:6px}
footer{color:#475569;font-size:12px;text-align:center;margin-top:50px}
</style></head><body><div class="wrap">
<h1>${esc(page.title)}</h1>
<div class="meta">生成于 ${esc(new Date(page.createdAt).toLocaleString('zh-CN'))} · 解读引擎：${esc(page.engine === 'llm' ? '大模型' : '内置知识库')} · ${esc((page.workflow?.nodes || []).length)} 个节点 / ${esc((page.workflow?.links || []).length)} 条连线</div>
<div class="card"><h2 style="margin-top:0">概览</h2><p>${esc(a.summary)}</p></div>
<h2>工作流结构图</h2>
<div class="legend"><span><i style="background:${STATUS_COLOR.default}"></i>原有节点</span><span><i style="background:${STATUS_COLOR.added}"></i>新增</span><span><i style="background:${STATUS_COLOR.removed}"></i>删除</span><span><i style="background:${STATUS_COLOR.modified}"></i>修改</span></div>
${renderSvg(page.workflow)}
<h2>数据流动讲解</h2><div class="card">${flow || '<p class="empty">暂无</p>'}</div>
<h2>节点逐一解读</h2>${renderNodes(a.nodes)}
${a.keyInsights?.length ? `<h2>学习要点</h2><div class="card"><ul>${insights}</ul></div>` : ''}
${a.suggestions?.length ? `<h2>优化建议</h2><div class="card"><ul>${suggestions}</ul></div>` : ''}
${renderModifications(page.modifications)}
<footer>由 ComfyUI 工作流学习工作台生成</footer>
</div></body></html>`
}
