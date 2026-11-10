import { useCallback, useEffect, useState } from "react";
import { DiagramEditor } from "./components/DiagramEditor";
import { DiagramList } from "./components/DiagramList";
import { ImportGameDialog } from "./components/ImportGameDialog";
import { PrintSheet } from "./components/PrintSheet";
import {
  forgetSavedSheet,
  hasContent,
  moveItem,
  newDiagram,
  newId,
  newSheet,
  pageCount as countPages,
  type Diagram,
  type Layout,
  type Sheet,
  type SheetSettings,
} from "./lib/sheet";

type View = "edit" | "preview";

/**
 * Nothing here is saved: the sheet exists until the tab closes. `initialSheet` is for tests.
 */
export default function App({ initialSheet }: { initialSheet?: Sheet } = {}) {
  const [sheet, setSheet] = useState<Sheet>(() => initialSheet ?? newSheet());
  const [selectedId, setSelectedId] = useState<string | null>(() => sheet.diagrams[0]?.id ?? null);
  const [view, setView] = useState<View>("edit");
  const [undo, setUndo] = useState<{ diagram: Diagram; index: number } | null>(null);
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(forgetSavedSheet, []);

  // Nothing is saved, so ask before a refresh or a closed tab throws work away.
  const unsaved = hasContent(sheet);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const selectedIndex = sheet.diagrams.findIndex((d) => d.id === selectedId);
  const selected = selectedIndex >= 0 ? sheet.diagrams[selectedIndex] : null;

  const updateDiagram = useCallback(
    (patch: Partial<Diagram>) =>
      setSheet((s) => ({
        ...s,
        diagrams: s.diagrams.map((d) => (d.id === selectedId ? { ...d, ...patch } : d)),
      })),
    [selectedId],
  );

  const updateSettings = (patch: Partial<SheetSettings>) =>
    setSheet((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const addDiagram = (kind: Diagram["kind"]) => {
    const d = newDiagram({ kind });
    setSheet((s) => ({ ...s, diagrams: [...s.diagrams, d] }));
    setSelectedId(d.id);
    setView("edit");
  };

  const addImported = (diagrams: Diagram[], title: string) => {
    setSheet((cur) => ({
      ...cur,
      title: cur.title || title,
      diagrams: [...cur.diagrams, ...diagrams],
    }));
    setSelectedId(diagrams[0]?.id ?? selectedId);
    setImporting(false);
    setView("edit");
    setNotice(`Added ${diagrams.length} ${diagrams.length === 1 ? "diagram" : "diagrams"} from the game`);
  };

  /** Start a new diagram from the position on screen, right after the current one. */
  const branch = (notation: string, flipped: boolean) => {
    const d = newDiagram({ notation, flipped });
    setSheet((s) => {
      const diagrams = [...s.diagrams];
      const at = diagrams.findIndex((x) => x.id === selectedId);
      diagrams.splice(at + 1, 0, d);
      return { ...s, diagrams };
    });
    setSelectedId(d.id);
  };

  const addAfterSelected = (added: Diagram[]) => {
    setSheet((s) => {
      const diagrams = [...s.diagrams];
      const at = diagrams.findIndex((x) => x.id === selectedId);
      diagrams.splice(at + 1, 0, ...added);
      return { ...s, diagrams };
    });
    setNotice(`Added ${added.length} ${added.length === 1 ? "position" : "positions"} to the sheet`);
  };

  const duplicate = (index: number) => {
    const copy = { ...sheet.diagrams[index], id: newId() };
    setSheet((s) => {
      const diagrams = [...s.diagrams];
      diagrams.splice(index + 1, 0, copy);
      return { ...s, diagrams };
    });
    setSelectedId(copy.id);
  };

  const remove = (index: number) => {
    const diagram = sheet.diagrams[index];
    const rest = sheet.diagrams.filter((_, i) => i !== index);
    setSheet((s) => ({ ...s, diagrams: s.diagrams.filter((d) => d.id !== diagram.id) }));
    if (diagram.id === selectedId) setSelectedId(rest[Math.min(index, rest.length - 1)]?.id ?? null);
    setUndo({ diagram, index });
  };

  const restore = () => {
    if (!undo) return;
    setSheet((s) => {
      const diagrams = [...s.diagrams];
      diagrams.splice(Math.min(undo.index, diagrams.length), 0, undo.diagram);
      return { ...s, diagrams };
    });
    setSelectedId(undo.diagram.id);
    setUndo(null);
  };

  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), 8000);
    return () => window.clearTimeout(t);
  }, [undo]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const pageCount = countPages(sheet);
  const s = sheet.settings;

  return (
    <>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">Chess on Paper</span>
          </div>
          <input
            className="sheet-title"
            aria-label="Sheet title"
            placeholder="Untitled sheet"
            value={sheet.title}
            onChange={(e) => setSheet((cur) => ({ ...cur, title: e.target.value }))}
          />
          <div className="segmented" role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === "edit"} className={view === "edit" ? "on" : ""} onClick={() => setView("edit")}>
              Edit
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "preview"}
              className={view === "preview" ? "on" : ""}
              onClick={() => setView("preview")}
            >
              Print preview
            </button>
          </div>
          <button type="button" className="btn primary" onClick={() => window.print()}>
            Print {pageCount} {pageCount === 1 ? "page" : "pages"}
          </button>
        </header>

        <aside className="sidebar">
          <div className="sidebar-actions">
            <button type="button" className="btn" onClick={() => addDiagram("position")}>
              + Position
            </button>
            <button type="button" className="btn" onClick={() => addDiagram("blank")}>
              + Blank board
            </button>
          </div>
          <button type="button" className="btn ghost import-btn" onClick={() => setImporting(true)}>
            Import a game (PGN)…
          </button>
          {sheet.diagrams.length === 0 ? (
            <p className="empty">No diagrams yet. Add a position to start, or a blank board to draw on by hand.</p>
          ) : (
            <DiagramList
              diagrams={sheet.diagrams}
              selectedId={selectedId}
              settings={s}
              onSelect={(id) => {
                setSelectedId(id);
                setView("edit");
              }}
              onMove={(from, to) => setSheet((cur) => ({ ...cur, diagrams: moveItem(cur.diagrams, from, to) }))}
              onDuplicate={duplicate}
              onDelete={remove}
            />
          )}

          <fieldset className="settings">
            <legend>Page</legend>
            <div className="segmented full" role="radiogroup" aria-label="Layout">
              {(
                [
                  ["grid", "6 per page"],
                  ["cards", "Flashcards"],
                ] as [Layout, string][]
              ).map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={s.layout === value}
                  className={s.layout === value ? "on" : ""}
                  onClick={() => updateSettings({ layout: value })}
                >
                  {text}
                </button>
              ))}
            </div>
            {(
              [
                ["ruledLines", "Ruled lines for notes"],
                ["coordinates", "Coordinates"],
                ["lastMove", "Highlight last move"],
                ["toMove", "Show side to move"],
                ["showMoves", "Print the moves so far"],
                ["figurines", "Figurine notation"],
              ] as [keyof SheetSettings, string][]
            ).map(([key, text]) => (
              <label key={key} className="check">
                <input type="checkbox" checked={s[key] as boolean} onChange={(e) => updateSettings({ [key]: e.target.checked })} />
                {text}
              </label>
            ))}
          </fieldset>

          <p className="ephemeral-note">
            Nothing is saved. When you close this tab the sheet is gone, so print it first.
          </p>
        </aside>

        <main className="main">
          {view === "preview" ? (
            <div className="preview">
              <PrintSheet sheet={sheet} />
            </div>
          ) : selected ? (
            <DiagramEditor key={selected.id} diagram={selected} index={selectedIndex} settings={s} onChange={updateDiagram} onBranch={branch} onAddDiagrams={addAfterSelected} />
          ) : (
            <div className="empty-main">
              <h2>Make a sheet to write on</h2>
              <p>
                Add positions from moves or a FEN, mark them up with arrows and circles, then print them with
                ruled space beside each diagram for your notes.
              </p>
              <div className="sidebar-actions">
                <button type="button" className="btn primary" onClick={() => addDiagram("position")}>
                  + Position
                </button>
                <button type="button" className="btn" onClick={() => addDiagram("blank")}>
                  + Blank board
                </button>
              </div>
            </div>
          )}
        </main>

        {importing && <ImportGameDialog onImport={addImported} onClose={() => setImporting(false)} />}

        {(undo || notice) && (
          <div className="toast" role="status">
            {undo ? (
              <>
                Diagram deleted.
                <button type="button" className="btn small" onClick={restore}>
                  Undo
                </button>
              </>
            ) : (
              notice
            )}
          </div>
        )}
      </div>
      <div className="print-only">
        <PrintSheet sheet={sheet} />
      </div>
    </>
  );
}
