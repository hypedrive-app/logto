import classNames from 'classnames';
import { type FunctionComponent, type SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { layoutClassNames } from '@ac/constants/layout';

export type SecurityRowData = {
  key: string;
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  label: string;
  value?: string;
  isPlainValue?: boolean;
  isConfigured: boolean;
  action?: { label: string; handler: () => void };
};

type Props = {
  readonly row: SecurityRowData;
};

const SecurityRow = ({ row }: Props) => {
  const { t } = useTranslation();
  const { icon: Icon, label, value, isPlainValue, isConfigured, action } = row;

  return (
    <div
      className={classNames(
        'items-center not-last:border-b not-last:border-line',
        'desktop:grid desktop:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] desktop:[grid-auto-flow:dense] desktop:gap-x-6 desktop:px-6 desktop:py-5 desktop:min-h-[76px]',
        'mobile:flex mobile:flex-col mobile:items-stretch mobile:gap-1 mobile:p-4',
        layoutClassNames.row
      )}
    >
      <div className="desktop:contents mobile:flex mobile:items-center mobile:justify-between mobile:gap-3 mobile:w-full">
        <div className="flex items-center justify-self-start shrink-0 desktop:col-start-1 desktop:row-start-1">
          <Icon className="w-5 h-5 text-ink shrink-0" />
        </div>
        {action && (
          <div className="flex items-center gap-4 shrink-0 desktop:col-start-3 mobile:flex-wrap mobile:justify-end">
            <button
              type="button"
              className="text-sm font-medium text-primary cursor-pointer bg-none border-none whitespace-nowrap hover:underline desktop:py-0.5 mobile:p-0 mobile:whitespace-normal mobile:text-start"
              onClick={action.handler}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      <div className="min-w-0 text-sm font-medium text-ink desktop:col-start-1 desktop:row-start-1 desktop:ps-[calc(20px+1rem)] mobile:ps-0 mobile:w-full mobile:[overflow-wrap:anywhere] mobile:break-words">
        {label}
      </div>
      <div className="flex items-center min-w-0 desktop:col-start-2 mobile:w-full mobile:items-start">
        {isConfigured ? (
          isPlainValue ? (
            <span className="text-sm text-ink mobile:[overflow-wrap:anywhere] mobile:break-words">
              {value}
            </span>
          ) : (
            <span className="chip chip-success mobile:max-w-full mobile:flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              {value}
            </span>
          )
        ) : (
          <span className="text-sm text-muted mobile:[overflow-wrap:anywhere] mobile:break-words">
            {t('account_center.security.not_configured')}
          </span>
        )}
      </div>
    </div>
  );
};

export default SecurityRow;
