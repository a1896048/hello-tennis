export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          gender: 'male' | 'female'
          created_at: string
        }
      }
      matches: {
        Row: {
          id: string
          player1_id: string
          player2_id: string
          player1_score: number
          player2_score: number
          match_date: string
          status: 'pending' | 'completed'
          created_at: string
        }
      }
    }
  }
}