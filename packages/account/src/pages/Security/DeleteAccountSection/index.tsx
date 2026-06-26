import classNames from 'classnames';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import PageContext from '@ac/Providers/PageContextProvider/PageContext';
import DeleteIcon from '@ac/assets/icons/delete.svg?react';
import { layoutClassNames } from '@ac/constants/layout';

const DeleteAccountSection = () => {
  const { t } = useTranslation();
  const { accountCenterSettings } = useContext(PageContext);

  const deleteAccountUrl = accountCenterSettings?.deleteAccountUrl;

  if (!deleteAccountUrl) {
    return null;
  }

  return (
    <div className={classNames('flex flex-col gap-1.5', layoutClassNames.section)}>
      <div
        className={classNames(
          'ps-1 text-sm font-medium text-ink mobile:ps-0',
          layoutClassNames.sectionTitle
        )}
      >
        {t('account_center.security.account_removal')}
      </div>
      <div
        className={classNames('bg-elevated rounded-[16px] [overflow:clip]', layoutClassNames.card)}
      >
        <div
          className={classNames(
            'flex items-center gap-6 px-6 py-5 h-16 mobile:flex-col mobile:items-stretch mobile:gap-1.5 mobile:h-auto mobile:min-h-0 mobile:p-4',
            layoutClassNames.row
          )}
        >
          <div className="flex-1 flex items-center gap-4 min-w-0 mobile:items-start mobile:gap-3">
            <DeleteIcon className="w-5 h-5 text-ink shrink-0" />
            <div className="min-w-0 text-sm font-medium text-ink mobile:[overflow-wrap:anywhere]">
              {t('account_center.security.delete_your_account')}
            </div>
          </div>
          <a
            className="text-sm font-medium text-danger cursor-pointer bg-none border-none whitespace-nowrap no-underline hover:underline py-0.5 mobile:self-start mobile:p-0 mobile:whitespace-normal mobile:text-start"
            href={deleteAccountUrl}
          >
            {t('account_center.security.delete_account')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountSection;
