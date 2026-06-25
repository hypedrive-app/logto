import { type Log, LogResult } from '@logto/schemas';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import EventName from '@/components/AuditLogTable/components/EventName';
import { LocaleDate } from '@/components/DateTime';
import Card from '@/ds-components/Card';
import CardTitle from '@/ds-components/CardTitle';
import TextLink from '@/ds-components/TextLink';
import type { RequestError } from '@/hooks/use-api';
import { buildUrl } from '@/utils/url';

import styles from './index.module.scss';

const recentLogCount = 6;

/**
 * Dashboard "Recent activity" card — surfaces the latest audit-log events
 * (sign-ins, token exchanges, interactions) so an admin sees live auth activity
 * at a glance, with a link to the full Audit Logs page. Reuses the audit-log
 * `GET /logs` API + the shared EventName row, so no new backend is needed.
 */
function RecentActivity() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  const url = buildUrl('api/logs', { page: String(1), page_size: String(recentLogCount) });
  const { data, error } = useSWR<[Log[], number, boolean], RequestError>(url);

  const logs = data?.[0];
  const isLoading = !data && !error;

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <CardTitle size="medium" title="dashboard.recent_activity" />
        <TextLink to="/audit-logs">{t('dashboard.view_all')}</TextLink>
      </div>
      {isLoading && <div className={styles.placeholder} />}
      {!isLoading && (!logs || logs.length === 0) && (
        <div className={styles.empty}>{t('dashboard.no_recent_activity')}</div>
      )}
      {logs && logs.length > 0 && (
        <ul className={styles.list}>
          {logs.map((log) => (
            <li key={log.id} className={styles.row}>
              <EventName
                eventKey={log.key}
                isSuccess={log.payload.result === LogResult.Success}
                payload={log.payload}
              />
              <LocaleDate format="yyyy-MM-dd HH:mm">{log.createdAt}</LocaleDate>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default RecentActivity;
