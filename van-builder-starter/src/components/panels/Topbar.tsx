import { listVanDefinitions } from '../../features/vans/api';
import { useProjectStore } from '../../features/projects/projectStore';

export function Topbar() {
  const project = useProjectStore((s) => s.project);
  const vans = listVanDefinitions();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <h1 className="m-0 text-lg font-semibold">Van Builder</h1>
        <p className="m-0 text-sm text-slate-500">{project.name}</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="rounded border border-slate-300 px-3 py-1">{vans.find((v) => v.id === project.vanId)?.label}</span>
        <button className="rounded bg-slate-900 px-3 py-1.5 text-white">Save</button>
      </div>
    </header>
  );
}
