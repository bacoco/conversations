import type { TFunction } from 'i18next';
import styled from 'styled-components';

import { C } from '../chat/ui';
import type { DemoStep } from '../stores/useDemoStore';

/** Marks Nestor's words about the demo, apart from a real session. */
export const DemoTag = styled.span`
  display: inline-block;
  align-self: flex-start;
  margin-bottom: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px dashed ${C.brand};
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${C.brandInk};
`;

/** What Nestor says, in the first person, after each button of the demo. */
export const demoText = (t: TFunction, step: DemoStep): string => {
  switch (step) {
    case 'intro':
      return t(
        'This is a demo. An example request from your job is in the Assistant’s field. My buttons work for real on it, and after each one I tell you what I just did. Nothing is sent to the Assistant. Follow the ring, at the bottom.',
      );
    case 'analyse':
      return t(
        'That was « Analyser mon texte ». I read your request without changing it: what it already says, what is missing, then one question at a time, with buttons. You complete it yourself: that is how you learn what a good request holds.',
      );
    case 'improve':
      return t(
        'That was « Améliorer mon texte ». Advice first: for each one, you choose « Ajouter », « Ignorer » or « Je le fais déjà ». Then I show you the good text, or two versions to compare. Your figures are never changed.',
      );
    case 'review':
      return t(
        'That was « Faire le bilan ». After an answer of the Assistant, I sum up your session: what you did well, and one habit to keep. No mark, no ranking.',
      );
    case 'ask':
      return t(
        'That was « Demander à Nestor ». Ask me anything, by voice or keyboard: a question about your request, or « aide-moi à… ». If it helps, I launch the right button myself.',
      );
    case 'end':
      return t(
        'The demo is over. Up top: « Auto » lets me help by myself while you type, the bin erases this thread, and the « ? » shows the presentation again. « Quitter la démo » gives you back your own text.',
      );
  }
};
