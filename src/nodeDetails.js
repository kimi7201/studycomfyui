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

export function buildNodeDetails(page) {
  const workflow = page?.workflow || {}
  const nodes = workflow.nodes || []
  const links = workflow.links || []
  const byId = new Map(nodes.map((n) => [String(n.id), n]))
  const analysis = new Map((page?.analysis?.nodes || []).map((n) => [String(n.id), n]))
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
