import { listVanDefinitions } from '../../features/vans/api';
import { useProjectStore } from '../../features/projects/projectStore';
import { useAuthStore } from '../../store/authStore';

export function Topbar() {
  const project = useProjectStore((s) => s.project);
  const setVanId = useProjectStore((s) => s.setVanId);
  const vans = listVanDefinitions();

  const { user, loading, signInWithGoogle, signOut } = useAuthStore();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <h1 className="m-0 text-lg font-semibold">Van Builder</h1>
        <p className="m-0 text-sm text-slate-500">{project.name}</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        {/* Van model selector */}
        <select
          value={project.vanId}
          onChange={(e) => setVanId(e.target.value)}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-sm"
        >
          {vans.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>

        {/* Save button */}
        <SaveButton />

        {/* Auth */}
        {loading ? (
          <span className="text-xs text-slate-400">...</span>
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{user.email}</span>
            <button
              onClick={signOut}
              className="rounded border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}

function SaveButton() {
  const { user } = useAuthStore();
  const project = useProjectStore((s) => s.project);
  const saveProject = useProjectStore((s) => s.saveProject);
  const saving = useProjectStore((s) => s.saving);

  const handleSave = async () => {
    if (!user) {
      alert('Sign in to save your project.');
      return;
    }
    await saveProject(user.id);
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="rounded bg-slate-900 px-3 py-1.5 text-white disabled:opacity-50 hover:bg-slate-800"
    >
      {saving ? 'Saving...' : 'Save'}
    </button>
  );
}
