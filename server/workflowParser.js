// 把 ComfyUI 的两种工作流格式统一成前端可渲染的中间结构。
// 支持：UI/图格式（nodes + links）与 API 格式（{ "1": { class_type, inputs } }）

const WIDGET_NAMES = {
  CheckpointLoaderSimple: ['ckpt_name'],
  CheckpointLoader: ['ckpt_name', 'config_name'],
  KSampler: ['seed', 'steps', 'cfg', 'sampler_name', 'scheduler', 'denoise'],
  KSamplerAdvanced: ['add_noise', 'ignore_eta', 'steps', 'cfg', 'sampler_name', 'scheduler', 'start_at_step', 'end_at_step', 'return_with_leftover_noise', 'denoise'],
  CLIPTextEncode: ['text'],
  EmptyLatentImage: ['width', 'height', 'batch_size'],
  LatentImage: ['width', 'height', 'batch_size'],
  SaveImage: ['filename_prefix'],
  PreviewImage: [],
  LoadImage: ['image', 'upload'],
  LoraLoader: ['lora_name', 'strength_model', 'strength_clip'],
  ControlNetLoader: ['control_net_name'],
  ApplyControlNet: ['strength', 'end_at'],
  CannyEdgePreprocessor: ['low_threshold', 'high_threshold', 'resolution'],
  UpscaleModelLoader: ['model_name'],
  ImageUpscaleWithModel: [],
  ImageScale: ['upscale_method', 'width', 'height', 'crop'],
  LatentUpscale: ['upscale_method', 'width', 'height', 'crop'],
  LoadVAE: ['vae_name'],
  VAEDecode: [],
  VAEDecodeTiled: ['tile_size', 'overlap'],
  VAEEncode: [],
  CLIPSetLastLayer: ['stop_at_clip_layer'],
  Reroute: [],
  PrimitiveNode: ['value'],
  ImageInvert: [],
  Note: ['text'],
}

function widgetNamesFor(type) {
  if (WIDGET_NAMES[type]) return WIDGET_NAMES[type]
  const lower = (type || '').toLowerCase()
  for (const [key, names] of Object.entries(WIDGET_NAMES)) {
    if (lower.includes(key.toLowerCase())) return names
  }
  return []
}

function asId(value) {
  return String(value ?? '')
}

function paramValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value.value ?? value.name ?? JSON.stringify(value)
  }
  if (Array.isArray(value)) return value[0] ?? ''
  return value
}

// ---------- UI / 图格式 ----------
function parseUIFormat(raw) {
  const nodes = (raw.nodes || []).map((n, index) => {
    const names = widgetNamesFor(n.type)
    const values = Array.isArray(n.widgets_values) ? n.widgets_values : []
    const params = names.map((name, i) => ({
      name,
      value: i < values.length ? paramValue(values[i]) : '',
    }))
    // 有些节点把 widget 挂在 inputs 上，补充进来
    for (const input of n.inputs || []) {
      if (input.widget && input.widget.name && !params.some((p) => p.name === input.widget.name)) {
        params.push({ name: input.widget.name, value: paramValue(input.widget.value) })
      }
    }
    return {
      id: asId(n.id),
      type: n.type || 'Unknown',
      label: n.title || n.type || 'Unknown',
      pos: { x: Number(n.pos?.[0]) || index * 60, y: Number(n.pos?.[1]) || index * 40 },
      params,
      inputs: (n.inputs || []).map((input) => ({
        name: input.name || '',
        type: input.type || '',
        linkId: input.link == null ? null : asId(input.link),
      })),
      outputs: (n.outputs || []).map((out, slot) => ({
        name: out.name || '',
        type: out.type || '',
        slot,
        links: (out.links || []).map(asId),
      })),
      order: Number(n.order) || index,
      mode: n.mode ?? 0,
    }
  })

  const links = (raw.links || []).map((l) => {
    if (Array.isArray(l)) {
      return { id: asId(l[0]), from: asId(l[1]), fromSlot: Number(l[2]) || 0, to: asId(l[3]), toSlot: Number(l[4]) || 0, type: l[5] || '' }
    }
    return {
      id: asId(l.id), from: asId(l.origin_id ?? l.from), fromSlot: Number(l.origin_slot ?? l.fromSlot) || 0,
      to: asId(l.target_id ?? l.to), toSlot: Number(l.target_slot ?? l.toSlot) || 0, type: l.type || '',
    }
  }).filter((l) => l.from && l.to)

  return { format: 'ui', nodes, links }
}

// ---------- API 格式 ----------
function isLinkRef(value) {
  return Array.isArray(value) && value.length >= 1 && (typeof value[0] === 'string' || typeof value[0] === 'number')
}

function apiLayout(nodesMeta) {
  const depths = {}
  const visiting = new Set()
  function depthOf(id, seen = new Set()) {
    if (depths[id] !== undefined) return depths[id]
    if (seen.has(id)) return 0
    seen.add(id)
    const meta = nodesMeta[id]
    const parentDepths = (meta?.deps || []).map((d) => depthOf(d, new Set(seen)))
    const d = parentDepths.length ? Math.max(...parentDepths) + 1 : 0
    depths[id] = d
    return d
  }
  for (const id of Object.keys(nodesMeta)) depthOf(id)
  const counters = {}
  return nodesMeta.map((meta) => {
    const d = depths[meta.id] || 0
    const i = counters[d] || 0
    counters[d] = i + 1
    return { ...meta, pos: { x: 80 + d * 340, y: 80 + i * 200 } }
  })
}

