import classNames from 'classnames';

import AccountPageHeader from '@ac/components/AccountPageHeader';
import PageFooter from '@ac/components/PageFooter';
import { layoutClassNames } from '@ac/constants/layout';

import DeleteAccountSection from './DeleteAccountSection';
import EmailPhoneSection from './EmailPhoneSection';
import MfaSection from './MfaSection';
import MfaVerificationsProvider from './MfaVerificationsProvider';
import PasskeySection from './PasskeySection';
import PasswordSection from './PasswordSection';
import SocialSection from './SocialSection';
import UsernameSection from './UsernameSection';

const Security = () => {
  return (
    <div className="flex-1 flex flex-col">
      <AccountPageHeader
        titleKey="account_center.page.security_title"
        descriptionKey="account_center.page.security_description"
      />
      <div
        className={classNames(
          'flex-1 flex flex-col gap-5 mobile:gap-4',
          layoutClassNames.pageContent
        )}
      >
        <UsernameSection />
        <EmailPhoneSection />
        <PasswordSection />
        <SocialSection />
        <MfaVerificationsProvider>
          <PasskeySection />
          <MfaSection />
        </MfaVerificationsProvider>
        <DeleteAccountSection />
      </div>
      <PageFooter />
    </div>
  );
};

export default Security;
