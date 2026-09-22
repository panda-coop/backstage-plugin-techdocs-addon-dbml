import {
  GROUP_LABEL_HEIGHT,
  HEADER_HEIGHT,
  type DbmlFlowNode,
  type GroupFlowNode,
  type RelationshipFlowEdge,
  type TableFlowNode,
} from './dbmlToFlow';
import { COLLAPSED_GROUP_WIDTH } from './groupLayout';
import { deriveDisplayEdges, deriveDisplayNodes } from './collapseDerivation';

const group = (id: string): GroupFlowNode => ({
  id,
  type: 'dbmlGroup',
  position: { x: 0, y: 0 },
  width: 400,
  height: 300,
  data: { label: id, colorIndex: 0 },
});

const table = (id: string, parentId?: string): TableFlowNode => ({
  id,
  type: 'dbmlTable',
  position: { x: 0, y: 0 },
  parentId,
  data: {
    label: id,
    fields: [
      { name: 'id', type: 'integer', pk: true, unique: false, notNull: true },
    ],
  },
});

const edge = (
  id: string,
  source: string,
  target: string,
): RelationshipFlowEdge => ({
  id,
  source,
  sourceHandle: 'id-source',
  target,
  targetHandle: 'id-target',
  type: 'dbmlRelationship',
  data: { sourceMany: true, targetMany: false },
});

const none = new Set<string>();

describe('deriveDisplayNodes', () => {
  const nodes: DbmlFlowNode[] = [group('g'), table('a', 'g'), table('b')];

  it('returns the same array when nothing is collapsed', () => {
    expect(deriveDisplayNodes(nodes, none, none)).toBe(nodes);
  });

  it('shrinks collapsed groups and hides their children', () => {
    const result = deriveDisplayNodes(nodes, new Set(['g']), none);
    const g = result.find(n => n.id === 'g')!;
    expect(g.width).toBe(COLLAPSED_GROUP_WIDTH);
    expect(g.height).toBe(GROUP_LABEL_HEIGHT);
    expect(g.data.collapsed).toBe(true);
    expect(result.find(n => n.id === 'a')!.hidden).toBe(true);
    expect(result.find(n => n.id === 'b')!.hidden).toBeUndefined();
  });

  it('shrinks collapsed tables to their header', () => {
    const result = deriveDisplayNodes(nodes, none, new Set(['b']));
    const b = result.find(n => n.id === 'b')!;
    expect(b.height).toBe(HEADER_HEIGHT);
    expect(b.data.collapsed).toBe(true);
  });
});

describe('deriveDisplayEdges', () => {
  const nodes: DbmlFlowNode[] = [
    group('g'),
    table('a', 'g'),
    table('b'),
    table('c'),
  ];

  it('re-anchors edges at a collapsed table to its header handles', () => {
    const edges = [edge('e1', 'b', 'c')];
    const result = deriveDisplayEdges(edges, nodes, none, new Set(['b']));
    expect(result[0]).toMatchObject({
      source: 'b',
      sourceHandle: 'table-source',
      target: 'c',
      targetHandle: 'id-target',
    });
  });

  it('lets a collapsed group win over a collapsed table inside it', () => {
    const edges = [edge('e1', 'a', 'b')];
    const result = deriveDisplayEdges(
      edges,
      nodes,
      new Set(['g']),
      new Set(['a']),
    );
    expect(result[0]).toMatchObject({
      source: 'g',
      sourceHandle: 'group-source',
    });
  });

  it('dedupes parallel edges onto a collapsed table', () => {
    const edges = [edge('e1', 'b', 'c'), edge('e2', 'b', 'c')];
    // Both re-anchor to the same header handles; only one survives.
    const result = deriveDisplayEdges(edges, nodes, none, new Set(['b', 'c']));
    expect(result).toHaveLength(1);
  });

  it('returns the same array when nothing is collapsed', () => {
    const edges = [edge('e1', 'b', 'c')];
    expect(deriveDisplayEdges(edges, nodes, none, none)).toBe(edges);
  });
});
