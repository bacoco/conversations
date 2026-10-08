import type { PromptLibrary } from '../types';

import { LIBRARY_EN } from './en';
import { LIBRARY_FR } from './fr';

/** The library is written in French; other languages get the English version. */
export const getPromptLibrary = (language?: string): PromptLibrary =>
  (language ?? '').toLowerCase().startsWith('fr') ? LIBRARY_FR : LIBRARY_EN;
