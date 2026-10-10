import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import {
  GuidedThread,
  NestorBubble,
  SuggestionPills,
  UserBubble,
} from '../fill/GuidedThread';
import { useGuidedFill } from '../fill/useGuidedFill';
import { useReward } from '../rewards/useReward';

import { FinalRequest } from './CoachParts';
import { CoachStatus } from './CoachStatus';
import { NESTOR_ANALYSIS_URL, NESTOR_AVATAR_URL } from './PanelHome';
import { PanelTextArea } from './PanelTextArea';

const stepBadgeCss = css`
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--c--contextuals--content--semantic--brand--on-brand);
  background: var(--c--contextuals--background--semantic--brand--primary);
`;

/** Nestor introduces the coach and says what to do, while nothing is written. */
export const CoachWelcome = ({
  onHelpWrite,
  onExample,
}: {
  onHelpWrite: () => void;
  onExample: () => void;
}) => {
  const { t } = useTranslation();
  const steps = [
    t('Write your request in the message field, at the bottom of the chat.'),
    t('Click “Read my request”: I tell you what works and what is missing.'),
    t('After the Assistant’s answer, I help you correct it if needed.'),
  ];

  return (
    <Box
      $align="center"
      $gap="20px"
      $css={css`
        flex: 1;
        justify-content: center;
        padding: 32px 24px;
      `}
    >
      <Box
        $css={css`
          width: min(240px, 65%);
          aspect-ratio: 1;
          border-radius: 50%;
          overflow: hidden;
          background: #f7f8fd;
        `}
      >
        <img
          src={NESTOR_ANALYSIS_URL}
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
      <Box $align="center" $gap="6px" $css="max-width: 360px;">
        <Text as="h2" $size="lg" $weight="700" $margin="0" $textAlign="center">
          {t('The coach')}
        </Text>
        <Text $size="sm" $variation="secondary" $textAlign="center">
          {t('A clear request gets a better answer. Here is how I help you:')}
        </Text>
      </Box>
      <Box
        as="ol"
        $gap="14px"
        $css="margin: 0; padding: 0; list-style: none; max-width: 360px; width: 100%;"
      >
        {steps.map((step, index) => (
          <Box as="li" key={step} $direction="row" $align="center" $gap="12px">
            <Box $align="center" $justify="center" $css={stepBadgeCss}>
              {index + 1}
            </Box>
            <Text $size="sm">{step}</Text>
          </Box>
        ))}
      </Box>
      <Box
        $direction="row"
        $gap="8px"
        $justify="center"
        $css="flex-wrap: wrap;"
      >
        <Button
          color="brand"
          variant="secondary"
          onClick={onHelpWrite}
          icon={<Icon iconName="edit" $size="18px" />}
        >
          {t('Help me write my request')}
        </Button>
        <Button
          color="neutral"
          variant="tertiary"
          onClick={onExample}
          icon={<Icon iconName="menu_book" $size="18px" />}
        >
          {t('Start from an example')}
        </Button>
      </Box>
    </Box>
  );
};

/**
 * "Help me write my request": what the user wants to get, then Nestor's
 * questions with ready answers, then a complete request.
 */
export const CoachWrite = ({
  language,
  onPlace,
  onCancel,
}: {
  language: string;
  onPlace: (text: string) => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation();
  const reward = useReward();
  const [choice, setChoice] = useState<string | null>(null);
  const [isOther, setIsOther] = useState(false);
  const [other, setOther] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const fill = useGuidedFill({
    template: seed ?? '',
    language,
    mode: 'draft',
    enabled: seed !== null,
  });
  const kinds = [
    { label: t('An email'), seed: t('Write an email.') },
    { label: t('A summary'), seed: t('Summarise a text.') },
    {
      label: t('A reply to a member of the public'),
      seed: t('Write a reply to a member of the public.'),
    },
  ];
  const somethingElse = t('Something else');

  const pick = (label: string) => {
    setChoice(label);
    const kind = kinds.find((item) => item.label === label);
    if (kind) {
      setSeed(kind.seed);
    } else {
      setIsOther(true);
    }
  };

  return (
    <Box $direction="column" $css="flex: 1 0 auto;">
      <CoachStatus
        isLoading={fill.status === 'loading' || fill.isAdjusting}
        loadingLabel={
          fill.isAdjusting
            ? t('Nestor is changing the prompt…')
            : t('Nestor is preparing the next step…')
        }
      />
      <Box $gap="14px" $padding={{ all: 'base' }}>
        <Box $direction="row" $align="center" $gap="10px">
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={onCancel}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          >
            {t('Back to the coach')}
          </Button>
        </Box>
        <Box $direction="row" $align="center" $gap="10px">
          <img
            src={NESTOR_AVATAR_URL}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: '50%' }}
          />
          <Text as="h2" $size="md" $weight="700" $margin="0">
            {t('Help me write my request')}
          </Text>
        </Box>
        <NestorBubble>
          {t('With pleasure. What do you want to get?')}
        </NestorBubble>
        {choice === null ? (
          <SuggestionPills
            suggestions={[...kinds.map((kind) => kind.label), somethingElse]}
            onPick={pick}
          />
        ) : (
          <UserBubble>{choice}</UserBubble>
        )}
        {isOther && seed === null && (
          <Box $gap="8px" $css="padding-left: 36px;">
            <PanelTextArea
              label={t('What you want to get')}
              value={other}
              onChange={setOther}
              placeholder={t(
                'In a few words: for example, a note to my team about the new opening hours',
              )}
              minRows={2}
            />
            <Box $direction="row">
              <Button
                size="small"
                disabled={!other.trim()}
                onClick={() => setSeed(other.trim())}
              >
                {t('Continue')}
              </Button>
            </Box>
          </Box>
        )}
        {seed !== null && (
          <>
            {isOther && <UserBubble>{seed}</UserBubble>}
            <GuidedThread fill={fill} />
            <FinalRequest
              fill={fill}
              onPlace={(text) => {
                reward('fill');
                onPlace(text);
              }}
              saveTitle={choice ?? t('Your request')}
            />
          </>
        )}
      </Box>
    </Box>
  );
};
