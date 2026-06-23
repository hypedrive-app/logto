import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { type Nullable } from '@silverhand/essentials';
import classNames from 'classnames';
import { useRef, useState, useEffect } from 'react';

import Dropdown, { DropdownItem } from '@/components/Dropdown';
import InputField from '@/shared/components/InputFields/InputField';
import { onKeyDownHandler } from '@/shared/utils/a11y';

type Props = {
  readonly className?: string;
  readonly name?: string;
  readonly options: Array<{ value: string; label: string }>;
  readonly value?: string;
  readonly description?: Nullable<string>;
  readonly label?: string;
  readonly placeholder?: string;
  readonly errorMessage?: string;
  // eslint-disable-next-line react/boolean-prop-naming
  readonly required?: boolean;
  readonly onBlur?: () => void;
  readonly onChange: (value: string) => void;
};

const SelectField = ({
  className,
  name,
  options,
  value,
  description,
  label,
  placeholder,
  errorMessage,
  required,
  onBlur,
  onChange,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(
    options.find((option) => option.value === value)?.label ?? ''
  );
  const [focusedIndex, setFocusedIndex] = useState<number>();
  const optionElementReferences = useRef<Array<HTMLDivElement | undefined>>([]);

  useEffect(() => {
    if (isOpen && focusedIndex !== undefined) {
      optionElementReferences.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  const moveFocus = (direction: 1 | -1) => {
    setFocusedIndex((previous) => {
      if (options.length === 0) {
        return previous;
      }
      if (previous === undefined) {
        return direction === 1 ? 0 : options.length - 1;
      }
      // Wrap around from the start or end
      return (previous + direction + options.length) % options.length;
    });
  };

  const handleArrowNavigation = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (isOpen) {
        moveFocus(event.key === 'ArrowDown' ? 1 : -1);
      } else {
        setIsOpen(true);
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        setFocusedIndex(direction === 1 ? 0 : options.length - 1);
      }
    }
  };

  const handleSelectViaKeyboard = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && isOpen && focusedIndex !== undefined) {
      const targetOption = options[focusedIndex];
      if (targetOption) {
        event.preventDefault();
        onChange(targetOption.value);
        setCurrentValue(targetOption.label);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className={classNames('flex flex-col w-full gap-1', className)}>
      <div
        ref={ref}
        className="cursor-pointer relative [&_.inputWrapper_input]:text-ellipsis [&_.inputWrapper_input]:pe-8 [&_.inputWrapper_input]:cursor-pointer"
      >
        <InputField
          readOnly
          className="inputWrapper"
          name={name}
          label={label}
          placeholder={placeholder}
          isDanger={!!errorMessage}
          required={required}
          value={currentValue}
          onClick={() => {
            setFocusedIndex(undefined);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
              return;
            }
            onKeyDownHandler(() => {
              setFocusedIndex(undefined);
              setIsOpen(true);
            })(event);
            handleArrowNavigation(event);
            handleSelectViaKeyboard(event);
          }}
          onBlur={onBlur}
        />
        <Dropdown
          isFullWidth
          anchorRef={ref}
          className="p-1 max-h-[288px]"
          isOpen={isOpen}
          horizontalAlign="start"
          onClose={() => {
            setIsOpen(false);
          }}
        >
          {options.map((option, index) => (
            <DropdownItem
              key={option.value}
              ref={(element) => {
                // eslint-disable-next-line @silverhand/fp/no-mutation
                optionElementReferences.current[index] = element ?? undefined;
              }}
              onArrowNavigate={moveFocus}
              onClick={() => {
                onChange(option.value);
                setCurrentValue(option.label);
                setIsOpen(false);
              }}
            >
              {option.label}
            </DropdownItem>
          ))}
        </Dropdown>
        <div
          tabIndex={0}
          role="button"
          className={classNames(
            'absolute inset-inline-end-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-muted transition-transform duration-200 ease-in-out focus-visible:rounded-[11px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary',
            isOpen && 'rotate-180'
          )}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
            onKeyDownHandler(() => {
              setIsOpen((previous) => {
                const next = !previous;
                if (next) {
                  setFocusedIndex(undefined);
                }
                return next;
              });
            })(event);
            handleArrowNavigation(event);
          }}
        >
          <ChevronDownIcon className="w-5 h-5" />
        </div>
      </div>
      {description && <div className="ms-0.5 text-sm text-muted">{description}</div>}
      {errorMessage && <div className="ms-0.5 text-sm text-danger">{errorMessage}</div>}
    </div>
  );
};

export default SelectField;
