import { useMemo, useState } from 'react'
import { ReactFlow, ReactFlowProvider, useReactFlow, Background, Controls, MiniMap, Handle, Position, MarkerType } from '@xyflow/react'
import { buildNodeDetails } from '../nodeDetails.js'
import { layoutWorkflow } from '../layout.js'

const STATUS_COLOR = {
  added: '#22c55e',
  removed: '#ef4444',
  modified: '#f59e0b',
  default: '#6366f1',
}

const STATUS_LABEL = { added: '新增', removed: '删除', modified: '修改', default: '原有' }
const CHANGE_KIND = { addedNodes: 'added', removedNodes: 'removed', modifiedNodes: 'modified' }

function GroupBand({ data }) {
  return (
    <div className="group-band" style={{ width: data.width, height: data.height, background: data.color, borderColor: data.border }}>
      <span>{data.title}</span>
    </div>
  )
}

function WorkflowNode({ data }) {
  const color = STATUS_COLOR[data.status] || STATUS_COLOR.default
  const change = data.change
  return (
    <div className={`wf-node ${data.status || ''}`} style={{ borderColor: color }}>
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      <div className="wf-node-title" title={data.label}>{data.label}</div>
      <div className="wf-node-type">{data.type}</div>
      {change && (
        <div className="wf-change-note" style={{ color }} title={change.reason}>
          <b>{STATUS_LABEL[change.kind]}</b> {change.reason}
        </div>
      )}
      <div className="wf-node-foot">
        ID {data.id}{data.status ? ` · ${STATUS_LABEL[data.status]}` : ''}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: color }} />
    </div>
  )
}

const nodeTypes = { workflowNode: WorkflowNode, groupBand: GroupBand }

