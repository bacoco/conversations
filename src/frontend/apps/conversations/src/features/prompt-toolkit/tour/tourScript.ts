import type { BarAction } from '../chat/types';

/**
 * What the stage shows, large: the very thing to look at or click — a
 * card's own Nestor, or a button of the bar, round and named.
 */
export type TourPicture =
  | { kind: 'card'; src: string; label: string }
  | { kind: 'button'; action: BarAction }
  | { kind: 'nestor' };

/** What a step waits for before going on by itself. */
export type TourWait = 'coach-open' | 'analyse' | 'improve';

export interface TourStep {
  id: string;
  /** What Nestor says (English key, French in the translations). */
  say: string;
  /** The element that flashes: its data-tour name. */
  target?: string;
  /** A step that asks for a click goes on once the click is done. */
  wait?: TourWait;
  /** Passed when its element is not on screen (a card that may be off). */
  optional?: boolean;
  /** Shown large in the middle; Nestor's face when none. */
  picture?: TourPicture;
}

/**
 * The tour, in the words of someone who knows nothing yet: the home page's
 * cards, then the coach's four buttons, then two tries on an example.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'hello',
    target: 'panel',
    say: 'Hello! I am Nestor, your coach. In a few minutes, I show you how I help you write well to the Assistant. Everything happens here, in the panel on the right.',
  },
  {
    id: 'home-transcribe',
    picture: {
      kind: 'card',
      src: '/assets/nestor-transcription.webp',
      label: 'Record and transcribe',
    },
    target: 'card-transcription',
    optional: true,
    say: '« Enregistrer et transcrire »: you speak, or you record a meeting, and the text writes itself.',
  },
  {
    id: 'home-coach',
    picture: {
      kind: 'card',
      src: '/assets/nestor-analyse.webp',
      label: 'Coach',
    },
    target: 'card-coach-manual',
    say: '« Coach »: that is me. I look at your request before you send it, I give you advice, then I check the Assistant’s answer with you.',
  },
  {
    id: 'home-course',
    picture: {
      kind: 'card',
      src: '/assets/nestor-cours.webp',
      label: 'Course',
    },
    target: 'card-course',
    say: '« Cours »: short lessons and exercises to learn to ask well, at your own pace.',
  },
  {
    id: 'home-tools',
    picture: {
      kind: 'card',
      src: '/assets/nestor-outils.webp',
      label: 'Everyday tools',
    },
    target: 'card-tools',
    say: '« Outils du quotidien »: ready-made models for an email, minutes, a summary.',
  },
  {
    id: 'open-coach',
    picture: {
      kind: 'card',
      src: '/assets/nestor-analyse.webp',
      label: 'Coach',
    },
    target: 'card-coach-manual',
    wait: 'coach-open',
    say: 'Let us start with the most useful. Click on the « Coach » card, which is flashing on the right.',
  },
  {
    id: 'coach-bar',
    target: 'bar',
    say: 'Here are my four buttons. They are always there, at the bottom, in the same place.',
  },
  {
    id: 'coach-analyse',
    picture: { kind: 'button', action: 'analyse' },
    target: 'bar-analyse',
    say: '« Analyser mon texte »: I read your request and tell you what it already says and what is missing.',
  },
  {
    id: 'coach-improve',
    picture: { kind: 'button', action: 'improve' },
    target: 'bar-improve',
    say: '« Améliorer mon texte »: I give you advice first, then I suggest a better text.',
  },
  {
    id: 'coach-review',
    picture: { kind: 'button', action: 'review' },
    target: 'bar-review',
    say: '« Faire le bilan »: after the Assistant’s answer, we look back at what went well.',
  },
  {
    id: 'coach-ask',
    picture: { kind: 'button', action: 'ask' },
    target: 'bar-ask',
    say: '« Demander à Nestor »: you ask me a question, out loud or in writing.',
  },
  {
    id: 'field',
    target: 'field',
    say: 'I have put an example request from your job in the Assistant’s field, in the middle. That is where you usually write.',
  },
  {
    id: 'try-analyse',
    picture: { kind: 'button', action: 'analyse' },
    target: 'bar-analyse',
    wait: 'analyse',
    say: 'Let us try. Click on « Analyser mon texte », which is flashing.',
  },
  {
    id: 'after-analyse',
    target: 'thread',
    say: 'There you are: what your request already says, and what is missing. The buttons under my answer help you complete it. That is how you learn what a good request holds.',
  },
  {
    id: 'try-improve',
    picture: { kind: 'button', action: 'improve' },
    target: 'bar-improve',
    wait: 'improve',
    say: 'Now click on « Améliorer mon texte ».',
  },
  {
    id: 'after-improve',
    target: 'thread',
    say: 'For each piece of advice, you choose: « Ajouter », « Ignorer » or « Je le fais déjà ». You decide. Then I show you the better text.',
  },
  {
    id: 'end',
    target: 'help',
    say: 'That is all! To see this tour again, click on the question mark at the top. Your turn now.',
  },
];
