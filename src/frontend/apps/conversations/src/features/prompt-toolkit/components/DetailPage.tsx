import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode } from 'react';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

const ILLUSTRATION_BACKGROUND = '#f7f8fd';

/**
 * A detail screen of the panel (a challenge, a quiz, a tool…): the header
 * stays at the top, the content sits in the middle of the space left, in a
 * comfortable column instead of being stuck to the top.
 */
export const DetailPage = ({
  onBack,
  backLabel,
  eyebrow,
  title,
  subtitle,
  image,
  status,
  children,
}: {
  onBack: () => void;
  backLabel: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Robin's illustration for this kind of screen. */
  image?: string;
  /** A loading bar or banner, right under the header. */
  status?: ReactNode;
  children: ReactNode;
}) => (
  <Box $css="min-height: 100%;">
    <Box
      $direction="row"
      $align="center"
      $gap="12px"
      $css="padding: 16px 16px 8px;"
    >
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={onBack}
        aria-label={backLabel}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      />
      <Box $css="flex: 1; min-width: 0;">
        {eyebrow && (
          <Text $size="xs" $variation="secondary">
            {eyebrow}
          </Text>
        )}
        <Text as="h2" $size="md" $weight="700" $margin="0">
          {title}
        </Text>
        {subtitle && (
          <Text $size="xs" $variation="secondary">
            {subtitle}
          </Text>
        )}
      </Box>
    </Box>
    {status}
    <Box
      $gap="20px"
      $css={css`
        flex: 1;
        justify-content: center;
        width: 100%;
        max-width: 520px;
        margin-inline: auto;
        padding: 16px 20px 96px;
      `}
    >
      {image && (
        <img
          src={image}
          alt=""
          width={140}
          height={140}
          style={{
            alignSelf: 'center',
            borderRadius: '50%',
            background: ILLUSTRATION_BACKGROUND,
          }}
        />
      )}
      {children}
    </Box>
  </Box>
);
