import InputField from '@experience/shared/components/InputFields/InputField';
import { SupportedDateFormat } from '@logto/schemas';
import classNames from 'classnames';
import { useMemo, useState } from 'react';

import type { EditableValue } from './utils';

type Props = {
  readonly name: string;
  readonly label: string;
  readonly value: EditableValue;
  readonly dateFormat?: string;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly isRequired: boolean;
  readonly placeholder?: string;
  readonly onChange: (value: string) => void;
};

type DateFormatConfig = {
  separator: string;
  parts: string[];
  maxLengths: number[];
};

const isSupportedDateFormat = (dateFormat?: string): dateFormat is SupportedDateFormat =>
  dateFormat === SupportedDateFormat.US ||
  dateFormat === SupportedDateFormat.UK ||
  dateFormat === SupportedDateFormat.ISO;

const getDateFormatConfig = (dateFormat: SupportedDateFormat): DateFormatConfig => {
  const separator = dateFormat === SupportedDateFormat.ISO ? '-' : '/';
  const parts = dateFormat.split(separator);

  return {
    separator,
    parts,
    maxLengths: parts.map((part) => part.length),
  };
};

const DateField = ({
  name,
  label,
  value,
  dateFormat,
  description,
  errorMessage,
  isRequired,
  placeholder,
  onChange,
}: Props) => {
  const valueString = typeof value === 'boolean' ? '' : value;
  const [isFocused, setIsFocused] = useState(false);
  const formatConfig = useMemo(
    () => (isSupportedDateFormat(dateFormat) ? getDateFormatConfig(dateFormat) : undefined),
    [dateFormat]
  );
  const dateParts = useMemo(() => {
    if (!valueString || !formatConfig) {
      return ['', '', ''];
    }

    return valueString.split(formatConfig.separator);
  }, [formatConfig, valueString]);

  if (!formatConfig) {
    return (
      <InputField
        name={name}
        label={label}
        required={isRequired}
        value={valueString}
        description={description}
        errorMessage={errorMessage}
        isDanger={Boolean(errorMessage)}
        placeholder={placeholder ?? dateFormat}
        onChange={({ currentTarget }) => {
          onChange(currentTarget.value);
        }}
      />
    );
  }

  const isActive = isFocused || Boolean(valueString);

  const handleChange = (index: number, nextValue: string) => {
    const maxLength = formatConfig.maxLengths[index];
    const nextParts = dateParts.map((part, partIndex) =>
      partIndex === index ? nextValue.replaceAll(/\D/g, '').slice(0, maxLength) : part
    );
    const nextDate = nextParts.every((part) => !part) ? '' : nextParts.join(formatConfig.separator);
    onChange(nextDate);
  };

  return (
    <div className="flex flex-col gap-1">
      <div
        data-date-input-wrapper
        className={classNames(
          'relative flex items-center gap-1.5 h-12 px-4 rounded-[11px] border bg-inherit text-ink shadow-[var(--sh-input)] transition-[border-color,box-shadow] duration-150 ease-out',
          isFocused && 'border-primary shadow-[var(--sh-input),0_0_0_3px_var(--color-overlay-brand-focused)]',
          errorMessage && 'border-danger shadow-[var(--sh-input),0_0_0_3px_var(--color-overlay-danger-focused)]',
          !isFocused && !errorMessage && 'border-line-strong'
        )}
      >
        <span
          className={classNames(
            'absolute start-3 px-1 bg-elevated pointer-events-none transition-all',
            isActive
              ? 'top-0 -translate-y-1/2 text-xs text-primary'
              : 'top-1/2 -translate-y-1/2 text-sm text-muted'
          )}
        >
          {label}
        </span>
        {formatConfig.parts.map((part, index) => (
          <div key={`${name}-${part}`} className="flex items-center gap-1.5">
            <input
              className={classNames(
                'w-auto min-w-[2ch] max-w-[5ch] p-0 border-none outline-none bg-inherit text-ink text-sm placeholder:text-muted',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
              name={`${name}.${part}`}
              aria-label={`${label} ${part}`}
              value={dateParts[index] ?? ''}
              placeholder={part.toUpperCase()}
              maxLength={formatConfig.maxLengths[index]}
              inputMode="numeric"
              pattern="[0-9]*"
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={({ currentTarget, relatedTarget }) => {
                const wrapper = currentTarget.closest('[data-date-input-wrapper]');

                if (wrapper?.contains(relatedTarget)) {
                  return;
                }

                setIsFocused(false);
              }}
              onChange={({ currentTarget }) => {
                handleChange(index, currentTarget.value);
              }}
            />
            {index < formatConfig.parts.length - 1 && (
              <span
                className={classNames(
                  'text-[var(--color-line-border)] text-sm',
                  isActive ? 'opacity-100' : 'opacity-0'
                )}
              >
                {formatConfig.separator}
              </span>
            )}
          </div>
        ))}
      </div>
      {description && <div className="ms-0.5 text-sm text-muted">{description}</div>}
      {errorMessage && <div className="ms-0.5 text-sm text-danger">{errorMessage}</div>}
    </div>
  );
};

export default DateField;
