// Regenerate via: npx supabase gen types typescript --local > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileRole = 'user' | 'admin'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: string
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

export interface Profile {
  id: string
  email: string
  display_name: string | null
  role: ProfileRole
  created_at: string
}
