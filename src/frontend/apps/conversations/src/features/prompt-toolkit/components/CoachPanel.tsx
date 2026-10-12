import { NestorCoach } from '../chat/NestorCoach';

/** `isActive` is false while the panel is hidden: Auto then pauses. */
export const CoachPanel = ({ isActive = true }: { isActive?: boolean }) => (
  <NestorCoach isActive={isActive} />
);
