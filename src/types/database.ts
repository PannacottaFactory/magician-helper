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
      inventory_overview: {
        Row: {
          buy_link: string | null
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
    }
    Functions: {
      apply_owner_policies: { Args: { tbl: unknown }; Returns: undefined }
      convert_idea_to_trick: { Args: { p_idea_id: string }; Returns: string }
      has_write_access: { Args: never; Returns: boolean }
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
