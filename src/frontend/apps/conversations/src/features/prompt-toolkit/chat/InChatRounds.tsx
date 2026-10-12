import { useTranslation } from 'react-i18next';

import { Icon } from '@/components';

import type { NestorMessage, Round, RoundId } from './types';
import { RoundButton, RoundsTile } from './ui';

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

/** The rounds of the moment, a grey tile under Nestor's last bubble. */
export const InChatRounds = ({
  message,
  missing,
  rounds,
  onRound,
}: {
  message: NestorMessage;
  /** What the latest version left out: "Refaire avec date et salle". */
  missing: string[];
  rounds: Round[];
  onRound: (round: Round) => void;
}) => {
  const { t, i18n } = useTranslation();
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
    <RoundsTile>
      {rounds.map((round) => (
        <RoundButton
          key={round.id}
          type="button"
          $size="small"
          $primary={round.primary}
          onClick={() => onRound(round)}
        >
          <span>
            <Icon iconName={ICONS[round.id]} $size="20px" $withThemeInherited />
          </span>
          {label(round.id)}
        </RoundButton>
      ))}
    </RoundsTile>
  );
};
