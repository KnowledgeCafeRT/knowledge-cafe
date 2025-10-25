const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we're in a serverless environment and provide fallbacks
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', {
    SUPABASE_URL: !!supabaseUrl,
    SUPABASE_ANON_KEY: !!supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey
  });
  
  // For now, let's create dummy clients to prevent crashes
  const dummyClient = {
    from: () => ({ select: () => ({ data: [], error: null }) }),
    auth: { getUser: () => ({ data: { user: null }, error: null }) }
  };
  
  module.exports = {
    supabase: dummyClient,
    supabaseAdmin: dummyClient
  };
  return;
}

// Client for regular operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = {
  supabase,
  supabaseAdmin
};
