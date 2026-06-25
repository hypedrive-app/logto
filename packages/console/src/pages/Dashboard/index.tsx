import { format, startOfDay } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useSWR from 'swr';

import BarGraph from '@/assets/icons/bar-graph.svg?react';
import Calendar from '@/assets/icons/calendar.svg?react';
import UserIcon from '@/assets/icons/user.svg?react';
import AppError from '@/components/AppError';
import EmptyDataPlaceholder from '@/components/EmptyDataPlaceholder';
import PageMeta from '@/components/PageMeta';
import Card from '@/ds-components/Card';
import CardTitle from '@/ds-components/CardTitle';
import DatePicker from '@/ds-components/DatePicker';
import type { RequestError } from '@/hooks/use-api';

import Block from './components/Block';
import ChartTooltip from './components/ChartTooltip';
import RecentActivity from './components/RecentActivity';
import Skeleton from './components/Skeleton';
import styles from './index.module.scss';
import type { ActiveUsersResponse, NewUsersResponse, TotalUsersResponse } from './types';

const tickStyle = {
  fill: 'var(--color-text-secondary)',
  fontSize: 11,
  fontFamily: 'var(--font-family)',
};

const tickFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  notation: 'compact',
});

function Dashboard() {
  const [date, setDate] = useState<Date>(() => startOfDay(new Date()));
  const dateString = format(date, 'yyyy-MM-dd');
  const { data: totalData, error: totalError } = useSWR<TotalUsersResponse, RequestError>(
    'api/dashboard/users/total'
  );
  const { data: newData, error: newError } = useSWR<NewUsersResponse, RequestError>(
    'api/dashboard/users/new'
  );
  const { data: activeData, error: activeError } = useSWR<ActiveUsersResponse, RequestError>(
    `api/dashboard/users/active?date=${dateString}`
  );
  const { t, i18n } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const isRtl = i18n.dir() === 'rtl';

  const areaChartData = useMemo(() => {
    const chartData = activeData?.dauCurve.map((item) => ({
      ...item,
      // Remove "year" for a compact label.
      date: item.date.replace(/\d{4}-/, ''),
    }));

    if (isRtl) {
      // eslint-disable-next-line @silverhand/fp/no-mutating-methods
      return chartData?.slice().reverse();
    }
    return chartData;
  }, [activeData?.dauCurve, isRtl]);

  // Pick an error as the page's error
  const error = totalError ?? newError ?? activeError;
  const isLoading = (!totalData || !newData || !activeData) && !error;

  const handleDateChange = (next: Date | undefined) => {
    // Mirror the previous native-input behavior: clearing the field falls
    // back to today so the chart always has a date to query.
    setDate(startOfDay(next ?? new Date()));
  };

  return (
    <div className={styles.container}>
      <PageMeta titleKey="dashboard.title" />
      <CardTitle
        className={styles.header}
        title="dashboard.title"
        subtitle="dashboard.description"
      />
      {isLoading && <Skeleton />}
      {error && <AppError errorMessage={error.body?.message} />}
      {!isLoading && totalData && newData && activeData && totalData.totalUserCount === 0 && (
        <Card className={styles.emptyCard}>
          <EmptyDataPlaceholder size="large" title={t('dashboard.empty_title')} />
          <div className={styles.emptyDescription}>{t('dashboard.empty_description')}</div>
        </Card>
      )}
      {!isLoading && totalData && newData && activeData && totalData.totalUserCount > 0 && (
        <>
          <div className={styles.blocks}>
            <Block
              icon={<UserIcon />}
              title="dashboard.total_users"
              tip={t('dashboard.total_users_tip')}
              count={totalData.totalUserCount}
            />
            <Block
              icon={<UserIcon />}
              title="dashboard.new_users_today"
              tip={t('dashboard.new_users_today_tip')}
              count={newData.today.count}
              delta={newData.today.delta}
              caption={t('dashboard.vs_yesterday')}
            />
            <Block
              icon={<UserIcon />}
              title="dashboard.new_users_7_days"
              tip={t('dashboard.new_users_7_days_tip')}
              count={newData.last7Days.count}
              delta={newData.last7Days.delta}
              caption={t('dashboard.vs_previous_7_days')}
            />
          </div>
          <Card className={styles.activeCard}>
            <div className={styles.activeHeader}>
              <Block
                title="dashboard.daily_active_users"
                tip={t('dashboard.daily_active_users_tip')}
                count={activeData.dau.count}
                delta={activeData.dau.delta}
                variant="plain"
              />
              <div className={styles.datePicker}>
                <DatePicker
                  value={date}
                  max={startOfDay(new Date())}
                  todayLabel={t('general.today')}
                  onChange={handleDateChange}
                />
              </div>
            </div>
            <div className={styles.curveLabel}>{t('dashboard.active_users_last_30_days')}</div>
            <div className={styles.curve}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    {/* Soft vertical gradient under the curve for a cleaner, less flat fill. */}
                    <linearGradient id="dashboard-area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-divider)"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#dashboard-area-fill)"
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      stroke: 'var(--color-layer-1)',
                      fill: 'var(--color-primary)',
                    }}
                    animationDuration={isRtl ? 0 : 1500}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={tickStyle}
                    tickMargin={8}
                    minTickGap={24}
                  />
                  <YAxis
                    width={35}
                    orientation={isRtl ? 'right' : 'left'}
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                    tickFormatter={(tick) => tickFormatter.format(Number(tick)).toLowerCase()}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{
                      stroke: 'var(--color-primary)',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                      strokeOpacity: 0.5,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.blocks}>
              <Block
                icon={<Calendar />}
                title="dashboard.weekly_active_users"
                tip={t('dashboard.weekly_active_users_tip')}
                count={activeData.wau.count}
                delta={activeData.wau.delta}
                variant="bordered"
              />
              <Block
                icon={<BarGraph />}
                title="dashboard.monthly_active_users"
                tip={t('dashboard.monthly_active_users_tip')}
                count={activeData.mau.count}
                delta={activeData.mau.delta}
                variant="bordered"
              />
            </div>
          </Card>
          <RecentActivity />
        </>
      )}
    </div>
  );
}

export default Dashboard;
