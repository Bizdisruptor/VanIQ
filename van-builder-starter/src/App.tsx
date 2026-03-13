import { useEffect } from 'react';
import { LeftSidebar } from './components/panels/LeftSidebar';
import { RightInspector } from './components/panels/RightInspector';
import { Topbar } from './components/panels/Topbar';
import { BlueprintCanvas } from './components/canvas/BlueprintCanvas';
import { useAuthStore } from './store/authStore';

export function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <div className="flex h-full flex-col">
      <Topbar />
      <div className="grid flex-1 grid-cols-[280px_1fr_320px] overflow-hidden">
        <LeftSidebar />
        <main className="overflow-auto bg-slate-100 p-4">
          <BlueprintCanvas />
        </main>
        <RightInspector />
      </div>
    </div>
  );
}
