import type { TFunction } from 'i18next';

import type { BarAction, RoundId } from './types';

/** One label per button, the same in the bar, the rounds and the thread. */
export const barLabel = (t: TFunction, action: BarAction) =>
  ({
    analyse: t('Analyse my text'),
    improve: t('Improve my text'),
    review: t('Do the review'),
    ask: t('Ask Nestor'),
  })[action];

export const roundLabel = (
  t: TFunction,
  language: string | undefined,
  id: RoundId,
  context: { missing: string[]; chosen: boolean },
) =>
  ({
    examples: t('See examples'),
    complete: t('Complete them'),
    'create-without': t('Write the version without it'),
    'redo-with-missing': t('Redo with {{items}}', {
      items: new Intl.ListFormat(language, { type: 'conjunction' }).format(
        context.missing,
      ),
    }),
    shorter: t('Shorter'),
    'other-version': t('Another version'),
    undo: context.chosen ? t('Cancel') : t('Back to the previous version'),
    'resume-questions': t('Resume the questions'),
    'new-request': t('Start a request'),
    lesson: t('See the lesson'),
    retry: t('Retry'),
  })[id];
