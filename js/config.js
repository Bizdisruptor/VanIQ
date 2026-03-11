// js/config.js — VanIQ App Configuration
// These are PUBLIC keys — safe for client-side use
// Secret keys (Stripe secret, Supabase service_role) NEVER go here

const VANIQ_CONFIG = {
  supabase: {
    url: 'https://fzdxbcdqvycwpnmgeraj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZHhiY2Rxdnljd3BubWdlcmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDcyMzAsImV4cCI6MjA4ODgyMzIzMH0.J81bGoo_VenDvfB6qZfqC4X310Z8ZY0dxx0hTWFaGdI'
  },
  stripe: {
    publishableKey: 'pk_live_51T9qKUEKvlpgJS0LjlALJZlGkce1G3wX56UMeFKzIyG0PhvvZML3Xx2uNgFHd3dmlh7oXLrHcA00SFyuNQzO',
    products: {
      singleBuild: 'prod_U86ht3fYuF0jDV',   // $39 one-time
      builder: 'prod_U86juWq47bGfuG'          // $159/yr unlimited
    }
  },
  plans: {
    free:    { label: 'Free',         maxProjects: 0,  canSave: false, canExport: false, canShare: false },
    single:  { label: 'Single Build', maxProjects: 1,  canSave: true,  canExport: true,  canShare: true  },
    builder: { label: 'Builder',      maxProjects: -1, canSave: true,  canExport: true,  canShare: true  }
  }
};
