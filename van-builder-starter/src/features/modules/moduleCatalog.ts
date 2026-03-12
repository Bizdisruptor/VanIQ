import type { ModuleDefinition } from '../../types/module';

export const moduleCatalog: ModuleDefinition[] = [
  {
    id: 'bed_fixed',
    type: 'bed',
    label: 'Fixed Bed',
    views: ['plan', 'driver_elev', 'passenger_elev', 'rear_elev'],
    defaultSize: { width: 60, depth: 75, height: 36 },
    resizable: true,
    rotatable: true,
    lockable: true,
  },
  {
    id: 'galley_standard',
    type: 'galley',
    label: 'Galley',
    views: ['plan', 'driver_elev', 'passenger_elev'],
    defaultSize: { width: 24, depth: 48, height: 36 },
    resizable: true,
    rotatable: true,
    lockable: true,
  },
  {
    id: 'roof_rack_standard',
    type: 'roof_rack',
    label: 'Roof Rack',
    views: ['roof'],
    defaultSize: { width: 52, depth: 96, height: 2 },
    resizable: true,
    rotatable: false,
    lockable: true,
  },
  {
    id: 'roof_fan_14x14',
    type: 'roof_fan',
    label: 'Roof Fan 14x14',
    views: ['roof', 'plan'],
    defaultSize: { width: 14, depth: 14, height: 6 },
    resizable: false,
    rotatable: false,
    lockable: true,
  }
];
