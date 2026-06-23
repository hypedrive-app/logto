import LoadingIcon from './LoadingIcon';
import LoadingMask from './LoadingMask';

export { default as LoadingIcon } from './LoadingIcon';
export { default as LoadingMask } from './LoadingMask';

export const LoadingIconWithContainer = () => (
  <div className="w-[60px] h-[60px] rounded-[13px] bg-[var(--color-bg-toast)] flex flex-col items-center justify-center [&_svg]:text-[var(--color-static-dark-type-primary)]">
    <LoadingIcon />
  </div>
);

const LoadingLayer = () => (
  <LoadingMask>
    <LoadingIconWithContainer />
  </LoadingMask>
);

export default LoadingLayer;
