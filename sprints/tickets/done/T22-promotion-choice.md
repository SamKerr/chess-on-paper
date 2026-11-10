# T22-promotion-choice

Status: Done
Sprint: none

## Why

Moves played on the board always promoted to a queen; under-promotion needed typing
(`e8=N`). The user asked for pawn promotions to be implemented on the board.

## Scope

- In: when a board move (drag or click) is a promotion, ask which piece: queen, rook,
  bishop or knight, in the mover's colour, with a way to cancel.
- Out: typed notation (already handles `e8=N` and `e8=n`), set-up mode (pieces are placed
  freely there).

## Plan (fill in before coding)

1. `playMove` holds a promotion as pending instead of queening; a "Promote to" row under
   the board plays it with the chosen piece: `src/components/DiagramEditor.tsx`
2. Export `PieceIcon` for the row's buttons: `src/components/SetupPanel.tsx`
3. Style the row: `src/styles.css`
4. Browser test for dragging a pawn to the last rank and choosing: `e2e/app.spec.ts`
5. Docs: `README.md`, remove the gap from `BLOCKERS.md`.

- Data/API/migration impact: none.
- Risks: a stale chooser after the position changes -> the pending move remembers its FEN
  and shows only while that position is on the board.

## Acceptance criteria

- [x] Moving a pawn to the last rank on the board shows "Promote to" with four pieces in
      the mover's colour; nothing is written to the notation yet.
- [x] Choosing a piece writes the move (`e8=N`, `e8=Q+` and so on); Cancel writes nothing.
- [x] Ordinary moves are unaffected.

## Verification

Say how each criterion was checked: *ran it*, *fakes/mocks*, *docs*, *not verified*.

- [x] `npm test`: ran it, 145 of 145 pass (no new unit test; the board needs real pointer
      events, so the behaviour is covered in the browser test)
- [x] `npm run lint` / `npm run typecheck`: ran them, pass
- [x] `npm run test:e2e`: ran it, 12 of 12 pass. The new test drags a white pawn to e8
      (chooser appears, notation unchanged), cancels, promotes to a knight, promotes a
      black pawn to a queen by clicking, then plays an ordinary king move. Looked at
      `promotion.png`.

## Notes

- The chooser sits under the board rather than over the promotion square, so the board
  component stays a plain renderer. The queen button takes focus, so Enter queens.
- Touch devices: not verified.

Close: check the boxes, set `Status: Done`, tick it in the sprint plan, `git mv` this file
to `sprints/tickets/done/`.
