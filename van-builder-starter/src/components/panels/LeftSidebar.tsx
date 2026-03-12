import { moduleCatalog } from '../../features/modules/moduleCatalog';
import { useProjectStore } from '../../features/projects/projectStore';
import type { ViewId } from '../../types/van';

const views: ViewId[] = ['plan', 'roof', 'driver_elev', 'passenger_elev', 'rear_elev', 'front_elev'];

export function LeftSidebar() {
  const activeView = useProjectStore((s) => s.project.activeView);
  const setActiveView = useProjectStore((s) => s.setActiveView);

  return (
    <aside className="overflow-auto border-r border-slate-200 bg-white p-4">
      <section>
        <h2 className="mb-3 mt-0 text-sm font-semibold uppercase tracking-wide text-slate-500">Views</h2>
        <div className="grid gap-2">
          {views.map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`rounded border px-3 py-2 text-left text-sm ${activeView === view ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
            >
              {view}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 mt-0 text-sm font-semibold uppercase tracking-wide text-slate-500">Modules</h2>
        <div className="grid gap-2">
          {moduleCatalog.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 p-3 text-sm">
              <div className="font-medium">{item.label}</div>
              <div className="text-slate-500">{item.type}</div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
