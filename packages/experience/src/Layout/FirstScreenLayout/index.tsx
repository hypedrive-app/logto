import { type ReactNode, useContext } from 'react';

import PageContext from '@/Providers/PageContextProvider/PageContext';
import PageMeta from '@/shared/components/PageMeta';
import type { Props as PageMetaProps } from '@/shared/components/PageMeta';

type Props = {
  readonly children: ReactNode;
  readonly pageMeta: PageMetaProps;
};

const FirstScreenLayout = ({ children, pageMeta }: Props) => {
  const { platform } = useContext(PageContext);

  return (
    <>
      <PageMeta {...pageMeta} />
      {platform === 'web' && <div className="desktop:flex-[3]" />}
      <div className="mx-auto flex w-full max-w-[var(--max-w)] flex-1 flex-col self-stretch [&>*:last-child]:mb-0 desktop:py-6">
        {children}
      </div>
      {platform === 'web' && <div className="desktop:flex-[5]" />}
    </>
  );
};

export default FirstScreenLayout;
