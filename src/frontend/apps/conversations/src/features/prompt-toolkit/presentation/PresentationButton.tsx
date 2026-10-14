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

/** The round « ? »: on the home page's cards only (the header's is small). */
export const helpCornerShown = ({
  showHome,
  welcomeShown,
  isNestorChat,
}: {
  showHome: boolean;
  welcomeShown: boolean;
  isNestorChat: boolean;
}) => showHome && !welcomeShown && !isNestorChat;

const Round = styled.button`
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid ${C.brandLine};
  background: #ffffff;
  color: ${C.brand};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(30, 30, 46, 0.18);
  &:hover {
    background: ${C.brandSoft};
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
`;

/**
 * « Découvrir Nestor », a round « ? » at the bottom left of the home page,
 * facing the favorites' star: the film's window, then the guided tour.
 */
export const HelpCornerButton = () => {
  const { t } = useTranslation();
  const seen = useProfileStore((state) => state.hasSeenPresentation);
  const markSeen = useProfileStore((state) => state.markPresentationSeen);
  return (
    <Round
      type="button"
      aria-label={t('Discover Nestor')}
      title={t('Discover Nestor')}
      onClick={() => {
        markSeen();
        startTour();
      }}
    >
      <QuestionMarkCircleIcon aria-hidden width={30} height={30} />
      {!seen && (
        <Dot>
          <span className="sr-only">{t('New: discover Nestor')}</span>
        </Dot>
      )}
    </Round>
  );
};
