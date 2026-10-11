import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import {
  ConversationContextTurn,
  NestorTurn,
  chatWithConversationCoach,
  checkAnswerFacts,
  coachConversationTurn,
  followUpPrompt,
  placeholdersOf,
  suggestNextQuestions,
} from '../coach/coachApi';
import {
  NestorBubble,
  SuggestionPills,
  UserBubble,
} from '../fill/GuidedThread';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

import { AnswerFinisher } from './AnswerFinisher';
import {
  CoachLink,
  ReadyBox,
  RetainTip,
  actionsCss,
  coachTextCss,
} from './CoachParts';
import { PanelTextArea } from './PanelTextArea';

/** The latest request and answer, for what Nestor writes about them. */
const lastText = (
  turns: ConversationContextTurn[],
  role: ConversationContextTurn['role'],
) => [...turns].reverse().find((turn) => turn.role === role)?.text ?? '';

/** Enter sends; Shift+Enter and an input method composing do not. */
/** What the answer leaves to fill in: brackets, "TO COMPLETE". */
export const answerGaps = (text: string) => {
  const brackets = [...new Set(placeholdersOf(text))];
  const marks = (text.match(/À COMPLÉTER|TO COMPLETE/g) ?? []).length;
  return { brackets, marks };
};

/**
 * Before using the answer: whether it is ready to be sent, and, on demand,
 * Nestor's workshop to make it ready (facts to take out, parts to fill).
 */
const AnswerCheck = ({
  request,
  answer,
  language,
}: {
  request: string;
  answer: string;
  language: string;
}) => {
  const { t } = useTranslation();
  const isAiAvailable = useAiAvailable();
  const { brackets, marks } = answerGaps(answer);
  const [claims, setClaims] = useState<string[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // Straight to the workshop when the answer comes from a tool's request,
  // even if the coach was already showing this answer.
  const finishNextAnswer = usePromptToolkitStore(
    (state) => state.finishNextAnswer,
  );
  useEffect(() => {
    if (finishNextAnswer) {
      usePromptToolkitStore.getState().setFinishNextAnswer(false);
      setIsOpen(true);
    }
  }, [finishNextAnswer]);
  useEffect(() => {
    if (!isAiAvailable || !answer.trim()) {
      return;
    }
    const controller = new AbortController();
    setIsChecking(true);
    checkAnswerFacts(request, answer, language, controller.signal)
      .then(setClaims)
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsChecking(false);
        }
      });
    return () => controller.abort();
  }, [request, answer, language, isAiAvailable]);

  const toCheck = claims ?? [];
  const toComplete = brackets.length + marks;
  if (toComplete === 0 && toCheck.length === 0) {
    return isChecking ? (
      <Text $size="xs" $variation="secondary" role="status">
        {t('Nestor checks the answer against your request…')}
      </Text>
    ) : null;
  }
  // The workshop takes over: it says itself what is left to settle, once
  // the facts are checked.
  if (isOpen) {
    return isChecking ? (
      <Text $size="sm" $variation="secondary" role="status">
        {t('Nestor checks the answer against your request…')}
      </Text>
    ) : (
      <AnswerFinisher answer={answer} claims={toCheck} />
    );
  }
  return (
    <Box
      role="note"
      $direction="row"
      $gap="8px"
      $css={css`
        padding: 10px 12px;
        border-radius: 10px;
        background: var(
          --c--contextuals--background--semantic--warning--tertiary
        );
      `}
    >
      <Icon iconName="fact_check" $size="20px" $theme="warning" />
      <Box $gap="4px" $css="flex: 1; min-width: 0;">
        <Text $size="sm" $weight="700">
          {t('This answer is not ready to be sent yet')}
        </Text>
        <Text $size="sm">
          {[
            toComplete > 0
              ? t('{{count}} parts to complete', { count: toComplete })
              : '',
            toCheck.length > 0
              ? t('{{count}} facts your request did not give', {
                  count: toCheck.length,
                })
              : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {isChecking && (
          <Text $size="xs" $variation="secondary" role="status">
            {t('Nestor checks the answer against your request…')}
          </Text>
        )}
        <Box $direction="row">
          <Button
            size="small"
            disabled={isChecking}
            onClick={() => setIsOpen(true)}
            icon={<Icon iconName="task_alt" $size="16px" />}
          >
            {t('Make it ready with Nestor')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const isSendKey = (event: KeyboardEvent) =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

const fieldCss = css`
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  font: inherit;
  font-size: 0.875rem;
  color: inherit;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  &:focus {
    outline: none;
    border-color: var(--c--contextuals--border--semantic--brand--primary);
  }
`;

/** One short field under Nestor's question, with its button. */
const AskField = ({
  label,
  placeholder,
  onSubmit,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  // The field appears after a click: it is ready to type in.
  useEffect(() => inputRef.current?.focus(), []);
  const submit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
    }
  };
  return (
    <Box $gap="8px" $css="padding-left: 36px;">
      <Box
        as="input"
        type="text"
        ref={inputRef}
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(event: { target: { value: string } }) =>
          setValue(event.target.value)
        }
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (isSendKey(event)) {
            event.preventDefault();
            submit();
          }
        }}
        $css={fieldCss}
      />
      <Box $direction="row">
        <Button
          size="small"
          disabled={disabled || !value.trim()}
          onClick={submit}
        >
          {t('Continue')}
        </Button>
      </Box>
    </Box>
  );
};

