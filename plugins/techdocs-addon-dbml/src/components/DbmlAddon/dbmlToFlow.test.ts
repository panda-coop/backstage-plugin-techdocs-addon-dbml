import { Parser } from '@dbml/core';
import { MarkerType } from '@xyflow/react';
import { dbmlToFlow, type TableFlowNode } from './dbmlToFlow';

const DBML = `
Table users {
  id integer [primary key]
  username varchar [not null, note: 'login name']
  Note: 'People with accounts'
}

Table posts [headerColor: #3498db] {
  id integer [primary key]
  user_id integer
}

Ref: posts.user_id > users.id

TableGroup content [color: #8e44ad] {
  posts
}
`;

describe('dbmlToFlow', () => {
  const { nodes, edges } = dbmlToFlow(Parser.parse(DBML, 'dbmlv2'));
  const tables = nodes.filter(
    (n): n is TableFlowNode => n.type === 'dbmlTable',
  );
  const groups = nodes.filter(n => n.type === 'dbmlGroup');

  it('maps tables to nodes with fields, notes and colors', () => {
    expect(tables.map(n => n.id).sort()).toEqual([
      'public.posts',
      'public.users',
    ]);
    const users = tables.find(n => n.id === 'public.users')!;
    expect(users.data.note).toBe('People with accounts');
    expect(users.data.fields[1]).toEqual({
      name: 'username',
      type: 'varchar',
      pk: false,
      unique: false,
      notNull: true,
      note: 'login name',
    });
    const posts = tables.find(n => n.id === 'public.posts')!;
    expect(posts.data.headerColor).toBe('#3498db');
  });

  it('maps table groups to parent nodes', () => {
    expect(groups).toHaveLength(1);
    expect(groups[0].data.label).toBe('content');
    expect(groups[0].data.color).toBe('#8e44ad');
    const posts = tables.find(n => n.id === 'public.posts')!;
    expect(posts.parentId).toBe(groups[0].id);
    const users = tables.find(n => n.id === 'public.users')!;
    expect(users.parentId).toBeUndefined();
  });

  it('groups precede tables in the node order', () => {
    expect(nodes.findIndex(n => n.type === 'dbmlGroup')).toBeLessThan(
      nodes.findIndex(n => n.type === 'dbmlTable'),
    );
  });

  it('maps refs to field-anchored edges with an arrow at the one side', () => {
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      source: 'public.posts',
      sourceHandle: 'user_id-source',
      target: 'public.users',
      targetHandle: 'id-target',
    });
    expect(edges[0].markerStart).toBeUndefined();
    expect(edges[0].markerEnd).toMatchObject({ type: MarkerType.ArrowClosed });
  });

  it('lays out tables at distinct positions', () => {
    const positions = tables.map(n => `${n.position.x},${n.position.y}`);
    expect(new Set(positions).size).toBe(tables.length);
  });
});
