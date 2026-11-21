// 内置 ComfyUI 节点知识库：无大模型 API Key 时用于生成解读与改造建议。
// 每条记录包含：作用、参数含义、输入输出、设计意图、上手提示。

export const NODE_KNOWLEDGE = {
  CheckpointLoaderSimple: {
    category: '加载器',
    role: '加载大模型检查点（.safetensors/.ckpt），一次输出模型、CLIP 文本编码器与 VAE 三件套。',
    params: {
      ckpt_name: '要加载的模型文件名，决定画风与底层能力（写实/动漫/二次元等）。',
    },
    outputs: { MODEL: '扩散模型本体，供 KSampler 去噪使用', CLIP: '文本编码器，把提示词转成条件向量', VAE: '图像编码器/解码器，负责像素与潜空间互转' },
    why: '把三个紧密相关的组件打包在一个节点里，避免用户分别匹配模型与 VAE 造成错配；是绝大多数文生图工作流的起点。',
    tips: ['模型文件需放在 ComfyUI/models/checkpoints 目录', '若工作流另有独立 VAE，可改用 LoadVAE 覆盖这里的 VAE'],
  },
  KSampler: {
    category: '采样/生成',
    role: '工作流的核心引擎。在潜空间中按指定步数逐步去噪，把随机噪声“雕刻”成图像潜变量。',
    params: {
      seed: '随机种子。相同种子+相同参数可复现同一张图；固定种子便于对比实验。',
      steps: '采样步数。越多越精细但越慢，常用 20–30；过多容易过饱和。',
      cfg: 'Classifier-Free Guidance，提示词约束强度。越高越贴合提示词但可能色彩失真，常用 6–9。',
      sampler_name: '采样算法（euler、dpmpp_2m、ddim 等），决定去噪路径与速度/画质取舍。',
      scheduler: '调度器（normal、karras 等），控制每一步噪声衰减的节奏。',
      denoise: '去噪强度。1.0 表示从纯噪声重画；小于 1 用于图生图/重绘，保留原图结构。',
    },
    inputs: { model: '扩散模型', positive: '正向条件（想要的内容）', negative: '负向条件（要排除的内容）', latent_image: '初始潜变量' },
    outputs: { LATENT: '去噪后的图像潜变量，需经 VAE 解码才成为可见图像' },
    why: '它把“模型 + 条件 + 起点”三路信息汇聚为一次生成，是流程中唯一真正耗时且决定画质的节点；参数集中在这里便于统一调参。',
    tips: ['先固定 seed 再调其它参数，才能判断改动是否真的有效', '图生图时把 denoise 降到 0.4–0.7 可保留原图构图'],
  },
  CLIPTextEncode: {
    category: '条件构建',
    role: '把自然语言提示词编码成模型能理解的条件向量（CONDITIONING）。正向和负向各用一个。',
    params: {
      text: '提示词文本。正向写画面内容/风格/质量词，负向写要避免的缺陷（低画质、畸变、水印等）。',
    },
    inputs: { clip: '来自 CheckpointLoaderSimple 的 CLIP 文本编码器' },
    outputs: { CONDITIONING: '编码后的条件，送入 KSampler 的 positive / negative' },
    why: '把“人类语言”翻译成“模型语言”是独立一步，这样同一段提示词可以复用于不同采样器，也方便用节点拼接/加权组合多条提示。',
    tips: ['两个 CLIPTextEncode 的 text 分别接正向/负向，不要接反', '权重语法如 (word:1.2) 可局部加强某个词'],
  },
  EmptyLatentImage: {
    category: '潜变量',
    role: '创建一张指定尺寸的空白潜变量（噪声画布），作为 KSampler 的起点，用于文生图。',
    params: {
      width: '输出宽度，需为 8 的倍数（常见 512/768/1024）。',
      height: '输出高度，同上。',
      batch_size: '一次生成的张数，显存足够时可批量出图对比。',
    },
    outputs: { LATENT: '空白潜变量，送入 KSampler 的 latent_image' },
    why: '文生图没有原始图片，必须凭空造一块“画布”。把它做成独立节点，尺寸就成了可复用的显式配置，而不是藏在采样器里。',
    tips: ['分辨率要匹配模型训练尺寸（SD1.5 常用 512，SDXL 常用 1024）', '宽高必须是 8 的倍数，否则 VAE 解码会报错'],
  },
  VAEDecode: {
    category: '潜变量',
    role: '把 KSampler 输出的潜变量解码成真正可保存的像素图像。',
    inputs: { samples: '潜变量', vae: 'VAE 解码器' },
    outputs: { IMAGE: '图像，可接预览或保存节点' },
    why: 'VAE 解码是有独立显存开销的步骤，拆出来后可以在多个分支间共享同一个解码器，也便于在解码前插入潜空间处理（如放大）。',
    tips: ['VAE 要与模型匹配，错配会导致色彩偏移', '显存不足时可换用轻量 VAE'],
  },
  VAEEncode: {
    category: '潜变量',
    role: '把像素图像编码成潜变量，用于图生图/重绘的起点。',
    inputs: { pixels: '输入图像', vae: 'VAE 编码器' },
    outputs: { LATENT: '图像对应的潜变量' },
    why: '与 VAEDecode 互为逆过程，是“图 → 潜 → 图”闭环的入口。',
    tips: ['常与 LoadImage 搭配使用'],
  },
  SaveImage: {
    category: '输出',
    role: '把图像保存到 ComfyUI/output 目录，并显示在界面中。',
    params: { filename_prefix: '保存文件名前缀，便于分类查找。' },
    inputs: { images: '来自 VAEDecode 或其他图像节点的图像' },
    why: '作为流程终点明确产出物；前缀可包含日期/批次信息方便归档。',
    tips: ['文件名前缀支持 {timestamp} 等占位符'],
  },
  PreviewImage: {
    category: '输出',
    role: '仅在界面预览图像，不写入磁盘，适合中间结果调试。',
    inputs: { images: '图像' },
    why: '调试时不想产生大量文件，用 PreviewImage 临时查看即可。',
    tips: ['确认效果后再把连线改接到 SaveImage'],
  },
  LoadImage: {
    category: '加载器',
    role: '从 ComfyUI/input 目录读取一张已有图片，作为图生图或局部重绘的素材。',
    params: { image: '图片文件名。' },
    outputs: { IMAGE: '图像', MASK: '若上传的是含 alpha 的图，可输出遮罩' },
    why: '把外部素材引入工作流，是从“凭空生成”走向“基于素材加工”的入口。',
    tips: ['图片需放在 ComfyUI/input 目录，或在界面上传'],
  },
  LoraLoader: {
    category: '加载器/风格',
    role: '加载 LoRA 微调权重，以小体积叠加特定画风、人物或概念，并可调强度。',
    params: {
      lora_name: 'LoRA 文件名，位于 models/loras。',
      strength_model: '对模型的影响强度，常用 0.4–1.0；过高会崩坏。',
      strength_clip: '对文本编码器的影响强度，控制提示词对齐程度。',
    },
    inputs: { model: '基础模型', clip: '基础 CLIP' },
    outputs: { MODEL: '叠加 LoRA 后的模型', CLIP: '叠加后的 CLIP' },
    why: 'LoRA 是“插件式”能力，插在模型加载器与采样器之间，既能叠加多个也不污染原模型，是低成本定制画风的标准做法。',
    tips: ['多个 LoRA 用多个 LoraLoader 串联', '强度从 0.8 起调，逐步观察效果'],
  },
  ControlNetLoader: {
    category: '加载器/控制',
    role: '加载 ControlNet 模型，为生成过程引入额外的结构约束（线稿/深度/姿态等）。',
    params: { control_net_name: 'ControlNet 模型文件名。' },
    outputs: { CONTROL_NET: '控制网络模型' },
    why: 'ControlNet 模型与扩散模型分离加载，便于同一套控制模型搭配不同底模。',
    tips: ['模型放 models/controlnet，需与底模版本匹配（SD1.5/SDXL）'],
  },
  ApplyControlNet: {
    category: '控制',
    role: '把 ControlNet 与一张引导图（如 Canny 线稿）绑定，输出带结构约束的条件。',
    params: { strength: '控制强度，0.6–1.2 常用；越大越贴合引导图。' },
    inputs: { condition: '原条件（来自 CLIPTextEncode）', control_net: 'ControlNet 模型', image: '引导图像' },
    outputs: { CONDITIONING: '带结构约束的条件，送入 KSampler' },
    why: '把“约束”作为条件增强而非新节点类型，意味着可与任意提示词条件自由组合、串联多个 ControlNet。',
    tips: ['引导图需先经 Canny/Depth 等预处理器提取', 'strength 过大会导致画面僵硬'],
  },
  CannyEdgePreprocessor: {
    category: '控制/预处理',
    role: '对输入图像做 Canny 边缘检测，生成线稿作为 ControlNet 的引导图。',
    params: { low_threshold: '低阈值', high_threshold: '高阈值', resolution: '处理分辨率' },
    inputs: { image: '原图' },
    outputs: { IMAGE: '边缘线稿' },
    why: '预处理独立出来，方便替换不同提取器（线稿/深度/法线）而不改后续流程。',
    tips: ['阈值影响线条密度，可按素材微调'],
  },
  UpscaleModelLoader: {
    category: '加载器/放大',
    role: '加载 ESRGAN 等超分模型，用于图像高清放大。',
    params: { model_name: '超分模型文件名（如 4x_NMKD_Superscale）。' },
    outputs: { UPSCALE_MODEL: '超分模型' },
    why: '超分模型独立于生成模型管理，可按需切换不同放大风格。',
    tips: ['模型放 models/upscale_models'],
  },
  ImageUpscaleWithModel: {
    category: '图像/放大',
    role: '用超分模型把图像放大若干倍（常见 2x/4x），提升细节与分辨率。',
    inputs: { upscale_model: '超分模型', image: '待放大图像' },
    outputs: { IMAGE: '放大后的图像' },
    why: '先低分辨率快速生成构图，再超分放大，比直接高分辨率生成更省显存、更稳定，是常用的两段式出图策略。',
    tips: ['放大后可接 ImageScale 调整到目标尺寸', '超分只补细节，不会改变构图'],
  },
  ImageScale: {
    category: '图像',
    role: '按指定宽高或比例缩放图像，并可选择插值算法。',
    params: {
      width: '目标宽度', height: '目标高度',
      upscale_method: '放大算法（nearest/bicubic/lanczos 等）',
      crop: '缩放后是否裁剪（disabled/center）',
    },
    inputs: { image: '输入图像' },
    outputs: { IMAGE: '缩放后的图像' },
    why: '把尺寸调整做成通用节点，可在流程任意位置插入，配合超分使用。',
    tips: ['lanczos 质量较好但较慢'],
  },
  LatentUpscale: {
    category: '潜变量/放大',
    role: '在潜空间放大潜变量，再用较低 denoise 重采样补充细节。',
    params: { upscale_method: '放大算法', width: '目标宽', height: '目标高' },
    inputs: { samples: '潜变量' },
    outputs: { LATENT: '放大后的潜变量' },
    why: '潜空间放大比像素放大更省资源，配合二次 KSampler（denoise 0.5 左右）可实现高清重绘。',
    tips: ['二次采样 denoise 太高会改变构图'],
  },
  ImageInvert: {
    category: '图像',
    role: '反转图像颜色，常用于把 ControlNet 线稿的黑白关系对调。',
    inputs: { image: '输入图像' },
    outputs: { IMAGE: '反转后的图像' },
    why: 'ControlNet 对线条明暗敏感，反转节点让同一张素材适配不同模型预期。',
    tips: ['线稿黑底白线时常需要反转'],
  },
  VAEDecodeTiled: {
    category: '潜变量',
    role: '分块解码 VAE，用时间换显存，避免大图解码爆显存。',
    params: { tile_size: '分块大小', overlap: '块间重叠' },
    inputs: { samples: '潜变量', vae: 'VAE' },
    outputs: { IMAGE: '图像' },
    why: '大分辨率下 VAE 解码显存占用高，分块是典型的“以时间换空间”工程折中。',
    tips: ['显存充足时可用普通 VAEDecode 更快'],
  },
  LoadVAE: {
    category: '加载器',
    role: '单独加载外部 VAE 文件，覆盖 checkpoint 自带的 VAE。',
    params: { vae_name: 'VAE 文件名。' },
    outputs: { VAE: 'VAE 模型' },
    why: '方便针对特定画风更换 VAE（如磨损胶片、对比度增强），而不必换整个底模。',
    tips: ['文件放 models/vae'],
  },
  CLIPSetLastLayer: {
    category: '条件构建',
    role: '设置 CLIP 取用倒数第几层输出，微调提示词的抽象程度。',
    params: { stop_at_clip_layer: '层数，常用 -1 或 -2。' },
    inputs: { clip: 'CLIP' },
    outputs: { CLIP: '调整后的 CLIP' },
    why: '不同层语义粒度不同，给用户一个精细调节提示词理解方式的旋钮。',
    tips: ['SDXL 通常保持默认 -1'],
  },
  Reroute: {
    category: '工具',
    role: '连线中转节点，不改动数据，仅用于整理复杂工作流的走线。',
    inputs: { '': '任意输入' },
    outputs: { '': '相同数据' },
    why: '纯视觉整理工具，让交叉连线变清晰，不影响计算结果。',
    tips: ['在连线中途右键插入'],
  },
  PrimitiveNode: {
    category: '工具',
    role: '把一个数值/文本提升为可外部覆盖的原始输入，方便批量或 API 调用。',
    params: { value: '原始值' },
    outputs: { CONNECT: '原始值输出' },
    why: '把硬编码参数变成可注入变量，是工作流复用的关键手段。',
    tips: ['配合 API 格式调用可程序化改参'],
  },
}

// 用模糊匹配找到知识条目（兼容带后缀的节点名，如 "KSamplerAdvanced"）
export function lookupKnowledge(type = '') {
  if (NODE_KNOWLEDGE[type]) return NODE_KNOWLEDGE[type]
  const lower = type.toLowerCase()
  for (const [key, value] of Object.entries(NODE_KNOWLEDGE)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return value
  }
  return null
}

export function listKnownTypes() {
  return Object.keys(NODE_KNOWLEDGE)
}
