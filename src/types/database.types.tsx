export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          sets: {
            set_number: number
            player1_score: number
            player2_score: number
            tiebreak?: {         // 添加抢七字段
              player1_score: number
              player2_score: number
            }
          }[]
          id: string
          name: string
          gender: 'male' | 'female'
          created_at: string
          total_points: number    // 用户总积分
          total_matches: number   // 用户总比赛场数
          won_matches: number     // 用户胜场数
        }
        Insert: {
          id?: string
          name: string
          gender: 'male' | 'female'
          created_at?: string
          total_points?: number
          total_matches?: number
          won_matches?: number
        }
        Update: {
          id?: string
          name?: string
          gender?: 'male' | 'female'
          created_at?: string
          total_points?: number
          total_matches?: number
          won_matches?: number
        }
      }
      matches: {
        Row: {
          id: string
          player1_id: string
          player2_id: string
          player1_score: number
          player2_score: number
          player1_points: number  // 玩家1本场比赛获得的积分
          player2_points: number  // 玩家2本场比赛获得的积分
          match_date: string
          status: 'pending' | 'completed'
          created_at: string
          match_type: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'

          teammate_id?: string    // 双打时的队友ID
          sets: {                 // 每盘比分详情
            set_number: number    // 第几盘
            player1_score: number // 玩家1本盘得分
            player2_score: number // 玩家2本盘得分
          }[]
        }
        Insert: {
          id?: string
          player1_id: string
          player2_id: string
          player1_score?: number
          player2_score?: number
          player1_points?: number
          player2_points?: number
          match_date: string
          status?: 'pending' | 'completed'
          created_at?: string
          match_type: 'singles' | 'doubles'
          teammate_id?: string
          sets: {
            set_number: number
            player1_score: number
            player2_score: number
          }[]
        }
        Update: {
          id?: string
          player1_id?: string
          player2_id?: string
          player1_score?: number
          player2_score?: number
          player1_points?: number
          player2_points?: number
          match_date?: string
          status?: 'pending' | 'completed'
          created_at?: string
          match_type?: 'singles' | 'doubles'
          teammate_id?: string
          sets?: {
            set_number: number
            player1_score: number
            player2_score: number
          }[]
        }
      }
    }
  }
}