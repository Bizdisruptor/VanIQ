import { create } from 'zustand';
import type { ProjectRecord } from '../../types/project';
import type { PlacedModule } from '../../types/module';
import type { ViewId } from '../../types/van';

interface ProjectState {
  project: ProjectRecord;
  setActiveView: (view: ViewId) => void;
  addPlacedModule: (module: PlacedModule) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: {
    id: 'local-dev-project',
    name: 'Transit Build 1',
    vanId: 'transit_148_hr',
    activeView: 'plan',
    settings: {},
    placedModules: [],
  },
  setActiveView: (view) =>
    set((state) => ({
      project: { ...state.project, activeView: view },
    })),
  addPlacedModule: (module) =>
    set((state) => ({
      project: {
        ...state.project,
        placedModules: [...state.project.placedModules, module],
      },
    })),
}));
