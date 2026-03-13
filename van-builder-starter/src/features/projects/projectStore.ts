import { create } from 'zustand';
import { supabase } from '../../lib/supabase/client';
import type { ProjectRecord } from '../../types/project';
import type { PlacedModule } from '../../types/module';
import type { ViewId } from '../../types/van';

interface ProjectState {
  project: ProjectRecord;
  saving: boolean;
  setActiveView: (view: ViewId) => void;
  setVanId: (vanId: string) => void;
  addPlacedModule: (module: PlacedModule) => void;
  saveProject: (userId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: {
    id: 'local-dev-project',
    name: 'Transit Build 1',
    vanId: 'transit_148_hr',
    activeView: 'plan',
    settings: {},
    placedModules: [],
  },
  saving: false,

  setActiveView: (view) =>
    set((state) => ({
      project: { ...state.project, activeView: view },
    })),

  setVanId: (vanId) =>
    set((state) => ({
      project: { ...state.project, vanId },
    })),

  addPlacedModule: (module) =>
    set((state) => ({
      project: {
        ...state.project,
        placedModules: [...state.project.placedModules, module],
      },
    })),

  saveProject: async (userId: string) => {
    set({ saving: true });
    const { project } = get();
    const isNew = project.id === 'local-dev-project';

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: userId,
            name: project.name,
            van_id: project.vanId,
            items: project.placedModules,
          })
          .select()
          .single();
        if (error) throw error;
        set((state) => ({
          project: { ...state.project, id: data.id },
        }));
      } else {
        const { error } = await supabase
          .from('projects')
          .update({
            name: project.name,
            van_id: project.vanId,
            items: project.placedModules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);
        if (error) throw error;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      alert(message);
    } finally {
      set({ saving: false });
    }
  },
}));
