export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        Insert: {
          id: string
          email: string
          name: string
          gender: 'male' | 'female'
          role?: 'admin' | 'user'
          is_enabled?: boolean
          created_at?: string
          total_points?: number
          total_matches?: number
          won_matches?: number
        }
        Update: {
          id?: string
          email?: string
          name?: string
          gender?: 'male' | 'female'
          role?: 'admin' | 'user'
          is_enabled?: boolean
          created_at?: string
          total_points?: number
          total_matches?: number
          won_matches?: number
        }
      }
      matches: {
        Row: {
          id: string
          match_date: string
          player1_id: string
          player2_id: string
          match_type: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'
          teammate_id?: string
          opponent2_id?: string
          player1_score: number
          player2_score: number
          player1_points: number
          player2_points: number
          status: 'pending' | 'completed' | 'cancelled'
          sets: {
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
          created_at: string
        }
        Insert: {
          id?: string
          match_date: string
          player1_id: string
          player2_id: string
          match_type: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'
          teammate_id?: string
          opponent2_id?: string
          player1_score: number
          player2_score: number
          player1_points?: number
          player2_points?: number
          status?: 'pending' | 'completed' | 'cancelled'
          sets: {
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
          created_at?: string
        }
        Update: {
          id?: string
          match_date?: string
          player1_id?: string
          player2_id?: string
          match_type?: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'
          teammate_id?: string
          opponent2_id?: string
          player1_score?: number
          player2_score?: number
          player1_points?: number
          player2_points?: number
          status?: 'pending' | 'completed' | 'cancelled'
          sets?: {
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
          created_at?: string
        }
      }
    }
  }
} 