function WorkflowGraphInner({ workflow, analysis, modifications }) {
  const [selectedId, setSelectedId] = useState(null)
  const [grouped, setGrouped] = useState(false)
  const { fitView } = useReactFlow()
  const layout = useMemo(() => layoutWorkflow(workflow), [workflow])
  const details = useMemo(() => buildNodeDetails({ workflow, analysis }), [workflow, analysis])
  const selected = selectedId ? details[selectedId] : null

  const changeMap = useMemo(() => {
    const latest = [...(modifications || [])].reverse()[0]
    const map = {}
    for (const [key, kind] of Object.entries(CHANGE_KIND)) {
      for (const item of latest?.changes?.[key] || []) {
        map[String(item.id)] = { kind, reason: item.reason || '', what: item.what || '' }
      }
    }
    return map
  }, [modifications])
  const selectedChange = selectedId ? changeMap[selectedId] : null

  const nodes = useMemo(() => (workflow?.nodes || []).map((n) => {
    const id = String(n.id)
    return {
      id,
      type: 'workflowNode',
      position: grouped ? (layout.positions[id] || { x: n.pos?.x ?? 0, y: n.pos?.y ?? 0 }) : { x: n.pos?.x ?? 0, y: n.pos?.y ?? 0 },
      data: {
        label: n.label || n.type || n.id,
        type: n.type,
        id: n.id,
        status: n.changeStatus,
        change: changeMap[id],
      },
    }
  }), [workflow, layout, changeMap, grouped])

  const regionNodes = useMemo(() => (grouped ? layout.regions : []).map((r) => ({
    id: `region-${r.key}`,
    type: 'groupBand',
    position: { x: r.x, y: r.y },
    data: r,
    draggable: false,
    selectable: false,
    connectable: false,
    zIndex: -1,
  })), [layout, grouped])

  const allNodes = useMemo(() => [...regionNodes, ...nodes], [regionNodes, nodes])

  const edges = useMemo(() => (workflow?.links || []).map((l) => {
    const status = l.changeStatus
    const color = STATUS_COLOR[status] || '#64748b'
    return {
      id: String(l.id),
      source: String(l.from),
      target: String(l.to),
      label: l.type || undefined,
      animated: status === 'added',
      style: {
        stroke: color,
        strokeWidth: status ? 2.8 : 2,
        strokeDasharray: status === 'removed' ? '6 5' : undefined,
        opacity: status === 'removed' ? 0.65 : 1,
      },
      labelStyle: { fill: '#94a3b8', fontSize: 10 },
      labelBgStyle: { fill: '#0b1020', fillOpacity: 0.85 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    }
  }), [workflow])

  if (!nodes.length) return <div className="empty-state">暂无可展示的工作流</div>

  return (
    <div className="graph-wrap">
      <div className="graph-legend">
        <span><i style={{ background: STATUS_COLOR.default }} />原有</span>
        <span><i style={{ background: STATUS_COLOR.added }} />新增</span>
        <span><i style={{ background: STATUS_COLOR.removed }} />删除</span>
        <span><i style={{ background: STATUS_COLOR.modified }} />修改</span>
        <button className="graph-mode-btn" onClick={() => fitView({ nodes: nodes.filter((n) => n.data.change && n.data.change.kind !== 'removed'), duration: 500, padding: 1.2 })}>聚焦改动</button>
        <button className="graph-mode-btn" onClick={() => setGrouped((v) => !v)}>{grouped ? '切回原画布' : '按功能分区'}</button>
        <em>节点上显示改动理由，悬停可看全文；点击看完整解读</em>
      </div>
      <ReactFlow
        nodes={allNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12, minZoom: 0.7 }}
        minZoom={0.2}
        maxZoom={2}
        onNodeClick={(_, node) => { if (node.type !== 'groupBand') setSelectedId(node.id) }}
        nodesConnectable={false}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={22} size={1} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor={(n) => (n.type === 'groupBand' ? 'transparent' : STATUS_COLOR[n.data?.status] || STATUS_COLOR.default)} maskColor="rgba(11,16,32,0.75)" />
      </ReactFlow>
      {selected && (
        <aside className="node-inspector">
          <div className="node-inspector-head">
            <div>
              <h3>{selected.type}</h3>
              <small>节点 ID {selectedId}</small>
            </div>
            <button className="node-inspector-close" onClick={() => setSelectedId(null)} aria-label="关闭">×</button>
          </div>
          {selectedChange && (
            <section className="change-reason">
              <h4>本次改造原因 · {STATUS_LABEL[selectedChange.kind]}</h4>
              {selectedChange.what && <p><b>改动内容：</b>{selectedChange.what}</p>}
              <p><b>原因：</b>{selectedChange.reason}</p>
            </section>
          )}
          <section><h4>作用</h4><p>{selected.role}</p></section>
          <section><h4>为什么放在这个位置</h4><p>{selected.why}</p></section>
          <section>
            <h4>参数解读</h4>
            {selected.parameters.length ? (
              <table className="inspector-table">
                <thead><tr><th>参数</th><th>当前值</th><th>含义与设计原因</th></tr></thead>
                <tbody>
                  {selected.parameters.map((p) => (
                    <tr key={p.name}><td>{p.name}</td><td>{p.value}</td><td>{p.meaning}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="dim">暂无参数解读</p>}
          </section>
          <section>
            <h4>输入连接</h4>
            {selected.inputs.length ? (
              <ul className="inspector-list">
                {selected.inputs.map((it) => <li key={it.link}><b>{it.peer}</b><span>{it.type}</span><code>link {it.link}</code></li>)}
              </ul>
            ) : <p className="dim">无输入（流程起点）</p>}
          </section>
          <section>
            <h4>输出连接</h4>
            {selected.outputs.length ? (
              <ul className="inspector-list">
                {selected.outputs.map((it) => <li key={it.link}><b>{it.peer}</b><span>{it.type}</span><code>link {it.link}</code></li>)}
              </ul>
            ) : <p className="dim">无输出（流程终点）</p>}
          </section>
          <section>
            <h4>前后一般连接什么节点</h4>
            <p><b>上游：</b>{selected.typical.upstream}</p>
            <p><b>下游：</b>{selected.typical.downstream}</p>
          </section>
        </aside>
      )}
    </div>
  )
}

export default function WorkflowGraph(props) {
  return <ReactFlowProvider><WorkflowGraphInner {...props} /></ReactFlowProvider>
}
