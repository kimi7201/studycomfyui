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
const STATUS_LABEL = { added: '新增', removed: '删除', modified: '修改', default: '原有' }

const TYPICAL_NEIGHBORS = {
  LoadImage: { upstream: '通常就是流程起点；若有上游，一般是读取/选择图片的节点。', downstream: '常接到 ImageScale / ImageCrop、VAEEncode、ControlNet 预处理或图生图参考输入。' },
  ImageScale: { upstream: '通常是 LoadImage 或其他图像预处理节点。', downstream: '常接到相机/控制节点、VAEEncode、条件编码节点的 image 输入。' },
  QwenMultiangleCameraNode: { upstream: '通常接收 IMAGE（参考图），以及水平角/俯仰角/zoom 参数。', downstream: '常接到 Text Concatenate、CLIPTextEncode 或字符串列表节点。' },
  'easy string': { upstream: '一般是手工填写的起点，无连线输入。', downstream: '常接到 Text Concatenate 或提示词拼接节点，作为附加文本。' },
  'Text Concatenate': { upstream: '常接 easy string、相机节点、CLIPTextEncode 等输出字符串的节点。', downstream: '常接到 KepStringList、CLIPTextEncode 或任何 STRING 输入。' },
  KepStringList: { upstream: '常接多条 Text Concatenate / easy string 的文本输出。', downstream: '常接到 easy showAnything 预览，以及条件编码节点的 prompt 输入。' },
  'easy showAnything': { upstream: '常接字符串或字符串列表节点，用于调试。', downstream: '通常是终端预览节点，不继续向下连接。' },
  UNETLoader: { upstream: '无上游，是模型加载起点。', downstream: '常接到 LoraLoader、ModelSampling、CFGNorm，最后进入 KSampler。' },
  LoraLoaderModelOnly: { upstream: '一般接 UNETLoader 或上一个 LoraLoader 的 MODEL。', downstream: '常接下一个 LoraLoader、ModelSamplingAuraFlow 或 KSampler。' },
  CLIPLoader: { upstream: '无上游，是文本编码器加载起点。', downstream: '常接到各种 CLIPTextEncode / TextEncodeQwen 节点。' },
  VAELoader: { upstream: '无上游，是 VAE 加载起点。', downstream: '常接到 VAEEncode、VAEDecode，以及需要图像参考的条件编码节点。' },
  ModelSamplingAuraFlow: { upstream: '通常接 UNETLoader / LoraLoader 的 MODEL。', downstream: '常接到 CFGNorm 或 KSampler 的 model。' },
  CFGNorm: { upstream: '通常接 ModelSampling / LoraLoader 的 MODEL。', downstream: '几乎总是接到 KSampler 的 model。' },
  TextEncodeQwenImageEditPlus: { upstream: '通常接 CLIP、VAE、IMAGE（参考图）与 STRING（提示词）。', downstream: '常接到 KSampler 的 positive / negative，或 FluxKontext 多参考节点。' },
  FluxKontextMultiReferenceLatentMethod: { upstream: '通常接 TextEncode 类节点的 CONDITIONING。', downstream: '常接到 KSampler 的 positive / negative。' },
  VAEEncode: { upstream: '通常接 IMAGE 与 VAE。', downstream: '几乎总是接到 KSampler 的 latent_image。' },
  KSampler: { upstream: '通常接 MODEL、positive/negative CONDITIONING、LATENT。', downstream: '几乎总是接到 VAEDecode。' },
  VAEDecode: { upstream: '通常接 KSampler 的 LATENT 与 VAE。', downstream: '常接到 SaveImage、PreviewImage 或后续图像处理。' },
  SaveImage: { upstream: '通常接 VAEDecode 的 IMAGE。', downstream: '通常是流程终点。' },
}

function typicalFor(type) {
  const t = String(type || '').toLowerCase()
  for (const [key, val] of Object.entries(TYPICAL_NEIGHBORS)) {
    if (t.includes(key.toLowerCase())) return val
  }
  return {
    upstream: '通常是提供 MODEL / CLIP / IMAGE / CONDITIONING / LATENT 等数据的加载或前处理节点。',
    downstream: '通常是消费该数据的条件编码、采样、解码或保存节点。',
  }
}

