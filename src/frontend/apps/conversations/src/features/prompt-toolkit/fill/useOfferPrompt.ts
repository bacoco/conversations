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

  /** `replaceDraft`: the prompt is a version of the draft, not a new one. */
  return (
    prompt: string,
    title: string,
    options: { replaceDraft?: boolean } = {},
  ) => {
    const draft = usePromptToolkitStore.getState().chatInput.trim();
    // Without Nestor, the brackets are completed by hand in the message field.
    if (isAiAvailable && hasPlaceholders(prompt)) {
      startFill(
        prompt,
        title,
        undefined,
        undefined,
        options.replaceDraft && draft ? draft : undefined,
      );
    } else {
      placePrompt(prompt, { replaceDraft: options.replaceDraft });
    }
  };
};
