export const GROUPS = [
  { key: 'input', title: '① 图像输入与预处理', keywords: ['LoadImage', 'ImageScaleByAspectRatio', 'ImageScale'], width: 240, color: 'rgba(59,130,246,.055)', border: 'rgba(59,130,246,.28)' },
  { key: 'camera', title: '② 六路机位提示词（并行）', keywords: ['QwenMultiangleCameraNode', 'Text Concatenate', 'easy string'], width: 640, color: 'rgba(168,85,247,.055)', border: 'rgba(168,85,247,.28)' },
  { key: 'hub', title: '③ 提示词汇总与预览', keywords: ['KepStringList', 'easy showAnything'], width: 240, color: 'rgba(20,184,166,.055)', border: 'rgba(20,184,166,.28)' },
  { key: 'model', title: '④ 模型与 LoRA', keywords: ['UNETLoader', 'LoraLoaderModelOnly', 'LoraLoader', 'ModelSamplingAuraFlow', 'CFGNorm', 'CLIPLoader', 'VAELoader'], width: 260, color: 'rgba(245,158,11,.055)', border: 'rgba(245,158,11,.28)' },
  { key: 'cond', title: '⑤ 正负条件编码', keywords: ['TextEncodeQwenImageEditPlus', 'FluxKontextMultiReferenceLatentMethod', 'CLIPTextEncode'], width: 260, color: 'rgba(236,72,153,.055)', border: 'rgba(236,72,153,.28)' },
  { key: 'sample', title: '⑥ 潜变量与采样', keywords: ['VAEEncode', 'KSampler'], width: 240, color: 'rgba(34,197,94,.055)', border: 'rgba(34,197,94,.28)' },
  { key: 'output', title: '⑦ 输出与验证', keywords: ['VAEDecode', 'PreviewImage', 'SaveImage'], width: 240, color: 'rgba(148,163,184,.06)', border: 'rgba(148,163,184,.28)' },
]

const ROW = 132
const NODE_W = 190
const NODE_H = 82
const GAP = 90

function groupIndex(type) {
  const t = String(type || '')
  const idx = GROUPS.findIndex((g) => g.keywords.some((k) => t.toLowerCase().includes(k.toLowerCase())))
  return idx < 0 ? GROUPS.length - 1 : idx
}

export function layoutWorkflow(workflow) {
  const nodes = workflow?.nodes || []
  const links = workflow?.links || []
  const positions = {}
  const groups = GROUPS.map(() => ({ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, count: 0 }))

  const baseX = []
  let cursor = 0
  for (const g of GROUPS) { baseX.push(cursor); cursor += g.width + GAP }

  const byId = new Map(nodes.map((n) => [String(n.id), n]))
  const idNum = (id) => {
    const n = Number(id)
    return Number.isFinite(n) ? n : 9999 + String(id).length
  }
  const place = (node, x, y, gi) => {
    positions[String(node.id)] = { x, y }
    const g = groups[gi]
    g.minX = Math.min(g.minX, x)
    g.minY = Math.min(g.minY, y)
    g.maxX = Math.max(g.maxX, x + NODE_W)
    g.maxY = Math.max(g.maxY, y + NODE_H)
    g.count++
  }

  const cameraGroup = GROUPS.findIndex((g) => g.key === 'camera')
  const cameras = nodes.filter((n) => String(n.type).includes('QwenMultiangleCameraNode')).sort((a, b) => idNum(a.id) - idNum(b.id))
  const cameraY = new Map(cameras.map((n, i) => [String(n.id), i * ROW]))
  const upstreamOf = (id) => links.find((l) => String(l.to) === String(id))?.from
  const downstreamOf = (id) => links.find((l) => String(l.from) === String(id))?.to

  const textConcats = nodes.filter((n) => String(n.type).includes('Text Concatenate')).sort((a, b) => idNum(a.id) - idNum(b.id))
  const concatY = new Map()
  for (const n of textConcats) {
    let cur = String(n.id)
    for (let i = 0; i < 4; i++) {
      const from = upstreamOf(cur)
      if (!from) break
      if (cameraY.has(String(from))) { concatY.set(String(n.id), cameraY.get(String(from))); break }
      cur = String(from)
    }
    if (!concatY.has(String(n.id))) concatY.set(String(n.id), idNum(n.id) % cameras.length * ROW)
  }

  for (const n of nodes) {
    const gi = groupIndex(n.type)
    if (gi === cameraGroup) {
      const t = String(n.type)
      if (t.includes('QwenMultiangleCameraNode')) place(n, baseX[gi], cameraY.get(String(n.id)) ?? 0, gi)
      else if (t.includes('Text Concatenate')) place(n, baseX[gi] + 215, concatY.get(String(n.id)) ?? 0, gi)
      else place(n, baseX[gi] + 430, concatY.get(String(downstreamOf(n.id))) ?? 0, gi)
    } else {
      const peers = nodes.filter((m) => groupIndex(m.type) === gi).sort((a, b) => idNum(a.id) - idNum(b.id))
      const i = peers.findIndex((m) => String(m.id) === String(n.id))
      place(n, baseX[gi], i * ROW, gi)
    }
  }

  const regions = GROUPS.map((g, i) => {
    const box = groups[i]
    if (!box.count) return null
    return {
      key: g.key, title: g.title,
      x: box.minX - 24, y: box.minY - 56,
      width: box.maxX - box.minX + 48,
      height: box.maxY - box.minY + 88,
      color: g.color, border: g.border,
    }
  }).filter(Boolean)

  return { positions, regions }
}
