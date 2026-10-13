import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components';

import { JOBS, jobById } from '../jobs/jobs';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useProfileStore } from '../stores/useProfileStore';

import { InChatRounds } from './InChatRounds';
import { Choice, Choices, NestorBubble } from './ui';
import type { NestorChat } from './useNestorChat';

/** Three tasks of the job first; « Autres tâches » shows the rest. */
const TASKS_SHOWN = 3;

const asSentence = (task: string) =>
  task.charAt(0).toUpperCase() + task.slice(1);

/**
 * Nestor's welcome. Without a job, he asks it first (« Plus tard »
 * possible); with one, « Que voulez-vous faire ? » and the tasks of that
 * job. The choices show while nothing has happened yet.
 */
export const Welcome = ({
  chat,
  open,
}: {
  chat: NestorChat;
  open: boolean;
}) => {
  const { t } = useTranslation();
  const job = jobById(useProfileStore((state) => state.job?.id));
  const setJob = useProfileStore((state) => state.setJob);
  const jobLater = useCoachPrefsStore((state) => state.jobLater);
  const setJobLater = useCoachPrefsStore((state) => state.setJobLater);
  const [allTasks, setAllTasks] = useState(false);

  if (open && !job && !jobLater) {
    return (
      <NestorBubble>
        <span>
          {t(
            'Hello! I am Nestor, your coach. To speak of your own work, I need one thing:',
          )}
        </span>
        <strong>{t('What is your job?')}</strong>
        <Choices>
          {JOBS.map((item) => (
            <Choice
              key={item.id}
              type="button"
              onClick={() => setJob({ id: item.id, label: item.label })}
            >
              {item.label}
            </Choice>
          ))}
          <Choice type="button" $tone="dunno" onClick={() => setJobLater(true)}>
            {t('Later')}
          </Choice>
        </Choices>
      </NestorBubble>
    );
  }

  const tasks = job?.tasks ?? [];
  const shown = allTasks ? tasks : tasks.slice(0, TASKS_SHOWN);
  return (
    <>
      <NestorBubble>
        <span>
          {t(
            'Hello! Write your request in the Assistant’s field, in the middle, as you would tell a colleague. I suggest starting ideas as you type.',
          )}
        </span>
        <span>
          {t('A question for me? Click “Ask Nestor”, at the bottom right.')}
        </span>
        {open && tasks.length > 0 && (
          <>
            <strong>{t('What do you want to do?')}</strong>
            <Choices>
              {shown.map((task) => (
                <Choice
                  key={task}
                  type="button"
                  onClick={() => chat.startTask(task)}
                >
                  {asSentence(task)}
                </Choice>
              ))}
              {!allTasks && tasks.length > TASKS_SHOWN && (
                <Choice
                  type="button"
                  $tone="dunno"
                  onClick={() => setAllTasks(true)}
                >
                  <Icon iconName="add" $size="16px" $withThemeInherited />
                  {t('Other tasks')}
                </Choice>
              )}
            </Choices>
          </>
        )}
      </NestorBubble>
      {open && (
        <InChatRounds
          message={{
            id: 'hello',
            action: 0,
            kind: 'hint',
            hint: 'new-request',
          }}
          missing={[]}
          rounds={[{ id: 'examples', primary: !tasks.length }, { id: 'say' }]}
          onRound={(round) => chat.runRound('hello', round)}
        />
      )}
    </>
  );
};
