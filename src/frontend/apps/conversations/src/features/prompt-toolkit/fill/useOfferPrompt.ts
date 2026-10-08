import { hasPlaceholders } from '../coach/coachApi';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

/**
 * Hands a prompt to the user: straight to the message field when it is
 * complete, through Robin's guided questions when something is missing.
 */
export const useOfferPrompt = () => {
  const placePrompt = usePlacePrompt();
  const startFill = usePromptToolkitStore((state) => state.startFill);

  return (prompt: string, title: string) => {
    if (hasPlaceholders(prompt)) {
      startFill(prompt, title);
    } else {
      placePrompt(prompt);
    }
  };
};
