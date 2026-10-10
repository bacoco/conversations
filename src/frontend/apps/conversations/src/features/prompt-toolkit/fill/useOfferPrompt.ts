import { useAiAvailable } from '../coach/aiAvailability';
import { hasPlaceholders } from '../coach/coachApi';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

/**
 * Hands a prompt to the user: straight to the message field when it is
 * complete, through Nestor's guided questions when something is missing.
 */
export const useOfferPrompt = () => {
  const placePrompt = usePlacePrompt();
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const isAiAvailable = useAiAvailable();

  return (prompt: string, title: string) => {
    // Without Nestor, the brackets are completed by hand in the message field.
    if (isAiAvailable && hasPlaceholders(prompt)) {
      startFill(prompt, title);
    } else {
      placePrompt(prompt);
    }
  };
};
