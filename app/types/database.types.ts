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
      m_stages: {
        Row: {
          id: number
          name: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      m_weapons: {
        Row: {
          id: number
          name: string
          icon_url: string | null
          is_grizzco_weapon: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          icon_url?: string | null
          is_grizzco_weapon?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          icon_url?: string | null
          is_grizzco_weapon?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      scenarios: {
        Row: {
          code: string
          author_id: string
          stage_id: number
          danger_rate: number
          total_golden_eggs: number
          total_power_eggs: number
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          author_id: string
          stage_id: number
          danger_rate: number
          total_golden_eggs?: number
          total_power_eggs?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          author_id?: string
          stage_id?: number
          danger_rate?: number
          total_golden_eggs?: number
          total_power_eggs?: number
          created_at?: string
          updated_at?: string
        }
      }
      scenario_waves: {
        Row: {
          scenario_code: string
          wave_number: number
          tide: 'low' | 'normal' | 'high'
          event: string | null
          delivered_count: number
          quota: number
          cleared: boolean
        }
        Insert: {
          scenario_code: string
          wave_number: number
          tide: 'low' | 'normal' | 'high'
          event?: string | null
          delivered_count?: number
          quota: number
          cleared?: boolean
        }
        Update: {
          scenario_code?: string
          wave_number?: number
          tide?: 'low' | 'normal' | 'high'
          event?: string | null
          delivered_count?: number
          quota?: number
          cleared?: boolean
        }
      }
      scenario_weapons: {
        Row: {
          scenario_code: string
          weapon_id: number
          display_order: number
        }
        Insert: {
          scenario_code: string
          weapon_id: number
          display_order: number
        }
        Update: {
          scenario_code?: string
          weapon_id?: number
          display_order?: number
        }
      }
      likes: {
        Row: {
          id: number
          scenario_code: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          scenario_code: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          scenario_code?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          scenario_code: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          scenario_code: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          scenario_code?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      admins: {
        Row: {
          user_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          created_at?: string
        }
      }
      unknown_stages: {
        Row: {
          id: number
          name: string
          detected_at: string
          resolved_at: string | null
          resolved_by: string | null
          resolved_stage_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          detected_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_stage_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          detected_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_stage_id?: number | null
          created_at?: string
        }
      }
      unknown_weapons: {
        Row: {
          id: number
          name: string
          detected_at: string
          resolved_at: string | null
          resolved_by: string | null
          resolved_weapon_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          detected_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_weapon_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          detected_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_weapon_id?: number | null
          created_at?: string
        }
      }
      stage_aliases: {
        Row: {
          id: number
          stage_id: number
          alias: string
          created_at: string
        }
        Insert: {
          id?: number
          stage_id: number
          alias: string
          created_at?: string
        }
        Update: {
          id?: number
          stage_id?: number
          alias?: string
          created_at?: string
        }
      }
      weapon_aliases: {
        Row: {
          id: number
          weapon_id: number
          alias: string
          created_at: string
        }
        Insert: {
          id?: number
          weapon_id: number
          alias: string
          created_at?: string
        }
        Update: {
          id?: number
          weapon_id?: number
          alias?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}

