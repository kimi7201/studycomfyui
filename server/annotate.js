import { parseWorkflow } from './workflowParser.js'

function keyOf(from, to) {
  return `${String(from)}→${String(to)}`
}

// 把一次改造的差异标注合并进工作流，供前端与导出 HTML 统一着色。
// status: added / removed / modified / undefined(原有)
export function annotateWorkflow(previous, newApiWorkflow, changes = {}) {
  const next = parseWorkflow(newApiWorkflow)

  const addedNodes = new Set((changes.addedNodes || []).map((n) => String(n.id)))
  const modifiedNodes = new Set((changes.modifiedNodes || []).map((n) => String(n.id)))
  const removedNodes = new Set((changes.removedNodes || []).map((n) => String(n.id)))

  for (const node of next.nodes) {
    const id = String(node.id)
    if (addedNodes.has(id)) node.changeStatus = 'added'
    else if (modifiedNodes.has(id)) node.changeStatus = 'modified'
  }

  // 被删除的节点在新工作流里不存在，补一个"幽灵节点"用于教学展示
  for (const old of previous?.nodes || []) {
    const id = String(old.id)
    if (removedNodes.has(id) && !next.nodes.some((n) => String(n.id) === id)) {
      next.nodes.push({ ...old, changeStatus: 'removed' })
    }
  }

  const addedLinkKeys = new Set((changes.addedLinks || []).map((l) => keyOf(l.from, l.to)))
  const removedLinkKeys = new Set((changes.removedLinks || []).map((l) => keyOf(l.from, l.to)))

  for (const link of next.links) {
    const k = keyOf(link.from, link.to)
    if (addedLinkKeys.has(k)) link.changeStatus = 'added'
    else if (removedLinkKeys.has(k)) link.changeStatus = 'removed'
  }

  for (const rl of changes.removedLinks || []) {
    const k = keyOf(rl.from, rl.to)
    const old = (previous?.links || []).find((l) => keyOf(l.from, l.to) === k)
    if (old && !next.links.some((l) => keyOf(l.from, l.to) === k)) {
      next.links.push({ ...old, changeStatus: 'removed' })
    }
  }

  return next
}
