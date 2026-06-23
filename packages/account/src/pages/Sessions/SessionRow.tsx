import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { layoutClassNames } from '@ac/constants/layout';

import { getSessionDisplayInfo, formatTimestamp, type AccountSession } from './utils';

type SessionRowProps = {
  readonly session: AccountSession;
  readonly isEditable: boolean;
  readonly isCurrent?: boolean;
  readonly onRevoke?: () => void;
};

const SessionRow = ({ session, isEditable, isCurrent, onRevoke }: SessionRowProps) => {
  const { t, i18n } = useTranslation();

  const { name, location, ip } = getSessionDisplayInfo(session);
  const signedInAt = formatTimestamp(session.payload.loginTs, i18n.language);
  const deviceName = name ?? ip ?? signedInAt;

  const metaParts = [location, ip].filter(Boolean);
  const metaText = metaParts.length > 0 ? metaParts.join(' · ') : undefined;

  return (
    <div
      className={classNames(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-6 py-[18px] min-h-[76px] not-last:border-b not-last:border-line mobile:min-h-0 mobile:gap-x-3 mobile:gap-y-2 mobile:p-4 desktop:max-[800px]:min-h-0 desktop:max-[800px]:gap-x-3 desktop:max-[800px]:gap-y-2 desktop:max-[800px]:p-4',
        layoutClassNames.row
      )}
    >
      <div className="col-start-1 flex flex-col gap-1 min-w-0">
        <div className="text-sm font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap mobile:whitespace-normal mobile:break-words mobile:[overflow-wrap:anywhere] desktop:max-[800px]:whitespace-normal desktop:max-[800px]:break-words desktop:max-[800px]:[overflow-wrap:anywhere]">
          {deviceName}
        </div>
        {metaText && (
          <div className="text-xs text-muted overflow-hidden text-ellipsis whitespace-nowrap mobile:whitespace-normal mobile:break-words mobile:[overflow-wrap:anywhere] desktop:max-[800px]:whitespace-normal desktop:max-[800px]:break-words desktop:max-[800px]:[overflow-wrap:anywhere]">
            {metaText}
          </div>
        )}
        <div className="text-xs text-muted overflow-hidden text-ellipsis whitespace-nowrap mobile:whitespace-normal mobile:break-words mobile:[overflow-wrap:anywhere] desktop:max-[800px]:whitespace-normal desktop:max-[800px]:break-words desktop:max-[800px]:[overflow-wrap:anywhere]">
          {t('account_center.sessions.signed_in_at', { date: signedInAt })}
        </div>
      </div>
      <div className="col-start-2 flex items-center shrink-0 mobile:row-start-1 mobile:self-start mobile:justify-self-end desktop:max-[800px]:row-start-1 desktop:max-[800px]:self-start desktop:max-[800px]:justify-self-end">
        {isCurrent ? (
          <span className="chip chip-success">
            <span className="w-2 h-2 rounded-full bg-success" />
            {t('account_center.sessions.current_session')}
          </span>
        ) : (
          isEditable &&
          onRevoke && (
            <button
              type="button"
              className="text-sm font-medium text-danger cursor-pointer bg-none border-none whitespace-nowrap hover:underline"
              onClick={onRevoke}
            >
              {t('account_center.sessions.revoke_session')}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default SessionRow;
