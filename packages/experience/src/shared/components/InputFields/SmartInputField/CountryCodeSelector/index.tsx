import { ChevronDownIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import type { ForwardedRef } from 'react';
import { useState, useMemo, forwardRef } from 'react';

import { onKeyDownHandler } from '@/shared/utils/a11y';
import { getCountryList, getDefaultCountryCallingCode } from '@/utils/country-code';

import CountryCodeDropdown from './CountryCodeDropdown';

type Props = {
  readonly className?: string;
  readonly value?: string;
  readonly inputRef?: React.RefObject<HTMLInputElement | undefined>;
  readonly isVisible?: boolean;
  readonly isInteractive?: boolean;
  readonly onChange?: (value: string) => void;
};

const CountryCodeSelector = (
  { className, value, inputRef, isVisible = true, isInteractive = true, onChange }: Props,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const countryList = useMemo(getCountryList, []);
  const defaultCountCode = useMemo(getDefaultCountryCallingCode, []);

  const showDropDown = () => {
    setIsDropdownOpen(true);
  };

  const hideDropDown = () => {
    setIsDropdownOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const countryCode = value || defaultCountCode;

  return (
    <div
      ref={ref}
      className={classNames(
        'text-base font-medium text-ink border border-transparent rounded-s-[10px] bg-none relative h-full ps-4 pe-1 ' +
          'flex items-center overflow-hidden whitespace-nowrap opacity-0 pointer-events-none ' +
          'focus-visible:border focus-visible:border-[var(--color-brand-default)] ' +
          '[&>svg]:shrink-0 [&>svg]:text-muted [&>svg]:ms-1 [&>svg]:w-4 [&>svg]:h-4 ' +
          'desktop:text-sm desktop:[&>svg]:ms-2 desktop:[&>svg]:w-5 desktop:[&>svg]:h-5',
        isVisible && 'opacity-100 pointer-events-auto',
        className
      )}
      role="button"
      tabIndex={isVisible && isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
      style={isInteractive ? undefined : { pointerEvents: 'none' }}
      onClick={isInteractive ? showDropDown : undefined}
      onKeyDown={
        isInteractive
          ? onKeyDownHandler({
              Enter: showDropDown,
            })
          : undefined
      }
    >
      <span>{`+${countryCode}`}</span>
      <ChevronDownIcon />
      <CountryCodeDropdown
        inputRef={inputRef}
        isOpen={isDropdownOpen}
        countryCode={countryCode}
        countryList={countryList}
        onClose={hideDropDown}
        onChange={onChange}
      />
    </div>
  );
};

export default forwardRef(CountryCodeSelector);
