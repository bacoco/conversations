import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import { exampleForJob } from '../coach/coachApi';
import { languageName } from '../coach/language';
import { NESTOR_AVATAR_URL } from '../components/PanelHome';
import { useProfileStore } from '../stores/useProfileStore';

import { RichText } from './RichText';
import type { PromptPart, Slide, SlideExample } from './types';
import { useLearnProgressStore } from './useLearnProgressStore';

const exampleCss = (tone: 'error' | 'success') => css`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--c--contextuals--border--semantic--${tone}--secondary);
  background: var(--c--contextuals--background--semantic--${tone}--tertiary);
`;

/** One colour per brick, the same on every screen. */
const BRICK_TONES: { words: string[]; background: string; color: string }[] = [
  { words: ['tâche', 'task'], background: '#e6e6fb', color: '#3e3b98' },
  { words: ['contexte', 'context'], background: '#e3eefb', color: '#1d4e89' },
  { words: ['format'], background: '#e3f2e6', color: '#005317' },
  {
    words: ['public', 'audience', 'destinataire', 'reader'],
    background: '#fbeedd',
    color: '#7a4a12',
  },
  {
    words: ['contraintes', 'contrainte', 'constraints', 'constraint', 'limite'],
    background: '#f9e4ea',
    color: '#8a1c3c',
  },
  {
    words: ['document', 'source', 'sources', 'texte'],
    background: '#e2f2f2',
    color: '#0d5c63',
  },
  {
    words: ['exemple', 'example', 'vérification', 'verification', 'rôle'],
    background: '#efe7f8',
    color: '#5a2d82',
  },
];

export const brickTone = (label?: string) => {
  const key = (label ?? '').toLocaleLowerCase();
  return (
    BRICK_TONES.find((tone) =>
      tone.words.some((word) => key.startsWith(word)),
    ) ?? {
      background: 'var(--c--contextuals--background--surface--secondary)',
      color: 'var(--c--contextuals--content--semantic--neutral--primary)',
    }
  );
};

const FoxSays = ({ children }: { children: React.ReactNode }) => (
  <Box $direction="row" $align="flex-end" $gap="8px">
    <img
      src={NESTOR_AVATAR_URL}
      alt=""
      width={28}
      height={28}
      style={{ flex: 'none', borderRadius: '50%' }}
    />
    <Box
      $css={css`
        padding: 10px 12px;
        border-radius: 12px 12px 12px 4px;
        font-size: 0.875rem;
        line-height: 1.5;
        background: var(--c--contextuals--background--surface--tertiary);
      `}
    >
      {children}
    </Box>
  </Box>
);

const Takeaway = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  return (
    <Box
      $direction="row"
      $gap="10px"
      $css={css`
        padding: 12px 14px;
        border-radius: 10px;
        background: var(
          --c--contextuals--background--semantic--brand--tertiary
        );
      `}
    >
      <Icon iconName="lightbulb" $size="20px" $theme="brand" />
      <Box $gap="2px">
        <Text $size="xs" $weight="700" $theme="brand">
          {t('Key takeaway')}
        </Text>
        <Text $size="sm" $weight="600">
          {text}
        </Text>
      </Box>
    </Box>
  );
};

/** A worse and a better request, side by side. */
const Example = ({ example }: { example: SlideExample }) => {
  const { t } = useTranslation();
  return (
    <Box $gap="8px">
      {example.bad && (
        <Box $gap="6px" $css={exampleCss('error')}>
          <Box $direction="row" $align="center" $gap="6px">
            <Icon iconName="close" $size="16px" $theme="error" />
            <Text $size="xs" $weight="700" $theme="error">
              {t('To avoid')}
            </Text>
          </Box>
          <Text $size="sm" $css="font-style: italic; white-space: pre-wrap;">
            « {example.bad} »
          </Text>
        </Box>
      )}
      {example.good && (
        <Box $gap="6px" $css={exampleCss('success')}>
          <Box $direction="row" $align="center" $gap="6px">
            <Icon iconName="check" $size="16px" $theme="success" />
            <Text $size="xs" $weight="700" $theme="success">
              {t('Better')}
            </Text>
          </Box>
          <Text $size="sm" $css="font-style: italic; white-space: pre-wrap;">
            « {example.good} »
          </Text>
        </Box>
      )}
      {example.note && (
        <Text $size="xs" $variation="secondary">
          {example.note}
        </Text>
      )}
    </Box>
  );
};

