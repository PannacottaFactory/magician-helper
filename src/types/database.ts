// Database types. Regenerate after each migration with:
//   npx supabase gen types typescript --linked --schema public > src/types/database.ts
// (hand-written for Phase 1 so the project builds before Supabase is linked)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          currency: string
          theme: string
          stale_trick_days: number
          trial_ends_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          currency?: string
          theme?: string
          stale_trick_days?: number
        }
        Update: {
          display_name?: string | null
          currency?: string
          theme?: string
          stale_trick_days?: number
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      has_write_access: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
