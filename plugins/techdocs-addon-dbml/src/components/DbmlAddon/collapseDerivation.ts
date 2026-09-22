import {
  GROUP_LABEL_HEIGHT,
  HEADER_HEIGHT,
  type DbmlFlowNode,
  type RelationshipFlowEdge,
} from './dbmlToFlow';
import { COLLAPSED_GROUP_WIDTH } from './groupLayout';

/**
 * Collapse is pure display state: the canonical nodes/edges keep their
 * full geometry (so expanding restores everything) and these helpers
 * derive what React Flow actually renders.
 *
 * Groups: children hide, the group shrinks to a compact header block.
 * Tables: the node shrinks to its header row (TableNode hides the field
 * rows off `data.collapsed`; React Flow re-measures, so group growth
 * math follows the collapsed size automatically via `measured`).
 */
export function deriveDisplayNodes(
  nodes: DbmlFlowNode[],
  collapsedGroups: ReadonlySet<string>,
  collapsedTables: ReadonlySet<string>,
): DbmlFlowNode[] {
  if (collapsedGroups.size === 0 && collapsedTables.size === 0) {
    return nodes;
  }
  return nodes.map(node => {
    if (node.type === 'dbmlGroup' && collapsedGroups.has(node.id)) {
      return {
        ...node,
        width: COLLAPSED_GROUP_WIDTH,
        height: GROUP_LABEL_HEIGHT,
        data: { ...node.data, collapsed: true },
      };
    }
    if (node.parentId && collapsedGroups.has(node.parentId)) {
      return { ...node, hidden: true };
    }
    if (node.type === 'dbmlTable' && collapsedTables.has(node.id)) {
      return {
        ...node,
        height: HEADER_HEIGHT,
        data: { ...node.data, collapsed: true },
      };
    }
    return node;
  });
}

/**
 * Edges re-anchor to whatever their endpoint collapsed into: the
 * enclosing collapsed group's block (which wins over a collapsed table
 * inside it), or the collapsed table's header. Edges internal to one
 * collapsed group drop; parallel duplicates dedupe.
 */
export function deriveDisplayEdges(
  edges: RelationshipFlowEdge[],
  nodes: DbmlFlowNode[],
  collapsedGroups: ReadonlySet<string>,
  collapsedTables: ReadonlySet<string>,
): RelationshipFlowEdge[] {
  if (collapsedGroups.size === 0 && collapsedTables.size === 0) {
    return edges;
  }
  const parentOf = new Map<string, string>();
  for (const node of nodes) {
    if (node.parentId) {
      parentOf.set(node.id, node.parentId);
    }
  }
  const seen = new Set<string>();
  const result: RelationshipFlowEdge[] = [];
  for (const edge of edges) {
    let { source, target, sourceHandle, targetHandle } = edge;
    const sourceGroup = parentOf.get(source);
    const targetGroup = parentOf.get(target);
    if (sourceGroup && collapsedGroups.has(sourceGroup)) {
      source = sourceGroup;
      sourceHandle = 'group-source';
    } else if (collapsedTables.has(source)) {
      sourceHandle = 'table-source';
    }
    if (targetGroup && collapsedGroups.has(targetGroup)) {
      target = targetGroup;
      targetHandle = 'group-target';
    } else if (collapsedTables.has(target)) {
      targetHandle = 'table-target';
    }
    if (source === target) {
      continue; // both endpoints inside the same collapsed group
    }
    const key = `${source}|${sourceHandle}|${target}|${targetHandle}`;
    if (seen.has(key)) {
      continue; // parallel edges collapse into one
    }
    seen.add(key);
    const unchanged =
      source === edge.source &&
      target === edge.target &&
      sourceHandle === edge.sourceHandle &&
      targetHandle === edge.targetHandle;
    result.push(
      unchanged ? edge : { ...edge, source, sourceHandle, target, targetHandle },
    );
  }
  return result;
}
