import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import type {
  Competency,
  PromptAnalysis,
  RequestKind,
} from '../coach/coachApi';
import {
  HABIT_GRADE,
  comebackSkill,
  weekRecap,
  weeklyFocus,
} from '../coach/coachInsights';
import {
  NestorBubble,
  SuggestionPills,
  UserBubble,
} from '../fill/GuidedThread';
import { useSkillLabels } from '../learn/CourseParts';
import { LESSON_FOR_COMPETENCY } from '../learn/lessonForCompetency';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import {
  CoachLength,
  CoachTone,
  FELT_ASK_EVERY_MS,
  USUAL_AUDIENCES,
  UsualAudience,
  useCoachPrefsStore,
} from '../stores/useCoachPrefsStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { Disclosure } from './CoachParts';
import { PracticeCheck } from './PracticeCheck';

const boxCss = (tone: 'brand' | 'success' | 'info') => css`
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--c--contextuals--background--semantic--${tone}--tertiary);
`;

const linkCss = css`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--c--contextuals--content--semantic--brand--primary);
  text-decoration: underline;
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** Why each habit matters, in one sentence: fixed, no call to the model. */
export const useWhyTexts = (): Partial<Record<Competency, string>> => {
  const { t } = useTranslation();
  return {
    task: t(
      'The AI does exactly what you write: without a precise action, it picks what to do itself.',
    ),
    context: t(
      'Without the situation and the purpose, the AI answers for an average case, not yours.',
    ),
    audience: t(
      'The same content is not written the same way for the public and for a director: without a reader, the AI takes an average tone.',
    ),
    format: t(
      'Without a form asked for, the AI picks the length and the layout: often too long or badly organised.',
    ),
    sources: t(
      'Without a reference text, the AI answers from memory and may make things up, especially rules and figures.',
    ),
    constraints: t(
      'Limits (length, tone, things to avoid) keep the answer on topic and free of made-up facts.',
    ),
  };
};

/**
 * The coach's advice for a habit, fitted to the kind of request when it
 * changes something (an email, a summary, a reply to the public).
 */
export const useKindTips = () => {
  const { t } = useTranslation();
  const general: Partial<Record<Competency, string>> = {
    task: t('Say exactly what you expect: write, summarise, list…'),
    context: t(
      'Give the situation and the purpose: the Assistant cannot guess them.',
    ),
    audience: t('Say who it is for: the tone and the level change with it.'),
    format: t('Say the expected form: length, list, table, tone.'),
    sources: t('Give the text or document to rely on.'),
    constraints: t('Say what to avoid, and what must not be made up.'),
  };
  const byKind: Partial<
    Record<RequestKind, Partial<Record<Competency, string>>>
  > = {
    mail: {
      audience: t(
        'For an email, say who it is for and the tone: cordial, formal…',
      ),
      format: t(
        'For an email, say the length and whether a subject line is needed.',
      ),
    },
    summary: {
      audience: t(
        'For a summary, say who will read it: they will not keep the same things.',
      ),
      format: t('For a summary, say the length and the points to keep.'),
    },
    public: {
      audience: t(
        'For a member of the public, ask for simple words and a kind tone.',
      ),
      sources: t(
        'To answer a member of the public, give the text of the rule: the AI will not make it up.',
      ),
    },
    procurement: {
      sources: t(
        'For a legal text, give the reference text and ask to quote it.',
      ),
    },
  };
  return (skill: Competency, kind?: RequestKind) =>
    (kind && byKind[kind]?.[skill]) ?? general[skill] ?? '';
};

/** "This week, one thing": the habit least present in the last requests. */
export const WeeklyFocusBox = () => {
  const { t } = useTranslation();
  const entries = useCoachHistoryStore((state) => state.entries);
  const openLesson = usePromptToolkitStore((state) => state.openLesson);
  const skillLabels = useSkillLabels();
  const why = useWhyTexts();
  const [showWhy, setShowWhy] = useState(false);
  const focus = useMemo(() => weeklyFocus(entries), [entries]);
  if (!focus) {
    return null;
  }
  const lesson = LESSON_FOR_COMPETENCY[focus];
  return (
    <Box $gap="4px" $css={boxCss('brand')}>
      <Text $size="xs" $weight="700" $theme="brand">
        {t('This week, one thing to work on')}
      </Text>
      <Text $weight="700">{skillLabels[focus]}</Text>
      {showWhy && why[focus] && (
        <Text $size="sm" $variation="secondary">
          {why[focus]}
        </Text>
      )}
      <Box $direction="row" $gap="14px" $css="flex-wrap: wrap;">
        <Box
          as="button"
          type="button"
          aria-expanded={showWhy}
          onClick={() => setShowWhy((value) => !value)}
          $css={linkCss}
        >
          {t('Why?')}
        </Box>
        <Box
          as="button"
          type="button"
          onClick={() => openLesson(lesson.lessonId, lesson.slide)}
          $css={linkCss}
        >
          {t('See the lesson · 1 min')}
        </Box>
      </Box>
    </Box>
  );
};

/** The text a trainer would want: the week, in plain words. */
const trainerText = (lines: string[], title: string) =>
  [title, '', ...lines.map((line) => `- ${line}`)].join('\n');

/**
 * "My week": requests read, the clearest one, the habit that grew, the
 * round trips, and the one to work on. Folded; shown from a few requests.
 */
export const WeekRecapView = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const entries = useCoachHistoryStore((state) => state.entries);
  const skillLabels = useSkillLabels();
  const recap = useMemo(() => weekRecap(entries), [entries]);
  const focus = useMemo(() => weeklyFocus(entries), [entries]);
  if (recap.count < 3) {
    return null;
  }
  const lines = [
    t('{{count}} requests read by the coach', { count: recap.count }),
    recap.best
      ? recap.allBricks
        ? t('Your clearest request, with every brick: “{{excerpt}}”', {
            excerpt: recap.best.excerpt,
          })
        : t('Your clearest request: “{{excerpt}}”', {
            excerpt: recap.best.excerpt,
          })
      : '',
    recap.growing
      ? t('Growing: {{skill}}', {
          skill: skillLabels[recap.growing].toLocaleLowerCase(),
        })
      : '',
    recap.perConversation !== null
      ? recap.perConversationBefore !== null
        ? t(
            '{{count}} requests per conversation to get the result, against {{before}} the week before',
            {
              count: recap.perConversation,
              before: recap.perConversationBefore,
            },
          )
        : t('{{count}} requests per conversation to get the result', {
            count: recap.perConversation,
          })
      : '',
    focus
      ? t('To work on: {{skill}}', {
          skill: skillLabels[focus].toLocaleLowerCase(),
        })
      : '',
  ].filter(Boolean);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(
        trainerText(lines, t('My week with the coach')),
      );
      showToast('success', t('Copied: paste it in a message to your trainer.'));
    } catch {
      showToast('error', t('Copy failed. Please retry.'));
    }
  };

  return (
    <Disclosure label={t('My week')} icon="calendar_month">
      <Box as="ul" $gap="6px" $css="margin: 0; padding-left: 18px;">
        {lines.map((line) => (
          <Text as="li" key={line} $size="sm" $css="display: list-item;">
            {line}
          </Text>
        ))}
      </Box>
      <Box $direction="row">
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => void share()}
          icon={<Icon iconName="content_copy" $size="16px" />}
        >
          {t('Prepare a talk with my trainer')}
        </Button>
      </Box>
    </Disclosure>
  );
};

/**
 * One line after a reading, at most: the step being tried, else the habit
 * of the week now there, else a habit back since last time.
 */
export const ProgressNote = ({ result }: { result: PromptAnalysis }) => {
  const { t } = useTranslation();
  const skillLabels = useSkillLabels();
  const pending = useLearnProgressStore((state) => state.pendingPractice);
  // Read once per reading: the request itself is not in the history yet.
  const [note] = useState(() => {
    const entries = useCoachHistoryStore.getState().entries;
    const focus = weeklyFocus(entries);
    if (focus && (result.competencies[focus] ?? 0) >= HABIT_GRADE) {
      return { kind: 'focus' as const, skill: focus };
    }
    const back = comebackSkill(entries[0], result);
    return back ? { kind: 'back' as const, skill: back } : null;
  });

  if (pending) {
    return <PracticeCheck result={result} />;
  }
  if (!note) {
    return null;
  }
  return (
    <Box role="status" $direction="row" $gap="10px" $css={boxCss('success')}>
      <Icon iconName="trending_up" $size="20px" $theme="success" />
      <Text $size="sm">
        {note.kind === 'focus'
          ? t('Your point of the week is there: {{skill}}. Well done!', {
              skill: skillLabels[note.skill].toLocaleLowerCase(),
            })
          : t('This time, you did it: {{skill}}. It makes a difference.', {
              skill: skillLabels[note.skill].toLocaleLowerCase(),
            })}
      </Text>
    </Box>
  );
};

/** "Was this help useful, too simple, too complicated?" — once a day. */
export const FeltCheck = () => {
  const { t } = useTranslation();
  const feltAskedAt = useCoachPrefsStore((state) => state.feltAskedAt);
  const markFeltAsked = useCoachPrefsStore((state) => state.markFeltAsked);
  const setLength = useCoachPrefsStore((state) => state.setLength);
  const setBeginner = useProfileStore((state) => state.setBeginner);
  const [isDue] = useState(() => Date.now() - feltAskedAt > FELT_ASK_EVERY_MS);
  const [answer, setAnswer] = useState<string | null>(null);
  if (!isDue) {
    return null;
  }
  const options = [
    { label: t('Useful'), reply: t('Thank you! I carry on like this.') },
    {
      label: t('Too simple'),
      reply: t('Understood: I will give you more details.'),
      apply: () => {
        setBeginner(false);
        setLength('detailed');
      },
    },
    {
      label: t('Too complicated'),
      reply: t('Understood: I will keep it shorter and simpler.'),
      apply: () => {
        setBeginner(true);
        setLength('short');
      },
    },
  ];
  const picked = options.find((option) => option.label === answer);
  return (
    <Box $gap="8px">
      <Text $size="xs" $variation="secondary">
        {t('This help was…')}
      </Text>
      {picked ? (
        <>
          <UserBubble>{picked.label}</UserBubble>
          <NestorBubble>{picked.reply}</NestorBubble>
        </>
      ) : (
        <SuggestionPills
          suggestions={options.map((option) => option.label)}
          onPick={(label) => {
            setAnswer(label);
            markFeltAsked();
            options.find((option) => option.label === label)?.apply?.();
          }}
        />
      )}
    </Box>
  );
};

/** "What would you add?" before the coach's opinion, for those who want it. */
export const AskFirst = ({
  result,
  onDone,
}: {
  result: PromptAnalysis;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const skillLabels = useSkillLabels();
  const options: { label: string; skill: Competency | null }[] = [
    { label: t('The purpose'), skill: 'context' },
    { label: t('Who it is for'), skill: 'audience' },
    { label: t('The expected form'), skill: 'format' },
    { label: t('The reference text'), skill: 'sources' },
    { label: t('Nothing, it is complete'), skill: null },
  ];
  const [picked, setPicked] = useState<(typeof options)[number] | null>(null);
  const missing = (['context', 'audience', 'format', 'sources'] as Competency[])
    .filter((skill) => (result.competencies[skill] ?? 0) < HABIT_GRADE)
    .sort(
      (a, b) => (result.competencies[a] ?? 0) - (result.competencies[b] ?? 0),
    );
  const isRight = picked
    ? picked.skill === null
      ? missing.length === 0
      : missing.includes(picked.skill)
    : false;
  return (
    <Box $gap="10px">
      <NestorBubble>
        {t('Before I say what I think: what would you add to this request?')}
      </NestorBubble>
      {picked ? (
        <>
          <UserBubble>{picked.label}</UserBubble>
          <NestorBubble>
            {isRight
              ? t('Well seen, I think so too.')
              : missing.length > 0
                ? t('Good idea. I would first add: {{skill}}.', {
                    skill: skillLabels[missing[0]].toLocaleLowerCase(),
                  })
                : t('It is already complete for me.')}
          </NestorBubble>
          <Box $direction="row" $css="padding-left: 36px;">
            <Button size="small" onClick={onDone}>
              {t('See my reading')}
            </Button>
          </Box>
        </>
      ) : (
        <SuggestionPills
          suggestions={options.map((option) => option.label)}
          onPick={(label) =>
            setPicked(options.find((option) => option.label === label) ?? null)
          }
        />
      )}
    </Box>
  );
};

/** Three boxes to tick before sending, like a routine before a shot. */
export const SendChecklist = () => {
  const { t } = useTranslation();
  const items = [
    t('I say who it is for'),
    t('I say the expected form'),
    t('I give the reference text, if there is one'),
  ];
  const [ticked, setTicked] = useState<number[]>([]);
  return (
    <Box
      as="fieldset"
      $gap="6px"
      $css={css`
        align-self: stretch;
        margin: 0;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--c--contextuals--border--surface--primary);
      `}
    >
      <Text as="legend" $size="xs" $weight="700" $css="padding: 0 4px;">
        {t('Before sending')}
      </Text>
      {items.map((item, index) => (
        <label
          key={item}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <input
            type="checkbox"
            checked={ticked.includes(index)}
            onChange={() =>
              setTicked((list) =>
                list.includes(index)
                  ? list.filter((value) => value !== index)
                  : [...list, index],
              )
            }
          />
          <Text $size="sm">{item}</Text>
        </label>
      ))}
    </Box>
  );
};

const selectCss = css`
  padding: 6px 8px;
  border-radius: 6px;
  font: inherit;
  font-size: 0.875rem;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  color: inherit;
