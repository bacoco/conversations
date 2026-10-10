import { Button } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { NestorTurn, chatWithNestor } from '../coach/coachApi';
import { NestorBubble, bubbleCss } from '../fill/PromptFillView';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { SavePromptButton } from '../library/SavePromptButton';
import {
  CoachMode,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';

import { NESTOR_AVATAR_URL } from './PanelHome';
import { PanelTextArea } from './PanelTextArea';

const promptCss = css`
  margin-left: 36px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--c--contextuals--border--semantic--brand--secondary);
`;

const promptTextCss = css`
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
`;

/** A prompt Nestor proposes, in the thread, with what to do with it. */
const ProposedPrompt = ({ prompt }: { prompt: string }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const offerPrompt = useOfferPrompt();
  return (
    <Box $gap="8px" $css={promptCss}>
      <Text $size="sm" $css={promptTextCss}>
        {prompt}
      </Text>
      <Box
        $direction="row"
        $gap="8px"
        $justify="flex-end"
        $css="flex-wrap: wrap;"
      >
        <SavePromptButton prompt={prompt} title={t('Prompt from Nestor')} />
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => {
            void navigator.clipboard.writeText(prompt);
            showToast('success', t('Copied to clipboard.'), undefined, 2000);
          }}
          icon={<Icon iconName="content_copy" $size="16px" />}
        >
          {t('Copy')}
        </Button>
        <Button
          size="small"
          onClick={() => offerPrompt(prompt, t('Prompt from Nestor'))}
          icon={<Icon iconName="north_west" $size="16px" />}
        >
          {t('Use')}
        </Button>
      </Box>
    </Box>
  );
};

const SCREEN_NAMES: Record<CoachMode, string> = {
  manual: 'the Coach, Analysis mode',
  assist: 'the Coach, Prompt help mode',
  instant: 'the Coach, As you type mode',
  session: 'the Coach, Session review',
};

/** Where the user is, in words Nestor understands. */
const useCurrentScreen = () => {
  const state = usePromptToolkitStore();
  if (state.fill) {
    return `Nestor's guided questions to complete the prompt "${state.fill.title}"`;
  }
  if (!state.hasSeenWelcome) {
    return "the panel's welcome page, presenting Nestor";
  }
  if (state.showHome) {
    return 'the home page with the cards: Coach, Course, Everyday tools';
  }
  if (state.mode === 'coach') {
    return SCREEN_NAMES[state.coachMode];
  }
  return state.mode === 'learn' ? 'the prompting Course' : 'the Everyday tools';
};

const threadCss = css`
  overflow-y: auto;
  padding: 12px 16px 4px;
`;

/**
 * Nestor, always at the bottom of the panel: explains the screen the user is
 * on, what the panel can do, and helps write any prompt.
 */
