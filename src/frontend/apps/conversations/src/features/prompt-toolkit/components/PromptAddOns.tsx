import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Text } from '@/components';

import { useMyStyleStore } from '../stores/useMyStyleStore';

/** Adds a sentence at the end of the prompt, or takes it out again. */
const toggleSentence = (prompt: string, sentence: string) =>
  prompt.includes(sentence)
    ? prompt
        .split(`\n\n${sentence}`)
        .join('')
        .split(sentence)
        .join('')
        .trimEnd()
    : `${prompt.trimEnd()}\n\n${sentence}`;

/**
 * Ready-made additions to a suggested prompt: questions first, a cautious
 * version, the reading level of the answer, and the user's own style.
 * Each one is a plain sentence the user can read in the prompt.
 */
export const PromptAddOns = ({
  prompt,
  onChange,
}: {
  prompt: string;
  onChange: (prompt: string) => void;
}) => {
  const { t } = useTranslation();
  const myStyle = useMyStyleStore((state) => state.style);
  const additions = [
    {
      id: 'questions',
      icon: 'help',
      label: t('Questions first'),
      sentence: t(
        'Before answering, ask me the questions you need to do this well, then wait for my answers.',
      ),
    },
    {
      id: 'cautious',
      icon: 'verified_user',
      label: t('Make it cautious'),
      sentence: t(
        'If information is missing or you are not sure, say so instead of guessing. Rely only on the documents provided and quote the passage you use.',
      ),
    },
    ...(myStyle
      ? [
          {
            id: 'style',
            icon: 'draw',
            label: t('My writing style'),
            sentence: `${t('Write in this style:')} ${myStyle}`,
          },
        ]
      : []),
  ];
  // One reading level at a time: choosing one replaces the other.
  const levels = [
    {
      id: 'expert',
      label: t('Expert'),
      sentence: t(
        'Readers: specialists of the subject; technical vocabulary is fine.',
      ),
    },
    {
      id: 'public',
      label: t('General public'),
      sentence: t(
        'Readers: the general public; short sentences, everyday words, no jargon, acronyms spelled out.',
      ),
    },
    {
      id: 'simple',
      label: t('Very simple'),
      sentence: t(
        'Readers: people who find reading hard; one idea per sentence, very short sentences, simple words, difficult words explained (simplified French, close to "easy to read").',
      ),
    },
  ];
  const chooseLevel = (sentence: string) => {
    const others = levels
      .map((level) => level.sentence)
      .filter((other) => other !== sentence);
    const cleared = others.reduce(
      (result, other) =>
        result.includes(other) ? toggleSentence(result, other) : result,
      prompt,
    );
    onChange(toggleSentence(cleared, sentence));
  };

  return (
    <Box $gap="8px">
      <Box $direction="row" $align="center" $gap="6px" $css="flex-wrap: wrap;">
        <Text $size="xs" $weight="600">
          {t('Add:')}
        </Text>
        {additions.map((addition) => {
          const isOn = prompt.includes(addition.sentence);
          return (
            <Button
              key={addition.id}
              size="small"
              color={isOn ? 'brand' : 'neutral'}
              variant={isOn ? 'secondary' : 'tertiary'}
              aria-pressed={isOn}
              onClick={() =>
                onChange(toggleSentence(prompt, addition.sentence))
              }
              icon={
                <Icon iconName={isOn ? 'check' : addition.icon} $size="16px" />
              }
            >
              {addition.label}
            </Button>
          );
        })}
      </Box>
      <Box
        $direction="row"
        $align="center"
        $gap="6px"
        $css="flex-wrap: wrap;"
        role="group"
        aria-label={t('Reading level of the answer')}
      >
        <Text $size="xs" $weight="600">
          {t('Reading level:')}
        </Text>
        {levels.map((level) => {
          const isOn = prompt.includes(level.sentence);
          return (
            <Button
              key={level.id}
              size="small"
              color={isOn ? 'brand' : 'neutral'}
              variant={isOn ? 'secondary' : 'tertiary'}
              aria-pressed={isOn}
              onClick={() => chooseLevel(level.sentence)}
            >
              {level.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};
