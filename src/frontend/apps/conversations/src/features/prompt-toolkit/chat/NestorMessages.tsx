import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components';

import { StarRequest } from './StarRequest';
import { VoiceAnswer } from './VoiceAnswer';
import { markParts } from './markParts';
import { pastedText } from './nestorChatApi';
import { shortText } from './shortText';
import type { GridPart, NestorMessage } from './types';
import {
  ActionButton,
  Added,
  Caption,
  Chip,
  Choice,
  ChoiceCard,
  Choices,
  CounselLine,
  Event,
  ExampleBox,
  ExampleLine,
  Grid,
  GridRow,
  Keys,
  Lesson,
  LinkButton,
  MainButton,
  NestorBubble,
  PartKeys,
  PartLabel,
  PartMark,
  Proposed,
  QuestionNumber,
  Separator,
  Small,
  StarRow,
  Suite,
  UnderBubble,
  UserSays,
  VersionBox,
  Warn,
  Why,
} from './ui';
import type { NestorChat } from './useNestorChat';
import { versionParts } from './versionParts';

export { NestorBubble };

/** The good request of an example, cut here until asked in full. */
const AFTER_SHORT = 160;

/** The five lines of a request, as the user reads them. */
const GRID_LABELS: Record<GridPart, string> = {
  task: 'What to write',
  reader: 'Who will read it',
  material: 'The information to use',
  form: 'The form',
  tone: 'The tone',
};

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
  const [voice, setVoice] = useState(false);
  const [moreSuites, setMoreSuites] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [wholeAfter, setWholeAfter] = useState(false);
  const [openChoice, setOpenChoice] = useState<number | null>(null);

  switch (message.kind) {
    case 'request':
      return (
        <Separator>
          {t('Request {{n}} · {{time}}', {
            n: message.n,
            time: new Intl.DateTimeFormat(i18n.language, {
              hour: 'numeric',
              minute: '2-digit',
            }).format(message.at),
          })}
        </Separator>
      );
    case 'user':
      return (
        <>
          <UserSays typed={message.via === 'voice'}>
            {message.via === 'voice' && (
              <Icon iconName="mic" $size="14px" $withThemeInherited />
            )}{' '}
            {message.text}
          </UserSays>
          {message.via === 'voice' && <Caption>{t('Said aloud')}</Caption>}
        </>
      );
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
          {message.hint === 'fix-myself' &&
            t(
              'Correct your text in the Assistant’s field, in the middle. Then click “Analyser mon texte”, or call me.',
            )}
          {message.hint === 'improve-it' &&
            t(
              'Now improve it yourself: click “Analyser mon texte”, at the bottom. I show you what it does not say yet.',
            )}
        </NestorBubble>
      );
    case 'examples': {
      // One example at a time; « Un autre exemple » shows the next one.
      const pair = message.pairs[exampleIndex % message.pairs.length];
      return (
        <NestorBubble>
          <span>
            {t(
              'A request of your job: first as many write it, then a good one.',
            )}
          </span>
          {pair && (
            <ExampleBox key={pair.caseId}>
              <strong>{pair.title}</strong>
              <ExampleLine>
                <span>{t('Before')}</span>« {pair.before} »
              </ExampleLine>
              <ExampleLine $good>
                <span>{t('After')}</span>«{' '}
                {wholeAfter || pair.after.length <= AFTER_SHORT
                  ? pair.after
                  : `${pair.after.slice(0, AFTER_SHORT).trimEnd()}…`}{' '}
                »
                {!wholeAfter && pair.after.length > AFTER_SHORT && (
                  <LinkButton type="button" onClick={() => setWholeAfter(true)}>
                    {t('Read the whole request')}
                  </LinkButton>
                )}
              </ExampleLine>
              <Lesson>
                <strong>{t('The rule to keep:')}</strong>
                <span>{pair.rule}</span>
              </Lesson>
              <Choices>
                <Choice type="button" onClick={() => chat.tryExample(pair)}>
                  {t('I practise improving it')}
                </Choice>
                {message.pairs.length > 1 && (
                  <Choice
                    type="button"
                    $tone="dunno"
                    onClick={() => {
                      setExampleIndex((index) => index + 1);
                      setWholeAfter(false);
                    }}
                  >
                    {t('Another example')}
                  </Choice>
                )}
              </Choices>
            </ExampleBox>
          )}
        </NestorBubble>
      );
    }
    case 'warning':
      return (
        <NestorBubble>
          <Warn>
            {t(
              '⚠ Your text seems to hold personal data. Remove what the task does not need.',
            )}
          </Warn>
        </NestorBubble>
      );
    case 'pistes':
      return (
        <>
          <NestorBubble>
            {message.examples
              ? t(
                  'A few everyday requests. One click puts it in the Assistant’s field.',
                )
              : t(
                  'Starting ideas, close to yours. One click puts it in the Assistant’s field.',
                )}
          </NestorBubble>
          <UnderBubble>
            {message.phrases.map((phrase) => (
              <StarRow key={phrase}>
                <Chip
                  type="button"
                  onClick={() => chat.choosePiste(phrase, message.phrases)}
                >
                  <Icon
                    iconName="north_west"
                    $size="16px"
                    $withThemeInherited
                  />
                  {phrase}
                </Chip>
                <StarRequest text={phrase} />
              </StarRow>
            ))}
          </UnderBubble>
        </>
      );
    case 'chosen':
      return (
        <Event>
          {message.undone
            ? t('Choice cancelled: your text is back.')
            : t('✓ You chose: “{{text}}”. It is in the Assistant’s field.', {
                text: shortText(message.text),
              })}
        </Event>
      );
    case 'analysis':
      return (
        <NestorBubble>
          {/* The same five lines every time: what a request says. */}
          <Grid aria-label={t('What your request says')}>
            {message.check.grid.map((line) => (
              <GridRow key={line.part} $ok={!!line.words}>
                <span aria-hidden="true">{line.words ? '✓' : '○'}</span>
                <PartLabel $part={line.part}>
                  {t(GRID_LABELS[line.part])}
                </PartLabel>
                <span>{line.words ? `« ${line.words} »` : t('not said')}</span>
              </GridRow>
            ))}
          </Grid>
          <span>{message.check.message}</span>
          {message.check.missing.length > 0 && (
            <strong>{t('Shall we complete them together?')}</strong>
          )}
        </NestorBubble>
      );
    case 'counsel':
      return (
        <NestorBubble>
          <strong>{t('My advice on your request')}</strong>
          {message.advice.good.map((good) => (
            <CounselLine key={good} $tone="ok">
              <span aria-hidden="true">✓</span>
              <span>{good}</span>
            </CounselLine>
          ))}
          {message.advice.tips.map((tip) => (
            <CounselLine key={tip.text} $tone="go">
              <span aria-hidden="true">→</span>
              <span>
                <span>{tip.text}</span> {tip.why && <Why>{tip.why}</Why>}
              </span>
            </CounselLine>
          ))}
        </NestorBubble>
      );
    case 'versions': {
      // Only the latest versions go into the field: never older ones.
      const latest =
        chat.messages.findLast((item) => item.kind === 'versions')?.id ===
        message.id;
      return (
        <NestorBubble>
          <span>
            {message.items.length > 1
              ? t(
                  'Here are two versions, with my advice applied. Take the one that suits you.',
                )
              : t('Here is your request, with my advice applied.')}
          </span>
          {message.items.map((item, index) => {
            // The request in full; the pasted texts (an email, a note) fold.
            const pasted = pastedText(message.draft);
            const folds = !!pasted && item.text.endsWith(pasted);
            const request = folds
              ? item.text.slice(0, item.text.length - pasted.length).trim()
              : item.text;
            const open = openChoice === index;
            return (
              <ChoiceCard key={index} aria-label={item.title || undefined}>
                {item.title && <strong>{item.title}</strong>}
                <p>{request}</p>
                {folds && (
                  <LinkButton
                    type="button"
                    onClick={() => setOpenChoice(open ? null : index)}
                  >
                    {open
                      ? t('Hide the texts you pasted')
                      : t('Show the texts you pasted')}
                  </LinkButton>
                )}
                {folds && open && <p>{pasted}</p>}
                {latest && (
                  <StarRow>
                    <ActionButton
                      type="button"
                      $primary={index === 0}
                      onClick={() => chat.placeChoice(message.id, index)}
                    >
                      {t('Put it in the Assistant’s field')}
                    </ActionButton>
                    <StarRequest text={item.text} />
                  </StarRow>
                )}
              </ChoiceCard>
            );
          })}
        </NestorBubble>
      );
    }
    case 'question': {
      const isCurrent = chat.questions.current?.id === message.id;
      const item = message.items[message.index];
      return (
        <NestorBubble>
          <QuestionNumber>
            {t('Question {{n}} of {{total}}', {
              n: message.index + 1,
              total: message.items.length,
            })}
          </QuestionNumber>
          <span>{item.question}</span>
          {isCurrent && !voice && (
            <>
              <Choices>
                {(item.yesno ? [t('Yes'), t('No')] : item.choices).map(
                  (choice) => (
                    <Choice
                      key={choice}
                      type="button"
                      onClick={() => chat.answerQuestion(choice, 'choice')}
                    >
                      {choice}
                    </Choice>
                  ),
                )}
                <Choice
                  type="button"
                  $tone="voice"
                  onClick={() => setVoice(true)}
                >
                  <Icon iconName="mic" $size="16px" $withThemeInherited />
                  {t('Say it')}
                </Choice>
                <Choice
                  type="button"
                  $tone="dunno"
                  onClick={() => chat.answerQuestion(t('I don’t know'), 'skip')}
                >
                  {t('I don’t know')}
                </Choice>
              </Choices>
              <LinkButton
                type="button"
                onClick={() =>
                  chat.answerQuestion(
                    t('Stop the questions and write the version'),
                    'stop',
                  )
                }
              >
                {t('Stop the questions and write the version')}
              </LinkButton>
            </>
          )}
          {isCurrent && voice && (
            <VoiceAnswer
              onSend={(text, via) => {
                setVoice(false);
                chat.answerQuestion(text, via);
              }}
              onCancel={() => setVoice(false)}
            />
          )}
        </NestorBubble>
      );
    }
    case 'version': {
      const parts = versionParts(message.original, message.version);
      const added = parts.some((part) => part.kind === 'added');
      return (
        <NestorBubble>
          <span>{t('Here is your request:')}</span>
          <VersionBox>
            {parts.map((part, index) => {
              // Each line of the grid wears its colour, as in the analysis.
              const pieces = markParts(part.text, message.parts ?? []).map(
                (piece, at) =>
                  piece.part ? (
                    <PartMark key={at} $part={piece.part}>
                      {piece.text}
                    </PartMark>
                  ) : (
                    piece.text
                  ),
              );
              return part.kind === 'added' ? (
                <Added key={index}>{pieces}</Added>
              ) : (
                <span key={index}>{pieces}</span>
              );
            })}
          </VersionBox>
          {message.parts?.some((line) => line.words) && (
            <PartKeys aria-label={t('The five lines, in colour')}>
              {message.parts
                .filter((line) => line.words)
                .map((line) => (
                  <PartMark key={line.part} $part={line.part}>
                    {t(GRID_LABELS[line.part])}
                  </PartMark>
                ))}
            </PartKeys>
          )}
          {message.rule && (
            <Small>
              {t(
                'Draft: it applies a rule. Have it checked before sending the answer.',
              )}
            </Small>
          )}
          {added && (
            <Keys>
              <Added>{t('Suggested by Nestor')}</Added>
            </Keys>
          )}
          {/* The point of Nestor: the user learns to write it themselves. */}
          {message.lesson && (
            <Lesson>
              <strong>{t('Next time, write it yourself:')}</strong>
              <span>{message.lesson}</span>
            </Lesson>
          )}
          {message.missing.length > 0 && (
            <Warn>
              {t('⚠ To add when you know it: {{items}}.', {
                items: list(message.missing),
              })}
            </Warn>
          )}
          {/* Only the latest version goes into the field: never an older one. */}
          {chat.messages.findLast((item) => item.kind === 'version')?.id ===
            message.id && (
            <StarRow>
              <MainButton
                type="button"
                onClick={() => chat.placeVersion(message.id)}
              >
                {t('Put it in the Assistant’s field')}
              </MainButton>
              <StarRequest text={message.version} />
            </StarRow>
          )}
        </NestorBubble>
      );
    }
    case 'placed':
      return (
        <Event>
          {message.undone
            ? t('Your draft is back in the field.')
            : t(
                'Version prepared, put in the Assistant’s field instead of your draft. Your draft is kept.',
              )}
        </Event>
      );
    case 'advice': {
      // A blank to fill ([Votre nom]) is a calm reminder; only what the
      // user did not know yet is a real lack.
      const warn = message.missing.length > 0;
      return (
        <NestorBubble>
          {message.note.issue &&
            (warn ? (
              <Warn>⚠ {message.note.issue}</Warn>
            ) : (
              <span>{message.note.issue}</span>
            ))}
          {message.note.worked && <span>✓ {message.note.worked}</span>}
          {message.note.tryNow && (
            <span>
              <strong>{t('To try:')}</strong> {message.note.tryNow}
            </span>
          )}
          <details>
            <summary
              style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              {t('See the full advice')}
            </summary>
            <UnderBubble style={{ paddingLeft: 0, paddingTop: 6 }}>
              {message.note.tryWhy && <span>{message.note.tryWhy}</span>}
              <Choices>
                <Choice
                  type="button"
                  onClick={() => chat.askAbout(message.id, 'why')}
                >
                  {t('Why?')}
                </Choice>
                <Choice
                  type="button"
                  onClick={() => chat.askAbout(message.id, 'example')}
                >
                  {t('See an example')}
                </Choice>
              </Choices>
            </UnderBubble>
          </details>
        </NestorBubble>
      );
    }
    case 'suites': {
      const all = message.groups.flatMap((group, tone) =>
        group.questions.map((question) => ({ question, tone })),
      );
      const shown = moreSuites ? all.slice(0, 6) : all.slice(0, 3);
      return (
        <>
          <Small>{t('To go on')}</Small>
          <UnderBubble>
            {shown.map((item) => (
              <Suite
                key={item.question}
                type="button"
                $tone={item.tone}
                onClick={() => chat.usePrompt(item.question)}
              >
                ↖ {item.question}
              </Suite>
            ))}
            {!moreSuites && all.length > 3 && (
              <LinkButton type="button" onClick={() => setMoreSuites(true)}>
                {t('+ {{n}} more', { n: Math.min(3, all.length - 3) })}
              </LinkButton>
            )}
          </UnderBubble>
        </>
      );
    }
    case 'review':
      return (
        <NestorBubble>
          <strong>{t('Session review')}</strong>
          {message.review.summary && <span>{message.review.summary}</span>}
          {message.review.strengths[0] && (
            <span>
              <strong>{t('What worked:')}</strong> {message.review.strengths[0]}
            </span>
          )}
          {message.review.tips[0] && (
            <span>
              <strong>{t('Next time:')}</strong> {message.review.tips[0]}
            </span>
          )}
          {message.advised > 0 && (
            <span>
              {message.advised === 1
                ? t('Out of 1 piece of advice, you applied {{applied}}', {
                    applied: message.applied,
                  })
                : t(
                    'Out of {{advised}} pieces of advice, you applied {{applied}}',
                    { advised: message.advised, applied: message.applied },
                  )}
            </span>
          )}
        </NestorBubble>
      );
    case 'reply': {
      const prompt = message.prompt;
      return (
        <NestorBubble>
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.text}</span>
          {prompt && <Proposed>{prompt}</Proposed>}
          {prompt && (
            <MainButton type="button" onClick={() => chat.usePrompt(prompt)}>
              {t('Put it in the Assistant’s field')}
            </MainButton>
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
