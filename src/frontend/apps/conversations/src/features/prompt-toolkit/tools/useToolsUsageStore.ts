import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** The last tools opened, newest first: enough to find them again. */
export const RECENT_TOOLS = 4;

interface ToolsUsageState {
  recent: string[];
  favorites: string[];
  markUsed: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
}

/** Which tools the user opens and pins, kept in this browser only. */
export const useToolsUsageStore = create<ToolsUsageState>()(
  persist(
    (set) => ({
      recent: [],
      favorites: [],
      markUsed: (toolId) =>
        set((state) => ({
          recent: [toolId, ...state.recent.filter((id) => id !== toolId)].slice(
            0,
            RECENT_TOOLS,
          ),
        })),
      toggleFavorite: (toolId) =>
        set((state) => ({
          favorites: state.favorites.includes(toolId)
            ? state.favorites.filter((id) => id !== toolId)
            : [...state.favorites, toolId],
        })),
    }),
    { name: 'nestor-tools-usage' },
  ),
);

/** Words people use for each tool, in French and English, accents aside. */
export const TOOL_KEYWORDS: Record<string, string[]> = {
  'email-reply': [
    'mail',
    'courriel',
    'email',
    'repondre',
    'reponse',
    'message',
    'reply',
    'usager',
  ],
  letter: ['courrier', 'lettre', 'note', 'officiel', 'letter', 'memo'],
  rewrite: [
    'reformuler',
    'simplifier',
    'corriger',
    'raccourcir',
    'clair',
    'rephrase',
    'simplify',
    'shorten',
    'fautes',
  ],
  translate: ['traduire', 'traduction', 'anglais', 'langue', 'translate'],
  summary: [
    'resumer',
    'resume',
    'synthese',
    'rapport',
    'document',
    'summary',
    'summarise',
    'long',
  ],
  actions: ['actions', 'taches', 'a faire', 'decisions', 'todo', 'tasks'],
  plan: ['planifier', 'projet', 'etapes', 'calendrier', 'plan', 'planning'],
  brainstorm: ['idees', 'trouver', 'ideas', 'brainstorm', 'remue'],
  minutes: [
    'reunion',
    'compte rendu',
    'enregistrer',
    'dicter',
    'transcrire',
    'oral',
    'meeting',
    'record',
    'minutes',
  ],
  library: ['modele', 'exemple', 'template', 'pret', 'bibliotheque'],
  generator: ['ecrire', 'demande', 'rediger', 'nestor', 'write'],
  improve: ['ameliorer', 'renforcer', 'mieux', 'improve'],
  'my-style': ['style', 'ton', 'facon', 'tone'],
  'follow-up': ['reponse', 'relancer', 'pas satisfait', 'decu', 'follow'],
};
