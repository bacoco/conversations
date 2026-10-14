import { Button, Modal, ModalSize } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import QuestionMarkCircleIcon from '@/assets/icons/uikit-custom/question-mark-circle.svg?react';

import { C } from '../chat/ui';
import { useProfileStore } from '../stores/useProfileStore';
import { startTour } from '../stores/useTourStore';

/** The presentation film: French only for now. */
export const PRESENTATION_VIDEO_URL = '/assets/nestor-presentation-fr.mp4';
export const PRESENTATION_POSTER_URL = '/assets/nestor-presentation-fr.jpg';

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

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin-bottom: 14px;
  font-size: 14px;
  color: ${C.muted};
`;

const Film = styled.video`
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background: ${C.soft};
`;

/**
 * « ? » in the panel's header, like the Assistant's: it opens a window with
 * the presentation of Nestor. A dot shows until it is opened once; it never
 * opens by itself.
 */
export const PresentationButton = () => {
  const { t } = useTranslation();
  const seen = useProfileStore((state) => state.hasSeenPresentation);
  const markSeen = useProfileStore((state) => state.markPresentationSeen);
  const [isOpen, setIsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Anchor data-tour="help">
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          aria-label={t('Discover Nestor')}
          title={t('Discover Nestor')}
          onClick={() => {
            markSeen();
            setFailed(false);
            setIsOpen(true);
          }}
          icon={<QuestionMarkCircleIcon aria-hidden width={20} height={20} />}
        />
        {!seen && (
          <Dot>
            <span className="sr-only">{t('New: discover Nestor')}</span>
          </Dot>
        )}
      </Anchor>
      {/* Mounted only when asked for: the header stays free of it. */}
      {isOpen && (
        <Modal
          isOpen
          onClose={() => setIsOpen(false)}
          size={ModalSize.LARGE}
          title={t('Discover Nestor')}
        >
          <Actions>
            <Button
              color="brand"
              onClick={() => {
                setIsOpen(false);
                startTour();
              }}
            >
              {t('Take the tour')}
            </Button>
            <span>
              {t(
                'Nestor shows you each button on the real screen, then you try them on an example of your job.',
              )}
            </span>
          </Actions>
          {failed ? (
            <p>{t('The presentation cannot be played here.')}</p>
          ) : (
            <Film
              aria-label={t('Presentation of Nestor')}
              src={PRESENTATION_VIDEO_URL}
              poster={PRESENTATION_POSTER_URL}
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              onError={() => setFailed(true)}
            />
          )}
        </Modal>
      )}
    </>
  );
};
