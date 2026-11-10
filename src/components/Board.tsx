import type { Square } from "chess.js";
import { forwardRef, useState, type PointerEvent, type Ref } from "react";
import {
  ALL_SQUARES,
  arrowPolygon,
  isLightSquare,
  piecesFromFen,
  SQ,
  squareAt,
  squareCenter,
  squareOrigin,
  type Point,
} from "../lib/geometry";
import { PIECE_SVG } from "../lib/pieces";
import type { Arrow, Circle, MarkColor } from "../lib/sheet";

/** Colours are inline so an exported SVG looks the same anywhere, and prints well in greyscale. */
export const BOARD_COLORS = {
  light: "#f4f0e6",
  dark: "#b7a993",
  border: "#2b2620",
  coord: "#5c5348",
  lastMove: "rgba(222, 184, 60, 0.45)",
  selected: "rgba(40, 110, 200, 0.35)",
  target: "rgba(30, 30, 30, 0.22)",
};

export const MARK_FILL: Record<MarkColor, string> = {
  green: "#1d7a34",
  red: "#b3261e",
  blue: "#1f4fa8",
  yellow: "#d08a00",
};

const MARGIN = 16;

export interface BoardProps {
  fen: string;
  flipped?: boolean;
  coordinates?: boolean;
  /** Show which side is to move with a marker beside the board */
  toMove?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  arrows?: Arrow[];
  circles?: Circle[];
  /** Draw pieces at all (a blank board for filling in by hand has none) */
  showPieces?: boolean;
  label?: string;
  className?: string;
  /** Interaction. Omit both for a static diagram. */
  onDraw?: (from: Square, to: Square, event: { shiftKey: boolean; altKey: boolean }) => void;
  onMove?: (from: Square, to: Square) => void;
  /** Squares the piece on `from` may move to; enables click-to-move */
  legalTargets?: (from: Square) => Square[];
  /** Setup mode: a click (from === to) or a drag of the left button. */
  onSetup?: (from: Square, to: Square) => void;
  drawColor?: MarkColor;
  /**
   * "move": left click moves pieces. "draw": every drag draws. "setup": left click or drag
   * edits the position. In every mode the right button draws.
   */
  mode?: "move" | "draw" | "setup";
}

interface Drag {
  from: Square;
  kind: "draw" | "move" | "setup";
  current: Square | null;
  /** Pointer position in board (viewBox) units */
  start: Point;
  point: Point;
  /** The piece on `from` is being carried: it follows the pointer */
  carrying: boolean;
}

/** Board units the pointer must travel before a press becomes a drag (a click stays a click). */
const LIFT_DISTANCE = 4;

