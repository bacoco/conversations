import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon } from '@/components';

import { C } from '../chat/ui';

import { badgeText, levelName } from './labels';
import type { Progress } from './progress';
import { BADGES } from './useRewardsStore';

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${C.line};
  border-radius: 12px;
  background: #ffffff;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  & > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
`;

const Muted = styled.span`
  font-size: 12px;
  color: ${C.muted};
  line-height: 1.45;
`;

const Bar = styled.div<{ $share: number }>`
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: ${C.soft};
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $share }) => $share}%;
    background: ${C.brand};
  }
`;

const Badges = styled.details`
  font-size: 13px;
  & > summary {
    cursor: pointer;
    font-weight: 600;
    color: ${C.brandInk};
  }
  & > ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
`;

const BadgeRow = styled.li<{ $earned: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: ${({ $earned }) => ($earned ? C.ink : C.muted)};
  & > div {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
`;

/**
 * « Mon niveau »: the level, the points to the next one and the badges,
 * each not earned yet with what to do to earn it. Only the user's own
 * use: no ranking, no comparison with anyone.
 */
export const LevelCard = ({
  progress,
  lessonsTotal,
}: {
  progress: Progress;
  lessonsTotal: number;
}) => {
  const { t } = useTranslation();
  const { points, level, next, earned } = progress;
  const share = next
    ? Math.round(((points - level.from) / (next.from - level.from)) * 100)
    : 100;

  return (
    <Card aria-label={t('My level')}>
      <Head>
        <Icon iconName="military_tech" $size="28px" $theme="brand" />
        <div>
          <strong>{levelName(level.id, t)}</strong>
          <Muted>
            {next
              ? t('{{points}} points · {{left}} more to reach {{next}}', {
                  points,
                  left: next.from - points,
                  next: levelName(next.id, t),
                })
              : t('{{points}} points · highest level reached', { points })}
          </Muted>
        </div>
      </Head>
      <Bar aria-hidden="true" $share={Math.max(0, Math.min(100, share))} />
      <Badges>
        <summary>
          {t('My badges: {{earned}} of {{total}}', {
            earned: earned.length,
            total: BADGES.length,
          })}
        </summary>
        <ul>
          {BADGES.map((badge) => {
            const isEarned = earned.includes(badge.id);
            const text = badgeText(badge.id, t, lessonsTotal);
            return (
              <BadgeRow key={badge.id} $earned={isEarned}>
                <Icon
                  iconName={isEarned ? badge.icon : 'lock'}
                  $size="20px"
                  $theme={isEarned ? 'brand' : 'neutral'}
                />
                <div>
                  <strong>{text.title}</strong>
                  {isEarned ? (
                    <span className="sr-only">{t('Earned')}</span>
                  ) : (
                    <Muted>{text.how}</Muted>
                  )}
                </div>
              </BadgeRow>
            );
          })}
        </ul>
      </Badges>
      <Muted>
        {t(
          'Points come from what you do with Nestor: requests analysed or improved, lessons, quizzes, practical cases.',
        )}{' '}
        {t('Your points stay in this browser; nobody else sees them.')}
      </Muted>
    </Card>
  );
};
