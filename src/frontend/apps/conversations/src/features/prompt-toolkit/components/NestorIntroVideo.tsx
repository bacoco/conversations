import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon } from '@/components';

/**
 * Nestor's presentation, one render per language. Source and render steps:
 * `videos/nestor-intro/` (HyperFrames) at the repository root.
 */
const introVideoUrl = (language?: string) =>
  `/assets/nestor-intro-${language?.startsWith('fr') ? 'fr' : 'en'}.mp4`;
/** The video's own background, so its letterboxing blends into the panel. */
const VIDEO_CANVAS = '#f6f8fc';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/**
 * Nestor's welcome as a video filling the panel. "Get started" is always
 * offered, so it doubles as "skip"; "Watch again" appears at the end.
 */
export const NestorIntroVideo = ({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasEnded, setHasEnded] = useState(false);

  const replay = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.currentTime = 0;
    void video.play().catch(() => undefined);
    setHasEnded(false);
  };

  return (
    <Box
      $height="100%"
      $css={css`
        min-height: 100%;
        background: ${VIDEO_CANVAS};
      `}
    >
      <Box $css="flex: 1; min-height: 0; position: relative;">
        <video
          ref={videoRef}
          src={introVideoUrl(i18n.language)}
          aria-label={t('Presentation of Nestor, your prompt copilot')}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setHasEnded(true)}
          onError={onError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: VIDEO_CANVAS,
          }}
        />
      </Box>
      <Box
        $direction="row"
        $gap="8px"
        $css="flex: none; padding: 12px 16px 16px;"
      >
        {hasEnded && (
          <Button
            color="neutral"
            variant="secondary"
            onClick={replay}
            icon={<Icon iconName="replay" $size="20px" />}
          >
            {t('Watch again')}
          </Button>
        )}
        <Box $css="flex: 1;">
          <Button
            fullWidth
            onClick={onDone}
            iconPosition="right"
            icon={<Icon iconName="arrow_forward" $size="20px" />}
          >
            {t('Get started')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
