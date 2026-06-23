import { type Optional } from '@silverhand/essentials';
import { useCallback } from 'react';
import useSWRImmutable from 'swr/immutable';

import { useCloudApi } from '@/cloud/hooks/use-cloud-api';
import { type RegionResponse as RegionType } from '@/cloud/types/router';

/** Checks if a region is a development-only region based on its name. */
export const isDevOnlyRegion = (regionName?: string): boolean =>
  regionName?.includes('_DEV_') ?? false;

/**
 * Hook to fetch available regions for the current user. Cloud API is required to use this hook.
 */
// Explicit return type: Zod 4's prebuilt `@logto/cloud` types leak a non-portable `TenantTag`
// name through inference (TS4023).
const useAvailableRegions = (): {
  regions: Optional<RegionType[]>;
  regionsError: Optional<Error>;
  getRegionByName: (name: string) => Optional<RegionType>;
} => {
  const cloudApi = useCloudApi();
  const { data: regions, error: regionsError } = useSWRImmutable<RegionType[], Error>(
    'api/me/regions',
    async () => {
      const { regions } = await cloudApi.get('/api/me/regions');
      return regions;
    }
  );
  const getRegionByName = useCallback(
    (name: string) => regions?.find((region) => region.name === name),
    [regions]
  );

  return {
    /** Available regions for the current user. */
    regions,
    /** Error encountered while fetching regions. */
    regionsError,
    /** Function to get a region by its name. If the region is not found, returns undefined. */
    getRegionByName,
  };
};

export default useAvailableRegions;
