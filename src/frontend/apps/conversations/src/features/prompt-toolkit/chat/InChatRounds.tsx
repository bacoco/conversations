import { useTranslation } from 'react-i18next';

import { Icon } from '@/components';

import { roundLabel } from './labels';
import type { NestorMessage, Round, RoundId } from './types';
import { ActionButton, RoundsTile } from './ui';

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
  'give-text': 'edit_note',
  'two-versions': 'view_agenda',
  'fix-myself': 'edit',
  say: 'mic',
  'clarify-request': 'edit_note',
  'clarify-answer': 'chat',
  'check-fix': 'task_alt',
  'remove-sensitive': 'backspace',
  'send-anyway': 'arrow_forward',
};

/** The actions of the moment, as labelled buttons under Nestor's last bubble. */
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
  const label = (id: RoundId) =>
    roundLabel(t, i18n.language, id, {
      missing,
      chosen: message.kind === 'chosen',
    });
  return (
    <RoundsTile>
      {rounds.map((round) => (
        <ActionButton
          key={round.id}
          type="button"
          $primary={round.primary}
          $voice={round.id === 'say'}
          data-voice={round.id === 'say' || undefined}
          onClick={() => onRound(round)}
        >
          <Icon iconName={ICONS[round.id]} $size="18px" $withThemeInherited />
          {label(round.id)}
        </ActionButton>
      ))}
    </RoundsTile>
  );
};
