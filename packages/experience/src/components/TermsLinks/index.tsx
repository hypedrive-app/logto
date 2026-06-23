import { useTranslation } from 'react-i18next';

import TextLink, { type Props as TextLinkProps } from '@/components/TextLink';

type Props = {
  readonly linkType?: TextLinkProps['type'];
  // eslint-disable-next-line react/boolean-prop-naming
  readonly inline?: boolean;
  readonly termsOfUseUrl?: string;
  readonly privacyPolicyUrl?: string;
};

const TermsLinks = ({ inline, termsOfUseUrl, privacyPolicyUrl, linkType = 'secondary' }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      {termsOfUseUrl && (
        <TextLink
          className="inline"
          text="description.terms_of_use"
          href={termsOfUseUrl}
          type={linkType}
          target="_blank"
          onClick={(event) => {
            event.stopPropagation();
          }}
        />
      )}
      {termsOfUseUrl && privacyPolicyUrl && inline && ` ${t('description.and')} `}
      {termsOfUseUrl && privacyPolicyUrl && !inline && (
        <i className='w-px mx-3 relative after:content-[""] after:block after:w-px after:h-2.5 after:absolute after:top-1/2 after:left-1/2 after:bg-line after:-translate-x-1/2 after:-translate-y-1/2' />
      )}
      {privacyPolicyUrl && (
        <TextLink
          className="inline"
          text="description.privacy_policy"
          href={privacyPolicyUrl}
          type={linkType}
          target="_blank"
          onClick={(event) => {
            event.stopPropagation();
          }}
        />
      )}
    </>
  );
};

export default TermsLinks;
