import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Text, useToast } from '@/components';

import { describeStyle } from '../coach/coachApi';
import { languageName } from '../coach/language';
import { DetailPage } from '../components/DetailPage';
import { NESTOR_WRITE_URL } from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';
import { useMyStyleStore } from '../stores/useMyStyleStore';

/**
 * "My writing style": Nestor reads two or three texts the user wrote and
 * describes their style; the description is kept in this browser and can be
 * added to any suggested prompt.
 */
export const MyStyleView = ({ onBack }: { onBack: () => void }) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const saved = useMyStyleStore((state) => state.style);
  const setStyle = useMyStyleStore((state) => state.setStyle);
  const [texts, setTexts] = useState('');
  const [draft, setDraft] = useState(saved);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const analyse = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setHasError(false);
    try {
      setDraft(
        await describeStyle(
          texts,
          languageName(i18n.language),
          controller.signal,
        ),
      );
    } catch {
      if (!controller.signal.aborted) {
        setHasError(true);
      }
    } finally {
      if (controllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  return (
    <DetailPage
      onBack={onBack}
      backLabel={t('Back to the tools')}
      title={t('My writing style')}
      subtitle={t(
        'Paste two or three texts you wrote: Nestor describes your style.',
      )}
      image={NESTOR_WRITE_URL}
    >
      <Box $gap="8px">
        <PanelTextArea
          label={t('Your texts')}
          value={texts}
          onChange={setTexts}
          placeholder={t(
            'Paste here two or three emails or letters you wrote, without personal data.',
          )}
          minRows={6}
        />
        <Button
          fullWidth
          disabled={isLoading || texts.trim().length < 80}
          onClick={() => void analyse()}
          icon={
            isLoading ? (
              <Loader size="small" />
            ) : (
              <Icon iconName="draw" $size="18px" />
            )
          }
        >
          {t('Describe my style')}
        </Button>
        {hasError && (
          <Text $size="sm" role="alert">
            {t('Nestor could not describe your style. Please retry.')}
          </Text>
        )}
      </Box>
      {draft && (
        <Box $gap="8px">
          <Text $size="sm" $weight="700">
            {t('Your style, as Nestor sees it (you can change it)')}
          </Text>
          <PanelTextArea
            label={t('Your style')}
            value={draft}
            onChange={setDraft}
            minRows={4}
          />
          <Box $direction="row" $gap="8px" $justify="flex-end">
            {saved && (
              <Button
                size="small"
                color="neutral"
                variant="tertiary"
                onClick={() => {
                  setStyle('');
                  setDraft('');
                }}
                icon={<Icon iconName="delete" $size="16px" />}
              >
                {t('Delete')}
              </Button>
            )}
            <Button
              size="small"
              disabled={!draft.trim() || draft.trim() === saved}
              onClick={() => {
                setStyle(draft);
                showToast(
                  'success',
                  t('Style saved: add it to a suggested version in the Coach.'),
                  undefined,
                  4000,
                );
              }}
              icon={<Icon iconName="check" $size="16px" />}
            >
              {t('Save my style')}
            </Button>
          </Box>
          <Text $size="xs" $variation="secondary">
            {t('Kept in this browser only.')}
          </Text>
        </Box>
      )}
    </DetailPage>
  );
};