type Issue =
  | 'yes'
  | 'long'
  | 'hard'
  | 'tone'
  | 'format'
  | 'missing'
  | 'unwanted'
  | 'unsure';

/**
 * A correction ready to send: it can be cancelled, edited, or sent to the
 * Assistant at once, never sent without a click.
 */
const CorrectionBox = ({
  text,
  why,
  onCancel,
  onSent,
}: {
  text: string;
  why?: string;
  onCancel: () => void;
  onSent: () => void;
}) => {
  const { t } = useTranslation();
  const sendQuestion = useMainConversationStore((state) => state.sendQuestion);
  const placePrompt = usePlacePrompt();
  const [value, setValue] = useState(text);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <ReadyBox icon="edit_note" title={t('Correction ready')} tone="brand">
      {why && (
        <Text $size="xs" $variation="secondary">
          {why}
        </Text>
      )}
      {isEditing ? (
        <PanelTextArea
          label={t('Your correction')}
          value={value}
          onChange={setValue}
          minRows={3}
        />
      ) : (
        <Text $size="sm" $css={coachTextCss}>
          {value}
        </Text>
      )}
      <Box $direction="row" $gap="8px" $css={actionsCss}>
        <Button
          size="small"
          color="neutral"
          variant="secondary"
          onClick={onCancel}
        >
          {t('Cancel')}
        </Button>
        {!isEditing && (
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={() => setIsEditing(true)}
            icon={<Icon iconName="edit" $size="16px" />}
          >
            {t('Edit')}
          </Button>
        )}
        {sendQuestion ? (
          <Button
            size="small"
            disabled={!value.trim()}
            onClick={() => {
              sendQuestion(value.trim());
              onSent();
            }}
            icon={<Icon iconName="send" $size="16px" />}
          >
            {t('Send to the Assistant')}
          </Button>
        ) : (
          <Button
            size="small"
            disabled={!value.trim()}
            onClick={() => placePrompt(value.trim())}
            icon={<Icon iconName="north_west" $size="16px" />}
          >
            {t('Put in the message field')}
          </Button>
        )}
      </Box>
      {sendQuestion && (
        <Text $size="xs" $variation="secondary">
          {t('“Send” posts it to the conversation right away.')}
        </Text>
      )}
    </ReadyBox>
  );
};

