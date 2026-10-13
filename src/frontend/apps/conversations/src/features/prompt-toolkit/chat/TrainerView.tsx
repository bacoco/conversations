import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon } from '@/components';

import { StarRequest } from './StarRequest';
import { VoiceAnswer } from './VoiceAnswer';
import { NESTOR_AVATAR_URL } from './avatar';
import {
  ActionButton,
  C,
  CounselLine,
  FixList,
  Lesson,
  LinkButton,
  Proposed,
  TipButton,
  TipRow,
  Warn,
  Why,
} from './ui';
import type { Trainer } from './useTrainer';

/** The five steps the band shows; « done » is the end, not a step. */
const STEPS = [
  { step: 'read', label: 'Read' },
  { step: 'ask', label: 'Ask' },
  { step: 'advice', label: 'Advice' },
  { step: 'compare', label: 'Compare' },
  { step: 'verify', label: 'Check' },
] as const;
const ORDER = ['read', 'ask', 'advice', 'compare', 'verify', 'done'];

const Screen = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const Band = styled.ol`
  flex: none;
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 10px 12px;
  list-style: none;
  border-bottom: 1px solid ${C.line};
  & > li {
    flex: 1;
    text-align: center;
    padding: 6px 2px;
    border-radius: 8px;
    font-size: 11.5px;
    background: ${C.soft};
    color: ${C.muted};
  }
  & > li[data-state='done'] {
    background: ${C.okBg};
    color: ${C.okInk};
    font-weight: 600;
  }
  & > li[aria-current='step'] {
    background: ${C.brand};
    color: #ffffff;
    font-weight: 700;
  }
`;

/** Centred while short, scrolling once long: never stuck at the top. */
const Middle = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 10px;
  & > * {
    flex: none;
  }
  & > :first-child {
    margin-top: auto;
  }
  & > :last-child {
    margin-bottom: auto;
  }
`;

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid ${C.brandLine};
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  color: ${C.ink};
  & > h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${C.muted};
  }
`;

const Who = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  & img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }
`;

const Paper = styled.div`
  white-space: pre-wrap;
  font-size: 13px;
  background: ${C.soft};
  border-radius: 10px;
  padding: 8px 10px;
`;

const Mine = styled.div`
  white-space: pre-wrap;
  font-size: 13px;
  border-radius: 10px;
  padding: 8px 10px;
  background: ${C.mineBg};
  color: ${C.mineInk};
`;

const Good = styled.div`
  white-space: pre-wrap;
  font-size: 13px;
  border-left: 3px solid ${C.okInk};
  border-radius: 0 10px 10px 0;
  padding: 8px 10px;
  background: ${C.okBg};
  color: ${C.okInk};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const Check = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  font-size: 13px;
`;

const Small = styled.span`
  font-size: 12.5px;
  color: ${C.muted};
