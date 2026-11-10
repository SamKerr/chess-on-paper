/**
 * A sheet is a printable page set of diagrams, each with its own notation and markings.
 *
 * Sheets are deliberately never saved: paper is the record (see DECISIONS.md). A sheet
 * lives in memory until the tab closes.
 */
import type { Square } from "chess.js";
import { cardPageCount, CARDS_PER_PAGE } from "./cards";

export const MARK_COLORS = ["green", "red", "blue", "yellow"] as const;
export type MarkColor = (typeof MARK_COLORS)[number];

export interface Arrow {
  from: Square;
  to: Square;
  color: MarkColor;
}

export interface Circle {
  square: Square;
  color: MarkColor;
}

export interface Diagram {
  id: string;
  /** "position" draws pieces; "blank" is an empty board to fill in by hand */
  kind: "position" | "blank";
  notation: string;
  /** Which move to show: 0 is the start, null follows the last move */
  ply: number | null;
  caption: string;
  flipped: boolean;
  arrows: Arrow[];
  circles: Circle[];
}

export type Layout = "grid" | "cards";

export interface SheetSettings {
  /**
   * grid: 6 boards a page, 2 lines each.
   * cards: fold-over flashcards, 4 a page, answers on the back.
   */
  layout: Layout;
  coordinates: boolean;
  lastMove: boolean;
  toMove: boolean;
  ruledLines: boolean;
  /** Print the moves that led to each position */
  showMoves: boolean;
  /** Print pieces as figurines (♘f3) rather than letters */
  figurines: boolean;
}

export interface Sheet {
  version: 1;
  title: string;
  settings: SheetSettings;
  diagrams: Diagram[];
}

export const PER_PAGE: Record<Layout, number> = { grid: 6, cards: CARDS_PER_PAGE };

/** Pages when printed. */
export function pageCount(sheet: Sheet): number {
  if (sheet.settings.layout === "cards") return cardPageCount(sheet);
  return Math.max(1, Math.ceil(sheet.diagrams.length / PER_PAGE[sheet.settings.layout]));
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `d${Date.now().toString(36)}${counter.toString(36)}`;
}

export function newDiagram(overrides: Partial<Diagram> = {}): Diagram {
  return {
    id: newId(),
    kind: "position",
    notation: "",
    ply: null,
    caption: "",
    flipped: false,
    arrows: [],
    circles: [],
    ...overrides,
  };
}

export const DEFAULT_SETTINGS: SheetSettings = {
  layout: "grid",
  coordinates: true,
  lastMove: true,
  toMove: true,
  ruledLines: true,
  showMoves: true,
  figurines: false,
};

export function newSheet(): Sheet {
  return {
    version: 1,
    title: "",
    settings: { ...DEFAULT_SETTINGS },
    diagrams: [newDiagram()],
  };
}

/** Whether closing the tab would lose anything the user made. */
export function hasContent(sheet: Sheet): boolean {
  return (
    sheet.title.trim() !== "" ||
    sheet.diagrams.length > 1 ||
    sheet.diagrams.some(
      (d) =>
        d.kind === "blank" ||
        d.notation.trim() !== "" ||
        d.caption.trim() !== "" ||
        d.arrows.length > 0 ||
        d.circles.length > 0,
    )
  );
}

/** Add the arrow if it is not there; remove it if it is (same squares, any colour). */
export function toggleArrow(arrows: Arrow[], arrow: Arrow): Arrow[] {
  const i = arrows.findIndex((a) => a.from === arrow.from && a.to === arrow.to);
  if (i === -1) return [...arrows, arrow];
  if (arrows[i].color !== arrow.color) return arrows.map((a, j) => (j === i ? arrow : a));
  return arrows.filter((_, j) => j !== i);
}

export function toggleCircle(circles: Circle[], circle: Circle): Circle[] {
  const i = circles.findIndex((c) => c.square === circle.square);
  if (i === -1) return [...circles, circle];
  if (circles[i].color !== circle.color) return circles.map((c, j) => (j === i ? circle : c));
  return circles.filter((_, j) => j !== i);
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Earlier versions saved the sheet here. Remove it so no study stays on the computer. */
const LEGACY_STORAGE_KEY = "chess-diagrams:sheet";

export function forgetSavedSheet(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage may be blocked, in which case nothing was saved either.
  }
}
