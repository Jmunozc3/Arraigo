export const SUPABASE_URL = 'https://haubnnuibewuzyxpgdoj.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_WmRDYNQZFqfSoCu0vkrOEA_F_0XMVB5';

export function hasSupabaseConfig() {
  return Boolean(
    SUPABASE_URL
    && SUPABASE_ANON_KEY
    && !SUPABASE_ANON_KEY.includes('PON_AQUI')
  );
}
