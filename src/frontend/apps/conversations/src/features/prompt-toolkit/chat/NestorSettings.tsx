import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon } from '@/components';
import { useConversationRouteId } from '@/utils';

import { JOBS, jobById } from '../jobs/jobs';
import {
  AutoPart,
  USUAL_AUDIENCES,
  UsualAudience,
  useCoachPrefsStore,
} from '../stores/useCoachPrefsStore';
import { NEW_CHAT_KEY, useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';

import { C } from './ui';

/** An on/off switch drawn as in the canvas: a track and its knob. */
const Toggle = styled.button<{ $on: boolean }>`
  flex: none;
  position: relative;
  width: 40px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: ${({ $on }) => ($on ? C.brand : C.grey)};
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? '19px' : '3px')};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    transition: left 0.15s;
  }
  &:disabled {
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
`;

const Switch = ({
  label,
  on,
  disabled,
  onChange,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) => (
  <Toggle
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    $on={on}
    onClick={() => onChange(!on)}
  />
);

const HeaderAuto = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  /* Room before the panel's own buttons on the right. */
  margin-right: 12px;
  font-size: 13px;
  font-weight: 600;
  color: ${C.ink};
`;

const Gear = styled.button`
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${C.soft};
  color: ${C.brandInk};
`;

/** "Auto" in Nestor's header: the same switch as in the settings. */
export const NestorHeaderTools = ({
  onSettings,
}: {
  onSettings?: () => void;
}) => {
  const { t } = useTranslation();
  const auto = useCoachPrefsStore((state) => state.auto);
  const setAuto = useCoachPrefsStore((state) => state.setAuto);
  return (
    <HeaderAuto>
      <span aria-hidden="true">{t('Auto')}</span>
      <Switch label={t('Auto')} on={auto} onChange={setAuto} />
      {onSettings && (
        <Gear
          type="button"
          aria-label={t('Nestor’s settings')}
          title={t('Nestor’s settings')}
          onClick={onSettings}
        >
          <Icon iconName="settings" $size="20px" $withThemeInherited />
        </Gear>
      )}
    </HeaderAuto>
  );
};

const Screen = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: ${C.ink};
  background: #ffffff;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid ${C.line};
  font-size: 15px;
  font-weight: 700;
  & > button {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${C.soft};
    color: ${C.brandInk};
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 16px 20px;
  scrollbar-width: thin;
`;

const Group = styled.section`
  margin-top: 18px;
  & > h3 {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    color: ${C.muted};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const Card = styled.div`
  border: 1px solid ${C.line};
  border-radius: 12px;
  overflow: hidden;
`;

const Row = styled.div<{ $master?: boolean; $dim?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-top: 1px solid #efeff4;
  background: ${({ $master }) => ($master ? '#f7f6ff' : 'transparent')};
  opacity: ${({ $dim }) => ($dim ? 0.45 : 1)};
  &:first-child {
    border-top: none;
  }
`;

const Text = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  & > span:first-child {
    font-size: 14px;
    font-weight: 600;
  }
  & > span + span {
    font-size: 12px;
    color: ${C.muted};
    line-height: 1.4;
  }
`;

const Segments = styled.div`
  flex: none;
  display: flex;
  padding: 3px;
  border-radius: 999px;
  background: ${C.soft};
  & > button {
    padding: 5px 10px;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: ${C.muted};
    background: transparent;
  }
  & > button[aria-checked='true'] {
    color: ${C.brandDark};
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }
`;

const Select = styled.select`
  flex: none;
  max-width: 45%;
  padding: 4px 6px;
  border: none;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: ${C.brandInk};
  background: ${C.soft};
  cursor: pointer;
`;

const Danger = styled.button`
  margin-top: 18px;
  width: 100%;
  padding: 10px;
  border: 1px solid #f0c4c0;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #b3261e;
  background: #ffffff;
`;

const Note = styled.p`
  margin: 10px 0 0;
  font-size: 12px;
  color: ${C.muted};
  line-height: 1.45;
`;

const Line = ({
  label,
  note,
  master,
  dim,
  children,
}: {
  label: string;
  note?: string;
  master?: boolean;
  dim?: boolean;
  children: ReactNode;
}) => (
  <Row $master={master} $dim={dim}>
    <Text>
      <span>{label}</span>
      {note && <span>{note}</span>}
    </Text>
    {children}
  </Row>
);

/** Nestor's settings (E11): no bottom bar, back to the chat on top. */
export const NestorSettings = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const prefs = useCoachPrefsStore();
  const job = useProfileStore((state) => state.job);
  const setJob = useProfileStore((state) => state.setJob);
  const isBeginner = useProfileStore((state) => state.isBeginner);
  const setBeginner = useProfileStore((state) => state.setBeginner);
  const conversationId = useConversationRouteId();
  const parts: { part: AutoPart; label: string; note: string }[] = [
    {
      part: 'autoPistes',
      label: t('Ideas while I type'),
      note: t('Starting ideas, close to yours.'),
    },
    {
      part: 'autoAnalyse',
      label: t('Analyse when I pause'),
      note: t('Nestor reads your text after 3 seconds without typing.'),
    },
    {
      part: 'autoAdvice',
      label: t('Advice after each answer'),
      note: t('What worked and one thing to try.'),
    },
    {
      part: 'autoSuites',
      label: t('Suggest ways to go on'),
      note: t('3 ideas to go on, under the advice.'),
    },
  ];
  const audienceLabels: Record<UsualAudience, string> = {
    colleagues: t('Colleagues'),
    management: t('My management'),
    public: t('The public'),
    partners: t('Partners'),
  };
  // Erasing asks once more, in place: "Oui, effacer" or "Non, garder".
  const [confirming, setConfirming] = useState(false);
  const erase = () => {
    useNestorChatStore.getState().clear(conversationId ?? NEW_CHAT_KEY);
    setConfirming(false);
    onClose();
  };
  const segments = <V extends string>(
    label: string,
    value: V,
    options: { value: V; label: string }[],
    onChange: (value: V) => void,
  ) => (
    <Segments role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </Segments>
  );

  return (
    <Screen>
      <Head>
        <button
          type="button"
          aria-label={t('Back to the chat')}
          onClick={onClose}
        >
          <Icon iconName="arrow_back" $size="18px" $withThemeInherited />
        </button>
        {t('Nestor’s settings')}
      </Head>
      <Body>
        <Group>
          <h3>{t('Automatic help')}</h3>
          <Card>
            <Line
              master
              label={t('Auto')}
              note={t(
                'The same switch as on top. Off: the 4 lines below grey out and Nestor does nothing by himself. On again: they come back as you left them.',
              )}
            >
              <Switch
                label={t('Auto')}
                on={prefs.auto}
                onChange={prefs.setAuto}
              />
            </Line>
            {parts.map(({ part, label, note }) => (
              <Line key={part} label={label} note={note} dim={!prefs.auto}>
                <Switch
                  label={label}
                  on={prefs[part]}
                  disabled={!prefs.auto}
                  onChange={(on) => prefs.setAutoPart(part, on)}
                />
              </Line>
            ))}
          </Card>
        </Group>
        <Group>
          <h3>{t('How Nestor talks to me')}</h3>
          <Card>
            <Line label={t('Tone')}>
              {segments(
                t('Tone'),
                prefs.tone,
                [
                  { value: 'encouraging', label: t('Encouraging') },
                  { value: 'direct', label: t('Direct') },
                ],
                prefs.setTone,
              )}
            </Line>
            <Line label={t('Length of the advice')}>
              {segments(
                t('Length of the advice'),
                prefs.length,
                [
                  { value: 'short', label: t('Short') },
                  { value: 'detailed', label: t('Detailed') },
                ],
                prefs.setLength,
              )}
            </Line>
          </Card>
        </Group>
        <Group>
          <h3>{t('To help me better')}</h3>
          <Card>
            <Line
              label={t('My field')}
              note={t(
                'Only used to pick examples. Never added to your requests.',
              )}
            >
              <Select
                aria-label={t('My field')}
                value={job?.id ?? ''}
                onChange={(event) => {
                  const chosen = jobById(event.target.value);
                  setJob(
                    chosen ? { id: chosen.id, label: chosen.label } : null,
                  );
                }}
              >
                <option value="">{t('Not specified')}</option>
                {JOBS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Line>
            <Line
              label={t('I am a beginner')}
              note={t('Fewer details on screen, simpler words.')}
            >
              <Switch
                label={t('I am a beginner')}
                on={isBeginner}
                onChange={setBeginner}
              />
            </Line>
            <Line
              label={t('My usual readers')}
              note={t(
                'Only used to pick examples. Nestor still asks you who it is for.',
              )}
            >
              <Select
                aria-label={t('My usual readers')}
                value={prefs.usualAudience ?? ''}
                onChange={(event) =>
                  prefs.setUsualAudience(
                    (event.target.value || null) as UsualAudience | null,
                  )
                }
              >
                <option value="">{t('Not specified')}</option>
                {USUAL_AUDIENCES.map((audience) => (
                  <option key={audience} value={audience}>
                    {audienceLabels[audience]}
                  </option>
                ))}
              </Select>
            </Line>
          </Card>
        </Group>
        {confirming ? (
          <Group aria-label={t('Erase Nestor’s thread for this conversation?')}>
            <Note>{t('Erase Nestor’s thread for this conversation?')}</Note>
            <Segments>
              <button type="button" onClick={erase}>
                {t('Yes, erase it')}
              </button>
              <button type="button" onClick={() => setConfirming(false)}>
                {t('No, keep it')}
              </button>
            </Segments>
          </Group>
        ) : (
          <Danger type="button" onClick={() => setConfirming(true)}>
            {t('Erase only Nestor’s thread')}
          </Danger>
        )}
        <Note>
          {t(
            'Your conversation with the Assistant and your settings are kept. I will ask you to confirm.',
          )}
        </Note>
        <Note>
          {t(
            'Always on, whatever the settings: simple words, and Nestor never makes anything up. These settings stay on this computer.',
          )}
        </Note>
      </Body>
    </Screen>
  );
};
