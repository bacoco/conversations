import type { CourseContent } from '../types';

import { COURSE_EN } from './en';
import { COURSE_FR } from './fr';

/** The course is written in French; other languages get the English version. */
export const getCourseContent = (language?: string): CourseContent =>
  (language ?? '').toLowerCase().startsWith('fr') ? COURSE_FR : COURSE_EN;
