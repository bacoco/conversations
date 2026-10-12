import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

import { useStandardAxisLabels } from '../coach/useAfterAnswer';
import { wordDiff } from '../coach/wordDiff';
import { NESTOR_AVATAR_URL } from '../components/PanelHome';
import { UserBubble, bubbleCss } from '../fill/GuidedThread';

import { VoiceAnswer } from './VoiceAnswer';
import type { NestorMessage } from './types';
import type { NestorChat } from './useNestorChat';

const warnCss = css`
  color: var(--c--contextuals--content--semantic--warning--primary);
  font-weight: 600;
`;
const pillCss = (ok: boolean) => css`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  background: ${ok ? 'var(--c--contextuals--background--semantic--success--tertiary)' : 'var(--c--contextuals--background--semantic--warning--tertiary)'};
`;
const AXIS_COLORS = ['#e3f2fd', '#e8f5e9', '#fff3e0', '#f3e5f5'];

export const NestorBubble = ({ children }: { children: ReactNode }) => (
  <Box $direction="row" $gap="8px" $align="flex-start">
    <Box
      as="img"
      src={NESTOR_AVATAR_URL}
      alt=""
      $css="width: 32px; height: 32px; border-radius: 50%; flex: none;"
    />
    <Box $css={bubbleCss(false)}>{children}</Box>
  </Box>
);

