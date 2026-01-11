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
      device_tokens: {
        Row: {
          id: string
          token: string
          visitor_email: string
          visitor_name: string
          created_at: string | null
          last_used_at: string | null
          user_agent: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          token: string
          visitor_email: string
          visitor_name: string
          created_at?: string | null
          last_used_at?: string | null
          user_agent?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          token?: string
          visitor_email?: string
          visitor_name?: string
          created_at?: string | null
          last_used_at?: string | null
          user_agent?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      passkey_credentials: {
        Row: {
          id: string
          visitor_email: string
          credential_id: string
          public_key: string
          counter: number | null
          transports: string[] | null
          created_at: string | null
          last_used_at: string | null
        }
        Insert: {
          id?: string
          visitor_email: string
          credential_id: string
          public_key: string
          counter?: number | null
          transports?: string[] | null
          created_at?: string | null
          last_used_at?: string | null
        }
        Update: {
          id?: string
          visitor_email?: string
          credential_id?: string
          public_key?: string
          counter?: number | null
          transports?: string[] | null
          created_at?: string | null
          last_used_at?: string | null
        }
        Relationships: []
      }
      host_preferences: {
        Row: {
          id: string
          email: string
          name: string
          notify_email: boolean | null
          notify_sms: boolean | null
          notify_slack: boolean | null
          phone: string | null
          slack_user_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_slack?: boolean | null
          phone?: string | null
          slack_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_slack?: boolean | null
          phone?: string | null
          slack_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          check_in_method: string
          check_in_time: string
          check_out_method: string | null
          check_out_time: string | null
          created_at: string | null
          duration_minutes: number | null
          host_notified_at: string | null
          id: string
          kiosk_id: string | null
          location: string | null
          member_id: string | null
          pass_id: string | null
          song_added: string | null
          status: string | null
          visitor_name: string | null
          welcome_message: string | null
        }
        Insert: {
          check_in_method: string
          check_in_time: string
          check_out_method?: string | null
          check_out_time?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          host_notified_at?: string | null
          id?: string
          kiosk_id?: string | null
          location?: string | null
          member_id?: string | null
          pass_id?: string | null
          song_added?: string | null
          status?: string | null
          visitor_name?: string | null
          welcome_message?: string | null
        }
        Update: {
          check_in_method?: string
          check_in_time?: string
          check_out_method?: string | null
          check_out_time?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          host_notified_at?: string | null
          id?: string
          kiosk_id?: string | null
          location?: string | null
          member_id?: string | null
          pass_id?: string | null
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
          {
            foreignKeyName: "check_ins_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "passes"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          company: string | null
          created_at: string | null
          current_streak: number | null
          email: string
          id: string
          last_check_in: string | null
          longest_streak: number | null
          name: string
          phone: string | null
          photo_url: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          current_streak?: number | null
          email: string
          id?: string
          last_check_in?: string | null
          longest_streak?: number | null
          name: string
          phone?: string | null
          photo_url?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          current_streak?: number | null
          email?: string
          id?: string
          last_check_in?: string | null
          longest_streak?: number | null
          name?: string
          phone?: string | null
          photo_url?: string | null
        }
        Relationships: []
      }
      passes: {
        Row: {
          apple_pass_serial: string | null
          created_at: string | null
          expires_at: string
          google_pass_id: string | null
          host_email: string | null
          host_name: string | null
          id: string
          meeting_room: string | null
          member_id: string | null
          pass_code: string
          purpose: string | null
          qr_payload: Json | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          used_at: string | null
          visitor_company: string | null
          visitor_email: string
          visitor_name: string
        }
        Insert: {
          apple_pass_serial?: string | null
          created_at?: string | null
          expires_at: string
          google_pass_id?: string | null
          host_email?: string | null
          host_name?: string | null
          id?: string
          meeting_room?: string | null
          member_id?: string | null
          pass_code: string
          purpose?: string | null
          qr_payload?: Json | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          used_at?: string | null
          visitor_company?: string | null
          visitor_email: string
          visitor_name: string
        }
        Update: {
          apple_pass_serial?: string | null
          created_at?: string | null
          expires_at?: string
          google_pass_id?: string | null
          host_email?: string | null
          host_name?: string | null
          id?: string
          meeting_room?: string | null
          member_id?: string | null
          pass_code?: string
          purpose?: string | null
          qr_payload?: Json | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          used_at?: string | null
          visitor_company?: string | null
          visitor_email?: string
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "passes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
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
