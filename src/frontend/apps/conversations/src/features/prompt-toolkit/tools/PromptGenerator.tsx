import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import {
  GeneratedPrompt,
  GenerationDetail,
  MergedPrompt,
  generatePrompts,
  mergePrompts,
} from '../coach/coachApi';
import { languageName } from '../coach/language';
import { CoachFeedback } from '../components/CoachFeedback';
import { CoachStatus } from '../components/CoachStatus';
import { DetailPage } from '../components/DetailPage';
import { ROBIN_PROMPTS_URL } from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { SavePromptButton } from '../library/SavePromptButton';

const cardCss = css`
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;

const choiceCss = (isSelected: boolean) => css`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: ${
    isSelected
      ? 'var(--c--contextuals--content--semantic--brand--primary)'
      : 'var(--c--contextuals--content--semantic--neutral--primary)'
  };
  border: 1px solid
    ${
      isSelected
        ? 'var(--c--contextuals--border--semantic--brand--primary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    isSelected
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** Describe a need, get two or three ready-to-send prompts. */
export const PromptGenerator = ({ onBack }: { onBack: () => void }) => {
  const offerPrompt = useOfferPrompt();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'need' | 'merge'>('need');
  const [need, setNeed] = useState('');
  const [detail, setDetail] = useState<GenerationDetail>('detailed');
  const [results, setResults] = useState<(GeneratedPrompt | MergedPrompt)[]>(
    [],
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const controllerRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    if (results.length) {
      resultsRef.current?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [results]);

  const generate = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    try {
      setResults(
        mode === 'merge'
          ? [
              {
                ...(await mergePrompts(
                  need.trim(),
                  languageName(i18n.language),
                  controller.signal,
                )),
                title: t('Merged prompt'),
              },
            ]
          : await generatePrompts(
              need.trim(),
              languageName(i18n.language),
              detail,
              controller.signal,
            ),
      );
      setStatus('idle');
    } catch {
      if (!controller.signal.aborted) {
        setStatus('error');
      }
    }
  };

  const use = (prompt: string) => offerPrompt(prompt, t('Prompt generator'));

  const copy = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    showToast('success', t('Copied to clipboard.'), undefined, 2000);
  };

  return (
    <DetailPage
      onBack={onBack}
      backLabel={t('Back to the tools')}
      title={t('Prompt generator')}
      subtitle={t('Describe what you need in your own words.')}
      image={ROBIN_PROMPTS_URL}
      status={
        <CoachStatus
          isLoading={status === 'loading'}
          loadingLabel={t('The coach is writing prompts for you…')}
        />
      }
    >
      <Box
        $gap="10px"
        $css={css`
          ${cardCss}
        `}
      >
        <Box
          role="radiogroup"
          aria-label={t('What do you want to do?')}
          $direction="row"
          $gap="6px"
        >
          {(
            [
              ['need', t('From a need')],
              ['merge', t('Merge prompts')],
            ] as const
          ).map(([value, label]) => (
            <Box
              key={value}
              as="button"
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => {
                setMode(value);
                setResults([]);
              }}
              $direction="row"
              $css={choiceCss(mode === value)}
            >
              {mode === value && (
                <Icon iconName="check" $size="16px" $withThemeInherited />
              )}
              {label}
            </Box>
          ))}
        </Box>
        <PanelTextArea
          fill={results.length === 0}
          label={mode === 'merge' ? t('Your prompts') : t('Your need')}
          minRows={4}
          value={need}
          placeholder={
            mode === 'merge'
              ? t('Paste two or more prompts, separated by an empty line.')
              : t('E.g. I must explain the new remote-work rules to my team.')
          }
          onChange={setNeed}
        />
        <Box
          role="radiogroup"
          aria-label={t('Level of detail')}
          $direction="row"
          $gap="6px"
          $display={mode === 'merge' ? 'none' : undefined}
        >
          {(
            [
              ['simple', t('Short')],
              ['detailed', t('Detailed')],
            ] as const
          ).map(([value, label]) => (
            <Box
              key={value}
              as="button"
              type="button"
              role="radio"
              aria-checked={detail === value}
              onClick={() => setDetail(value)}
              $direction="row"
              $css={choiceCss(detail === value)}
            >
              {detail === value && (
                <Icon iconName="check" $size="16px" $withThemeInherited />
              )}
              {label}
            </Box>
          ))}
        </Box>
        <Button
          fullWidth
          disabled={!need.trim() || status === 'loading'}
          onClick={() => void generate()}
          icon={<Icon iconName="auto_fix_high" $size="18px" />}
        >
          {mode === 'merge'
            ? t('Merge into one prompt')
            : results.length
              ? t('Suggest other prompts')
              : t('Suggest prompts')}
        </Button>
        {status === 'error' && (
          <Text $size="sm" role="alert">
            {t('The coach could not write prompts. Please retry.')}
          </Text>
        )}
      </Box>

      {results.length > 0 && (
        <Box ref={resultsRef} $gap="10px" $css="scroll-margin-top: 16px;">
          <Text as="h3" $size="sm" $weight="700" $margin="0">
            {t('Suggestions')}
          </Text>
          {results.map((result, index) => (
            <Box key={index} $gap="10px" $css={cardCss}>
              <Box $gap="2px">
                <Text $weight="700">
                  {result.title ||
                    t('Suggestion {{number}}', { number: index + 1 })}
                </Text>
                {result.why && (
                  <Text $size="xs" $variation="secondary">
                    {result.why}
                  </Text>
                )}
              </Box>
              {'changes' in result && result.changes.length > 0 && (
                <Box $gap="4px">
                  <Text $size="xs" $weight="700">
                    {t('What was combined')}
                  </Text>
                  <Box as="ul" $gap="2px" $css="margin: 0; padding-left: 18px;">
                    {result.changes.map((change) => (
                      <Text
                        as="li"
                        key={change}
                        $size="xs"
                        $css="display: list-item;"
                      >
                        {change}
                      </Text>
                    ))}
                  </Box>
                </Box>
              )}
              {'conflicts' in result && result.conflicts.length > 0 && (
                // Robin chose for the user: say so, so it can be changed.
                <Box
                  role="note"
                  $gap="4px"
                  $css={css`
                    padding: 10px 12px;
                    border-radius: 8px;
                    background: var(
                      --c--contextuals--background--semantic--warning--tertiary
                    );
                  `}
                >
                  <Box $direction="row" $align="center" $gap="6px">
                    <Icon iconName="call_split" $size="16px" $theme="warning" />
                    <Text $size="xs" $weight="700">
                      {t('Contradictions settled — edit if needed')}
                    </Text>
                  </Box>
                  {result.conflicts.map((conflict) => (
                    <Text key={conflict} $size="xs">
                      {conflict}
                    </Text>
                  ))}
                </Box>
              )}
              <Text
                $size="sm"
                $css={css`
                  white-space: pre-wrap;
                  overflow-wrap: anywhere;
                  padding: 10px 12px;
                  border-radius: 8px;
                  background: var(
                    --c--contextuals--background--surface--secondary
                  );
                `}
              >
                {result.prompt}
              </Text>
              <Box $direction="row" $gap="8px">
                <Button
                  size="small"
                  onClick={() => use(result.prompt)}
                  icon={<Icon iconName="arrow_upward" $size="16px" />}
                >
                  {t('Use')}
                </Button>
                <Button
                  size="small"
                  color="neutral"
                  variant="secondary"
                  onClick={() => void copy(result.prompt)}
                  icon={<Icon iconName="content_copy" $size="16px" />}
                >
                  {t('Copy')}
                </Button>
                <SavePromptButton prompt={result.prompt} title={result.title} />
              </Box>
            </Box>
          ))}
          <Box $direction="row" $justify="flex-end">
            <CoachFeedback target="generation" />
          </Box>
        </Box>
      )}
    </DetailPage>
  );
};
