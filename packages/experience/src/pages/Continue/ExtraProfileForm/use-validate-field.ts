import { isValidUrl } from '@logto/core-kit';
import {
  CustomProfileFieldType,
  SupportedDateFormat,
  type FieldPart,
  type CustomProfileFieldBaseConfig,
} from '@logto/schemas';
import { format, parse, isValid } from 'date-fns';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { dateFieldConfigGuard } from '@/types/guard';

import useFieldLabel from './use-field-label';

const isValidDateField = (value: unknown, config: CustomProfileFieldBaseConfig): boolean => {
  const stringValue = z.string().parse(value);
  const parsedConfig = dateFieldConfigGuard.parse(config);
  const dateFormat = z
    .string()
    .parse(
      parsedConfig.format === SupportedDateFormat.Custom
        ? parsedConfig.customFormat
        : parsedConfig.format
    );
  const parsedDate = parse(stringValue, dateFormat, new Date(), {
    useAdditionalDayOfYearTokens: true,
    useAdditionalWeekYearTokens: true,
  });

  return isValid(parsedDate) && format(parsedDate, dateFormat) === stringValue;
};

const isValidRegexField = (value: unknown, config: CustomProfileFieldBaseConfig): boolean => {
  const stringValue = z.string().parse(value);
  const regexString = z.string().parse(config.format);
  const regex = new RegExp(regexString);
  return regex.test(stringValue);
};

const isValidUrlField = (value: unknown): boolean => {
  const stringValue = z.string().parse(value);

  return isValidUrl(stringValue);
};

const isValidNumberRange = (value: unknown, config: CustomProfileFieldBaseConfig): boolean => {
  const stringValue = z.string().parse(value);
  const parsedNumber = Number(stringValue);
  return (
    !Number.isNaN(parsedNumber) &&
    (config.minValue === undefined || parsedNumber >= config.minValue) &&
    (config.maxValue === undefined || parsedNumber <= config.maxValue)
  );
};

const isValidTextLengthRange = (value: unknown, config: CustomProfileFieldBaseConfig): boolean => {
  const stringValue = z.string().parse(value);

  return (
    (!config.maxLength || stringValue.length <= config.maxLength) &&
    (!config.minLength || stringValue.length >= config.minLength)
  );
};

const useValidateField = () => {
  const { t } = useTranslation();
  const getFieldLabel = useFieldLabel();

  const validate = useCallback(
    (value: unknown, field: Omit<FieldPart, 'enabled'>) => {
      const { type, name, label, required, config = {} } = field;
      const labelWithI18nFallback = getFieldLabel(name, label);
      const generalInvalidMessage = t('error.general_invalid', { types: [labelWithI18nFallback] });
      const generalRequireMessage = t('error.general_required', { types: [labelWithI18nFallback] });

      if (!value) {
        return !required || generalRequireMessage;
      }

      if (type === CustomProfileFieldType.Date) {
        return isValidDateField(value, config) || generalInvalidMessage;
      }

      if (type === CustomProfileFieldType.Regex) {
        return isValidRegexField(value, config) || generalInvalidMessage;
      }

      if (type === CustomProfileFieldType.Url) {
        return isValidUrlField(value) || generalInvalidMessage;
      }

      if (type === CustomProfileFieldType.Number) {
        if (Number.isNaN(Number(value))) {
          return generalInvalidMessage;
        }
        return (
          isValidNumberRange(value, config) ||
          t('error.invalid_min_max_input', {
            minValue: config.minValue,
            maxValue: config.maxValue,
          })
        );
      }

      if (type === CustomProfileFieldType.Text) {
        return (
          isValidTextLengthRange(value, config) ||
          t('error.invalid_min_max_length', {
            minLength: config.minLength,
            maxLength: config.maxLength,
          })
        );
      }

      return true;
    },
    [t, getFieldLabel]
  );

  return validate;
};

export default useValidateField;
