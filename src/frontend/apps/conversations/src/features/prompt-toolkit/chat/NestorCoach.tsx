import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components';

import { languageName } from '../coach/language';
import { isAutoOn, useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { useTrainerStore } from '../stores/useTrainerStore';

import { AskNestorSheet } from './AskNestorSheet';
import { EraseThreadBar } from './EraseThreadBar';
import { NestorBar } from './NestorBar';
import { NestorSettings } from './NestorSettings';
import { NestorThread } from './NestorThread';
import { TrainerView } from './TrainerView';
import { ActionButton } from './ui';
import { useCloseMatches } from './useCloseMatches';
import { useNestorAuto } from './useNestorAuto';
import { useNestorChat } from './useNestorChat';
import { usePistes } from './usePistes';
import { useTrainer } from './useTrainer';

/** The coach: one chat with Nestor, a fixed bar, settings behind the gear. */
export const NestorCoach = ({ isActive = true }: { isActive?: boolean }) => {
  const { t, i18n } = useTranslation();
  const language = languageName(i18n.language);
  const chat = useNestorChat(language);
  const trainer = useTrainer(language);
  const training = !!trainer.item && !trainer.paused;
  useNestorAuto(chat, language);
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const showSettings = usePromptToolkitStore(
    (state) => state.showNestorSettings,
  );
  const setShowSettings = usePromptToolkitStore(
    (state) => state.setShowNestorSettings,
  );
  const pistesOn = useCoachPrefsStore((state) => isAutoOn(state, 'autoPistes'));
  // Once Nestor has answered, his ideas go: they come back when the text
  // changes. One thing at a time, never under an analysis or a question.
  const [answeredOn, setAnsweredOn] = useState<string | null>(null);
  const messageCount = chat.messages.length;
  const lastMessage = chat.messages.at(-1);
  useEffect(() => {
    if (messageCount === 0) return;
    // A text Nestor just put in the field is no draft to start from: no
    // ideas for it (they would show the same requests again).
    const placed = chat.messages.findLast(
      (message) => message.kind === 'chosen' || message.kind === 'version',
    );
    setAnsweredOn(
      lastMessage?.kind === 'chosen' ||
        lastMessage?.kind === 'hint' ||
        lastMessage?.kind === 'placed'
        ? placed?.kind === 'chosen'
          ? placed.text
          : placed?.kind === 'version'
            ? placed.version
            : usePromptToolkitStore.getState().chatInput
        : usePromptToolkitStore.getState().chatInput,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);
  const livePistes =
    isActive && pistesOn && !chat.questions.current && chatInput !== answeredOn;
  const { phrases, isSearching } = usePistes(chatInput, livePistes);
  // At the same pace: a case to practise and a model, when really close.
  const close = useCloseMatches(chatInput, livePistes, trainer.item?.id);

  if (showSettings) {
    return <NestorSettings onClose={() => setShowSettings(false)} />;
  }
  return (
    <Box
      $direction="column"
      $css="flex: 1; min-height: 0; position: relative; background: #ffffff;"
    >
      <EraseThreadBar />
      {training ? (
        <TrainerView trainer={trainer} onSay={() => chat.setSheetOpen(true)} />
      ) : (
        <>
          {/* A case put on hold while the coach was used: one click back. */}
          {trainer.item && (
            <Box $align="center" $css="padding: 8px 12px 0; flex: none;">
              <ActionButton
                type="button"
                $primary
                onClick={() => useTrainerStore.getState().resume()}
              >
                {t('Resume the case: {{title}}', { title: trainer.item.title })}
              </ActionButton>
            </Box>
          )}
          <NestorThread
            chat={chat}
            pistes={phrases}
            close={close}
            thinking={isSearching}
          />
        </>
      )}
      {isActive && <NestorBar chat={chat} />}
      <AskNestorSheet chat={chat} />
    </Box>
  );
};
