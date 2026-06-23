import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { layoutClassNames } from '@ac/constants/layout';

import { formatTimestamp, type GrantedAppRow } from './utils';

type GrantRowProps = {
  readonly app: GrantedAppRow;
  readonly isEditable: boolean;
  readonly isRemoving: boolean;
  readonly onRevoke?: () => void;
};

const GrantRow = ({ app, isEditable, isRemoving, onRevoke }: GrantRowProps) => {
  const { t, i18n } = useTranslation();

  return (
    <div
      className={classNames(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-6 py-[18px] min-h-[76px] not-last:border-b not-last:border-line mobile:min-h-0 mobile:gap-x-3 mobile:gap-y-2 mobile:p-4 desktop:max-[800px]:min-h-0 desktop:max-[800px]:gap-x-3 desktop:max-[800px]:gap-y-2 desktop:max-[800px]:p-4',
        layoutClassNames.row
      )}
    >
      <div className="col-start-1 flex flex-col gap-1 min-w-0">
        <div className="text-sm font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap mobile:whitespace-normal mobile:break-words mobile:[overflow-wrap:anywhere] desktop:max-[800px]:whitespace-normal desktop:max-[800px]:break-words desktop:max-[800px]:[overflow-wrap:anywhere]">
          {app.applicationName}
        </div>
        <div className="text-xs text-muted overflow-hidden text-ellipsis whitespace-nowrap mobile:whitespace-normal mobile:break-words mobile:[overflow-wrap:anywhere] desktop:max-[800px]:whitespace-normal desktop:max-[800px]:break-words desktop:max-[800px]:[overflow-wrap:anywhere]">
          {t('account_center.sessions.granted_at', {
            date: formatTimestamp(app.iat, i18n.language),
          })}
        </div>
      </div>
      <div className="col-start-2 flex items-center shrink-0 mobile:row-start-1 mobile:self-start mobile:justify-self-end desktop:max-[800px]:row-start-1 desktop:max-[800px]:self-start desktop:max-[800px]:justify-self-end">
        {isEditable && onRevoke && (
          <button
            type="button"
            className="text-sm font-medium text-danger cursor-pointer bg-none border-none whitespace-nowrap hover:underline py-0.5"
            disabled={isRemoving}
            onClick={onRevoke}
          >
            {t('account_center.sessions.revoke_grant')}
          </button>
        )}
      </div>
    </div>
  );
};

export default GrantRow;
