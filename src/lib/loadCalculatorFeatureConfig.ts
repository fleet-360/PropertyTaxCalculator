import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/lib/models/SystemConfig';
import type { CalculatorFeatureConfig, ISystemConfigData } from '@/lib/types/system-config';
import { toCalculatorFeatureConfig } from '@/lib/types/system-config';

/** Cached cross-request fetch of SystemConfig (revalidates every 5 minutes). */
const getCachedConfig = unstable_cache(
  async () => {
    await dbConnect();
    const config = await SystemConfig.getConfig();
    return JSON.parse(JSON.stringify(config)) as Partial<ISystemConfigData>;
  },
  ['system-config'],
  { revalidate: 300, tags: ['system-config'] },
);

/** Loads SystemConfig from DB and returns plain calculator-facing flags + prices (server-only). */
export const loadCalculatorFeatureConfig = cache(
  async (): Promise<CalculatorFeatureConfig> => {
    const plain = await getCachedConfig();
    return toCalculatorFeatureConfig(plain);
  },
);
