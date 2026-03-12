import manifest from '../../data/vans/manifest.json';
import transit148 from '../../data/vans/transit_148_hr.json';
import type { VanDefinition } from '../../types/van';

const VAN_MAP: Record<string, VanDefinition> = {
  transit_148_hr: transit148 as VanDefinition,
};

export function listVanDefinitions() {
  return manifest as Array<{ id: string; label: string }>;
}

export function loadVanDefinition(vanId: string): VanDefinition {
  const van = VAN_MAP[vanId];
  if (!van) {
    throw new Error(`Unknown van definition: ${vanId}`);
  }
  return van;
}
