import { type ReactNode } from 'react';

type Props = {
  readonly children?: ReactNode;
};

const LoadingMask = ({ children }: Props) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[var(--z-loading)] bg-[var(--color-bg-mask)] animate-[loading-mask-fade-in_0.15s_ease-out] motion-reduce:animate-none">
      {children}
    </div>
  );
};

export default LoadingMask;
