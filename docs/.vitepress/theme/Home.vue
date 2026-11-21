<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, withBase } from 'vitepress'

const route = useRoute()
const isEn = computed(() => route.path.startsWith('/en'))
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 24 }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const homeLink = computed(() => withBase(isEn.value ? '/en/' : '/'))
const guideLink = computed(() => withBase(isEn.value ? '/en/guide' : '/guide'))
const langLink = computed(() => withBase(isEn.value ? '/' : '/en/'))
const switchLang = (e) => {
  e.preventDefault()
  window.location.assign(langLink.value)
}

const zh = {
  navPain: '痛点', navFeatures: '主要工作', navHow: '如何工作', navColors: '改动标注', navDocs: '文档', langText: 'English',
  eyebrow: '开源 · 为 ComfyUI 学习者而做',
  taglineA: '看懂工作流', taglineSep: '，', taglineB: '改出自己的 ComfyUI',
  desc: '导入一份工作流 JSON，AI 逐节点讲清作用、参数与设计原理。<br />想加功能？直接用 prompt 提需求，AI 告诉你<strong>加什么节点</strong>、<strong>为什么加</strong>、<strong>在 ComfyUI 里怎么操作</strong>。',
  start: '开始学习', source: '查看源码', star: 'Star on GitHub',
  heroFoot: '学中做 · 做中学 —— 每一轮改造都能回到画布上验证',
  visualBadge: 'AI 改造完成', oldNode: '旧节点',
  legend: [
    { cls: 'c-add', text: '新增 LoraLoader' },
    { cls: 'c-del', text: '删除旧节点' },
    { cls: 'c-mod', text: '修改连线' },
  ],
  marquee: ['AI 解读节点原理', 'Prompt 智能改造', '颜色化差异标注', 'ComfyUI 操作步骤', '学中做 · 做中学'],
  painKicker: '你是否也这样', painTitle: '看不懂，改不动，学不会',
  painDesc: '下载了一份别人的工作流，能跑出图，却始终停在不理解的状态。',
  painCards: [
    { icon: '?', title: '看不懂', desc: '节点一大堆，参数看不懂，为什么这么连线完全没头绪。' },
    { icon: '↗', title: '改不动', desc: '想加个功能，却不知道加哪个节点、插在哪、线从哪拖到哪。' },
    { icon: '∞', title: '学不会', desc: '教程只给结果不给思路，换个场景还是不会，知识串不起来。' },
  ],
  featKicker: '主要工作', featTitle: '从「看懂」到「改出自己的」',
  featDesc: '把 AI 变成你的 ComfyUI 导师，每一步都讲原理、给方案、能验证。',
  features: [
    { num: '01', title: '工作流结构化解析', desc: '兼容 UI 格式与 API 格式，统一解析节点、参数与连线，作为理解与改造的基础。' },
    { num: '02', title: 'AI 智能解读', desc: '逐节点讲作用、参数含义与设计意图，再梳理整条链路的数据流动过程。' },
    { num: '03', title: '学习页面留存', desc: '解读结果自动生成学习页面，可保存、重命名、导出 HTML，也可随时删除。' },
    { num: '04', title: 'Prompt 智能改造', desc: '用自然语言提需求，AI 给出新增/删除/修改方案与完整的新工作流。' },
    { num: '05', title: '颜色化差异标注', desc: '绿色新增、红色删除、黄色修改，节点和连线都能一眼看清改动。' },
    { num: '06', title: '可执行操作指引', desc: '每个新增节点都写明为什么加、参数怎么设、在 ComfyUI 里怎么拖线。' },
    { num: '07', title: '双引擎兜底', desc: '未配置 API 或调用失败时自动切换内置知识库，零配置也能体验解读与常见改造。' },
    { num: '08', title: '交互图与独立 HTML', desc: '工作流图可拖拽缩放；导出的学习页内置 SVG 示意图、差异图例与完整改造记录。' },
  ],
  howKicker: '如何工作', howTitle: '四步，学一次就记住一次',
  steps: [
    { num: '01', title: '粘贴工作流', desc: '从 ComfyUI 导出 JSON，贴进工作台输入框。' },
    { num: '02', title: '读懂原理', desc: '看节点解读与工作流图，理解每一步为什么这么设计。' },
    { num: '03', title: '提出改造', desc: '用 prompt 说需求，拿到带标注的改动和操作步骤。' },
    { num: '04', title: '回到画布验证', desc: '在 ComfyUI 里亲手改一遍，从结果里提出下一个问题。' },
  ],
  colorsKicker: '一眼看清改动', colorsTitle: '每个改动都标注原因与操作',
  colorsDesc: 'AI 不只告诉你「加了一个节点」，还会说明<strong>为什么必须加它</strong>，以及在 ComfyUI 里<strong>具体点哪里、怎么连线</strong>。颜色让你在图上直接定位变化。',
  colorsList: [
    { cls: 'c-add', title: '绿色 · 新增', desc: '新增节点与连线，附必要性说明与操作步骤' },
    { cls: 'c-del', title: '红色 · 删除', desc: '被移除的节点与断开的连线（虚线表示）' },
    { cls: 'c-mod', title: '黄色 · 修改', desc: '参数或连线被调整的节点' },
  ],
  demoNewBadge: 'NEW · 新增节点',
  demoNewDesc: '为什么新增：LoRA 需在模型加载后介入，不改原模型即可叠加画风。',
  demoNewSteps: ['右键搜索 LoraLoader 添加', '选择 lora_name 并设强度 0.8', '从 Checkpoint 拖 MODEL / CLIP 到本节点'],
  demoDelBadge: '删除节点', demoDelDesc: '原放大节点被更合适的超分链路替代。',
  demoModBadge: '修改参数', demoModDesc: 'denoise 由 1.0 改为 0.5，用于二次采样补细节而不改构图。',
  ctaTitle: '别再只是下载别人的工作流', ctaDesc: '从看懂一个节点开始，逐步改出属于自己的流程。',
  ctaStart: '立即开始',
  footerTag: '学中做，做中学 · MIT Licensed', copyright: 'Copyright © 2026 StudyComfyUI',
}