function parseAPIFormat(raw) {
  const meta = []
  const links = []
  let linkSeq = 1

  for (const [rawId, def] of Object.entries(raw)) {
    if (!def || typeof def !== 'object' || !def.class_type) continue
    const id = asId(rawId)
    const params = []
    const deps = []
    const inputs = []

    for (const [name, value] of Object.entries(def.inputs || {})) {
      if (isLinkRef(value)) {
        const from = asId(value[0])
        const fromSlot = Number(value[1]) || 0
        const linkId = `api_link_${linkSeq++}`
        links.push({ id: linkId, from, fromSlot, to: id, toSlot: inputs.length, type: '' })
        deps.push(from)
        inputs.push({ name, type: '', linkId })
      } else {
        params.push({ name, value: paramValue(value) })
      }
    }

    // 根据目标节点推断连线类型
    for (const link of links) {
      if (link.to !== id) continue
      const input = inputs.find((i) => i.linkId === link.id)
      if (input) input.type = inputTypesFor(def.class_type, input.name)
      const src = meta.find((m) => m.id === link.from)
      if (src) {
        const outName = outputNameForSlot(src.type, link.fromSlot)
        link.type = outName || input.type || ''
      }
    }

    meta.push({
      id, type: def.class_type, label: def.class_type, params, inputs, deps,
      outputs: [], order: meta.length, mode: 0,
    })
  }

  // 汇总每个节点的输出所连的线
  for (const link of links) {
    const src = meta.find((m) => m.id === link.from)
    if (!src) continue
    if (!src.outputs[link.fromSlot]) src.outputs[link.fromSlot] = { name: link.type || '', type: link.type || '', slot: link.fromSlot, links: [] }
    src.outputs[link.fromSlot].links.push(link.id)
  }
  for (const m of meta) m.outputs = (m.outputs || []).filter(Boolean)

  const laidOut = apiLayout(meta)
  return { format: 'api', nodes: laidOut, links }
}

function inputTypesFor(type, name) {
  const map = {
    KSampler: { model: 'MODEL', positive: 'CONDITIONING', negative: 'CONDITIONING', latent_image: 'LATENT' },
    CLIPTextEncode: { clip: 'CLIP' },
    VAEDecode: { samples: 'LATENT', vae: 'VAE' },
    VAEEncode: { pixels: 'IMAGE', vae: 'VAE' },
    SaveImage: { images: 'IMAGE' },
    PreviewImage: { images: 'IMAGE' },
    LoraLoader: { model: 'MODEL', clip: 'CLIP' },
    ApplyControlNet: { condition: 'CONDITIONING', control_net: 'CONTROL_NET', image: 'IMAGE' },
    ImageUpscaleWithModel: { upscale_model: 'UPSCALE_MODEL', image: 'IMAGE' },
    ImageScale: { image: 'IMAGE' },
    LoadImage: {},
  }
  return map[type]?.[name] || ''
}

function outputNameForSlot(type, slot) {
  const map = {
    CheckpointLoaderSimple: ['MODEL', 'CLIP', 'VAE'],
    CheckpointLoader: ['MODEL', 'CLIP', 'VAE', 'CLIP_VISION', 'OUTPUT'],
    KSampler: ['LATENT'],
    KSamplerAdvanced: ['LATENT'],
    CLIPTextEncode: ['CONDITIONING'],
    EmptyLatentImage: ['LATENT'],
    VAEDecode: ['IMAGE'],
    VAEDecodeTiled: ['IMAGE'],
    VAEEncode: ['LATENT'],
    LoraLoader: ['MODEL', 'CLIP'],
    ControlNetLoader: ['CONTROL_NET'],
    ApplyControlNet: ['CONDITIONING'],
    CannyEdgePreprocessor: ['IMAGE'],
    UpscaleModelLoader: ['UPSCALE_MODEL'],
    ImageUpscaleWithModel: ['IMAGE'],
    ImageScale: ['IMAGE'],
    LoadVAE: ['VAE'],
    LoadImage: ['IMAGE', 'MASK'],
    ImageInvert: ['IMAGE'],
    PrimitiveNode: ['CONNECT'],
    Reroute: ['*'],
  }
  return map[type]?.[slot] || ''
}

// ---------- 公共 API ----------
export function parseWorkflow(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('工作流内容不是有效的 JSON 对象')
  if (Array.isArray(raw.nodes) && (Array.isArray(raw.links) || raw.version !== undefined)) {
    return parseUIFormat(raw)
  }
  if (Object.keys(raw).length === 0) throw new Error('工作流为空')
  return parseAPIFormat(raw)
}

// 把中间结构还原成 API 格式（用于保存改造结果）
export function toApiFormat(normalized) {
  const api = {}
  for (const node of normalized.nodes) {
    const inputs = {}
    for (const p of node.params || []) inputs[p.name] = p.value
    for (const input of node.inputs || []) {
      if (!input.linkId) continue
      const link = normalized.links.find((l) => l.id === input.linkId)
      if (link) inputs[input.name] = [link.from, link.fromSlot]
    }
    api[node.id] = { class_type: node.type, inputs }
  }
  return api
}

export function extractPrompt(raw) {
  const parsed = parseWorkflow(raw)
  return parsed
}
