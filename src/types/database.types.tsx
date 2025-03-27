export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
          player1_id: string      // 玩家1的ID
          player2_id: string      // 对手1的ID
          opponent2_id?: string   // 双打时对手2的ID
          player1_score: number   // 玩家1的总分
          player2_score: number   // 玩家2的总分
          player1_points: number  // 玩家1本场比赛获得的积分
          player2_points: number  // 玩家2本场比赛获得的积分
          match_date: string      // 比赛日期
          status: 'pending' | 'completed'  // 比赛状态
          created_at: string      // 创建时间
          match_type: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'  // 比赛类型
          teammate_id?: string    // 双打时的搭档ID
          sets: {                 // 每盘比分详情
            set_number: number    // 第几盘
            player1_score: number // 玩家1本盘得分
            player2_score: number // 玩家2本盘得分
            tiebreak?: {         // 抢七详情（可选）
              player1_score: number
              player2_score: number
            }
          }[]
        }
        Insert: {
          id?: string
          player1_id: string
          player2_id: string
          opponent2_id?: string
          player1_score?: number
          player2_score?: number
          player1_points?: number
          player2_points?: number
          match_date: string
          status?: 'pending' | 'completed'
          created_at?: string
          match_type: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'
          teammate_id?: string
          sets: {
            set_number: number
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
        }
        Update: {
          id?: string
          player1_id?: string
          player2_id?: string
          opponent2_id?: string
          player1_score?: number
          player2_score?: number
          player1_points?: number
          player2_points?: number
          match_date?: string
          status?: 'pending' | 'completed'
          created_at?: string
          match_type?: 'women_singles' | 'men_singles' | 'women_doubles' | 'men_doubles' | 'mixed_singles' | 'mixed_doubles'
          teammate_id?: string
          sets?: {
            set_number: number
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
        }
      }
    }
  }
}