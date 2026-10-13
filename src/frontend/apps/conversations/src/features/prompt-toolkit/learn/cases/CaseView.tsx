import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { C, Choice, Lesson, MainButton } from '../../chat/ui';
import { caseById } from '../../jobs/jobs';
import { usePromptToolkitStore } from '../../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../../tools/usePlacePrompt';

import { CasePage } from './CasesView';
import { useCasesStore } from './casesProgress';

const Situation = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
`;

const Material = styled.details`
  border: 1px solid ${C.line};
  border-radius: 10px;
  padding: 8px 12px;
  & > summary {
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: ${C.brandInk};
  }
  & > pre {
    margin: 8px 0 0;
    white-space: pre-wrap;
    font: inherit;
    font-size: 13px;
    line-height: 1.5;
  }
`;

const Step = ({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) => (
  <StepBox>
    <StepNumber aria-hidden="true">{number}</StepNumber>
    <div>
      <strong>{title}</strong>
      {children}
    </div>
  </StepBox>
);

const StepBox = styled.section`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  & > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const StepNumber = styled.span`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
  background: ${C.brand};
`;

const Quote = styled.p`
  margin: 0;
  padding: 8px 12px;
  border-radius: 10px;
  background: ${C.soft};
  font-style: italic;
`;

const Check = styled.label`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  cursor: pointer;
  & > input {
    margin-top: 3px;
  }
`;

const Reveal = styled.details`
  & > summary {
    cursor: pointer;
    font-weight: 600;
    color: ${C.brandInk};
  }
  & > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }
`;

const SKILL_WORDS: Record<string, string> = {
  task: 'The task',
  context: 'The context',
  audience: 'Who will read it',
  format: 'The form',
  sources: 'The source',
  examples: 'An example',
  tone: 'The tone',
  constraints: 'The limits',
};

/**
 * One practical case: the situation, then the user does it themselves
 * with the Assistant (Nestor helps), checks the answer, and compares.
 */
export const CaseView = ({
  caseId,
  onBack,
  onDone,
}: {
  caseId: string;
  onBack: () => void;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const item = caseById(caseId);
  const placePrompt = usePlacePrompt();
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const markDone = useCasesStore((state) => state.markDone);
  const [checked, setChecked] = useState<string[]>([]);

  if (!item) {
    return null;
  }
  // The vague request, and the text it works on: as a beginner would start.
  const starting = item.material
    ? `${item.startingRequest}\n\n${item.material}`
    : item.startingRequest;

  return (
    <CasePage title={item.title} onBack={onBack}>
      <Situation>{item.situation}</Situation>
      {item.material && (
        <Material>
          <summary>{t('See the text to work from')}</summary>
          <pre>{item.material}</pre>
        </Material>
      )}
      <Step
        number={1}
        title={t('Start from this request, as many would write it')}
      >
        <Quote>« {item.startingRequest} »</Quote>
        <MainButton
          type="button"
          onClick={() => placePrompt(starting, { replaceDraft: true })}
        >
          {t('Put the starting request in the Assistant’s field')}
        </MainButton>
      </Step>
      <Step number={2} title={t('Improve it yourself, with Nestor')}>
        <span>
          {t(
            'Click « Analyser mon texte »: Nestor shows what is missing. Add it in your own words, in the Assistant’s field.',
          )}
        </span>
        <Choice type="button" onClick={() => startCoach()}>
          {t('Open Nestor’s coach')}
        </Choice>
      </Step>
      <Step number={3} title={t('Send it to the Assistant')}>
        <span>{t('Then read its answer carefully.')}</span>
      </Step>
      <Step number={4} title={t('Check the answer')}>
        {item.checkAnswer.map((point) => (
          <Check key={point}>
            <input
              type="checkbox"
              checked={checked.includes(point)}
              onChange={(event) =>
                setChecked((current) =>
                  event.target.checked
                    ? [...current, point]
                    : current.filter((value) => value !== point),
                )
              }
            />
            <span>{point}</span>
          </Check>
        ))}
      </Step>
      <Step number={5} title={t('Compare with a good request')}>
        <Reveal>
          <summary>{t('See a good request')}</summary>
          <div>
            <Quote>« {item.goodRequest} »</Quote>
            {item.keyPoints.map((point) => (
              <span key={point.point}>
                <strong>{t(SKILL_WORDS[point.skill] ?? 'The task')} :</strong>{' '}
                {point.point}
              </span>
            ))}
          </div>
        </Reveal>
        <Lesson>
          <strong>{t('The rule to keep:')}</strong>
          <span>{item.lesson}</span>
        </Lesson>
      </Step>
      <MainButton
        type="button"
        onClick={() => {
          markDone(item.id);
          onDone();
        }}
      >
        {t('I have finished this case')}
      </MainButton>
    </CasePage>
  );
};