const en = {
  navPain: 'Pain Points', navFeatures: 'Features', navHow: 'How It Works', navColors: 'Change Colors', navDocs: 'Docs', langText: '中文',
  eyebrow: 'Open source · Built for ComfyUI learners',
  taglineA: 'Understand workflows', taglineSep: ', ', taglineB: 'build your own',
  desc: 'Import a workflow JSON and the AI explains every node — its purpose, parameters, and design rationale.<br />Want to add a feature? Just describe it in a prompt, and the AI tells you <strong>which node to add</strong>, <strong>why</strong>, and <strong>how to do it in ComfyUI</strong>.',
  start: 'Get Started', source: 'View Source', star: 'Star on GitHub',
  heroFoot: 'Learn by doing, do by learning — verify every change back on the canvas',
  visualBadge: 'AI modification done', oldNode: 'Removed',
  legend: [
    { cls: 'c-add', text: 'Added LoraLoader' },
    { cls: 'c-del', text: 'Removed old node' },
    { cls: 'c-mod', text: 'Modified link' },
  ],
  marquee: ['AI node explanations', 'Prompt-driven modification', 'Color-coded diffs', 'ComfyUI steps', 'Learn by doing'],
  painKicker: 'Sound familiar?', painTitle: 'Can’t read it, can’t change it, can’t learn it',
  painDesc: 'You downloaded someone else’s workflow. It produces images, but you still don’t understand it.',
  painCards: [
    { icon: '?', title: 'Can’t read it', desc: 'Too many nodes, unfamiliar parameters, and no clue why the wires go there.' },
    { icon: '↗', title: 'Can’t change it', desc: 'You want to add a feature but don’t know which node, where to put it, or what to connect.' },
    { icon: '∞', title: 'Can’t learn it', desc: 'Tutorials give results, not reasoning. A new scenario still leaves you stuck.' },
  ],
  featKicker: 'What It Does', featTitle: 'From understanding to building your own',
  featDesc: 'Turn AI into your ComfyUI mentor — every step explains the why, proposes a fix, and can be verified.',
  features: [
    { num: '01', title: 'Structured Parsing', desc: 'Supports both UI and API formats, normalizing nodes, parameters, and links as the basis for learning.' },
    { num: '02', title: 'AI Interpretation', desc: 'Explains each node’s role, parameters, and design intent, plus the data flow through the chain.' },
    { num: '03', title: 'Persistent Learning Pages', desc: 'Interpretations become learning pages you can keep, rename, export to HTML, or delete.' },
    { num: '04', title: 'Prompt-Driven Modification', desc: 'Describe a feature in plain language and get add/remove/change proposals with a new workflow.' },
    { num: '05', title: 'Color-Coded Diffs', desc: 'Green for added, red for removed, yellow for modified — nodes and links at a glance.' },
    { num: '06', title: 'Actionable Guides', desc: 'Every new node explains why it’s needed, how to set parameters, and how to drag the wires.' },
    { num: '07', title: 'Dual-Engine Fallback', desc: 'Falls back to the built-in knowledge base when no API is configured or a request fails.' },
    { num: '08', title: 'Interactive Graph & HTML', desc: 'Drag and zoom the graph; exported pages include an SVG diagram, legend, and full change history.' },
  ],
  howKicker: 'How It Works', howTitle: 'Four steps you’ll remember',
  steps: [
    { num: '01', title: 'Paste a workflow', desc: 'Export JSON from ComfyUI and paste it into the workbench.' },
    { num: '02', title: 'Learn the principles', desc: 'Read node explanations and the graph to see why each step is designed this way.' },
    { num: '03', title: 'Request a change', desc: 'Describe what you want and get annotated changes plus operation steps.' },
    { num: '04', title: 'Verify in ComfyUI', desc: 'Apply the change yourself in ComfyUI and ask the next question from the result.' },
  ],
  colorsKicker: 'See every change', colorsTitle: 'Every change explains why and how',
  colorsDesc: 'AI doesn’t just say "a node was added". It explains <strong>why it’s necessary</strong> and <strong>exactly where to click and how to connect wires</strong> in ComfyUI. Colors help you locate changes on the graph.',
  colorsList: [
    { cls: 'c-add', title: 'Green · Added', desc: 'New nodes and links, with reasons and operation steps' },
    { cls: 'c-del', title: 'Red · Removed', desc: 'Deleted nodes and disconnected links (dashed lines)' },
    { cls: 'c-mod', title: 'Yellow · Modified', desc: 'Nodes with adjusted parameters or links' },
  ],
  demoNewBadge: 'NEW · Added node',
  demoNewDesc: 'Why: LoRA must be applied after model loading to layer a style without changing the base model.',
  demoNewSteps: ['Right-click and search for LoraLoader', 'Choose lora_name and set strength to 0.8', 'Drag MODEL / CLIP from the Checkpoint into this node'],
  demoDelBadge: 'Removed node', demoDelDesc: 'The old upscaler was replaced by a better super-resolution chain.',
  demoModBadge: 'Modified parameter', demoModDesc: 'denoise changed from 1.0 to 0.5 to add detail in a second pass without changing composition.',
  ctaTitle: 'Stop just downloading other people’s workflows', ctaDesc: 'Start by understanding one node, then build a workflow of your own.',
  ctaStart: 'Start Now',
  footerTag: 'Learn by doing, do by learning · MIT Licensed', copyright: 'Copyright © 2026 StudyComfyUI',
}

