# T20-drag-pieces

Status: Done
Sprint: none

## Why

Dragging a piece already makes a move (and moves pieces in Set up), but nothing moves on
screen until the button is released: the piece stays on its square. The user wants pieces
that can be picked up and dragged.

## Scope

- In: while dragging a piece (Move mode, or Set up mode), the piece follows the pointer,
  its home square shows a faded copy, and the square under the pointer is outlined when
  the piece may land there. Release on a legal square plays the move; anywhere else, it
  goes back.
- Out: drag-to-remove in Set up (dropping off the board still does nothing), animations.

## Plan (fill in before coding)

1. Track the pointer position in board coordinates in the drag state, and "lift" the
   piece once the pointer has moved a few units: `src/components/Board.tsx`
2. Render the lifted piece last (on top of arrows), with `pointer-events: none`; fade the
   piece on its home square; outline a legal target under the pointer; `grabbing` cursor.
3. e2e test: mid-drag the floating piece is under the pointer and the home piece is
   faded; on release the move is played: `e2e/app.spec.ts`

- Data/API/migration impact: none.
- Risks: a click (no movement) must still select/click-to-move -> only lift after the
  pointer moves past a threshold. Exported/printed boards never have drag state.

## Acceptance criteria

- [x] In Move mode, dragging one of the side-to-move's pieces shows it following the
      pointer; releasing on a legal square plays the move. (ran it: new e2e test)
- [x] Releasing on an illegal square puts the piece back. (ran it: e2e). Off the board:
      same code path (no square), not separately run.
- [x] In Set up mode, dragging a piece shows it following the pointer too. (same code
      path; the existing set-up drag e2e test passes; carrying in Set up not asserted)
- [x] Click-to-move and right-drag arrows work as before. (ran it: existing e2e tests)

## Verification

- [x] `npm test`: ran it, 157 of 158; the one failure is the pre-existing engine-sign test
- [x] `npm run lint` / `npm run typecheck`: ran them, pass
- [x] `npm run test:e2e`: ran it, 12 of 12; `dragging.png` checked

## Notes

A press only becomes a carry after the pointer moves 4 board units, so clicks still
select and click-to-move. Only the side to move's pieces lift in Move mode.

Close: check the boxes, set `Status: Done`, tick it in the sprint plan, `git mv` this file
to `sprints/tickets/done/`.
