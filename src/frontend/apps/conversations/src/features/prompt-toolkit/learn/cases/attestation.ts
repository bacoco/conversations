import type { TFunction } from 'i18next';

import { badgeText, levelName } from '../../rewards/labels';
import type { Progress, UsageFacts } from '../../rewards/progress';
import { LEVELS } from '../../rewards/useRewardsStore';

export interface AttestationInput {
  t: TFunction;
  language: string;
  /** The job chosen, if any. */
  job: string | null;
  /** The highest level of the job's practical cases with a case done. */
  casesLevel: number;
  facts: UsageFacts;
  progress: Progress;
  date: Date;
}

/**
 * The certificate's text: the use recorded in this browser, as counted,
 * and the level it gives. Its last line says what it is: made from that
 * use, checked by no one else.
 */
export const attestationText = ({
  t,
  language,
  job,
  casesLevel,
  facts,
  progress,
  date,
}: AttestationInput) => {
  const badges = progress.earned.map(
    (id) => badgeText(id, t, facts.lessonsTotal).title,
  );
  const list = (items: string[]) =>
    new Intl.ListFormat(language, { type: 'conjunction' }).format(items);
  const lines = [
    ...(job ? [t('Job: {{job}}', { job })] : []),
    t(
      'Level reached: {{level}} ({{points}} points), out of three levels: {{levels}}',
      {
        level: levelName(progress.level.id, t),
        points: progress.points,
        levels: LEVELS.map((level) => levelName(level.id, t)).join(', '),
      },
    ),
    t('Practical cases done: {{count}}', { count: facts.casesDone }),
    ...(job
      ? [
          t('Level reached in the practical cases: {{level}} of 3', {
            level: casesLevel,
          }),
        ]
      : []),
    t('Lessons of the course finished: {{done}} of {{total}}', {
      done: facts.lessonsDone,
      total: facts.lessonsTotal,
    }),
    t('Lesson quizzes passed (80% or more): {{count}}', {
      count: facts.lessonQuizzesPassed,
    }),
    facts.fullQuizBest === null
      ? t('Full quiz: not taken yet')
      : t('Full quiz: best score {{score}}%', { score: facts.fullQuizBest }),
    t('Requests analysed by Nestor: {{count}}', {
      count: facts.counts.analysis ?? 0,
    }),
    t('Requests improved by Nestor: {{count}}', {
      count: facts.counts.improvement ?? 0,
    }),
    badges.length
      ? t('Badges earned: {{badges}}', { badges: list(badges) })
      : t('Badges earned: none yet'),
    t('Date: {{date}}', {
      date: new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(
        date,
      ),
    }),
  ];
  return {
    title: t('Certificate of use of Nestor — the Assistant'),
    lines,
    note: t(
      'Made from the use recorded in this browser, on this computer, for this account. It is not checked by anyone else: it describes a use, it does not certify a skill.',
    ),
  };
};

/** Anything recorded at all: before that, there is nothing to certify. */
export const hasUse = (facts: UsageFacts, progress: Progress) =>
  progress.points > 0 ||
  facts.casesDone > 0 ||
  facts.lessonsDone > 0 ||
  facts.fullQuizBest !== null;

/**
 * A printable certificate, made in the browser and printed or saved as a
 * PDF by the browser itself. Built node by node: the texts are set as
 * text, never as markup.
 */
export const printAttestation = ({
  title,
  lines,
  note,
}: ReturnType<typeof attestationText>) => {
  const page = window.open('', '_blank', 'width=800,height=900');
  if (!page) {
    return;
  }
  const { document: sheet } = page;
  sheet.title = title;
  const style = sheet.createElement('style');
  style.textContent =
    'body{font-family:Marianne,Arial,sans-serif;margin:64px;color:#1e1e2e}h1{font-size:26px;margin:0 0 32px}p{font-size:16px;line-height:1.6;margin:0 0 12px}.note{margin-top:40px;font-size:12px;color:#5f5f72}';
  sheet.head.appendChild(style);
  const heading = sheet.createElement('h1');
  heading.textContent = title;
  sheet.body.appendChild(heading);
  [...lines, note].forEach((line, index) => {
    const paragraph = sheet.createElement('p');
    paragraph.textContent = line;
    if (index === lines.length) {
      paragraph.className = 'note';
    }
    sheet.body.appendChild(paragraph);
  });
  page.focus();
  page.print();
};
