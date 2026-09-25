import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string;
const supabasePublishableKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(supabaseUrl || '', supabasePublishableKey || '');
