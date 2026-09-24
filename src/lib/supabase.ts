import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jujcknarfyclevapqotz.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_BNIfj22s_8kRxzImDuKUiw_JdUshF88';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
