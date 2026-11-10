# Stockfish (vendored)

`stockfish-19-lite-single.js` and `.wasm` are Stockfish 19 compiled to WebAssembly by
Nathan Rugg's stockfish.js (npm `stockfish@19.0.1`), the "lite, single-threaded" build:
about 1.9 MB, and it runs in a Web Worker without cross-origin isolation headers.

Stockfish is free software under the GNU GPL v3; see `COPYING.txt`. Source:
https://github.com/official-stockfish/Stockfish and https://github.com/nmrugg/stockfish.js

To update: `npm pack stockfish@<version>`, copy the two `*-lite-single.*` files from `bin/`
and `Copying.txt`, then update `ENGINE_URL` in `src/lib/engine.ts`.
