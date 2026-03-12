import { useProjectStore } from '../../features/projects/projectStore';
import { loadVanDefinition } from '../../features/vans/api';

export function RightInspector() {
  const project = useProjectStore((s) => s.project);
  const van = loadVanDefinition(project.vanId);

  return (
    <aside className="overflow-auto border-l border-slate-200 bg-white p-4">
      <h2 className="mt-0 text-sm font-semibold uppercase tracking-wide text-slate-500">Van Specs</h2>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-sm">
        <dt>Partition Depth</dt><dd>{van.dimensions.partition_depth}"</dd>
        <dt>Inside Roof Height</dt><dd>{van.dimensions.inside_roof_height}"</dd>
        <dt>Driver Wall Length</dt><dd>{van.dimensions.driver_wall_usable_length}"</dd>
        <dt>Passenger Wall Length</dt><dd>{van.dimensions.passenger_wall_usable_length}"</dd>
        <dt>Side Door Opening</dt><dd>{van.dimensions.side_door_opening_width}"</dd>
        <dt>Rear Door Opening</dt><dd>{van.dimensions.rear_door_opening_width}"</dd>
      </dl>
    </aside>
  );
}
