/** Prompting course content: lessons, quiz and flashcards. */

// --- Slide types ---

export interface SlideExample {
  bad?: string;
  good?: string;
  note?: string;
}

export interface Slide {
  title: string;
  content: string;
  example?: SlideExample;
  keyTakeaway?: string;
  icon: string;
}

export interface Lesson {
  id: string;
  title: string;
  icon: string;
  slides: Slide[];
}

// --- Quiz types ---

export interface QuizQuestion {
  id: string;
  lessonId: string;
  type: 'mcq' | 'true-false';
  question: string;
  /** MCQ options */
  options?: string[];
  /** MCQ correct answer index (0-based) */
  correctIndex?: number;
  /** True/false correct answer */
  correctAnswer?: boolean;
  explanation: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  front: string;
  back: string;
}

export interface CourseContent {
  lessons: Lesson[];
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
}
