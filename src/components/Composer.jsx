import { useRef, useState } from 'react'
import { Send, WandSparkles, FileJson, Loader2, Upload } from 'lucide-react'

const EXAMPLES = [
  '帮我加一个 LoRA 节点来强化画风',
  '在保存前增加 4 倍超分放大',
  '加入 ControlNet 线稿控制构图',
  '增加潜空间放大和二次采样细化',
  '删除重复的节点，并预览中间结果',
]

export default function Composer({ mode, busy, onSubmit }) {
  const [value, setValue] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setValue(text)
    setFileName(file.name)
    e.target.value = ''
  }

  const submit = () => {
    const text = value.trim()
    if (!text || busy) return
    onSubmit(text)
    setValue('')
    setFileName('')
  }

  const isNew = mode === 'new'

  return (
    <div className={`composer ${isNew ? 'composer-new' : ''}`}>
      <div className="composer-head">
        <div className="composer-icon">{isNew ? <FileJson size={18} /> : <WandSparkles size={18} />}</div>
        <div>
          <div className="composer-title">{isNew ? '导入工作流并开始解读' : '提出新功能需求，让大模型改造工作流'}</div>
          <div className="composer-desc">
            {isNew
              ? '上传或粘贴 ComfyUI 导出的工作流 JSON（UI 格式或 API 格式均可），也可以在 JSON 前后写上你的关注点'
              : '例如：加 LoRA、超分放大、ControlNet、二次采样、删除节点……改造结果会用颜色标出新增与删除'}
          </div>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit()
        }}
        placeholder={isNew ? '上传 JSON 文件，或在这里粘贴工作流 JSON…' : '描述你想要的新功能…'}
        rows={isNew ? 7 : 3}
        spellCheck={false}
      />

      {!isNew && (
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="example-chip" onClick={() => setValue(ex)}>{ex}</button>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />

      <div className="composer-actions">
        {isNew && (
          <button className="ghost-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload size={15} /> 上传 JSON
          </button>
        )}
        <span className="hint">{fileName ? `已载入 ${fileName}，可补充关注点` : 'Ctrl / ⌘ + Enter 快速提交'}</span>
        <button className="primary-btn" onClick={submit} disabled={busy || !value.trim()}>
          {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          {busy ? '处理中…' : isNew ? '解读并生成学习页面' : '改造工作流'}
        </button>
      </div>
    </div>
  )
}
