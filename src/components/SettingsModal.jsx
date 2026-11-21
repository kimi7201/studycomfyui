import { useState, useEffect } from 'react'
import { X, KeyRound, Save, Info } from 'lucide-react'

export default function SettingsModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState({ apiKey: '', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' })

  useEffect(() => {
    if (open && initial) {
      setForm({
        apiKey: '',
        baseURL: initial.baseURL || 'https://api.openai.com/v1',
        model: initial.model || 'gpt-4o-mini',
      })
    }
  }, [open, initial])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div><KeyRound size={18} /> 模型设置</div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="notice">
            <Info size={15} />
            <span>不填也能用：系统会自动使用内置节点知识库进行解读。填入任意 OpenAI 兼容接口（OpenAI / DeepSeek / 通义 / 本地 Ollama 等）后，可获得更自由的解读与改造能力。</span>
          </div>
          <label>
            API Key
            {initial?.configured && (
              <span className="key-hint">当前已配置 {initial.apiKeyMasked}，留空表示保持不变</span>
            )}
          </label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="sk-…"
          />
          {initial?.configured && (
            <button className="clear-key" onClick={() => onClear?.()}>清除已保存的密钥，切回内置知识库</button>
          )}
          <label>Base URL</label>
          <input
            value={form.baseURL}
            onChange={(e) => setForm({ ...form, baseURL: e.target.value })}
            placeholder="https://api.openai.com/v1"
          />
          <label>模型名称</label>
          <input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="gpt-4o-mini"
          />
        </div>
        <div className="modal-foot">
          <button className="ghost-btn" onClick={onClose}>取消</button>
          <button className="primary-btn" onClick={() => onSave(form)}><Save size={15} /> 保存设置</button>
        </div>
      </div>
    </div>
  )
}
