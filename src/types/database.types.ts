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
          committed: boolean
          source: string | null
          source_slug: string | null
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
          committed?: boolean
          source?: string | null
          source_slug?: string | null
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
          committed?: boolean
          source?: string | null
          source_slug?: string | null
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
      campaign_members: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaign_members_campaign_id_fkey'
            columns: ['campaign_id']
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
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
          notes: string | null
          invite_code: string | null
          committed: boolean
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
          notes?: string | null
          invite_code?: string | null
          committed?: boolean
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
          notes?: string | null
          invite_code?: string | null
          committed?: boolean
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
          notes: string | null
          committed: boolean
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
          notes?: string | null
          committed?: boolean
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
          notes?: string | null
          committed?: boolean
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
          committed: boolean
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
          committed?: boolean
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
          committed?: boolean
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
          committed: boolean
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
          committed?: boolean
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
          committed?: boolean
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
          committed: boolean
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
          committed?: boolean
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
          committed?: boolean
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
          committed: boolean
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
          committed?: boolean
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
          committed?: boolean
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
          proficient_skills: string[]
          committed: boolean
          created_at: string
          updated_at: string
          saving_throw_proficiencies: string[]
          expertise_skills: string[]
          languages: string[]
          tool_proficiencies: string[]
          weapon_proficiencies: string[]
          armor_proficiencies: string[]
          inspiration: boolean
          hit_die: string
          hit_dice_current: number
          death_save_successes: number
          death_save_failures: number
          exhaustion: number
          alignment: string | null
          personality_traits: string | null
          ideals: string | null
          bonds: string | null
          flaws: string | null
          temp_hp: number
          spellcasting_ability: string | null
          spell_slots: Record<string, unknown>
          concentrating: boolean
          concentration_spell: string | null
          feats: string[]
          weapon_masteries: string[]
          active_conditions: string[]
          class_resources: Record<string, unknown>
          platinum: number
          electrum: number
          fly_speed: number
          swim_speed: number
          climb_speed: number
          burrow_speed: number
          darkvision: number
          special_senses: string | null
          age: string | null
          height: string | null
          weight: string | null
          appearance: string | null
          portrait_url: string | null
          portrait_position: string
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
          proficient_skills?: string[]
          committed?: boolean
          created_at?: string
          updated_at?: string
          saving_throw_proficiencies?: string[]
          expertise_skills?: string[]
          languages?: string[]
          tool_proficiencies?: string[]
          weapon_proficiencies?: string[]
          armor_proficiencies?: string[]
          inspiration?: boolean
          hit_die?: string
          hit_dice_current?: number
          death_save_successes?: number
          death_save_failures?: number
          exhaustion?: number
          alignment?: string | null
          personality_traits?: string | null
          ideals?: string | null
          bonds?: string | null
          flaws?: string | null
          temp_hp?: number
          spellcasting_ability?: string | null
          spell_slots?: Record<string, unknown>
          concentrating?: boolean
          concentration_spell?: string | null
          feats?: string[]
          weapon_masteries?: string[]
          active_conditions?: string[]
          class_resources?: Record<string, unknown>
          platinum?: number
          electrum?: number
          fly_speed?: number
          swim_speed?: number
          climb_speed?: number
          burrow_speed?: number
          darkvision?: number
          special_senses?: string | null
          age?: string | null
          height?: string | null
          weight?: string | null
          appearance?: string | null
          portrait_url?: string | null
          portrait_position?: string
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
          proficient_skills?: string[]
          committed?: boolean
          created_at?: string
          updated_at?: string
          saving_throw_proficiencies?: string[]
          expertise_skills?: string[]
          languages?: string[]
          tool_proficiencies?: string[]
          weapon_proficiencies?: string[]
          armor_proficiencies?: string[]
          inspiration?: boolean
          hit_die?: string
          hit_dice_current?: number
          death_save_successes?: number
          death_save_failures?: number
          exhaustion?: number
          alignment?: string | null
          personality_traits?: string | null
          ideals?: string | null
          bonds?: string | null
          flaws?: string | null
          temp_hp?: number
          spellcasting_ability?: string | null
          spell_slots?: Record<string, unknown>
          concentrating?: boolean
          concentration_spell?: string | null
          feats?: string[]
          weapon_masteries?: string[]
          active_conditions?: string[]
          class_resources?: Record<string, unknown>
          platinum?: number
          electrum?: number
          fly_speed?: number
          swim_speed?: number
          climb_speed?: number
          burrow_speed?: number
          darkvision?: number
          special_senses?: string | null
          age?: string | null
          height?: string | null
          weight?: string | null
          appearance?: string | null
          portrait_url?: string | null
          portrait_position?: string
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
          committed: boolean
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
          committed?: boolean
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
          committed?: boolean
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
          committed: boolean
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
          committed?: boolean
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
          committed?: boolean
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
          equipped_slot: string | null
          name: string
          description: string | null
          item_type: string
          rarity: string
          is_magical: boolean
          quantity: number
          weight: number | null
          properties: Json
          committed: boolean
          source: string | null
          source_slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          character_id?: string | null
          equipped_slot?: string | null
          name?: string
          description?: string | null
          item_type?: string
          rarity?: string
          is_magical?: boolean
          quantity?: number
          weight?: number | null
          properties?: Json
          committed?: boolean
          source?: string | null
          source_slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          character_id?: string | null
          equipped_slot?: string | null
          name?: string
          description?: string | null
          item_type?: string
          rarity?: string
          is_magical?: boolean
          quantity?: number
          weight?: number | null
          properties?: Json
          committed?: boolean
          source?: string | null
          source_slug?: string | null
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
      player_notes: {
        Row: {
          id: string
          session_id: string
          user_id: string
          character_id: string | null
          content: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          character_id?: string | null
          content?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          character_id?: string | null
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'player_notes_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'player_notes_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'player_notes_character_id_fkey'
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
          openai_api_key: string | null
          anthropic_api_key: string | null
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
          openai_api_key?: string | null
          anthropic_api_key?: string | null
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
          openai_api_key?: string | null
          anthropic_api_key?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      spells: {
        Row: {
          id: string
          user_id: string
          name: string
          level: number
          school: string
          casting_time: string
          range: string
          components: string
          duration: string
          concentration: boolean
          ritual: boolean
          description: string | null
          higher_level: string | null
          classes: string[]
          source: string | null
          source_slug: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          level?: number
          school?: string
          casting_time?: string
          range?: string
          components?: string
          duration?: string
          concentration?: boolean
          ritual?: boolean
          description?: string | null
          higher_level?: string | null
          classes?: string[]
          source?: string | null
          source_slug?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          level?: number
          school?: string
          casting_time?: string
          range?: string
          components?: string
          duration?: string
          concentration?: boolean
          ritual?: boolean
          description?: string | null
          higher_level?: string | null
          classes?: string[]
          source?: string | null
          source_slug?: string | null
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
  openai_api_key: string | null
  anthropic_api_key: string | null
}