export const MessageView = ({
  message,
  chat,
}: {
  message: NestorMessage;
  chat: NestorChat;
}) => {
  const { t, i18n } = useTranslation();
  const list = (items: string[]) =>
    new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(items);
  const axisLabels = useStandardAxisLabels();
  const [voice, setVoice] = useState(false);
  const [moreSuites, setMoreSuites] = useState(false);

  switch (message.kind) {
    case 'request':
      return (
        <Text
          $size="xs"
          $variation="secondary"
          $textAlign="center"
          role="separator"
        >
          {t('Request {{n}} · {{time}}', {
            n: message.n,
            time: new Intl.DateTimeFormat(i18n.language, {
              hour: 'numeric',
              minute: '2-digit',
            }).format(message.at),
          })}
        </Text>
      );
    case 'user':
      return <UserBubble>{message.text}</UserBubble>;
    case 'hint':
      return (
        <NestorBubble>
          {message.hint === 'write-first' &&
            t(
              'First write your request in the middle, in the Assistant’s field.',
            )}
          {message.hint === 'review-after-answer' &&
            t(
              'The review will be possible after an answer from the Assistant.',
            )}
          {message.hint === 'new-request' &&
            t(
              'Write your new request in the middle. I suggest starting ideas as you type.',
            )}
        </NestorBubble>
      );
    case 'warning':
      return (
        <NestorBubble>
          <Text $css={warnCss}>
            {t(
              '⚠ Your text seems to hold personal data. Remove what the task does not need.',
            )}
          </Text>
        </NestorBubble>
      );
    case 'pistes':
      return (
        <NestorBubble>
          <Text>
            {t(
              'Starting ideas, close to yours. One click puts it in the Assistant’s field.',
            )}
          </Text>
          {message.phrases.map((phrase) => (
            <Button
              key={phrase}
              size="small"
              color="neutral"
              variant="secondary"
              onClick={() => chat.choosePiste(phrase, message.phrases)}
            >
              {phrase}
            </Button>
          ))}
        </NestorBubble>
      );
    case 'chosen':
      return (
        <Text $size="sm" $textAlign="center" $variation="secondary">
          {message.undone
            ? t('Choice cancelled: your text is back.')
            : t('✓ You chose: “{{text}}”. It is in the Assistant’s field.', {
                text: message.text,
              })}
        </Text>
      );
    case 'analysis':
      return (
        <NestorBubble>
          <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
            {message.check.present.map((item) => (
              <Box as="span" key={item} $css={pillCss(true)}>
                ✓ {item}
              </Box>
            ))}
            {message.check.missing.map((item) => (
              <Box as="span" key={item.short} $css={pillCss(false)}>
                ? {item.question}
              </Box>
            ))}
          </Box>
          <Text>{message.check.message}</Text>
          {message.check.missing.length > 0 && (
            <Text $weight="600">{t('Shall we complete them together?')}</Text>
          )}
        </NestorBubble>
      );
    case 'question': {
      const isCurrent = chat.questions.current?.id === message.id;
      const item = message.items[message.index];
      return (
        <NestorBubble>
          <Text $size="xs" $weight="700" $variation="secondary">
            {t('Question {{n}} of {{total}}', {
              n: message.index + 1,
              total: message.items.length,
            })}
          </Text>
          <Text $weight="700">{item.question}</Text>
          {isCurrent && !voice && (
            <>
              <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
                {item.choices.map((choice) => (
                  <Button
                    key={choice}
                    size="small"
                    color="neutral"
                    variant="secondary"
                    onClick={() => chat.answerQuestion(choice, 'choice')}
                  >
                    {choice}
                  </Button>
                ))}
                <Button
                  size="small"
                  color="neutral"
                  variant="secondary"
                  onClick={() => setVoice(true)}
                >
                  {t('Say it')}
                </Button>
                <Button
                  size="small"
                  color="neutral"
                  variant="tertiary"
                  onClick={() => chat.answerQuestion(t('I don’t know'), 'skip')}
                >
                  {t('I don’t know')}
                </Button>
              </Box>
              <Button
                size="small"
                color="neutral"
                variant="tertiary"
                onClick={() =>
                  chat.answerQuestion(
                    t('Stop the questions and write the version'),
                    'stop',
                  )
                }
              >
                {t('Stop the questions and write the version')}
              </Button>
            </>
          )}
          {isCurrent && voice && (
            <VoiceAnswer
              onSend={(text) => {
                setVoice(false);
                chat.answerQuestion(text, 'voice');
              }}
              onCancel={() => setVoice(false)}
            />
          )}
        </NestorBubble>
      );
    }
    case 'version': {
      const parts = wordDiff(message.original, message.version) ?? [
        { kind: 'added' as const, text: message.version },
      ];
      return (
        <NestorBubble>
          <Text>{t('Here is your request:')}</Text>
          <Box $direction="row" $gap="10px">
            <Text $size="xs" $css="color: #1d4ed8;">
              {t('You')}
            </Text>
            <Text $size="xs" $css="color: #15803d;">
              {t('Suggested by Nestor')}
            </Text>
          </Box>
          <Text $css="white-space: pre-wrap; padding: 8px 10px; border-radius: 8px; background: #fff;">
            {parts
              .filter((part) => part.kind !== 'removed')
              .map((part, index) => (
                <span
                  key={index}
                  style={{
                    color: part.kind === 'added' ? '#15803d' : '#1d4ed8',
                  }}
                >
                  {part.text}
                </span>
              ))}
          </Text>
          {message.missing.length > 0 && (
            <Text $css={warnCss}>
              {t('⚠ Missing {{items}}: I did not put them in.', {
                items: list(message.missing),
              })}
            </Text>
          )}
          <Button size="small" onClick={() => chat.placeVersion(message.id)}>
            {t('Put it in the Assistant’s field')}
          </Button>
        </NestorBubble>
      );
    }
    case 'placed':
      return (
        <Text $size="sm" $textAlign="center" $variation="secondary">
          {message.undone
            ? t('Your draft is back in the field.')
            : t(
                'Version prepared, put in the Assistant’s field instead of your draft. Your draft is kept.',
              )}
        </Text>
      );
    case 'advice': {
      const warn = message.missing.length > 0 || /\[/.test(message.note.issue);
      return (
        <NestorBubble>
          {message.note.issue && (
            <Text $css={warn ? warnCss : undefined}>
              {warn ? '⚠ ' : ''}
              {message.note.issue}
            </Text>
          )}
          {message.note.worked && <Text>✓ {message.note.worked}</Text>}
          {message.note.tryNow && (
            <Text>
              <strong>{t('To try:')}</strong> {message.note.tryNow}
            </Text>
          )}
          <details>
            <summary>{t('See the full advice')}</summary>
            {message.note.tryWhy && <Text>{message.note.tryWhy}</Text>}
            <Box $direction="row" $gap="6px">
              <Button
                size="small"
                color="neutral"
                variant="secondary"
                onClick={() => chat.askAbout(message.id, 'why')}
              >
                {t('Why?')}
              </Button>
              <Button
                size="small"
                color="neutral"
                variant="secondary"
                onClick={() => chat.askAbout(message.id, 'example')}
              >
                {t('See an example')}
              </Button>
            </Box>
          </details>
        </NestorBubble>
      );
    }
    case 'suites': {
      const all = message.groups.flatMap((group, groupIndex) =>
        group.questions.map((question) => ({
          question,
          color: AXIS_COLORS[groupIndex % AXIS_COLORS.length],
          label:
            group.kind === 'standard' ? axisLabels[group.axis] : group.label,
        })),
      );
      const shown = moreSuites ? all.slice(0, 6) : all.slice(0, 3);
      return (
        <NestorBubble>
          <Text $weight="700">{t('To go on')}</Text>
          {shown.map((item) => (
            <Box
              as="button"
              type="button"
              key={item.question}
              title={item.label}
              onClick={() => chat.usePrompt(item.question)}
              $css={css`
                text-align: left;
                padding: 8px 10px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font: inherit;
                background: ${item.color};
              `}
            >
              ↖ {item.question}
            </Box>
          ))}
          {!moreSuites && all.length > 3 && (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => setMoreSuites(true)}
            >
              {t('+ {{n}} more', { n: Math.min(3, all.length - 3) })}
            </Button>
          )}
        </NestorBubble>
      );
    }
    case 'review':
      return (
        <NestorBubble>
          <Text $weight="700">{t('Session review')}</Text>
          {message.review.summary && <Text>{message.review.summary}</Text>}
          {message.review.strengths[0] && (
            <Text>
              <strong>{t('What worked:')}</strong> {message.review.strengths[0]}
            </Text>
          )}
          {message.review.tips[0] && (
            <Text>
              <strong>{t('Next time:')}</strong> {message.review.tips[0]}
            </Text>
          )}
          {message.advised > 0 && (
            <Text $size="sm">
              {t(
                'Out of {{advised}} pieces of advice, you applied {{applied}}',
                { advised: message.advised, applied: message.applied },
              )}
            </Text>
          )}
        </NestorBubble>
      );
    case 'reply': {
      const prompt = message.prompt;
      return (
        <NestorBubble>
          <Text $css="white-space: pre-wrap;">{message.text}</Text>
          {prompt && (
            <Button size="small" onClick={() => chat.usePrompt(prompt)}>
              {t('Put it in the Assistant’s field')}
            </Button>
          )}
        </NestorBubble>
      );
    }
    case 'error':
      return (
        <NestorBubble>
          {t('I could not answer. Shall we try again?')}
        </NestorBubble>
      );
  }
};
