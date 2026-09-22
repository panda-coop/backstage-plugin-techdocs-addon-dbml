import type { NodeChange } from '@xyflow/react';
import {
  GROUP_LABEL_HEIGHT,
  nodeHeight,
  type DbmlFlowNode,
  type GroupFlowNode,
  type TableFlowNode,
} from './dbmlToFlow';
import {
  GROUP_GAP,
  GROUP_PADDING,
  filterGroupOverlapChanges,
  growGroupToChildren,
  rectsIntersect,
  repositionExpandedGroup,
} from './groupLayout';

const group = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): GroupFlowNode => ({
  id,
  type: 'dbmlGroup',
  position: { x, y },
  width,
  height,
  data: { label: id, colorIndex: 0 },
});

const table = (
  id: string,
  x: number,
  y: number,
  parentId?: string,
  fieldCount = 2,
): TableFlowNode => ({
  id,
  type: 'dbmlTable',
  position: { x, y },
  parentId,
  data: {
    label: id,
    fields: Array.from({ length: fieldCount }, (_, i) => ({
      name: `f${i}`,
      type: 'integer',
      pk: false,
      unique: false,
      notNull: false,
    })),
  },
});

describe('rectsIntersect', () => {
  it('detects overlap and separation', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    expect(rectsIntersect(a, { x: 50, y: 50, width: 100, height: 100 })).toBe(
      true,
    );
    expect(rectsIntersect(a, { x: 100, y: 0, width: 10, height: 10 })).toBe(
      false,
    );
  });
});

describe('growGroupToChildren', () => {
  const tableH = nodeHeight(2);

  it('wraps children with padding and label height, preserving absolute child positions', () => {
    const nodes: DbmlFlowNode[] = [
      group('g', 100, 100, 300, 200),
      // Child dragged left/above the padded area (relative coords).
      table('t1', 4, 10, 'g'),
      table('t2', 300, 120, 'g'),
    ];
    const result = growGroupToChildren(nodes, 'g');
    const g = result.find(n => n.id === 'g')!;
    const t1 = result.find(n => n.id === 't1')!;
    const t2 = result.find(n => n.id === 't2')!;

    expect(g.width).toBe(300 - 4 + 240 + 2 * GROUP_PADDING);
    expect(g.height).toBe(120 - 10 + tableH + GROUP_PADDING + GROUP_LABEL_HEIGHT);
    // Group origin moved so t1 sits at the padded corner.
    expect(t1.position).toEqual({ x: GROUP_PADDING, y: GROUP_LABEL_HEIGHT });
    // Absolute positions unchanged: group delta compensated on children.
    expect(g.position.x + t1.position.x).toBe(100 + 4);
    expect(g.position.y + t1.position.y).toBe(100 + 10);
    expect(g.position.x + t2.position.x).toBe(100 + 300);
    expect(g.position.y + t2.position.y).toBe(100 + 120);
  });

  it('returns the array unchanged when bounds already fit', () => {
    const nodes: DbmlFlowNode[] = [
      group(
        'g',
        0,
        0,
        240 + 2 * GROUP_PADDING,
        tableH + GROUP_PADDING + GROUP_LABEL_HEIGHT,
      ),
      table('t1', GROUP_PADDING, GROUP_LABEL_HEIGHT, 'g'),
    ];
    expect(growGroupToChildren(nodes, 'g')).toBe(nodes);
  });

  it('ignores unknown groups and groups without children', () => {
    const nodes: DbmlFlowNode[] = [group('g', 0, 0, 100, 100), table('t', 0, 0)];
    expect(growGroupToChildren(nodes, 'g')).toBe(nodes);
    expect(growGroupToChildren(nodes, 'missing')).toBe(nodes);
  });
});

describe('filterGroupOverlapChanges', () => {
  const nodes: DbmlFlowNode[] = [
    group('g1', 0, 0, 100, 100),
    group('g2', 200, 0, 100, 100),
    table('t1', 10, 10, 'g1'),
  ];
  const move = (id: string, x: number, y: number): NodeChange<DbmlFlowNode> => ({
    type: 'position',
    id,
    position: { x, y },
  });

  it('drops a group move that would land on another group', () => {
    expect(filterGroupOverlapChanges([move('g1', 150, 0)], nodes)).toEqual([]);
  });

  it('keeps a group move into free space', () => {
    const changes = [move('g1', 0, 200)];
    expect(filterGroupOverlapChanges(changes, nodes)).toEqual(changes);
  });

  it('never touches table moves or other change types', () => {
    const changes: NodeChange<DbmlFlowNode>[] = [
      move('t1', 500, 500),
      { type: 'select', id: 'g1', selected: true },
    ];
    expect(filterGroupOverlapChanges(changes, nodes)).toEqual(changes);
  });

  it('constrains a collapsed group at its compact on-screen size', () => {
    // At y=-50 the full 100-high group would still reach into g2's rows,
    // but the collapsed header block (28 high) ends above them.
    const changes = [move('g1', 150, -50)];
    expect(
      filterGroupOverlapChanges(changes, nodes, new Set(['g1'])),
    ).toEqual(changes);
    expect(filterGroupOverlapChanges(changes, nodes)).toEqual([]);
  });
});

describe('repositionExpandedGroup', () => {
  it('pushes an expanded group out of an overlap along the shortest axis', () => {
    const nodes: DbmlFlowNode[] = [
      group('g1', 0, 0, 200, 100),
      group('g2', 150, 0, 200, 100),
    ];
    const result = repositionExpandedGroup(nodes, 'g1', new Set());
    const g1 = result.find(n => n.id === 'g1')!;
    // Shortest way out is leftwards: g2.x - width - gap.
    expect(g1.position).toEqual({ x: 150 - 200 - GROUP_GAP, y: 0 });
    const g2 = result.find(n => n.id === 'g2')!;
    expect(g2.position).toEqual({ x: 150, y: 0 });
  });

  it('treats collapsed neighbors at their compact size', () => {
    const nodes: DbmlFlowNode[] = [
      group('g1', 0, 0, 200, 100),
      // Expanded this would overlap; collapsed it only spans the header.
      group('g2', 100, 60, 300, 300),
    ];
    const untouched = repositionExpandedGroup(nodes, 'g2', new Set(['g1']));
    expect(untouched.find(n => n.id === 'g2')!.position).toEqual({
      x: 100,
      y: 60,
    });
  });

  it('returns the array unchanged when the group already sits free', () => {
    const nodes: DbmlFlowNode[] = [
      group('g1', 0, 0, 100, 100),
      group('g2', 200, 200, 100, 100),
    ];
    expect(repositionExpandedGroup(nodes, 'g1', new Set())).toBe(nodes);
  });
});
