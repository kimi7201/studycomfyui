import 'dotenv/config'
import { lookupKnowledge } from './nodeKnowledge.js'
import {
  ANALYSIS_SYSTEM_PROMPT,
  MODIFICATION_SYSTEM_PROMPT,
  buildAnalysisUserMessage,
  buildModificationUserMessage,
} from './prompts.js'
import { toApiFormat } from './workflowParser.js'

let config = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
}

export function getConfig() {
  return {
    configured: Boolean(config.apiKey),
    apiKeyMasked: config.apiKey ? `${config.apiKey.slice(0, 4)}••••${config.apiKey.slice(-4)}` : '',
    baseURL: config.baseURL,
    model: config.model,
  }
}

export function setConfig(patch = {}) {
  if (typeof patch.apiKey === 'string') config.apiKey = patch.apiKey.trim()
  if (typeof patch.baseURL === 'string' && patch.baseURL.trim()) config.baseURL = patch.baseURL.trim().replace(/\/$/, '')
  if (typeof patch.model === 'string' && patch.model.trim()) config.model = patch.model.trim()
  return getConfig()
}

function stripJsonFence(text) {
  const cleaned = String(text || '').trim()
  const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1] : cleaned
}

async function callLLM(system, user) {
  if (!config.apiKey) throw new Error('未配置 API Key')
  const res = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.35,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`大模型请求失败 (${res.status}): ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('大模型未返回内容')
  return JSON.parse(stripJsonFence(content))
}

// ==================== 解读 ====================

export async function analyzeWorkflow(parsed, userPrompt = '') {
  if (config.apiKey) {
    try {
      const result = await callLLM(ANALYSIS_SYSTEM_PROMPT, buildAnalysisUserMessage(parsed, userPrompt))
      if (result && Array.isArray(result.nodes) && result.nodes.length) {
        return { ...result, engine: 'llm' }
      }
      throw new Error('大模型返回结果结构不完整')
    } catch (err) {
      console.warn('[LLM] 解读失败，切换内置知识库：', err.message)
    }
  }
  return { ...fallbackAnalysis(parsed, userPrompt), engine: 'knowledge' }
}

function fallbackAnalysis(parsed, userPrompt) {
  const sorted = [...parsed.nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const nodes = sorted.map((n) => {
    const k = lookupKnowledge(n.type)
    return {
      id: n.id,
      type: n.type,
      role: k?.role || `${n.type} 节点，在工作流中承担一个具体的处理或传递步骤。`,
      parameters: (n.params || []).map((p) => ({
        name: p.name,
        value: String(p.value ?? ''),
        meaning: k?.params?.[p.name] || `控制 ${p.name} 的取值，可根据生成效果调整。`,
      })),
      whyDesigned: k?.why || '把这一能力独立成节点，便于在流程中组合、复用与单独调参。',
    }
  })

  const stepLines = sorted.map((n, i) => {
    const incoming = parsed.links.filter((l) => l.to === n.id).map((l) => `${l.from}(${l.type || '数据'})`).join('、') || '无（流程起点）'
    const outgoing = parsed.links.filter((l) => l.from === n.id).map((l) => l.to).join('、') || '无（流程终点）'
    const k = lookupKnowledge(n.type)
    return `【第${i + 1}步】${n.type}（ID ${n.id}）：${k?.role || '处理一步数据'}。输入来自 ${incoming}，输出流向 ${outgoing}。`
  })

  const tips = sorted.flatMap((n) => lookupKnowledge(n.type)?.tips || []).slice(0, 6)
  const types = [...new Set(sorted.map((n) => n.type))]
  const isTxt2img = types.some((t) => /EmptyLatent/i.test(t))
  const title = `${isTxt2img ? '文生图' : '图像生成'}基础管线：${types.slice(0, 3).join(' → ')}`
  const summary = `这条工作流由 ${sorted.length} 个节点、${parsed.links.length} 条连线组成，${isTxt2img ? '从空白潜变量出发' : '从已有素材出发'}，经过条件构建与采样生成，最终输出图像。核心链路是 ${types.slice(0, 5).join(' → ')}，适合用来理解 ComfyUI 的数据流动与节点分工。`
  const suggestionPrefix = userPrompt ? [`你提到：${userPrompt}。当前为内置知识库模式，如需针对该要求的深度定制解读，请在设置中配置大模型 API Key。`] : []

  return {
    title,
    summary,
    flowExplanation: stepLines.join('\n\n'),
    nodes,
    keyInsights: [
      '节点之间通过类型化的数据（MODEL / CLIP / CONDITIONING / LATENT / IMAGE）连接，类型匹配是连线的前提。',
      ...tips.slice(0, 4),
    ],
    suggestions: [
      ...suggestionPrefix,
      '尝试固定 seed 后逐个调整 steps 与 cfg，观察单一变量对结果的影响。',
      '在关键中间结果处插入 PreviewImage，看清每一步的产物形态。',
      '熟悉后可以把常用参数提升为 PrimitiveNode，方便复用与批量调用。',
    ],
  }
}

// ==================== 改造 ====================

export async function modifyWorkflow(ctx, userPrompt = '') {
  if (config.apiKey) {
    try {
      const result = await callLLM(MODIFICATION_SYSTEM_PROMPT, buildModificationUserMessage(ctx.apiWorkflow, ctx.summary, userPrompt))
      if (result && result.newWorkflow && result.changes) {
        return { ...result, engine: 'llm' }
      }
      throw new Error('大模型返回的改造结果缺少 newWorkflow 或 changes')
    } catch (err) {
      console.warn('[LLM] 改造失败，切换内置规则：', err.message)
    }
  }
  return { ...fallbackModify(ctx, userPrompt), engine: 'knowledge' }
}

function findByType(api, keyword) {
  const kw = keyword.toLowerCase()
  return Object.entries(api)
    .filter(([id, def]) => id !== keyword && String(def?.class_type || '').toLowerCase().includes(kw))
    .map(([id, def]) => ({ id, def }))
}

function consumersOf(api, nodeId, outputSlot, inputName) {
  return Object.entries(api).filter(([id, def]) => {
    const v = def?.inputs?.[inputName]
    return Array.isArray(v) && String(v[0]) === String(nodeId) && (outputSlot == null || Number(v[1]) === outputSlot)
  }).map(([id, def]) => ({ id, def }))
}

function findSaveImage(api) {
  return findByType(api, 'SaveImage')[0] || null
}

function findVaeDecode(api) {
  return findByType(api, 'VAEDecode')[0] || null
}

function opAdd(type, extra = []) {
  return [`在 ComfyUI 画布空白处点击右键 → 搜索「${type}」→ 点击添加该节点`, ...extra]
}

function fallbackModify(ctx, userPrompt) {
  const api = JSON.parse(JSON.stringify(ctx.apiWorkflow || {}))
  const text = String(userPrompt || '')
  const lower = text.toLowerCase()
  const changes = { addedNodes: [], removedNodes: [], modifiedNodes: [], addedLinks: [], removedLinks: [] }
  let explanation = ''
  let summary = ''
  let matched = false

  // ---- 删除节点 ----
  const removeMatch = text.match(/(?:删除|去掉|移除|不需要)\s*([^\s，,。；;]+)/)
  if (removeMatch && /(删除|去掉|移除|不需要)/.test(text)) {
    const keyword = removeMatch[1]
    const targets = findByType(api, keyword)
    if (targets.length) {
      for (const { id, def } of targets) {
        changes.removedNodes.push({ id, type: def.class_type, reason: `按照你的要求移除 ${def.class_type} 节点，简化流程。` })
        delete api[id]
        matched = true
      }
      for (const [id, def] of Object.entries(api)) {
        for (const [name, value] of Object.entries(def.inputs || {})) {
          if (Array.isArray(value) && targets.some((t) => String(t.id) === String(value[0]))) {
            changes.removedLinks.push({ from: String(value[0]), to: id, reason: '源节点被删除，相关连线一并移除。' })
            def.inputs[name] = ''
          }
        }
      }
      explanation = `已按你的要求移除 ${targets.map((t) => t.def.class_type).join('、')} 节点，并清理了与它相连的线。`
      summary = '删除后请确保后续节点不再需要该节点的输出；如果生成报错，请检查缺失的输入。'
    }
  }

  // ---- 超分 / 高清放大 ----
  if (!matched && /(放大|超分|高清|分辨率|upscale|4k)/i.test(lower)) {
    const decode = findVaeDecode(api)
    const save = findSaveImage(api)
    if (decode && save) {
      const modelId = 'new_upscale_model'
      const scaleId = 'new_image_upscale'
      api[modelId] = { class_type: 'UpscaleModelLoader', inputs: { model_name: '4x_NMKD_Superscale_150K.safetensors' } }
      api[scaleId] = { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: [modelId, 0], image: [decode.id, 0] } }
      const oldSource = save.def.inputs?.images
      save.def.inputs.images = [scaleId, 0]
      changes.addedNodes.push({
        id: modelId, type: 'UpscaleModelLoader', role: '加载 ESRGAN 超分模型，为放大提供算法。',
        reason: '图像放大必须依赖一个超分模型；ImageUpscaleWithModel 本身不包含模型，所以必须先新增这个加载节点。',
        params: { model_name: '4x_NMKD_Superscale_150K.safetensors' },
        operationSteps: opAdd('UpscaleModelLoader', [
          '在模型的下拉框中选择一个超分模型（如 4x_NMKD_Superscale）；若下拉框为空，需先把模型文件放到 ComfyUI/models/upscale_models 目录并刷新页面。',
          '从该节点的 UPSCALE_MODEL 输出拖线，连接到下一步 ImageUpscaleWithModel 的 upscale_model 输入。',
        ]), pos: { x: 1500, y: 120 },
      })
      changes.addedNodes.push({
        id: scaleId, type: 'ImageUpscaleWithModel', role: '用超分模型把图像放大到 4 倍，补充细节。',
        reason: '原流程的 VAEDecode 直接输出给 SaveImage，分辨率受生成尺寸限制；插入该节点可在不重画构图的前提下显著提升清晰度。',
        params: {},
        operationSteps: opAdd('ImageUpscaleWithModel', [
          `从 ${decode.def.class_type}（ID ${decode.id}）的 IMAGE 输出拖线到本节点的 image 输入；原来接 SaveImage 的线需要先断开。`,
          '从 UpscaleModelLoader 的 UPSCALE_MODEL 输出拖线到本节点的 upscale_model 输入。',
          `从本节点的 IMAGE 输出拖线到 ${save.def.class_type}（ID ${save.id}）的 images 输入。`,
        ]), pos: { x: 1760, y: 120 },
      })
      changes.addedLinks.push(
        { from: modelId, fromSlot: 0, to: scaleId, toSlot: 0, type: 'UPSCALE_MODEL', reason: '把超分模型传给放大节点。' },
        { from: decode.id, fromSlot: 0, to: scaleId, toSlot: 1, type: 'IMAGE', reason: '对解码后的图像做放大。' },
        { from: scaleId, fromSlot: 0, to: save.id, toSlot: 0, type: 'IMAGE', reason: '保存放大后的高清图像。' },
      )
      if (Array.isArray(oldSource)) changes.removedLinks.push({ from: String(oldSource[0]), to: save.id, reason: '改由超分节点输出，避免保存未放大的原图。' })
      changes.modifiedNodes.push({ id: save.id, type: save.def.class_type, what: 'images 输入改接超分节点', reason: '让最终保存的是放大后的图像。' })
      explanation = '在原流程的解码与保存之间插入一段超分放大链路：先加载超分模型，再对图像做 4 倍放大，最后保存。这样构图不变，细节更清晰。'
      summary = '如果放大后尺寸过大，可在 ImageUpscaleWithModel 后接一个 ImageScale 调整到目标宽高；超分模型需要提前下载到 models/upscale_models 目录。'
      matched = true
    }
  }

  // ---- LoRA ----
  if (!matched && /(lora|风格|画风|微调)/i.test(lower)) {
    const ckpt = findByType(api, 'Checkpoint')[0]
    if (ckpt) {
      const loraId = 'new_lora_1'
      const modelConsumers = consumersOf(api, ckpt.id, 0, 'model')
      const clipConsumers = consumersOf(api, ckpt.id, 1, 'clip')
      api[loraId] = {
        class_type: 'LoraLoader',
        inputs: { model: [ckpt.id, 0], clip: [ckpt.id, 1], lora_name: 'detail_tweaker.safetensors', strength_model: 0.8, strength_clip: 0.8 },
      }
      for (const c of modelConsumers) c.def.inputs.model = [loraId, 0]
      for (const c of clipConsumers) c.def.inputs.clip = [loraId, 1]
      changes.addedNodes.push({
        id: loraId, type: 'LoraLoader', role: '把 LoRA 权重叠加到底模与 CLIP 上，注入特定画风或概念。',
        reason: 'LoRA 需要在模型加载之后、条件编码与采样之前介入；不新增这个节点就无法在不停用原模型的情况下叠加额外风格能力。',
        params: { lora_name: 'detail_tweaker.safetensors', strength_model: 0.8, strength_clip: 0.8 },
        operationSteps: opAdd('LoraLoader', [
          '在 lora_name 下拉框选择你要的 LoRA 文件（需已放在 ComfyUI/models/loras）。',
          `从 ${ckpt.def.class_type}（ID ${ckpt.id}）的 MODEL 输出拖线到本节点的 model 输入。`,
          `从 ${ckpt.def.class_type}（ID ${ckpt.id}）的 CLIP 输出拖线到本节点的 clip 输入。`,
          '把原本从 Checkpoint 出发、接到 KSampler.model 与 CLIPTextEncode.clip 的线，改从本节点的 MODEL / CLIP 输出接出。',
          'strength_model 与 strength_clip 先从 0.8 起调，过高容易导致画面崩坏。',
        ]), pos: { x: 420, y: 420 },
      })
      changes.addedLinks.push(
        { from: ckpt.id, fromSlot: 0, to: loraId, toSlot: 0, type: 'MODEL', reason: '把底模传给 LoRA 叠加。' },
        { from: ckpt.id, fromSlot: 1, to: loraId, toSlot: 1, type: 'CLIP', reason: '把文本编码器传给 LoRA 叠加。' },
        { from: loraId, fromSlot: 0, to: modelConsumers[0]?.id || 'KSampler', toSlot: 0, type: 'MODEL', reason: '让采样器使用叠加后的模型。' },
      )
      changes.modifiedNodes.push({ id: ckpt.id, type: ckpt.def.class_type, what: 'MODEL/CLIP 输出改接 LoraLoader', reason: '通过 LoRA 中转，保留原模型不变。' })
      explanation = '在模型加载器与下游之间插入 LoraLoader，让底模先叠加 LoRA 再参与条件编码与采样，从而以低成本引入新画风。'
      summary = '多个 LoRA 可以串联多个 LoraLoader；强度建议从 0.6–0.8 开始逐步微调。'
      matched = true
    }
  }

  // ---- ControlNet ----
  if (!matched && /(controlnet|线稿|姿态|深度|控制|边缘|canny|pose)/i.test(lower)) {
    const ckpt = findByType(api, 'CLIPTextEncode')[0]
    const sampler = findByType(api, 'KSampler')[0]
    if (ckpt && sampler) {
      const loaderId = 'new_controlnet_loader'
      const preId = 'new_canny'
      const applyId = 'new_apply_controlnet'
      const imageNode = findByType(api, 'LoadImage')[0]
      api[loaderId] = { class_type: 'ControlNetLoader', inputs: { control_net_name: 'control_v11p_sd15_canny.pth' } }
      api[preId] = { class_type: 'CannyEdgePreprocessor', inputs: { image: imageNode ? [imageNode.id, 0] : '', low_threshold: 100, high_threshold: 200, resolution: 512 } }
      api[applyId] = { class_type: 'ApplyControlNet', inputs: { condition: [ckpt.id, 0], control_net: [loaderId, 0], image: [preId, 0], strength: 0.9 } }
      const originalPositive = sampler.def.inputs?.positive
      sampler.def.inputs.positive = [applyId, 0]
      changes.addedNodes.push({
        id: loaderId, type: 'ControlNetLoader', role: '加载 Canny ControlNet 模型。',
        reason: 'ControlNet 的控制能力来自独立模型文件，必须先加载才能使用。',
        params: { control_net_name: 'control_v11p_sd15_canny.pth' },
        operationSteps: opAdd('ControlNetLoader', [
          '在 control_net_name 下拉框选择 Canny 类 ControlNet 模型（需放在 ComfyUI/models/controlnet，且版本与底模一致）。',
          '从它的 CONTROL_NET 输出拖线到 ApplyControlNet 的 control_net 输入。',
        ]), pos: { x: 420, y: 620 },
      })
      changes.addedNodes.push({
        id: preId, type: 'CannyEdgePreprocessor', role: '从参考图提取边缘线稿作为控制引导。',
        reason: 'ControlNet 需要一张结构引导图，Canny 预处理把普通照片转成线稿，才能约束构图。',
        params: { low_threshold: 100, high_threshold: 200, resolution: 512 },
        operationSteps: opAdd('CannyEdgePreprocessor', [
          imageNode ? `从 LoadImage（ID ${imageNode.id}）的 IMAGE 输出拖线到本节点的 image 输入。` : '新增一个 LoadImage 节点并上传参考图，然后把它的 IMAGE 输出接到本节点的 image 输入；参考图是本流程必需的新素材。',
          '把本节点的 IMAGE 输出接到 ApplyControlNet 的 image 输入。',
        ]), pos: { x: 700, y: 620 },
      })
      changes.addedNodes.push({
        id: applyId, type: 'ApplyControlNet', role: '把线稿约束叠加到正向条件上。',
        reason: '要让采样器“看见”结构约束，必须把 ControlNet 与原提示词条件合并成新的 CONDITIONING。',
        params: { strength: 0.9 },
        operationSteps: opAdd('ApplyControlNet', [
          `从 ${ckpt.def.class_type}（ID ${ckpt.id}）的 CONDITIONING 输出拖线到本节点的 condition 输入。`,
          '从 ControlNetLoader 的 CONTROL_NET 输出拖线到 control_net 输入。',
          '从 CannyEdgePreprocessor 的 IMAGE 输出拖线到 image 输入。',
          `把 KSampler（ID ${sampler.id}）的 positive 输入改接本节点的 CONDITIONING 输出。`,
        ]), pos: { x: 980, y: 620 },
      })
      if (Array.isArray(originalPositive)) changes.removedLinks.push({ from: String(originalPositive[0]), to: sampler.id, reason: '正向条件改由 ApplyControlNet 输出。' })
      changes.addedLinks.push(
        { from: loaderId, fromSlot: 0, to: applyId, toSlot: 1, type: 'CONTROL_NET', reason: '提供控制模型。' },
        { from: preId, fromSlot: 0, to: applyId, toSlot: 2, type: 'IMAGE', reason: '提供线稿引导。' },
        { from: applyId, fromSlot: 0, to: sampler.id, toSlot: 0, type: 'CONDITIONING', reason: '带约束的条件送入采样器。' },
      )
      explanation = '新增一套 ControlNet 控制链路：加载 Canny 模型 → 用参考图提取线稿 → 把结构约束合并进正向条件，让生成结果遵循参考图的构图。'
      summary = '没有参考图时，需先加 LoadImage 并上传图片；ControlNet 模型版本要与底模匹配，strength 过大会让画面僵硬。'
      matched = true
    }
  }

  // ---- 二次采样 / 高清重绘 ----
  if (!matched && /(二次|refiner|重绘|细化|latent.*upscale|高能|更精细)/i.test(lower)) {
    const sampler = findByType(api, 'KSampler')[0]
    const decode = findVaeDecode(api)
    if (sampler && decode) {
      const upId = 'new_latent_upscale'
      const k2Id = 'new_ksampler_refine'
      api[upId] = { class_type: 'LatentUpscale', inputs: { samples: [sampler.id, 0], upscale_method: 'nearest-exact', width: 1024, height: 1024, crop: 'disabled' } }
      api[k2Id] = { class_type: 'KSampler', inputs: { seed: 123456, steps: 12, cfg: 6, sampler_name: 'dpmpp_2m', scheduler: 'karras', denoise: 0.5, model: sampler.def.inputs?.model || '', positive: sampler.def.inputs?.positive || '', negative: sampler.def.inputs?.negative || '', latent_image: [upId, 0] } }
      decode.def.inputs.samples = [k2Id, 0]
      changes.addedNodes.push({
        id: upId, type: 'LatentUpscale', role: '在潜空间把图像尺寸放大。',
        reason: '高清细化先在潜空间放大，比直接像素放大更省显存，也为第二次采样提供更大的画布。',
        params: { width: 1024, height: 1024, upscale_method: 'nearest-exact' },
        operationSteps: opAdd('LatentUpscale', [
          `从原 KSampler（ID ${sampler.id}）的 LATENT 输出拖线到本节点的 samples 输入。`,
          '把 width / height 设为目标分辨率（需为 8 的倍数）。',
        ]), pos: { x: 1200, y: 380 },
      })
      changes.addedNodes.push({
        id: k2Id, type: 'KSampler', role: '用较低 denoise 做第二次采样，补充细节。',
        reason: '第一次采样决定构图，第二次以 denoise 0.5 左右重采样只补细节不改结构，这是两段式高清出图的关键。',
        params: { denoise: 0.5, steps: 12 },
        operationSteps: opAdd('KSampler', [
          'model / positive / negative 三个输入分别接回原流程对应的模型与正负条件。',
          `latent_image 接 LatentUpscale（ID ${upId}）的 LATENT 输出。`,
          'denoise 设为 0.5 左右，steps 可降到 10–15。',
          `把 VAEDecode（ID ${decode.id}）的 samples 输入改接本节点的 LATENT 输出。`,
        ]), pos: { x: 1460, y: 380 },
      })
      explanation = '在第一次采样与 VAE 解码之间加入潜空间放大 + 二次采样，用低去噪强度补细节，实现更精细的高分辨率输出。'
      summary = '第二次采样的 denoise 是关键：太高会改变构图，太低则补不出细节。建议从 0.5 开始试。'
      matched = true
    }
  }

  // ---- 预览 ----
  if (!matched && /(预览|preview|中间结果|看看)/i.test(lower)) {
    const decode = findVaeDecode(api)
    if (decode) {
      const id = 'new_preview'
      api[id] = { class_type: 'PreviewImage', inputs: { images: [decode.id, 0] } }
      changes.addedNodes.push({
        id, type: 'PreviewImage', role: '在界面预览中间图像，不写磁盘。',
        reason: '调试时需要看到解码结果，但不想生成一堆文件，PreviewImage 是最轻量的观察窗口。',
        params: {},
        operationSteps: opAdd('PreviewImage', [`从 VAEDecode（ID ${decode.id}）的 IMAGE 输出拖线到本节点的 images 输入。`]),
        pos: { x: 1500, y: 600 },
      })
      explanation = '新增 PreviewImage 节点，把 VAE 解码后的图像直接显示在界面上，方便你观察中间结果。'
      summary = '确认效果后，把想保存的分支接到 SaveImage；PreviewImage 不会写入 output 目录。'
      matched = true
    }
  }

  if (!matched) {
    explanation = '当前处于内置知识库模式，未能自动识别这个需求对应的节点改造。可以先参考下面列出的能力，或在右上角「模型设置」中填入任意 OpenAI 兼容 API Key，让大模型处理任意复杂需求。'
    summary = '内置模式目前支持：高清放大/超分、LoRA 风格、ControlNet 线稿控制、二次采样细化、预览中间结果、删除指定节点。'
  }

  return { explanation, changes, newWorkflow: api, summary }
}
