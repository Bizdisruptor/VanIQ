import { useAuth } from './features/auth/useAuth';
import { LeftSidebar } from './components/panels/LeftSidebar';
import { RightInspector } from './components/panels/RightInspector';
import { Topbar } from './components/panels/Topbar';
import { BlueprintCanvas } from './components/canvas/BlueprintCanvas';

export function App() {
  const { user, loading, signIn } = useAuth();

  if (loading) return <div className="flex h-full items-center justify-center text-slate-500">Loading…</div>;

  if (!user) return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-2xl font-bold">VanIQ</h1>
      <p className="text-slate-500">Sign in to start planning your build</p>
      <button onClick={() => signIn()} className="rounded bg-slate-900 px-5 py-2 text-white">
        Sign in with Google
      </button>
    </div>
  );

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
