import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import {
  GapChoice,
  fillGaps,
  findGaps,
  plainAnswer,
  sentenceOfClaim,
  withoutSentences,
} from '../coach/answerGaps';
import { copyText, selectText } from '../coach/copyText';

const itemCss = (isSettled: boolean) => css`
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid
    ${
      isSettled
        ? 'var(--c--contextuals--border--semantic--success--primary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    isSettled
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
`;

const statusCss = (isReady: boolean) => css`
  position: sticky;
  top: 8px;
  z-index: 1;
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: var(
    --c--contextuals--background--semantic--${isReady ? 'success' : 'warning'}--tertiary
  );
`;

const inputCss = css`
  flex: 1;
  min-width: 0;
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

const linkCss = css`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  text-decoration: underline;
  color: var(--c--contextuals--content--semantic--brand--primary);
`;

type FactDecision = 'keep' | 'remove';

/**
 * "Make this answer ready": one list of points to settle before sending.
 * Each fact the request did not give: keep it (checked) or take its
 * sentence away. Each part to complete: give it once, or "I do not have
 * it". The status and the copy button stay on top; the answer, exactly as
 * it will be pasted, below. No call to the model: what is copied is the
 * answer and what the user typed, nothing else.
 */
export const AnswerFinisher = ({
  answer,
  claims,
}: {
  answer: string;
  /** Facts of the answer the request did not give. */
  claims: string[];
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const base = useMemo(() => plainAnswer(answer), [answer]);
  const facts = useMemo(
    () =>
      claims.map((claim) => ({
        claim,
        sentence: sentenceOfClaim(base, claim),
      })),
    [base, claims],
  );
  const [decisions, setDecisions] = useState<
    Record<number, FactDecision | undefined>
  >({});
  /** One answer per thing to give, however many times it is asked. */
  const [given, setGiven] = useState<Record<string, GapChoice | undefined>>({});
  const previewRef = useRef<HTMLDivElement | null>(null);

  const kept = withoutSentences(
    base,
    facts
      .filter((fact, index) => decisions[index] === 'remove' && fact.sentence)
      .map((fact) => fact.sentence ?? ''),
  );
  const gaps = findGaps(kept);
  const keyOf = (label: string, raw: string) =>
    (label || raw).toLocaleLowerCase().trim();
  const asked = gaps.filter(
    (gap, index) =>
      gaps.findIndex(
        (other) => keyOf(other.label, other.raw) === keyOf(gap.label, gap.raw),
      ) === index,
  );
  const final = fillGaps(
    kept,
    gaps.map((gap) => given[keyOf(gap.label, gap.raw)]),
  );
  const factsLeft = facts.filter((_, index) => !decisions[index]).length;
  const gapsLeft = findGaps(final).length;
  const left = factsLeft + gapsLeft;
  const isReady = left === 0;

  const copy = async () => {
    if (await copyText(final)) {
      showToast(
        'success',
        t('Copied: paste it in your email.'),
        undefined,
        4000,
      );
      return;
    }
    selectText(previewRef.current);
    showToast(
      'info',
      t('The text is selected below: press Ctrl+C to copy it.'),
      undefined,
      6000,
    );
  };

  return (
    <Box $gap="10px">
      <Box
        $direction="row"
        $align="center"
        $gap="10px"
        $css={statusCss(isReady)}
      >
        <Icon
          iconName={isReady ? 'task_alt' : 'pending_actions'}
          $size="20px"
          $theme={isReady ? 'success' : 'warning'}
        />
        <Text $size="sm" $weight="700" $css="flex: 1;" role="status">
          {isReady
            ? t('Your answer is ready')
            : t('{{count}} points to settle before sending', { count: left })}
        </Text>
        <Button
          size="small"
          disabled={!isReady}
          onClick={() => void copy()}
          icon={<Icon iconName="content_copy" $size="16px" />}
        >
          {t('Copy the answer')}
        </Button>
      </Box>

      {facts.length > 0 && (
        <Text $size="sm" $weight="700">
          {t('Facts your request did not give')}
        </Text>
      )}
      {facts.map((fact, index) => {
        const decision = decisions[index];
        const decide = (value: FactDecision | undefined) =>
          setDecisions((list) => ({ ...list, [index]: value }));
        return (
          <Box key={fact.claim} $gap="6px" $css={itemCss(Boolean(decision))}>
            <Text $size="sm" $weight="600">
              {fact.claim}
            </Text>
            {fact.sentence && (
              <Text $size="xs" $variation="secondary">
                « {fact.sentence} »
              </Text>
            )}
            {decision ? (
              <Box $direction="row" $gap="8px" $align="center">
                <Text $size="sm">
                  {decision === 'keep'
                    ? t('Kept: you checked it.')
                    : t('This sentence is taken away.')}
                </Text>
                <Box
                  as="button"
                  type="button"
                  onClick={() => decide(undefined)}
                  $css={linkCss}
                >
                  {t('Undo')}
                </Box>
              </Box>
            ) : (
              <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
                <Button
                  size="small"
                  color="neutral"
                  variant="secondary"
                  onClick={() => decide('keep')}
                >
                  {t('It is right, I checked')}
                </Button>
                {fact.sentence && (
                  <Button
                    size="small"
                    color="neutral"
                    variant="secondary"
                    onClick={() => decide('remove')}
                  >
                    {t('Take this sentence away')}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        );
      })}

      {asked.length > 0 && (
        <Text $size="sm" $weight="700">
          {t('Complete what is missing')}
        </Text>
      )}
      {asked.map((gap, index) => {
        const key = keyOf(gap.label, gap.raw);
        const choice = given[key];
        const isDropped = Boolean(choice && 'drop' in choice);
        const value = choice && 'value' in choice ? choice.value : '';
        const id = `nestor-gap-${index}`;
        const set = (next: GapChoice | undefined) =>
          setGiven((list) => ({ ...list, [key]: next }));
        return (
          <Box
            key={key}
            $gap="6px"
            $css={itemCss(isDropped || value.trim() !== '')}
          >
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
                <Text $size="sm">
                  {gap.raw.startsWith('[')
                    ? t('Left out.')
                    : t('This sentence is taken away.')}
                </Text>
                <Box
                  as="button"
                  type="button"
                  onClick={() => set(undefined)}
                  $css={linkCss}
                >
                  {t('Undo')}
                </Box>
              </Box>
            ) : (
              <Box $direction="row" $gap="6px" $align="center">
                <Box
                  as="input"
                  id={id}
                  value={value}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    set({ value: event.target.value })
                  }
                  $css={inputCss}
                />
                <Button
                  size="small"
                  color="neutral"
                  variant="tertiary"
                  onClick={() => set({ drop: true })}
                >
                  {t('I do not have it')}
                </Button>
              </Box>
            )}
          </Box>
        );
      })}

      <Text $size="sm" $weight="700">
        {t('The answer, as it will be pasted')}
      </Text>
      <Box ref={previewRef} $css={textCss}>
        <Text $size="sm" $css="white-space: pre-wrap;">
          {final}
        </Text>
      </Box>
    </Box>
  );
};
