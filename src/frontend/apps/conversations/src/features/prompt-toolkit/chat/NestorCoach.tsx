import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components';

import { languageName } from '../coach/language';
import { isAutoOn, useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { AskNestorSheet } from './AskNestorSheet';
import { NestorBar } from './NestorBar';
import { NestorSettings } from './NestorSettings';
import { NestorThread } from './NestorThread';
import { useNestorAuto } from './useNestorAuto';
import { useNestorChat } from './useNestorChat';
import { usePistes } from './usePistes';

/** The coach: one chat with Nestor, a fixed bar, settings behind the gear. */
export const NestorCoach = ({ isActive = true }: { isActive?: boolean }) => {
  const { i18n } = useTranslation();
  const language = languageName(i18n.language);
  const chat = useNestorChat(language);
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
  useEffect(() => {
    if (messageCount > 0) {
      setAnsweredOn(usePromptToolkitStore.getState().chatInput);
    }
  }, [messageCount]);
  const { phrases } = usePistes(
    chatInput,
    isActive && pistesOn && !chat.questions.current && chatInput !== answeredOn,
  );

  if (showSettings) {
    return <NestorSettings onClose={() => setShowSettings(false)} />;
  }
  return (
    <Box
      $direction="column"
      $css="flex: 1; min-height: 0; position: relative; background: #ffffff;"
    >
      <NestorThread chat={chat} pistes={phrases} />
      {isActive && <NestorBar chat={chat} />}
      <AskNestorSheet chat={chat} />
    </Box>
  );
};
