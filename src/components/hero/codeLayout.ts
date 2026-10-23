// Lays a code snippet out on a monospace character grid (pure).

import { CODE_CELLS, type Snippet, type TokenRun } from "./heroConfig";

/**
 * The snippet as side-by-side panes of code filling a cols × rows grid. Every
 * row is exactly `cols` characters, so it can be drawn cell-aligned.
 */
export function codeRows(snippet: Snippet, cols: number, rows: number): TokenRun[][] {
  const block = CODE_CELLS.columnChars + CODE_CELLS.columnGap;
  const blocks = Math.ceil(cols / block);
  // Blank lines would leave holes; the layout keeps only lines with code.
  const filled = snippet.lines.filter((line) => line.some(([text]) => text.trim().length > 0));
  const lines = filled.length ? filled : [[]];
  const out: TokenRun[][] = [];
  for (let r = 0; r < rows; r++) {
    const runs: TokenRun[] = [];
    let used = 0;
    for (let b = 0; b < blocks && used < cols; b++) {
      const line = lines[(b * rows + r) % lines.length];
      let width = 0;
      for (const [text, cls] of line) {
        const room = Math.min(block, cols - used) - width;
        if (room <= 0) break;
        const piece = text.slice(0, room);
        runs.push([piece, cls]);
        width += piece.length;
      }
      const pad = Math.min(block, cols - used) - width;
      if (pad > 0) runs.push([" ".repeat(pad), "punct"]);
      used += width + Math.max(0, pad);
    }
    out.push(runs);
  }
  return out;
}
