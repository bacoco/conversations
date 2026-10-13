import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { Icon } from '@/components';

import { NESTOR_AVATAR_URL } from './avatar';
import type { GridPart } from './types';

/** The colours of the "E · Coach en chat" canvas, screen for screen. */
export const C = {
  ink: '#1e1e2e',
  muted: '#5f5f72',
  line: '#e3e3ea',
  soft: '#f4f4f7',
  grey: '#cfcfd9',
  brand: '#5b55d6',
  brandInk: '#4b45c6',
  brandDark: '#2b2780',
  brandSoft: '#eeedfb',
  brandLine: '#d6d4f5',
  okBg: '#e3f5e8',
  okInk: '#14532d',
  noBg: '#fdeee4',
  noInk: '#8a3100',
  noLine: '#f3c7ab',
  mineBg: '#e8f0fd',
  mineInk: '#0b3d91',
  record: '#d0342c',
};

const buttonReset = css`
  font-family: inherit;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
`;

/** The thread: it scrolls by itself, its messages rest at the bottom. */
export const ThreadScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
`;

// Centred while it is short (no empty half), a chat that scrolls once long.
export const ThreadInner = styled.div`
  margin-block: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  color: ${C.ink};
`;

export const Hello = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 0;
  & img {
    width: 72px;
    height: 72px;
    border-radius: 50%;
  }
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex: none;
`;

const Bubble = styled.div`
  max-width: 86%;
  min-width: 0;
  background: ${C.soft};
  border-radius: 4px 14px 14px 14px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-wrap: anywhere;
`;

/** Nestor speaks: his face, then his bubble. */
export const NestorBubble = ({ children }: { children: ReactNode }) => (
  <Row>
    <Avatar src={NESTOR_AVATAR_URL} alt="" />
    <Bubble>{children}</Bubble>
  </Row>
);

const Me = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const MeBubble = styled.div<{ $typed?: boolean }>`
  max-width: 80%;
  border-radius: 14px 14px 4px 14px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  background: ${({ $typed }) => ($typed ? C.brand : C.brandSoft)};
  color: ${({ $typed }) => ($typed ? '#ffffff' : C.brandDark)};
`;

/** The user speaks: on the right. What was said aloud is filled. */
export const UserSays = ({
  children,
  typed,
}: {
  children: ReactNode;
  typed?: boolean;
}) => (
  <Me>
    <MeBubble $typed={typed}>{children}</MeBubble>
  </Me>
);

export const Caption = styled.div`
  align-self: flex-end;
  font-size: 11px;
  color: ${C.muted};
  margin-top: -8px;
`;

/** "Demande 1 · 10 h 12" between two lines. */
export const Separator = ({ children }: { children: ReactNode }) => (
  <SeparatorRow role="separator">
    <span />
    {children}
    <span />
  </SeparatorRow>
);

const SeparatorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${C.muted};
  text-align: center;
  & > span {
    flex: 1;
    height: 1px;
    background: ${C.line};
  }
`;

/** An event of the user, on the right: "✓ Vous avez choisi…". */
export const Event = styled.div`
  align-self: flex-end;
  font-size: 12px;
  color: ${C.brandDark};
  background: ${C.brandSoft};
  border-radius: 999px;
  padding: 5px 12px;
`;

/** A past step, folded into one line that opens again. */
export const Fold = styled.details`
  & > summary {
    list-style: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    box-sizing: border-box;
    font-size: 12px;
    color: #3a3a4c;
    background: #ffffff;
    border: 1px solid ${C.line};
    border-radius: 999px;
    padding: 6px 12px;
  }
  & > summary::-webkit-details-marker {
    display: none;
  }
  & > summary .material-icons {
    transition: transform 0.15s;
  }
  &[open] > summary .material-icons {
    transform: rotate(90deg);
  }
  & > div {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 8px;
  }
  /* What is past cannot be clicked again. */
  & > div button {
    opacity: 0.45;
    pointer-events: none;
    filter: grayscale(1);
  }
`;

export const FoldChevron = () => (
  <Icon iconName="chevron_right" $size="16px" $withThemeInherited />
);

export const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Pill = styled.span<{ $ok: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  padding: 4px 10px;
  background: ${({ $ok }) => ($ok ? C.okBg : C.noBg)};
  color: ${({ $ok }) => ($ok ? C.okInk : C.noInk)};
`;

export const Warn = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${C.noInk};
  background: ${C.noBg};
  border: 1px solid ${C.noLine};
  border-radius: 8px;
  padding: 6px 10px;
