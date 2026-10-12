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
  // Ideas while typing, not during the questions: one thing at a time.
  const { phrases } = usePistes(
    chatInput,
    isActive && pistesOn && !chat.questions.current,
  );

  if (showSettings) {
    return <NestorSettings onClose={() => setShowSettings(false)} />;
  }
  return (
    <Box $direction="column" $css="flex: 1 0 auto; position: relative;">
      <NestorThread chat={chat} pistes={phrases} />
      {isActive && <NestorBar chat={chat} />}
      <AskNestorSheet chat={chat} />
    </Box>
  );
};