function buildNodeDetails(page) {
  const workflow = page.workflow || {}
  const nodes = workflow.nodes || []
  const links = workflow.links || []
  const byId = new Map(nodes.map((n) => [String(n.id), n]))
  const analysis = new Map((page.analysis?.nodes || []).map((n) => [String(n.id), n]))
  const labelOf = (id) => {
    const n = byId.get(String(id))
    return n ? `${n.type || n.label || id}（ID ${id}）` : `ID ${id}`
  }
  const result = {}
  for (const n of nodes) {
    const id = String(n.id)
    const a = analysis.get(id) || {}
    result[id] = {
      type: n.type || n.label || id,
      role: a.role || '暂无该节点的作用解读。',
      why: a.whyDesigned || '暂无该节点的设计原因解读。',
      parameters: (a.parameters || []).map((p) => ({ name: p.name, value: String(p.value ?? ''), meaning: p.meaning })),
      inputs: links.filter((l) => String(l.to) === id).map((l) => ({ peer: labelOf(l.from), type: l.type || '数据', link: String(l.id) })),
      outputs: links.filter((l) => String(l.from) === id).map((l) => ({ peer: labelOf(l.to), type: l.type || '数据', link: String(l.id) })),
      typical: typicalFor(n.type),
    }
  }
  return result
}

