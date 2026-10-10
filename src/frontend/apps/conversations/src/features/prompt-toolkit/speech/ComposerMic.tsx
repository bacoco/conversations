import { useEffect } from 'react';

import { useAiAvailability } from '../coach/aiAvailability';
import { PROMPT_TOOLKIT_ENABLED } from '../coach/coachApi';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { MicButton } from './MicButton';
import { appendText } from './transcribe';

/** The microphone of the chat message field, next to the send button. */
export const ComposerMic = () => {
  const checkAi = useAiAvailability((state) => state.check);
  const setChatInput = usePromptToolkitStore((state) => state.setChatInput);

  // The panel may never have been opened: ask the relay here too.
  useEffect(() => {
    if (PROMPT_TOOLKIT_ENABLED) void checkAi();
  }, [checkAi]);

  if (!PROMPT_TOOLKIT_ENABLED || !setChatInput) {
    return null;
  }

  return (
    <MicButton
      size={32}
      onText={(text) => {
        const { chatInput, setChatInput: setInput } =
          usePromptToolkitStore.getState();
        setInput?.(appendText(chatInput, text));
      }}
    />
  );
};
