import { loadVanDefinition } from '../../features/vans/api';
import { useProjectStore } from '../../features/projects/projectStore';

export function BlueprintCanvas() {
  const project = useProjectStore((s) => s.project);
  const van = loadVanDefinition(project.vanId);
  const activeView = project.activeView;
  const view = van.views[activeView as keyof typeof van.views] as { asset?: string };

  return (
    <div className="mx-auto max-w-[980px] rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold">{van.label}</h2>
          <p className="m-0 text-sm text-slate-500">View: {activeView}</p>
        </div>
        <div className="text-sm text-slate-500">Blueprint asset: {view?.asset ?? 'n/a'}</div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
        <img src={view?.asset} alt={`${van.label} ${activeView}`} className="mx-auto block max-h-[720px] w-auto max-w-full" />
      </div>
    </div>
  );
}
