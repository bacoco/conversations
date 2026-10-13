import type { GridLine, GridPart } from './types';

export interface MarkedPiece {
  text: string;
  part?: GridPart;
}

/**
 * A text cut where each line of the grid is said (the first time, never
 * overlapping), so each piece can wear its line's colour.
 */
export const markParts = (text: string, parts: GridLine[]): MarkedPiece[] => {
  const found = parts
    .filter((line) => line.words)
    .map((line) => ({ ...line, at: text.indexOf(line.words) }))
    .filter((line) => line.at >= 0)
    .sort((a, b) => a.at - b.at);
  const pieces: MarkedPiece[] = [];
  let cursor = 0;
  found.forEach((line) => {
    if (line.at < cursor) return;
    if (line.at > cursor) pieces.push({ text: text.slice(cursor, line.at) });
    pieces.push({ text: line.words, part: line.part });
    cursor = line.at + line.words.length;
  });
  if (cursor < text.length) pieces.push({ text: text.slice(cursor) });
  return pieces;
};