`;

/** "My coach": how it speaks, what it asks, who the user writes to. */
export const CoachSettings = () => {
  const { t } = useTranslation();
  const prefs = useCoachPrefsStore();
  const audiences: Record<UsualAudience, string> = {
    public: t('Members of the public'),
    colleagues: t('Colleagues'),
    management: t('My management'),
    partners: t('Outside partners'),
  };
  return (
    <Disclosure label={t('My coach')} icon="tune">
      <Box $gap="12px">
        <Box $gap="4px">
          <label htmlFor="coach-tone">
            <Text $size="sm" $weight="600">
              {t('How the coach speaks')}
            </Text>
          </label>
          <Box
            as="select"
            id="coach-tone"
            value={prefs.tone}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              prefs.setTone(event.target.value as CoachTone)
            }
            $css={selectCss}
          >
            <option value="encouraging">{t('Encouraging')}</option>
            <option value="direct">{t('Direct')}</option>
          </Box>
        </Box>
        <Box $gap="4px">
          <label htmlFor="coach-length">
            <Text $size="sm" $weight="600">
              {t('Its explanations')}
            </Text>
          </label>
          <Box
            as="select"
            id="coach-length"
            value={prefs.length}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              prefs.setLength(event.target.value as CoachLength)
            }
            $css={selectCss}
          >
            <option value="short">{t('Short')}</option>
            <option value="detailed">{t('Detailed')}</option>
          </Box>
        </Box>
        <Box $gap="4px">
          <label htmlFor="coach-audience">
            <Text $size="sm" $weight="600">
              {t('I mostly write to')}
            </Text>
          </label>
          <Box
            as="select"
            id="coach-audience"
            value={prefs.usualAudience ?? ''}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              prefs.setUsualAudience(
                (event.target.value || null) as UsualAudience | null,
              )
            }
            $css={selectCss}
          >
            <option value="">{t('It varies')}</option>
            {USUAL_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {audiences[audience]}
              </option>
            ))}
          </Box>
        </Box>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={prefs.askFirst}
            onChange={(event) => prefs.setAskFirst(event.target.checked)}
          />
          <Text $size="sm">{t('Ask my opinion before giving yours')}</Text>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={prefs.checklist}
            onChange={(event) => prefs.setChecklist(event.target.checked)}
          />
          <Text $size="sm">{t('A checklist before sending')}</Text>
        </label>
      </Box>
    </Disclosure>
  );
};
