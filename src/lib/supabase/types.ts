export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string | null
          id: string
          member_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string | null
          id?: string
          member_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string | null
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          arrival_position: number | null
          check_in_method: string
          check_in_time: string
          check_out_method: string | null
          check_out_time: string | null
          created_at: string | null
          duration_minutes: number | null
          host_notified_at: string | null
          id: string
          is_overtap: boolean | null
          kiosk_id: string | null
          location: string | null
          member_id: string | null
          song_added: string | null
          status: string | null
          visitor_name: string | null
          welcome_message: string | null
        }
        Insert: {
          arrival_position?: number | null
          check_in_method: string
          check_in_time: string
          check_out_method?: string | null
          check_out_time?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          host_notified_at?: string | null
          id?: string
          is_overtap?: boolean | null
          kiosk_id?: string | null
          location?: string | null
          member_id?: string | null
          song_added?: string | null
          status?: string | null
          visitor_name?: string | null
          welcome_message?: string | null
        }
        Update: {
          arrival_position?: number | null
          check_in_method?: string
          check_in_time?: string
          check_out_method?: string | null
          check_out_time?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          host_notified_at?: string | null
          id?: string
          is_overtap?: boolean | null
          kiosk_id?: string | null
          location?: string | null
          member_id?: string | null
          song_added?: string | null
          status?: string | null
          visitor_name?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      community_goals: {
        Row: {
          created_at: string | null
          current_count: number | null
          end_date: string
          goal_type: string
          id: string
          is_active: boolean | null
          start_date: string
          target_count: number
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          end_date: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          start_date: string
          target_count: number
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          end_date?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          target_count?: number
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          token: string
          user_agent: string | null
          visitor_email: string
          visitor_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          token: string
          user_agent?: string | null
          visitor_email: string
          visitor_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          token?: string
          user_agent?: string | null
          visitor_email?: string
          visitor_name?: string
        }
        Relationships: []
      }
      host_preferences: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          notify_email: boolean | null
          notify_slack: boolean | null
          notify_sms: boolean | null
          phone: string | null
          slack_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          notify_email?: boolean | null
          notify_slack?: boolean | null
          notify_sms?: boolean | null
          phone?: string | null
          slack_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notify_email?: boolean | null
          notify_slack?: boolean | null
          notify_sms?: boolean | null
          phone?: string | null
          slack_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kiosk_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          avatar_emoji: string | null
          company: string | null
          created_at: string | null
          current_streak: number | null
          deactivated_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_check_in: string | null
          longest_streak: number | null
          name: string
          personality_nickname: string | null
          phone: string | null
          photo_url: string | null
          total_check_ins: number | null
        }
        Insert: {
          avatar_emoji?: string | null
          company?: string | null
          created_at?: string | null
          current_streak?: number | null
          deactivated_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_check_in?: string | null
          longest_streak?: number | null
          name: string
          personality_nickname?: string | null
          phone?: string | null
          photo_url?: string | null
          total_check_ins?: number | null
        }
        Update: {
          avatar_emoji?: string | null
          company?: string | null
          created_at?: string | null
          current_streak?: number | null
          deactivated_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_check_in?: string | null
          longest_streak?: number | null
          name?: string
          personality_nickname?: string | null
          phone?: string | null
          photo_url?: string | null
          total_check_ins?: number | null
        }
        Relationships: []
      }
      passkey_credentials: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          visitor_email: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          visitor_email: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          visitor_email?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          author: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          source: string | null
          text: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          text: string
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source?: string | null
          text?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          is_active?: boolean
          created_at?: string | null
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

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
