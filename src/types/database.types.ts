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
      worlds: {
        Row: {
          id: string
          user_id: string
          name: string
          subtitle: string | null
          quote: string | null
          description: string | null
          header_image: string | null
          header_image_position: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          subtitle?: string | null
          quote?: string | null
          description?: string | null
          header_image?: string | null
          header_image_position?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subtitle?: string | null
          quote?: string | null
          description?: string | null
          header_image?: string | null
          header_image_position?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          pronouns: string | null
          bio: string | null
          role: ProfileRole
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          pronouns?: string | null
          bio?: string | null
          role?: ProfileRole
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          pronouns?: string | null
          bio?: string | null
          role?: ProfileRole
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
  pronouns: string | null
  bio: string | null
  role: ProfileRole
  created_at: string
}
