import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Box, Icon } from '@/components';

import { NestorHeaderTools } from '../chat/NestorSettings';
import { PresentationButton } from '../presentation/PresentationButton';

/**
 * The right end of the panel's header: the same tools, in the same order,
 * with the same look on every screen. « Recommencer » only exists in some
 * spaces: it comes first, so nothing else moves.
 */
export const PanelHeaderTools = ({
  isDesktop,
  isExpanded,
  onSettings,
  onReset,
  resetLabel,
  onExpand,
  onClose,
}: {
  isDesktop: boolean;
  isExpanded: boolean;
  onSettings: () => void;
  onReset?: () => void;
  /** What the bin does here: « Recommencer », or erase Nestor's thread. */
  resetLabel?: string;
  onExpand?: () => void;
  onClose?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box
      role="group"
      aria-label={t('Panel tools')}
      $direction="row"
      $align="center"
      $gap="0"
      $css="flex: none;"
    >
      {onReset && (
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={onReset}
          aria-label={resetLabel ?? t('Start over')}
          title={resetLabel ?? t('Start over')}
          icon={<Icon iconName="delete" $size="20px" />}
        />
      )}
      <NestorHeaderTools />
      <PresentationButton />
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={onSettings}
        aria-label={t('Nestor’s settings')}
        title={t('Nestor’s settings')}
        icon={<Icon iconName="settings" $size="20px" />}
      />
      {isDesktop && (
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={onExpand}
          aria-label={
            isExpanded ? t('Reduce the panel') : t('Expand the panel')
          }
          title={isExpanded ? t('Reduce the panel') : t('Expand the panel')}
          icon={
            <Icon
              iconName={isExpanded ? 'close_fullscreen' : 'open_in_full'}
              $size="18px"
            />
          }
        />
      )}
      {!isDesktop && (
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={onClose}
          aria-label={t('Close the panel')}
          icon={<Icon iconName="close" $size="20px" />}
        />
      )}
    </Box>
  );
};
