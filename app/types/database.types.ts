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
          author_id: string | null
          stage_id: number
          danger_rate: number
          total_golden_eggs: number
          total_power_eggs: number
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          author_id?: string | null
          stage_id: number
          danger_rate: number
          total_golden_eggs?: number
          total_power_eggs?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          author_id?: string | null
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