function renderSvg(workflow, reasonMap = {}) {
  if (!workflow || !Array.isArray(workflow.nodes) || !workflow.nodes.length) return '<p class="empty">暂无工作流示意图</p>'
  const nodes = workflow.nodes
  const links = workflow.links || []
  const W = 190
  const H = 88
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
    const change = reasonMap[String(n.id)]
    const statusText = change ? `${STATUS_LABEL[change.kind]}${change.what ? '：' + change.what : ''} · ${change.reason}` : ''
    return `<g class="wf-node-svg" data-node-id="${esc(n.id)}">
      <title>${esc(statusText || `${n.type}（ID ${n.id}）`)}</title>
      <rect x="${x}" y="${y}" width="${W}" height="${H}" rx="10" fill="#141a2b" stroke="${color}" stroke-width="2" ${dash}/>
      <text x="${x + 12}" y="${y + 28}" fill="#f1f5f9" font-size="13" font-weight="700">${esc(label)}</text>
      <text x="${x + 12}" y="${y + 50}" fill="#94a3b8" font-size="11">ID ${esc(n.id)} · ${esc(STATUS_LABEL[n.changeStatus] || '原有')}</text>
      ${change ? `<text x="${x + 12}" y="${y + 72}" fill="${color}" font-size="10">${esc(statusText.slice(0, 26))}</text>` : ''}
    </g>`
  }).join('')

  return `<div class="svg-wrap">
    <div class="svg-tools"><button type="button" data-zoom="in" title="放大">＋</button><button type="button" data-zoom="out" title="缩小">－</button><button type="button" data-zoom="reset" title="适应窗口">适应</button><span>滚轮缩放 · 拖拽平移</span></div>
    <svg id="workflowSvg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" width="100%" style="background:#0b1020;border-radius:12px;min-height:320px" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#64748b"/></marker></defs>
      ${linkSvg}${nodeSvg}
    </svg>
  </div>`
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
  const latestMod = [...(page.modifications || [])].reverse()[0]
  const reasonMap = {}
  for (const [key, kind] of Object.entries({ addedNodes: 'added', removedNodes: 'removed', modifiedNodes: 'modified' })) {
    for (const item of latestMod?.changes?.[key] || []) {
      reasonMap[String(item.id)] = { kind, reason: item.reason || '', what: item.what || '' }
    }
  }
  const details = buildNodeDetails(page)
  for (const [id, change] of Object.entries(reasonMap)) if (details[id]) details[id].change = change
  const nodeDetails = JSON.stringify(details).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  const engineLabel = page.engine === 'llm' ? '大模型' : page.engine === 'assistant' ? 'CodeBuddy 助手' : '内置知识库'

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
.wf-node-svg{cursor:pointer}.wf-node-svg:hover rect{filter:brightness(1.25)}.wf-hint{color:#64748b;font-size:12px;margin:0 0 10px}
.svg-wrap{position:relative}.svg-tools{position:absolute;top:12px;right:12px;z-index:2;display:flex;align-items:center;gap:6px;background:rgba(15,23,42,.92);border:1px solid #334155;border-radius:9px;padding:5px 8px}.svg-tools button{background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;min-width:30px;height:26px;font-size:14px;cursor:pointer}.svg-tools button:hover{background:#334155;color:#fff}.svg-tools span{font-size:11px;color:#64748b;margin-left:4px}
#workflowSvg{cursor:grab;touch-action:none}#workflowSvg.dragging{cursor:grabbing}
.modal-overlay{position:fixed;inset:0;background:rgba(2,6,23,.78);display:flex;align-items:center;justify-content:center;padding:24px;z-index:99}.modal-overlay[hidden]{display:none}
.modal-panel{background:#0f172a;border:1px solid #334155;border-radius:16px;width:min(780px,100%);max-height:86vh;overflow:auto;padding:24px 28px;box-shadow:0 24px 80px rgba(0,0,0,.6)}
.modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #1e293b;padding-bottom:12px;margin-bottom:6px}.modal-head h3{margin:0;font-size:20px;color:#f8fafc}.modal-head small{color:#64748b}
.modal-close{background:#1e293b;border:0;color:#cbd5e1;border-radius:8px;width:32px;height:32px;font-size:20px;line-height:1;cursor:pointer;flex:none}
.modal-sec{margin:16px 0}.modal-sec h4{font-size:13px;color:#a5b4fc;margin:0 0 6px;letter-spacing:.04em}.modal-sec p{margin:4px 0;color:#cbd5e1;font-size:14px}
.modal-list{list-style:none;padding:0;margin:6px 0}.modal-list li{background:#111827;border:1px solid #1e293b;border-radius:8px;padding:8px 10px;margin:6px 0;font-size:13px}.modal-list .tag{color:#38bdf8;margin:0 8px}.modal-list code{color:#64748b;font-size:11px}
footer{color:#475569;font-size:12px;text-align:center;margin-top:50px}
</style></head><body><div class="wrap">
<h1>${esc(page.title)}</h1>
<div class="meta">生成于 ${esc(new Date(page.createdAt).toLocaleString('zh-CN'))} · 解读引擎：${esc(engineLabel)} · ${esc((page.workflow?.nodes || []).length)} 个节点 / ${esc((page.workflow?.links || []).length)} 条连线</div>
<div class="card"><h2 style="margin-top:0">概览</h2><p>${esc(a.summary)}</p></div>
<h2>工作流结构图</h2>
<div class="legend"><span><i style="background:${STATUS_COLOR.default}"></i>原有节点</span><span><i style="background:${STATUS_COLOR.added}"></i>新增</span><span><i style="background:${STATUS_COLOR.removed}"></i>删除</span><span><i style="background:${STATUS_COLOR.modified}"></i>修改</span></div>
<p class="wf-hint">提示：点击图中任意节点，可查看该节点的作用、参数、输入输出与常见前后连接。</p>
${renderSvg(page.workflow, reasonMap)}
<h2>数据流动讲解</h2><div class="card">${flow || '<p class="empty">暂无</p>'}</div>
<h2>节点逐一解读</h2>${renderNodes(a.nodes)}
${a.keyInsights?.length ? `<h2>学习要点</h2><div class="card"><ul>${insights}</ul></div>` : ''}
${a.suggestions?.length ? `<h2>优化建议</h2><div class="card"><ul>${suggestions}</ul></div>` : ''}
${renderModifications(page.modifications)}
<div id="nodeModal" class="modal-overlay" hidden><div class="modal-panel"><div id="nodeModalBody"></div></div></div>
<script id="nodeDetails" type="application/json">${nodeDetails}</script>
<script>
(function(){
  var details = JSON.parse(document.getElementById('nodeDetails').textContent)
  var overlay = document.getElementById('nodeModal')
  var body = document.getElementById('nodeModalBody')
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] }) }
  function section(title, content){ return '<div class="modal-sec"><h4>' + title + '</h4>' + content + '</div>' }
  function connList(items, empty){
    if (!items || !items.length) return '<p class="empty">' + empty + '</p>'
    return '<ul class="modal-list">' + items.map(function(it){ return '<li><b>' + esc(it.peer) + '</b><span class="tag">' + esc(it.type) + '</span><code>link ' + esc(it.link) + '</code></li>' }).join('') + '</ul>'
  }
  function close(){ overlay.hidden = true }
  function open(id){
    var d = details[id]
    if (!d) return
    var params = '<p class="empty">暂无参数解读</p>'
    if (d.parameters && d.parameters.length) {
      params = '<table><thead><tr><th>参数</th><th>当前值</th><th>含义与设计原因</th></tr></thead><tbody>' + d.parameters.map(function(p){ return '<tr><td class="pname">' + esc(p.name) + '</td><td class="pval">' + esc(p.value) + '</td><td>' + esc(p.meaning) + '</td></tr>' }).join('') + '</tbody></table>'
    }
    body.innerHTML = '<div class="modal-head"><div><h3>' + esc(d.type) + '</h3><small>节点 ID ' + esc(id) + '</small></div><button class="modal-close" id="nodeModalClose" aria-label="关闭">×</button></div>' +
      (d.change ? section('本次改造原因 · ' + ({ added: '新增', removed: '删除', modified: '修改' }[d.change.kind] || '改动'), '<div class="why">' + (d.change.what ? '<b>' + esc(d.change.what) + '</b><br/>' : '') + esc(d.change.reason) + '</div>') : '') +
      section('作用', '<p>' + esc(d.role) + '</p>') +
      section('为什么放在这个位置', '<div class="why">' + esc(d.why) + '</div>') +
      section('参数解读', params) +
      section('输入连接', connList(d.inputs, '无输入（流程起点）')) +
      section('输出连接', connList(d.outputs, '无输出（流程终点）')) +
      section('前后一般连接什么节点', '<p><b>上游：</b>' + esc(d.typical.upstream) + '</p><p><b>下游：</b>' + esc(d.typical.downstream) + '</p>')
    document.getElementById('nodeModalClose').onclick = close
    overlay.hidden = false
  }
  document.querySelectorAll('[data-node-id]').forEach(function(el){
    el.style.cursor = 'pointer'
    el.addEventListener('click', function(){ if (window.__wfDidDrag) return; open(el.getAttribute('data-node-id')) })
  })
  overlay.addEventListener('click', function(e){ if (e.target === overlay) close() })
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close() })
})()
</script>
<script>
(function(){
  var svg = document.getElementById('workflowSvg')
  if (!svg) return
  var base = svg.getAttribute('viewBox').trim().split(/[\\s,]+/).map(Number)
  var box = base.slice()
  var dragging = false, startX = 0, startY = 0, moved = false
  function apply(){ svg.setAttribute('viewBox', box.map(function(v){ return Math.round(v * 10) / 10 }).join(' ')) }
  function zoom(factor, cx, cy){
    if (cx == null) { cx = box[0] + box[2] / 2; cy = box[1] + box[3] / 2 }
    var nw = Math.max(base[2] * 0.03, Math.min(base[2] * 4, box[2] * factor))
    var nh = nw * (base[3] / base[2])
    factor = nw / box[2]
    box[0] = cx - (cx - box[0]) * factor
    box[1] = cy - (cy - box[1]) * factor
    box[2] = nw
    box[3] = nh
    apply()
  }
  function pointFromEvent(e){
    var r = svg.getBoundingClientRect()
    return { x: box[0] + ((e.clientX - r.left) / r.width) * box[2], y: box[1] + ((e.clientY - r.top) / r.height) * box[3] }
  }
  svg.addEventListener('wheel', function(e){
    e.preventDefault()
    var p = pointFromEvent(e)
    zoom(e.deltaY > 0 ? 1.18 : 1 / 1.18, p.x, p.y)
  }, { passive: false })
  svg.addEventListener('mousedown', function(e){
    if (e.button !== 0) return
    dragging = true; moved = false; startX = e.clientX; startY = e.clientY
    svg.classList.add('dragging')
  })
  window.addEventListener('mousemove', function(e){
    if (!dragging) return
    var dx = e.clientX - startX, dy = e.clientY - startY
    if (Math.abs(dx) + Math.abs(dy) > 3) { moved = true; window.__wfDidDrag = true }
    var r = svg.getBoundingClientRect()
    box[0] -= (dx / r.width) * box[2]
    box[1] -= (dy / r.height) * box[3]
    startX = e.clientX; startY = e.clientY
    apply()
  })
  window.addEventListener('mouseup', function(){
    if (!dragging) return
    dragging = false; svg.classList.remove('dragging')
    if (moved) setTimeout(function(){ window.__wfDidDrag = false }, 60)
  })
  document.querySelectorAll('.svg-tools button').forEach(function(btn){
    btn.addEventListener('click', function(){
      var action = btn.getAttribute('data-zoom')
      if (action === 'reset') { box = base.slice(); apply() }
      else if (action === 'in') zoom(1 / 1.3)
      else if (action === 'out') zoom(1.3)
    })
  })
})()
</script>
<footer>由 ComfyUI 工作流学习工作台生成</footer>
</div></body></html>`
}
