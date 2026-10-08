import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Text } from '@/components';

import {
  CoachFeedback as Feedback,
  sendCoachFeedback,
} from '../coach/feedback';

/** "Was this useful?" with thumbs, like the feedback on chat answers. */
export const CoachFeedback = ({
  target,
  score,
}: Pick<Feedback, 'target' | 'score'>) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<Feedback['rating'] | null>(null);

  const rate = (value: Feedback['rating']) => {
    setRating(value);
    sendCoachFeedback({ target, rating: value, score });
  };

  return (
    <Box $direction="row" $align="center" $gap="4px">
      <Text $size="xs" $variation="secondary">
        {rating ? t('Thanks for your feedback!') : t('Was this useful?')}
      </Text>
      <Button
        size="nano"
        variant="tertiary"
        color={rating === 'positive' ? 'brand' : 'neutral'}
        aria-pressed={rating === 'positive'}
        aria-label={t('Useful')}
        onClick={() => rate('positive')}
        icon={
          <Icon
            iconName="thumb_up"
            variant={rating === 'positive' ? 'filled' : 'outlined'}
            $size="16px"
            $withThemeInherited
          />
        }
      />
      <Button
        size="nano"
        variant="tertiary"
        color={rating === 'negative' ? 'brand' : 'neutral'}
        aria-pressed={rating === 'negative'}
        aria-label={t('Not useful')}
        onClick={() => rate('negative')}
        icon={
          <Icon
            iconName="thumb_down"
            variant={rating === 'negative' ? 'filled' : 'outlined'}
            $size="16px"
            $withThemeInherited
          />
        }
      />
    </Box>
  );
};
