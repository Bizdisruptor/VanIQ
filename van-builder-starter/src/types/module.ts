import type { ViewId } from './van';

export interface ModuleDefinition {
  id: string;
  type: string;
  label: string;
  views: ViewId[];
  defaultSize: { width: number; depth: number; height: number };
  resizable: boolean;
  rotatable: boolean;
  lockable: boolean;
}

export interface PlacedModule {
  id: string;
  moduleId: string;
  view: ViewId;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  properties: Record<string, unknown>;
}
