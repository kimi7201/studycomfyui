import { useMemo } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, MarkerType } from '@xyflow/react'

const STATUS_COLOR = {
  added: '#22c55e',
  removed: '#ef4444',
  modified: '#f59e0b',
  default: '#6366f1',
}

const STATUS_LABEL = { added: '新增', removed: '删除', modified: '修改' }

function WorkflowNode({ data }) {
  const color = STATUS_COLOR[data.status] || STATUS_COLOR.default
  return (
    <div className={`wf-node ${data.status || ''}`} style={{ borderColor: color }}>
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      <div className="wf-node-title" title={data.label}>{data.label}</div>
      <div className="wf-node-type">{data.type}</div>
      <div className="wf-node-foot">
        ID {data.id}{data.status ? ` · ${STATUS_LABEL[data.status]}` : ''}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: color }} />
    </div>
  )
}

const nodeTypes = { workflowNode: WorkflowNode }

export default function WorkflowGraph({ workflow }) {
  const nodes = useMemo(() => (workflow?.nodes || []).map((n) => ({
    id: String(n.id),
    type: 'workflowNode',
    position: { x: n.pos?.x ?? 0, y: n.pos?.y ?? 0 },
    data: {
      label: n.label || n.type || n.id,
      type: n.type,
      id: n.id,
      status: n.changeStatus,
    },
  })), [workflow])

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
        opacity: status === 'removed' ? 0.75 : 1,
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
        <em>虚线表示已删除的连线</em>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={2}
        nodesConnectable={false}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={22} size={1} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor={(n) => STATUS_COLOR[n.data?.status] || STATUS_COLOR.default} maskColor="rgba(11,16,32,0.75)" />
      </ReactFlow>
    </div>
  )
}
