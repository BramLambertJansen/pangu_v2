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
      campaigns: {
        Row: {
          id: string
          world_id: string
          user_id: string
          name: string
          subtitle: string | null
          description: string | null
          header_image: string | null
          header_image_position: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          user_id: string
          name?: string
          subtitle?: string | null
          description?: string | null
          header_image?: string | null
          header_image_position?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          user_id?: string
          name?: string
          subtitle?: string | null
          description?: string | null
          header_image?: string | null
          header_image_position?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_world_id_fkey'
            columns: ['world_id']
            referencedRelation: 'worlds'
            referencedColumns: ['id']
          }
        ]
      }
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
      sessions: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          name: string
          subtitle: string | null
          description: string | null
          notes: string | null
          status: string
          session_date: string | null
          session_number: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          session_date?: string | null
          session_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          session_date?: string | null
          session_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          }
        ]
      }
      locations: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          name: string
          subtitle: string | null
          description: string | null
          notes: string | null
          status: string
          location_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          location_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          location_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'locations_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          }
        ]
      }
      lore: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          name: string
          subtitle: string | null
          description: string | null
          notes: string | null
          status: string
          lore_category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          lore_category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          lore_category?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lore_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          }
        ]
      }
      npcs: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          name: string
          subtitle: string | null
          description: string | null
          notes: string | null
          status: string
          npc_role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          npc_role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          npc_role?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'npcs_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          }
        ]
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
