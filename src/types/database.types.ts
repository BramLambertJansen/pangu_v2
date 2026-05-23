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
      bestiaries: {
        Row: {
          id: string
          world_id: string
          user_id: string
          name: string
          subtitle: string | null
          creature_type: string | null
          threat_level: string | null
          habitat: string | null
          description: string | null
          notes: string | null
          status: string
          hp: number
          ac: number
          speed: number
          stat_str: number
          stat_dex: number
          stat_con: number
          stat_int: number
          stat_wis: number
          stat_cha: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          user_id: string
          name?: string
          subtitle?: string | null
          creature_type?: string | null
          threat_level?: string | null
          habitat?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          hp?: number
          ac?: number
          speed?: number
          stat_str?: number
          stat_dex?: number
          stat_con?: number
          stat_int?: number
          stat_wis?: number
          stat_cha?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          user_id?: string
          name?: string
          subtitle?: string | null
          creature_type?: string | null
          threat_level?: string | null
          habitat?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          hp?: number
          ac?: number
          speed?: number
          stat_str?: number
          stat_dex?: number
          stat_con?: number
          stat_int?: number
          stat_wis?: number
          stat_cha?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bestiaries_world_id_fkey'
            columns: ['world_id']
            referencedRelation: 'worlds'
            referencedColumns: ['id']
          }
        ]
      }
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
      characters: {
        Row: {
          id: string
          user_id: string
          campaign_id: string | null
          name: string
          subtitle: string | null
          character_class: string | null
          character_subclass: string | null
          character_race: string | null
          level: number
          xp: number
          xp_next: number
          hp_current: number
          hp_max: number
          armor_class: number
          speed: number
          initiative: number
          proficiency_bonus: number
          stat_str: number
          stat_dex: number
          stat_con: number
          stat_int: number
          stat_wis: number
          stat_cha: number
          gold: number
          silver: number
          copper: number
          description: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id?: string | null
          name?: string
          subtitle?: string | null
          character_class?: string | null
          character_subclass?: string | null
          character_race?: string | null
          level?: number
          xp?: number
          xp_next?: number
          hp_current?: number
          hp_max?: number
          armor_class?: number
          speed?: number
          initiative?: number
          proficiency_bonus?: number
          stat_str?: number
          stat_dex?: number
          stat_con?: number
          stat_int?: number
          stat_wis?: number
          stat_cha?: number
          gold?: number
          silver?: number
          copper?: number
          description?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string | null
          name?: string
          subtitle?: string | null
          character_class?: string | null
          character_subclass?: string | null
          character_race?: string | null
          level?: number
          xp?: number
          xp_next?: number
          hp_current?: number
          hp_max?: number
          armor_class?: number
          speed?: number
          initiative?: number
          proficiency_bonus?: number
          stat_str?: number
          stat_dex?: number
          stat_con?: number
          stat_int?: number
          stat_wis?: number
          stat_cha?: number
          gold?: number
          silver?: number
          copper?: number
          description?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'characters_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          }
        ]
      }
      quests: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          name: string
          subtitle: string | null
          description: string | null
          notes: string | null
          status: string
          quest_type: string | null
          difficulty: string | null
          reward: string | null
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
          quest_type?: string | null
          difficulty?: string | null
          reward?: string | null
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
          quest_type?: string | null
          difficulty?: string | null
          reward?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quests_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          }
        ]
      }
      encounters: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          session_id: string | null
          name: string
          subtitle: string | null
          description: string | null
          notes: string | null
          status: string
          environment: string | null
          difficulty: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          session_id?: string | null
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          environment?: string | null
          difficulty?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          session_id?: string | null
          name?: string
          subtitle?: string | null
          description?: string | null
          notes?: string | null
          status?: string
          environment?: string | null
          difficulty?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'encounters_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'encounters_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          }
        ]
      }
      encounter_monsters: {
        Row: {
          id: string
          encounter_id: string
          bestiary_id: string
          user_id: string
          count: number
          created_at: string
        }
        Insert: {
          id?: string
          encounter_id: string
          bestiary_id: string
          user_id: string
          count?: number
          created_at?: string
        }
        Update: {
          id?: string
          encounter_id?: string
          bestiary_id?: string
          user_id?: string
          count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'encounter_monsters_encounter_id_fkey'
            columns: ['encounter_id']
            referencedRelation: 'encounters'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'encounter_monsters_bestiary_id_fkey'
            columns: ['bestiary_id']
            referencedRelation: 'bestiaries'
            referencedColumns: ['id']
          }
        ]
      }
      items: {
        Row: {
          id: string
          campaign_id: string
          character_id: string | null
          name: string
          description: string | null
          item_type: string
          rarity: string
          is_magical: boolean
          quantity: number
          weight: number | null
          properties: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          character_id?: string | null
          name?: string
          description?: string | null
          item_type?: string
          rarity?: string
          is_magical?: boolean
          quantity?: number
          weight?: number | null
          properties?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          character_id?: string | null
          name?: string
          description?: string | null
          item_type?: string
          rarity?: string
          is_magical?: boolean
          quantity?: number
          weight?: number | null
          properties?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'items_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'items_character_id_fkey'
            columns: ['character_id']
            referencedRelation: 'characters'
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
          avatar_url: string | null
          role: ProfileRole
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          pronouns?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: ProfileRole
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          pronouns?: string | null
          bio?: string | null
          avatar_url?: string | null
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
  avatar_url: string | null
  role: ProfileRole
  created_at: string
}