export const NestorDock = ({ language }: { language: string }) => {
  const { t } = useTranslation();
  const where = useCurrentScreen();
  const turns = usePromptToolkitStore((state) => state.nestorChat);
  const setTurns = usePromptToolkitStore((state) => state.setNestorChat);
  const [draft, setDraft] = useState('');
  // Folded by default: a small animated button invites the user to ask.
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const send = async (text: string, history = turns) => {
    const message = text.trim();
    if (!message || isLoading) {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const next: NestorTurn[] = [...history, { role: 'user', text: message }];
    setTurns(next);
    setDraft('');
    setIsOpen(true);
    setHasError(false);
    setIsLoading(true);
    try {
      const answer = await chatWithNestor(
        next,
        language,
        where,
        controller.signal,
      );
      setTurns([...next, answer]);
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'end' });
  }, [turns, isLoading, isOpen]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  // Moving to another screen folds the conversation; it can be reopened.
  const shownScreenRef = useRef(where);
  useEffect(() => {
    if (shownScreenRef.current !== where) {
      shownScreenRef.current = where;
      setIsOpen(false);
    }
  }, [where]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const restart = () => {
    controllerRef.current?.abort();
    setIsLoading(false);
    setHasError(false);
    setTurns([]);
    setIsOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  };

  const lastUser = [...turns].reverse().find((turn) => turn.role === 'user');

  // Folded: a small round Nestor button, level with the panel's action bar.
  if (!isOpen) {
    return (
      <Box
        as="button"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('Ask Nestor')}
        title={t('Ask Nestor')}
        $css={css`
          position: absolute;
          right: 16px;
          bottom: 16px;
          z-index: 3;
          width: 52px;
          height: 52px;
          padding: 0;
          border-radius: 50%;
          cursor: pointer;
          overflow: hidden;
          pointer-events: auto;
          border: 2px solid
            var(--c--contextuals--border--semantic--brand--primary);
          background: var(--c--contextuals--background--surface--primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          /* A gentle pulse, so Nestor gets noticed without getting in the way. */
          animation: nestor-pulse 2.4s ease-in-out infinite;
          @keyframes nestor-pulse {
            0%,
            70%,
            100% {
              transform: scale(1);
              box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.15),
                0 0 0 0 rgba(0, 0, 145, 0.35);
            }
            35% {
              transform: scale(1.08);
              box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.15),
                0 0 0 10px rgba(0, 0, 145, 0);
            }
          }
          &:hover {
            animation-play-state: paused;
          }
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
          &:focus-visible {
            outline: 2px solid
              var(--c--contextuals--border--semantic--brand--primary);
            outline-offset: 2px;
          }
        `}
      >
        <img
          src={NESTOR_AVATAR_URL}
          alt=""
          width={48}
          height={48}
          style={{ display: 'block' }}
        />
      </Box>
    );
  }

  // Open: a sheet rising from the bottom of the panel.
  return (
    <Box
      role="dialog"
      aria-label={t('Ask Nestor')}
      $css={css`
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 3;
        max-height: 70%;
        pointer-events: auto;
        border-top: 1px solid var(--c--contextuals--border--surface--primary);
        border-radius: 16px 16px 0 0;
        background: var(--c--contextuals--background--surface--primary);
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
      `}
    >
      <Box
        $direction="row"
        $align="center"
        $gap="8px"
        $css="flex: none; padding: 10px 8px 6px 16px;"
      >
        <img
          src={NESTOR_AVATAR_URL}
          alt=""
          width={28}
          height={28}
          style={{ borderRadius: '50%' }}
        />
        <Text $weight="700" $css="flex: 1;">
          Nestor
        </Text>
        {turns.length > 0 && (
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={restart}
            aria-label={t('New conversation with Nestor')}
            title={t('New conversation with Nestor')}
            icon={<Icon iconName="delete" $size="18px" />}
          />
        )}
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => setIsOpen(false)}
          aria-label={t('Hide the conversation with Nestor')}
          title={t('Hide the conversation with Nestor')}
          icon={<Icon iconName="expand_more" $size="20px" />}
        />
      </Box>
      <Box
        as="ol"
        $gap="12px"
        aria-live="polite"
        $css={css`
          flex: 1;
          min-height: 0;
          margin: 0;
          list-style: none;
          ${threadCss}
        `}
      >
        {turns.length === 0 && (
          <li>
            <NestorBubble>
              {t(
                'Ask me what this screen is for, what the panel can do, or help to write a prompt.',
              )}
            </NestorBubble>
          </li>
        )}
        {turns.map((turn, index) => (
          <Box as="li" key={index} $gap="8px">
            {turn.role === 'user' ? (
              <Box $direction="row" $justify="flex-end">
                <Box $css={bubbleCss(true)}>{turn.text}</Box>
              </Box>
            ) : (
              <>
                {turn.text && <NestorBubble>{turn.text}</NestorBubble>}
                {turn.prompt && <ProposedPrompt prompt={turn.prompt} />}
              </>
            )}
          </Box>
        ))}
        {isLoading && (
          <li>
            <NestorBubble>{t('Nestor is thinking…')}</NestorBubble>
          </li>
        )}
        {hasError && (
          <Box as="li" $direction="row" $align="center" $gap="8px">
            <Text $size="sm" $theme="danger">
              {t('Nestor did not answer. Try again.')}
            </Text>
            {lastUser && (
              <Button
                size="small"
                color="neutral"
                variant="secondary"
                onClick={() => void send(lastUser.text, turns.slice(0, -1))}
              >
                {t('Retry')}
              </Button>
            )}
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>
      <Box
        $direction="row"
        $align="flex-end"
        $gap="8px"
        $css="flex: none; padding: 8px 16px 16px;"
      >
        <Box $css="flex: 1; min-width: 0;">
          <PanelTextArea
            label={t('Your message to Nestor')}
            value={draft}
            onChange={setDraft}
            onKeyDown={onKeyDown}
            placeholder={t('Your message… (Enter to send)')}
            minRows={1}
            inputRef={inputRef}
          />
        </Box>
        <Button
          size="small"
          disabled={isLoading || !draft.trim()}
          onClick={() => void send(draft)}
          aria-label={t('Send')}
          icon={<Icon iconName="send" $size="16px" />}
        />
      </Box>
    </Box>
  );
};
