/** Turn the UI language code into a name the model understands (fr -> French). */
export const languageName = (code?: string) => {
  if (!code) {
    return 'English';
  }
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
};
