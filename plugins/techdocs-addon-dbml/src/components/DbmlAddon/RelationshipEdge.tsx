import {
  BaseEdge,
  Position,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import type { RelationshipFlowEdge } from './dbmlToFlow';

// Straight run between a table border and the first bend; the end glyphs
// must fit inside it so they always sit on a horizontal segment.
const STUB = 20;
const FOOT_LENGTH = 10;
const FOOT_SPREAD = 5;
const TICK_OFFSET = 8;

/**
 * Crow's foot end glyph as a plain path: `─<` on a many end, `─┼` on a
 * one end. Drawn as ordinary segments inside the edge's group — unlike
 * SVG <marker> defs this needs no document-unique ids, so the inline
 * diagram and the modal can render the same edge simultaneously, and the
 * glyphs recolor together with the path via CSS.
 */
const endGlyph = (
  x: number,
  y: number,
  position: Position,
  many: boolean,
): string => {
  const dir = position === Position.Right ? 1 : -1;
  if (many) {
    const hinge = x + dir * FOOT_LENGTH;
    return [
      `M ${hinge} ${y} L ${x} ${y - FOOT_SPREAD}`,
      `M ${hinge} ${y} L ${x} ${y + FOOT_SPREAD}`,
    ].join(' ');
  }
  const tickX = x + dir * TICK_OFFSET;
  return `M ${tickX} ${y - FOOT_SPREAD} L ${tickX} ${y + FOOT_SPREAD}`;
};

export const RelationshipEdge = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
}: EdgeProps<RelationshipFlowEdge>) => {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset: STUB,
  });

  return (
    <>
      <BaseEdge path={path} />
      <path
        className="dbml-edge-end"
        d={endGlyph(sourceX, sourceY, sourcePosition, Boolean(data?.sourceMany))}
      />
      <path
        className="dbml-edge-end"
        d={endGlyph(targetX, targetY, targetPosition, Boolean(data?.targetMany))}
      />
    </>
  );
};
