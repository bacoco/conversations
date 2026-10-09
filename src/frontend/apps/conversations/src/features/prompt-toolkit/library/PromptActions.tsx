import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import {
  PromptExplanation,
  explainPrompt,
  hasPlaceholders,
} from '../coach/coachApi';
import { languageName } from '../coach/language';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

const explanationCss = css`
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 3px solid var(--c--contextuals--border--semantic--brand--primary);
  background: var(--c--contextuals--background--semantic--brand--tertiary);
`;

/** Why each part of the prompt is there, and what to put in it. */
const Explanation = ({ prompt }: { prompt: string }) => {
  const { t, i18n } = useTranslation();
  const [result, setResult] = useState<PromptExplanation | null>(null);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setHasError(false);
    explainPrompt(prompt, languageName(i18n.language), controller.signal)
      .then(setResult)
      .catch(() => {
        if (!controller.signal.aborted) {
          setHasError(true);
        }
      });
    return () => controller.abort();
  }, [prompt, i18n.language, attempt]);

  if (hasError) {
    return (
      <Box $direction="row" $align="center" $gap="8px" $css={explanationCss}>
        <Text $size="sm" $theme="danger" $css="flex: 1;">
          {t('The explanation could not be loaded.')}
        </Text>
        <Button
          size="small"
          color="neutral"
          variant="secondary"
          onClick={() => setAttempt((value) => value + 1)}
        >
          {t('Retry')}
        </Button>
      </Box>
    );
  }
  if (!result) {
    return (
      <Box $css={explanationCss} aria-busy="true">
        <Text $size="sm" $variation="secondary">
          {t('Robin reads the prompt…')}
        </Text>
      </Box>
    );
  }
  return (
    <Box $gap="10px" $css={explanationCss} aria-live="polite">
      {result.summary && (
        <Text $size="sm" $weight="600">
          {result.summary}
        </Text>
      )}
      <Box as="ol" $gap="8px" $css="margin: 0; padding-left: 18px;">
        {result.parts.map((part) => (
          <li key={part.part}>
            <Text $size="sm" $weight="700">
              {part.part}
            </Text>
            {part.why && (
              <Text $size="sm" $variation="secondary">
                {part.why}
              </Text>
            )}
            {part.fill && <Text $size="sm">{part.fill}</Text>}
          </li>
        ))}
      </Box>
    </Box>
  );
};

/**
 * The three ways to take a library prompt: understand it, use it as it is,
 * or let Robin ask for what is missing.
 */
export const PromptActions = ({
  prompt,
  title,
}: {
  prompt: string;
  title: string;
}) => {
  const { t } = useTranslation();
  const placePrompt = usePlacePrompt();
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const [isExplained, setIsExplained] = useState(false);
  const isComplete = !hasPlaceholders(prompt);
  const isAiAvailable = useAiAvailable();

  return (
    <Box $gap="10px">
      <Box
        $direction="row"
        $gap="8px"
        $justify="flex-end"
        $css="flex-wrap: wrap;"
      >
        {isAiAvailable && (
          <Button
            size="small"
            color="neutral"
            variant="secondary"
            aria-expanded={isExplained}
            onClick={() => setIsExplained((value) => !value)}
            icon={<Icon iconName="lightbulb" $size="16px" />}
          >
            {isExplained ? t('Hide the explanation') : t('Understand')}
          </Button>
        )}
        <Button
          size="small"
          color="neutral"
          variant="secondary"
          onClick={() => placePrompt(prompt)}
          icon={<Icon iconName="north_west" $size="16px" />}
        >
          {t('Use as is')}
        </Button>
        {isAiAvailable && !isComplete && (
          <Button
            size="small"
            onClick={() => startFill(prompt, title)}
            icon={<Icon iconName="auto_awesome" $size="16px" />}
          >
            {t('Complete with Robin')}
          </Button>
        )}
      </Box>
      {isExplained && <Explanation prompt={prompt} />}
    </Box>
  );
};
