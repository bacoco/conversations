import {
  ChangeEvent,
  KeyboardEvent,
  MutableRefObject,
  useLayoutEffect,
  useRef,
} from 'react';
import { css } from 'styled-components';

import { Box } from '@/components';

import { MicButton } from '../speech/MicButton';
import { appendText } from '../speech/transcribe';

const MAX_HEIGHT_PX = 240;

/**
 * Light text area for the side panel: thin border, visible placeholder,
 * brand focus ring, grows with its content (no resize handle), and a small
 * microphone in the bottom right corner to speak instead of typing.
 */
export const PanelTextArea = ({
  label,
  value,
  onChange,
  placeholder,
  minRows = 3,
  fill = false,
  onKeyDown,
  inputRef,
  dictation = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  /** Take all the height of its container instead of growing with the text. */
  fill?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Gives the caller the element, for example to move the focus. */
  inputRef?: MutableRefObject<HTMLTextAreaElement | null>;
  /** Shows the microphone (when the relay offers transcription). */
  dictation?: boolean;
}) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  // The dictated text arrives later: add it to the latest value.
  const valueRef = useRef(value);
  valueRef.current = value;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || fill) {
      return;
    }
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value, fill]);

  return (
    <Box
      $css={css`
        position: relative;
        width: 100%;
        ${fill ? 'flex: 1; min-height: 160px;' : ''}
      `}
    >
      <Box
        as="textarea"
        ref={(element: HTMLTextAreaElement | null) => {
          ref.current = element;
          if (inputRef) {
            inputRef.current = element;
          }
        }}
        aria-label={label}
        rows={minRows}
        value={value}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        $css={css`
          width: 100%;
          box-sizing: border-box;
          ${fill ? 'flex: 1; min-height: 160px;' : ''}
          padding: ${dictation ? '10px 44px 10px 12px' : '10px 12px'};
          border-radius: 10px;
          resize: none;
          overflow-y: auto;
          font: inherit;
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--c--contextuals--content--semantic--neutral--primary);
          border: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--secondary);
          transition:
            border-color 0.15s ease,
            background-color 0.15s ease;
          &::placeholder {
            color: var(--c--contextuals--content--semantic--neutral--tertiary);
          }
          &:hover {
            border-color: var(
              --c--contextuals--border--semantic--brand--secondary
            );
          }
          &:focus {
            outline: none;
            border-color: var(
              --c--contextuals--border--semantic--brand--primary
            );
            background: var(--c--contextuals--background--surface--primary);
            box-shadow: 0 0 0 3px
              var(--c--contextuals--background--semantic--brand--tertiary);
          }
        `}
      />
      {dictation && (
        <Box $css="position: absolute; right: 8px; bottom: 8px;">
          <MicButton
            onText={(text) => onChange(appendText(valueRef.current, text))}
          />
        </Box>
      )}
    </Box>
  );
};