/** The same example, for the learner's own field of work. */
const JobExample = ({ example }: { example: SlideExample }) => {
  const { t, i18n } = useTranslation();
  const job = useProfileStore((state) => state.job);
  const isAiAvailable = useAiAvailable();
  const [state, setState] = useState<
    | { status: 'idle' | 'loading' | 'error' }
    | { status: 'done'; example: SlideExample }
  >({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  if (!job || !isAiAvailable || !example.good) {
    return null;
  }
  const run = async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'loading' });
    try {
      const adapted = await exampleForJob(
        { bad: example.bad, good: example.good ?? '' },
        job.label,
        languageName(i18n.language),
        controller.signal,
      );
      setState({ status: 'done', example: adapted });
    } catch {
      if (!controller.signal.aborted) {
        setState({ status: 'error' });
      }
    }
  };
  if (state.status === 'done') {
    return (
      <Box $gap="6px">
        <Text $size="xs" $weight="700" $theme="brand">
          {t('In your field: {{job}}', { job: job.label })}
        </Text>
        <Example example={state.example} />
      </Box>
    );
  }
  return (
    <Box $align="flex-start" $gap="4px">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        disabled={state.status === 'loading'}
        onClick={() => void run()}
        icon={
          state.status === 'loading' ? (
            <Loader size="small" />
          ) : (
            <Icon iconName="work" $size="16px" />
          )
        }
      >
        {t('An example in my field')}
      </Button>
      {state.status === 'error' && (
        <Text $size="xs" role="alert">
          {t('Nestor could not adapt the example. Please retry.')}
        </Text>
      )}
    </Box>
  );
};

/** A request cut into its bricks, each one named and coloured. */
export const AnnotatedRequest = ({
  parts,
  hidden,
  filled,
}: {
  parts: PromptPart[];
  /** A part shown as a gap to complete. */
  hidden?: number;
  /** What the learner put in the gap. */
  filled?: string;
}) => {
  const { t } = useTranslation();
  return (
    <Box
      $css={css`
        padding: 12px;
        border-radius: 10px;
        line-height: 2;
        border: 1px solid var(--c--contextuals--border--surface--primary);
      `}
    >
      <p style={{ margin: 0 }}>
        {parts.map((part, index) => {
          if (!part.label) {
            return <span key={index}>{part.text}</span>;
          }
          const tone = brickTone(part.label);
          const isHidden = index === hidden;
          return (
            <Box
              as="span"
              key={index}
              $css={css`
                display: inline;
                padding: 2px 4px;
                border-radius: 4px;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
                color: ${tone.color};
                background: ${tone.background};
                ${isHidden && !filled ? 'border-bottom: 2px dashed currentColor;' : ''}
              `}
            >
              {isHidden ? (filled ?? `[${t('to complete')}]`) : part.text}
              <Box
                as="span"
                $css={css`
                  display: inline-block;
                  margin-left: 4px;
                  padding: 0 4px;
                  border-radius: 3px;
                  font-size: 0.6875rem;
                  font-weight: 700;
                  line-height: 1.5;
                  vertical-align: middle;
                  color: #ffffff;
                  background: ${tone.color};
                `}
              >
                {part.label}
              </Box>
            </Box>
          );
        })}
      </p>
    </Box>
  );
};

