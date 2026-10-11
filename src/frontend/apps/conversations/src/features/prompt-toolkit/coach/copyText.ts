/**
 * Copies a text, even where the browser refuses the clipboard API (no
 * permission, an older browser): falls back on the classic copy command.
 * Returns false when nothing worked, so the caller can let the user copy.
 */
export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Falls back below.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    // Deprecated, but the only fallback where the API is refused.
    const isDone = document.execCommand('copy');
    document.body.removeChild(area);
    return isDone;
  } catch {
    return false;
  }
};

/** Selects the text of an element, for the user to copy it by hand. */
export const selectText = (element: HTMLElement | null) => {
  if (!element) {
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
};
