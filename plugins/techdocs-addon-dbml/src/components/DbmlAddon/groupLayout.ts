import type { NodeChange } from '@xyflow/react';
import {
  GROUP_LABEL_HEIGHT,
  NODE_WIDTH,
  nodeHeight,
  type DbmlFlowNode,
  type TableFlowNode,
} from './dbmlToFlow';

/** Inner padding between a group border and its child tables. */
export const GROUP_PADDING = 24;

/** A collapsed group shrinks to a compact header-sized block. */
export const COLLAPSED_GROUP_WIDTH = 200;

/** Clearance kept between groups when one is pushed out of an overlap. */
export const GROUP_GAP = 16;

export type Rect = { x: number; y: number; width: number; height: number };

export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const tableSize = (node: TableFlowNode) => ({
  width: node.measured?.width ?? node.width ?? NODE_WIDTH,
  height:
    node.measured?.height ??
    node.height ??
    nodeHeight(node.data.fields.length),
});

const groupRect = (node: DbmlFlowNode): Rect => ({
  x: node.position.x,
  y: node.position.y,
  width: node.width ?? 0,
  height: node.height ?? 0,
});

/**
 * The rect a group actually occupies on screen: its stored (expanded)
 * bounds, or the compact header block while collapsed.
 */
export const displayGroupRect = (
  node: DbmlFlowNode,
  collapsed: boolean,
): Rect =>
  collapsed
    ? {
        x: node.position.x,
        y: node.position.y,
        width: COLLAPSED_GROUP_WIDTH,
        height: GROUP_LABEL_HEIGHT,
      }
    : groupRect(node);

/**
 * Recompute a group's bounds from its children so a dragged table never
 * leaves it: bounds + padding on the sides and bottom, label height on
 * top. Children keep their absolute spot by compensating for the moved
 * group origin — safe mid-drag, React Flow re-derives the dragged
 * child's relative position from the parent's current absolute position
 * on every drag frame. Recomputing from scratch gives shrink as well as
 * grow. Deliberately not `extent: 'parent'` (blocks growing) and not
 * `expandParent` (grow-only, no padding).
 */
export function growGroupToChildren(
  nodes: DbmlFlowNode[],
  groupId: string,
): DbmlFlowNode[] {
  const group = nodes.find(n => n.id === groupId && n.type === 'dbmlGroup');
  const children = nodes.filter(
    (n): n is TableFlowNode => n.parentId === groupId,
  );
  if (!group || children.length === 0) {
    return nodes;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const child of children) {
    const { width, height } = tableSize(child);
    minX = Math.min(minX, child.position.x);
    minY = Math.min(minY, child.position.y);
    maxX = Math.max(maxX, child.position.x + width);
    maxY = Math.max(maxY, child.position.y + height);
  }

  // New origin in the current parent-relative coordinates.
  const dx = minX - GROUP_PADDING;
  const dy = minY - GROUP_LABEL_HEIGHT;
  const width = maxX - minX + 2 * GROUP_PADDING;
  const height = maxY - minY + GROUP_PADDING + GROUP_LABEL_HEIGHT;

  if (
    dx === 0 &&
    dy === 0 &&
    group.width === width &&
    group.height === height
  ) {
    return nodes;
  }

  return nodes.map(node => {
    if (node.id === groupId) {
      return {
        ...node,
        position: { x: node.position.x + dx, y: node.position.y + dy },
        width,
        height,
      };
    }
    if (node.parentId === groupId) {
      return {
        ...node,
        position: { x: node.position.x - dx, y: node.position.y - dy },
      };
    }
    return node;
  });
}

/**
 * Wall constraint for group drags: a position change that would land a
 * group on top of another group is dropped, so the group stops at its
 * last valid position instead of overlapping. (Growth driven by a child
 * drag can still overlap a neighbor — dbdiagram accepts the same.)
 */
export function filterGroupOverlapChanges(
  changes: NodeChange<DbmlFlowNode>[],
  nodes: DbmlFlowNode[],
  collapsedIds: ReadonlySet<string> = new Set(),
): NodeChange<DbmlFlowNode>[] {
  return changes.filter(change => {
    if (change.type !== 'position' || !change.position) {
      return true;
    }
    const moving = nodes.find(n => n.id === change.id);
    if (!moving || moving.type !== 'dbmlGroup') {
      return true;
    }
    const candidate: Rect = {
      ...displayGroupRect(moving, collapsedIds.has(moving.id)),
      x: change.position.x,
      y: change.position.y,
    };
    return !nodes.some(
      other =>
        other.type === 'dbmlGroup' &&
        other.id !== moving.id &&
        rectsIntersect(candidate, displayGroupRect(other, collapsedIds.has(other.id))),
    );
  });
}

/**
 * After expanding a collapsed group its full bounds may land on another
 * group (it could be parked anywhere while compact). Push the expanded
 * group out along the shortest axis, with a small gap, repeating until
 * it sits in free space; children follow for free (parent-relative
 * positions).
 */
export function repositionExpandedGroup(
  nodes: DbmlFlowNode[],
  groupId: string,
  collapsedIds: ReadonlySet<string>,
): DbmlFlowNode[] {
  const group = nodes.find(n => n.id === groupId && n.type === 'dbmlGroup');
  if (!group) {
    return nodes;
  }
  const others = nodes
    .filter(n => n.type === 'dbmlGroup' && n.id !== groupId)
    .map(n => displayGroupRect(n, collapsedIds.has(n.id)));

  let rect = groupRect(group);
  let moved = false;
  for (let guard = 0; guard < 16; guard++) {
    let hit: Rect | undefined;
    for (const other of others) {
      if (rectsIntersect(rect, other)) {
        hit = other;
        break;
      }
    }
    if (!hit) {
      break;
    }
    const shifts = [
      { dx: hit.x + hit.width + GROUP_GAP - rect.x, dy: 0 },
      { dx: hit.x - rect.width - GROUP_GAP - rect.x, dy: 0 },
      { dx: 0, dy: hit.y + hit.height + GROUP_GAP - rect.y },
      { dx: 0, dy: hit.y - rect.height - GROUP_GAP - rect.y },
    ];
    const best = shifts.reduce((a, b) =>
      Math.hypot(a.dx, a.dy) <= Math.hypot(b.dx, b.dy) ? a : b,
    );
    rect = { ...rect, x: rect.x + best.dx, y: rect.y + best.dy };
    moved = true;
  }
  if (!moved) {
    return nodes;
  }
  return nodes.map(node =>
    node.id === groupId
      ? { ...node, position: { x: rect.x, y: rect.y } }
      : node,
  );
}
