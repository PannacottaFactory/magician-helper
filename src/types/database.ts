export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          company: string | null
          contact_link: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_link?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          company?: string | null
          contact_link?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gig_checklist_items: {
        Row: {
          created_at: string
          gig_id: string
          id: string
          is_checked: boolean
          item_id: string | null
          label: string
          position: number
          quantity_needed: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gig_id: string
          id?: string
          is_checked?: boolean
          item_id?: string | null
          label: string
          position?: number
          quantity_needed?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          gig_id?: string
          id?: string
          is_checked?: boolean
          item_id?: string | null
          label?: string
          position?: number
          quantity_needed?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_checklist_items_gig_id_user_id_fkey"
            columns: ["gig_id", "user_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gig_checklist_items_gig_id_user_id_fkey"
            columns: ["gig_id", "user_id"]
            isOneToOne: false
            referencedRelation: "gigs_overview"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gig_checklist_items_item_id_user_id_fkey"
            columns: ["item_id", "user_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gig_checklist_items_item_id_user_id_fkey"
            columns: ["item_id", "user_id"]
            isOneToOne: false
            referencedRelation: "inventory_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      gig_routines: {
        Row: {
          created_at: string
          gig_id: string
          id: string
          position: number
          routine_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gig_id: string
          id?: string
          position?: number
          routine_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          gig_id?: string
          id?: string
          position?: number
          routine_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_routines_gig_id_user_id_fkey"
            columns: ["gig_id", "user_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gig_routines_gig_id_user_id_fkey"
            columns: ["gig_id", "user_id"]
            isOneToOne: false
            referencedRelation: "gigs_overview"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gig_routines_routine_id_user_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gig_routines_routine_id_user_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      gigs: {
        Row: {
          client_id: string | null
          created_at: string
          currency: string
          deposit_amount: number | null
          ends_at: string | null
          event_type: string | null
          fee: number | null
          id: string
          location: string | null
          notes: string | null
          payment_status: string
          starts_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          ends_at?: string | null
          event_type?: string | null
          fee?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          payment_status?: string
          starts_at: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          currency?: string
          deposit_amount?: number | null
          ends_at?: string | null
          event_type?: string | null
          fee?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          payment_status?: string
          starts_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_client_id_user_id_fkey"
            columns: ["client_id", "user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gigs_client_id_user_id_fkey"
            columns: ["client_id", "user_id"]
            isOneToOne: false
            referencedRelation: "clients_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ideas: {
        Row: {
          content: string | null
          created_at: string
          id: string
          tags: string[]
          title: string
          trick_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          tags?: string[]
          title: string
          trick_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          tags?: string[]
          title?: string
          trick_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "ideas_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      inventory_files: {
        Row: {
          created_at: string
          file_name: string
          id: string
          item_id: string
          kind: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          item_id: string
          kind: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          item_id?: string
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_files_item_id_user_id_fkey"
            columns: ["item_id", "user_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "inventory_files_item_id_user_id_fkey"
            columns: ["item_id", "user_id"]
            isOneToOne: false
            referencedRelation: "inventory_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          buy_link: string | null
          catalog_key: string | null
          cost: number | null
          created_at: string
          id: string
          item_name: string
          low_stock_threshold: number
          notes: string | null
          quantity: number
          stock_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_link?: string | null
          catalog_key?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          item_name: string
          low_stock_threshold?: number
          notes?: string | null
          quantity?: number
          stock_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          buy_link?: string | null
          catalog_key?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          item_name?: string
          low_stock_threshold?: number
          notes?: string | null
          quantity?: number
          stock_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_logs: {
        Row: {
          created_at: string
          id: string
          notes_and_flaws_to_fix: string | null
          practiced_on: string
          routine_id: string | null
          self_rating: number | null
          status: string
          time_spent_min: number | null
          title: string
          trick_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes_and_flaws_to_fix?: string | null
          practiced_on?: string
          routine_id?: string | null
          self_rating?: number | null
          status?: string
          time_spent_min?: number | null
          title: string
          trick_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes_and_flaws_to_fix?: string | null
          practiced_on?: string
          routine_id?: string | null
          self_rating?: number | null
          status?: string
          time_spent_min?: number | null
          title?: string
          trick_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_logs_routine_id_user_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "practice_logs_routine_id_user_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines_overview"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "practice_logs_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "practice_logs_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          display_name: string | null
          id: string
          stale_trick_days: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          theme: string
          trial_ends_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          display_name?: string | null
          id: string
          stale_trick_days?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          theme?: string
          trial_ends_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          display_name?: string | null
          id?: string
          stale_trick_days?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          theme?: string
          trial_ends_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      routine_tricks: {
        Row: {
          created_at: string
          id: string
          position: number
          routine_id: string
          transition_notes: string | null
          trick_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          routine_id: string
          transition_notes?: string | null
          trick_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          routine_id?: string
          transition_notes?: string | null
          trick_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_tricks_routine_id_user_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "routine_tricks_routine_id_user_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines_overview"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "routine_tricks_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "routine_tricks_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      routines: {
        Row: {
          audience_types: string[]
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience_types?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          audience_types?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trick_props: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          quantity_needed: number
          trick_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          quantity_needed?: number
          trick_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity_needed?: number
          trick_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trick_props_item_id_user_id_fkey"
            columns: ["item_id", "user_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "trick_props_item_id_user_id_fkey"
            columns: ["item_id", "user_id"]
            isOneToOne: false
            referencedRelation: "inventory_overview"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "trick_props_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "trick_props_trick_id_user_id_fkey"
            columns: ["trick_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tricks_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      tricks: {
        Row: {
          categories: string[]
          created_at: string
          difficulty: number | null
          duration_min: number | null
          effect: string | null
          id: string
          name: string
          notes: string | null
          other_props: string | null
          references_text: string | null
          secret_and_setup: string | null
          status: string
          tags: string[]
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          categories?: string[]
          created_at?: string
          difficulty?: number | null
          duration_min?: number | null
          effect?: string | null
          id?: string
          name: string
          notes?: string | null
          other_props?: string | null
          references_text?: string | null
          secret_and_setup?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Update: {
          categories?: string[]
          created_at?: string
          difficulty?: number | null
          duration_min?: number | null
          effect?: string | null
          id?: string
          name?: string
          notes?: string | null
          other_props?: string | null
          references_text?: string | null
          secret_and_setup?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      clients_overview: {
        Row: {
          company: string | null
          contact_link: string | null
          created_at: string | null
          email: string | null
          gig_count: number | null
          id: string | null
          last_gig_at: string | null
          name: string | null
          next_gig_at: string | null
          notes: string | null
          phone: string | null
          total_fees: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      gigs_overview: {
        Row: {
          amount_received: number | null
          checklist_done: number | null
          checklist_total: number | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          deposit_amount: number | null
          ends_at: string | null
          event_type: string | null
          fee: number | null
          has_stock_alert: boolean | null
          id: string | null
          location: string | null
          notes: string | null
          payment_status: string | null
          routine_count: number | null
          starts_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gigs_client_id_user_id_fkey"
            columns: ["client_id", "user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "gigs_client_id_user_id_fkey"
            columns: ["client_id", "user_id"]
            isOneToOne: false
            referencedRelation: "clients_overview"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      inventory_overview: {
        Row: {
          buy_link: string | null
          catalog_key: string | null
          cost: number | null
          created_at: string | null
          id: string | null
          item_name: string | null
          low_stock_threshold: number | null
          notes: string | null
          quantity: number | null
          stock_status: string | null
          trick_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          buy_link?: string | null
          catalog_key?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string | null
          item_name?: string | null
          low_stock_threshold?: number | null
          notes?: string | null
          quantity?: number | null
          stock_status?: string | null
          trick_count?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          buy_link?: string | null
          catalog_key?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string | null
          item_name?: string | null
          low_stock_threshold?: number | null
          notes?: string | null
          quantity?: number | null
          stock_status?: string | null
          trick_count?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      routine_props: {
        Row: {
          catalog_key: string | null
          item_id: string | null
          item_name: string | null
          quantity: number | null
          quantity_needed: number | null
          routine_id: string | null
          stock_status: string | null
          used_by_tricks: string[] | null
        }
        Relationships: []
      }
      routines_overview: {
        Row: {
          audience_types: string[] | null
          avg_difficulty: number | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          not_ready_count: number | null
          status: string | null
          total_duration_min: number | null
          trick_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      tricks_overview: {
        Row: {
          categories: string[] | null
          created_at: string | null
          difficulty: number | null
          duration_min: number | null
          effect: string | null
          id: string | null
          last_practiced: string | null
          name: string | null
          notes: string | null
          other_props: string | null
          practice_minutes: number | null
          practice_sessions: number | null
          references_text: string | null
          routine_count: number | null
          secret_and_setup: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_trick_to_routine: {
        Args: { p_routine_id: string; p_trick_id: string }
        Returns: string
      }
      apply_owner_policies: { Args: { tbl: unknown }; Returns: undefined }
      convert_idea_to_trick: { Args: { p_idea_id: string }; Returns: string }
      has_write_access: { Args: never; Returns: boolean }
      reorder_routine_tricks: {
        Args: { p_ids: string[]; p_routine_id: string }
        Returns: undefined
      }
      search_all: {
        Args: { per_kind?: number; q: string }
        Returns: {
          id: string
          kind: string
          subtitle: string
          title: string
        }[]
      }
      sync_gig_checklist: { Args: { p_gig_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