export const Board = forwardRef(function Board(props: BoardProps, ref: Ref<SVGSVGElement>) {
  const {
    fen,
    flipped = false,
    coordinates = true,
    toMove = false,
    lastMove = null,
    arrows = [],
    circles = [],
    showPieces = true,
    label,
    className,
    onDraw,
    onMove,
    onSetup,
    legalTargets,
    drawColor = "green",
    mode = "move",
  } = props;
  const [drag, setDrag] = useState<Drag | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const interactive = Boolean(onDraw || onMove || onSetup);

  const left = coordinates ? MARGIN : 2;
  const bottom = coordinates ? MARGIN : 2;
  const right = toMove ? MARGIN : 2;
  const top = 2;
  const width = left + 8 * SQ + right;
  const height = top + 8 * SQ + bottom;
  const at = (p: Point) => ({ x: p.x + left, y: p.y + top });

  const pieces = showPieces ? piecesFromFen(fen) : new Map<Square, string>();
  const turn = fen.split(" ")[1] === "b" ? "b" : "w";

  const pointFromEvent = (e: PointerEvent<SVGSVGElement>): Point | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    };
  };

  const squareFromEvent = (e: PointerEvent<SVGSVGElement>): Square | null => {
    const p = pointFromEvent(e);
    return p ? squareAt({ x: p.x - left, y: p.y - top }, flipped) : null;
  };

  const ownPiece = (sq: Square) => {
    const p = pieces.get(sq);
    return p !== undefined && (p === p.toUpperCase()) === (turn === "w");
  };

  const targets = selected && legalTargets ? legalTargets(selected) : [];

  const handleDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const sq = squareFromEvent(e);
    const point = pointFromEvent(e);
    if (!sq || !point) return;
    const kind: Drag["kind"] =
      e.button === 2 || mode === "draw"
        ? "draw"
        : mode === "setup" && onSetup
          ? "setup"
          : onMove
            ? "move"
            : "draw";
    if (kind === "move" && selected && targets.includes(sq)) {
      onMove?.(selected, sq);
      setSelected(null);
      return;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ from: sq, kind, current: sq, start: point, point, carrying: false });
    if (kind === "move") setSelected(ownPiece(sq) ? sq : null);
  };

  const handleMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag) return;
    const sq = squareFromEvent(e);
    const point = pointFromEvent(e) ?? drag.point;
    const canCarry = drag.kind === "move" ? ownPiece(drag.from) : drag.kind === "setup" && pieces.has(drag.from);
    const carrying =
      drag.carrying ||
      (canCarry && Math.hypot(point.x - drag.start.x, point.y - drag.start.y) > LIFT_DISTANCE);
    if (carrying || sq !== drag.current) setDrag({ ...drag, current: sq, point, carrying });
  };

  const handleUp = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag) return;
    const sq = squareFromEvent(e);
    setDrag(null);
    if (!sq) return;
    if (drag.kind === "draw") {
      onDraw?.(drag.from, sq, { shiftKey: e.shiftKey, altKey: e.altKey });
    } else if (drag.kind === "setup") {
      onSetup?.(drag.from, sq);
    } else if (sq !== drag.from && legalTargets?.(drag.from).includes(sq)) {
      onMove?.(drag.from, sq);
      setSelected(null);
    }
  };

  const drawing = drag?.kind === "draw";
  const preview =
    drawing && drag.current && drag.current !== drag.from ? { from: drag.from, to: drag.current } : null;
  const previewCircle = drawing && drag.current === drag.from ? drag.from : null;
  const carried = drag?.carrying ? drag : null;
  const carriedPiece = carried ? pieces.get(carried.from) : undefined;
  const dropTarget =
    carried && carried.current && carried.current !== carried.from &&
    (carried.kind === "setup" || (legalTargets?.(carried.from) ?? []).includes(carried.current))
      ? carried.current
      : null;
  const sideMarkerY = (turn === "w") !== flipped ? top + 8 * SQ - 9 : top + 9;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={label ?? "Chess diagram"}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={() => setDrag(null)}
      onContextMenu={interactive ? (e) => e.preventDefault() : undefined}
      style={
        interactive ? { touchAction: "none", userSelect: "none", cursor: carried ? "grabbing" : undefined } : undefined
      }
    >
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {ALL_SQUARES.map((sq) => {
        const o = at(squareOrigin(sq, flipped));
        return (
          <rect
            key={sq}
            x={o.x}
            y={o.y}
            width={SQ}
            height={SQ}
            fill={isLightSquare(sq) ? BOARD_COLORS.light : BOARD_COLORS.dark}
          />
        );
      })}
      {lastMove &&
        [lastMove.from, lastMove.to].map((sq) => {
          const o = at(squareOrigin(sq, flipped));
          return (
            <rect
              key={`lm-${sq}`}
              data-testid="last-move"
              x={o.x}
              y={o.y}
              width={SQ}
              height={SQ}
              fill={BOARD_COLORS.lastMove}
            />
          );
        })}
      {selected && interactive && (
        <rect
          {...at(squareOrigin(selected, flipped))}
          width={SQ}
          height={SQ}
          fill={BOARD_COLORS.selected}
        />
      )}
      <rect
        x={left}
        y={top}
        width={8 * SQ}
        height={8 * SQ}
        fill="none"
        stroke={BOARD_COLORS.border}
        strokeWidth={1.5}
      />
      {coordinates &&
        Array.from({ length: 8 }, (_, i) => {
          const file = "abcdefgh"[flipped ? 7 - i : i];
          const rank = flipped ? i + 1 : 8 - i;
          return (
            <g
              key={`c${i}`}
              fill={BOARD_COLORS.coord}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={12}
              textAnchor="middle"
            >
              <text x={left + i * SQ + SQ / 2} y={top + 8 * SQ + 12}>
                {file}
              </text>
              <text x={left / 2} y={top + i * SQ + SQ / 2 + 4}>
                {rank}
              </text>
            </g>
          );
        })}
      {[...pieces].map(([sq, piece]) => {
        const o = at(squareOrigin(sq, flipped));
        return (
          <g
            key={`p-${sq}`}
            data-piece={piece}
            data-square={sq}
            transform={`translate(${o.x} ${o.y})`}
            opacity={carried?.from === sq ? 0.3 : undefined}
            dangerouslySetInnerHTML={{ __html: PIECE_SVG[piece] ?? "" }}
          />
        );
      })}
      {dropTarget && (
        <rect
          data-testid="drop-target"
          {...at(squareOrigin(dropTarget, flipped))}
          width={SQ}
          height={SQ}
          fill="none"
          stroke={BOARD_COLORS.border}
          strokeOpacity={0.55}
          strokeWidth={3}
          pointerEvents="none"
        />
      )}
      {targets.map((sq) => {
        const c = at(squareCenter(sq, flipped));
        return (
          <circle
            key={`t-${sq}`}
            cx={c.x}
            cy={c.y}
            r={pieces.has(sq) ? SQ * 0.44 : SQ * 0.14}
            fill={pieces.has(sq) ? "none" : BOARD_COLORS.target}
            stroke={pieces.has(sq) ? BOARD_COLORS.target : "none"}
            strokeWidth={pieces.has(sq) ? 4 : 0}
            pointerEvents="none"
          />
        );
      })}
      {circles.map((c) => (
        <CircleMark key={`o-${c.square}`} center={at(squareCenter(c.square, flipped))} color={MARK_FILL[c.color]} />
      ))}
      {previewCircle && (
        <CircleMark center={at(squareCenter(previewCircle, flipped))} color={MARK_FILL[drawColor]} faint />
      )}
      {arrows.map((a) => (
        <ArrowMark
          key={`a-${a.from}${a.to}`}
          from={at(squareCenter(a.from, flipped))}
          to={at(squareCenter(a.to, flipped))}
          color={MARK_FILL[a.color]}
        />
      ))}
      {preview && (
        <ArrowMark
          from={at(squareCenter(preview.from, flipped))}
          to={at(squareCenter(preview.to, flipped))}
          color={MARK_FILL[drawColor]}
          faint
        />
      )}
      {toMove && (
        <circle
          data-testid="to-move"
          cx={left + 8 * SQ + right / 2 + 0.5}
          cy={sideMarkerY}
          r={5}
          fill={turn === "w" ? "#ffffff" : BOARD_COLORS.border}
          stroke={BOARD_COLORS.border}
          strokeWidth={1.2}
        >
          <title>{turn === "w" ? "White to move" : "Black to move"}</title>
        </circle>
      )}
      {carried && carriedPiece && (
        <g
          data-testid="dragged-piece"
          transform={`translate(${carried.point.x - SQ / 2} ${carried.point.y - SQ / 2})`}
          pointerEvents="none"
          dangerouslySetInnerHTML={{ __html: PIECE_SVG[carriedPiece] ?? "" }}
        />
      )}
    </svg>
  );
});

function ArrowMark({ from, to, color, faint }: { from: Point; to: Point; color: string; faint?: boolean }) {
  const points = arrowPolygon(from, to);
  return (
    <polygon
      data-testid={faint ? undefined : "arrow"}
      points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
      fill={color}
      fillOpacity={faint ? 0.45 : 0.82}
      stroke="#ffffff"
      strokeOpacity={faint ? 0 : 0.6}
      strokeWidth={0.8}
      strokeLinejoin="round"
      pointerEvents="none"
    />
  );
}

function CircleMark({ center, color, faint }: { center: Point; color: string; faint?: boolean }) {
  return (
    <circle
      data-testid={faint ? undefined : "circle"}
      cx={center.x}
      cy={center.y}
      r={SQ * 0.43}
      fill="none"
      stroke={color}
      strokeOpacity={faint ? 0.45 : 0.9}
      strokeWidth={3.5}
      pointerEvents="none"
    />
  );
}
