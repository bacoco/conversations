import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import {
  GapChoice,
  fillGaps,
  findGaps,
  plainAnswer,
} from '../coach/answerGaps';
import { removeUnsupportedFacts } from '../coach/coachApi';
import { wordDiff } from '../coach/wordDiff';

import { DiffView } from './DiffView';

const stepCss = css`
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;

const inputCss = css`
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 8px;
  font: inherit;
  font-size: 0.875rem;
  color: inherit;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

const textCss = css`
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.55;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--c--contextuals--background--surface--secondary);
`;

/** Before / after; a long answer is just shown as it now is. */
const diffOf = (before: string, after: string) => {
  const parts = wordDiff(before, after);
  return parts ? (
    <DiffView parts={parts} />
  ) : (
    <Text $size="sm" $css={textCss}>
      {after}
    </Text>
  );
};

/**
 * "Make this answer ready", in the panel, step by step: Nestor takes out
 * the facts the request did not give (shown before / after), then asks for
 * each part to complete — or takes its sentence away when the user does
 * not have it. The answer can be copied only once nothing is left to fill.
 */
export const AnswerFinisher = ({
  request,
  answer,
  claims,
  language,
}: {
  request: string;
  answer: string;
  /** Facts of the answer the request did not give. */
  claims: string[];
  language: string;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [text, setText] = useState(() => plainAnswer(answer));
  const [removal, setRemoval] = useState<
    'todo' | 'loading' | 'done' | 'error' | 'skipped'
  >(claims.length > 0 ? 'todo' : 'skipped');
  const [before, setBefore] = useState<string | null>(null);
  const [choices, setChoices] = useState<(GapChoice | undefined)[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const removeFacts = async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setRemoval('loading');
    try {
      const corrected = await removeUnsupportedFacts(
        request,
        text,
        claims,
        language,
        controller.signal,
      );
      setBefore(text);
      setText(corrected);
      setChoices([]);
      setRemoval('done');
    } catch {
      if (!controller.signal.aborted) {
        setRemoval('error');
      }
    }
  };

  const gaps = findGaps(text);
  const final = fillGaps(text, choices);
  const left = findGaps(final).length;
  const isReady = removal !== 'todo' && removal !== 'loading' && left === 0;
  const choose = (index: number, choice: GapChoice | undefined) =>
    setChoices((list) => {
      const next = [...list];
      next[index] = choice;
      return next;
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(final);
      showToast(
        'success',
        t('Copied: paste it in your email.'),
        undefined,
        4000,
      );
    } catch {
      showToast('error', t('Copy failed. Please retry.'));
    }
  };

  return (
    <Box $gap="12px">
      {claims.length > 0 && (
        <Box $gap="8px" $css={stepCss}>
          <Text $size="sm" $weight="700">
            {t('1. Take out what your request did not give')}
          </Text>
          {removal === 'todo' || removal === 'error' ? (
            <>
              <Box as="ul" $css="margin: 0; padding-left: 18px;">
                {claims.map((claim) => (
                  <Text
                    as="li"
                    key={claim}
                    $size="sm"
                    $css="display: list-item;"
                  >
                    {claim}
                  </Text>
                ))}
              </Box>
              <Box $direction="row" $gap="8px" $css="flex-wrap: wrap;">
                <Button size="small" onClick={() => void removeFacts()}>
                  {t('Take them out')}
                </Button>
                <Button
                  size="small"
                  color="neutral"
                  variant="tertiary"
                  onClick={() => setRemoval('skipped')}
                >
                  {t('They are right, I checked')}
                </Button>
              </Box>
              {removal === 'error' && (
                <Text $size="xs" role="alert">
                  {t('Nestor could not correct the answer. Please retry.')}
                </Text>
              )}
            </>
          ) : removal === 'loading' ? (
            <Box $direction="row" $align="center" $gap="8px" role="status">
              <Loader size="small" />
              <Text $size="sm">{t('Nestor corrects the answer…')}</Text>
            </Box>
          ) : removal === 'done' && before ? (
            <Box $gap="4px">
              <Text $size="xs" $variation="secondary">
                {t('What changed: struck out, taken away; in green, added.')}
              </Text>
              {diffOf(before, text)}
            </Box>
          ) : (
            <Text $size="sm" $variation="secondary">
              {t('Kept as they are.')}
            </Text>
          )}
        </Box>
      )}

      {removal !== 'todo' && removal !== 'loading' && gaps.length > 0 && (
        <Box $gap="10px" $css={stepCss}>
          <Text $size="sm" $weight="700">
            {claims.length > 0
              ? t('2. Complete what is missing')
              : t('Complete what is missing')}
          </Text>
          {gaps.map((gap, index) => {
            const choice = choices[index];
            const isDropped = Boolean(choice && 'drop' in choice);
            const id = `nestor-gap-${index}`;
            return (
              <Box key={`${gap.start}-${gap.raw}`} $gap="4px">
                <label htmlFor={id}>
                  <Text $size="sm" $weight="600">
                    {gap.label || t('To complete')}
                  </Text>
                </label>
                <Text $size="xs" $variation="secondary">
                  « {gap.sentence} »
                </Text>
                {isDropped ? (
                  <Box $direction="row" $align="center" $gap="8px">
                    <Text $size="sm" $variation="secondary">
                      {gap.raw.startsWith('[')
                        ? t('Left out.')
                        : t('This sentence is taken away.')}
                    </Text>
                    <Box
                      as="button"
                      type="button"
                      onClick={() => choose(index, undefined)}
                      $css={css`
                        padding: 0;
                        border: none;
                        background: none;
                        cursor: pointer;
                        font: inherit;
                        font-size: 0.8125rem;
                        text-decoration: underline;
                        color: var(
                          --c--contextuals--content--semantic--brand--primary
                        );
                      `}
                    >
                      {t('Undo')}
                    </Box>
                  </Box>
                ) : (
                  <Box $direction="row" $gap="6px" $align="center">
                    <Box
                      as="input"
                      id={id}
                      value={choice && 'value' in choice ? choice.value : ''}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        choose(index, { value: event.target.value })
                      }
                      $css={inputCss}
                    />
                    <Button
                      size="small"
                      color="neutral"
                      variant="tertiary"
                      onClick={() => choose(index, { drop: true })}
                    >
                      {t('I do not have it')}
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {removal !== 'todo' && removal !== 'loading' && (
        <Box $gap="8px" $css={stepCss}>
          <Text $size="sm" $weight="700">
            {isReady
              ? t('Your answer is ready')
              : t('{{count}} parts still to complete', { count: left })}
          </Text>
          <Text $size="sm" $css={textCss}>
            {final}
          </Text>
          <Box $direction="row">
            <Button
              disabled={!isReady}
              onClick={() => void copy()}
              icon={<Icon iconName="content_copy" $size="18px" />}
            >
              {t('Copy the answer')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
