/** Blanks written {{name}} in a saved prompt, filled in when it is used. */
export const templateVars = (text: string): string[] => {
  const names: string[] = [];
  text
    .split('{{')
    .slice(1)
    .forEach((part) => {
      const end = part.indexOf('}}');
      const name = end > 0 ? part.slice(0, end).trim() : '';
      if (name && !names.includes(name)) {
        names.push(name);
      }
    });
  return names;
};

export const fillTemplate = (text: string, values: Record<string, string>) =>
  Object.entries(values).reduce(
    (result, [name, value]) =>
      result
        .split(`{{${name}}}`)
        .join(value)
        .split(`{{ ${name} }}`)
        .join(value),
    text,
  );

/* Sharing a prompt as a link: the prompt travels in the address itself. */

export const SHARE_PREFIX = '#nestor-prompt=';
/** Links shared before the mascot was renamed keep working. */
const LEGACY_SHARE_PREFIXES = ['#nestor-prompt='];

const toBase64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .split('+')
    .join('-')
    .split('/')
    .join('_')
    .split('=')
    .join('');
};

const fromBase64Url = (text: string) => {
  const base64 = text.split('-').join('+').split('_').join('/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  );
};

export const shareLink = (title: string, prompt: string) =>
  `${window.location.origin}/${SHARE_PREFIX}${toBase64Url(
    JSON.stringify({ title, prompt }),
  )}`;

/** The prompt shared in an address, or null. */
export const readSharedPrompt = (
  hash: string,
): { title: string; prompt: string } | null => {
  const prefix = [SHARE_PREFIX, ...LEGACY_SHARE_PREFIXES].find((candidate) =>
    hash.startsWith(candidate),
  );
  if (!prefix) {
    return null;
  }
  try {
    const data = JSON.parse(fromBase64Url(hash.slice(prefix.length))) as {
      title?: unknown;
      prompt?: unknown;
    };
    return typeof data.prompt === 'string' && data.prompt.trim()
      ? {
          title: typeof data.title === 'string' ? data.title : '',
          prompt: data.prompt,
        }
      : null;
  } catch {
    return null;
  }
};
