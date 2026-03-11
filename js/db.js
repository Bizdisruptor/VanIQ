// js/db.js — VanIQ Project Database (Supabase)

function getSB() { return window.supabase.createClient(VANIQ_CONFIG.supabase.url, VANIQ_CONFIG.supabase.anonKey); }

// ── Projects ──────────────────────────────────────────────────────────────────

async function dbGetProjects() {
  const user = getCurrentUser();
  if (!user) return [];
  const { data, error } = await getSB()
    .from('projects')
    .select('id, name, van_model, created_at, updated_at, thumbnail')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) { console.error('dbGetProjects:', error); return []; }
  return data || [];
}

async function dbGetProject(id) {
  const user = getCurrentUser();
  if (!user) return null;
  const { data, error } = await getSB()
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error) { console.error('dbGetProject:', error); return null; }
  return data;
}

async function dbSaveProject(project) {
  const user = getCurrentUser();
  if (!user) throw new Error('Not signed in');

  // Check plan limits before saving
  const plan = getUserPlan();
  const planConfig = VANIQ_CONFIG.plans[plan];

  if (!planConfig.canSave) {
    throw new Error('UPGRADE_REQUIRED');
  }

  if (planConfig.maxProjects > 0) {
    // Count existing projects
    const { count } = await getSB()
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Allow update of existing project
    if (!project.id && count >= planConfig.maxProjects) {
      throw new Error('PROJECT_LIMIT_REACHED');
    }
  }

  const payload = {
    user_id: user.id,
    name: project.name || 'My Van Build',
    van_model: project.van_model || project.vanModel || 'Transit 148 HR',
    modules: project.modules || [],
    systems: project.systems || {},
    settings: project.settings || {},
    updated_at: new Date().toISOString()
  };

  let result;
  if (project.id) {
    // Update
    const { data, error } = await getSB()
      .from('projects')
      .update(payload)
      .eq('id', project.id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    // Insert
    const { data, error } = await getSB()
      .from('projects')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    result = data;

    // Update profile projects_used count
    await getSB()
      .from('profiles')
      .update({ projects_used: (_currentProfile?.projects_used || 0) + 1 })
      .eq('id', user.id);
  }

  return result;
}

async function dbDeleteProject(id) {
  const user = getCurrentUser();
  if (!user) return;
  const { error } = await getSB()
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}

// ── Share links (public read-only) ────────────────────────────────────────────

async function dbGetSharedProject(shareId) {
  // For share links we fetch by id with no user_id constraint
  // RLS allows this if project has share_enabled = true
  const { data, error } = await getSB()
    .from('projects')
    .select('*')
    .eq('id', shareId)
    .single();
  if (error) return null;
  return data;
}
