/**
 * Where the user works in the Ministry of the Economy and Finance, and the
 * work themes they care about. Both are optional and only tune Nestor's
 * examples and words, like the job (`jobs.ts`).
 */

export const DIRECTION_IDS = [
  'dgfip',
  'dgddi',
  'insee',
  'dgccrf',
  'tresor',
  'dge',
  'budget',
  'dae',
  'daj',
  'sg',
  'other',
] as const;
export type DirectionId = (typeof DIRECTION_IDS)[number];

export interface Direction {
  id: DirectionId;
  /** Shown to the user (a `t()` key): what it does first, its acronym after. */
  label: string;
  /** For the model, in French: its full name and its main missions. */
  about: string;
}

export const DIRECTIONS: Direction[] = [
  {
    id: 'dgfip',
    label: 'Public finances (DGFiP)',
    about:
      'Direction générale des Finances publiques (DGFiP) : impôts des particuliers et des entreprises, comptabilité publique, paiement des dépenses de l’État, cadastre et domaine de l’État',
  },
  {
    id: 'dgddi',
    label: 'Customs (DGDDI)',
    about:
      'Direction générale des douanes et droits indirects (DGDDI) : dédouanement des marchandises, contrôles aux frontières, lutte contre la fraude et les trafics, fiscalité indirecte',
  },
  {
    id: 'insee',
    label: 'Statistics and economic studies (Insee)',
    about:
      'Institut national de la statistique et des études économiques (Insee) : recensement, statistiques et études économiques et sociales',
  },
  {
    id: 'dgccrf',
    label: 'Competition, consumer affairs and fraud control (DGCCRF)',
    about:
      'Direction générale de la concurrence, de la consommation et de la répression des fraudes (DGCCRF) : protection des consommateurs, loyauté des pratiques commerciales, sécurité des produits, concurrence',
  },
  {
    id: 'tresor',
    label: 'Treasury (DG Trésor)',
    about:
      'Direction générale du Trésor : politique économique, financement de l’économie, affaires européennes et internationales',
  },
  {
    id: 'dge',
    label: 'Businesses (DGE)',
    about:
      'Direction générale des Entreprises (DGE) : industrie, commerce, artisanat, tourisme, numérique, soutien aux entreprises',
  },
  {
    id: 'budget',
    label: 'Budget (direction du Budget)',
    about:
      'Direction du Budget : préparation et suivi du budget de l’État, maîtrise des dépenses publiques',
  },
  {
    id: 'dae',
    label: 'State procurement (DAE)',
    about:
      'Direction des achats de l’État (DAE) : politique d’achat de l’État, marchés publics interministériels',
  },
  {
    id: 'daj',
    label: 'Legal affairs (DAJ)',
    about:
      'Direction des affaires juridiques (DAJ) : conseil juridique aux ministères, droit de la commande publique, contentieux',
  },
  {
    id: 'sg',
    label: 'General secretariat',
    about:
      'Secrétariat général des ministères économiques et financiers : ressources humaines, numérique, immobilier, budget et fonctions support des ministères',
  },
  {
    id: 'other',
    label: 'Another direction',
    about: '',
  },
];

export const INTEREST_IDS = [
  'hr',
  'budget',
  'legal',
  'public',
  'communication',
  'digital',
  'management',
  'procurement',
] as const;
export type InterestId = (typeof INTEREST_IDS)[number];

export interface Interest {
  id: InterestId;
  /** Shown to the user (a `t()` key). */
  label: string;
  /** For the model, in French. */
  name: string;
}

export const INTERESTS: Interest[] = [
  { id: 'hr', label: 'Human resources', name: 'ressources humaines' },
  { id: 'budget', label: 'Finance and budget', name: 'finances et budget' },
  { id: 'legal', label: 'Legal matters', name: 'juridique' },
  {
    id: 'public',
    label: 'Relations with the public',
    name: 'relations avec les usagers',
  },
  { id: 'communication', label: 'Communication', name: 'communication' },
  { id: 'digital', label: 'Digital and data', name: 'numérique et données' },
  { id: 'management', label: 'Team management', name: 'management d’équipe' },
  { id: 'procurement', label: 'Procurement', name: 'achats' },
];

export const isDirectionId = (id: unknown): id is DirectionId =>
  (DIRECTION_IDS as readonly unknown[]).includes(id);

export const isInterestId = (id: unknown): id is InterestId =>
  (INTEREST_IDS as readonly unknown[]).includes(id);

/** The direction chosen, or null for none or an unknown one. */
export const directionById = (id: unknown): Direction | null =>
  isDirectionId(id)
    ? (DIRECTIONS.find((item) => item.id === id) ?? null)
    : null;

/** The known themes, once each, in the list's order. */
export const knownInterests = (ids: unknown): InterestId[] =>
  Array.isArray(ids) ? INTEREST_IDS.filter((id) => ids.includes(id)) : [];

/**
 * What Nestor's instructions say about the user's direction and themes —
 * to pick examples and words, never a fact. Nothing for "another direction".
 */
export const directionRules = (
  direction: DirectionId | null,
  interests: InterestId[],
) => {
  const where = directionById(direction);
  const themes = INTERESTS.filter((item) => interests.includes(item.id));
  const lines = [
    where?.about
      ? `The user works at the Ministry of the Economy and Finance, in: ${where.about}.`
      : '',
    themes.length
      ? `Work themes the user cares about: ${themes.map((item) => item.name).join(', ')}.`
      : '',
  ].filter(Boolean);
  if (!lines.length) {
    return '';
  }
  return [
    ...lines,
    'Use this only to pick examples and words the user knows; never add it to a request as a fact, never assume the request is about it, and never change the user’s subject.',
  ].join('\n');
};
