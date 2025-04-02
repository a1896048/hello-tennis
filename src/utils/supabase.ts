import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  })
  throw new Error('Missing Supabase environment variables')
}

console.log('Supabase Configuration:', {
  url: supabaseUrl.substring(0, 20) + '...',
  key: supabaseAnonKey.substring(0, 10) + '...'
})

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)