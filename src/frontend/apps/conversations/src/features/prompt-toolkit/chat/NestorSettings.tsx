import { Button, Switch } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { useConversationRouteId } from '@/utils';

import { ProfileSettings } from '../components/ProfileSettings';
import {
  AutoPart,
  USUAL_AUDIENCES,
  UsualAudience,
  useCoachPrefsStore,
} from '../stores/useCoachPrefsStore';
import { NEW_CHAT_KEY, useNestorChatStore } from '../stores/useNestorChatStore';

/** "Auto" in Nestor's header: the same switch as in the settings. */
export const NestorHeaderTools = ({
  onSettings,
}: {
  onSettings?: () => void;
}) => {
  const { t } = useTranslation();
  const auto = useCoachPrefsStore((state) => state.auto);
  const setAuto = useCoachPrefsStore((state) => state.setAuto);
  return (
    <Box $direction="row" $align="center" $gap="8px">
      <Switch
        label={t('Auto')}
        checked={auto}
        role="switch"
        onChange={(event) => setAuto(event.target.checked)}
      />
      {onSettings && (
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          aria-label={t('Nestor’s settings')}
          onClick={onSettings}
          icon={
            <span className="material-icons" aria-hidden="true">
              settings
            </span>
          }
        />
      )}
    </Box>
  );
};

export const NestorSettings = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const prefs = useCoachPrefsStore();
  const conversationId = useConversationRouteId();
  const parts: { part: AutoPart; label: string; note?: string }[] = [
    { part: 'autoPistes', label: t('Ideas while I type') },
    {
      part: 'autoAnalyse',
      label: t('Analyse when I pause'),
      note: t('Nestor reads your text after 3 seconds without typing.'),
    },
    { part: 'autoAdvice', label: t('Advice after each answer') },
    { part: 'autoSuites', label: t('Suggest ways to go on') },
  ];
  const audienceLabels: Record<UsualAudience, string> = {
    colleagues: t('Colleagues'),
    management: t('My management'),
    public: t('The public'),
    partners: t('Partners'),
  };
  // Erasing asks once more, in place: "Oui, effacer" or "Non, garder".
  const [confirming, setConfirming] = useState(false);
  const erase = () => {
    useNestorChatStore.getState().clear(conversationId ?? NEW_CHAT_KEY);
    setConfirming(false);
    onClose();
  };
  return (
    <Box
      $gap="18px"
      $padding={{ all: 'base' }}
      $css="max-width: 480px; margin-inline: auto;"
    >
      <Box $direction="row" $justify="space-between" $align="center">
        <Text as="h2" $size="md" $weight="700" $margin="0">
          {t('Nestor’s settings')}
        </Text>
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={onClose}
        >
          {t('Back to the chat')}
        </Button>
      </Box>
      <Box as="section" $gap="10px">
        <Switch
          label={t('Auto')}
          role="switch"
          checked={prefs.auto}
          onChange={(e) => prefs.setAuto(e.target.checked)}
        />
        <Text $size="xs" $variation="secondary">
          {t(
            'Off: the 4 lines below grey out and Nestor does nothing by himself. On again: they come back as you left them.',
          )}
        </Text>
        {parts.map(({ part, label, note }) => (
          <Box key={part} $gap="2px" $css="padding-left: 16px;">
            <Switch
              label={label}
              role="switch"
              checked={prefs[part]}
              disabled={!prefs.auto}
              onChange={(e) => prefs.setAutoPart(part, e.target.checked)}
            />
            {note && (
              <Text $size="xs" $variation="secondary">
                {note}
              </Text>
            )}
          </Box>
        ))}
      </Box>
      <Box as="section" $gap="10px">
        <Text as="h3" $size="sm" $weight="700" $margin="0">
          {t('How Nestor talks to me')}
        </Text>
        {/* Tone and length: two choices each, as segmented buttons. */}
        <Box
          $direction="row"
          $gap="6px"
          role="radiogroup"
          aria-label={t('Tone')}
        >
          {(['encouraging', 'direct'] as const).map((tone) => (
            <Button
              key={tone}
              size="small"
              color={prefs.tone === tone ? 'brand' : 'neutral'}
              variant={prefs.tone === tone ? 'primary' : 'secondary'}
              role="radio"
              aria-checked={prefs.tone === tone}
              onClick={() => prefs.setTone(tone)}
            >
              {tone === 'encouraging' ? t('Encouraging') : t('Direct')}
            </Button>
          ))}
        </Box>
        <Box
          $direction="row"
          $gap="6px"
          role="radiogroup"
          aria-label={t('Length of the advice')}
        >
          {(['short', 'detailed'] as const).map((length) => (
            <Button
              key={length}
              size="small"
              color={prefs.length === length ? 'brand' : 'neutral'}
              variant={prefs.length === length ? 'primary' : 'secondary'}
              role="radio"
              aria-checked={prefs.length === length}
              onClick={() => prefs.setLength(length)}
            >
              {length === 'short' ? t('Short') : t('Detailed')}
            </Button>
          ))}
        </Box>
      </Box>
      <Box as="section" $gap="10px">
        <Text as="h3" $size="sm" $weight="700" $margin="0">
          {t('To help me better')}
        </Text>
        <ProfileSettings withBeginner={false} />
        <Box
          $direction="row"
          $gap="6px"
          $css="flex-wrap: wrap;"
          role="radiogroup"
          aria-label={t('My usual readers')}
        >
          {USUAL_AUDIENCES.map((audience) => (
            <Button
              key={audience}
              size="small"
              role="radio"
              aria-checked={prefs.usualAudience === audience}
              color={prefs.usualAudience === audience ? 'brand' : 'neutral'}
              variant={
                prefs.usualAudience === audience ? 'primary' : 'secondary'
              }
              onClick={() =>
                prefs.setUsualAudience(
                  prefs.usualAudience === audience ? null : audience,
                )
              }
            >
              {audienceLabels[audience]}
            </Button>
          ))}
        </Box>
        <Text $size="xs" $variation="secondary">
          {t('Only used to pick examples. Never added to your requests.')}
        </Text>
      </Box>
      <Box as="section" $gap="6px">
        {confirming ? (
          <Box
            role="group"
            aria-label={t('Erase Nestor’s thread for this conversation?')}
            $gap="6px"
          >
            <Text $size="sm" $weight="600">
              {t('Erase Nestor’s thread for this conversation?')}
            </Text>
            <Box $direction="row" $gap="8px">
              <Button size="small" color="error" onClick={erase}>
                {t('Yes, erase it')}
              </Button>
              <Button
                size="small"
                color="neutral"
                variant="secondary"
                onClick={() => setConfirming(false)}
              >
                {t('No, keep it')}
              </Button>
            </Box>
          </Box>
        ) : (
          <Button
            color="error"
            variant="secondary"
            onClick={() => setConfirming(true)}
          >
            {t('Erase only Nestor’s thread')}
          </Button>
        )}
        <Text $size="xs" $variation="secondary">
          {t(
            'Your conversation with the Assistant and your settings are kept. I will ask you to confirm.',
          )}
        </Text>
      </Box>
      <Text $size="xs" $variation="secondary">
        {t(
          'Always on, whatever the settings: simple words, and Nestor never makes anything up.',
        )}
      </Text>
      <Text $size="xs" $variation="secondary">
        {t('These settings stay on this computer.')}
      </Text>
    </Box>
  );
};
