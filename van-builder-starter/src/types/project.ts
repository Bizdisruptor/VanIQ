import type { PlacedModule } from './module';
import type { ViewId } from './van';

export interface ProjectRecord {
  id: string;
  name: string;
  vanId: string;
  activeView: ViewId;
  settings: Record<string, unknown>;
  placedModules: PlacedModule[];
}