const t = computed(() => (isEn.value ? en : zh))
</script>

<template>
  <div class="study-home">
    <header class="sh-nav" :class="{ solid: scrolled }">
      <a class="sh-brand" :href="homeLink">
        <span class="sh-mark"><i></i><i></i><i></i><i></i></span>
        <span class="sh-brand-text"><b>Study</b><em>ComfyUI</em></span>
      </a>
      <nav class="sh-nav-links">
        <a href="#pain">{{ t.navPain }}</a>
        <a href="#features">{{ t.navFeatures }}</a>
        <a href="#how">{{ t.navHow }}</a>
        <a href="#colors">{{ t.navColors }}</a>
        <a :href="guideLink">{{ t.navDocs }}</a>
        <a :href="langLink" @click="switchLang">{{ t.langText }}</a>
      </nav>
      <a class="sh-nav-cta" href="https://github.com/your-username/studycomfyui" target="_blank" rel="noreferrer">GitHub ↗</a>
    </header>

    <main>
      <section class="sh-hero">
        <div class="sh-grid-bg"></div>
        <div class="sh-glow sh-glow-a"></div>
        <div class="sh-glow sh-glow-b"></div>

        <div class="sh-hero-inner">
          <div class="sh-hero-copy">
            <div class="sh-eyebrow"><span class="sh-dot"></span> {{ t.eyebrow }}</div>
            <h1 class="sh-logo" aria-label="StudyComfyUI">
              <span class="sh-logo-study">Study</span><span class="sh-logo-comfy">ComfyUI</span>
            </h1>
            <p class="sh-tagline">{{ t.taglineA }}<span class="sh-sep">{{ t.taglineSep }}</span>{{ t.taglineB }}</p>
            <p class="sh-desc" v-html="t.desc"></p>
            <div class="sh-actions">
              <a class="sh-btn sh-btn-primary" :href="guideLink">{{ t.start }} <span>→</span></a>
              <a class="sh-btn sh-btn-ghost" href="https://github.com/your-username/studycomfyui" target="_blank" rel="noreferrer">{{ t.source }}</a>
            </div>
            <div class="sh-hero-foot"><span></span> {{ t.heroFoot }}</div>
          </div>

          <div class="sh-hero-visual" aria-hidden="true">
            <div class="sh-visual-card">
              <div class="sh-visual-bar">
                <span class="sh-dots"><i></i><i></i><i></i></span>
                <span class="sh-visual-title">workflow-study.json</span>
                <span class="sh-visual-badge"><i></i> {{ t.visualBadge }}</span>
              </div>
              <svg viewBox="0 0 520 360" class="sh-graph" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="shGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#818cf8" /><stop offset="1" stop-color="#38bdf8" />
                  </linearGradient>
                  <marker id="shArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M0,0 L7,3.5 L0,7 z" fill="#64748b" />
                  </marker>
                  <marker id="shArrowGreen" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M0,0 L7,3.5 L0,7 z" fill="#22c55e" />
                  </marker>
                </defs>

                <path d="M118 72 H170" stroke="#64748b" stroke-width="2" marker-end="url(#shArrow)" fill="none" />
                <path d="M218 92 V168" stroke="#64748b" stroke-width="2" marker-end="url(#shArrow)" fill="none" />
                <path d="M268 188 H318" stroke="#22c55e" stroke-width="2.5" marker-end="url(#shArrowGreen)" fill="none" />
                <path d="M268 278 H318 V208" stroke="#f59e0b" stroke-width="2.5" marker-end="url(#shArrow)" fill="none" />
                <path d="M438 188 H470 V268" stroke="#22c55e" stroke-width="2.5" marker-end="url(#shArrowGreen)" fill="none" />
                <path d="M268 188 C 360 120, 400 100, 430 96" stroke="#ef4444" stroke-width="2" stroke-dasharray="6 5" fill="none" />

                <g class="sh-node">
                  <rect x="22" y="52" width="96" height="40" rx="9" fill="#151d31" stroke="#6366f1" stroke-width="2" />
                  <text x="70" y="77" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">Checkpoint</text>
                </g>
                <g class="sh-node">
                  <rect x="170" y="72" width="98" height="40" rx="9" fill="#151d31" stroke="#6366f1" stroke-width="2" />
                  <text x="219" y="97" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">CLIP Encode</text>
                </g>
                <g class="sh-node">
                  <rect x="170" y="168" width="98" height="40" rx="9" fill="#151d31" stroke="#6366f1" stroke-width="2" />
                  <text x="219" y="193" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">KSampler</text>
                </g>
                <g class="sh-node sh-node-new">
                  <rect x="318" y="168" width="120" height="40" rx="9" fill="#12261d" stroke="#22c55e" stroke-width="2.5" />
                  <text x="378" y="193" text-anchor="middle" fill="#dcfce7" font-size="11" font-weight="700">LoraLoader</text>
                  <rect x="416" y="156" width="30" height="15" rx="7" fill="#22c55e" />
                  <text x="431" y="167" text-anchor="middle" fill="#052e16" font-size="9" font-weight="800">NEW</text>
                </g>
                <g class="sh-node sh-node-mod">
                  <rect x="170" y="258" width="98" height="40" rx="9" fill="#2a2110" stroke="#f59e0b" stroke-width="2" />
                  <text x="219" y="283" text-anchor="middle" fill="#fef3c7" font-size="11" font-weight="700">VAEDecode</text>
                </g>
                <g class="sh-node sh-node-del">
                  <rect x="430" y="76" width="80" height="38" rx="9" fill="#2a1215" stroke="#ef4444" stroke-width="2" stroke-dasharray="5 4" />
                  <text x="470" y="100" text-anchor="middle" fill="#fecaca" font-size="10" font-weight="700">{{ t.oldNode }}</text>
                </g>
                <g class="sh-node">
                  <rect x="438" y="268" width="70" height="38" rx="9" fill="#151d31" stroke="#6366f1" stroke-width="2" />
                  <text x="473" y="292" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="700">SaveImage</text>
                </g>
              </svg>
              <div class="sh-visual-foot">
                <span v-for="item in t.legend" :key="item.text"><i :class="item.cls"></i>{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sh-marquee">
          <template v-for="(item, i) in t.marquee" :key="item">
            <span>{{ item }}</span><i v-if="i < t.marquee.length - 1"></i>
          </template>
        </div>
      </section>

      <section id="pain" class="sh-section sh-pain">
        <div class="sh-wrap">
          <div class="sh-section-head">
            <span class="sh-kicker">{{ t.painKicker }}</span>
            <h2>{{ t.painTitle }}</h2>
            <p>{{ t.painDesc }}</p>
          </div>
          <div class="sh-pain-grid">
            <div class="sh-pain-card" v-for="card in t.painCards" :key="card.title">
              <div class="sh-pain-icon">{{ card.icon }}</div>
              <h3>{{ card.title }}</h3>
              <p>{{ card.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="sh-section sh-features">
        <div class="sh-wrap">
          <div class="sh-section-head">
            <span class="sh-kicker">{{ t.featKicker }}</span>
            <h2>{{ t.featTitle }}</h2>
            <p>{{ t.featDesc }}</p>
          </div>
          <div class="sh-feature-grid">
            <div class="sh-feature" v-for="item in t.features" :key="item.num">
              <div class="sh-feature-num">{{ item.num }}</div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" class="sh-section sh-how">
        <div class="sh-wrap">
          <div class="sh-section-head">
            <span class="sh-kicker">{{ t.howKicker }}</span>
            <h2>{{ t.howTitle }}</h2>
          </div>
          <div class="sh-steps">
            <div class="sh-step" v-for="step in t.steps" :key="step.num">
              <span>{{ step.num }}</span><h3>{{ step.title }}</h3><p>{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="colors" class="sh-section sh-colors">
        <div class="sh-wrap sh-colors-inner">
          <div class="sh-colors-copy">
            <span class="sh-kicker">{{ t.colorsKicker }}</span>
            <h2>{{ t.colorsTitle }}</h2>
            <p v-html="t.colorsDesc"></p>
            <ul class="sh-color-list">
              <li v-for="item in t.colorsList" :key="item.title">
                <i :class="item.cls"></i><b>{{ item.title }}</b><span>{{ item.desc }}</span>
              </li>
            </ul>
          </div>
          <div class="sh-color-demo">
            <div class="sh-demo-node add"><b>LoraLoader</b><span>{{ t.demoNewBadge }}</span><p>{{ t.demoNewDesc }}</p><ol><li v-for="step in t.demoNewSteps" :key="step">{{ step }}</li></ol></div>
            <div class="sh-demo-node del"><b>Old Upscale</b><span>{{ t.demoDelBadge }}</span><p>{{ t.demoDelDesc }}</p></div>
            <div class="sh-demo-node mod"><b>KSampler · denoise</b><span>{{ t.demoModBadge }}</span><p>{{ t.demoModDesc }}</p></div>
          </div>
        </div>
      </section>

      <section class="sh-cta">
        <div class="sh-cta-glow"></div>
        <div class="sh-wrap sh-cta-inner">
          <h2>{{ t.ctaTitle }}</h2>
          <p>{{ t.ctaDesc }}</p>
          <div class="sh-actions">
            <a class="sh-btn sh-btn-primary" :href="guideLink">{{ t.ctaStart }} <span>→</span></a>
            <a class="sh-btn sh-btn-ghost" href="https://github.com/your-username/studycomfyui" target="_blank" rel="noreferrer">{{ t.star }}</a>
          </div>
        </div>
      </section>
    </main>

    <footer class="sh-footer">
      <div class="sh-wrap sh-footer-inner">
        <span class="sh-brand-text"><b>Study</b><em>ComfyUI</em></span>
        <span>{{ t.footerTag }}</span>
        <span>{{ t.copyright }}</span>
      </div>
    </footer>
  </div>
</template>
