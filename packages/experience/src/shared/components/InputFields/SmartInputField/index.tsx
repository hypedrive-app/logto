import { XCircleIcon } from '@heroicons/react/24/outline';
import { SignInIdentifier } from '@logto/schemas';
import type { Nullable } from '@silverhand/essentials';
import type { HTMLProps, Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, forwardRef, useMemo } from 'react';

import usePasskeyAutofillConditionalUI from '@/hooks/use-passkey-autofill-conditional-ui';
import IconButton from '@/shared/components/IconButton';
import InputField from '@/shared/components/InputFields/InputField';

import CountryCodeSelector from './CountryCodeSelector';
import type { IdentifierInputType, IdentifierInputValue } from './use-smart-input-field';
import useSmartInputField from './use-smart-input-field';
import { getInputHtmlProps } from './utils';

export type { IdentifierInputType, IdentifierInputValue } from './use-smart-input-field';

type Props = Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'prefix' | 'value'> & {
  readonly className?: string;
  readonly errorMessage?: string;
  readonly isDanger?: boolean;
  readonly enabledTypes?: IdentifierInputType[];
  readonly defaultValue?: string;
  readonly onChange?: (data: IdentifierInputValue) => void;
};

const SmartInputField = (
  { defaultValue, enabledTypes = [], onChange, ...rest }: Props,
  ref: Ref<Nullable<HTMLInputElement>>
) => {
  const innerRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => innerRef.current);
  const isInputEditable = !rest.readOnly && !rest.disabled;

  const {
    countryCode,
    onCountryCodeChange,
    inputValue,
    onInputValueChange,
    onInputValueClear,
    identifierType,
  } = useSmartInputField({
    defaultValue,
    enabledTypes,
  });

  const isPrefixVisible = identifierType === SignInIdentifier.Phone;

  useEffect(() => {
    onChange?.({
      type: identifierType,
      value: isPrefixVisible && inputValue ? `${countryCode}${inputValue}` : inputValue,
    });
  }, [countryCode, identifierType, inputValue, isPrefixVisible, onChange]);

  const { isPasskeyAutofillEnabled, abortConditionalUI } = usePasskeyAutofillConditionalUI();

  const inputHtmlProps = useMemo(() => {
    const { autoComplete, ...rest } = getInputHtmlProps(enabledTypes, identifierType);
    return {
      ...rest,
      // Compose the type-specific token (email/tel/username) with `webauthn` so the
      // browser keeps both email autofill AND passkey autofill working together.
      // A flat `username webauthn` discarded the field-type token (e.g. `email`).
      autoComplete: isPasskeyAutofillEnabled ? `${autoComplete} webauthn` : autoComplete,
    };
  }, [enabledTypes, identifierType, isPasskeyAutofillEnabled]);

  useEffect(() => {
    return () => {
      abortConditionalUI();
    };
  }, [abortConditionalUI]);

  return (
    <InputField
      {...inputHtmlProps}
      {...rest}
      ref={innerRef}
      isSuffixFocusVisible={isInputEditable && Boolean(inputValue)}
      value={inputValue}
      isPrefixVisible={isPrefixVisible}
      // The country selector is a STATIC, in-flow prefix (only for the phone identifier).
      // No react-spring width animation / absolute positioning / opacity toggle — that
      // architecture left the trigger un-tappable on iOS. Conditionally rendering a real
      // flex child gives a reliable tap target on every device.
      prefix={
        isPrefixVisible ? (
          <CountryCodeSelector
            value={countryCode}
            inputRef={innerRef}
            isInteractive={isInputEditable}
            onChange={(value) => {
              onCountryCodeChange(value);
              // Return focus to the number input right after picking a country.
              innerRef.current?.focus();
            }}
          />
        ) : undefined
      }
      suffix={
        isInputEditable ? (
          <IconButton
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={onInputValueClear}
          >
            <XCircleIcon className="w-5 h-5" />
          </IconButton>
        ) : undefined
      }
      onChange={isInputEditable ? onInputValueChange : undefined}
    />
  );
};

export default forwardRef(SmartInputField);
