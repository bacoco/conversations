import { Button } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

const chipCss = css`
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--c--contextuals--content--semantic--brand--primary);
  border: 1px solid var(--c--contextuals--border--semantic--brand--secondary);
  background: var(--c--contextuals--background--surface--primary);
  &:hover:not(:disabled) {
    background: var(--c--contextuals--background--semantic--brand--tertiary);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const inputCss = css`
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  font: inherit;
  font-size: 0.8125rem;
  color: inherit;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  &:focus {
    outline: none;
    border-color: var(--c--contextuals--border--semantic--brand--primary);
  }
`;

/** Adjust the suggested version in a few words: quick ones, or your own. */
export const RefineBar = ({
  onRefine,
  isRefining,
}: {
  onRefine: (request: string) => void;
  isRefining: boolean;
}) => {
  const { t } = useTranslation();
  const [request, setRequest] = useState('');
  const quick = [
    t('Shorter'),
    t('More formal'),
    t('Simpler words'),
    t('For a member of the public'),
  ];

  const send = () => {
    if (request.trim() && !isRefining) {
      onRefine(request.trim());
      setRequest('');
    }
  };

  return (
    <Box $gap="6px">
      <Text $size="xs" $weight="600" id="refine-label">
        {t('Adjust this version')}
      </Text>
      <Box
        role="group"
        aria-labelledby="refine-label"
        $direction="row"
        $gap="6px"
        $css="flex-wrap: wrap;"
      >
        {quick.map((label) => (
          <Box
            key={label}
            as="button"
            type="button"
            disabled={isRefining}
            onClick={() => onRefine(label)}
            $css={chipCss}
          >
            {label}
          </Box>
        ))}
      </Box>
      <Box $direction="row" $gap="6px" $align="center">
        <Box
          as="input"
          type="text"
          value={request}
          aria-label={t('Your own adjustment')}
          placeholder={t('Or say it in your words…')}
          onChange={(event: { target: { value: string } }) =>
            setRequest(event.target.value)
          }
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              send();
            }
          }}
          $css={inputCss}
        />
        <Button
          size="small"
          color="neutral"
          variant="secondary"
          disabled={isRefining || !request.trim()}
          onClick={send}
          aria-label={t('Adjust')}
          icon={<Icon iconName="send" $size="16px" />}
        />
      </Box>
    </Box>
  );
};
