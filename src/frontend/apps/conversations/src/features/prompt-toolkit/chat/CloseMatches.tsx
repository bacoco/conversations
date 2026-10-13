import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { hasPlaceholders } from '../coach/coachApi';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { startTraining } from '../stores/useTrainerStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

import type { CloseMatchesFound } from './closeMatches';
import { LinkButton, UnderBubble } from './ui';

const Lines = styled(UnderBubble)`
  gap: 4px;
`;

/**
 * Under Nestor's ideas, two discreet lines at most: a practical case and a
 * library model close to what the user is writing.
 */
export const CloseMatches = ({ caseMatch, model }: CloseMatchesFound) => {
  const { t } = useTranslation();
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const placePrompt = usePlacePrompt();

  if (!caseMatch && !model) return null;

  // As in the library's suggestions: Nestor asks for what the model needs,
  // reusing what is already written; a model with nothing to fill goes in
  // the field as it is.
  const openModel = () => {
    if (!model) return;
    if (hasPlaceholders(model.prompt)) {
      startFill(
        model.prompt,
        model.title,
        usePromptToolkitStore.getState().chatInput,
      );
    } else {
      placePrompt(model.prompt);
    }
  };

  return (
    <Lines role="group" aria-label={t('Close to your request')}>
      {caseMatch && (
        <LinkButton type="button" onClick={() => startTraining(caseMatch.id)}>
          {t('Practise on a close case: {{title}}', {
            title: caseMatch.title,
          })}
        </LinkButton>
      )}
      {model && (
        <LinkButton type="button" onClick={openModel}>
          {t('A close model: {{title}}', { title: model.title })}
        </LinkButton>
      )}
    </Lines>
  );
};
