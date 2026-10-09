import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import {
  PromptComparison,
  TutorHint,
  comparePrompts,
  tutorHint,
} from '../coach/coachApi';

const cardCss = css`
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;

/**
 * Tutor mode: Robin gives one hint at a time and lets the user improve the
 * prompt on their own, which teaches more than a ready-made version.
 */
export const TutorHints = ({
  prompt,
  language,
}: {
  prompt: string;
  language: string;
}) => {
  const { t } = useTranslation();
  const [hints, setHints] = useState<TutorHint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  // A new prompt starts a new series of hints.
  useEffect(() => {
    controllerRef.current?.abort();
    setHints([]);
    setHasError(false);
  }, [prompt]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const askHint = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setHasError(false);
    try {
      const hint = await tutorHint(
        prompt,
        language,
        hints.map((item) => item.hint),
        controller.signal,
      );
      setHints((previous) => [...previous, hint]);
    } catch {
      if (!controller.signal.aborted) {
        setHasError(true);
      }
    } finally {
      if (controllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box $gap="8px">
      {hints.length > 0 && (
        <Box as="ol" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
          {hints.map((item, index) => (
            <Box
              as="li"
              key={item.hint}
              $direction="row"
              $gap="10px"
              $css={cardCss}
            >
              <Icon iconName="lightbulb" $size="20px" $theme="brand" />
              <Box $gap="2px" $css="flex: 1; min-width: 0;">
                <Text $size="sm" $weight="700">
                  {t('Hint {{number}}', { number: index + 1 })} : {item.hint}
                </Text>
                {item.why && (
                  <Text $size="xs" $variation="secondary">
                    {item.why}
                  </Text>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {hints.length > 0 && (
        <Text $size="xs" $variation="secondary">
          {t(
            'Improve your prompt in the message field, then analyse it again.',
          )}
        </Text>
      )}
      {hasError && (
        <Text $size="sm" role="alert">
          {t('Robin could not give a hint. Please retry.')}
        </Text>
      )}
      <Button
        fullWidth
        color="neutral"
        variant="secondary"
        disabled={isLoading}
        onClick={() => void askHint()}
        icon={
          isLoading ? (
            <Loader size="small" />
          ) : (
            <Icon iconName="lightbulb" $size="18px" />
          )
        }
      >
        {hints.length === 0
          ? t('Guide me without rewriting')
          : t('Another hint')}
      </Button>
    </Box>
  );
};

/** What each version will most likely produce, without running them. */
export const ExplainedComparison = ({
  original,
  improved,
  language,
}: {
  original: string;
  improved: string;
  language: string;
}) => {
  const { t } = useTranslation();
  const [comparison, setComparison] = useState<PromptComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current?.abort();
    setComparison(null);
  }, [original, improved]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const compare = async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setHasError(false);
    try {
      setComparison(
        await comparePrompts(original, improved, language, controller.signal),
      );
    } catch {
      if (!controller.signal.aborted) {
        setHasError(true);
      }
    } finally {
      if (controllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  if (comparison) {
    return (
      <Box $gap="8px">
        <Text $size="xs" $weight="600">
          {t('What each version will produce')}
        </Text>
        <Box $gap="2px" $css={cardCss}>
          <Text $size="xs" $weight="700" $variation="secondary">
            {t('Your prompt')}
          </Text>
          <Text $size="sm">{comparison.original}</Text>
        </Box>
        <Box $gap="2px" $css={cardCss}>
          <Text $size="xs" $weight="700" $theme="brand">
            {t('Suggested version')}
          </Text>
          <Text $size="sm">{comparison.improved}</Text>
        </Box>
      </Box>
    );
  }
  return (
    <Box $gap="4px">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        disabled={isLoading}
        onClick={() => void compare()}
        icon={
          isLoading ? (
            <Loader size="small" />
          ) : (
            <Icon iconName="compare_arrows" $size="16px" />
          )
        }
      >
        {t('What will each version produce?')}
      </Button>
      {hasError && (
        <Text $size="xs" role="alert">
          {t('Robin could not compare the two versions. Please retry.')}
        </Text>
      )}
    </Box>
  );
};
