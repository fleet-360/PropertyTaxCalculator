import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/lib/models/SystemConfig';
import type { CalculatorFeatureConfig, ISystemConfigData } from '@/lib/types/system-config';
import { toCalculatorFeatureConfig } from '@/lib/types/system-config';

/** Loads SystemConfig from DB and returns plain calculator-facing flags + prices (server-only). */
export async function loadCalculatorFeatureConfig(): Promise<CalculatorFeatureConfig> {
  await dbConnect();
  const config = await SystemConfig.getConfig();
  const plain = JSON.parse(JSON.stringify(config)) as Partial<ISystemConfigData>;
  return toCalculatorFeatureConfig(plain);
}