`;

export const VersionBox = styled.div`
  background: #ffffff;
  border: 1px solid ${C.line};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
`;

export const Mine = styled.span`
  background: ${C.mineBg};
  color: ${C.mineInk};
  border-radius: 3px;
  padding: 0 2px;
`;

export const Added = styled.span`
  background: ${C.okBg};
  color: ${C.okInk};
  border-radius: 3px;
  padding: 0 2px;
`;

export const Keys = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
`;

export const QuestionNumber = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${C.muted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const Choices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

/** A choice inside a bubble: a pill. */
export const Choice = styled.button<{ $tone?: 'voice' | 'dunno' }>`
  ${buttonReset}
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  background: #ffffff;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'voice' ? C.brand : $tone === 'dunno' ? C.grey : C.brandLine};
  color: ${({ $tone }) =>
    $tone === 'voice' ? C.brandDark : $tone === 'dunno' ? C.muted : C.brandInk};
  border-radius: 999px;
  padding: 6px 12px;
`;

/** The main action of a bubble. */
export const MainButton = styled.button`
  ${buttonReset}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  background: ${C.brand};
  border: none;
  border-radius: 8px;
  padding: 9px 12px;
  min-height: 40px;
`;

export const LinkButton = styled.button`
  ${buttonReset}
  align-self: flex-start;
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  color: ${C.brandInk};
  text-decoration: underline;
  text-align: left;
`;

/** A starting idea: one click puts it in the Assistant's field. */
export const Chip = styled.button`
  ${buttonReset}
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  font-size: 13px;
  color: ${C.brandDark};
  background: #ffffff;
  border: 1px solid ${C.brandLine};
  border-radius: 12px;
  padding: 8px 10px;
`;

const SUITE_TONES = [
  { ink: '#0059b8', line: '#b6cff0' },
  { ink: '#18753c', line: '#b5dfc4' },
  { ink: '#a33a00', line: '#f3c7ab' },
  { ink: C.brandInk, line: C.brandLine },
];

/** A way to go on, coloured by its axis. */
export const Suite = styled.button<{ $tone: number }>`
  ${buttonReset}
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  font-size: 13px;
  background: #ffffff;
  border: 1px solid;
  border-left-width: 4px;
  border-radius: 10px;
  padding: 8px 10px;
  color: ${({ $tone }) => SUITE_TONES[$tone % SUITE_TONES.length].ink};
  border-color: ${({ $tone }) => SUITE_TONES[$tone % SUITE_TONES.length].line};
`;

export const Small = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${C.muted};
  padding-left: 36px;
`;

/** Under Nestor's bubble, aligned with it (past his face). */
/** « Voir des exemples »: one before / after, its rule, and a try. */
export const ExampleBox = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid ${C.line};
  border-radius: 12px;
  background: #ffffff;
  & > button {
    align-self: flex-start;
  }
`;

export const ExampleLine = styled.p<{ $good?: boolean }>`
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: ${({ $good }) => ($good ? C.ink : C.muted)};
  & > span {
    display: inline-block;
    margin-right: 6px;
    padding: 0 6px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    color: ${({ $good }) => ($good ? '#18753c' : C.muted)};
    background: ${({ $good }) => ($good ? '#e8f6ec' : C.soft)};
  }
`;

/** One colour per line of the grid: the same in the analysis and the version. */
export const PART_COLORS: Record<GridPart, { ink: string; soft: string }> = {
  task: { ink: '#2c5cc5', soft: '#e7eefc' },
  reader: { ink: '#18753c', soft: '#e3f4e8' },
  material: { ink: '#9a5200', soft: '#fcefdc' },
  form: { ink: '#7339c9', soft: '#f0e8fc' },
  tone: { ink: '#b8235f', soft: '#fbe6ef' },
};

export const PartLabel = styled.strong<{ $part: GridPart }>`
  color: ${({ $part }) => PART_COLORS[$part].ink};
`;

/** Words of a line of the grid, in the version: underlined in its colour. */
export const PartMark = styled.mark<{ $part: GridPart }>`
  color: inherit;
  background: none;
  border-bottom: 3px solid ${({ $part }) => PART_COLORS[$part].ink};
`;

export const PartKeys = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
`;

/** « Analyser mon texte »: the five lines of a request. */
export const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const GridRow = styled.div<{ $ok: boolean }>`
  display: grid;
  grid-template-columns: 18px 150px 1fr;
  gap: 6px;
  align-items: baseline;
  font-size: 13px;
  & > span:first-child {
    font-weight: 800;
    color: ${({ $ok }) => ($ok ? '#18753c' : C.muted)};
  }
  & > span:last-child {
    color: ${({ $ok }) => ($ok ? C.ink : C.muted)};
    font-style: ${({ $ok }) => ($ok ? 'normal' : 'italic')};
  }
`;

/** A request and its star (« Mes favoris »), side by side. */
export const StarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  & > button:first-child {
    flex: 1;
    min-width: 0;
  }
`;

export const UnderBubble = styled.div`
  padding-left: 36px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/** A round with its label: in the thread (small) or in the bar. */
export const RoundButton = styled.button<{
  $size: 'small' | 'bar';
  $primary?: boolean;
}>`
  ${buttonReset}
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  padding: 0;
  text-align: center;
  font-weight: 600;
  width: ${({ $size }) => ($size === 'bar' ? '84px' : '78px')};
  font-size: ${({ $size }) => ($size === 'bar' ? '12px' : '11.5px')};
  line-height: 1.25;
  color: ${({ $size }) => ($size === 'bar' ? C.ink : C.brandDark)};
  & > span:first-child {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    overflow: hidden;
    flex: none;
    width: ${({ $size }) => ($size === 'bar' ? '48px' : '42px')};
    height: ${({ $size }) => ($size === 'bar' ? '48px' : '42px')};
    border: 1.5px solid
      ${({ $size, $primary }) =>
        $primary ? C.brand : $size === 'bar' ? C.grey : C.brandLine};
    background: ${({ $primary }) => ($primary ? C.brand : '#ffffff')};
    color: ${({ $primary }) => ($primary ? '#ffffff' : C.brand)};
  }
`;

/** Nestor's face in a round: "Demander à Nestor". */
export const FaceRound = styled.span`
  && {
    padding: 0;
    border: 2px solid ${C.brand};
  }
  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

/** The actions of the moment, under Nestor's last bubble. */
export const RoundsTile = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 0 36px;
`;

/** One action of the moment: an icon and what it does, in words. */
export const ActionButton = styled.button<{
  $primary?: boolean;
  /** « Le dire »: the microphone, apart from the other buttons. */
  $voice?: boolean;
}>`
  ${buttonReset}
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  text-align: left;
  border: 1px solid ${C.brand};
  color: ${({ $primary }) => ($primary ? '#ffffff' : C.brandInk)};
  background: ${({ $primary }) => ($primary ? C.brand : '#ffffff')};
  &:hover {
    background: ${({ $primary }) => ($primary ? C.brandInk : C.brandSoft)};
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
  ${({ $voice }) =>
    $voice &&
    css`
      border: 1.5px dashed ${C.muted};
      color: ${C.ink};
      & .material-icons,
      & .material-symbols-outlined {
        color: ${C.record};
      }
    `}
`;

/** The fixed bar: always the same four rounds. */
export const Dock = styled.div`
  flex: none;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid ${C.line};
  background: #ffffff;
`;

export const DockDivider = styled.span`
  width: 1px;
  align-self: stretch;
  background: ${C.line};
  margin: 0 2px;
`;

/** Under a version: what the user can write themselves next time. */
export const Lesson = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-left: 3px solid ${C.brand};
  border-radius: 0 8px 8px 0;
  background: ${C.brandSoft};
  color: ${C.brandDark};
  font-size: 13px;
  line-height: 1.45;
  & > strong {
    font-size: 12px;
  }
`;

/** One line of Nestor's advice: what is good (✓) or what to do (→). */
export const CounselLine = styled.span<{ $tone: 'ok' | 'go' }>`
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 6px;
  & > span:first-child {
    font-weight: 700;
    color: ${({ $tone }) => ($tone === 'ok' ? C.okInk : C.brand)};
  }
`;

/** Why a piece of advice changes the answer. */
export const Why = styled.span`
  color: ${C.muted};
`;

/** One version at the end of the advice: its title, its text, its buttons. */
export const ChoiceCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid ${C.line};
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
  & > p {
    margin: 0;
    white-space: pre-wrap;
  }
`;

/** A request Nestor proposes, shown before it goes to the field. */
export const Proposed = styled.span`
  padding: 6px 10px;
  border-left: 3px solid ${C.brand};
  border-radius: 0 8px 8px 0;
  background: #ffffff;
  white-space: pre-wrap;
`;
