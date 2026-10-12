import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon } from '@/components';

import type { NestorMessage, Round, RoundId } from './types';

const ICONS: Record<RoundId, string> = {
  examples: 'lightbulb',
  complete: 'edit_note',
  'create-without': 'skip_next',
  'redo-with-missing': 'replay',
  shorter: 'short_text',
  'other-version': 'autorenew',
  undo: 'undo',
  'resume-questions': 'help',
  'new-request': 'add',
  lesson: 'school',
  retry: 'refresh',
};

const roundCss = (primary: boolean) => css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 92px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  & > span:first-child {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: ${primary ? '#fff' : 'var(--c--contextuals--content--semantic--brand--primary)'};
    background: ${primary ? 'var(--c--contextuals--background--semantic--brand--primary)' : '#fff'};
    border: 1.5px solid var(--c--contextuals--border--semantic--brand--primary);
  }
  & > span:last-child {
    font-size: 0.75rem;
    line-height: 1.2;
    text-align: center;
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** The rounds of the moment, attached under Nestor's last bubble. */
export const InChatRounds = ({
  message,
  rounds,
  onRound,
}: {
  message: NestorMessage;
  rounds: Round[];
  onRound: (round: Round) => void;
}) => {
  const { t, i18n } = useTranslation();
  const missing =
    message.kind === 'version' || message.kind === 'advice'
      ? message.missing
      : [];
  const items = new Intl.ListFormat(i18n.language, {
    type: 'conjunction',
  }).format(missing);
  const label = (id: RoundId) =>
    ({
      examples: t('See examples'),
      complete: t('Complete them'),
      'create-without': t('Create without this information'),
      'redo-with-missing': t('Redo with {{items}}', { items }),
      shorter: t('Shorter'),
      'other-version': t('Another version'),
      undo:
        message.kind === 'chosen'
          ? t('Cancel')
          : t('Back to the previous version'),
      'resume-questions': t('Resume the questions'),
      'new-request': t('Start a request'),
      lesson: t('See the lesson'),
      retry: t('Retry'),
    })[id];
  return (
    <Box
      $direction="row"
      $justify="center"
      $gap="12px"
      $css="flex-wrap: wrap; margin: 4px 0 0 40px; padding: 12px 8px; border-radius: 0 0 12px 12px; background: #f4f4f7;"
    >
      {rounds.map((round) => (
        <Box
          as="button"
          type="button"
          key={round.id}
          onClick={() => onRound(round)}
          $css={roundCss(!!round.primary)}
        >
          <span>
            <Icon iconName={ICONS[round.id]} $size="22px" $withThemeInherited />
          </span>
          <span>{label(round.id)}</span>
        </Box>
      ))}
    </Box>
  );
};
