<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 24 }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="study-home">
    <header class="sh-nav" :class="{ solid: scrolled }">
      <a class="sh-brand" href="/">
        <span class="sh-mark"><i></i><i></i><i></i><i></i></span>
        <span class="sh-brand-text"><b>Study</b><em>ComfyUI</em></span>
      </a>
      <nav class="sh-nav-links">
        <a href="#pain">痛点</a>
        <a href="#features">主要工作</a>
        <a href="#how">如何工作</a>
        <a href="#colors">改动标注</a>
        <a href="/guide">文档</a>
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
            <div class="sh-eyebrow"><span class="sh-dot"></span> 开源 · 为 ComfyUI 学习者而做</div>
            <h1 class="sh-logo" aria-label="StudyComfyUI">
              <span class="sh-logo-study">Study</span><span class="sh-logo-comfy">ComfyUI</span>
            </h1>
            <p class="sh-tagline">看懂工作流<span class="sh-sep">，</span>改出自己的 ComfyUI</p>
            <p class="sh-desc">
              导入一份工作流 JSON，AI 逐节点讲清作用、参数与设计原理。<br />
              想加功能？直接用 prompt 提需求，AI 告诉你<strong>加什么节点</strong>、<strong>为什么加</strong>、<strong>在 ComfyUI 里怎么操作</strong>。
            </p>
            <div class="sh-actions">
              <a class="sh-btn sh-btn-primary" href="/guide">开始学习 <span>→</span></a>
              <a class="sh-btn sh-btn-ghost" href="https://github.com/your-username/studycomfyui" target="_blank" rel="noreferrer">查看源码</a>
            </div>
            <div class="sh-hero-foot"><span></span> 学中做 · 做中学 —— 每一轮改造都能回到画布上验证</div>
          </div>

          <div class="sh-hero-visual" aria-hidden="true">
            <div class="sh-visual-card">
              <div class="sh-visual-bar">
                <span class="sh-dots"><i></i><i></i><i></i></span>
                <span class="sh-visual-title">workflow-study.json</span>
                <span class="sh-visual-badge"><i></i> AI 改造完成</span>
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
                  <text x="470" y="100" text-anchor="middle" fill="#fecaca" font-size="10" font-weight="700">旧节点</text>
                </g>
                <g class="sh-node">
                  <rect x="438" y="268" width="70" height="38" rx="9" fill="#151d31" stroke="#6366f1" stroke-width="2" />
                  <text x="473" y="292" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="700">SaveImage</text>
                </g>
              </svg>
              <div class="sh-visual-foot">
                <span><i class="c-add"></i>新增 LoraLoader</span>
                <span><i class="c-del"></i>删除旧节点</span>
                <span><i class="c-mod"></i>修改连线</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sh-marquee">
          <span>AI 解读节点原理</span><i></i><span>Prompt 智能改造</span><i></i><span>颜色化差异标注</span><i></i><span>ComfyUI 操作步骤</span><i></i><span>学中做 · 做中学</span>
        </div>
      </section>

      <section id="pain" class="sh-section sh-pain">
        <div class="sh-wrap">
          <div class="sh-section-head">
            <span class="sh-kicker">你是否也这样</span>
            <h2>看不懂，改不动，学不会</h2>
            <p>下载了一份别人的工作流，能跑出图，却始终停在不理解的状态。</p>
          </div>
          <div class="sh-pain-grid">
            <div class="sh-pain-card">
              <div class="sh-pain-icon">?</div>
              <h3>看不懂</h3>
              <p>节点一大堆，参数看不懂，为什么这么连线完全没头绪。</p>
            </div>
            <div class="sh-pain-card">
              <div class="sh-pain-icon">↗</div>
              <h3>改不动</h3>
              <p>想加个功能，却不知道加哪个节点、插在哪、线从哪拖到哪。</p>
            </div>
            <div class="sh-pain-card">
              <div class="sh-pain-icon">∞</div>
              <h3>学不会</h3>
              <p>教程只给结果不给思路，换个场景还是不会，知识串不起来。</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="sh-section sh-features">
        <div class="sh-wrap">
          <div class="sh-section-head">
            <span class="sh-kicker">主要工作</span>
            <h2>从「看懂」到「改出自己的」</h2>
            <p>把 AI 变成你的 ComfyUI 导师，每一步都讲原理、给方案、能验证。</p>
          </div>
          <div class="sh-feature-grid">
            <div class="sh-feature"><div class="sh-feature-num">01</div><h3>工作流结构化解析</h3><p>兼容 UI 格式与 API 格式，统一解析节点、参数与连线，作为理解与改造的基础。</p></div>
            <div class="sh-feature"><div class="sh-feature-num">02</div><h3>AI 智能解读</h3><p>逐节点讲作用、参数含义与设计意图，再梳理整条链路的数据流动过程。</p></div>
            <div class="sh-feature"><div class="sh-feature-num">03</div><h3>学习页面留存</h3><p>解读结果自动生成学习页面，可保存、重命名、导出 HTML，也可随时删除。</p></div>
            <div class="sh-feature"><div class="sh-feature-num">04</div><h3>Prompt 智能改造</h3><p>用自然语言提需求，AI 给出新增/删除/修改方案与完整的新工作流。</p></div>
            <div class="sh-feature"><div class="sh-feature-num">05</div><h3>颜色化差异标注</h3><p>绿色新增、红色删除、黄色修改，节点和连线都能一眼看清改动。</p></div>
            <div class="sh-feature"><div class="sh-feature-num">06</div><h3>可执行操作指引</h3><p>每个新增节点都写明为什么加、参数怎么设、在 ComfyUI 里怎么拖线。</p></div>
            <div class="sh-feature"><div class="sh-feature-num">07</div><h3>双引擎兜底</h3><p>未配置 API 或调用失败时自动切换内置知识库，零配置也能体验解读与常见改造。</p></div>
            <div class="sh-feature"><div class="sh-feature-num">08</div><h3>交互图与独立 HTML</h3><p>工作流图可拖拽缩放；导出的学习页内置 SVG 示意图、差异图例与完整改造记录。</p></div>
          </div>
        </div>
      </section>

      <section id="how" class="sh-section sh-how">
        <div class="sh-wrap">
          <div class="sh-section-head">
            <span class="sh-kicker">如何工作</span>
            <h2>四步，学一次就记住一次</h2>
          </div>
          <div class="sh-steps">
            <div class="sh-step"><span>01</span><h3>粘贴工作流</h3><p>从 ComfyUI 导出 JSON，贴进工作台输入框。</p></div>
            <div class="sh-step"><span>02</span><h3>读懂原理</h3><p>看节点解读与工作流图，理解每一步为什么这么设计。</p></div>
            <div class="sh-step"><span>03</span><h3>提出改造</h3><p>用 prompt 说需求，拿到带标注的改动和操作步骤。</p></div>
            <div class="sh-step"><span>04</span><h3>回到画布验证</h3><p>在 ComfyUI 里亲手改一遍，从结果里提出下一个问题。</p></div>
          </div>
        </div>
      </section>

      <section id="colors" class="sh-section sh-colors">
        <div class="sh-wrap sh-colors-inner">
          <div class="sh-colors-copy">
            <span class="sh-kicker">一眼看清改动</span>
            <h2>每个改动都标注原因与操作</h2>
            <p>AI 不只告诉你「加了一个节点」，还会说明<strong>为什么必须加它</strong>，以及在 ComfyUI 里<strong>具体点哪里、怎么连线</strong>。颜色让你在图上直接定位变化。</p>
            <ul class="sh-color-list">
              <li><i class="c-add"></i><b>绿色 · 新增</b><span>新增节点与连线，附必要性说明与操作步骤</span></li>
              <li><i class="c-del"></i><b>红色 · 删除</b><span>被移除的节点与断开的连线（虚线表示）</span></li>
              <li><i class="c-mod"></i><b>黄色 · 修改</b><span>参数或连线被调整的节点</span></li>
            </ul>
          </div>
          <div class="sh-color-demo">
            <div class="sh-demo-node add"><b>LoraLoader</b><span>NEW · 新增节点</span><p>为什么新增：LoRA 需在模型加载后介入，不改原模型即可叠加画风。</p><ol><li>右键搜索 LoraLoader 添加</li><li>选择 lora_name 并设强度 0.8</li><li>从 Checkpoint 拖 MODEL / CLIP 到本节点</li></ol></div>
            <div class="sh-demo-node del"><b>Old Upscale</b><span>删除节点</span><p>原放大节点被更合适的超分链路替代。</p></div>
            <div class="sh-demo-node mod"><b>KSampler · denoise</b><span>修改参数</span><p>denoise 由 1.0 改为 0.5，用于二次采样补细节而不改构图。</p></div>
          </div>
        </div>
      </section>

      <section class="sh-cta">
        <div class="sh-cta-glow"></div>
        <div class="sh-wrap sh-cta-inner">
          <h2>别再只是下载别人的工作流</h2>
          <p>从看懂一个节点开始，逐步改出属于自己的流程。</p>
          <div class="sh-actions">
            <a class="sh-btn sh-btn-primary" href="/guide">立即开始 <span>→</span></a>
            <a class="sh-btn sh-btn-ghost" href="https://github.com/your-username/studycomfyui" target="_blank" rel="noreferrer">Star on GitHub</a>
          </div>
        </div>
      </section>
    </main>

    <footer class="sh-footer">
      <div class="sh-wrap sh-footer-inner">
        <span class="sh-brand-text"><b>Study</b><em>ComfyUI</em></span>
        <span>学中做，做中学 · MIT Licensed</span>
        <span>Copyright © 2026 StudyComfyUI</span>
      </div>
    </footer>
  </div>
</template>
