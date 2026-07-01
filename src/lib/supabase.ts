import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Tables = {
  survey_responses: {
    id: number
    created_at: string
    escola_id: number
    escola_nome: string
    horario: 'manha' | 'tarde'
    idade: number
    come_merenda: 'sim' | 'nao'
    gosta_merenda: 'sim' | 'nao'
    merenda_preferida: string
    sugestao_merenda: string
  }
  profiles: {
    id: string
    username: string
    role: string
    created_at: string
  }
}
