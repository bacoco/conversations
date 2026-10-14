import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import QuestionMarkCircleIcon from '@/assets/icons/uikit-custom/question-mark-circle.svg?react';

import { C } from '../chat/ui';
import { useProfileStore } from '../stores/useProfileStore';
import { startTour } from '../stores/useTourStore';

const Anchor = styled.span`
  position: relative;
  display: inline-flex;
`;

/** The same small dot as on the home cards: something new to open. */
const Dot = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${C.brand};
  border: 2px solid #ffffff;
  pointer-events: none;
`;

/**
 * « ? » in the panel's header: Nestor's tour starts at once, no window in
 * between; the film is one click away in its first step. A dot shows until
 * it is used once.
 */
export const PresentationButton = () => {
  const { t } = useTranslation();
  const seen = useProfileStore((state) => state.hasSeenPresentation);
  const markSeen = useProfileStore((state) => state.markPresentationSeen);
  return (
    <Anchor data-tour="help">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        aria-label={t('Discover Nestor')}
        title={t('Discover Nestor')}
        onClick={() => {
          markSeen();
          startTour();
        }}
        icon={<QuestionMarkCircleIcon aria-hidden width={26} height={26} />}
      />
      {!seen && (
        <Dot>
          <span className="sr-only">{t('New: discover Nestor')}</span>
        </Dot>
      )}
    </Anchor>
  );
};
