import { describe, it, expect } from 'vitest';

import { LogtoAcrValues, acrRank, acrSatisfies, acrMax } from '../consts/oidc.js';

import { resolveRequiredAcr, evaluateAcr, AcrShortfallReason } from './acr.js';

describe('acrRank', () => {
  it('orders the built-in ladder pwd < mfa < phr', () => {
    expect(acrRank(LogtoAcrValues.Password)).toBeLessThan(acrRank(LogtoAcrValues.Mfa));
    expect(acrRank(LogtoAcrValues.Mfa)).toBeLessThan(acrRank(LogtoAcrValues.PhishingResistant));
  });

  it('ranks unknown / undefined below the baseline so they never satisfy a requirement', () => {
    expect(acrRank()).toBe(-1);
    expect(acrRank('urn:example:unknown')).toBe(-1);
    expect(acrRank()).toBeLessThan(acrRank(LogtoAcrValues.Password));
  });
});

describe('acrSatisfies', () => {
  it('a stronger or equal session ACR satisfies the requirement', () => {
    expect(acrSatisfies(LogtoAcrValues.PhishingResistant, LogtoAcrValues.Mfa)).toBe(true);
    expect(acrSatisfies(LogtoAcrValues.Mfa, LogtoAcrValues.Mfa)).toBe(true);
  });

  it('a weaker or absent session ACR does not satisfy the requirement', () => {
    expect(acrSatisfies(LogtoAcrValues.Password, LogtoAcrValues.Mfa)).toBe(false);
    expect(acrSatisfies(undefined, LogtoAcrValues.Mfa)).toBe(false);
  });
});

describe('acrMax', () => {
  it('returns the strongest recognized ACR', () => {
    expect(
      acrMax(LogtoAcrValues.Password, LogtoAcrValues.PhishingResistant, LogtoAcrValues.Mfa)
    ).toBe(LogtoAcrValues.PhishingResistant);
  });

  it('ignores unknown / undefined inputs', () => {
    expect(acrMax(undefined, 'urn:example:unknown', LogtoAcrValues.Mfa)).toBe(LogtoAcrValues.Mfa);
  });

  it('returns undefined when nothing is recognized', () => {
    expect(acrMax(undefined, 'nope')).toBeUndefined();
  });
});

describe('resolveRequiredAcr', () => {
  it('takes the strongest requirement across every level (a single scope can elevate the request)', () => {
    expect(
      resolveRequiredAcr({
        scopeAcrs: [null, LogtoAcrValues.PhishingResistant],
        resourceDefaultAcr: LogtoAcrValues.Mfa,
        applicationDefaultAcrs: [LogtoAcrValues.Password],
        organizationMinAcr: LogtoAcrValues.Mfa,
      })
    ).toBe(LogtoAcrValues.PhishingResistant);
  });

  it('falls back down the precedence chain when stronger levels are absent', () => {
    expect(resolveRequiredAcr({ scopeAcrs: [null], resourceDefaultAcr: LogtoAcrValues.Mfa })).toBe(
      LogtoAcrValues.Mfa
    );
    expect(resolveRequiredAcr({ applicationDefaultAcrs: [LogtoAcrValues.Mfa] })).toBe(
      LogtoAcrValues.Mfa
    );
    expect(resolveRequiredAcr({ organizationMinAcr: LogtoAcrValues.PhishingResistant })).toBe(
      LogtoAcrValues.PhishingResistant
    );
  });

  it('returns undefined when nothing requires step-up', () => {
    expect(resolveRequiredAcr({})).toBeUndefined();
    expect(
      resolveRequiredAcr({ scopeAcrs: [null, undefined], resourceDefaultAcr: null })
    ).toBeUndefined();
  });
});

describe('evaluateAcr', () => {
  const now = 1_000_000;

  it('is satisfied when the session ACR is strong enough and fresh', () => {
    expect(
      evaluateAcr(
        { acr: LogtoAcrValues.Mfa, acrEstablishedAt: now - 60 },
        LogtoAcrValues.Mfa,
        now,
        300
      )
    ).toBeUndefined();
  });

  it('reports Insufficient when the session ACR is too weak', () => {
    expect(evaluateAcr({ acr: LogtoAcrValues.Password }, LogtoAcrValues.Mfa, now)).toBe(
      AcrShortfallReason.Insufficient
    );
  });

  it('reports Stale when strong enough but outside the freshness window', () => {
    expect(
      evaluateAcr(
        { acr: LogtoAcrValues.Mfa, acrEstablishedAt: now - 600 },
        LogtoAcrValues.Mfa,
        now,
        300
      )
    ).toBe(AcrShortfallReason.Stale);
  });

  it('skips the freshness check when no TTL is given', () => {
    expect(evaluateAcr({ acr: LogtoAcrValues.Mfa }, LogtoAcrValues.Mfa, now)).toBeUndefined();
  });
});
