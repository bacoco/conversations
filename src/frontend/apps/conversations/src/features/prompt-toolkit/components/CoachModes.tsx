import { css } from 'styled-components';

/**
 * A choice among a few, as a segmented button. The coach's mode tabs are
 * gone (the coach is one chat with Nestor); the recorder keeps the style.
 */
export const optionCss = (isChecked: boolean) => css`
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: ${isChecked ? 600 : 400};
  white-space: nowrap;
  color: ${
    isChecked
      ? 'var(--c--contextuals--content--semantic--brand--primary)'
      : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    isChecked
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;
