/** A long text named in one line: its first line, cut with an ellipsis. */
export const shortText = (text: string, max = 80) => {
  const line = text.trim().split('\n')[0].trim();
  return line.length > max || line !== text.trim()
    ? `${line.slice(0, max).trimEnd()}…`
    : line;
};
