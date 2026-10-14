import { useTranslation } from 'react-i18next';

import { NestorBubble } from '../chat/ui';
import type { DemoStep } from '../stores/useDemoStore';

import { DemoTag, demoText } from './demoText';

/** Nestor's word about the button just tried, marked « Démo ». */
export const DemoNoteView = ({ step }: { step: DemoStep }) => {
  const { t } = useTranslation();
  return (
    <NestorBubble>
      <DemoTag>{t('Demo')}</DemoTag>
      <span>{demoText(t, step)}</span>
    </NestorBubble>
  );
};
