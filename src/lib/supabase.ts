import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fetitwhilvglcpdaodyu.supabase.co'
const supabaseAnonKey = 'sb_publishable_cFnSWEcOQfXQ47Q6jCADhQ_aXLytT8p'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