`;

const SayIt = ({ onSay }: { onSay: () => void }) => {
  const { t } = useTranslation();
  return (
    <ActionButton type="button" $voice onClick={onSay}>
      <Icon iconName="mic" $size="18px" $withThemeInherited />
      {t('Say it')}
    </ActionButton>
  );
};

/**
 * The trainer's card: one step of the case at a time, the band on top to
 * see where one is. Writing happens in the Assistant's field, as in work.
 */
export const TrainerView = ({
  trainer,
  onSay,
}: {
  trainer: Trainer;
  /** « Le dire » outside « Demander »: the window of « Demander à Nestor ». */
  onSay: () => void;
}) => {
  const { t } = useTranslation();
  const [dictating, setDictating] = useState(false);
  const item = trainer.item;
  if (!item) return null;
  const at = ORDER.indexOf(trainer.step);
  const pointsDone = trainer.points.filter(Boolean).length;
  const backLabel =
    trainer.from === 'learn'
      ? t('Back to the course')
      : trainer.from === 'coach'
        ? t('Back to the coach')
        : trainer.from === 'tools'
          ? t('Back to the tools')
          : t('Back to the home page');

  return (
    <Screen>
      <Band aria-label={t('Steps of the case')}>
        {STEPS.map(({ step, label }, index) => (
          <li
            key={step}
            data-state={index < at ? 'done' : undefined}
            aria-current={index === at ? 'step' : undefined}
          >
            {index < at ? '✓ ' : ''}
            {index + 1} · {t(label)}
          </li>
        ))}
      </Band>
      <Middle>
        <Card>
          <Who>
            <img src={NESTOR_AVATAR_URL} alt="" />
            {item.title}
          </Who>

          {trainer.step === 'read' && (
            <>
              <h3>{t('The situation')}</h3>
              <span>{item.situation}</span>
              {item.material && <Paper>{item.material}</Paper>}
              <Row>
                <ActionButton type="button" $primary onClick={trainer.readDone}>
                  {t('I have read it, on to my request')}
                </ActionButton>
                <SayIt onSay={onSay} />
              </Row>
            </>
          )}

          {trainer.step === 'ask' && (
            <>
              <h3>{t('Your request')}</h3>
              <span>
                {t(
                  'How would you ask the Assistant for it? Write it in the field, in the middle, as you really would. The texts of the case are already there.',
                )}
              </span>
              {trainer.notice === 'write-first' && (
                <Warn>
                  {t(
                    'Write your request at the top of the field, above the texts.',
                  )}
                </Warn>
              )}
              {dictating ? (
                <VoiceAnswer
                  onSend={(text) => {
                    setDictating(false);
                    trainer.saidRequest(text);
                  }}
                  onCancel={() => setDictating(false)}
                />
              ) : (
                <Row>
                  <ActionButton
                    type="button"
                    $primary
                    onClick={trainer.myRequestDone}
                  >
                    {t('This is my request')}
                  </ActionButton>
                  <SayIt onSay={() => setDictating(true)} />
                </Row>
              )}
              <Small>
                {t('No idea?')}{' '}
                <LinkButton type="button" onClick={trainer.useBeginnerRequest}>
                  {t('Start from a beginner’s request')}
                </LinkButton>{' '}
                : « {item.startingRequest} »
              </Small>
            </>
          )}

          {trainer.step === 'advice' && trainer.advice && (
            <>
              <h3>{t('My advice on your request')}</h3>
              {trainer.advice.good.map((good) => (
                <CounselLine key={good} $tone="ok">
                  <span aria-hidden="true">✓</span>
                  <span>{good}</span>
                </CounselLine>
              ))}
              {trainer.advice.tips.map((tip, index) => {
                const state = trainer.tipStates[index];
                return (
                  <CounselLine key={tip.text} $tone="go">
                    <span aria-hidden="true">→</span>
                    <span>
                      <span>{tip.text}</span> {tip.why && <Why>{tip.why}</Why>}
                      <TipRow>
                        {state === 'added' && t('✓ Added to your text')}
                        {state === 'ignored' && t('Ignored')}
                        {state === 'known' &&
                          t(
                            'Noted: you already do it, I will not say it again',
                          )}
                        {!state && (
                          <>
                            {tip.add && (
                              <TipButton
                                type="button"
                                onClick={() =>
                                  trainer.tipAction(index, 'added')
                                }
                              >
                                {t('Add')}
                              </TipButton>
                            )}
                            <TipButton
                              type="button"
                              onClick={() =>
                                trainer.tipAction(index, 'ignored')
                              }
                            >
                              {t('Ignore')}
                            </TipButton>
                            {tip.part && (
                              <TipButton
                                type="button"
                                onClick={() =>
                                  trainer.tipAction(index, 'known')
                                }
                              >
                                {t('I already do it')}
                              </TipButton>
                            )}
                          </>
                        )}
                      </TipRow>
                    </span>
                  </CounselLine>
                );
              })}
              <Row>
                <ActionButton
                  type="button"
                  $primary
                  onClick={trainer.corrected}
                >
                  {t('I have corrected it')}
                </ActionButton>
                <SayIt onSay={onSay} />
              </Row>
            </>
          )}

          {trainer.step === 'compare' && (
            <>
              <h3>{t('Your request and a good request')}</h3>
              <Mine>{trainer.mine || item.startingRequest}</Mine>
              <Good>{item.goodRequest}</Good>
              <FixList aria-label={t('What makes the difference')}>
                {item.keyPoints.map((point, index) => (
                  <li key={point.point} data-done={!!trainer.points[index]}>
                    <span aria-hidden="true">
                      {trainer.points[index] ? '✓' : '○'}
                    </span>
                    <span>{point.point}</span>
                  </li>
                ))}
              </FixList>
              {trainer.placed ? (
                <Proposed>
                  {t(
                    'It is in the field: send it with the arrow, in the middle. Then check the answer here.',
                  )}
                </Proposed>
              ) : (
                <Row>
                  <ActionButton
                    type="button"
                    $primary
                    onClick={trainer.useGood}
                  >
                    {t('Put the good request in the field')}
                  </ActionButton>
                  <ActionButton type="button" onClick={trainer.useMine}>
                    {t('Send mine')}
                  </ActionButton>
                </Row>
              )}
            </>
          )}

          {trainer.step === 'verify' && (
            <>
              <h3>{t('Check the answer, in the middle')}</h3>
              {item.checkAnswer.map((question, index) => (
                <Check key={question}>
                  <span>{question}</span>
                  <Row>
                    <TipButton
                      type="button"
                      aria-pressed={trainer.checks[index] === true}
                      onClick={() => trainer.check(index, true)}
                    >
                      {t('Yes')}
                    </TipButton>
                    <TipButton
                      type="button"
                      aria-pressed={trainer.checks[index] === false}
                      onClick={() => trainer.check(index, false)}
                    >
                      {t('No')}
                    </TipButton>
                  </Row>
                </Check>
              ))}
              <Small>
                {trainer.unfound.length
                  ? t(
                      'Nestor found in the answer: {{figures}}, nowhere in the case’s texts.',
                      {
                        figures: trainer.unfound.join(', '),
                      },
                    )
                  : t('Nestor found no figure missing from the case’s texts.')}
              </Small>
              <Row>
                <ActionButton type="button" $primary onClick={trainer.verified}>
                  {t('I have checked')}
                </ActionButton>
                <SayIt onSay={onSay} />
              </Row>
            </>
          )}

          {trainer.step === 'done' && (
            <>
              <h3>{t('Well done, case finished')}</h3>
              {trainer.points.length > 0 && (
                <span>
                  {pointsDone === 0
                    ? t(
                        'The good request showed you the {{total}} points that make the difference, and you checked the answer.',
                        { total: trainer.points.length },
                      )
                    : t(
                        'You had {{done}} of the {{total}} points by yourself, and you checked the answer.',
                        { done: pointsDone, total: trainer.points.length },
                      )}
                </span>
              )}
              <Lesson>
                <strong>{t('The reflex to keep:')}</strong>
                <span>{item.lesson}</span>
              </Lesson>
              <Row>
                {trainer.nextCaseId && (
                  <ActionButton
                    type="button"
                    $primary
                    onClick={trainer.nextCase}
                  >
                    {t('Another case of my job')}
                  </ActionButton>
                )}
                <ActionButton type="button" onClick={trainer.leave}>
                  {backLabel}
                </ActionButton>
                <StarRequest text={item.goodRequest} />
              </Row>
            </>
          )}

          {trainer.busy && (
            <Small role="status">{t('Nestor is reading…')}</Small>
          )}
          {trainer.notice === 'failed' && (
            <Small>{t('I could not answer. Click again.')}</Small>
          )}
        </Card>
        {trainer.step !== 'done' && (
          <LinkButton
            type="button"
            style={{ alignSelf: 'center' }}
            onClick={trainer.leave}
          >
            {t('Leave the case')}
          </LinkButton>
        )}
      </Middle>
    </Screen>
  );
};
