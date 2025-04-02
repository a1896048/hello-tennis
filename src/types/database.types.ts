export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          match_type: 'men_singles' | 'women_singles' | 'men_doubles' | 'women_doubles' | 'mixed_doubles' | 'mixed_singles'
          teammate_id?: string
          opponent2_id?: string
          player1_score: number
          player2_score: number
          player1_points: number
          player2_points: number
          score: string
          status: 'pending' | 'completed' | 'cancelled'
          tournament_id: string | null
          venue: string | null
          notes: string | null
          sets: {
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          match_date: string
          player1_id: string
          player2_id: string
          match_type: 'men_singles' | 'women_singles' | 'men_doubles' | 'women_doubles' | 'mixed_doubles' | 'mixed_singles'
          teammate_id?: string
          opponent2_id?: string
          player1_score?: number
          player2_score?: number
          player1_points?: number
          player2_points?: number
          score?: string
          status?: 'pending' | 'completed' | 'cancelled'
          tournament_id?: string | null
          venue?: string | null
          notes?: string | null
          sets?: {
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          match_date?: string
          player1_id?: string
          player2_id?: string
          match_type?: 'men_singles' | 'women_singles' | 'men_doubles' | 'women_doubles' | 'mixed_doubles' | 'mixed_singles'
          teammate_id?: string
          opponent2_id?: string
          player1_score?: number
          player2_score?: number
          player1_points?: number
          player2_points?: number
          score?: string
          status?: 'pending' | 'completed' | 'cancelled'
          tournament_id?: string | null
          venue?: string | null
          notes?: string | null
          sets?: {
            player1_score: number
            player2_score: number
            tiebreak?: {
              player1_score: number
              player2_score: number
            }
          }[]
          updated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          }
        ]
      }
      tournaments: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          description: string | null
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          description?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          description?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'user'
          is_enabled: boolean
          avatar_url: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'admin' | 'user'
          is_enabled?: boolean
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'user'
          is_enabled?: boolean
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 