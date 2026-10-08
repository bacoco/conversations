import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

import type { DiffPart } from '../coach/wordDiff';

/** Added words highlighted, removed words struck through. */
export const DiffView = ({ parts }: { parts: DiffPart[] }) => {
  const { t } = useTranslation();
  return (
    <Box $gap="6px">
      <Text
        $size="sm"
        $css={css`
          display: block;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.6;
          padding: 10px 12px;
          border-radius: 6px;
          background: var(--c--contextuals--background--surface--primary);
          & ins {
            text-decoration: none;
            border-radius: 3px;
            background: var(
              --c--contextuals--background--semantic--success--tertiary
            );
            color: var(--c--contextuals--content--semantic--success--primary);
          }
          & del {
            color: var(--c--contextuals--content--semantic--neutral--tertiary);
          }
        `}
      >
        {parts.map((part, index) =>
          part.kind === 'added' ? (
            <ins key={index}>
              <span className="sr-only">{t('added:')} </span>
              {part.text}
            </ins>
          ) : part.kind === 'removed' ? (
            <del key={index}>
              <span className="sr-only">{t('removed:')} </span>
              {part.text}
            </del>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </Text>
      <Box $direction="row" $gap="12px">
        <Text $size="xs" $variation="secondary">
          <ins
            style={{
              textDecoration: 'none',
              background:
                'var(--c--contextuals--background--semantic--success--tertiary)',
            }}
          >
            {t('Added')}
          </ins>
        </Text>
        <Text $size="xs" $variation="secondary">
          <del>{t('Removed')}</del>
        </Text>
      </Box>
    </Box>
  );
};
