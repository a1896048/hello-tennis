export interface User {
  id: string
  email: string
  name: string
  gender: 'male' | 'female'
  role: 'admin' | 'user'
  is_enabled: boolean
  created_at: string
  total_points: number
  total_matches: number
  won_matches: number
} 