const chipCss = (state: 'idle' | 'on' | 'right' | 'wrong') => css`
  padding: 6px 12px;
  border-radius: 999px;
  cursor: ${state === 'idle' || state === 'on' ? 'pointer' : 'default'};
  font: inherit;
  font-size: 0.875rem;
  text-align: left;
  color: ${
    state === 'right'
      ? 'var(--c--contextuals--content--semantic--success--primary)'
      : state === 'wrong'
        ? 'var(--c--contextuals--content--semantic--error--primary)'
        : 'var(--c--contextuals--content--semantic--brand--primary)'
  };
  border: 1px solid
    ${
      state === 'right'
        ? 'var(--c--contextuals--border--semantic--success--primary)'
        : state === 'wrong'
          ? 'var(--c--contextuals--border--semantic--error--primary)'
          : state === 'on'
            ? 'var(--c--contextuals--border--semantic--brand--primary)'
            : 'var(--c--contextuals--border--semantic--brand--secondary)'
    };
  background: ${
    state === 'right'
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : state === 'wrong'
        ? 'var(--c--contextuals--background--semantic--error--tertiary)'
        : state === 'on'
          ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
          : 'var(--c--contextuals--background--surface--primary)'
  };
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const cardCss = (state: 'idle' | 'better' | 'worse' | 'picked') => css`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: ${state === 'idle' ? 'pointer' : 'default'};
  font: inherit;
  text-align: left;
  color: inherit;
  border: ${state === 'idle' ? 1 : 2}px solid
    ${
      state === 'better'
        ? 'var(--c--contextuals--border--semantic--success--primary)'
        : state === 'worse'
          ? 'var(--c--contextuals--border--surface--primary)'
          : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    state === 'better'
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
  &:hover {
    border-color: ${
      state === 'idle'
        ? 'var(--c--contextuals--border--semantic--brand--primary)'
        : ''
    };
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/**
 * A problem first: which of two requests gets the better answer? Then the
 * two answers, and "what makes it better?", answered with chips.
 */
const ChooseSlide = ({ slide }: { slide: Slide }) => {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number | null>(null);
  const [reasons, setReasons] = useState<number[]>([]);
  const [reasonsChecked, setReasonsChecked] = useState(false);
  const choices = slide.choices ?? [];
  const better = slide.better ?? 0;

  return (
    <Box $gap="12px">
      <RichText text={slide.content} />
      <Box as="ul" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
        {choices.map((choice, index) => {
          const state =
            picked === null ? 'idle' : index === better ? 'better' : 'worse';
          return (
            <li key={choice.prompt}>
              <Box
                as="button"
                type="button"
                aria-pressed={picked === index}
                aria-disabled={picked !== null}
                onClick={() => picked === null && setPicked(index)}
                $gap="6px"
                $css={cardCss(state)}
              >
                <Box $direction="row" $align="center" $gap="6px">
                  <Text $size="xs" $weight="700" $variation="secondary">
                    {t('Request {{letter}}', { letter: 'AB'[index] })}
                  </Text>
                  {picked === index && (
                    <Text $size="xs" $weight="700" $theme="brand">
                      · {t('your choice')}
                    </Text>
                  )}
                  {picked !== null && index === better && (
                    <Text $size="xs" $weight="700" $theme="success">
                      · {t('the better one')}
                    </Text>
                  )}
                </Box>
                <Text $size="sm" $css="white-space: pre-wrap;">
                  « {choice.prompt} »
                </Text>
                {picked !== null && (
                  <Box
                    $gap="2px"
                    $css={css`
                      margin-top: 4px;
                      padding: 8px 10px;
                      border-radius: 8px;
                      background: var(
                        --c--contextuals--background--surface--secondary
                      );
                    `}
                  >
                    <Text $size="xs" $weight="700" $variation="secondary">
                      {t('What the AI answers')}
                    </Text>
                    <Text $size="sm" $css="white-space: pre-wrap;">
                      {choice.answer}
                    </Text>
                  </Box>
                )}
              </Box>
            </li>
          );
        })}
      </Box>
      {picked === null ? (
        <Text $size="xs" $variation="secondary">
          {t('Choose one: there is no wrong answer at this point.')}
        </Text>
      ) : (
        <FoxSays>
          {picked === better
            ? t('Well spotted! Look at the two answers: that is the gap.')
            : t('The other one does better: compare the two answers.')}
        </FoxSays>
      )}
      {picked !== null && slide.reasons && slide.reasons.length > 0 && (
        <Box $gap="8px">
          <Text $size="sm" $weight="700">
            {t('What makes it better? Several possible.')}
          </Text>
          <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
            {slide.reasons.map((reason, index) => {
              const isOn = reasons.includes(index);
              const state = !reasonsChecked
                ? isOn
                  ? 'on'
                  : 'idle'
                : reason.isRight
                  ? 'right'
                  : isOn
                    ? 'wrong'
                    : 'idle';
              return (
                <Box
                  key={reason.label}
                  as="button"
                  type="button"
                  aria-pressed={isOn}
                  disabled={reasonsChecked}
                  onClick={() =>
                    setReasons((list) =>
                      isOn
                        ? list.filter((item) => item !== index)
                        : [...list, index],
                    )
                  }
                  $css={chipCss(state)}
                >
                  {reason.label}
                </Box>
              );
            })}
          </Box>
          {!reasonsChecked ? (
            <Box $direction="row">
              <Button
                size="small"
                color="neutral"
                variant="secondary"
                disabled={reasons.length === 0}
                onClick={() => setReasonsChecked(true)}
              >
                {t('Check my answer')}
              </Button>
            </Box>
          ) : (
            <Text $size="xs" $variation="secondary">
              {t('In green, what makes the difference.')}
            </Text>
          )}
        </Box>
      )}
      {picked !== null && slide.keyTakeaway && (
        <Takeaway text={slide.keyTakeaway} />
      )}
    </Box>
  );
};

/** A worked example with one brick hidden: which piece goes there? */
const FillSlide = ({ slide }: { slide: Slide }) => {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number | null>(null);
  const parts = slide.parts ?? [];
  const hidden = slide.blank ?? -1;
  const options = slide.options ?? [];
  const right = options.indexOf(parts[hidden]?.text ?? '');
  return (
    <Box $gap="12px">
      <RichText text={slide.content} />
      <AnnotatedRequest
        parts={parts}
        hidden={hidden}
        filled={picked !== null ? options[picked] : undefined}
      />
      <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
        {options.map((option, index) => (
          <Box
            key={option}
            as="button"
            type="button"
            aria-pressed={picked === index}
            disabled={picked !== null}
            onClick={() => setPicked(index)}
            $css={chipCss(
              picked === null
                ? 'idle'
                : index === right
                  ? 'right'
                  : index === picked
                    ? 'wrong'
                    : 'idle',
            )}
          >
            {option}
          </Box>
        ))}
      </Box>
      {picked !== null && (
        <FoxSays>
          {picked === right
            ? t('Exactly: the request is complete.')
            : t('Not this one: the right piece is in green.')}
        </FoxSays>
      )}
      {picked !== null && slide.keyTakeaway && (
        <Takeaway text={slide.keyTakeaway} />
      )}
    </Box>
  );
};

/** The bricks of a request, as a picture. */
const BricksSlide = ({ slide }: { slide: Slide }) => (
  <Box $gap="12px">
    <RichText text={slide.content} />
    <Box as="ul" $gap="6px" $css="margin: 0; padding: 0; list-style: none;">
      {(slide.parts ?? []).map((part) => {
        const tone = brickTone(part.label);
        return (
          <Box
            as="li"
            key={part.label}
            $direction="row"
            $align="center"
            $gap="10px"
            $css={css`
              padding: 10px 12px;
              border-radius: 10px;
              color: ${tone.color};
              background: ${tone.background};
            `}
          >
            <Text $weight="800" $css={`color: ${tone.color}; min-width: 96px;`}>
              {part.label}
            </Text>
            <Text $size="sm" $css={`color: ${tone.color};`}>
              {part.text}
            </Text>
          </Box>
        );
      })}
    </Box>
    {slide.keyTakeaway && <Takeaway text={slide.keyTakeaway} />}
  </Box>
);

/** One screen of a lesson, as fits its kind, with "keep in my memo". */
export const SlideView = ({
  slide,
  lessonId,
  index,
}: {
  slide: Slide;
  lessonId: string;
  index: number;
}) => {
  const { t } = useTranslation();
  const isSaved = useLearnProgressStore((state) =>
    state.savedScreens.includes(`${lessonId}:${index}`),
  );
  const toggleSaved = useLearnProgressStore((state) => state.toggleSavedScreen);
  const kind = slide.kind ?? 'text';

  return (
    <Box $gap="14px">
      <Box $direction="row" $align="center" $gap="12px">
        <Box
          aria-hidden="true"
          $align="center"
          $justify="center"
          $css={css`
            flex: none;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            font-size: 1.5rem;
            background: var(
              --c--contextuals--background--semantic--brand--tertiary
            );
          `}
        >
          {slide.icon}
        </Box>
        <Text as="h3" $size="lg" $weight="700" $margin="0" $css="flex: 1;">
          {slide.title}
        </Text>
        {kind !== 'choose' && kind !== 'fill' && (
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            aria-pressed={isSaved}
            onClick={() => toggleSaved(lessonId, index)}
            aria-label={isSaved ? t('Kept in my memo') : t('Keep in my memo')}
            title={isSaved ? t('Kept in my memo') : t('Keep in my memo')}
            icon={
              <Icon
                iconName={isSaved ? 'bookmark' : 'bookmark_add'}
                $size="20px"
              />
            }
          />
        )}
      </Box>

      {kind === 'choose' && <ChooseSlide slide={slide} />}
      {kind === 'fill' && <FillSlide slide={slide} />}
      {kind === 'bricks' && <BricksSlide slide={slide} />}
      {(kind === 'text' || kind === 'annotated') && (
        <>
          <RichText text={slide.content} />
          {kind === 'annotated' && slide.parts && (
            <AnnotatedRequest parts={slide.parts} />
          )}
          {slide.example && (
            <>
              <Example example={slide.example} />
              <JobExample example={slide.example} />
            </>
          )}
          {slide.keyTakeaway && <Takeaway text={slide.keyTakeaway} />}
        </>
      )}
    </Box>
  );
};
