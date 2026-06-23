import { PhoneNumberParser } from '@logto/shared/universal';
import i18next from 'i18next';
import type { CountryCode, CountryCallingCode } from 'libphonenumber-js/mobile';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js/mobile';

export const fallbackCountryCode = 'US';

export const countryCallingCodeMap: Record<string, CountryCode> = {
  zh: 'CN',
  en: 'US',
  ja: 'JP',
  ko: 'KR',
};

export const isValidCountryCode = (countryCode: string): countryCode is CountryCode => {
  try {
    // Use getCountryCallingCode method to guard the input's value is in CountryCode union type, if type not match exceptions are expected
    // eslint-disable-next-line no-restricted-syntax
    getCountryCallingCode(countryCode as CountryCode);

    return true;
  } catch {
    return false;
  }
};

export const getDefaultCountryCode = (): CountryCode => {
  const { language } = i18next;

  // Extract the country code from language tag suffix
  const [languageCode, countryCode] = language.split('-');

  if (countryCode && isValidCountryCode(countryCode)) {
    return countryCode;
  }

  const upperCaseLanguageCode = languageCode?.toUpperCase();

  if (upperCaseLanguageCode && isValidCountryCode(upperCaseLanguageCode)) {
    return upperCaseLanguageCode;
  }

  return countryCallingCodeMap[language] ?? fallbackCountryCode;
};

export const getDefaultCountryCallingCode = () => getCountryCallingCode(getDefaultCountryCode());

/**
 * Resolve an ISO country (e.g. "IN") from a bare calling code (e.g. "91"), so the
 * selector trigger can render the matching flag. Several countries can share a calling
 * code (e.g. +1 → US/CA/…); we prefer the locale's default country when it matches, then
 * fall back to the first country libphonenumber lists for that code. Returns undefined
 * when no country uses the code (so callers can skip the flag gracefully).
 */
export const getCountryByCallingCode = (callingCode: string): CountryCode | undefined => {
  const normalized = callingCode.replace(/^\+/, '');

  const defaultCountryCode = getDefaultCountryCode();
  if (getCountryCallingCode(defaultCountryCode) === normalized) {
    return defaultCountryCode;
  }

  return getCountries().find((code) => getCountryCallingCode(code) === normalized);
};

/**
 * Resolve the human-readable, localized country name for a country code using the
 * platform `Intl.DisplayNames` API (built into every modern browser, no extra deps,
 * automatically translated to the active locale). Falls back to the raw code if the
 * API is unavailable or the region is unknown.
 */
export const getCountryName = (countryCode: CountryCode): string => {
  try {
    const displayNames = new Intl.DisplayNames([i18next.language], { type: 'region' });

    return displayNames.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
};

/**
 * Provide Country Code Options
 */
export type CountryMetaData = {
  countryCode: CountryCode;
  countryCallingCode: CountryCallingCode;
  /** Localized, human-readable country name (e.g. "India"). */
  countryName: string;
};

const buildCountryMetaData = (countryCode: CountryCode): CountryMetaData => ({
  countryCode,
  countryCallingCode: getCountryCallingCode(countryCode),
  countryName: getCountryName(countryCode),
});

export const getCountryList = (): CountryMetaData[] => {
  const defaultCountryCode = getDefaultCountryCode();

  const countryList = getCountries()
    .filter((code) => code !== defaultCountryCode)
    .map((code) => buildCountryMetaData(code))
    /**
     * Sort alphabetically by localized country name so the list reads naturally.
     * Note: we intentionally keep every country (no calling-code dedupe) so that
     * regions sharing a calling code — e.g. US/Canada on +1 — are both selectable,
     * distinguished by name and flag.
     */
    .sort((previous, next) =>
      previous.countryName.localeCompare(next.countryName, i18next.language)
    );

  // Pin the detected/default country to the top for quick access.
  return [buildCountryMetaData(defaultCountryCode), ...countryList];
};

export const formatPhoneNumberWithCountryCallingCode = (number: string) => {
  try {
    const phoneNumber = PhoneNumberParser.parse(number);

    return `+${phoneNumber.countryCallingCode} ${phoneNumber.nationalNumber}`;
  } catch {
    return number;
  }
};

export const parsePhoneNumber = (value: string) => {
  try {
    const phoneNumber = PhoneNumberParser.parse(value);

    return {
      countryCallingCode: phoneNumber.countryCallingCode,
      nationalNumber: phoneNumber.nationalNumber,
    };
  } catch {}
};
