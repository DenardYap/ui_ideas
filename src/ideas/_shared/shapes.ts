/**
 * Shared geometric "scene" used by the elemental ideas (Pyre, Tide, Lumen,
 * Loam, Volt). Each element interprets the SAME composition through a
 * different physical simulation — same canvas, different forces.
 *
 * Shapes are defined proportionally so the layout holds at any size.
 */

export const TAU = Math.PI * 2;

export type Shape =
  | { id: number; kind: 'rect'; x: number; y: number; w: number; h: number }
  | { id: number; kind: 'circle'; cx: number; cy: number; r: number }
  | {
      id: number;
      kind: 'ring';
      cx: number;
      cy: number;
      r: number;
      thickness: number;
    }
  | {
      id: number;
      kind: 'triangle';
      ax: number; ay: number;
      bx: number; by: number;
      cx: number; cy: number;
    };

export function buildShapes(W: number, H: number): Shape[] {
  const u = Math.min(W, H);
  return [
    { id: 0, kind: 'rect', x: W * 0.05, y: H * 0.34, w: u * 0.26, h: u * 0.26 },
    { id: 1, kind: 'circle', cx: W * 0.4, cy: H * 0.22, r: u * 0.07 },
    {
      id: 2,
      kind: 'triangle',
      ax: W * 0.36, ay: H * 0.42,
      bx: W * 0.66, by: H * 0.42,
      cx: W * 0.5,  cy: H * 0.94,
    },
    {
      id: 3,
      kind: 'ring',
      cx: W * 0.8,
      cy: H * 0.55,
      r: u * 0.24,
      thickness: u * 0.04,
    },
    { id: 4, kind: 'circle', cx: W * 0.8, cy: H * 0.55, r: u * 0.075 },
    { id: 5, kind: 'rect', x: W * 0.18, y: H * 0.78, w: u * 0.11, h: u * 0.11 },
    { id: 6, kind: 'circle', cx: W * 0.92, cy: H * 0.18, r: u * 0.025 },
  ];
}

function sign(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}

export function pointInTriangle(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
) {
  const d1 = sign(px, py, ax, ay, bx, by);
  const d2 = sign(px, py, bx, by, cx, cy);
  const d3 = sign(px, py, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export function hitShape(s: Shape, x: number, y: number, pad = 8): boolean {
  switch (s.kind) {
    case 'rect':
      return x >= s.x - pad && x <= s.x + s.w + pad && y >= s.y - pad && y <= s.y + s.h + pad;
    case 'circle': {
      const dx = x - s.cx, dy = y - s.cy;
      return dx * dx + dy * dy <= (s.r + pad) * (s.r + pad);
    }
    case 'ring': {
      const dx = x - s.cx, dy = y - s.cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(d - s.r) <= s.thickness / 2 + pad;
    }
    case 'triangle':
      return pointInTriangle(x, y, s.ax, s.ay, s.bx, s.by, s.cx, s.cy);
  }
}

export function shapeCentroid(s: Shape): { x: number; y: number } {
  switch (s.kind) {
    case 'rect':     return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
    case 'circle':
    case 'ring':     return { x: s.cx, y: s.cy };
    case 'triangle': return {
      x: (s.ax + s.bx + s.cx) / 3,
      y: (s.ay + s.by + s.cy) / 3,
    };
  }
}

/** Approximate axis-aligned bounding box. */
export function shapeBBox(s: Shape): { minX: number; minY: number; maxX: number; maxY: number } {
  switch (s.kind) {
    case 'rect':
      return { minX: s.x, minY: s.y, maxX: s.x + s.w, maxY: s.y + s.h };
    case 'circle':
      return { minX: s.cx - s.r, minY: s.cy - s.r, maxX: s.cx + s.r, maxY: s.cy + s.r };
    case 'ring': {
      const R = s.r + s.thickness / 2;
      return { minX: s.cx - R, minY: s.cy - R, maxX: s.cx + R, maxY: s.cy + R };
    }
    case 'triangle': {
      const minX = Math.min(s.ax, s.bx, s.cx);
      const minY = Math.min(s.ay, s.by, s.cy);
      const maxX = Math.max(s.ax, s.bx, s.cx);
      const maxY = Math.max(s.ay, s.by, s.cy);
      return { minX, minY, maxX, maxY };
    }
  }
}

export function tracePath(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.beginPath();
  switch (s.kind) {
    case 'rect':
      ctx.rect(s.x, s.y, s.w, s.h);
      break;
    case 'circle':
      ctx.arc(s.cx, s.cy, s.r, 0, TAU);
      break;
    case 'ring':
      ctx.arc(s.cx, s.cy, s.r + s.thickness / 2, 0, TAU);
      ctx.arc(s.cx, s.cy, s.r - s.thickness / 2, 0, TAU, true);
      break;
    case 'triangle':
      ctx.moveTo(s.ax, s.ay);
      ctx.lineTo(s.bx, s.by);
      ctx.lineTo(s.cx, s.cy);
      ctx.closePath();
      break;
  }
}

/**
 * Returns vertices for polygon-like shapes (rect, triangle). Circles/rings
 * return an empty list — callers should handle them analytically.
 */
export function shapeVertices(s: Shape): Array<{ x: number; y: number }> {
  switch (s.kind) {
    case 'rect':
      return [
        { x: s.x, y: s.y },
        { x: s.x + s.w, y: s.y },
        { x: s.x + s.w, y: s.y + s.h },
        { x: s.x, y: s.y + s.h },
      ];
    case 'triangle':
      return [
        { x: s.ax, y: s.ay },
        { x: s.bx, y: s.by },
        { x: s.cx, y: s.cy },
      ];
    default:
      return [];
  }
}
