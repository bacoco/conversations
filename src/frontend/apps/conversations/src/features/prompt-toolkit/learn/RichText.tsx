import { Fragment, ReactNode } from 'react';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

/** `**bold**` spans inside a line. */
const inline = (line: string): ReactNode[] =>
  line
    .split(/(\*\*[^*]+\*\*)/)
    .map((chunk, index) =>
      chunk.startsWith('**') && chunk.endsWith('**') ? (
        <strong key={index}>{chunk.slice(2, -2)}</strong>
      ) : (
        <Fragment key={index}>{chunk}</Fragment>
      ),
    );

const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const BULLET = /^\s*[-•]\s+(.*)$/;

const badgeCss = css`
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--c--contextuals--content--semantic--brand--primary);
  background: var(--c--contextuals--background--semantic--brand--tertiary);
`;

/**
 * Course text: paragraphs separated by blank lines, numbered or bulleted
 * lines shown as lists, and **bold** spans. Nothing else is interpreted.
 */
export const RichText = ({ text }: { text: string }) => (
  <Box $gap="12px">
    {text.split(/\n{2,}/).map((block, blockIndex) => {
      const lines = block.split('\n');
      const isNumbered = lines.every((line) => NUMBERED.test(line));
      const isBulleted = lines.every((line) => BULLET.test(line));

      if (isNumbered || isBulleted) {
        return (
          <Box
            key={blockIndex}
            as={isNumbered ? 'ol' : 'ul'}
            $gap="8px"
            $css="margin: 0; padding: 0; list-style: none;"
          >
            {lines.map((line, index) => {
              const match = isNumbered
                ? line.match(NUMBERED)
                : line.match(BULLET);
              const content = isNumbered ? match?.[2] : match?.[1];
              return (
                <Box as="li" key={index} $direction="row" $gap="10px">
                  <Box $align="center" $justify="center" $css={badgeCss}>
                    {isNumbered ? match?.[1] : '•'}
                  </Box>
                  <Text $size="sm" $css="display: block; line-height: 1.5;">
                    {inline(content ?? line)}
                  </Text>
                </Box>
              );
            })}
          </Box>
        );
      }

      return (
        <Text
          key={blockIndex}
          as="p"
          $size="sm"
          $margin="0"
          $css="display: block; white-space: pre-line; line-height: 1.6;"
        >
          {inline(block)}
        </Text>
      );
    })}
  </Box>
);