/** Two questions to carry on; a click sends one to the Assistant. */
const NextSteps = ({
  turns,
  language,
}: {
  turns: ConversationContextTurn[];
  language: string;
}) => {
  const { t } = useTranslation();
  const sendQuestion = useMainConversationStore((state) => state.sendQuestion);
  const placePrompt = usePlacePrompt();
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    try {
      setQuestions(
        await suggestNextQuestions(turns, language, controller.signal),
      );
      setStatus('idle');
    } catch {
      if (!controller.signal.aborted) {
        setStatus('error');
      }
    }
  };

  if (questions === null) {
    return (
      <Box $gap="6px" $align="flex-start">
        <CoachLink
          icon="arrow_forward"
          disabled={status === 'loading'}
          onClick={() => void run()}
        >
          {t('Suggest a next step')}
        </CoachLink>
        {status === 'loading' && (
          <Box $direction="row" $align="center" $gap="8px" role="status">
            <Loader size="small" />
            <Text $size="sm">{t('Nestor is preparing next questions…')}</Text>
          </Box>
        )}
        {status === 'error' && (
          <Box role="alert" $direction="row" $align="center" $gap="8px">
            <Text $size="sm">
              {t('Nestor could not prepare next questions.')}
            </Text>
            <Button size="small" color="neutral" onClick={() => void run()}>
              {t('Retry')}
            </Button>
          </Box>
        )}
      </Box>
    );
  }
  return (
    <Box $gap="8px">
      <NestorBubble>
        {sendQuestion
          ? t('Two questions to carry on. A click sends it to the Assistant.')
          : t(
              'Two questions to carry on. A click puts it in the message field.',
            )}
      </NestorBubble>
      <Box $gap="8px" $css="padding-left: 36px;">
        {questions.map((question) => (
          <Box
            key={question}
            as="button"
            type="button"
            onClick={() =>
              sendQuestion ? sendQuestion(question) : placePrompt(question)
            }
            $direction="row"
            $align="center"
            $gap="8px"
            $css={css`
              width: 100%;
              padding: 10px 12px;
              cursor: pointer;
              font: inherit;
              font-size: 0.875rem;
              text-align: left;
              border-radius: 8px;
              color: var(--c--contextuals--content--semantic--brand--primary);
              border: 1px solid
                var(--c--contextuals--border--semantic--brand--secondary);
              background: var(
                --c--contextuals--background--semantic--brand--tertiary
              );
              &:hover {
                background: var(
                  --c--contextuals--background--semantic--brand--secondary
                );
              }
              &:focus-visible {
                outline: 2px solid
                  var(--c--contextuals--border--semantic--brand--primary);
                outline-offset: 2px;
              }
            `}
          >
            <Icon
              iconName={sendQuestion ? 'send' : 'north_west'}
              $size="18px"
              $withThemeInherited
            />
            <Box as="span" $css="flex: 1; min-width: 0;">
              {question}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Nestor's view on the exchange, on request, then a few words with him about
 * it. It stays in the panel: the conversation in the centre is untouched.
 */
const ExchangeView = ({
  turns,
  language,
}: {
  turns: ConversationContextTurn[];
  language: string;
}) => {
  const { t } = useTranslation();
  const [thread, setThread] = useState<NestorTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const controllerRef = useRef<AbortController | null>(null);
  /** What to ask again after an error. */
  const retryRef = useRef<() => void>(() => undefined);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = (
    call: (signal: AbortSignal) => Promise<NestorTurn>,
    before: NestorTurn[],
  ) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    retryRef.current = () => run(call, before);
    setStatus('loading');
    call(controller.signal)
      .then((answer) => {
        setThread([...before, answer]);
        setStatus('idle');
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus('error');
        }
      });
  };

  const askView = () =>
    run((signal) => coachConversationTurn(turns, language, signal), []);

  const send = () => {
    const text = draft.trim();
    if (!text || status === 'loading') {
      return;
    }
    const next: NestorTurn[] = [...thread, { role: 'user', text }];
    setThread(next);
    setDraft('');
    run(
      (signal) => chatWithConversationCoach(next, turns, language, signal),
      next,
    );
  };

  if (thread.length === 0 && status !== 'loading' && status !== 'error') {
    return (
      <Box $align="flex-start">
        <CoachLink icon="forum" onClick={askView}>
          {t('Nestor’s view on this exchange')}
        </CoachLink>
      </Box>
    );
  }
  return (
    <Box $gap="10px">
      {thread.map((turn, index) =>
        turn.role === 'user' ? (
          <UserBubble key={index}>{turn.text}</UserBubble>
        ) : (
          <NestorBubble key={index}>{turn.text}</NestorBubble>
        ),
      )}
      {status === 'loading' && (
        <Box $direction="row" $align="center" $gap="8px" role="status">
          <Loader size="small" />
          <Text $size="sm">{t('Nestor is reading the exchange…')}</Text>
        </Box>
      )}
      {status === 'error' && (
        <Box role="alert" $direction="row" $align="center" $gap="8px">
          <Text $size="sm">{t('Nestor did not answer. Try again.')}</Text>
          <Button
            size="small"
            color="neutral"
            onClick={() => retryRef.current()}
          >
            {t('Retry')}
          </Button>
        </Box>
      )}
      {thread.length > 0 && (
        <Box
          $direction="row"
          $align="flex-end"
          $gap="8px"
          $css="padding-left: 36px;"
        >
          <Box $css="flex: 1; min-width: 0;">
            <PanelTextArea
              label={t('A question for Nestor about this exchange')}
              value={draft}
              onChange={setDraft}
              onKeyDown={(event) => {
                if (isSendKey(event)) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={t('A question about this exchange? (Enter to send)')}
              minRows={1}
            />
          </Box>
          <Button
            size="small"
            disabled={status === 'loading' || !draft.trim()}
            onClick={send}
            aria-label={t('Send')}
            icon={<Icon iconName="send" $size="16px" />}
          />
        </Box>
      )}
    </Box>
  );
};

/**
 * The coach after an answer of the Assistant: "Does it suit you?", with
 * ready answers that prepare a targeted correction, then what comes next.
 */
export const CoachAnswer = ({
  turns,
  language,
  showCorrectionTip,
  onTipShown,
  onCorrectionSent,
}: {
  turns: ConversationContextTurn[];
  language: string;
  /** The answer follows a correction the user sent from here. */
  showCorrectionTip: boolean;
  onTipShown: () => void;
  onCorrectionSent: () => void;
}) => {
  const { t } = useTranslation();
  const [issue, setIssue] = useState<{ value: Issue; label: string } | null>(
    null,
  );
  const [correction, setCorrection] = useState<{
    text: string;
    why?: string;
    label?: string;
  } | null>(null);
  const [isSent, setIsSent] = useState(false);
  // "Redo my request": back in the message field, read again by the coach.
  const placePrompt = usePlacePrompt();
  const [followUp, setFollowUp] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  );
  const controllerRef = useRef<AbortController | null>(null);
  // Decided once: the tip belongs to this answer only.
  const [hasCorrectionTip] = useState(showCorrectionTip);
  useEffect(() => {
    if (hasCorrectionTip) {
      onTipShown();
    }
    // Only once, for this answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const issues: { value: Issue; label: string }[] = [
    { value: 'yes', label: t('Yes') },
    { value: 'long', label: t('Too long') },
    { value: 'hard', label: t('Hard to understand') },
    { value: 'tone', label: t('The tone does not suit') },
    { value: 'format', label: t('Not the right format') },
    { value: 'missing', label: t('Something is missing') },
    { value: 'unwanted', label: t('Not what I wanted') },
    { value: 'unsure', label: t('I am not sure it is accurate') },
  ];
  const tones = [
    {
      label: t('Simpler'),
      text: t(
        'Keep all the information, but rewrite it with short sentences and everyday words, as for a colleague.',
      ),
    },
    {
      label: t('Warmer'),
      text: t(
        'Keep all the information, but use a warmer, more direct tone, without administrative phrases.',
      ),
    },
    {
      label: t('More formal'),
      text: t('Keep all the information, but use a formal and neutral tone.'),
    },
  ];
  const formats = [
    {
      label: t('A list'),
      text: t('Keep the same content, but present it as a bulleted list.'),
    },
    {
      label: t('A table'),
      text: t('Keep the same content, but present it as a table.'),
    },
    {
      label: t('A flowing text'),
      text: t(
        'Keep the same content, but write it as a flowing text, in paragraphs.',
      ),
    },
    {
      label: t('An email'),
      text: t('Keep the same content, but write it as an email ready to send.'),
    },
  ];
  const sourcesRequest = t(
    'For each point of your answer, say whether it comes from what I provided or whether you added it. Point out what I should check.',
  );

  const pick = (value: Issue, label: string) => {
    setIssue({ value, label });
    setCorrection(
      value === 'long'
        ? {
            text: t(
              'Keep the same information, but in half the text: short sentences, one idea per line.',
            ),
          }
        : value === 'hard'
          ? {
              text: t(
                'Rewrite the same answer in everyday words, without jargon, and explain technical terms in one sentence.',
              ),
            }
          : value === 'unsure'
            ? { text: sourcesRequest }
            : null,
    );
  };

  // "Not what I wanted": Nestor rewrites the request from what was expected.
  const writeFollowUp = async (expected: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setFollowUp('loading');
    try {
      const result = await followUpPrompt(
        lastText(turns, 'user'),
        lastText(turns, 'assistant'),
        expected,
        language,
        controller.signal,
      );
      setCorrection({ text: result.prompt, why: result.why, label: expected });
      setFollowUp('idle');
    } catch {
      if (!controller.signal.aborted) {
        setFollowUp('error');
      }
    }
  };

  const reset = () => {
    controllerRef.current?.abort();
    setIssue(null);
    setCorrection(null);
    setFollowUp('idle');
  };

  const sent = () => {
    setIsSent(true);
    onCorrectionSent();
  };

  return (
    <Box $gap="14px" $padding={{ all: 'base' }}>
      {hasCorrectionTip && (
        <RetainTip tipKey="answer-correction">
          {t(
            'Asking for a targeted correction is often faster than starting over.',
          )}
        </RetainTip>
      )}
      <AnswerCheck
        request={lastText(turns, 'user')}
        answer={lastText(turns, 'assistant')}
        language={language}
      />
      <Box $gap="10px" aria-live="polite">
        <NestorBubble>
          {t('The Assistant has answered. Does it suit you?')}
        </NestorBubble>
        {!issue && (
          <SuggestionPills
            suggestions={issues.map((item) => item.label)}
            onPick={(label) => {
              const item = issues.find((entry) => entry.label === label);
              if (item) {
                pick(item.value, item.label);
              }
            }}
          />
        )}
        {issue && <UserBubble>{issue.label}</UserBubble>}

        {issue?.value === 'yes' && (
          <NestorBubble>
            {t('Perfect. Carry on in the conversation whenever you want.')}
          </NestorBubble>
        )}

        {issue?.value === 'tone' && !correction && (
          <>
            <NestorBubble>{t('Which tone would you like?')}</NestorBubble>
            <SuggestionPills
              suggestions={tones.map((tone) => tone.label)}
              onPick={(label) =>
                setCorrection({
                  label,
                  text: tones.find((tone) => tone.label === label)?.text ?? '',
                })
              }
            />
          </>
        )}

        {issue?.value === 'format' && !correction && (
          <>
            <NestorBubble>{t('In what form?')}</NestorBubble>
            <SuggestionPills
              suggestions={formats.map((format) => format.label)}
              onPick={(label) =>
                setCorrection({
                  label,
                  text:
                    formats.find((format) => format.label === label)?.text ??
                    '',
                })
              }
            />
          </>
        )}

        {issue?.value === 'missing' && !correction && (
          <>
            <NestorBubble>{t('What is missing?')}</NestorBubble>
            <AskField
              label={t('What is missing')}
              placeholder={t('For example: the list of attendees')}
              onSubmit={(what) =>
                setCorrection({
                  label: what,
                  text: t(
                    'Add this to your answer: {{what}}. Keep the rest as it is.',
                    {
                      what,
                    },
                  ),
                })
              }
            />
          </>
        )}

        {issue?.value === 'unwanted' && !correction && (
          <>
            <NestorBubble>{t('What did you expect?')}</NestorBubble>
            <AskField
              label={t('What you expected')}
              placeholder={t(
                'For example: a reply to send, not an explanation',
              )}
              disabled={followUp === 'loading'}
              onSubmit={(expected) => void writeFollowUp(expected)}
            />
            {followUp === 'loading' && (
              <Box $direction="row" $align="center" $gap="8px" role="status">
                <Loader size="small" />
                <Text $size="sm">
                  {t('Nestor is reading the last answer…')}
                </Text>
              </Box>
            )}
            {followUp === 'error' && (
              <Text $size="sm" role="alert">
                {t('Nestor could not write a follow-up. Please retry.')}
              </Text>
            )}
          </>
        )}

        {issue?.value === 'unsure' && (
          <>
            <NestorBubble>
              {t(
                'I do not check the substance, but here is what to check yourself: dates, names and figures, and anything that was not in your request. You can also ask the Assistant where each piece of information comes from.',
              )}
            </NestorBubble>
            <RetainTip tipKey="answer-check">
              {t(
                'A clear request does not guarantee an accurate answer: always check what matters.',
              )}
            </RetainTip>
          </>
        )}

        {correction?.label && <UserBubble>{correction.label}</UserBubble>}

        {correction && !isSent && (
          <CorrectionBox
            key={correction.text}
            text={correction.text}
            why={correction.why}
            onCancel={reset}
            onSent={sent}
          />
        )}
        {isSent && (
          <NestorBubble>
            {t('Sent. I will be here when the answer arrives.')}
          </NestorBubble>
        )}
        {issue && issue.value !== 'yes' && !isSent && (
          <Box $direction="row" $css="padding-left: 36px;">
            <CoachLink
              icon="replay"
              onClick={() => placePrompt(lastText(turns, 'user'))}
            >
              {t('Or redo my request, with the coach')}
            </CoachLink>
          </Box>
        )}
      </Box>

      <Box
        $gap="12px"
        $css={css`
          padding-top: 12px;
          border-top: 1px solid var(--c--contextuals--border--surface--primary);
        `}
      >
        <NextSteps turns={turns} language={language} />
        <ExchangeView turns={turns} language={language} />
      </Box>
    </Box>
  );
};
