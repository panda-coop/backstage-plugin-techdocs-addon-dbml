import dagre from '@dagrejs/dagre';
import type { Database } from '@dbml/core';
import type { Edge, Node } from '@xyflow/react';

export type FieldEnum = {
  name: string;
  values: Array<{ name: string; note?: string }>;
};

export type TableField = {
  name: string;
  type: string;
  pk: boolean;
  unique: boolean;
  notNull: boolean;
  note?: string;
  enum?: FieldEnum;
};

export type TableNodeData = {
  label: string;
  fields: TableField[];
  headerColor?: string;
  note?: string;
  [key: string]: unknown;
};

export type GroupNodeData = {
  label: string;
  color?: string;
  colorIndex: number;
  note?: string;
  [key: string]: unknown;
};

export type RelationshipEdgeData = {
  sourceMany: boolean;
  targetMany: boolean;
  [key: string]: unknown;
};

export type RelationshipFlowEdge = Edge<
  RelationshipEdgeData,
  'dbmlRelationship'
>;

export type TableFlowNode = Node<TableNodeData, 'dbmlTable'>;
export type GroupFlowNode = Node<GroupNodeData, 'dbmlGroup'>;
export type DbmlFlowNode = TableFlowNode | GroupFlowNode;

// Sizing must match TableNode's rendering: dagre lays out before React Flow
// measures anything.
export const NODE_WIDTH = 240;
export const HEADER_HEIGHT = 34;
export const ROW_HEIGHT = 26;
export const GROUP_LABEL_HEIGHT = 28;

export const nodeHeight = (fieldCount: number) =>
  HEADER_HEIGHT + fieldCount * ROW_HEIGHT;

const tableId = (schemaName: string | null | undefined, tableName: string) =>
  `${schemaName || 'public'}.${tableName}`;

export function dbmlToFlow(database: Database): {
  nodes: DbmlFlowNode[];
  edges: RelationshipFlowEdge[];
} {
  const tables: TableFlowNode[] = [];
  const groups: GroupFlowNode[] = [];
  const edges: RelationshipFlowEdge[] = [];
  const groupOfTable = new Map<string, string>();
  const multiSchema = (database.schemas ?? []).length > 1;
  let groupIndex = 0;

  for (const schema of database.schemas ?? []) {
    for (const group of schema.tableGroups ?? []) {
      const groupId = `group:${schema.name}.${group.name}`;
      groups.push({
        id: groupId,
        type: 'dbmlGroup',
        position: { x: 0, y: 0 },
        data: {
          label: group.name,
          color:
            group.color && group.color !== 'none' ? group.color : undefined,
          colorIndex: groupIndex,
          note: group.note || undefined,
        },
      });
      groupIndex += 1;
      for (const table of group.tables ?? []) {
        groupOfTable.set(tableId(schema.name, table.name), groupId);
      }
    }

    for (const table of schema.tables ?? []) {
      const fields: TableField[] = table.fields.map(field => ({
        name: field.name,
        type: field.type?.type_name ?? '',
        pk: Boolean(field.pk),
        unique: Boolean(field.unique),
        notNull: Boolean(field.not_null),
        note: field.note || undefined,
        // The parser binds column types to declared enums (schema-qualified
        // resolution included), so detection is just reading the property.
        enum: field._enum
          ? {
              name: field._enum.name,
              values: (field._enum.values ?? []).map(value => ({
                name: value.name,
                note: value.note || undefined,
              })),
            }
          : undefined,
      }));
      tables.push({
        id: tableId(schema.name, table.name),
        type: 'dbmlTable',
        position: { x: 0, y: 0 },
        data: {
          label: multiSchema ? `${schema.name}.${table.name}` : table.name,
          fields,
          headerColor: table.headerColor || undefined,
          note: table.note || undefined,
        },
      });
    }

    (schema.refs ?? []).forEach((ref, refIndex) => {
      const [from, to] = ref.endpoints;
      if (!from || !to) {
        return;
      }
      // Cardinality per endpoint feeds the crow's foot rendering; the
      // relation can be a range ('0..1'), so "many" means it contains '*'.
      edges.push({
        id: `${schema.name}-ref-${refIndex}`,
        source: tableId(from.schemaName, from.tableName),
        sourceHandle: `${from.fieldNames?.[0] ?? ''}-source`,
        target: tableId(to.schemaName, to.tableName),
        targetHandle: `${to.fieldNames?.[0] ?? ''}-target`,
        type: 'dbmlRelationship',
        data: {
          sourceMany: String(from.relation ?? '').includes('*'),
          targetMany: String(to.relation ?? '').includes('*'),
        },
      });
    });
  }

  const graph = new dagre.graphlib.Graph({ compound: true });
  graph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80, marginy: 8 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const group of groups) {
    graph.setNode(group.id, {});
  }
  for (const table of tables) {
    graph.setNode(table.id, {
      width: NODE_WIDTH,
      height: nodeHeight(table.data.fields.length),
    });
    const parent = groupOfTable.get(table.id);
    if (parent) {
      graph.setParent(table.id, parent);
    }
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }
  dagre.layout(graph);

  for (const group of groups) {
    const placed = graph.node(group.id);
    group.position = {
      x: placed.x - placed.width / 2,
      y: placed.y - placed.height / 2 - GROUP_LABEL_HEIGHT,
    };
    group.width = placed.width;
    group.height = placed.height + GROUP_LABEL_HEIGHT;
  }

  for (const table of tables) {
    const placed = graph.node(table.id);
    const height = nodeHeight(table.data.fields.length);
    let x = placed.x - NODE_WIDTH / 2;
    let y = placed.y - height / 2;
    const parentId = groupOfTable.get(table.id);
    if (parentId) {
      // React Flow child positions are relative to the parent node.
      const parent = groups.find(g => g.id === parentId)!;
      x -= parent.position.x;
      y -= parent.position.y;
      table.parentId = parentId;
    }
    table.position = { x, y };
  }

  // Parents must precede children in the nodes array for React Flow.
  return { nodes: [...groups, ...tables], edges };
}
