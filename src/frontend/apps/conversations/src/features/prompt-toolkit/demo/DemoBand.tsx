import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { barLabel } from '../chat/labels';
import type { BarAction } from '../chat/types';
import { C } from '../chat/ui';
import { DEMO_STEPS, stopDemo } from '../stores/useDemoStore';

const Band = styled.div`
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: #fff1e6;
  color: #8a3a00;
  border-bottom: 1px solid #f3d3b8;
  font-size: 13.5px;
  & > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 10px;
  }
  & button {
    font: inherit;
    font-weight: 700;
    color: inherit;
    background: #ffffff;
    border: 1px solid currentColor;
    border-radius: 999px;
    padding: 2px 12px;
    cursor: pointer;
  }
  & p {
    margin: 0;
    font-weight: 700;
    color: ${C.ink};
  }
`;

/** Always there during the demo: what it is, the next step, the way out. */
export const DemoBand = ({ next }: { next?: BarAction }) => {
  const { t } = useTranslation();
  return (
    <Band role="region" aria-label={t('Demo mode')}>
      <div>
        <strong>{t('Demo mode: the real buttons, on an example')}</strong>
        <button type="button" onClick={stopDemo}>
          {t('Quit the demo')}
        </button>
      </div>
      <p>
        {next
          ? t('Step {{n}} of {{total}}: click « {{button}} », at the bottom.', {
              n: DEMO_STEPS.indexOf(next) + 1,
              total: DEMO_STEPS.length,
              button: barLabel(t, next),
            })
          : t('Demo over: try the buttons again as you like.')}
      </p>
    </Band>
  );
};
