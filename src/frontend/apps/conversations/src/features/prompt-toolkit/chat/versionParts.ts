import { wordDiff } from '../coach/wordDiff';

export interface VersionPart {
  kind: 'same' | 'added';
  text: string;
}

/** Below this share of the user's own words, highlights would be noise. */
export const KEPT_MIN_SHARE = 0.4;

/**
 * The version as the user reads it: their own words plain, what Nestor
 * added in one block each. A request written again almost entirely is
 * shown plain: word-by-word colours would only be a patchwork.
 */
export const versionParts = (
  original: string,
  version: string,
): VersionPart[] => {
  const diff = wordDiff(original, version);
  if (!diff) {
    return [{ kind: 'same', text: version }];
  }
  const parts: VersionPart[] = [];
  for (const part of diff) {
    if (part.kind === 'removed') continue;
    const kind = part.kind;
    const last = parts.at(-1);
    // A space between two additions belongs to the addition.
    if (last && last.kind === kind) {
      last.text += part.text;
    } else {
      parts.push({ kind, text: part.text });
    }
  }
  // Merge "added, space, added" and keep spaces outside the green blocks'
  // start, inside their end, so each block reads as one piece.
  for (let index = 1; index < parts.length - 1; index += 1) {
    if (
      parts[index].kind === 'same' &&
      !parts[index].text.trim() &&
      parts[index - 1].kind === 'added' &&
      parts[index + 1].kind === 'added'
    ) {
      parts[index - 1].text += parts[index].text + parts[index + 1].text;
      parts.splice(index, 2);
      index -= 1;
    }
  }
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (part.kind !== 'added') continue;
    const lead = part.text.match(/^\s+/)?.[0];
    if (lead && index > 0) {
      parts[index - 1].text += lead;
      part.text = part.text.slice(lead.length);
    }
    const next = parts[index + 1];
    const trail = next?.text.match(/^\s+/)?.[0];
    if (trail && next) {
      part.text += trail;
      next.text = next.text.slice(trail.length);
    }
  }
  const kept = parts
    .filter((part) => part.kind === 'same')
    .reduce((sum, part) => sum + part.text.replace(/\s/g, '').length, 0);
  const total = version.replace(/\s/g, '').length;
  if (!total || kept / total < KEPT_MIN_SHARE) {
    return [{ kind: 'same', text: version }];
  }
  return parts.filter((part) => part.text);
};
